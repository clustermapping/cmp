var d3 = require('d3'),
    mf = d3.format('.4s'),
    msf = d3.format('07.3f'),
    sf = d3.format('05d'),
    fs = require('fs'),
    zlib = require('zlib'),
    naics = require('./naics_mapper'),
    shape = require('./shape_mapper'),
    area = require('./area_mapper'),
    zips = require('./zip_mapper'),
    ibrcVars = require('./ibrc_meta_mapper'),
    ibrc = require('./ibrc_mapper'),
    cluster = require('./cluster_mapper'),
    related = require('./related_cluster_mapper'),
    aggregate = require('./aggregate_mapper'),
    clusterCalcs = require('./cluster_calcs_mapper'),
    aggregateCalcs = require('./aggregate_calcs_mapper'),
    dataByYear = require('./dataByYear_mapper'),
    placeholders = require('./create_placeholders'),
    router = require('./type_router'),
    areaReducer = require('./area_reducer'),
    zipReducer = require('./zip_reducer'),
    clusterReducer = require('./cluster_reducer'),
    relatedReducer = require('./related_cluster_reducer'),
    naicsReducer = require('./naics_reducer'),
    ibrcReducer = require('./ibrc_reducer'),
    aggregateReducer = require('./aggregate_reducer'),
    clusterCalcsReducer = require('./cluster_calcs_reducer'),
    ranker = require('./ranker'),
    fortune1000mapper = require('./fortune1000'),
    patentCompanyMapper = require('./patent_company_mapper'),
    patentCompanyReducer = require('./patent_company_reducer'),
    patentClusterMapper = require('./patent_cluster_mapper'),
    patentClusterReducer = require('./patent_cluster_reducer'),
    cache = require('./simple_cache_persister'),
    shapefile = require('./processor_shapefile'),
    pipeFile = require('./processor_pipe_file'),
    fromCache = require('./processor_from_cache'),
    csv = require('./processor_csv'),
    dataDict = require('../web/datadict'),
    http = require('http');


var dataDir = process.argv[2];
var outputDir = process.argv[3] || 'output';
var regions = { 'state': 'shapes/State_2010Census_DP1.shp', 'county': 'shapes/County_2010Census_DP1.shp' };
var areas = { 'economic': 'areas/eas.csv', 'msa': 'areas/msas.csv' };
var zcta = 'zcta/zcta_county_rel_10.txt';
var clusters = 'clusters/clusters2017.csv';
var related_clusters = 'clusters/related.csv';
var ibrcMeta = 'ibrc/meta_data.csv';
var ibrcState = 'ibrc/state_data.csv';
var ibrcCounty = 'ibrc/county_data.csv';
var otherMeta = 'other/other_metaData.csv';
var otherState = 'other/other_state_data.csv';
var fortune1000 = 'other/fortune1000.csv';
var overridesFile = 'other/overrides.csv';
var patentCompanyFile = 'other/Patents_county_year_company.csv';
var patentClusterFile = 'other/Patents_county_year_cluster.csv';
var cbp_years = [1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018];
var cbp_data_types = { 'country': 'us', 'state': 'st', 'county': 'co', 'msa': 'msa' };

var countries = [
    {
        id: 'region/country/98',
        type_t: 'region',
        region_type_t: 'country',
        region_code_t: '98',
        abbr_t: 'US',
        name_t: 'United States',
        region_name_t: 'United States',
        key_t: 'united_states'
    },
    {
        id: 'region/country/484',
        type_t: 'region',
        region_type_t: 'country',
        region_code_t: '484',
        abbr_t: 'MX',
        name_t: 'Mexico',
        region_name_t: 'Mexico',
        key_t: 'mexico'
    },
    {
        id: 'region/country/124',
        type_t: 'region',
        region_type_t: 'country',
        region_code_t: '124',
        abbr_t: 'CA',
        name_t: 'Canada',
        region_name_t: 'Canada',
        key_t: 'canada'
    }
];

var reverseRegionLookup = function (r) {
    var result = [];
    if (r.regions_txt) {
        result = result.concat(r.regions_txt);
    }
    return result;
};
var reverseNaicsLookup = function (c) {
    var result = [];
    c.naics_2017_codes_txt.forEach(function (n) {
        result.push('2017/' + n);
    });
    c.naics_2012_codes_txt.forEach(function (n) {
        result.push('2012/' + n);
    });
    c.naics_2007_codes_txt.forEach(function (n) {
        result.push('2007/' + n);
    });
    c.naics_2002_codes_txt.forEach(function (n) {
        result.push('2002/' + n);
    });
    c.naics_1997_codes_txt.forEach(function (n) {
        result.push('1997/' + n);
    });
    return result;
};
var dataFile = function (file) {
    return dataDir + '/' + file;
};
var outFile = function (file) {
    return outputDir + '/' + file;
};

