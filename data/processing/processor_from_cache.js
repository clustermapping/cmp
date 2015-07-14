var processor_base = require('./processor');

function create_cache_processor(importer, persister) {
  var processor = processor_base(importer, persister);
  return {
    run: function (cache, cb) {
      processor.start(function () {
        cache.forEach(function (key, obj, i) {
          processor.process(obj, i);
        });
        processor.end(cb);
      });
    }
  }
}

module.exports = create_cache_processor;