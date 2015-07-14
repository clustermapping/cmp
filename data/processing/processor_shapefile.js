var shapefile = require("shapefile"),
  processor_base = require('./processor');

function create_shapefile_processor(importer, persister) {
  var processor = processor_base(importer, persister);
  return {
    run: function (file, cb) {
      processor.start(function () {
        shapefile.read(file, {encoding: null, "ignore-properties": false}, function (error, collection) {
          if (error) return cb(error);
          collection.features.forEach(function (f, i) {
            processor.process(f, i);
          });
          processor.end(cb);
        });
      });
    }
  }
}

module.exports = create_shapefile_processor;