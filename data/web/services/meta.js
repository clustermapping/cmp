"use strict";
var solr = require('solr-client'),
    Q = require('q'),
    _ = require('underscore'),
    dict = require('../datadict'),
    port, base, baseUrl, prefix;

function facetKeys(fieldName) {
  return function(result) {
    // filter out year entries with 0 employees
    var ret = result.facet_counts.facet_fields[fieldName];
    if (fieldName === 'year_t') {
        ret = Object.keys(ret).filter(function(key){return ret[key] > 0});
    }
    //return Object.keys(result.facet_counts.facet_fields[fieldName]);
    return ret;
  };
}

function extractDocs(mapFunc) {
  return function(result) {
    var r = result.response.docs;
    if (mapFunc) {
      r =  r.map(mapFunc);
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
  client.search(query, function(err, result) {
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

function facetForType(client, docType, facetField) {
  //var query = client.createQuery().q({type_t: docType}).facet({field: facetField}).rows(1).set('json.nl=map');
  // Add filter to filter out years with 0 employees (this adds the employee count to the result)
  var query = client.createQuery().q({type_t: docType}).set('fq=-emp_tl:0').facet({field: facetField}).rows(0).set('json.nl=map');
  return deferQuery(client, query, facetKeys(facetField));
}

function loadRegionTypes(client) {
  return facetForType(client, 'region', 'region_type_t');
}

function loadYears(client) {
  return facetForType(client, 'aggregate', 'year_t');
}

function loadIndicators(client, req, res) {
  var p = req.params,
    indicator = p.indicator;
  if (indicator == 'specialization_tl') indicator = 'emp_tl';
  var pivot = 'region_type_t,year_t',
    type = Number(p.cluster) > 0 ? 'cluster' : 'aggregate',
    q = 'type_t:' + type + ' AND ' + indicator + ':* AND NOT ' + indicator + ':0';
  if (Number(p.cluster) > 0) q += ' AND cluster_code_t:' + p.cluster;
  if (Number(p.subcluster) > 0) q += ' AND sub_code_t:' + p.subcluster;
  var query = 'q=' + encodeURIComponent(q) + '&wt=json&indent=true&facet=true&facet.pivot=' + pivot + '&rows=0';
  return deferQuery(client, query)
    .then(function(result) {
      var regionYears = {};
      result.facet_counts.facet_pivot[pivot].forEach(function(r) {
        regionYears[r.value] = {};
        r.pivot.forEach(function(y) {
          regionYears[r.value][y.value] = y.count;
        });
      });
      return regionYears;
    })
}

function cleanCluster(item) {
  item.sub_clusters = _.object(item.sub_code_txt, item.sub_name_txt);
  delete(item.sub_code_txt);
  delete(item.sub_name_txt);
  item.naics_2012 = _.object(item.naics_2012_codes_txt, item.naics_2012_labels_txt);
  delete(item.naics_2012_codes_txt);
  delete(item.naics_2012_labels_txt);
  item.naics_2007 = _.object(item.naics_2007_codes_txt, item.naics_2007_labels_txt);
  delete(item.naics_2007_codes_txt);
  delete(item.naics_2007_labels_txt);
  item.naics_2002 = _.object(item.naics_2002_codes_txt, item.naics_2002_labels_txt);
  delete(item.naics_2002_codes_txt);
  delete(item.naics_2002_labels_txt);
  item.naics_1997 = _.object(item.naics_1997_codes_txt, item.naics_1997_labels_txt);
  delete(item.naics_1997_codes_txt);
  delete(item.naics_1997_labels_txt);
  if (item.related_cluster_codes_txt) {
    item.related_clusters = [];
    for (var i = 0; i < item.related_cluster_codes_txt.length; i++) {
      item.related_clusters.push({
        cluster_code_t: item.related_cluster_codes_txt[i],
        cluster_name_t: item.related_cluster_names_txt[i],
        related_90: item.related_cluster_90_txt[i],
        related_i20_90: item.related_cluster_i20_90_txt[i],
        related_i20_90_min: item.related_cluster_i20_90_min_txt[i],
        related_percentage: item.related_cluster_percentage_txt[i],
        related_avg: item.related_cluster_avg_txt[i],
        related_min: item.related_cluster_min_txt[i]
      });
    }
  }
  delete(item.related_cluster_codes_txt);
  delete(item.related_cluster_names_txt);
  delete(item.related_cluster_90_txt);
  delete(item.related_cluster_i20_90_txt);
  delete(item.related_cluster_i20_90_min_txt);
  delete(item.related_cluster_percentage_txt);
  delete(item.related_cluster_avg_txt);
  delete(item.related_cluster_min_txt);
  return item;
}

function loadClusters(client, withSub) {
  var q = {type_t: 'clusterData'};
  if (!withSub) {
    q.subcluster_b = false;
  }
  var query = client.createQuery().q(q).sort({name_t: 'ASC'}).rows(10000);
  return deferQuery(client, query, extractDocs(cleanCluster));
}

function loadClustersNoSubs(client) {
  return loadClusters(client, false);
}

function loadCluster(client, req) {
  var clusterCode = req.params.id,
    q = {type_t: 'clusterData', subcluster_b:false},
    query = client.createQuery().rows(10000);
  if (isNaN(+clusterCode)) {
    q.key_t = clusterCode;
  } else {
    q.cluster_code_t = clusterCode;
  }
  query.q(q);
  return deferQuery(client, query, extractDocs(cleanCluster));
}

function loadSubclusterMappings(client, req) {
  var clusterCode = req.params.id,
      subClusterCode = req.params.sub,
      q = {type_t: 'clusterData'},
      query = client.createQuery().rows(10000);

  if(!isNaN(+clusterCode)){
    q.cluster_code_t = clusterCode;
  }else{
    q.parent_key_t = clusterCode;
  }

  if(isNaN(+subClusterCode)){
    q.key_t = subClusterCode;
  }else{
    q.sub_code_t = subClusterCode;
  }

  query.q(q);
  return deferQuery(client, query, extractDocs());
}

function loadRegionsByType(client, req) {
  var regionType = req.params.type,
      query = client.createQuery().q({type_t: 'region', region_type_t:regionType}).rows(10000);
  return deferQuery(client, query, extractDocs());
}

function apiRoot(req, res, next) {
  var result = {
    meta: prefix + '/meta',
    region: prefix + '/region',
    cluster: prefix + '/cluster',
  };
  res.send(result);
  return next();
}

function loadAll(client) {
  var meta = {dict: dict};
  return loadRegionTypes(client)
    .then(function(regionTypes) {
      meta.region_types = regionTypes;
      return loadYears(client);
    })
    .then(function(years) {
      meta.years = years;
      return loadClusters(client, false);
    })
    .then(function(clusters) {
      meta.clusters = clusters;
      return meta;
    });
}

function handleWith(f, client) {
  return function (req, res, next) {
    f(client, req)
      .then(function(r) {
        res.send(r);
      });
    return next();
  };
}

module.exports = function meta_server(server, config) {
  var client = solr.createClient(config.solr),
      meta = {};
  port = config.port || 4000;
  base = config.base || '';
  baseUrl = config.baseUrl || 'localhost';
  prefix = 'http://' + baseUrl + (base || ':' + port);
  server.get('/', apiRoot);
  server.get('/meta', handleWith(loadAll, client));
  server.get('/meta/regions', handleWith(loadRegionTypes, client));
  server.get('/meta/regions/:type', handleWith(loadRegionsByType, client));
  server.get('/meta/years', handleWith(loadYears, client));
  server.get('/meta/indicator/:indicator', handleWith(loadIndicators, client));
  server.get('/meta/indicator/:indicator/:cluster', handleWith(loadIndicators, client));
  server.get('/meta/indicator/:indicator/:cluster/:subcluster', handleWith(loadIndicators, client));
  server.get('/meta/clusters', handleWith(loadClustersNoSubs, client));
  server.get('/meta/cluster/:id', handleWith(loadCluster, client));
  server.get('/meta/cluster/:id/:sub', handleWith(loadSubclusterMappings, client));
  server.get('/meta/dict', function (req, res, next) {
    res.send(dict);
    return next();
  });
};
