var csvParse = require("csvtojson").core.Converter,
  processor_base = require('./processor');

function create_csv_processor(importer, persister) {
    var processor = processor_base(importer, persister);
    return {
        run: function(file, cb) {
            var parser = new csvParse(false);

            parser.on('record_parsed', function(row, o_row, i){
                processor.process(row, i);
            });

            parser.on('end_parsed', function() {
                processor.end(cb);
            });

            processor.start(function start() {
                parser.from(file);
            });
        }
    }
}

module.exports = create_csv_processor;