var fs = require("fs"),
  processor_base = require('./processor');

function create_pipefile_processor(importer, persister) {
  var processor = processor_base(importer, persister);
  return {
    run: function (file, cb) {
      processor.start(function () {
        fs.readFile(file, 'utf-8', function(err, data){
          var lines = data.split(/\r?\n/),
              index  = 0,
              header = [];
          lines.forEach(function (l) {
            var parts = l.trim().split('|'), d = {};
            if (header.length == 0) {
              parts.forEach(function(h) { header.push(h); })
            } else {
              parts.forEach(function(v, i) {
                d[header[i]] = v;
              });
              processor.process(d, index++);
            }
          });
          processor.end(cb);
        });
      });
    }
  }
}

module.exports = create_pipefile_processor;