var sendToFile = function (file) {
    return function (cache, clear, cb) {
        //var zip = zlib.createGzip();
        var stream = fs.createWriteStream(file, { flags: 'a' });
        //stream.write
        //zip.pipe(fs.createWriteStream(file+'.gz'));
        //cache.writeToStream(zip, clear, cb);
        cache.writeToStream(stream, clear, cb);
    }
};

var region_cache = cache('regions', reverseRegionLookup);
var states = shape('state', { excluded: ['11'], type_exceptions: { '72': 'territory' } });

var clusters_cache = cache('clusters', reverseNaicsLookup);
countries.forEach(function (c) {
    region_cache.persist(c);
});

var ibrc_vars = cache('ibrc_vars');
var other_vars = cache('other_vars');
var overrides = cache('overrides');
var overridesMapper = {
    getId: function (row) {
        return row.Year + '/' + row.NAICS;
    },
    transform: function (row, i, id) {
        return {
            id: id,
            emp: +row.emp
        };
    }
};

var processors = [];
processors.push(['states', shapefile(states, region_cache), dataFile(regions['state'])]);
processors.push(['counties', shapefile(shape('county', { excluded: ['11'], type_exceptions: { '72': 'territory' }, region_data: region_cache }), region_cache), dataFile(regions['county'])]);
processors.push(['eas', csv(area('economic'), areaReducer(region_cache)), dataFile(areas['economic'])]);
processors.push(['msas', csv(area('msa'), areaReducer(region_cache)), dataFile(areas['msa'])]);
processors.push(['custom', csv(area('custom'), areaReducer(region_cache)), dataFile(areas['custom'])]);
processors.push(['zips', csv(zips({ excluded_states: ['72'] }), zipReducer(region_cache)), dataFile(zcta)]);
processors.push(['ibrc_vars', pipeFile(ibrcVars(), ibrc_vars), dataFile(ibrcMeta)]);
processors.push(['other_vars', pipeFile(ibrcVars(), other_vars), dataFile(otherMeta)]);
processors.push(['cluster_mappings', csv(cluster(), clusterReducer(clusters_cache)), dataFile(clusters)]);
processors.push(['related_clusters', csv(related(), relatedReducer(clusters_cache)), dataFile(related_clusters)]);
processors.push(['overrides', csv(overridesMapper, overrides), dataFile(overridesFile)]);
processors.push(['write_regions', sendToFile(outFile('region.json')), [region_cache, false]]);
processors.push(['write_clusters', sendToFile(outFile('clusterData.json')), [clusters_cache, false]]);

cbp_years = cbp_years.sort();
var lookupByType = function (r) {
    var rid = r.base_type_t;
    if (rid == 'cluster') {
        rid += '/' + r.cluster_code_t;
        if (r.subcluster_b) {
            rid += '/' + r.sub_code_t;
        }
    }
    return [rid];
};

var earliestCache = cache('earliest', lookupByType);
var reverseClusterLookup = function (r) {
    return ['clusterData/' + r.cluster_code_t + (r.subcluster_b ? '/' + r.sub_code_t : '')];
};

