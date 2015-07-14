"use strict";
var env = process.env.NODE_ENV || 'development',
  config = require('./config')[env],
  d3 = require('d3'),
  solr = require('solr-client'),
  custom = require('./custom');
function loadProcessingRegions(client, processFunc) {
  var name = process.argv[2] || '*';
  var q = {type_t: 'region', region_type_t:  'custom', region_name_t: name};
  var query = client.createQuery().q(q).sort({name_t: 'ASC'}).rows(100000);

  var startTime = process.hrtime();
  // var deferred = Q.defer();
  client.search(query, function(err, result) {

    console.log('Starting process ', result.response.docs.length, 'regions');
    var docs = result.response.docs.sort(function (a,b){ return d3.ascending(a.region_count_tl, b.region_count_tl) });

    processNext(docs);

    function processNext(docs) {
      var d = docs.shift();
      if (! d) return;
      console.log(d.name_t, d.region_count_tl);
      if (d.region_count_tl > 500 || d.region_count_tl == 0) {
        processNext(docs);
        return;
      }
      var name = d.name_t.slice(0, d.name_t.indexOf(' by ' + d.owner_t)),
        spec = {
          name: name,
          username: d.owner_t,
          owner: d.owner_t,
          regions: d.regions_txt
        };
      console.log('Processing ', d.name_t, d.region_code_t, "(" + d.region_count_tl + " counties)");
      
      custom(spec, function(a) {
          console.log('Progress: ', a);
        }, function() {
          processNext(docs);
        });
    }

  });
}

var client = solr.createClient(config.solr);
loadProcessingRegions(client);

return;
