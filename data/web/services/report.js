"use strict";
var solr = require('solr-client'),
  Q = require('q'),
  _ = require('underscore'),
  d3 = require('d3'),
  childProcess = require('child_process'),
  phantomjs = require('phantomjs'),
  SimpleJson2Csv = require('simple-json2csv'),
  path = require('path'),
  fs = require('fs'),
  tsFormat = d3.time.format('%Y%m%d%H%M%S'),
  benchmarkFormat = d3.format('0f'),
  moneyFormat = d3.format('$.2f'),
  percentFormat = d3.format('.2%'),
  percentFormatRounded = d3.format('%'),
  indexTpl = _.template(fs.readFileSync(path.join(__dirname, 'tpl/index.html'), 'utf-8')),
  template = _.template(fs.readFileSync(path.join(__dirname, 'tpl/chart.html'), 'utf-8')),
  mapTemplate = _.template(fs.readFileSync(path.join(__dirname, 'tpl/map.html'), 'utf-8')),
  orgMapTemplate = _.template(fs.readFileSync(path.join(__dirname, 'tpl/orgMap.html'), 'utf-8')),
  datadict = require('../datadict'),
  base, baseUrl, port;

if (!String.prototype.capitalize) {
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
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

function handleWith(f) {
  return function (req, res, next) {
    f(req, res, next)
      .then(function(r) {
        res.send(r);
      });
    return next();
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
function sendFile(filename, downloadname, res, next) {
  fs.stat(filename, function (err, stats) {
    var fstream = fs.createReadStream(filename);
    fstream.once('open', function (fd) {
      res.cache({maxAge: 0});
      res.set('Content-Length', stats.size);
      res.set('Content-Type', 'image/png');
      res.set('Content-Disposition','attachment; filename=' + downloadname);
      res.writeHead(200);
      fstream.pipe(res);
      fstream.once('end', function () {
        fs.unlink(filename);
        next(false);
      });
    });
  });
}

function ac(key) {
  return function(d) { return d[key]; };
}
function q(start, j) {
  var query = _s(start, j);
  function _a(args) { return  Array.prototype.slice.call(args); }

  function _o(obj, jsep, sep) {
    var res = [];
    sep = sep || ':';
    Object.keys(obj).forEach(function(d) {
      res.push(d + sep + _s(obj[d]));
    });

    if (jsep) {
      if (res.length === 1) {
        res = res[0];
      } else {
        res = '(' + res.join(jsep) + ')';
      }
    }
    return res;
  }

  function _s(obj, j) {
    j = j || ' AND ';
    if (Array.isArray(obj)) {return obj.map(function (d) { return _s(d); }).join(j);}
    if (typeof obj === 'object') {
      if (typeof obj.q === 'function') { return '(' + obj.q() + ')';}
      return _o(obj, j);
    }
    return obj;
  }

  function _or() {
    return _s(_a(arguments), ' OR ');
  }

  function _and() {
    return _s(_a(arguments), ' AND ');
  }
  return {
    or: function(a) { query = _or(query, a); return this; },
    and: function(a) {query = _and(query, a); return this; },
    q: function() {
      return query;
    }
  };
}
function clusterQ(cluster) {
  if (cluster === 'traded')  {
    return {traded_b: true, subcluster_b: false};
  } else if (cluster === 'local') {
    return {traded_b: false, subcluster_b: false};
  } else if (cluster === 'all') {
    return {subcluster_b: false};
  } else if( isNaN(+cluster) ){
    return {parent_key_t: cluster, subcluster_b: true};
  } else {
    return {cluster_code_t: cluster, subcluster_b: true};
  }
}
function subClusterQ(subcluster) {
  if (subcluster == 'all') {
    return {subcluster_b:false};
  } else {
    return isNaN(subcluster)?  {subcluster_b: true, key_t: subcluster} : {subcluster_b: true, sub_code_t: subcluster};
  }
}

function analyze(data, region, benchmarkRegion, typeInfo, start, end, keyF, valF, labelF, analysisF, benchmarkF, idNaN) {
  var byRegion = function(d) { return d.region_type_t+'/'+ ( idNaN? d.region_key_t: d.region_code_t);},
    byYear = function (d) { return d.year_t;},
    first = function(ds) { return ds[0]; },
    byRegionYear = d3.nest().key(byRegion).key(byYear).key(keyF).rollup(first).map(data, d3.map),
    result = [],
    regionName = byRegionYear.get(region).get(start).values()[0].region_name_t,
    rKey = byRegionYear.get(region).get(start).values()[0].region_key_t,
    total = {region: regionName, regionKey: rKey, start: start, end: end, type: typeInfo, value: 0, benchmark: 0, startTotal: 0, endTotal: 0};
  if (typeInfo != 'traded' && typeInfo != 'local' && idNaN) {
    total.cluster_name = data[0].cluster_name_t;
    total.type = 'Subcluster';
  } else {
    total.type = typeInfo.capitalize() + ' Cluster';
  }
  byRegionYear.get(region).get(start).forEach(function (k,v) {
    var startValue = valF(v), endValue = valF(byRegionYear.get(region).get(end).get(k)),
      benchmarkStart = valF(byRegionYear.get(benchmarkRegion).get(start).get(k)),
      benchmarkEnd = valF(byRegionYear.get(benchmarkRegion).get(end).get(k)),
      value = analysisF(startValue, endValue, benchmarkStart, benchmarkEnd),
      benchmark = benchmarkF(startValue, endValue, benchmarkStart, benchmarkEnd);
    total.value += value;
    total.benchmark += (isNaN(benchmark) ? 0 : benchmark);
    total.startTotal += (isNaN(startValue) ? 0 : startValue) ;
    total.endTotal += (isNaN(endValue) ? 0 : endValue);
    result.push({
      id: k,
      key: v.key_t,
      label: labelF(v),
      value: value,
      benchmark: benchmark,
      start: startValue,
      end: endValue,
      benchmarkStart: benchmarkStart,
      benchmarkEnd: benchmarkEnd,
      parent_key: v.parent_key_t || null
    });

  });

  return {
    totals: total,
    results: result.sort(function(a, b) { return d3.descending(a.value, b.value);})
  };
}
function jobCreation(data, region, benchmarkRegion, cluster, start, end, idNaN) {
  var labelF = function(d) { return (d.sub_name_t ? d.sub_name_t : d.cluster_name_t);},
    keyF = function(d) { return d.cluster_code_t + (d.sub_code_t ? '-' + d.sub_code_t : '');},
    valF = function (d) { return (d ? d.emp_tl : 0)},
    analysisF = function (start, end) { return end-start;},
    benchmarkF = function(start, end, benchmarkStart, benchmarkEnd) {
      return start * ((benchmarkEnd-benchmarkStart)/benchmarkStart);
    };
  return analyze(data, region, benchmarkRegion, cluster, start, end, keyF, valF, labelF, analysisF, benchmarkF, idNaN);
}
function loadJobCreation(client) {
  return function(req) {
    var type = req.params.type,
      code = req.params.code,
      region = type + '/' + code,
      benchmarkRegion = 'country/' + (isNaN(+code)?'united_states' : 98),
      start = req.params.start,
      end = req.params.end,
      idQry = isNaN(+code)? {region_type_t:type, region_key_t: code} : {region_type_t:type, region_code_t: code},
      qry = q({type_t: 'cluster'})
        .and({year_t: q(start).or(end)})
        .and(clusterQ(req.params.cluster))
        .and(q({region_type_t:'country', region_code_t:'98'}).or(idQry)),
      query = client.createQuery().rows(10000).q(qry.q());
    return deferQuery(client, query, function (queryResult) {
      return jobCreation(queryResult.response.docs, region, benchmarkRegion, req.params.cluster, start, end, isNaN(+code));
    });
  };

}
function captureJobCreation(req, res, next) {
  var p = req.params,
    hash = '#/' + p.type + '/' + p.code + '/' + p.start + '/' + p.end + '/' + p.cluster + "?controls=false",
    address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/jobcreation' + hash,
    filename = 'jobcreation_'+ [p.type, p.code, p.start, p.end, p.cluster, tsFormat(new Date())].join('_') + '.png',
    output = path.join(__dirname, filename),
    binPath = phantomjs.path,
    args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}
function jobCreationCSV(client) {
  return function(req, res) {
    var p = req.params,
      type = p.type,
      code = p.code,
      region = type + '/' + code,
      benchmarkRegion = 'country/' + (isNaN(+code)?'united_states' : 98),
      start = p.start,
      end = p.end,
      filename = 'jobcreation_'+ [p.type, p.code, p.start, p.end, p.cluster, tsFormat(new Date())].join('_') + '.csv',
      idQry = isNaN(+code)? {region_type_t:type, region_key_t: code} : {region_type_t:type, region_code_t: code},
      qry = q({type_t: 'cluster'})
        .and({year_t: q(start).or(end)})
        .and(clusterQ(req.params.cluster))
        .and(q({region_type_t:'country', region_code_t:'98'}).or(idQry)),
      query = client.createQuery().rows(10000).q(qry.q());

    return deferQuery(client, query, function (queryResult) {
      var results = jobCreation(queryResult.response.docs, region, benchmarkRegion, req.params.cluster, start, end, isNaN(+code)), json2csv;
      results.totals.label = results.totals.region + " Totals (" + results.totals.type + ")";

      results.totals.start = results.totals.startTotal;
      results.totals.end = results.totals.endTotal;
      results.results.push(results.totals);
      res.cache({maxAge: 0});
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition','attachment; filename=' + filename );
      json2csv = new SimpleJson2Csv({
        fields: [
          { name: "label", header: "Cluster Name" },
          { name: "start", header: p.start + " Employment" },
          { name: "end", header: p.end + " Employment" },
          { name: "value", header: "Change"},
          { name: "benchmark", header: "Expected Change"}
        ],
        data: results.results,
        transform: function(d) {d.benchmark = benchmarkFormat(d.benchmark); return d;}
      });
      // Add credit to end of file.
      results.results.push({label: sourceCreditText()});
      json2csv.pipe(res);
    });
  };
}

function analyzeCluster(data, benchmarkRegion, start, end, valF, labelF, analysisF, benchmarkF) {
  var byRegion = function(d) { return d.region_type_t+'/'+ d.region_key_t;},
      byYear = function (d) { return d.year_t;},
      first = function(ds) { return ds[0]; },
      byYearRegion = d3.nest().key(byYear).key(byRegion).rollup(first).map(data, d3.map),
      result = [],
      clusterName = (data[0].subcluster_b ? data[0].sub_name_t :data[0].cluster_name_t),
      cKey = data[0].key_t,
      cParentKey = data[0].parent_key_t || null,
      typeName = data[data.length-1].region_area_type_t,
      total = {region: clusterName, clusterKey: cKey, clusterParentKey: cParentKey, start: start, end: end, type: typeName.capitalize(), value: 0, benchmark: 0, startTotal: 0, endTotal: 0},
      benchmarkStart = valF(byYearRegion.get(start).get(benchmarkRegion)),
      benchmarkEnd = valF(byYearRegion.get(end).get(benchmarkRegion));
  byYearRegion.get(start).forEach(function (k,v) {
    total.clusterName = (data[0].cluster_name_t ? data[0].cluster_name_t : null);
    total.subClusterName = (data[0].sub_name_t ? data[0].sub_name_t : null);
    if (k === benchmarkRegion) return;
    var startValue = valF(v), endValue = valF(byYearRegion.get(end).get(k)),
        value = analysisF(startValue, endValue, benchmarkStart, benchmarkEnd),
        benchmark = benchmarkF(startValue, endValue, benchmarkStart, benchmarkEnd);
    total.value += value;
    total.benchmark += (isNaN(benchmark) ? 0 : benchmark);
    total.startTotal += (isNaN(startValue) ? 0 : startValue) ;
    total.endTotal += (isNaN(endValue) ? 0 : endValue);
    result.push({
      id: k,
      key: v.region_key_t,
      label: labelF(v),
      value: value,
      absvalue: Math.abs(value),
      benchmark: benchmark,
      start: startValue,
      end: endValue,
      benchmarkStart: benchmarkStart,
      benchmarkEnd: benchmarkEnd
    });
  });

  result = result.sort(function(a,b) { return d3.descending(a.absvalue, b.absvalue);});

  return {
    totals: total,
    results: result.sort(function(a, b) { return d3.descending(a.value, b.value);})
  };
}
function jobCreationCluster(data, benchmarkRegion, start, end) {
  var labelF = function(d) { return (d.region_short_name_t ? d.region_short_name_t : d.region_name_t);},
      valF = function (d) { return (d ? d.emp_tl : 0)},
      analysisF = function (start, end) { return end-start;},
      benchmarkF = function(start, end, benchmarkStart, benchmarkEnd) {
        return start * ((benchmarkEnd-benchmarkStart)/benchmarkStart);
      };
  return analyzeCluster(data, benchmarkRegion, start, end, valF, labelF, analysisF, benchmarkF);
}
function loadJobCreationCluster(client) {
  return function(req) {
    var start = req.params.start,
        end = req.params.end,
        benchmarkRegion = 'country/' + (isNaN(+req.params.code)?'united_states' : 98),
        scQry = subClusterQ(req.params.subcluster),
        idQry = !isNaN(+req.params.cluster)? {cluster_code_t: req.params.cluster}
                : scQry.subcluster_b? {parent_key_t: req.params.cluster}
                : {key_t: req.params.cluster},
        qry = q({type_t: 'cluster'})
          .and({year_t: q(start).or(end)})
          .and(idQry)
          .and(scQry)
          .and(q({region_type_t:'country', region_code_t:'98'}).or({region_type_t:req.params.type})),
        query = client.createQuery().rows(10000).q(qry.q());
    return deferQuery(client, query, function (queryResult) {
      var result = jobCreationCluster(queryResult.response.docs, benchmarkRegion, start, end);
      result.results = result.results.slice(0,50);
      return result;
    });
  };

}
function captureJobCreationCluster(req, res, next) {
  var p = req.params,
      hash = '#/' + p.type + '/' + p.code + '/' + p.start + '/' + p.end + '/' + p.cluster + "?controls=false",
      address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/jobcreation' + hash,
      filename = 'jobcreation_'+ [p.type, p.code, p.start, p.end, p.cluster, tsFormat(new Date())].join('_') + '.png',
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}
function jobCreationCSVCluster(client) {
  return function(req, res) {
    var p = req.params,
        type = p.type,
        code = p.code,
        benchmarkRegion = 'country/united_states',
        start = p.start,
        end = p.end,
        filename = 'jobcreation_'+ [p.cluster, p.start, p.end, p.type, tsFormat(new Date())].join('_') + '.csv',
        qry = q({type_t: 'cluster'})
          .and({year_t: q(start).or(end)})
          .and({ key_t: p.cluster, subcluster_b: false })
          .and(q({region_type_t:'country', region_code_t:'98'}).or({region_type_t:type})),
        query = client.createQuery().rows(10000).q(qry.q());
    return deferQuery(client, query, function (queryResult) {
      var results = jobCreationCluster(queryResult.response.docs, benchmarkRegion, start, end),
        fields = [
          { name: "label", header: "Region Name" },
          { name: "start", header: p.start + " Employment" },
          { name: "end", header: p.end + " Employment" },
          { name: "value", header: "Change"},
          { name: "benchmark", header: "Expected Change"}
        ];
      results.totals.label = results.totals.region + " Totals (" + results.totals.type + ")";
      results.totals.start = results.totals.startTotal;
      results.totals.end = results.totals.endTotal;
      results.results.push(results.totals);
      exportCSV(res, filename, fields, results.results, function(d) {
        d.benchmark = isNaN(d.benchmark) ? '' : benchmarkFormat(d.benchmark);
        return d;
      });
    });
  };
}

function employment(data, year, typeInfo, cidNaN) {
  var labelF = function(d) { return (d.sub_name_t ? d.sub_name_t : d.cluster_name_t);},
    keyF = function(d) { return d.cluster_code_t + (d.sub_code_t ? '-' + d.sub_code_t : '');},
    valF = function (d) { return (d ? d.emp_tl : 0)},
    result = [],
    regionName = data[0].region_name_t,
    regionKey = data[0].region_key_t,
    total = {region: regionName, regionKey: regionKey, year: year, value:0};

  if (!isNaN(+typeInfo) || cidNaN) {
    total.cluster_name = data[0].cluster_name_t;
    total.type = 'Subcluster';
  } else {
    total.type = typeInfo.capitalize() + ' Cluster';
  }
  data.forEach(function(d) {
    total.value += valF(d);
    result.push({
      id: keyF(d),
      key: d.key_t,
      label: labelF(d),
      value: valF(d),
      strong: d.strong_b,
      rank: d.emp_tl_rank_i,
      parent_key: d.parent_key_t || null
    });
  });
  return {
    totals: total,
    results: result.sort(function(a, b) { return d3.descending(a.value, b.value);})
  };
}
function loadEmployment(client, cb) {
  return function(req) {
    console.error('hello',req.params);
    var type = req.params.type,
      code = req.params.code,
      year = req.params.year,
      idQry = isNaN(+code)? {region_key_t: code}: {region_code_t: code},
      isSubCluster = clusterQ(req.params.cluster).subcluster_b,
      qry = q({type_t: 'cluster'})
        .and({year_t: year})
        .and(clusterQ(req.params.cluster))
        .and({region_type_t:type})
        .and(idQry),
      query = client.createQuery().rows(10000).q(qry.q());

    return deferQuery(client, query, function (queryResult) {
      var results = employment(queryResult.response.docs, year, req.params.cluster, isSubCluster );
      if (cb) { cb(results); }
      else { return results; }
    });
  };
}
function employmentCSV(client){
  return function (req, res) {
    var p = req.params,
      loader = loadEmployment(client, function(results) {
        var json2csv,
            filename = 'employment_'+ [p.type, p.code, p.year, p.cluster, tsFormat(new Date())].join('_') + '.csv';
        results.totals.label = results.totals.region + " Totals (" + results.totals.type + ")";
        results.results.push(results.totals);
        res.cache({maxAge: 0});
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition','attachment; filename=' + filename );
        json2csv = new SimpleJson2Csv({
          fields: [
            { name: "label", header: "Cluster Name" },
            { name: "value", header: p.year + " Employment" },
            { name: "strong", header: "Strong Cluster"},
            { name: "rank", header: "National Rank"}
          ],
          data: results.results
        });
        // Add credit to end of file.
        results.results.push({label: sourceCreditText()});
        json2csv.pipe(res);
      });
    return loader(req);
  };
}
function captureEmployment(req, res, next) {
  var p = req.params,
    hash = '#/' + p.type + '/' + p.code + '/' + p.year + '/' + p.cluster + "?controls=false",
    address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/employment' + hash,
    filename = 'employment_'+ [p.type, p.code, p.year, p.cluster, tsFormat(new Date())].join('_') + '.png',
    output = path.join(__dirname, filename),
    binPath = phantomjs.path,
    args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function employmentCluster(data, year, typeInfo, limit) {
  var labelF = function(d) { return (d.region_short_name_t ? d.region_short_name_t : d.region_name_t);},
      keyF = function(d) { return d.region_type_t + '/' + d.region_key_t; },
      valF = function (d) { return (d ? d.emp_tl : 0)},
      result = [],
      clusterName = (data[0].subcluster_b ? data[0].sub_name_t :data[0].cluster_name_t),
      typeName = data[0].region_area_type_t,
      total = {region: clusterName, year: year, value:0, type: typeName.capitalize()};
      total.clusterName = (data[0].cluster_name_t ? data[0].cluster_name_t : null);
      total.subClusterName = (data[0].sub_name_t ? data[0].sub_name_t : null);

  data.forEach(function(d) {
    total.value += valF(d);
    result.push({
      id: keyF(d),
      key: d.key_t,
      label: labelF(d),
      value: valF(d),
      est_tl: d? d.est_tl: 0,
      parent_key: d? d.parent_key_t: null
    });
  });

  result = result.sort(function(a, b) { return d3.descending(a.value, b.value);});
  if (limit) {
    result = result.slice(0,limit);
  }

  return {
    totals: total,
    results: result
  };
}
function loadEmploymentCluster(client, limit, cb) {
  return function(req) {
    var type = req.params.type,
        year = req.params.year,
        scQry = subClusterQ(req.params.subcluster),
        idQry = !isNaN(+req.params.cluster)? {cluster_code_t: req.params.cluster}
                : scQry.subcluster_b? {parent_key_t: req.params.cluster}
                : {key_t: req.params.cluster},
        qry = q({type_t: 'cluster'})
          .and({year_t: year})
          .and('(NOT region_state_code_t:72)')
          .and(idQry)
          .and(scQry)
          .and({region_type_t:type}),
        query = client.createQuery().rows(10000).q(qry.q()),
        result_limit = req.query.limit || limit;

    return deferQuery(client, query, function (queryResult) {
      var results = employmentCluster(queryResult.response.docs, year, type, result_limit);
      if (cb) { cb(results); }
      else { return results; }
    });
  };
}
function employmentCSVCluster(client){
  return function (req, res) {
    var p = req.params,
        loader = loadEmploymentCluster(client, null, function(results) {
          var filename = 'employment_cluster_'+ [p.cluster, p.subcluster, p.year, p.type, tsFormat(new Date())].join('_') + '.csv',
            fields = [
              { name: "label", header: "Region Name" },
              { name: "value", header: p.year + " Employment" },
              { name: "est_tl", header: p.year + " Establishments" }
            ];
          results.totals.label = results.totals.region + " Totals (" + results.totals.type + ")";
          results.results.push(results.totals);
          exportCSV(res, filename, fields, results.results);
        });
    return loader(req);
  };
}
function captureEmploymentCluster(req, res, next) {
  var p = req.params,
      hash = '#/' + p.cluster + '/' + p.subcluster + '/' + p.year + '/' + p.type + "?controls=false",
      address = 'http://' + baseUrl + (base || ':' + port) + '/report/cluster/employment' + hash,
      filename = 'employment_cluster_'+ [p.cluster, p.subcluster, p.code, p.year, p.type, tsFormat(new Date())].join('_') + '.png',
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function wages(data, region, benchmarkRegion, year, typeInfo, idNaN) {
  var labelF = function(d) { return (d.sub_name_t ? d.sub_name_t : d.cluster_name_t);},
    keyF = function(d) { return d.cluster_code_t + (d.sub_code_t ? '-' + d.sub_code_t : '');},
    valF = ac('private_wage_tf'),
    regionF = function(d) { return d.region_type_t+'/'+ ( idNaN? d.region_key_t: d.region_code_t) ;},
    firstF = function(ds) { return ds[0];},
    byRegion = d3.nest().key(regionF).key(keyF).rollup(firstF).map(data, d3.map),
    result = [],
    regionName = byRegion.get(region).values()[0].region_name_t,
    rKey = byRegion.get(region).values()[0].region_key_t,
    total = {region: regionName, regionKey: rKey, year: year, value:0, benchmark: 0},
    nonZeroVals = 0,
    nonZeroValsBench = 0;

  if (typeInfo != 'traded' && typeInfo != 'local' && idNaN) {
    total.cluster_name = data[0].cluster_name_t;
    total.type = 'Subcluster';
  } else {
    total.type = typeInfo.capitalize() + ' Cluster';
  }
  byRegion.get(region).forEach(function(k, v) {
    var val = valF(v), benchmark = valF(byRegion.get(benchmarkRegion).get(k));
    total.value += val;
    total.benchmark += benchmark;
    result.push({
      id: keyF(v),
      key: v.key_t,
      label: labelF(v),
      value: val,
      benchmark: benchmark,
      parent_key: v.parent_key_t || null
    });

    if(val > 0){nonZeroVals++;}
    if(benchmark > 0){nonZeroValsBench++;}
  });

  total.value = total.value/nonZeroVals;
  total.benchmark = total.benchmark/nonZeroValsBench;

  return {
    totals: total,
    results: result.sort(function(a, b) { return d3.descending(a.value, b.value);})
  };
}
function loadWages(client, cb) {
  return function(req) {
    var type = req.params.type,
      code = req.params.code,
      region = type + '/' + code,
      benchmarkRegion = 'country/' + (isNaN(+code)?'united_states' : 98),
      year = req.params.year,
      idQry = isNaN(+code)? {region_type_t:type, region_key_t: code} : {region_type_t:type, region_code_t: code},
      qry = q({type_t: 'cluster'})
        .and({year_t: year})
        .and(clusterQ(req.params.cluster))
        .and( q({region_type_t:'country', region_code_t:'98'}).or(idQry) ),
      query = client.createQuery().rows(10000).q(qry.q());

    return deferQuery(client, query, function (queryResult) {
      var results = wages(queryResult.response.docs, region, benchmarkRegion, year, req.params.cluster, isNaN(+code) );
      if (cb) { cb(results); }
      else { return results; }
    });
  };
}
function wagesCSV(client){
  return function (req, res) {
    var p = req.params,
      filename = 'wages_'+ [p.type, p.code, p.year, p.cluster, tsFormat(new Date())].join('_') + '.csv',
      loader = loadWages(client, function(results) {
        var json2csv;
        results.totals.label = results.totals.region + " Averages (" + results.totals.type + ")";
        results.results.push(results.totals);
        res.cache({maxAge: 0});
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition','attachment; filename=' + filename );
        json2csv = new SimpleJson2Csv({
          fields: [
            { name: "label", header: "Cluster Name" },
            { name: "value", header: p.year + " Average Wages" },
            { name: "benchmark", header: p.year + " US Average Wages"}
          ],
          data: results.results,
          transform: function(d) {d.value = moneyFormat(d.value); d.benchmark = moneyFormat(d.benchmark); return d;}
        });
        // Add credit to end of file.
        results.results.push({label: sourceCreditText()});
        json2csv.pipe(res);
      });
    return loader(req);
  };
}
function captureWages(req, res, next) {
  var p = req.params,
    hash = '#/' + p.type + '/' + p.code + '/' + p.year + '/' + p.cluster + "?controls=false",
    address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/wages' + hash,
    filename = 'wages_'+ [p.type, p.code, p.year, p.cluster, tsFormat(new Date())].join('_') + '.png',
    output = path.join(__dirname, filename),
    binPath = phantomjs.path,
    args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function wagesCluster(data, limit) {
  var labelF = function(d) { return (d.region_short_name_t ? d.region_short_name_t : d.region_name_t);},
      keyF = function(d) { return d.region_type_t + '/' + d.region_key_t; },
      valF = function (d) { return (d ? d.private_wage_tf : 0) },
      result = [],
      clusterName = (data[0].subcluster_b ? data[0].sub_name_t :data[0].cluster_name_t),
      year = data[0].year_t,
      count = 0,
      total = {region: clusterName, year: year, value:0};
  total.clusterName = (data[0].cluster_name_t ? data[0].cluster_name_t : null);
  total.subClusterName = (data[0].sub_name_t ? data[0].sub_name_t : null);
  total.type = data.length > 1 && data[1].region_area_type_t ? data[1].region_area_type_t.capitalize() : "";

  data.forEach(function(v) {
    if (v.region_type_t == 'country') {
      total.value = v.private_wage_tf;
      return;
    }
    var val = valF(v);
    if (val > 0) count++;
    result.push({
      id: keyF(v),
      key: v.key_t,
      label: labelF(v),
      value: val,
      parent_key: v.parent_key_t || null
    });
  });

  result = result.sort(function(a, b) { return d3.descending(a.value, b.value);});
  if (limit) {
    result = result.slice(0, limit);
  }

  return {
    totals: total,
    results: result
  };
}
function loadWagesCluster(client, limit, cb) {
  return function(req) {
    var type = req.params.type,
        year = req.params.year,
        scQry = subClusterQ(req.params.subcluster),
        idQry = !isNaN(+req.params.cluster)? {cluster_code_t: req.params.cluster}
                : scQry.subcluster_b? {parent_key_t: req.params.cluster}
                : {key_t: req.params.cluster},
        qry = q({type_t: 'cluster'})
          .and({year_t: year})
          .and(idQry)
          .and(scQry)
          .and(q({region_type_t:'country', region_code_t:'98'}).or({region_type_t:type}));

    var query = client.createQuery().rows(10000).q(qry.q());

    return deferQuery(client, query, function (queryResult) {
      var results = wagesCluster(queryResult.response.docs, limit);
      if (cb) { cb(results); }
      else { return results; }
    });
  };
}

function wagesCSVCluster(client){
  return function (req, res) {
    var p = req.params,
        filename = 'wages_'+ [p.type, p.code, p.year, p.cluster, tsFormat(new Date())].join('_') + '.csv',
        loader = loadWagesCluster(client, 0, function(results) {
          var fields = [
              { name: "label", header: "Region Name" },
              { name: "value", header: p.year + " Average Wages" },
              // { name: "benchmark", header: p.year + " US Average Wages"}
            ];
          results.totals.label = results.totals.region + " Average Wages (" + results.totals.type + ")";
          results.results.push(results.totals);
          exportCSV(res, filename, fields, results.results, function(d) {
            d.value = isNaN(d.value) ? "" : moneyFormat(d.value);
            d.benchmark = moneyFormat(d.benchmark);
            return d;
          });
        });
    return loader(req);
  };
}
function captureWagesCluster(req, res, next) {
  var p = req.params,
      hash = '#/' + p.cluster + '/' + p.subcluster + '/' + p.year + '/' + p.type + "?controls=false",
      address = 'http://' + baseUrl + (base || ':' + port) + '/report/cluster/wages' + hash,
      filename = 'wages_'+ [p.cluster, p.subcluster, p.year, p.type, tsFormat(new Date())].join('_') + '.png',
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function specialization(data, region, benchmarkRegion, typeInfo, start, end, idNaN) {
  var labelF = function(d) { return (d.sub_name_t ? d.sub_name_t : d.cluster_name_t);},
    keyF = function(d) { return d.cluster_code_t + (d.sub_code_t ? '-' + d.sub_code_t : '');},
    valF = function (d) { return (d ? d.emp_tl : 0)},
    analysisF = function(v, b, t) { return ((v != b) ? v/b : v/t);},
    byRegion = function(d) { return d.region_type_t+'/'+ ( idNaN? d.region_key_t: d.region_code_t);},
    byYear = function (d) { return d.year_t;},
    first = function(ds) { return ds[0]; },
    byRegionYear = d3.nest().key(byRegion).key(byYear).key(keyF).rollup(first).map(data, d3.map),
    regionName = byRegionYear.get(region).get(start).values()[0].region_name_t,
    rKey = byRegionYear.get(region).get(start).values()[0].region_key_t,
    result = [],
    total = {region: regionName, regionKey: rKey, start: start, end: end, value: 0, change: 0, startTotal: 0, endTotal: 0},
    totalBenchmarkEmployment = { start: d3.sum(byRegionYear.get(benchmarkRegion).get(start).values(), valF),
      end: d3.sum(byRegionYear.get(benchmarkRegion).get(end).values(), valF)};

  if (typeInfo != 'traded' && typeInfo != 'local' ) {
    total.cluster_name = data[0].cluster_name_t;
    total.type = 'Subcluster';
  } else {
    total.type = typeInfo.capitalize() + ' Cluster';
  }

  byRegionYear.get(region).get(start).forEach(function (k,v) {
    var startValue = valF(v), endValue = valF(byRegionYear.get(region).get(end).get(k)),
      benchmarkStart = valF(byRegionYear.get(benchmarkRegion).get(start).get(k)),
      benchmarkEnd = valF(byRegionYear.get(benchmarkRegion).get(end).get(k)),
      value = analysisF(endValue, benchmarkEnd, totalBenchmarkEmployment.end),
      change = value - analysisF(startValue, benchmarkStart, totalBenchmarkEmployment.start),
      gainloss = endValue - startValue;

    total.startTotal += startValue;
    total.endTotal += endValue;

    result.push({
      id: k,
      key: v.key_t,
      label: labelF(v),
      value: value,
      change: change,
      gainloss: gainloss,
      start: startValue,
      end: endValue,
      benchmarkStart: (startValue == benchmarkStart ? totalBenchmarkEmployment.start : benchmarkStart),
      benchmarkEnd: (endValue == benchmarkEnd ? totalBenchmarkEmployment.end : benchmarkEnd),
      parent_key: v.parent_key_t || null
    });
  });

  total.value = total.endTotal / totalBenchmarkEmployment.end;
  total.change  = total.value - (total.startTotal / totalBenchmarkEmployment.start);

  return {
    totals: total,
    results: result.sort(function(a, b) { return d3.descending(a.value, b.value);})
  };
}
function loadSpecialization(client,cb) {
  return function(req) {
    var type = req.params.type,
      code = req.params.code,
      region = type + '/' + code,
      benchmarkRegion = 'country/' + (isNaN(+code)?'united_states' : 98),
      start = req.params.start,
      end = req.params.end,
      idQry = isNaN(+code)? {region_type_t:type, region_key_t: code} : {region_type_t:type, region_code_t: code},
      qry = q({type_t: 'cluster'})
        .and({year_t: q(start).or(end)})
        .and(clusterQ(req.params.cluster))
        .and(q({region_type_t:'country', region_code_t:'98'}).or(idQry)),
      query = client.createQuery().rows(10000).q(qry.q());
    return deferQuery(client, query, function (queryResult) {
      var results = specialization(queryResult.response.docs, region, benchmarkRegion, req.params.cluster, start, end, isNaN(+code) );
      if (cb) { cb(results); }
      else { return results; }
    });
  };
}
function captureSpecialization(req, res, next) {
  var p = req.params,
    hash = '#/' + p.type + '/' + p.code + '/' + p.start + '/' + p.end + '/' + p.cluster + '/' + p.zoom + "?controls=false",
    address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/specialization' + hash,
    filename = 'specialization'+ [p.type, p.code, p.start, p.end, p.cluster, tsFormat(new Date())].join('_') + '.png',
    output = path.join(__dirname, filename),
    binPath = phantomjs.path,
    args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}
function specializationCSV(client) {
  return function(req, res) {
    var p = req.params,
      filename = 'specialization_'+ [p.type, p.code, p.start, p.end, p.cluster, tsFormat(new Date())].join('_') + '.csv',
      loader = loadSpecialization(client, function(results) {
        var json2csv;
        results.totals.label = results.totals.region + " Total (" + results.totals.type + ")";
        results.results.push(results.totals);
        res.cache({maxAge: 0});
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition','attachment; filename=' + filename );
        json2csv = new SimpleJson2Csv({
          fields: [
            { name: "label", header: "Cluster Name" },
            { name: "value", header: results.totals.region + " National Employment Share, " + p.end },
            { name: "change", header: results.totals.region + " Change in Employment share," + p.start + '-' + p.end},
            { name: "start", header: p.start + " Employment" },
            { name: "end", header: p.end + " Employment" },
            { name: "gainloss", header: results.totals.region + " Change in Employment," + p.start + '-' + p.end },
            { name: "benchmarkStart", header: p.start + " National Employment" },
            { name: "benchmarkEnd", header: p.end + " National Employment" }
          ],
          data: results.results,
          transform: function(d) {d.value = percentFormat(d.value); d.benchmark = percentFormat(d.change); return d;}
        });
        // Add credit to end of file.
        results.results.push({label: sourceCreditText()});
        json2csv.pipe(res);
      });
    return loader(req);
  };
}

function specializationCluster(data, benchmarkRegion, start, end, idNaN) {
  var labelF = function(d) { return (d.region_short_name_t ? d.region_short_name_t : d.region_name_t);},
      valF = function (d) { return (d ? d.emp_tl : 0)},
      analysisF = function(v, b, t) { return ((v != b) ? v/b : v/t);},
      byRegion = function(d) { return d.region_type_t+'/'+ d.region_code_t;},
      byYear = function (d) { return d.year_t;},
      first = function(ds) { return ds[0]; },
      byYearRegion = d3.nest().key(byYear).key(byRegion).rollup(first).map(data, d3.map),
      clusterName = (data[0].subcluster_b ? data[0].sub_name_t :data[0].cluster_name_t),
      typeName = data[data.length-1].region_area_type_t,
      cKey = data[data.length-1].key_t,
      cParentKey = data[data.length-1].parent_key_t || null,
      result = [],
      total = {region: clusterName, clusterKey: cKey, clusterParentKey: cParentKey, type: typeName, start: start, end: end, value: 0, change: 0, startTotal: 0, endTotal: 0},
      benchmarkStart = valF(byYearRegion.get(start).get(benchmarkRegion)),
      benchmarkEnd = valF(byYearRegion.get(end).get(benchmarkRegion)),
      totalBenchmarkEmployment = {start: benchmarkStart, end: benchmarkEnd};
  total.clusterName = (data[0].cluster_name_t ? data[0].cluster_name_t : null);
  total.subClusterName = (data[0].sub_name_t ? data[0].sub_name_t : null);

  byYearRegion.get(start).forEach(function (k,v) {
    if (k === benchmarkRegion) return;
    var startValue = valF(v), endValue = valF(byYearRegion.get(end).get(k)),
        value = analysisF(endValue, benchmarkEnd, totalBenchmarkEmployment.end),
        change = value - analysisF(startValue, benchmarkStart, totalBenchmarkEmployment.start),
        gainloss = endValue - startValue;

    total.startTotal += startValue;
    total.endTotal += endValue;

    result.push({
      id: k,
      key: v.region_key_t,
      label: labelF(v),
      value: value,
      change: change,
      gainloss: gainloss,
      start: startValue,
      end: endValue,
      benchmarkStart: (startValue == benchmarkStart ? totalBenchmarkEmployment.start : benchmarkStart),
      benchmarkEnd: (endValue == benchmarkEnd ? totalBenchmarkEmployment.end : benchmarkEnd)
    });
  });

  total.value = total.endTotal / totalBenchmarkEmployment.end;
  total.change  = total.value - (total.startTotal / totalBenchmarkEmployment.start);

  return {
    totals: total,
    results: result.sort(function(a, b) { return d3.descending(a.value, b.value);})
  };
}
function loadSpecializationCluster(client,cb) {
  return function(req) {
    var start = req.params.start,
        end = req.params.end,
        benchmarkRegion = 'country/98',
        scQry = subClusterQ(req.params.subcluster),
        idQry = !isNaN(+req.params.cluster)? {cluster_code_t: req.params.cluster}
                : scQry.subcluster_b? {parent_key_t: req.params.cluster}
                : {key_t: req.params.cluster},
        qry = q({type_t: 'cluster'})
          .and({year_t: q(start).or(end)})
          .and(idQry)
          .and(scQry)
          .and(q({region_type_t:'country', region_code_t:'98'}).or({region_type_t:req.params.type})),
        query = client.createQuery().rows(10000).q(qry.q());
    return deferQuery(client, query, function (queryResult) {
      var results = specializationCluster(queryResult.response.docs, benchmarkRegion, start, end );
      if (cb) { cb(results); }
      else { return results; }
    });
  };
}
function captureSpecializationCluster(req, res, next) {
  var p = req.params,
      hash = '#/' + p.cluster + '/' + p.subcluster + '/' + p.start + '/' + p.end + '/' + p.type + '/' + p.zoom + "?controls=false",
      address = 'http://' + baseUrl + (base || ':' + port) + '/report/cluster/specialization' + hash,
      filename = 'specialization'+ [p.cluster, p.subcluster, p.start, p.end, p.type, tsFormat(new Date())].join('_') + '.png',
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}
function specializationCSVCluster(client) {
  return function(req, res) {
    var p = req.params,
        filename = 'specialization_'+ [p.cluster, p.subcluster, p.start, p.end, p.type, tsFormat(new Date())].join('_') + '.csv',
        loader = loadSpecializationCluster(client, function(results) {
          var fields = [
              { name: "label", header: "Region Name" },
              { name: "value", header: results.totals.region + " National Employment Share, " + p.end },
              { name: "change", header: results.totals.region + " Change in Employment share," + p.start + '-' + p.end},
              { name: "start", header: p.start + " Employment" },
              { name: "end", header: p.end + " Employment" },
              { name: "gainloss", header: results.totals.region + " Change in Employment," + p.start + '-' + p.end },
              { name: "benchmarkStart", header: p.start + " National Employment" },
              { name: "benchmarkEnd", header: p.end + " National Employment" }
            ];
          results.results.push({ label: results.totals.region + " Specialization by " + results.totals.type + "" });

          exportCSV(res, filename, fields, results.results, function(d) {
              d.value = d.value ? percentFormat(d.value) :'';
              d.change = d.change ? percentFormat(d.change) :'';
              return d;
          });
        });
    return loader(req);
  };
}

function dictVarByLookup(key) {
  var result;
  datadict.vars.forEach(function(v) {
    if (v.lookup && v.lookup === key) {
      result = v;
    }
  });
  return result;
}
function dictVarByKey(key) {
  var result;
  datadict.vars.forEach(function(v) {
    if (v.key && v.key === key) {
      result = v;
    }
  });
  return result;
}
function simpleChange(start, end) {
  return end-start;
}
function cagr(start, end, years) {
  var d = end/start;
  var p = 1/years;
  var c = Math.pow(d, p);

  return  c - 1;
}
function scorecard(data, region, benchmarkRegion, indicator, start, end, filters, regionName) {
  var resultLimit = 60,
    labelF = function(v) { return (v.region_short_name_t ? v.region_short_name_t : v.region_name_t); },
    valF = ac(indicator.range_source || indicator.key),
    emplF = ac('emp_tl'),
    manuF = ac('manufacturing_intensity_tf'),
    strongF = ac('str_cluster_codes_txt'),
    byRegion = function(d) { return d.region_type_t+'/'+ d.region_code_t;},
    byYear = function (d) { return d.year_t;},
    first = function(ds) { return ds[0]; },
    regionType,
    byRegionYear = d3.nest().key(byRegion).key(byYear).rollup(first).map(data, d3.map),
    benchmarkName = byRegionYear.get(benchmarkRegion).get(start).region_name_t,
    result = [],
    regionData = [],
    filter = filters.split('-')[0],
    subfilter = filters.split('-')[1], top, bottom,
    total = {start: start, end: end, type: indicator, benchmark: benchmarkName, value: 0, change: 0, cagr: 0 };

  if (regionName) {
    total.regionName = regionName;
    total.regionType = region[0].split('/')[0];
  } else {
    total.regionType = region.split('/')[0];
    total.regionName = byRegionYear.get(region).get(start).region_name_t;
    total.emp_tl = emplF(byRegionYear.get(region).get(end));
  }
  total.focus = region;
  total.value = valF(byRegionYear.get(benchmarkRegion).get(end));
  total.change = simpleChange(valF(byRegionYear.get(benchmarkRegion).get(start)), valF(byRegionYear.get(benchmarkRegion).get(end)));
  total.cagr = cagr(valF(byRegionYear.get(benchmarkRegion).get(start)), valF(byRegionYear.get(benchmarkRegion).get(end)), end-start);

  byRegionYear.forEach(function(k, v) {
    if (k === benchmarkRegion) return;
    var obj = {
      id: k,
      emp_tl: emplF(v.get(end)) || emplF(v.get(start)),
      manufacturing: manuF(v.get(end)),
      strong_clusters: strongF(v.get(end)) || strongF(v.get(start)),
      label: labelF(v.get(end)),
      key: v.get(end).region_key_t,
      value: valF(v.get(end)),
      change: simpleChange(valF(v.get(start)), valF(v.get(end))),
      cagr: cagr(valF(v.get(start)), valF(v.get(end)), end-start),
      start: valF(v.get(start)),
      end: valF(v.get(end)),
      regionType: v.get(end).region_type_t
    };
    if (k === region || region.indexOf(k) >= 0) {
      regionData.push(obj);
    } else if (obj.value) {
      result.push(obj);
    }
  });

  if (filter == 'specialization') {
    result = result.sort(function(a, b) { return d3.descending(a.emp_tl, b.emp_tl);});
    var l = result.length, filtered = [];
    if (!subfilter) subfilter = "1";
    for (var i = 0; i < l; i++) {
      if (result[i].strong_clusters && result[i].strong_clusters.indexOf(subfilter) >= 0) {
        filtered.push(result[i]);
      }
    }
    top = 0; bottom = 49;
    result = filtered;

  } else if (total.regionType == 'msa' && filter == 'size') {
    var quint = Number(subfilter),
      slice,
      key;
    result = result.sort(function(a, b) { return d3.descending(a.emp_tl, b.emp_tl);});
  
    var l = result.length, filtered = [];
    if (quint > 5) {
      key = 'Micro';
      quint -= 5;
    } else {
      key = 'Metro';
    }
    for (var i = 0; i < l; i++) {
      if (result[i].label.indexOf(key) > -1) {
        filtered.push(result[i]);
      }
    }
    result = filtered;
    slice = result.length / 5;

    top = (quint -1) * slice;
    bottom = quint * slice;
  
  } else if (filter == 'type') {
      if (subfilter == 'manufacturing') {
        result = result.sort(function(a, b) { return d3.descending(a.manufacturing, b.manufacturing);});
        top = 0;
        bottom = 50;
      } else {
        result = result.sort(function(a, b) { return d3.descending(a.emp_tl, b.emp_tl);});
        var third = Math.floor(result.length / 3);
        if (subfilter == 'large') {
          top = 0;
          bottom = third;
        } else if (subfilter == 'midsize') {
          top = third;
          bottom = third * 2;
        } else if (subfilter == 'small') {
          top = third * 2;
          bottom = third * 3;
        }
      }

  } else {
    result = result.sort(function(a, b) { return d3.descending(a.value, b.value);});
    if (result.length > resultLimit) {
      var targetIndex = 0;
      result.forEach(function (r,i) {
        if (r.id === region) {
          targetIndex = i;
        }
      });
      top = targetIndex - resultLimit/2;
      bottom = targetIndex + resultLimit/2;
      if (top < 0) {
        bottom += -top;
        top = 0;
      }
      if (bottom > result.length) {
        top -= bottom - result.length;
        bottom = result.length;
      }
    }
  }
  result = result.slice(top, bottom);
  if (regionData.length) {
    result = result.concat(regionData);
  }

  return {
    totals: total,
    results: result
  };
}
function loadScorecard(client, cb) {
  return function(req) {
    var type = req.params.type,
      code = req.params.code,
      filter = req.params.filter,
      region = type + '/' + code,
      regionName = '',
      benchmarkRegion = 'country/98',
      start = req.params.start,
      end = req.params.end,
      indicator = dictVarByLookup(req.params.indicator),
      qry = q({type_t: 'aggregate'}).and({year_t: q(start).or(end)}),
      qryBenchmark = q({region_type_t:'country', region_code_t:'98'}),
      fields = ['id', 'type_t', 'region_type_t', 'region_code_t', 'region_name_t', 'region_short_name_t', 'year_t', 'region_key_t', 'emp_tl', 'manufacturing_intensity_tf', 'area_type_t', (indicator.range_source || indicator.key)],
      query;

    function scorecardResults(queryResult) {
      var results = scorecard(queryResult.response.docs, region, benchmarkRegion, indicator, start, end, filter, regionName);
      if (cb) { cb(results); }
      else { return results; }
    }

    if (type == 'compare') {
      return getComparison(client, code)
        .then(function(comparison) {
          region = comparison.region_data.map(function(r){ return r.type + '/' + r.code });
          var qryCompare = comparison.region_data.map(function(r){ return '(region_type_t:'+r.type+' AND region_code_t:'+r.code+')' }).join(' OR '),
            qryRegion = '(region_type_t:' + filter + ')';
          // filter = 'default';
          qry = qry.and(qryBenchmark.or(qryRegion));
          query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
          regionName = comparison.name;
          return deferQuery(client, query, function(data) {
            var finalResults = scorecardResults(data);
            if (filter == 'state' && finalResults.totals.regionType == 'economic') {
              finalResults.totals.focus = [];
              comparison.region_data.forEach(function(d) {
                if (d.states) {
                  d.states.forEach(function(s){
                    finalResults.totals.focus.push('state/' + s);
                  });
                }
              });
            }
            return finalResults;
          });
        });

    } else if (filter.split('-')[0] == 'specialization') {
      fields.push('str_cluster_codes_txt');
      if (type == 'custom') {
        qry = qry.and(qryBenchmark.or(q('region_type_t:custom AND region_code_t:' + code )).or(q('region_type_t:economic')));
      }  else {
        qry = qry.and(qryBenchmark.or({region_type_t:type}));
      }
      query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
      var results;
      return deferQuery(client, query, function(queryResult) {
          results = scorecardResults(queryResult);
          return getTradedClusters(client);
        })
        .then(function(clusters) {
          results.clusters = clusters;
          return results;
        });

    } else if (type == 'county') {
      return getContiguousCounties(client, type, code, filter)
        .then(function(regionIds) {
          qry = qry.and(qryBenchmark.or(q('region_type_t:' + type + ' AND region_code_t:('
                + regionIds.map(function(c) { return c.replace('region/' + type + '/', '');}).join(' OR ') +')')));
          query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
          return deferQuery(client, query, scorecardResults);
        });

    } else if (type == 'msa' && filter.split('-')[0] == 'neighborhood') {
      return getContiguousMSAs(client, type, code, filter.split('-')[1])
        .then(function(regionIds) {
          qry = qry.and(qryBenchmark.or(q('region_type_t:' + type + ' AND region_code_t:('
                + regionIds.map(function(c) { return c.replace('region/' + type + '/', '');}).join(' OR ') +')')));
          query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
          return deferQuery(client, query, scorecardResults);
        });

    } else if ((type == 'economic' || type == 'custom') && filter.split('-')[0] == 'neighborhood') {
      return getNearbyRegions(client, type, code, filter.split('-')[1])
        .then(function(regionIds) {
          qry = qry.and(qryBenchmark
              .or(q('region_type_t:economic AND region_code_t:('+ regionIds.map(function(c) { return c.replace('region/economic/', '');}).join(' OR ') +')'))
              .or(q('region_type_t:custom AND region_code_t:' + code ))
            );
          query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
          return deferQuery(client, query, function(data) {
            return scorecardResults(data);
          });
        })

    } else if (type == 'custom') {
      qry = qry.and(qryBenchmark.or(q('region_type_t:custom AND region_code_t:' + code )).or(q('region_type_t:economic')));

    } else {
      qry = qry.and(qryBenchmark.or({region_type_t:type}));
    }
    query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
    return deferQuery(client, query, scorecardResults);
  };
}

function getTradedClusters(client) {
  var q = {type_t: 'clusterData', subcluster_b:false, traded_b: true},
    query = client.createQuery().rows(10000).q(q);
  return deferQuery(client, query, extractDocs(function(d){ return { code: d.cluster_code_t, key: d.key_t, name: d.name_t }; }));
}

function getCustomRegions(client, code) {
  var code_user = code.split('_by_'),
    user = (code_user.length ? code_user[1] : []),
    q = {type_t: 'region', region_type_t: 'custom', data_processing_t:false, owner_t: user},
    query = client.createQuery().rows(10000).q(q).fl(['region_code_t']);
  return deferQuery(client, query, extractDocs(function(d){ return d.region_code_t; }));
}

function getContiguousCounties(client, type, code, filter) {
  if (filter == 'state') {
    return stateForOther(client, type, code)
      .then(function(stateCode){
        return regionsForSate(client, stateCode, type);
      });
  } else if (filter == 'economic') {
    return regionsForCounties(client, 'economic', [code])
      .then(function(regionId) {
        return countiesForOther(client, 'economic', regionId.replace('region/economic/',''));
      });
  }
}

function getEconomicAreas(client, type, code) {
  return countiesForOther(client, type, code)
    .then(function(countyIds) {
      return regionsForCounties(client, 'economic', countyIds);
    })
    .then(function(regionIds) {
      return getCountiguousRegions(client, 'economic', regionIds);
    });
}

function getCountiguousRegions(client, type, regionIds) {
  var deferred = Q.defer(),
    url = 'http://' + baseUrl + '/viz/hbs_viz/json/countiesEasMsas.json',
    http = require('http'),
    topojson = require('topojson'),
    data = '';
  http.get(url, function(response) {
    response.on('data', function (chunk) {
      data += chunk;
    });
    response.on('end', function() {
      var result = JSON.parse(data),
        eas = result.objects.eas.geometries,
        neighbors = topojson.neighbors(eas),
        selected = [];
      for (var i = 0; i < eas.length; i++) {
        if (regionIds.indexOf(eas[i].id) > -1) {
          selected = neighbors[i];
          break;
        }
      }
      for (var i = 0; i < selected.length; i++) {
        var j = selected[i];
        selected[i] = eas[j].id;
      }
      deferred.resolve(selected.concat(regionIds));
    })
  });
  return deferred.promise;
}

function getNearbyRegions(client, type, code, filter) {
  if (filter == 'nearby') {
    var query = client.createQuery().rows(10000).q({type_t: 'region', region_type_t:type, region_code_t: code })
        .fl(['id', 'name_t', 'state_codes_txt', 'regions_txt']);
    return deferQuery(client, query, function(result){ return result.response.docs[0].state_codes_txt; })
      .then(function(stateCodes) {
        if (type == 'custom') type = 'economic';
        var query = client.createQuery().rows(10000).q({type_t: 'region', region_type_t:type, state_codes_txt: '(' + stateCodes.join(' OR ') + ')' })
          .fl(['region_code_t']);
        return deferQuery(client, query, extractDocs(function(d){ return d.region_code_t }));
      });

  } else if (filter == 'contiguous') {
    if (type == 'custom') {
      return getEconomicAreas(client, type, code)
        .then(function(regionIds) {
          return getCountiguousRegions(client, type, regionIds);
        });
    } else {
      return getCountiguousRegions(client, type, [code]);
    }
  }
}


function getContiguousMSAs(client, type, code, filter) {
  if (filter == 'state') {
    return stateForOther(client, type, code)
      .then(function(stateCode){
        return regionsForSate(client, stateCode, type);
      });
  } else if (filter == 'economic') {
    return countiesForOther(client, 'msa', code)
      .then(function(countyIds) {
        var query = client.createQuery().rows(10000).q('type_t:region AND region_type_t:economic AND regions_txt:(' + countyIds.join(' OR ') + ')').fl(['id','regions_txt']);
        return deferQuery(client, query, extractDocs(function(d){return d.regions_txt; }));
      })
      .then(function(countyIds) {
        return regionsForCounties(client, 'msa', countyIds)
      })
  }
}

function scorecardCSV(client, cb) {
  return function (req, res) {
    var p = req.params,
      indicator = dictVarByLookup(p.indicator),
      percFormat = d3.format('.2%'),
      numFormat = d3.format(indicator.format),
      filename = 'scorecard_'+ [p.type, p.code, p.start, p.end, p.indicator, tsFormat(new Date())].join('_') + '.csv',
      loader = loadScorecard(client, function(results) {
          var json2csv;
          results.results.push({ label: results.totals.region + ", Comparative " + indicator.label + " Performance, " + p.start  + "-" + p.end });
          res.cache({maxAge: 0});
          res.set('Content-Type', 'text/csv');
          res.set('Content-Disposition','attachment; filename=' + filename );
          json2csv = new SimpleJson2Csv({
            fields: [
              { name: "label", header: "Region" },
              { name: "start", header:  p.start },
              { name: "end", header: p.end },
              { name: "change", header: "Change" },
              { name: "cagr", header: (p.indicator == "unemployment" ? "Change in Unemployment Rate" : "Real Growth in " + indicator.label) }
            ],
            data: results.results,
            transform: function(d) {
              d.end = d.end ? numFormat(d.end) : "";
              d.start = d.start ? numFormat(d.start) : "";
              d.change = d.change ? numFormat(d.change) : "";
              d.cagr = d.cagr ? percFormat(d.cagr) : "";
              return d;
            }
          });
          // Add credit to end of file.
          results.results.push({label: sourceCreditText()});
          json2csv.pipe(res);
        });
    return loader(req);
  };
}

function captureScorecard(req, res, next) {
  var p = req.params,
      hash = '#/' + p.type + '/' + p.code + '/' + p.start + '/' + p.end + '/' + p.indicator + '/' + p.filter + '/' + p.zoom,
      address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/scorecard' + hash,
      filename = 'scorecard_'+ [p.indicator, p.type, p.code, p.start, p.end, tsFormat(new Date())].join('_') + '.png',
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function sparkline(data, region, indicator, rank_key, change_rank_key, rank_top) {
  var totals = {title: indicator.label,
                type: indicator,
                subtitle:indicator.subtitle,
                region: '',
                units:'total',
                start_value: 0, end_value: 0,
                change_rank: 99, change_rank_q: 1,
                start_rank:0, start_rank_q: 1,
                end_rank:0, end_rank_q: 1,
                start_year: 0, end_year: 0,
                change: 0, cagr:0},
    results = [],
    valF = ac(indicator.range_source || indicator.key),
    goodValF = function(d) { var v = valF(d); return v && !isNaN(v);},
    byYear = function (d) { return d.year_t;},
    byRegion = function(d) { return d.region_type_t + '/' + d.region_code_t;},
    first = function(ds) { return ds[0]; },
    filteredData = data.filter(goodValF),
    yearRange = d3.extent(filteredData.filter(function(d) { return byRegion(d) == region; }), byYear),
    dataByYear = d3.nest().key(byYear).sortKeys(d3.ascending).key(byRegion).rollup(first).map(filteredData, d3.map),
    start, end,
    rank_quint = (rank_top / 5),
    rankQF = function(r) { return Math.ceil(r/rank_quint) },
    invertedChangeRank = ['unionization', 'taxes', 'corporate_taxes'],
    invertedRank = ['unemployment', 'poverty', 'unionization', 'taxes', 'corporate_taxes'],
    benchmarkRegion = 'country/98';

    var rankF = function (d) {
      var rank = d[rank_key];
      if (d.region_type_t == 'state') {
        rank = rank * (rank_top / 50);
      }
      if (invertedRank.indexOf(indicator.lookup) >= 0) {
        rank = rank_top +1 - rank;
      }
      return rank;
    },
    change_rankF = function (d) {
      var rank = d[change_rank_key];
      if (d.region_type_t == 'state') {
        rank = rank * (rank_top / 50);
      }
      if (invertedChangeRank.indexOf(indicator.lookup) >= 0) {
        rank = rank_top +1 - rank;
      }
      return rank;
    };

  if (!dataByYear.get(yearRange[0])) {
    console.log("no data for start year", region, indicator.range_source || indicator.key);
  } else {
    start = dataByYear.get(yearRange[0]).get(region);
  }

  if (!dataByYear.get(yearRange[1])) {
    console.log('no data for end year', region, indicator.range_source || indicator.key);
  } else {
    end = dataByYear.get(yearRange[1]).get(region);
  }

  if (!start) {
    return {
      totals: totals,
      results: results,
    };
  }

  totals.region = (start.region_short_name_t ? start.region_short_name_t : start.region_name_t);
  totals.regionType = start.region_type_t;
  totals.regionCode = start.region_code_t;
  totals.change_rank = change_rankF(end);
  totals.change_rank_q = rankQF(totals.change_rank);

  totals.start_value = valF(start);
  totals.start_year = yearRange[0];
  totals.start_rank = rankF(start);
  totals.start_rank_q = rankQF(totals.start_rank);

  totals.end_year = yearRange[1];
  totals.end_value = valF(end);
  totals.end_rank = rankF(end);
  totals.end_rank_q =rankQF(totals.end_rank);
  if (indicator.benchmark) {
    var benchEnd = dataByYear.get(totals.end_year).get(benchmarkRegion);
    if (benchEnd) {
      totals.end_bench_value = valF(benchEnd);
    }
  }
  if (indicator.key == 'fortune1000_tl') {
    totals.companies = end.fortune1000_company_txt;
    totals.rank = end.fortune1000_rank_txt;
  }

  totals.change = simpleChange(totals.start_value, totals.end_value);
  totals.cagr = cagr(totals.start_value, totals.end_value, totals.end_year - totals.start_year);
  var lastYear = totals.start_year, lastVal = totals.start_value, lastBench = totals.end_bench_value;
  d3.range(yearRange[0], yearRange[1] + 1).forEach(function(k) {
    if (!dataByYear.get(k)) return;
    var year = +k,
        v = dataByYear.get(k).get(region),
        val = valF(v);

//    if (year > (lastYear + 1)) {
//      for (var i = lastYear + 1; i < year; i++) {
//        if (indicator.benchmark) {
//          var y = dataByYear.get(i);
//          var b = (y ? y.get(benchmarkRegion) : undefined);
//          if (b) {
//            lastBench = valF(b);
//          }
//          results.push({year: i, value: lastVal, benchmarkValue: lastBench}); // extrapolate intermediate values
//        } else {
//          results.push({year: i, value: lastVal});
//        }
//      }
//    }

    lastYear = year;
    lastVal = val;

    if (indicator.benchmark) {
      lastBench = valF(dataByYear.get(k).get(benchmarkRegion));
      results.push({year: year, value: val, benchmarkValue: lastBench});
    } else {
      results.push({year: year, value: val});
    }
  });

  return {
    totals: totals,
    results: results
  };
}

function hasResults(data, indicator) {
  var valF = ac(indicator.range_source || indicator.key),
      hasResult = false;

  data.forEach(function(d) {
    var v = valF(d);
    if (v !== undefined && !isNaN(+v) && v) {
      hasResult = true;
    }
  });
  return hasResult;
}

function captureSparkline(req, res, next) {
  var p = req.params,
      hash = '#/' + p.type + '/' + p.code + '/' + p.indicator,
      address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/spark' + hash,
      filename = 'sparkline_'+ [p.type, p.code, p.indicator, tsFormat(new Date())].join('_') + '.png',
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      options = "sparkline",
      args = [path.join(__dirname, '../toImage.js'), address, output, options];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function capturePerformance(req, res, next) {
  var p = req.params,
      address = 'http://' + baseUrl + '/region/' + p.type + '/' + p.code + '/performance',
      filename = 'performance_'+ [p.type, p.code, tsFormat(new Date())].join('_') + '.' + p.ext,
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      options = "noheader",
      args = [path.join(__dirname, '../toImage.js'), address, output, options];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function loadSparkline(client, cb) {
  return function(req) {
    var type = req.params.type,
      code = req.params.code,
      region = type +'/'+ code,
      indicator = dictVarByKey(req.params.indicator),
      key = (indicator ? (indicator.range_source || indicator.key) : ''),
      rank_key = key + '_rank_i',
      change_key = key + '_change_tf',
      change_rank_key = key + '_change_tf_rank_i',
      percentile_rank_key = key + '_per_rank_i',
      change_percentile_rank_key = key + '_change_tf_per_rank_i',
      qry = q({type_t: 'aggregate', region_code_t: code, region_type_t: type}),
      fields = ['id', 'type_t', 'region_type_t', 'region_code_t', 'region_name_t', 'region_short_name_t', 'year_t', 'region_key_t', key, rank_key, percentile_rank_key, change_rank_key, change_percentile_rank_key, change_key],
      rank_top = 50;

    if (key == 'venture_capital_per_gdp_tf') {
      var qryObj = {type_t: 'aggregate', region_type_t: type, venture_capital_per_gdp_tf: '*' };
      qryObj[key] = '*';
      qry = q(qryObj);
    }

    if (key == 'fortune1000_tl') {
      fields.push('fortune1000_rank_txt');
      fields.push('fortune1000_company_txt');
    }
    var query = client.createQuery().rows(10000).fl(fields);

    if (key === '') {
      console.log('BAD INDICATOR', req.params.indicator);
    }

    if (indicator.benchmark) {
      qry = qry.or({type_t: 'aggregate', region_code_t: '98', region_type_t: 'country'});
    }
    query.q(qry.q());

    if (type !== 'state') {
      rank_key = percentile_rank_key;
      change_rank_key = change_percentile_rank_key;
      rank_top = 100;
    }

    function _processResults(queryResult) {
      var data = queryResult.response.docs;

      if (key == 'venture_capital_per_gdp_tf') {
        var byRegion = d3.nest()
          .key(function(d) { return d.region_type_t + '/' + d.region_code_t;})
          .map(queryResult.response.docs, d3.map);
        
        var regions = Object.keys(byRegion).map(function(k){
          var years = byRegion[k].sort(function(a,b){ return d3.ascending(a.year_t, b.year_t); });
          if (years.length < 2) { return; }
          var last = years.slice().pop() || {};

          // Alternative cagr calculation which matches with the stored calculation.
          // var first = years.slice().shift() || {};
          // var ys = +last.year_t - +first.year_t;
          // var d = last[key] / first[key];
          // var p = 1/ys;
          // var cagr = Math.pow(d, p) -1;

          // Stored cagr calculation
          var cagr = last[change_key];

          return {
            code: +last.region_code_t,
            cagr: cagr,
          };
        })
        .filter(function(d){return d})
        .sort(function(a,b){return d3.descending(a.cagr,b.cagr);})
        .map(function(d, i){
          d.change_rank = i +1;
          return d;
        })
        var l = regions.length;
        var regionTotals = regions.filter(function(d){return d.code == code }).shift();
        
        data = data.filter(function(d){return +d.region_code_t == code })
          .map(function(d){
            d[change_rank_key] = regionTotals.change_rank;
            d[change_percentile_rank_key] = Math.round(rank_top * regionTotals.change_rank / l);
            return d;
          });
      }
      try {
        var results = sparkline(data, region, indicator, rank_key, change_rank_key, rank_top);
        if (cb) {
          cb(results);
        }
        else {
          return results;
        }
      } catch (err) {
        console.log('got error', err, err.stack);
      }
    }
    return deferQuery(client, query)
      .then(function (queryResult) {
        if (type !== 'state' && !hasResults(queryResult.response.docs, indicator)) {
          return stateForOther(client, type, code)
            .then(function(state) {

              qry = q({type_t: 'aggregate', region_code_t: state, region_type_t: 'state'});
              region = 'state/' + state;
              query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
              return deferQuery(client, query, _processResults);
            });
        } else {
          return Q(_processResults(queryResult));
        }
      })
      .catch(function (e) { throw e;});
  }
}

function regionsForSate(client, state_code, type) {
  var query = client.createQuery().rows(10000).q({state_codes_txt: state_code, region_type_t: type}).fl(['id']);
  return deferQuery(client, query, extractDocs(function(d) { return d.id; }));
}

function countiesForOther(client, type, code) {
  var qry = regionQ(type, code);
  qry['type_t'] = 'region';
  var query = client.createQuery().rows(10000).q(qry).fl(['id', 'state_codes_txt', 'regions_txt']);
  return deferQuery(client, query, function(queryResult) {
    var results = queryResult.response.docs;
    return results[0].regions_txt;
  })
}

var stateEndRe= /.*, ([A-Z\-]+)/;

function stateForOther(client, type, code) {
  var query = client.createQuery().rows(10000).q({type_t: 'region', region_type_t: type, region_code_t: code}).fl(['id', 'name_t', 'state_codes_txt', 'regions_txt']);
  return deferQuery(client, query, function(queryResult) {
    var results = queryResult.response.docs;
    var r = results[0], m;
    if (r.name_t && (m = stateEndRe.exec(r.name_t)) != null) {
      var states = m[1].split('-');
      var st = states[0];
      if (st === 'DC') st = states[1];
      return datadict.stateIdMapping[st];
    } else if (r.regions_txt) {
      var countyIds=r.regions_txt;
      var stateCodes = {}, state;
      countyIds.forEach(function(d) {
        var sc = d.split('/')[2].substring(0,2);
        if (!stateCodes[sc]) { stateCodes[sc] = 0; }
        stateCodes[sc]++;
      });
      Object.keys(stateCodes).forEach(function(k) {
        if (!state) {
          state = k;
        } else if (stateCodes[k] > stateCodes[state]) {
          state = k;
        }
      });
      return state;
    } else if (r.state_codes_txt) {
      return r.state_codes_txt[0]
    }
  });
}

function regionsForCounties(client, type, counties) {
  var query = client.createQuery().rows(10000).q('type_t:region AND region_type_t:' + type + ' AND regions_txt:(' + counties.join(' OR ') + ')').fl(['id']);
  return deferQuery(client, query, extractDocs(function(d) { return d.id; }));
}

function aggregatesForIds(client, type, code, ids, start, end, key) {
  var aggsBase, aggsStart, aggsEnd, aggIds, aggsQuery, q, fields, query;
  aggsBase = ids.map(function(d) { return d.replace('region', 'aggregate'); });
  aggsStart = aggsBase.map(function(d) { return d + '/' + start;});
  aggsEnd = aggsBase.map(function(d) { return d + '/' + end;});
  aggIds = aggsStart.concat(aggsEnd);
  aggsQuery = aggIds.join(' OR ');
  q = 'type_t:aggregate AND ((region_type_t:country AND region_code_t:98) OR  id:(' + aggsQuery + ') OR (region_type_t:' + type + ' AND region_key_t:' + code + '))';
  fields = ['id', 'region_type_t', 'region_code_t', 'region_key_t', 'region_short_name_t', 'region_name_t', 'year_t', 'private_wage_tf', key];
  query = client.createQuery().rows(10000).q(q).fl(fields);
  return deferQuery(client, query, extractDocs());
}

function subregions(data, indicator, start, end, regionName, benchmarkRegion, region) {
  var labelF = function(v) { return (v.region_short_name_t ? v.region_short_name_t : v.region_name_t); },
      valKey = indicator.range_source || indicator.key,
      valF = function(d) { return (d ? d[valKey] : undefined); },
      wageF = function(d) { return d.private_wage_tf; },
      byRegion = function(d) { return d.region_type_t+'/'+ d.region_code_t;},
      byYear = function (d) { return d.year_t;},
      first = function(ds) { return ds[0]; },
      byRegionYear = d3.nest().key(byRegion).key(byYear).rollup(first).map(data, d3.map),
      benchmarkName = byRegionYear.get(benchmarkRegion).get(start).region_name_t,
      result = [],
      total = {title: regionName + ' Sub-Regions', start: start, end: end, type: indicator, benchmark: benchmarkName };

  total.value = valF(byRegionYear.get(benchmarkRegion).get(end));
  total.wage =  wageF(byRegionYear.get(benchmarkRegion).get(end));
  total.change = simpleChange(valF(byRegionYear.get(benchmarkRegion).get(start)), valF(byRegionYear.get(benchmarkRegion).get(end)));
  total.cagr = cagr(valF(byRegionYear.get(benchmarkRegion).get(start)), valF(byRegionYear.get(benchmarkRegion).get(end)), end-start);

  total.valueRegion = valF(byRegionYear.get(region).get(end));
  total.wageRegion =  wageF(byRegionYear.get(region).get(end));
  total.changeRegion = simpleChange(valF(byRegionYear.get(region).get(start)), valF(byRegionYear.get(region).get(end)));
  total.cagrRegion = cagr(valF(byRegionYear.get(region).get(start)), valF(byRegionYear.get(region).get(end)), end-start);
  total.benchmarkRegion = regionName;

  byRegionYear.forEach(function(k, v) {
    if (k === benchmarkRegion) return;
    if (k === region) return;
    var s = v.get(start), e = v.get(end);
    var label = labelF(e);
    var key = e.region_key_t;
    var type = e.region_type_t;
    var wage = wageF(e);
    var value = valF(e);
    var svalue = valF(s);
    if (svalue && value) {
      var change = simpleChange(svalue, value);
      var cagrVal = cagr(svalue, value, end-start);
    }

    result.push({
      id: k,
      label: label,
      key: key,
      type: type,
      value: value,
      wage: wage,
      change: change,
      cagr: cagrVal,
      start: svalue,
      end: value
    });
  });
  result = result.sort(function(a, b) { return d3.descending(a.value, b.value);});
  return {
    totals: total,
    results: result
  };
}

function getRegionName(client, type, code) {
  var qry = q({type_t:'region'}).and(regionQ(type, code)),
    query = client
      .createQuery().rows(1)
      .q(qry.q())
      .fl(['region_name_t', 'region_short_name_t', 'region_code_t']);
  return deferQuery(client, query, extractDocs(function(d) { return d; }));
}

function getRegionData(client, type, code) {
  var qry = q({type_t:'aggregate'}).and(regionQ(type, code)),
    query = client
      .createQuery()
      .q(qry.q())
      .sort('year_t desc')
      .fl(['region_name_t', 'region_short_name_t', 'region_code_t', 'emp_tl_rank_i', 'emp_tl']);
  return deferQuery(client, query, function(result) {
    return result.response.docs.filter(function(d){
      return d.emp_tl;
    }).shift();
  });
}

function loadSubregions(client, cb) {
  return function(req, res) {
    var type = req.params.type,
        code = req.params.code,
        start = req.params.start,
        end = req.params.end,
        subtype = req.params.subtype,
        indicator = dictVarByKey(req.params.indicator),
        regionName,
        region,
        benchmarkRegion = 'country/98',
        handler = function (docs) {
          var results = subregions(docs, indicator, start, end, regionName, benchmarkRegion, region);
          if (cb) { cb(results); }
          else { return results; }
        },
        ehandler = function(err) {
          throw err;
        };
    if (type === 'state') {
      return getRegionName(client, type, code)
          .then(function(regionNameResult) {
            regionName = regionNameResult.region_short_name_t || regionNameResult.region_name_t;
            region = type + '/' + regionNameResult.region_code_t;
            return regionsForSate(client, regionNameResult.region_code_t, subtype);
          })
          .then(function(regionIds) { return aggregatesForIds(client, type, code, regionIds, start, end, indicator.key); })
          .then(function(docs) {
            return Q.fcall(handler, docs);
          });
    } else {
      return getRegionName(client, type, code)
          .then(function(regionNameResult) {
            regionName = regionNameResult.region_short_name_t || regionNameResult.region_name_t;
            region = type + '/' + regionNameResult.region_code_t;
            return countiesForOther(client, type, code);
          })
        .then(function(countyIds) {
          if (subtype !== 'county') {
            return regionsForCounties(client, subtype, countyIds);
          } else {
            return Q(countyIds);
          }
        })
        .then(function(regionIds) {
          return aggregatesForIds(client, type, code, regionIds, start, end, indicator.key);
        })
        .then(function(docs) {
          return Q.fcall(handler, docs);
        })
        .catch(ehandler);
    }
  }
}

function captureSubregions(req, res, next) {
  var p = req.params,
      hash = '#/' + p.type + '/' + p.code + '/' + p.start + '/' + p.end + '/' + p.subtype + '/' + p.indicator + '/' + p.zoom,
      address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/subregions' + hash,
      filename = 'subregions_'+ [p.type, p.code, p.start, p.end, p.subtype, p.indicator, tsFormat(new Date())].join('_') + '.png',
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function subregionsCSV(client, cb) {
  return function (req, res) {
    var
      p = req.params,
      indicator = dictVarByKey(p.indicator),
      percFormat = d3.format('.2%'),
      numFormat = d3.format(indicator.format),
      filename = 'subregions_'+ [p.type, p.code, p.start, p.end, p.subtype, p.indicator, tsFormat(new Date())].join('_') + '.csv',
      loader = loadSubregions(client, function(results) {
          var json2csv;
          results.totals.label = results.totals.benchmark + " Avg";
          results.totals.start = '';
          results.totals.end = results.totals.value;
          results.results.push(results.totals);
          res.cache({maxAge: 0});
          res.set('Content-Type', 'text/csv');
          res.set('Content-Disposition','attachment; filename=' + filename );
          json2csv = new SimpleJson2Csv({
            fields: [
              { name: "label", header: results.totals.title + ", " + indicator.label + " Performance" },
              { name: "start", header:  indicator.label + ", " + p.start },
              { name: "end", header: indicator.label + ", " + p.end },
              { name: "change", header: "Change" },
              { name: "cagr", header: "Real Growth in " + indicator.label + " (CAGR)" },
              { name: "wage", header: "Annual Wages, " + p.end }
            ],
            data: results.results,
            transform: function(d) {
              d.end = d.end ? numFormat(d.end) : "";
              d.start = d.start ? numFormat(d.start) : "";
              d.wage = d.wage ? moneyFormat(d.wage): "";
              d.change = d.change ? numFormat(d.change) : "";
              d.cagr = d.cagr ? percFormat(d.cagr) : "";
              return d;
            }
          });
          // Add credit to end of file.
          results.results.push({label: sourceCreditText()});
          var chunk, output = '';
          while (null !== (chunk = json2csv.read())) {
            output += chunk.toString();
          }
          res.end(output);
        });
    return loader(req);
  };
}

function timeline(data, dataType, typeInfo, indicator) {
  var vObj = {
        region: {
          labelF: function(d) { return (d.sub_name_t ? d.sub_name_t : d.cluster_name_t);},
          byType: function(d) { return d.cluster_code_t + (d.sub_code_t ? '-' + d.sub_code_t : '');}
        },
        cluster:{
          labelF: function(d) { return (d.region_short_name_t);},
          byType: function(d) { return d.region_code_t;}
        }
      },
      valF = function (d) { return (d ? d[indicator.range_source || indicator.key] : 0)},
      byYear = function (d) { return +d.year_t;},
      first = function(ds) { return ds[0]; },
      byTypeYear = d3.nest().key(vObj[dataType].byType).key(byYear).rollup(first).map(data, d3.map),
      yearRange = d3.extent(data, byYear ),
      years = d3.range(yearRange[0], yearRange[1]+1),
      result = [],
      typeKey = data[0].key_t,
      rType = data[0].region_type_t,
      total = {type: typeInfo.capitalize(), typeKey:typeKey, regionType:rType, indicator: indicator, start:yearRange[0], end:yearRange[1]};

      /*byClusterYear = d3.nest().key(byCluster).key(byYear).rollup(first).map(data, d3.map),
      regionName = data[0].region_short_name_t,
      rKey = data[0].region_key_t,
      result = [],
      total = {region: regionName, regionKey: rKey, indicator: indicator, start:3000, end:0};*/

      if (dataType == 'cluster') {
        if (data[0].parent_key_t) {
          total.clusterName = (data[0].cluster_name_t ? data[0].cluster_name_t : null);
          total.subClusterName = (data[0].sub_name_t ? data[0].sub_name_t : null);
        } else {
          total.clusterName = (data[0].cluster_name_t ? data[0].cluster_name_t : null);
        }
        total.type = data[0].region_area_type_t;
      }
  total.region = (dataType == 'region')? data[0].region_name_t : data[0].cluster_name_t;

  if( dataType == 'region' ){
    if (typeInfo != 'traded' && typeInfo != 'local') {
      total.cluster_name = data[0].cluster_name_t;
      total.type = 'Subcluster';
    } else {
      total.type = typeInfo.capitalize() + ' Cluster';
    }
  }

  byTypeYear.forEach(function (cid, set) {
    var cluster;

    years.forEach(function(year, index){

      var item = _.filter( set, function(d){ return +d.year_t == +year});

      item = item[0] ?  item[0] : null;

      if (!cluster ) {
        cluster = {
          id: cid,
          values: [],
          lastVal: 0,
          lastYear: 0
        };
      }

      if( item ){
        cluster.key = cluster.key || item.key_t;
        cluster.label = cluster.label || vObj[dataType].labelF(item);
        cluster.parent_key = cluster.parent_key_t || item.parent_key_t || null;
        cluster.regionKey = item.region_key_t || null
      }

      var val = item ?  valF( item ) : cluster.lastVal;

      if (year > cluster.lastYear) {
        cluster.lastYear = year;
        cluster.lastVal = val;
      }

      cluster.values.push({
        year: year,
        value: val
      })
    })
    cluster.values.sort(function(a,b){return b.year - a.year;});

    result.push(cluster);
  });

  return {
    totals: total,
    results: result.sort(function(a, b) { return d3.descending(a.value, b.value);})
  };
}

function loadTimeline(client, cb) {

  return function(req) {
    var type = req.params.type,
        code = req.params.code,
        indicator = dictVarByKey(req.params.indicator),
        idQry = isNaN(+code)? {region_key_t: code}: {region_code_t: code},
        qry = q({type_t: 'cluster'})
          .and(clusterQ(req.params.cluster))
          .and({region_type_t: type})
          .and(idQry),
        query = client.createQuery().rows(10000).q(qry.q());
    return deferQuery(client, query, function (queryResult) {
      var results = timeline(queryResult.response.docs, 'region', req.params.cluster, indicator);

      if (cb) {
        cb(results);
      } else {
        return results;
      }
    });
  }
}

function loadTimelineCluster(client,cb) {
  return function(req) {
    var type = req.params.type,
        indicator = dictVarByKey( ( req.params.indicator || 'emp_tl' ) ),
        scQry = subClusterQ(req.params.subcluster),
        idQry = !isNaN(+req.params.cluster)? {cluster_code_t: req.params.cluster}
                : scQry.subcluster_b? {parent_key_t: req.params.cluster}
                : {key_t: req.params.cluster},
        qry = q({type_t: 'cluster'})
          .and(idQry)
          .and(scQry)
          .and({region_type_t: type /*, region_code_t: code*/}),
        query = client.createQuery().rows(10000).q(qry.q());
    return deferQuery(client, query, function (queryResult) {
      var results = timeline(queryResult.response.docs, 'cluster', req.params.type, indicator);

      if (cb) {
        cb(results);
      } else {
        results.results = results.results.slice(0, 100);
        return results;
      }
    });
  }
}

function timelineCSV(client){
  return function (req, res) {
    var p = req.params,
      loader = loadTimeline(client, function(results) {
        var json2csv,
            filename = 'timeline_'+ [p.type, p.code, p.cluster, p.indicator, tsFormat(new Date())].join('_') + '.csv';
        results.totals.label = results.totals.region + " " + results.totals.indicator.label + " Totals (" + results.totals.type + ")";
        results.results.push(results.totals);
        res.cache({maxAge: 0});
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition','attachment; filename=' + filename );
        var fields = [
            { name: "label", header: results.totals.type },
          ];
        for (var y = results.totals.start; y <= results.totals.end; y++) {
            fields.push({ name: y, header: y });
        }
        json2csv = new SimpleJson2Csv({
          fields: fields,
          data: results.results,
          transform: function(d) {
            if (! d.values) return d;
            for (var i = 0; i < d.values.length; i++) {
              d[d.values[i].year] = d.values[i].value;
            }
            return d;
          }
        });
        // Add credit to end of file.
        results.results.push({label: sourceCreditText()});
        json2csv.pipe(res);
      });
    return loader(req);
  };
}

function timelineClusterCSV(client){
  return function (req, res) {
    var p = req.params,
      loader = loadTimelineCluster(client, function(results) {
        var filename = 'timeline_'+ [p.type, p.code, p.cluster, p.indicator, tsFormat(new Date())].join('_') + '.csv';

        results.totals.label = results.totals.region + " " + results.totals.indicator.label + " Totals (" + results.totals.type + ")";
        results.results.push(results.totals);
        
        var fields = [
            { name: "label", header: results.totals.type },
          ];

        for (var y = results.totals.start; y <= results.totals.end; y++) {
            fields.push({ name: y, header: y });
        }
        exportCSV(res, filename, fields, results.results, function(d) {
          if (! d.values) return d;
          for (var i = 0; i < d.values.length; i++) {
            d[d.values[i].year] = d.values[i].value;
          }
          return d;
        });
      });
    return loader(req);
  };
}

function captureTimeline(req, res, next) {
  var p = req.params,
    hash = '#/' + p.type + '/' + p.code + '/' + p.cluster + '/' + p.indicator + "?controls=false",
    address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/timeline' + hash,
    filename = 'timeline_'+ [p.type, p.code, p.cluster, p.indicator, tsFormat(new Date())].join('_') + '.png',
    output = path.join(__dirname, filename),
    binPath = phantomjs.path,
    args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function captureTimelineCluster(req, res, next) {
  var p = req.params,
    hash = '#/' + p.cluster + '/' + p.subcluster + '/' + p.type + '/' + p.indicator + "?controls=false",
    address = 'http://' + baseUrl + (base || ':' + port) + '/report/cluster/timeline' + hash,
    filename = 'timeline_'+ [p.cluster, p.subcluster, p.type, p.indicator, tsFormat(new Date())].join('_') + '.png',
    output = path.join(__dirname, filename),
    binPath = phantomjs.path,
    args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function index(name) {
  return function(req, res, next) {
    var body = indexTpl({base: base, name: name});
    res.contentType='text/html';
    res.send(body);
    next();
  };
}

function chart(name) {
  return function(req, res, next) {
    var body = template({base: base, name: name});
    res.contentType='text/html';
    res.send(body);
    next();
  };
}

function mapChart(name) {
  return function(req, res, next) {
    var body;
    if (name == "organizationsMap") {
      body = orgMapTemplate({base: base, name: name});
    } else {
      body = mapTemplate({base: base, name: name});
    }

    res.contentType='text/html';
    res.send(body);
    next();
  };
}

function loadIndustries(client, cluster, subcluster) {
  var qry = {type_t: 'clusterData'},
      query;

  qry[( isNaN(+subcluster)? 'key_t' : 'sub_code_t')] = subcluster;
  qry[( isNaN(+cluster)? 'parent_key_t' : 'cluster_code_t')] = cluster;

  query = client.createQuery().rows(10000).q(qry);
  return deferQuery(client, query, function(queryResults) {
    var industries = {}, clusterName;
    queryResults.response.docs.forEach(function(cluster) {
      function _saveIndustries(c, key) {
        var codes_key = key + '_codes_txt', labels_key = key + '_labels_txt';

        if (!c[codes_key]) return;

        for (var i = 0; i < c[codes_key].length; i++) {
          industries[c[codes_key][i]] = c[labels_key][i];
        }
      }
      clusterName = cluster.sub_name_t || cluster.name_t;
      ['1997', '2002', '2007', '2012'].forEach(function(y) {
        var key = 'naics_' + y;
        _saveIndustries(cluster, key);
      });
    });
    return {industries: industries, clusterName: clusterName, query: {naics_t: '(' + Object.keys(industries).join(' OR ') + ')'}};
  });
}
function regionQ(type, code){
  if( isNaN(+code) ){
    return {region_type_t: type, key_t:code};
  }else{
    return {region_type_t: type, region_code_t:code};
  }
}
function loadRegionRecords(client, type, code, rQry) {

  var query = client.createQuery().rows(10000),
      baseQ = q(regionQ(type, code))
        .or(rQry);
        //.or({region_type_t:regionQ.region_type_t, region_code_t:regionQ.region_code_t});

  query.q(q({type_t: 'region'}).and(baseQ).q());
  return deferQuery(client, query, function(queryResults) {
    var regions = {}, regionName, regionCode;
    queryResults.response.docs.forEach(function (r) {
      regions[r.region_code_t] = r.region_short_name_t || r.region_name_t;
      regionCode = r.region_code_t;
      if ( (r.region_code_t == code  || r.key_t == code )&& r.region_type_t == type) {
        regionName = r.region_short_name_t || r.region_name_t;
      }
    });
    rQry = rQry.key_t? {region_code_t: regionCode, region_type_t: rQry.region_type_t} : rQry;
    return {query: rQry, regionName: regionName, regions:regions};
  });
}

function regions(client, type, code) {
  if (type !== 'state' &&  type !== 'county' && type != 'country') {
    return countiesForOther(client, type, code)
      .then(function(counties) {
        var countiesQ = '(' + counties.map(function(c) { return c.slice(-5);}).join(' OR ') + ')';
        return loadRegionRecords(client, type, code, {region_type_t: 'county', region_code_t:countiesQ} );
      });
  } else {
    return loadRegionRecords(client, type, code, regionQ(type, code) );
  }
}

function loadIndustryTable(client) {
  return function(req) {
    var type = req.params.type,
        code = req.params.code,
        cluster = req.params.cluster,
        subcluster = req.params.subcluster;

    return Q.all([loadIndustries(client, cluster, subcluster), regions(client, type, code)])
      .spread(function(industries, regions) {
        var qry = q({type_t: 'naics'})
          .and(industries.query)
          .and(regions.query),
          query = client.createQuery().rows(10000).q(qry.q());
        return deferQuery(client, query, function(queryResult) {
          var industriesTable = {}, minYear, maxYear;
          queryResult.response.docs.forEach(function(doc) {
            var key = doc.region_code_t + '/' + doc.naics_t;
            if (!industriesTable[key]) {
              industriesTable[key] = {
                region: regions.regions[doc.region_code_t],
                regionId: doc.region_code_t,
                industry: industries.industries[doc.naics_t],
                industryId: doc.naics_t
              }
            }
            industriesTable[key][doc.year_t] = {emp: doc.emp_tl, emp_sup: doc.empl_suppressed_tl, est: doc.est_tl, ap:doc.ap_tl};
            if  (!minYear || minYear > +doc.year_t) {
              minYear = +doc.year_t;
            }

            if (!maxYear || maxYear < +doc.year_t) {
              maxYear = +doc.year_t;
            }
          });
          return {regionName:regions.regionName, clusterName: industries.clusterName, yearRange: [minYear, maxYear], data:industriesTable};
        });
      });
  }
}

function loadIndustryTableCSV(client) {

}

function processMapData(data, cluster, subcluster, startYear, endYear, indicator, rangeIndicator) {
  var lq75, shares, share25, share90,
      byYear = ac('year_t'),
      byRegion = ac('region_code_t'),
      pullFirst = function(ds) { return ds[0]; },
      byYearByRegion = d3.nest().key(byYear).key(byRegion).rollup(pullFirst).map(data, d3.map),
      endByRegionId = byYearByRegion.get(endYear),
      startByRegionId = byYearByRegion.get(startYear),
      // fmt = d3.format(indicator.format),
      // rangeFmt = (indicator.range ? d3.format(rangeIndicator.format) : function(d) { return d;}),
      a;

  a = endByRegionId.values().sort(function(a,b){return d3.ascending(a.region_code_t, b.region_code_t);});

  if (indicator.key === 'specialization_tl') {
    shares = a.map(ac('cluster_emp_per_tf')).sort(d3.ascending);
    lq75 = d3.quantile(a.map(ac('lq_tf')).sort(d3.ascending), .75);
    share25 = d3.quantile(shares, .25);
    share90 = d3.quantile(shares, .90);

    a.forEach(function (d) {
      var highEmpSpec = false, highEmpShare = false;
      if (d.empt_tl <= 0) d.specialization = -1;

      if (d.emp_tl > 0) {
        if (d.lq_tf >= lq75 || (d.lq_tf > 1.0 && d.cluster_emp_per_tf >= share25)) {
          highEmpSpec = true;
        }

        if (d.cluster_emp_per_tf >= share90) {
          highEmpShare = true;
        }
      }

      if (highEmpShare && highEmpSpec) {
        d.specialization_tl = 1
      }
      else if (highEmpSpec) {
        d.specialization_tl = 0
      }
      else if (highEmpShare) {
        d.specialization_tl = -1
      }
      else {
        d.specialization_tl = NaN
      }
    });
  }

  if (indicator && indicator.range) {
    var changeFunc = function (sv, ev) {
      return ev - sv;
    };
    if (indicator.range_type === 'cagr') {
      changeFunc = function (sv, ev) {
        ev = Math.round(ev);
        sv = Math.round(sv);
        return  Math.pow((ev / sv), (1 / (+endYear - +startYear))) - 1;
      }
    }
    a.forEach(function (d) {
      var sd = startByRegionId.get(d.region_code_t),
        sv = (sd  ? sd[indicator.range_source] : 0),
        ev = d[indicator.range_source];

      d[indicator.key] = changeFunc(sv, ev);
    });
  }

  a.forEach(function(d) {
    if (cluster == 'all') {
      d.cluster_name_t = 'Economy Wide';
      d.cluster_code_t = 'all';
      d.sub_name_t = '';
      d.sub_code_t = '';
    } else {
      if (subcluster == 'all') {
        d.sub_name_t = 'All';
        d.sub_code_t = 'all';
      }
    }
    // d[indicator.key] = fmt(d[indicator.key]);
    // if (indicator.range) {
    //   d[indicator.range_source] = rangeFmt(d[indicator.range_source]);
    //   d['start_' + indicator.range_source] = rangeFmt(startByRegionId.get(d.region_code_t)[indicator.range_source]);
    // }
  });

  return {
    indicator: indicator,
    rangeIndicator: rangeIndicator,
    data: a
  };
}

function loadMapData(client, req, cb) {
  var type = req.params.type,
      start = req.params.start,
      end = req.params.end,
      cluster = req.params.cluster,
      subcluster = req.params.subcluster,
      indicator = req.params.indicator,
      ind = dictVarByKey(indicator),
      indKey = ind.range_source || ind.key,
      rangeIndicator = (ind.range ? dictVarByKey(ind.range_source) : undefined),
      qry = {region_type_t: type},
      fl = ['year_t', 'region_name_t','region_short_name_t', 'region_type_t', 'region_code_t', 'region_key_t',
            'cluster_name_t',  'cluster_code_t', 'sub_code_t', indKey],
      query;
      if (ind.calc && ind.calc_source) fl = fl.concat(ind.calc_source);
      if (ind.range && ind.range_source) fl.push(ind.range_source);

  if (start == end) {
    qry.year_t = end;
  } else {
    qry.year_t = '(' + start + ' OR ' + end + ')';
  }

  if (cluster == 'all') {
    qry.type_t = 'aggregate';
  } else {
    qry.type_t = 'cluster';
    qry.cluster_code_t = cluster;
    if (subcluster == 'all') {
      qry.subcluster_b = false;
    } else {
      qry.sub_code_t = subcluster;
    }
  }

  query = client.createQuery().rows(100000).q(qry).fl(fl);
  return deferQuery(client, query, function (queryResult) {
    var results = processMapData(queryResult.response.docs, cluster, subcluster, start, end, ind, rangeIndicator);
    if (cb) {
      cb(results);
    } else {
      return results;
    }
  });
}

function mapOrganizationCSV() {
  return function (req, res, next) {
    
    var deferred = Q.defer(),
      http = require('http'),
      p = req.params,
      path = (base || ':' + port) + '/content/organization',
      url = 'http://' + baseUrl + path,
      filename = 'map_organizations_'+ [p.type, p.cluster, tsFormat(new Date())].join('_') + '.csv',
      csvFields = [
          { name: "label", header: "Organization Name"},
          { name: "orgType", header: "Organization Type"},
          { name: 'sm_field_organization_size', header: "Organization Size"},
          { name: 'sm_field_established_year', header: "Established Year"},
          { name: 'sm_field_primary_activity', header: "Primary Activity"},
          { name: 'sm_field_secondary_activities', header: "Secondary Activities"},
          { name: 'sm_field_sector', header: "Sector"},
          { name: 'field_name', header: "Contact Name"},
          { name: 'field_email', header: "Contact Email"},
          { name: 'address_locality_s', header: "Address Locality"},
          { name: 'address_administrative_area_s', header: "Area Code"},
          { name: "address_postal_code_s", header: "Address Postal Code"},
          { name: 'geo_location', header: "Geo Location"},
        ],
      data = '', results = [], filtered = [];
      res.cache({maxAge: 0});
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition','attachment; filename=' + filename );
    
    http.get(url, function(response) {
      response.on('data', function (chunk) {
        data += chunk;
      });
      response.on('end', function(){
        results = JSON.parse(data);
        var l = results.length,
          filteredData = [];
        var orgType = Number(p.type) || 0;
        for (var i = 0; i < l; i++) {
          var row = results[i];
          if (p.cluster != 'all' && (!row.tm_field_clusters || row.tm_field_clusters.indexOf('clusterData/' + p.cluster) < 0)) {
            continue;
          }
          if (orgType != 0 && (!row.im_field_organization_type || row.im_field_organization_type.indexOf(orgType) < 0)) {
            continue;
          }
          row.orgType = row.sm_vid_Organization_Type ? row.sm_vid_Organization_Type[0] : '';
          row.field_email = row.sm_field_email ? row.sm_field_email.join(', ') : '';
          row.field_name = row.sm_field_first_name ? row.sm_field_first_name[0] : '';
          row.field_name += row.sm_field_last_name ? ' ' + row.sm_field_last_name[0] : '';
          row.sm_field_established_year = row.sm_field_established_year ? row.sm_field_established_year[0] : '';
          row.sm_field_organization_size = row.sm_field_organization_size ? row.sm_field_organization_size[0] : '';
          row.sm_field_primary_activity = row.sm_field_primary_activity ? row.sm_field_primary_activity[0] : '';
          row.sm_field_secondary_activities = row.sm_field_secondary_activities ? row.sm_field_secondary_activities.join(', '): '';
          row.sm_field_sector = row.sm_field_sector ? row.sm_field_sector[0] : '';
          row.geo_location = row.location_lat_s ? row.location_lat_s + ' ' + row.location_lng_s : '';
          filteredData.push(row);
        }

        var json2csv = new SimpleJson2Csv({
          fields: csvFields,
          data: filteredData
        });
        // Add credit to end of file.
        filteredData.push({label: sourceCreditText()});
        json2csv.pipe(res);

        deferred.resolve();
      });

    }).on('error', function(e) {
      console.log("Got error: " + e.message);
    });
    return deferred.promise;
  }
}

function loadMap(client, cb) {
  return function(req, res, next) {
    return loadMapData(client, req, function(results) {
      res.send(results.data);
    });
  };
}

function mapCSV(client) {
  return function(req, res, next) {
    var p = req.params,
        ind = dictVarByKey(p.indicator),
        indicatorName = p.indicator.substring(0,p.indicator.lastIndexOf('_')),
        years = (ind.range ? p.start + '-' + p.end : p.end),
        filename = 'map_'+ [p.type, years, indicatorName, tsFormat(new Date())].join('_') + '.csv',
        csvFields = [
          { name: "region_type_t", header: "Region Type"},
          { name: "region_code_t", header: "Region Code"},
          { name: "region_short_name_t", header: "Region Name"},
          { name: 'cluster_name_t', header: "Cluster Name"}
        ],
        loader;

    loader = loadMapData(client, req, function(results) {
      var ind = results.indicator, rind = results.rangeIndicator;
      if (p.indicator === 'specialization_tl') {
        ind = dictVarByKey('lq_tf');
      }

      if (p.cluster !== 'all') {
        csvFields.push({ name: 'cluster_code_t', header: "Cluster Code"});
        csvFields.push({ name: 'sub_name_t', header:"Subcluster Name"});
        csvFields.push({ name: 'sub_code_t', header:"Subcluster Code"});
      }

      if (ind.range) {
        csvFields.push({name: 'start_' + rind.key, header: rind.label + ' ' + p.start });
        csvFields.push({name: rind.key, header: rind.label + ' ' + p.end });
        csvFields.push({name: ind.key, header: ind.label + ' ' + p.start + '-' + p.end});
      } else {
        csvFields.push({name: ind.key, header: ind.label + ' ' + p.end});
      }

      exportCSV(res, filename, csvFields, results.data);
    });
    return loader;
  };
}
function captureJobCreation(req, res, next) {
  var p = req.params,
    hash = '#/' + p.type + '/' + p.code + '/' + p.start + '/' + p.end + '/' + p.cluster + "?controls=false",
    address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/jobcreation' + hash,
    filename = 'jobcreation_'+ [p.type, p.code, p.start, p.end, p.cluster, tsFormat(new Date())].join('_') + '.png',
    output = path.join(__dirname, filename),
    binPath = phantomjs.path,
    args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}
function captureMap(req, res, next) {
  var p = req.params,
    hash = '#/' + p.maptype + '/' + p.start + '/' + p.end + '/' + p.regiontype + '/' + p.regioncode + '/' + p.cluster + '/' + p.subcluster + '/' + p.indicator + '/' + p.zoom + "?controls=false",
    address = 'http://' + baseUrl + (base || ':' + port) + '/report/map' + hash,
    filename = 'map_'+ [p.regiontype, p.regioncode, p.cluster, p.subcluster, p.start, p.end, p.indicator, tsFormat(new Date())].join('_') + '.png',
    output = path.join(__dirname, filename),
    binPath = phantomjs.path,
    args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function innovation(data, region, benchmarkRegion, start, end, typeInfo, idNaN) {
  var labelF = function(d) { return (d.sub_name_t ? d.sub_name_t : d.cluster_name_t);},
    keyF = function(d) { return d.cluster_code_t + (d.sub_code_t ? '-' + d.sub_code_t : '');},
    valF = function (d) { return (d ? d.patent_count_tf : 0)},
    analysisF = function(v, b, t) { return ((v != b) ? v/b : v/t);},
    byRegion = function(d) { return d.region_type_t+'/'+ ( idNaN? d.region_key_t: d.region_code_t);},
    byYear = function (d) { return d.year_t;},
    first = function(ds) { return ds[0]; },
    byRegionYear = d3.nest().key(byRegion).key(byYear).key(keyF).rollup(first).map(data, d3.map),
    regionName = byRegionYear.get(region).get(start).values()[0].region_name_t,
    rKey = byRegionYear.get(region).get(start).values()[0].region_key_t,
    result = [],
    total = {region: regionName, regionKey: rKey, start: start, end: end, value: 0, change: 0, startTotal: 0, endTotal: 0},
    totalBenchmark = { start: d3.sum(byRegionYear.get(benchmarkRegion).get(start).values(), valF),
      end: d3.sum(byRegionYear.get(benchmarkRegion).get(end).values(), valF)};

  byRegionYear.get(region).get(start).forEach(function (k,v) {
    var startValue = valF(v),
      endValue = valF(byRegionYear.get(region).get(end).get(k)),
      benchmarkStart = valF(byRegionYear.get(benchmarkRegion).get(start).get(k)),
      benchmarkEnd = valF(byRegionYear.get(benchmarkRegion).get(end).get(k)),
      gainloss = endValue - startValue;

    if (Number(startValue) && Number(endValue)) {
      total.startTotal += startValue;
      total.endTotal += endValue;
      
      result.push({
        id: k,
        key: v.key_t,
        label: labelF(v),
        gainloss: gainloss,
        start: Math.round(startValue),
        end: Math.round(endValue),
        benchmarkStart: (startValue == benchmarkStart ? totalBenchmark.start : benchmarkStart),
        benchmarkEnd: (endValue == benchmarkEnd ? totalBenchmark.end : benchmarkEnd)
      });
    }
  });

  for (var i = 0; i < result.length; i++) {
    result[i].value = Math.round(result[i].end) / Math.round(result[i].benchmarkEnd);
    result[i].change = result[i].value - (Math.round(result[i].start) / Math.round(result[i].benchmarkStart));
  }

  total.value = Math.round(total.endTotal) / Math.round(totalBenchmark.end);
  total.change  = total.value - (Math.round(total.startTotal) / Math.round(totalBenchmark.start));
  total.type = typeInfo.capitalize() + ' Cluster';

  return {
    totals: total,
    results: result.sort(function(a, b) { return d3.descending(a.value, b.value);}).slice(0, 100)
  };
}

function loadInnovation(client,cb) {
  return function(req) {
    var type = req.params.type,
      code = req.params.code,
      region = type + '/' + code,
      benchmarkRegion = 'country/' + (isNaN(+code)?'united_states' : 98),
      start = req.params.start,
      end = req.params.end,
      idQry = isNaN(+code)? {region_type_t:type, region_key_t: code} : {region_type_t:type, region_code_t: code},
      qry = q({type_t: 'cluster'})
        .and({year_t: q(start).or(end)})
        .and(clusterQ(req.params.cluster))
        .and(q({region_type_t:'country', region_code_t:'98'}).or(idQry)),
      fields = ['id','patent_count_tf','region_type_t','region_key_t','region_name_t','region_code_t','cluster_name_t','cluster_code_t','year_t','key_t'],
      query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
    return deferQuery(client, query, function (queryResult) {
      var results = innovation(queryResult.response.docs, region, benchmarkRegion, start, end, req.params.cluster, isNaN(+code) );
      if (cb) { cb(results); }
      else { return results; }
    });
  };
}

function innovationTable(client,cb) {
  return function(req) {
    var type = req.params.type,
      code = req.params.code,
      region = type + '/' + code,
      length = req.params.length,
      idQry = isNaN(+code)? {region_type_t:type, region_key_t: code} : {region_type_t:type, region_code_t: code},
      qry = q({type_t: 'aggregate'}).and(idQry).and({patent_company_txt:'*', patent_company_counts_txt: '*'}),
      fields = ['patent_company_txt', 'patent_company_counts_txt', 'year_t', 'patent_count_tf', 'region_short_name_t'],
      query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
    return deferQuery(client, query, function (queryResult) {
      var companiesByName = {},
        companiesList = [],
        totals = { total: 0 },
        data = queryResult.response.docs;
      data.forEach(function (v, k) {
          var year = v.year_t;
          var l = v.patent_company_txt.length;
          for (var i = 0; i < l; i++) {
              var name = v.patent_company_txt[i],
                count = +v.patent_company_counts_txt[i];
              if (!companiesByName[name]) companiesByName[name] = { total: 0 };
              if (!companiesByName[name][year]) companiesByName[name][year] = 0;
              if (!totals[year]) totals[year] = 0;
              companiesByName[name].name = name;
              companiesByName[name][year] += count;
              totals[year] += count;
              totals['total'] += count;
              companiesByName[name].total += count;
          }
      });
      for (var name in companiesByName) {
        companiesList.push(companiesByName[name]);
      }
      companiesList.sort(function(a, b) { return d3.descending(a.total, b.total);})
      if (length) {
        companiesList = companiesList.slice(0, length);
      }

      var results = {
        results: companiesList,
        totals: totals
      };
      if (data.length) {
        results.regionName = data[0].region_short_name_t;
      }

      if (cb) { cb(results); }
      else { return results; }
    });
  };
}

function captureInnovation(req, res, next) {
  var p = req.params,
    hash = '#/' + p.type + '/' + p.code + '/' + p.start + '/' + p.end + '/' + p.cluster + '/' + p.zoom + "?controls=false",
    address = 'http://' + baseUrl + (base || ':' + port) + '/report/region/innovation' + hash,
    filename = 'innovation'+ [p.type, p.code, p.start, p.end, p.cluster, tsFormat(new Date())].join('_') + '.png',
    output = path.join(__dirname, filename),
    binPath = phantomjs.path,
    args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function innovationCSV(client) {
  return function(req, res) {
    var p = req.params,
      filename = 'innovation_'+ [p.type, p.code, p.start, p.end, p.cluster, tsFormat(new Date())].join('_') + '.csv',
      percentFormat = d3.format('.4%'),
      loader = loadInnovation(client, function(results) {
        var json2csv;
        results.totals.label = results.totals.region + " Total (" + results.totals.type + ")";
        results.results.push(results.totals);
        res.cache({maxAge: 0});
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition','attachment; filename=' + filename );
        json2csv = new SimpleJson2Csv({
          fields: [
            { name: "label", header: "Cluster Name" },
            { name: "value", header: "National Innovation Share, " + p.end },
            { name: "change", header: "Change in Innovation share," + p.start + '-' + p.end},
            { name: "start", header: "Innovation " + p.start },
            { name: "end", header: "Innovation " + p.end },
          ],
          data: results.results,
          transform: function(d) {
            d.value = isNaN(d.value) ? '' : percentFormat(d.value);
            d.change = isNaN(d.change) ? '' : percentFormat(d.change);
            d.start = isNaN(d.start) ? '' : Math.round(d.start);
            d.end = isNaN(d.end) ? '' : Math.round(d.end);
            return d;
          }
        });
        // Add credit to end of file.
        results.results.push({label: sourceCreditText()});
        json2csv.pipe(res);
      });
    return loader(req);
  };
}

function innovationCluster(data, start, end, idNaN) {
  var keyF = function(d) { return d.cluster_code_t + (d.sub_code_t ? '-' + d.sub_code_t : '');},
    valF = function (d) { return (d ? d.patent_count_tf : 0)},
    analysisF = function(v, b, t) { return ((v != b) ? v/b : v/t);},
    byRegion = function(d) { return d.region_type_t+'/'+ ( idNaN? d.region_key_t: d.region_code_t);},
    byYear = function (d) { return d.year_t;},
    first = function(ds) { return ds[0]; },
    byYearRegion = d3.nest().key(byYear).key(byRegion).rollup(first).map(data, d3.map),
    clusterName = data[0].cluster_name_t,
    result = [],
    total = {
      start: start,
      end: end,
      value: 0,
      change: 0,
      startTotal: 0,
      endTotal: 0,
      clusterKey: data[0].key_t,
      type: data[0].region_area_type_t.capitalize(),
      regionTypeKey: data[0].region_type_t,
      clusterName: clusterName
    };

  byYearRegion.get(start).forEach(function (k,v) {
    var startValue = valF(v),
      endValue = valF(byYearRegion.get(end).get(k)),
      gainloss = endValue - startValue;

    if (Number(startValue) && Number(endValue)) {
      total.startTotal += startValue;
      total.endTotal += endValue;

      result.push({
        id: k,
        label: v.region_short_name_t,
        key: v.region_key_t,
        code: v.region_code_t,
        type: v.region_type_t,
        gainloss: gainloss,
        start: startValue,
        end: endValue
      });
    }
  });

  for (var i = 0; i < result.length; i++) {
    result[i].value = result[i].end / total.endTotal;
    result[i].change = result[i].value - (result[i].start / total.startTotal);
  }

  // total.value = total.endTotal / totalBenchmark.end;
  total.change  = (total.endTotal - total.startTotal) / total.startTotal;

  return {
    totals: total,
    results: result.sort(function(a, b) { return d3.descending(a.value, b.value);})
  };

}

function loadInnovationCluster(client,cb) {
  return function(req) {
    var start = req.params.start,
        end = req.params.end,
        idQry = !isNaN(+req.params.cluster)? {cluster_code_t: req.params.cluster} : {key_t: req.params.cluster},
        qry = q({type_t: 'cluster'})
          .and({year_t: q(start).or(end)})
          .and({patent_count_tf:"*"})
          .and(idQry)
          .and({region_type_t:req.params.type}),
        fields = ['id','patent_count_tf','region_type_t','region_key_t','region_name_t','region_short_name_t','region_area_type_t','region_code_t','cluster_name_t','cluster_code_t','year_t','key_t'],
        query = client.createQuery().rows(10000).q(qry.q()).fl(fields);
    return deferQuery(client, query, function (queryResult) {
      var results = innovationCluster(queryResult.response.docs, start, end);
      if (cb) { cb(results); }
      else { 
        results.results = results.results.slice(0, 100);
        return results;
      }
    });
  };
}
function captureInnovationCluster(req, res, next) {
  var p = req.params,
      hash = '#/' + p.cluster + '/' + p.start + '/' + p.end + '/' + p.type + '/' + p.zoom + "?controls=false",
      address = 'http://' + baseUrl + (base || ':' + port) + '/report/cluster/innovation' + hash,
      filename = 'innovation'+ [p.cluster, p.start, p.end, p.type, tsFormat(new Date())].join('_') + '.png',
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}
function innovationCSVCluster(client) {
  return function(req, res) {
    var p = req.params,
        filename = 'innovation_'+ [p.type, p.code, p.start, p.end, p.cluster, tsFormat(new Date())].join('_') + '.csv',
        percentFormat = d3.format('.4%'),
        loader = loadInnovationCluster(client, function(results) {
          var fields= [
              { name: "label", header: "Region Name" },
              { name: "value", header: "National Innovation Share, " + p.end },
              { name: "change", header: "Change in Innovation share," + p.start + '-' + p.end},
              { name: "start", header: p.start + " Innovation" },
              { name: "end", header: p.end + " Innovation" },
            ];
          results.totals.label = results.totals.clusterName + " Total (" + results.totals.type + ")";
          results.results.push(results.totals);
          exportCSV(res, filename, fields, results.results, function(d) {
              d.value = d.value ? percentFormat(d.value) : '';
              d.change = d.change ? percentFormat(d.change) : '';
              d.start = d.start ? Math.round(d.start) : '';
              d.end = d.end ? Math.round(d.end) : '';
              return d;
          });
        });
    return loader(req);
  };
}

function compareRegions(comparison, data, key, start, end) {
  var result = [],
    byRegion = function(d) { return 'region/' + d.region_type_t +'/'+ d.region_code_t; },
    byCluster = function (d) { return d.key_t; },
    byYear = function (d) { return d.year_t; },
    first = function(ds) { return ds[0]; },
    keyF = function(d) { return d.cluster_code_t; },
    byClusterRegionYear = d3.nest().key(byCluster).key(byRegion).key(byYear).rollup(first).map(data, d3.map);

  byClusterRegionYear.forEach(function(ckey,cval) {
    var obj = { key: ckey, regions: [] };
    cval.forEach(function(rKey, rVal) {
      var yStart = rVal.get(start);
      obj.code = yStart.cluster_code_t;
      obj.label = yStart.cluster_name_t;
        var agg = comparison.aggs.get(rKey).get(start),
          region = {
            id: rKey,
            value: +yStart[key], 
            total: +agg[key]
          };
          region.percent = region.value / region.total;
      if (end) {
        var agg = comparison.aggs.get(rKey).get(end),
          yEnd =  rVal.get(end);
        region.total = +agg[key] - region.total;
        region.value = +yEnd[key] - region.value;
        region.percent = region.value / Math.abs(region.total);
      }
      obj.regions.push(region);
    });
    result.push(obj);
  });
  comparison.results = result;
  return comparison;
}

function getComparison(client, code) {
  var query = client.createQuery().rows(10000).q({type_t: 'compare', code_t: code})
    .fl(['id','code_t','name_t','regions_txt','region_count_tl','owner_t','clusters_txt','indicators_txt','timestamp']);
  return deferQuery(client, query, function (queryResult) {
    var comparison = { id: "", code: "", name: "", regions: [], region_data: [] };
    if (queryResult.response.docs.length) {
      var result = queryResult.response.docs[0];
      comparison = {
        id: result.id,
        code: result.code_t,
        name: result.name_t,
        regions: result.regions_txt.sort(),
        clusters: result.clusters_txt,
        indicators: result.indicators_txt,
        owner: result.owner_t
      };
      var query = client.createQuery().rows(10000).fl(['id','region_type_t','region_short_name_t','region_code_t','key_t','state_codes_txt'])
        .q('type_t:region AND id:(' + result.regions_txt.join(' OR ') + ')');
      return deferQuery(client, query, function (queryResult) {
        comparison.region_data = queryResult.response.docs.map(function(d) {
          return { 
            code: d.region_code_t,
            id: d.id,
            key: d.key_t,
            name: d.region_short_name_t,
            states: d.state_codes_txt,
            type: d.region_type_t
          };
        });
        return comparison;
      });
    }
    return comparison;
  });
}

function loadComparison(client,cb) {
  return function(req) {
    var p = req.params, 
      yearQry = p.end ? q({year_t: p.start}).or({year_t: p.end}) : q({year_t: p.start}),
      indicator = dictVarByKey(p.indicator);
    return getComparison(client, p.code)
      // Load Aggregates
      .then(function(comparison) {
        if (! p.indicator) return comparison;
        var key = indicator.range_source || indicator.key,
          qry = q(q(comparison.region_data.map(function(d) {return '(region_type_t:' + d.type + ' AND region_code_t:' + d.code + ')'; }).join(' OR ')))
            .and({type_t: 'aggregate'}).and(yearQry),
          query = client.createQuery().rows(10000).q(qry.q())
            .fl(['id','region_type_t','region_name_t','region_code_t','region_key_t', key, 'year_t']);
        return deferQuery(client, query, function(queryResult) {
          var data = queryResult.response.docs,
            byRegion = function(d) { return 'region/' + d.region_type_t +'/'+ d.region_code_t; },
            byCluster = function (d) { return d.key_t; },
            byYear = function (d) { return d.year_t; },
            first = function(ds) { return ds[0]; },
            byRegionYear = d3.nest().key(byRegion).key(byYear).rollup(first).map(data, d3.map);
          comparison.aggs = byRegionYear;
          return comparison;
        });
      })
      // Load Clusters
      .then(function(comparison) {
        if (! p.indicator) return comparison;
        
        var key = indicator.range_source || indicator.key,
          qry = q(q(comparison.region_data.map(function(d) {return '(region_type_t:' + d.type + ' AND region_code_t:' + d.code + ')'; }).join(' OR ')))
            .and({type_t: 'cluster' }).and(yearQry).and('key_t:(' + comparison.clusters.join(' OR ') + ')'),
          query = client.createQuery().rows(10000).q(qry.q())
            .fl(['id','region_type_t','region_name_t','region_code_t','region_key_t','key_t','code_t','cluster_code_t','cluster_name_t', key, 'year_t']);
        return deferQuery(client, query, function(queryResult) {
          comparison.indicator = indicator;
          var results = compareRegions(comparison, queryResult.response.docs, key, p.start, p.end);
          if (cb) { cb(results); }
          else { return results; }
        });
      });
  };
}

function loadRelatedClusters(client, cb) {

  return function(req) {

    var p = req.params,
      qry = q({type_t: 'clusterData', subcluster_b: false, traded_b: true }),
      fields = ['cluster_code_t', 'name_t', 'related', 'icon_t', 'key_t', 'short_name_t', 'short_name2_t'],
      year,
      query = client.createQuery().rows(10000).q(qry.q()).fl(fields),
      p1 = deferQuery(client, query, function (queryResult) {
        return queryResult.response.docs;
      });

    var queues = [p1];

    if (p.type && p.code) {
      var qry2 = q({
          subcluster_b: false,
          traded_b: true,
          type_t: 'cluster',
          region_key_t: p.code,
          region_type_t: p.type,
        }),
        fields2 = ['cluster_code_t', 'cluster_name_t', 'lq_tf', 'lq_tf_per_rank_i', 'emp_tl_rank_i', 'emp_tl', 'year_t', 'strong_b'],
        query2 = client.createQuery().rows(10000).q(qry2.q()).fl(fields2).sort('year_t asc'),
        p2 = deferQuery(client, query2, function (queryResult) {
          var data = queryResult.response.docs.filter(function(d){return d.lq_tf && d.emp_tl;}),
            byCluster = function(d) { return d.cluster_code_t;},
            byYear = function (d) { return d.year_t;},
            first = function(ds) { return ds[0]; },
            keyF = function(d) { return d.cluster_code_t; },
            byYear = d3.nest().key(byYear).map(data, d3.map),
            yearMax = year = (p.year ? p.year : d3.max(byYear.keys())),
            filteredData = data
              .filter(function(d){return d.year_t == yearMax})
              .sort(function(a,b){return d3.descending(a.lq_tf, b.lq_tf);});
            var byClusterData = filteredData.map(function(d, i) {
                  d.percentile = (i+1) * 100 / filteredData.length;
                  return d;
                });
            return d3.nest().key(byCluster).map(byClusterData, d3.map);
          });
      queues.push(p2);

      var p3 = getRegionData(client, p.type, p.code);
      queues.push(p3);
    }

    return Q.all(queues)
      .then(function(resp) {
        var all = resp[0],
          byCluster = resp[1],
          regionData = resp[2];
        
        var clusters = all.map(function(d) {
          var cluster = {
              code: d.cluster_code_t,
              name: d.name_t,
              short_name: d.short_name2_t !== '0' ? d.short_name2_t : d.short_name_t,
              key: d.key_t,
              icon: d.icon_t,
            };
          cluster.related = [];
          cluster.weak = [];
          // if (d.related_cluster_codes_txt) {
          //   cluster.related = d.related_cluster_codes_txt.map(function(r,i) {
          //     return {
          //       90: d.related_cluster_90_txt[i],
          //       avg: d.related_cluster_avg_txt[i],
          //       code: d.related_cluster_codes_txt[i],
          //       i20_90_min: d.related_cluster_i20_90_min_txt[i],
          //       i20_90: d.related_cluster_i20_90_txt[i],
          //       min: d.related_cluster_min_txt[i],
          //       name: d.related_cluster_names_txt[i],
          //       percentage: d.related_cluster_percentage_txt[i],
          //     };
          //   });
          // }
          if (p.type && p.code) {
            var c = byCluster.get(d.cluster_code_t);
            if (c && c.length) {
              c = c.shift();
              cluster.emp_tl = c.emp_tl;
              cluster.rank = c.emp_tl_rank_i; 
              cluster.lq_tf = c.lq_tf;
              cluster.lq_tf_per_rank_i = c.lq_tf_per_rank_i;
              cluster.percentile = c.lq_tf_per_rank_i * 100 / 51;
              // cluster.year_t = c.year_t;
              cluster.strong = c.strong_b;
            }
          }
          return cluster;
        });
        if (!p.type && !p.code) {
          return { clusters: clusters };
        }

        return {
          clusters: clusters,
          region: regionData,
          year: year,
        }
      });
  };


  function processFunc(results, cluster) {
    if (isNaN(cluster)) {
      return results;
    }
    return results.filter(function(c) {
      return c.cluster_code == cluster;
    });
  }
  return function(req) {
    var p = req.params, 
      yearQry = p.end ? q({year_t: p.start}).or({year_t: p.end}) : q({year_t: p.start}),
      indicator = dictVarByKey(p.indicator);

    var deferred = Q.defer();
    fs.readFile(path.join(__dirname, '../viz/json/relatedClusters.json'), {encoding: 'utf-8'},
      function(err, result) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(processFunc(JSON.parse(result), p.cluster));
        }
      });
    return deferred.promise;
  };
}

function exportCSV(response, filename, fields, data, transform) {
  var json2csv;
  response.cache({maxAge: 0});
  response.set('Content-Type', 'text/csv');
  response.set('Content-Disposition','attachment; filename=' + filename );
  // Add credit to end of file.
  data.push({label: sourceCreditText()});
  json2csv = new SimpleJson2Csv({
    "fields": fields,
    "data": data,
    "transform": transform
  });
  var chunk, output = '';
  while (null !== (chunk = json2csv.read())) {
    output += chunk.toString();
  }
  response.end(output);
}

function comparisonCSV(client){
  return function (req, res) {
    var p = req.params,
      loader = loadComparison(client, function(comparison) {
        var json2csv,
          csvoutput = [],
          filename = 'comparison_'+ [p.code, p.start, p.end, p.type, tsFormat(new Date())].join('_') + '.csv';
        comparison.results.forEach(function(c) {
          var row = { cluster: c.label };
          c.regions.forEach(function(r, i) {
            row[r.id + "_value"] = r.value;
            row[r.id + "_percent"] = percentFormat(r.percent);
          });
          csvoutput.push(row);
        });
        var fields = [{ name: "cluster", header: "Cluster Name" }];
        comparison.region_data.forEach(function(r) {
          fields.push({ name: r.id + "_value", header: r.name + " " + comparison.indicator.label });
          fields.push({ name: r.id + "_percent", header: r.name + " % of total region " + comparison.indicator.label });
        });
        // Add credit to end of file.
        csvoutput.push({cluster: sourceCreditText()});

        res.cache({maxAge: 0});
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition','attachment; filename=' + filename );
        json2csv = new SimpleJson2Csv({
          fields: fields,
          data: csvoutput
        });
        json2csv.pipe(res);
      });
    return loader(req);
  };
}

function captureUrl(req, res, next) {
  var p = req.params,
      url = decodeURIComponent(p.url),
      address = 'http://' + baseUrl + url,
      filename = p.name + '_' + tsFormat(new Date()) + '.png',
      output = path.join(__dirname, filename),
      binPath = phantomjs.path,
      args = [path.join(__dirname, '../toImage.js'), address, output];
  childProcess.execFile(binPath, args, function(err, stdout, stderr) {
    if (stderr) {
      console.error(stderr);
    } else {
      sendFile(output, filename, res, next);
    }
  });
}

function sourceCreditText() {
  return 'Source: U.S. Cluster Mapping Project (http://clustermapping.us/), Institute for Strategy and Competitiveness, Harvard Business School. Data Sources (http://clustermapping.us/content/data-sources-and-limitations)';
}

module.exports = function report_server(server, config) {
  var client = solr.createClient(config.solr);
  port = config.port || 4000;
  base = config.base || '';
  baseUrl = config.baseUrl || 'localhost';
  server.get('/report/relatedclusters', chart('relatedcluster'));
  server.get('/report/relatedclusters/:cluster', handleWith(loadRelatedClusters(client)));
  server.get('/report/relatedclusters/:cluster/:type/:code', handleWith(loadRelatedClusters(client)));
  server.get('/report/relatedclusters/:cluster/:type/:code/:year', handleWith(loadRelatedClusters(client)));
  server.get('/report/relatedclusters/:type/:code', handleWith(loadRelatedClusters(client)));

  server.get('/report/region/jobcreation', chart('jobcreation'));
  server.get('/report/region/jobcreation/:type/:code/:start/:end/:cluster', handleWith(loadJobCreation(client)));
  server.get('/report/region/jobcreation/:type/:code/:start/:end/:cluster/png', captureJobCreation);
  server.get('/report/region/jobcreation/:type/:code/:start/:end/:cluster/csv', handleWith(jobCreationCSV(client)));

  server.get('/report/region/employment', chart('employment'));
  server.get('/report/region/employment/:type/:code/:year/:cluster', handleWith(loadEmployment(client)));
  server.get('/report/region/employment/:type/:code/:year/:cluster/png', captureEmployment);
  server.get('/report/region/employment/:type/:code/:year/:cluster/csv', handleWith(employmentCSV(client)));

  server.get('/report/region/wages', chart('wages'));
  server.get('/report/region/wages/:type/:code/:year/:cluster', handleWith(loadWages(client)));
  server.get('/report/region/wages/:type/:code/:year/:cluster/png', captureWages);
  server.get('/report/region/wages/:type/:code/:year/:cluster/csv', handleWith(wagesCSV(client)));

  server.get('/report/region/specialization', chart('specialization'));
  server.get('/report/region/specialization/:type/:code/:start/:end/:cluster', handleWith(loadSpecialization(client)));
  server.get('/report/region/specialization/:type/:code/:start/:end/:cluster/png', captureSpecialization);
  server.get('/report/region/specialization/:type/:code/:start/:end/:cluster/png/:zoom', captureSpecialization);
  server.get('/report/region/specialization/:type/:code/:start/:end/:cluster/csv', handleWith(specializationCSV(client)));

  server.get('/report/region/scorecard', chart('scorecard'));
  server.get('/report/region/scorecard/:type/:code/:start/:end/:indicator/:filter', handleWith(loadScorecard(client)));
  server.get('/report/region/scorecard/:type/:code/:start/:end/:indicator/:filter/png', captureScorecard);
  server.get('/report/region/scorecard/:type/:code/:start/:end/:indicator/:filter/png/:zoom', captureScorecard);
  server.get('/report/region/scorecard/:type/:code/:start/:end/:indicator/:filter/csv', handleWith(scorecardCSV(client)));

  server.get('/report/region/spark', chart('spark'));
  server.get('/report/region/spark/:type/:code/:indicator', handleWith(loadSparkline(client)));
  server.get('/report/region/spark/:type/:code/:indicator/png', captureSparkline);
  server.get('/report/region/performance/:type/:code/:ext', capturePerformance);

  server.get('/report/region/subregions', chart('subregions'));
  server.get('/report/region/subregions/:type/:code/:start/:end/:subtype/:indicator', handleWith(loadSubregions(client)));
  server.get('/report/region/subregions/:type/:code/:start/:end/:subtype/:indicator/png', captureSubregions);
  server.get('/report/region/subregions/:type/:code/:start/:end/:subtype/:indicator/png/:zoom', captureSubregions);
  server.get('/report/region/subregions/:type/:code/:start/:end/:subtype/:indicator/csv', handleWith(subregionsCSV(client)));

  server.get('/report/region/timeline', chart('timeline'));
  server.get('/report/region/timeline/:type/:code/:cluster/:indicator', handleWith(loadTimeline(client)));
  server.get('/report/region/timeline/:type/:code/:cluster/:indicator/png', captureTimeline);
  server.get('/report/region/timeline/:type/:code/:cluster/:indicator/csv', handleWith(timelineCSV(client)));

  server.get('/report/cluster/jobcreation', chart('jobcreationCluster'));
  server.get('/report/cluster/jobcreation/:cluster/:subcluster/:start/:end/:type', handleWith(loadJobCreationCluster(client)));
  server.get('/report/cluster/jobcreation/:cluster/:subcluster/:start/:end/:type/png', captureJobCreationCluster);
  server.get('/report/cluster/jobcreation/:cluster/:subcluster/:start/:end/:type/csv', handleWith(jobCreationCSVCluster(client)));

  server.get('/report/cluster/employment', chart('employmentCluster'));
  server.get('/report/cluster/employment/:cluster/:subcluster/:year/:type', handleWith(loadEmploymentCluster(client, 50)));
  server.get('/report/cluster/employment/:cluster/:subcluster/:year/:type/png', captureEmploymentCluster);
  server.get('/report/cluster/employment/:cluster/:subcluster/:year/:type/csv', handleWith(employmentCSVCluster(client)));

  server.get('/report/cluster/wages', chart('wagesCluster')); // /report/cluster/wages#/1/1/2011/msa
  server.get('/report/cluster/wages/:cluster/:subcluster/:year/:type', handleWith(loadWagesCluster(client, 50)));
  server.get('/report/cluster/wages/:cluster/:subcluster/:year/:type/png', captureWagesCluster);
  server.get('/report/cluster/wages/:cluster/:subcluster/:year/:type/csv', handleWith(wagesCSVCluster(client)));

  server.get('/report/cluster/specialization', chart('specializationCluster'));
  server.get('/report/cluster/specialization/:cluster/:subcluster/:start/:end/:type', handleWith(loadSpecializationCluster(client)));
  server.get('/report/cluster/specialization/:cluster/:subcluster/:start/:end/:type/png', captureSpecializationCluster);
  server.get('/report/cluster/specialization/:cluster/:subcluster/:start/:end/:type/png/:zoom', captureSpecializationCluster);
  server.get('/report/cluster/specialization/:cluster/:subcluster/:start/:end/:type/csv', handleWith(specializationCSVCluster(client)));

  server.get('/report/region/industry', chart('industryTable'));
  server.get('/report/region/industry/:type/:code/:cluster/:subcluster', handleWith(loadIndustryTable(client)) );
  server.get('/report/region/industry/:type/:code/:cluster/:subcluster/csv', handleWith(loadIndustryTableCSV(client)));

  server.get('/report/cluster/innovation', chart('innovationCluster'));
  server.get('/report/cluster/innovation/:cluster/:start/:end/:type', handleWith(loadInnovationCluster(client)));
  server.get('/report/cluster/innovation/:cluster/:start/:end/:type/png', captureInnovationCluster);
  server.get('/report/cluster/innovation/:cluster/:start/:end/:type/png/:zoom', captureInnovationCluster);
  server.get('/report/cluster/innovation/:cluster/:start/:end/:type/csv', handleWith(innovationCSVCluster(client)));
  
  server.get('/report/region/innovation', chart('innovation'));
  server.get('/report/region/innovation/:type/:code/:start/:end/:cluster', handleWith(loadInnovation(client)) );
  server.get('/report/region/innovation/:type/:code/:start/:end/:cluster/csv', handleWith(innovationCSV(client)));
  server.get('/report/region/innovation/:type/:code/:start/:end/:cluster/png', captureInnovation);
  server.get('/report/region/innovation/:type/:code/:start/:end/:cluster/png/:zoom', captureInnovation);

  server.get('/report/region/innovationtable', chart('innovationTable'));
  server.get('/report/region/innovation/:type/:code/', handleWith(innovationTable(client)) );
  server.get('/report/region/innovation/:type/:code/:length', handleWith(innovationTable(client)) );

  server.get('/report/cluster/timeline', chart('timeline'));
  server.get('/report/cluster/timeline/:cluster/:subcluster/:type/:indicator', handleWith(loadTimelineCluster(client)));
  server.get('/report/cluster/timeline/:cluster/:subcluster/:type/:indicator/png', captureTimelineCluster);
  server.get('/report/cluster/timeline/:cluster/:subcluster/:type/:indicator/csv', handleWith(timelineClusterCSV(client)));

  server.get('/report/map/organization/', mapChart('organizationsMap'));
  server.get('/report/map/organization/:region/:cluster/:type/csv', handleWith(mapOrganizationCSV()));
  server.get('/report/map/', mapChart('map'));
  server.get('/report/map/:type/:start/:end/:cluster/:subcluster/:indicator', handleWith(loadMap(client)));
  server.get('/report/map/:type/:start/:end/:cluster/:subcluster/:indicator/csv', handleWith(mapCSV(client)));
  server.get('/report/map/:maptype/:start/:end/:regiontype/:regioncode/:cluster/:subcluster/:indicator/png', captureMap);
  server.get('/report/map/:maptype/:start/:end/:regiontype/:regioncode/:cluster/:subcluster/:indicator/:zoom/png', captureMap);

  server.get('/report/region/compare', chart('compare'));
  server.get('/report/region/compare/:code', handleWith(loadComparison(client)) );
  server.get('/report/region/compare/:code/:key/:indicator/:start', handleWith(loadComparison(client)));
  server.get('/report/region/compare/:code/:key/:indicator/:start/:end', handleWith(loadComparison(client)));
  server.get('/report/region/csv/compare/:code/:key/:indicator/:start', handleWith(comparisonCSV(client)));
  server.get('/report/region/csv/compare/:code/:key/:indicator/:start/:end', handleWith(comparisonCSV(client)));

  server.get('/report/capture/:name/:url', captureUrl);
  server.get('/index', index('breadcrumb'));
};
