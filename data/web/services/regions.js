"use strict";
var solr = require('solr-client'),
    Q = require('q'),
    restify = require('restify'),
    _ = require('underscore'),
    cp = require('child_process'),
    protectWithDrupalLogin = require('../lib/session_check');

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

function facetField(fieldName) {
  return function(result) {
    return result.facet_counts.facet_fields[fieldName];
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

function facetForType(client, docType, facetKey) {
  var query = client.createQuery().q({type_t: docType}).facet({field: facetKey}).rows(0).set('json.nl=map');
  return deferQuery(client, query, facetField(facetKey));
}

function regionTypeLoader(client) {
  var query = client.createQuery().q({type_t: 'region'}).sort({name_t: 'ASC'}).rows(10000)
    .restrict(['id', 'region_type_t', 'region_code_t', 'name_t', 'region_short_name_t', 'key_t', 'region_state_code_t', 'state_codes_txt', 'regions_txt', 'region_count_tl']);
  return function() {
    return deferQuery(client, query, extractDocs());
  };
}

function clusterLoader(client) {
  var query = client.createQuery().q({type_t: 'clusterData'}).sort({name_t: 'ASC'}).rows(10000)
    .restrict(['id', 'name_t', 'short_name_t', 'short_name2_t', 'icon_t', 'cluster_code_t', 'traded_b', 'key_t', 'sub_codes_txt', 'sub_names_txt', 'subcluster_b', 'sub_name_t', 'parent_key_t']);
  return function() {
    return deferQuery(client, query, extractDocs(processCluster));
  };
}

function maybeAdd(q, key, val) {
  if (val) {
    q[key] = val;
  }
}

function addStartAndLimit(query, req, defaultLimit) {
  defaultLimit = defaultLimit || 10000;
  if (req.query) {
    if (req.query.start) {
      query.start(+req.query.start);
    } else {
      query.start(0);
    }

    if (req.query.limit) {
      query.rows(+req.query.limit);
    } else {
      query.rows(defaultLimit);
    }
  }
}
function addSort(query, req) {
  if (req.query && req.query.sort) {
    var sort = {},
        vals = req.query.sort.split(',');
    vals.forEach(function(v) {
      var s = v.split(' ');
      sort[s[0]] = s[1] || 'ASC';
    });

    if (Object.keys(sort).length > 0) {
      query.sort(sort);
    }
  }
}

function parse(value) {
  if (!value || value === 'all') { return undefined; }
//  if (value.indexOf('-') > -1) { return '[' + value + ']'; }
  if (value.indexOf(',') > -1) { return '(' + value.split(',').join(' OR ') +  ')'; }
  return value;
}

function parseRegion(q, region, type) {
  if (region ==='all'  || region.indexOf(',') > -1) {
    maybeAdd(q, 'region_code_t', parse(region));
  } else {
    if (isNaN(+region) && type !== 'custom') {
      maybeAdd(q, 'region_key_t', region);
    } else {
      maybeAdd(q, 'region_code_t', region);
    }
  }
}

function parseCluster(q, req) {
  var cluster = req.params.cluster,
      subcluster = req.params.subcluster;
  if (!cluster) {
    q.type_t = 'aggregate';
  } else {
    q.type_t = 'cluster';
    if (subcluster) {
      q.subcluster_b = true;
      if (subcluster !== 'all')  {
        q.sub_code_t = subcluster;
      }
    } else {
      q.subcluster_b = false;
    }
  }
  if (cluster === 'traded') { q.traded_b = true; }
  else if (cluster === 'local') { q.traded_b = false; }
  else { maybeAdd(q, 'cluster_code_t', parse(cluster)); }
}

function processAggregate(doc) {
  if (doc.type_t === 'aggregate') {
    doc.strong_clusters = {};
    if (doc.str_cluster_codes_txt) {
      doc.str_cluster_codes_txt.forEach(function(d, i) {
        doc.strong_clusters[d] = {name:doc.str_clusters_txt[i], code: d, key: doc.str_cluster_keys_txt[i], pos:i};
      });
      delete(doc.str_clusters_txt);
      delete(doc.str_cluster_codes_txt);
      delete(doc.str_cluster_keys_txt);
    }

    doc.leading_clusters = [];
    if (doc.leading_codes_txt) {
      doc.leading_codes_txt.forEach(function (d, i) {
        doc.leading_clusters.push({name: doc.leading_names_txt[i], code: d, key: doc.leading_keys_txt[i], rank: doc.leading_ranks_txt[i], pos: i});
      });
      delete(doc.leading_codes_txt);
      delete(doc.leading_names_txt);
      delete(doc.leading_keys_txt);
      delete(doc.leading_ranks_txt);
    }
  }
  return doc;
}

function processCluster(item) {
  item.sub_clusters = _.object(item.sub_codes_txt, item.sub_names_txt);
  delete(item.sub_codes_txt);
  delete(item.sub_names_txt);
  return item;
}

function loader(client) {
  return function (req) {
    var q = {},
      query = client.createQuery().set('json.nl=map');

    addStartAndLimit(query, req);
    addSort(query, req);
    maybeAdd(q, 'region_type_t', req.params.type);
    maybeAdd(q, 'year_t', parse(req.params.year));
    parseRegion(q, req.params.code, req.params.type);
    parseCluster(q, req);
    query.q(q);
    return deferQuery(client, query, extractDocs(processAggregate));
  };
}

function regionBuilder(client) {
  return function (req) {
    var q = {
        type_t: 'aggregate',
        region_type_t: 'county',
        year_t: 2012,
      },
      query = client.createQuery().set('json.nl=map'),
      fields = ['id', 'region_name_t', 'region_short_name_t', 'region_code_t', 'region_key_t', 'total_population_tf', 'emp_tl', 'est_tl', 'private_wage_tf', 'gross_domestic_product_tf'];
    query.start(0).rows(10000).sort({}).q(q).fl(fields);
    return deferQuery(client, query, extractDocs(processAggregate));
  };
}

function contentLoader(client) {
  return function(req) {
    var query = client.createQuery().set('json.nl=map');
    addStartAndLimit(query, req);
    query.q({bundle:req.params.bundle});
    return deferQuery(client, query, extractDocs());
  }
}

function handleWith(f) {
  return function (req, res, next) {
    f(req)
      .then(function(r) {
        res.send(r);
      });
    return next();
  };
}

function addForKeys(server, handler, prefix, keys) {
  keys.forEach(function(d,i) {
    server.get('/' + prefix + '/' + keys.slice(0, i+1).join('/'), handler);
  });
}

function autocomplete(client, types) {
  return function(req) {
    var naics = false,
    q = req.params.q.replace(/ /g, '+').replace(/,/g, '+').split('+')
      .map(function(s) {
        return s.trim()
      })
      .filter(function(s) {
        if (s.toUpperCase() == 'NAICS') {
          naics = true;
          return false;
        }
        return s.length
      }),
    valQ = '(+' + q.join('* +') + '*)',
    typeQ = naics ? 'type_t:clusterData' : 'type_t:(' + types.join(' OR ') + ') AND -region_type_t:custom',
    fields = ['key_t', 'name_t', 'region_short_name_t', 'sub_name_txt', 'zip_codes_txt',
      'naics_1997_codes_txt',
      'naics_1997_labels_txt',
      'naics_2002_codes_txt',
      'naics_2002_labels_txt',
      'naics_2007_codes_txt',
      'naics_2007_labels_txt',
      'naics_2012_codes_txt',
      'naics_2012_labels_txt'],
    returnFields = ['id', 'type_t', 'key_t', 'region_name_t',
      'region_short_name_t', 'region_type_t', 'area_type_t',
      'name_t', 'traded_b', 'subcluster_b','sub_name_t','parent_key_t'],
    boosts = {key_t:'^2'},
    fieldQs= fields.map(function(f) { return f + ':' + valQ + (boosts[f] || '')}),
    qry = typeQ + ' AND (' + fieldQs.join(' OR ') + ')',
    query = client.createQuery().set('json.nl=map').q(qry).fl(returnFields).rows(50).sort({area_type_t:'desc'});
    
    return deferQuery(client, query, extractDocs(function(d) {
      var id = d.id, key = d.type_t + '/' + d.key_t, label = 'Unkown', type = 'Unkown';
      if (d.type_t  === 'region') {
        label =  d.region_short_name_t || d.region_name_t;
        type = d.area_type_t;
        key = 'region/' + d.region_type_t + '/' + d.key_t;
      } else {
        label = d.name_t + (d.subcluster_b? ' (' + d.sub_name_t + ' )' : '');
        type = (d.subcluster_b ? "Subcluster" : (d.traded_b ? "Cluster":"Local Cluster"));
        key = 'cluster/' + (d.subcluster_b ? d.parent_key_t + '/subclusters/' : '') + d.key_t;
      }
      return {id: id, label:label, key: key, type: type}
    }));
  }
}

function keyName(str) {
  return str.replace(/[\(\)\*&,'":;\/\.]/g, '') // remove bad chars
    .replace(/[\- ]/g, '_') // remove spaces and dashes -> underscore
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') //camel case -> snake case
    .replace(/__+/, '_') // multiple underscores get collapsed
    .replace(/_$/,'') // remove trailing underscores
    .toLowerCase(); // to lower case
}

var custom;
function forkCustom() {
    custom = cp.fork(__dirname + '/../custom.js');
}

forkCustom();
function customRegion(client) {
    return function(req, res, next) {
        var customSpec = req.body, region;

        if (customSpec && customSpec.name && customSpec.username && customSpec.regions) {
          var name = customSpec.name + ' by ' + customSpec.owner;
          var id = keyName(name);
          region = {
            id: 'region/custom' + '/' + id,
            type_t: 'region',
            region_code_t: id,
            region_type_t: 'custom',
            name_t: name + ' (Data processing...)',
            region_name_t: name + ' (Data processing...)',
            region_short_name_t: name + ' (Data processing...)',
            area_type_t: 'custom',
            regions_txt: customSpec.regions,
            region_count_tl: customSpec.regions.length,
            data_processing_t: true,
            owner_t: customSpec.username
          };
          client.autoCommit = true;
          client.add(region, function() {
          if (!custom && !custom.send) { 
            console.log('Custom process died, restarting');
            forkCustom();
          }
            custom.send(customSpec);
            res.send(region);
          });
        } else {
          res.send(400, 'Invalid custom region specification');
        }
      return next();
    }
}

function deleteCustomRegion(client) {
  return function(req, res, next) {
    var code = req.params.code,
      region = 'region_code_t:' + code ,
      query = client.createQuery().q(region);
    client.autoCommit = true;
    client.deleteByQuery(region, function(err,obj) {
      if(err){
        console.log('ERROR', err);
      }
      res.send(obj);
    });
    return next();
  }
}

function restartCustomRegion(client) {
  return function(req, res) {
    var qry = {type_t:'region', region_type_t:'custom', region_code_t: req.body.code},
      query = client.createQuery().set('json.nl=map').rows(10000);
    query.q(qry);
console.log(JSON.stringify(query));
    return deferQuery(client, query, function(result) { 
      var d = result.response.docs.shift();
console.log(JSON.stringify("d "+ JSON.stringify(d)));
      if (d && d.data_processing_t === 'true') {
        var spec = {
          name: d.region_name_t,
          username: d.owner_t,
          owner: d.owner_t,
          regions: d.regions_txt
        };
console.log(JSON.stringify(spec));
console.log(JSON.stringify(d));
        custom.send(spec);
      }
      res.send(d);
    });
  }
}

function customRegionLoader(client) {
  return function(req) {
    var userId = req.params.user,
        qry = {type_t:'region', region_type_t:'custom'},
        query = client.createQuery().set('json.nl=map').rows(10000);
    if (userId) qry.owner_t = userId;
    query.q(qry);
    return deferQuery(client, query, function(result) { return result.response.docs; });
  }
}

function deleteCompareRegion(client) {
  return function(req, res, next) {
    var code = req.body.code,
      owner = req.body.owner,
      qry = 'type_t:compare AND code_t:' + code + ' AND owner_t:' + owner;
    client.autoCommit = true;
    client.deleteByQuery(qry, function(err,obj) {
      if(err){
        console.log('ERROR', err);
      }
      res.send(obj);
    });
    return next();
  }
}

function createComparison(client) {
  return function(req, res, next) {
    var suffix = ' by ' + req.body.owner,
      name = req.body.name;
    if (name.indexOf(suffix) < 0) name += suffix;
    var id = keyName(name);
    var compare = {
        id: 'compare/' + req.body.owner + '/' + id,
        code_t: id,
        type_t: 'compare',
        name_t: name,
        regions_txt: req.body.regions,
        clusters_txt: req.body.clusters,
        indicators_txt: req.body.indicators,
        region_count_tl: req.body.regions.length,
        owner_t: req.body.owner
    };
    client.autoCommit = true;
    client.add(compare, function(err,obj) {
      var saved = {};
      if(err){
        console.log('ERROR', err);
      } else {
        saved.code = compare.code_t;
        saved.name = compare.name_t;
        saved.regions = compare.regions_txt;
        saved.clusters = compare.clusters_txt;
        saved.indicators = compare.indicators_txt;
        saved.owner = compare.owner_t;
      }
      res.send(saved);
    });
    return next();
  }
}

function compareRegionLoader(client) {
  return function(req) {
    var userId = req.params.user,
        code = req.params.code || "*",
        query = client.createQuery().set('json.nl=map').q({type_t:'compare', owner_t:userId, code_t: code}).rows(10000);
    return deferQuery(client, query, function(result) { 
      return result.response.docs.map(function(d) { return {code: d.code_t, id: d.id, name: d.name_t, owner: d.owner_t, regions: d.regions_txt, clusters: d.clusters_txt, indicators: d.indicators_txt}; });
    });
  }
}

module.exports = function regions_server(server, config) {
  var client = solr.createClient(config.solr),
      siteCLient = solr.createClient(config.siteSolr || config.solr),
      handler = handleWith(loader(client)),
      regionKeys = [':type', ':code', ':year', ':cluster', ':subcluster'],
      clusterKeys = [':cluster', ':year', ':type', ':code'];

  server.get('/region', handleWith(regionTypeLoader(client)));
  server.get('/region/builder', handleWith(regionBuilder(client)));
  addForKeys(server, handler, 'region', regionKeys);

  server.get('/cluster', handleWith(clusterLoader(client)));
  addForKeys(server, handler, 'cluster', clusterKeys);

  server.get('/autocomplete/:q', handleWith(autocomplete(client, ['clusterData', 'region'])));
  server.get('/autocomplete/cluster/:q', handleWith(autocomplete(client, ['clusterData'])));
  server.get('/autocomplete/region/:q', handleWith(autocomplete(client, ['region'])));

  server.get('/content/:bundle', handleWith(contentLoader(siteCLient)));

  server.post('/custom/restart', protectWithDrupalLogin(config), restartCustomRegion(client));
  server.post('/custom/delete/:code', protectWithDrupalLogin(config), deleteCustomRegion(client));
  server.post('/custom', protectWithDrupalLogin(config), customRegion(client));
  server.get('/custom/admin/list', handleWith(customRegionLoader(client)));
  server.get('/custom/:user', handleWith(customRegionLoader(client)));
  
  server.post('/compare', createComparison(client));
  server.post('/compare/delete', handleWith(deleteCompareRegion(client)));
  server.get('/compare/:user', handleWith(compareRegionLoader(client)));
  server.get('/compare/:user/:code', handleWith(compareRegionLoader(client)));
};
