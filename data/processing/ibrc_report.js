var fs = require('fs'),
    pipeFile = require('./processor_pipe_file'),
    ibrcVars = require('./ibrc_meta_mapper'),
    cache = require('./simple_cache_persister');


var dataDir = process.argv[2];
var outputDir = process.argv[3] || 'output';
var ibrcMeta  = 'ibrc/meta_data.csv';
var ibrcState  = 'ibrc/state_data.csv';
var ibrcCounty  = 'ibrc/county_data.csv';
var ibrc_vars = cache('ibrc_vars');

var dataFile = function (file) {
  return dataDir + '/' + file;
};

var sendToFile = function(file) {
  return function(cache, clear,  cb) {
    cache.writeToStream(fs.createWriteStream(file), clear, cb);
  }
};

var outFile = function (file) {
  return outputDir + '/' + file;
};

var county_ids = {};
var state_ids = {};

var state_builder = {
  transform: function(row) {
    if (isNaN(+row.statefips) || isNaN(+row.countyfips)) return;
    if (+row.statefips != 0) {
      state_ids[row.statefips] = 1;
      if (row.countyfips != '000') {
        county_ids[row.statefips + row.countyfips] = 1;
      }
    }
  }
};

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

var ibrc_updater = {
  transform: function(row) {
    var v = ibrc_vars.get(row.id);
    if (!v) {
      console.log('could not find var for', row.id);
      return;
    }
    if (isNaN(+row.statefips) || isNaN(+row.countyfips)) return;

    if (v.counties == undefined) {v.counties = 0; v.county_ids = clone(county_ids);}
    if (v.states == undefined) { v.states = 0;v.state_ids = clone(state_ids); }
    if (v.years == undefined) {v.years = {};}
    v.years[row.year] = 1;

    if (row.countyfips && row.countyfips != '000') {
      if (v.county_ids[row.statefips+row.countyfips]) {
        v.counties++;
        delete v.county_ids[row.statefips+row.countyfips];
      }
    } else if (row.statefips != '0') {
      if (v.state_ids[row.statefips]) {
        v.states++;
        delete v.state_ids[row.statefips];
      }
    }
  }
};

pipeFile(ibrcVars(), ibrc_vars).run(dataFile(ibrcMeta), function() {
  pipeFile(state_builder, ibrc_vars).run(dataFile(ibrcState), function() {
    pipeFile(ibrc_updater, ibrc_vars).run(dataFile(ibrcState), function () {
      pipeFile(state_builder, ibrc_vars).run(dataFile(ibrcCounty), function () {
        pipeFile(ibrc_updater, ibrc_vars).run(dataFile(ibrcCounty), function () {
          console.log('"ID","Name","State Count","Missing Count","County Count","Missing Count","Years","Missing States"');
          ibrc_vars.forEach(function (k, v) {
            var data = [v.id, v.name, v.states,
              (v.state_ids?Object.keys(v.state_ids).length:undefined),
              v.counties,
              (v.county_ids ? Object.keys(v.county_ids).length:undefined),
              (v.years?Object.keys(v.years).join(';'):undefined),
              (v.state_ids?Object.keys(v.state_ids).join(';'):undefined)];
            console.log('"' + data.join('","') + '"');
//            console.log(JSON.stringify(v, null, '  '));
          });
        });
      });
    });
  });
});