cbp_years.forEach(function (year) {
    var context = {};
    context.data_cache = cache('data-' + year, reverseClusterLookup);
    context.naics_cache = cache('naics-' + year);
    context.aggregate_cache = cache('aggregates-' + year);
    context.reducer = naicsReducer(context.data_cache, context.naics_cache, clusters_cache, region_cache, overrides);
    context.aggregateReducer = aggregateReducer(context.aggregate_cache, context.naics_cache);
    context.ibrcMapper = ibrc(year, ibrc_vars, { 'state/72': 'territory/72', 'state/66': 'territory/66', 'state/11': 'county/11001' });
    context.ibrcReducer = ibrcReducer(context.aggregate_cache, region_cache);
    context.clusterCalcsMapper = clusterCalcs(year, clusters_cache, context.data_cache, context.aggregate_cache);
    context.clusterCalcsReducer = clusterCalcsReducer(context.data_cache);
    context.fortune1000 = fortune1000mapper(context.aggregate_cache);
    context.patentsClusterMapper = patentClusterMapper(year);
    context.patentsClusterReducer = patentClusterReducer(context.data_cache, region_cache);
    context.patentsCompanyMapper = patentCompanyMapper(year);
    context.patentsCompanyReducer = patentCompanyReducer(context.aggregate_cache, region_cache);

    processors.push(['create_records_' + year, fromCache(placeholders(year, clusters_cache), router(context.data_cache, context.aggregate_cache)), region_cache]);
    Object.keys(cbp_data_types).forEach(function (type) {
        var file = dataFile('cbp/' + year + '/cbp' + year.toString().substring(2, 4) + cbp_data_types[type] + '.txt'),
            mapper = naics(year, type);
        if (fs.existsSync(file)) {
            processors.push(['cbp_' + year + '_' + type, csv(mapper, context.reducer), file]);
        }
    });
    processors.push(['aggregates_' + year, fromCache(aggregate(region_cache), context.aggregateReducer), context.data_cache]);
    processors.push(['IBRC_state_' + year, pipeFile(context.ibrcMapper, context.ibrcReducer), dataFile(ibrcState)]);
    processors.push(['IBRC_County_' + year, pipeFile(context.ibrcMapper, context.ibrcReducer), dataFile(ibrcCounty)]);
    processors.push(['Other_state_' + year, csv(context.ibrcMapper, context.ibrcReducer), dataFile(otherState)]);
    processors.push(['Fortune1000_' + year, csv(context.fortune1000, context.aggregate_cache), dataFile(fortune1000)]);
    processors.push(['Patents_Clusters_' + year, csv(context.patentsClusterMapper, context.patentsClusterReducer), dataFile(patentClusterFile)]);
    processors.push(['Patents_Companies_' + year, csv(context.patentsCompanyMapper, context.patentsCompanyReducer), dataFile(patentCompanyFile)]);

    processors.push(['cluster_calcs_' + year, fromCache(context.clusterCalcsMapper, context.clusterCalcsReducer), context.data_cache]);
    processors.push(['aggregate_calcs_' + year, fromCache(aggregateCalcs(clusters_cache, context.data_cache), context.aggregate_cache), context.aggregate_cache]);
    processors.push(['earliest_clusters_' + year, fromCache(dataByYear(dataDict, earliestCache), earliestCache), context.data_cache]);
    processors.push(['earliest_aggregates_' + year, fromCache(dataByYear(dataDict, earliestCache), earliestCache), context.aggregate_cache]);

    processors.push(['cluster_ranks_' + year, function (cb) {
        fromCache(ranker(context.data_cache, earliestCache, dataDict, ['cluster']), context.data_cache).run(clusters_cache, cb);
    }]);


    processors.push(['aggregates_ranks_' + year, function (cb) {
        ranker(context.aggregate_cache, earliestCache, dataDict, ['cluster', 'performance', 'business', 'structure'])
            .rankData(context.aggregate_cache.data(), (earliestCache ? earliestCache.getRev('aggregate') : undefined));
        process.nextTick(cb);
    }]);

    processors.push(['write_naics_' + year, sendToFile(outFile(year + '-naics.json')), [context.naics_cache, true]]);
    processors.push(['write_aggregates_' + year, sendToFile(outFile(year + '-aggregates.json')), [context.aggregate_cache, true]]);
    processors.push(['write_clusters_' + year, sendToFile(outFile(year + '-clusters.json')), [context.data_cache, true]]);

    processors.push(['clear_memory_' + year, function (cb) {
        delete context.reducer;
        delete context.data_cache;
        delete context.aggregate_cache;
        delete context.naics_cache;
        delete context.ibrcMapper;
        delete context.ibrcReducer;
        delete context.clusterCalcsMapper;
        delete context.clusterCalcsReducer;
        delete context.aggregateReducer;
        console.log('earliest set: ', earliestCache.data().length);
        process.nextTick(cb);
    }]);
});
//processors.push(['write_earliest', sendToFile(outFile('earliest.json')), [earliestCache, true]]);

var run_times = [];
var start = process.hrtime();
var elapsed_time = function (note) {
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
    console.log(sf(process.hrtime(start)[0]) + "s, " + msf(elapsed) + "ms - " + note); // print message + time
    run_times.push(sf(process.hrtime(start)[0]) + "s, " + msf(elapsed) + "ms - " + note);
    start = process.hrtime(); // reset the timer
};

var index = 0, count = processors.length;
function run() {
    var p = processors.shift(),
        isArray = Array.isArray(p),
        name = isArray ? p[0] : p.name,
        proc = isArray ? p[1] : p,
        args = isArray ? p[2] || [] : [],
        target = p[3] || null,
        prefix = '[' + (index + 1) + '/' + count + ']',
        mem,
        cb = function () {
            proc = null;
            if (global && global.gc) {
                global.gc();
            }
            mem = process.memoryUsage();
            elapsed_time(prefix + " --- " + name + " finished (" + mf(mem.heapUsed) + ")");
            if (processors.length > 0) {
                run();
            } else {
                console.log("No more processors, Finished");
                run_times.forEach(function (n) {
                    console.log(n);
                });
                process.exit(1);
            }
        };
    index++;
    if (!Array.isArray(args)) args = [args];
    args.push(cb);
    elapsed_time(prefix + " --- " + name + " started");

    if (proc.run) {
        proc.run.apply(proc, args);
    } else {
        proc.apply(target, args);
    }
}
run();

// PR?
