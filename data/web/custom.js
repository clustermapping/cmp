var env = process.env.NODE_ENV || 'production',
    config = require('./config')[env],
    solr = require('solr-client'),
    Q = require('q'),
    naics = require('../processing/naics_mapper'),
    naicsReducer = require('../processing/naics_reducer'),
    aggregate = require('../processing/aggregate_mapper'),
    aggregateReducer = require('../processing/aggregate_reducer'),
    clusterCalcs = require('../processing/cluster_calcs_mapper'),
    clusterCalcsReducer = require('../processing/cluster_calcs_reducer'),
    aggregateCalcs = require('../processing/aggregate_calcs_mapper'),
    dataByYear = require('../processing/dataByYear_mapper'),
    ranker = require('../processing/ranker'),
    cache = require('../processing/simple_cache_persister'),
    fromCache = require('../processing/processor_from_cache'),
    processor_base = require('../processing/processor'),
    dataDict = require('./datadict');


function keyName(str) {
    return str.replace(/[\(\)\*&,'":;\/\.]/g, '') // remove bad chars
        .replace(/[\- ]/g, '_') // remove spaces and dashes -> underscore
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2') //camel case -> snake case
        .replace(/__+/, '_') // multiple underscores get collapsed
        .replace(/_$/, '') // remove trailing underscores
        .toLowerCase(); // to lower case
}

function facetKeys(fieldName) {
    return function (result) {
        return Object.keys(result.facet_counts.facet_fields[fieldName]);
    };
}
function extractDocs(mapFunc) {
    return function (result) {
        var r = result.response.docs;
        if (mapFunc) {
            r = r.map(mapFunc);
        }

        if (r.length === 1) {
            return r[0];
        } else {
            return r;
        }
    };
}
function deferQuery(client, query, processFunc) {
    var deferred = Q.defer();
    client.search(query, function (err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            if (processFunc) {
                deferred.resolve(processFunc(result));
            } else {
                deferred.resolve(result);
            }
        }
    });
    return deferred.promise;
}

function loadClusters(client, withSub) {
    var q = { type_t: 'clusterData' };
    if (!withSub) {
        q.subcluster_b = false;
    }
    var query = client.createQuery().q(q).sort({ name_t: 'ASC' }).rows(10000);
    return deferQuery(client, query, extractDocs());
}

function facetForType(client, docType, facetField) {
    var query = client.createQuery().q({ type_t: docType }).facet({ field: facetField }).rows(0).set('json.nl=map');
    return deferQuery(client, query, facetKeys(facetField));
}
function loadYears(client) {
    return facetForType(client, 'aggregate', 'year_t');
}

function fromArray(importer, persister) {
    var processor = processor_base(importer, persister);
    return {
        run: function (cache, cb) {
            processor.start(function () {
                cache.forEach(function (obj, i) {
                    processor.process(obj, i);
                });
                processor.end(cb);
            });
        }
    }
}

function saveClustersAndAggs(client, data_cache, aggregate_cache, cb) {
    var docsToWrite = [];

    data_cache.forEach(function (k, c) {
        if (c.id.indexOf('custom') !== -1) {
            docsToWrite.push(c);
        }
    });

    aggregate_cache.forEach(function (k, a) {
        if (a.id.indexOf('custom') !== -1) {
            docsToWrite.push(a);
        }
    });
    client.add(docsToWrite, function () {
        console.log('added data', docsToWrite.length, 'docs');
        if (cb) cb();
    });
}

function saveRegions(client, region_cache, cb) {
    var docsToWrite = [];
    region_cache.forEach(function (k, r) {
        docsToWrite.push(r);
    });
    client.add(docsToWrite, function () {
        console.log('added regions', docsToWrite.length, 'docs');
        if (cb) cb();
    });
}

function createIbrcReducer(aggregate_cache, customId, year) {
    var _delegate = function (target, action, def) {
        return function () {
            if (target && target[action]) {
                return target[action].apply(aggregate_cache, arguments);
            } else {
                return def;
            }
        }
    },
        goodFields = {};
    return {
        persist: function (data) {
            var agg = aggregate_cache.get('aggregate/custom/' + customId + '/' + year) || {};
            Object.keys(data).forEach(function (k) {
                if (['patent_company_txt', 'patent_company_counts_txt'].indexOf(k) >= 0) {
                    if (!agg[k]) agg[k] = [];
                    agg[k] = agg[k].concat(data[k]);
                }
                if (k.indexOf('_tf') != -1 && k.indexOf('rank') === -1) {
                    if (!agg[k]) {
                        agg[k] = data[k];
                        goodFields[k] = true;
                    } else if (goodFields[k] === true) {
                        agg[k] += data[k];
                    }
                }
            });
        },
        end: _delegate(aggregate_cache, 'end'),
        should_drain: _delegate(aggregate_cache, 'should_drain'),
        drain: _delegate(aggregate_cache, 'drain')
    };
}

function createClustersReducer(cluster_cache, customId, year) {
    var _delegate = function (target, action, def) {
        return function () {
            if (target && target[action]) {
                return target[action].apply(cluster_cache, arguments);
            } else {
                return def;
            }
        }
    };
    return {
        persist: function (countyAgg) {
            // var clusterAgg = cluster_cache.get('cluster/county/' + customId + '/' + year) || {};
            cluster_cache.data().forEach(function (c, i) {
                if (c.region_type_t == 'county' && c.region_code_t == countyAgg.region_code_t && c.year_t == year && c.subcluster_b == false && c.patent_count_tf) {
                    var cluster = cluster_cache.get('cluster/custom/' + customId + '/' + c.cluster_code_t + '/' + year) || {};
                    if (c['patent_count_tf']) {
                        cluster['patent_count_tf'] += +c['patent_count_tf'];
                    }
                }
            });
        },
        end: _delegate(cluster_cache, 'end'),
        should_drain: _delegate(cluster_cache, 'should_drain'),
        drain: _delegate(cluster_cache, 'drain')
    };
}

function loadDataForYear(client, year, counties) {
    var codesQuery = '(' + counties.join(' OR ') + ')',
        usQuery = '(type_t:(aggregate OR cluster) AND region_type_t:country AND region_code_t:98)',
        countyQuery = '(type_t:(naics or aggregate or cluster) AND region_type_t:county AND region_code_t:' + codesQuery + ')',
        fullQuery = 'year_t:' + year + ' AND (' + countyQuery + ' OR ' + usQuery + ')',
        query = client.createQuery().q(fullQuery).rows(1000000);
    return deferQuery(client, query, extractDocs());
}

function loadDataForRanking(client, year) {
    var eaQuery = 'year_t:' + year + ' AND region_type_t:economic AND (type_t:aggregate OR (type_t:cluster AND subcluster_b:false))',
        fields = ['id', 'type_t', 'year_t', 'region_type_t', 'region_code_t', 'cluster_code_t', 'sub_code_t', 'subcluster_b', 'traded_b', 'emp_traded_tl', 'emp_local_tl'].concat(dataKeys),
        query = client.createQuery().q(eaQuery).rows(1000000).fl(fields);
    return function (context) {
        var deferred = Q.defer();
        client.search(query, function (err, result) {
            if (err) {
                deferred.reject(err);
            } else {
                result.response.docs.forEach(function (r) {
                    if (r.type_t === 'aggregate') {
                        context.aggregates.persist(r);
                    } else if (r.type_t === 'cluster') {
                        context.clusters.persist(r);
                    }
                });
                deferred.resolve(context);
            }
        });
        return deferred.promise;
    };
}

function processData(regions, clusterData, year, region) {
    var reverseClusterLookup = function (r) {
        return ['clusterData/' + r.cluster_code_t + (r.subcluster_b ? '/' + r.sub_code_t : '')];
    };
    return function _process_data(results) {
        var data_cache = cache('data-' + year, reverseClusterLookup),
            aggregate_cache = cache('aggregates-' + year),
            context = {
                year: year, region: region, naics: [], clusters: data_cache, aggregates: aggregate_cache,
                counties: [], regions: regions, clusterData: clusterData
            };
        results.forEach(function (r) {
            if (r.type_t === 'naics') {
                context.naics.push(r);
            } else if (r.type_t === 'aggregate') {
                if (r.region_type_t !== 'county') {
                    context.aggregates.persist(r);
                } else {
                    context.counties.push(r);
                }
            } else if (r.type_t === 'cluster') {
                context.clusters.persist(r);
            }
        });
        return Q(context);
    }
}

var noOpMapper = { transform: function (row) { return row; } };

function defer(proc, args, context) {
    var deferred = Q.defer(),
        cb = function () {
            deferred.resolve(context);
        };
    if (!Array.isArray(args)) args = [args];
    args.push(cb);
    if (proc.run) {
        proc.run.apply(proc, args);
    } else {
        proc.apply(undefined, args);
    }
    return deferred.promise;
}

function createClusters(context) {
    var reducer = naicsReducer(context.clusters, null, context.clusterData, context.regions);
    return defer(fromArray(noOpMapper, reducer), [context.naics], context);
}

function createAggregates(context) {
    return defer(fromCache(aggregate(context.regions), aggregateReducer(context.aggregates)), [context.clusters], context);
}

function augmentAggregates(context) {
    return defer(fromArray(noOpMapper, createIbrcReducer(context.aggregates, context.region.region_code_t, context.year)), [context.counties], context);
}

function augmentClusters(context) {
    return defer(fromArray(noOpMapper, createClustersReducer(context.clusters, context.region.region_code_t, context.year)), [context.counties], context);
}

function doClusterMapper(context) {
    var mapper = clusterCalcs(context.year, context.clusterData, context.clusters, context.aggregates);
    return defer(fromCache(mapper, context.clusters), [context.clusters], context);
}

function doClusterReduce(context) {
    var reducer = clusterCalcsReducer(context.clusters, ['country', 'economic'], true);
    return defer(fromCache(noOpMapper, reducer), [context.clusters], context);
}

function doAggregateCalcs(context) {
    var mapper = aggregateCalcs(context.clusterData, context.clusters);
    return defer(fromCache(mapper, context.aggregates), [context.aggregates], context);
}

function processEarliestClusters(context) {
    return defer(fromCache(dataByYear(dataDict, earliestCache), earliestCache), context.clusters, context);
}

function processEarliestAggregates(context) {
    return defer(fromCache(dataByYear(dataDict, earliestCache), earliestCache), context.aggregates, context);
}

function rankClusters(context) {
    var mapper = ranker(context.clusters, earliestCache, dataDict, ['cluster'], ['custom']);
    return defer(fromCache(mapper, context.clusters), [context.clusterData], context);
}

function rankAggregates(context) {
    ranker(context.aggregates, earliestCache, dataDict, ['cluster', 'performance', 'business', 'structure'], ['custom'])
        .rankData(context.aggregates.data(), earliestCache.getRev('aggregate'));
    return Q(context);
}

var earliestCache = cache('earliest', function (r) {
    var rid = r.base_type_t;
    if (rid == 'cluster') {
        rid += '/' + r.cluster_code_t;
        if (r.subcluster_b) {
            rid += '/' + r.sub_code_t;
        }
    }
    return [rid];
});

function saveAll(client, callback) {
    return function _save_all(context) {
        saveClustersAndAggs(client, context.clusters, context.aggregates, callback)
    }
}

function processYear(client, counties, region, region_cache, clusters_cache) {
    return function _process_year(year, callback) {
        return loadDataForYear(client, year, counties)
            .then(processData(region_cache, clusters_cache, year, region))
            .then(createClusters)
            .then(createAggregates)
            .then(augmentAggregates)
            .then(augmentClusters)
            .then(doClusterMapper)
            .then(loadDataForRanking(client, year))
            .then(doClusterReduce)
            .then(doAggregateCalcs)
            .then(processEarliestClusters)
            .then(processEarliestAggregates)
            .then(rankClusters)
            .then(rankAggregates)
            .then(saveAll(client, callback));
    }
}

function buildClusterCache(clusters) {
    var reverseNaicsLookup = function (c) {
        var result = [];

        if (c.naics_2017_codes_txt !== undefined) {
            c.naics_2017_codes_txt.forEach(function (n) {
                result.push('2017/' + n);
            });
        }

        if (c.naics_2012_codes_txt !== undefined) {
            c.naics_2012_codes_txt.forEach(function (n) {
                result.push('2012/' + n);
            });
        }

        if (c.naics_2007_codes_txt !== undefined) {
            c.naics_2007_codes_txt.forEach(function (n) {
                result.push('2007/' + n);
            });
        }

        if (c.naics_2002_codes_txt !== undefined) {
            c.naics_2002_codes_txt.forEach(function (n) {
                result.push('2002/' + n);
            });
        }

        if (c.naics_1997_codes_txt !== undefined) {
            c.naics_1997_codes_txt.forEach(function (n) {
                result.push('1997/' + n);
            });
        }
        return result;
    },
        clusters_cache = cache('clusters', reverseNaicsLookup);
    clusters.forEach(function (c) {
        clusters_cache.persist(c);
    });
    return clusters_cache;
}

function getStates(regions) {
    var states = {};
    regions.forEach(function (r) {
        var s = r.match('region\/county\/(..)')[1];
        states[s] = true;
    });
    return Object.keys(states);
}

function buildRegionCache(spec) {
    var reverseRegionLookup = function (r) {
        var result = [];
        if (r.regions_txt) {
            result = result.concat(r.regions_txt);
        }
        return result;
    },
        region_cache = cache('regions', reverseRegionLookup);
    var name = spec.name + ' by ' + spec.owner;
    var id = keyName(name);
    region_cache.persist({
        id: 'region/custom' + '/' + id,
        type_t: 'region',
        region_code_t: id,
        region_type_t: 'custom',
        key_t: id,
        name_t: name,
        region_name_t: name,
        region_short_name_t: name,
        area_type_t: 'custom',
        regions_txt: spec.regions,
        region_count_tl: spec.regions.length,
        state_codes_txt: getStates(spec.regions),
        owner_t: spec.username,
        data_processing_t: false
    });
    return region_cache;
}

function progress(curr, tot) {
    return Math.round((curr / tot) * 100);
}

function status(status, region, progress) {
    var result = { status: status, id: region.id, username: region.owner_t, key: region.key_t };
    if (progress) {
        result.progress = progress;
    }
    return result;
}

function processYears(client, spec, progressFunc) {
    return function _process_years(years, clusters) {
        var clustersCache = buildClusterCache(clusters),
            regionCache = buildRegionCache(spec),
            region = regionCache.data()[0],
            counties = spec.regions.map(function (r) { return r.match('region\/county\/(.*)')[1]; }),
            totalYears = years.length,
            deferred = Q.defer();

        progressFunc(status("progress", region, 0));
        var processFunc = processYear(client, counties, region, regionCache, clustersCache),
            cb = function () {
                var year = years.shift();
                if (year) {
                    progressFunc(status("progress", region, progress(totalYears - years.length, totalYears)));
                    processFunc(year, cb);
                } else {
                    saveRegions(client, regionCache, function () {
                        deferred.resolve(region);
                    });
                }
            };
        cb();
        return deferred.promise;
    };
}

var running = false;
var queue = [];
function createFromSpec(spec, progressFunc, successFunc) {
    running = true;
    var startTime = process.hrtime();
    var client = solr.createClient(config.solr);
    client.autoCommit = true;

    var name = spec.name;
    var n = name.lastIndexOf(" by ");
    if (n > 0) {
        name = name.substring(0, n);
        spec.name = name;
    }

    console.log('CREATE FROM SPEC', spec.name);
    return Q.all([loadYears(client), loadClusters(client, true)])
        .spread(processYears(client, spec, progressFunc))
        .done(function (region) {
            var runTime = process.hrtime(startTime);
            console.log('Run time:', runTime[0], ' secs');
            progressFunc(status("done", region));
            if (queue.length > 0) {
                process.nextTick(function () {
                    var next = queue.shift();
                    createFromSpec(next, progressFunc);
                });
            } else {
                running = false;
                if (typeof successFunc == 'function') {
                    successFunc();
                }
            }
        });
}

var dataKeys, oKeys = {};
dataDict.vars.forEach(function (v) {
    var k = v.range_source || v.key;
    oKeys[k] = 1;
});
dataKeys = Object.keys(oKeys);

process.on('message', function (spec) {
    console.log("spec " + JSON.stringify(spec));
    function _progress_func(status) {
        process.send(status);
        console.log("status " + JSON.stringify(status));
    }
    if (running) {
        queue.push(spec);
        console.log("pushing...queue size:" + queue.length);
    } else {
        createFromSpec(spec, _progress_func);
        console.log("createFromSpec...");
    }
});

process.on('uncaughtException', function (err) {
    running = false;
    console.error(err.message + "\n" + err.stack);
});

console.log('Custom EA creator is running');

module.exports = createFromSpec;
