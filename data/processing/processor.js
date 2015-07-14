function create_processor(importer, persister) {
  var _handle_callback = function(cb) {
        if (cb) {
          process.nextTick(cb);
        }
      },
      _delegate = function(target, fname, def) {
        return function(cb) {
          if (target && target[fname]) {
            return target[fname](function () {
              _handle_callback(cb);
            });
          } else {
            _handle_callback(cb);
            return def;
          }
        }
      };

  return {
    end: function _processor_end(cb) {
      this.drain(function () {
        if (persister && persister.end) {
          persister.end();
        }
        _handle_callback(cb);
      });
    },

    should_drain: _delegate(persister, 'should_drain', false),
    drain: _delegate(persister, 'drain'),
    start: _delegate(persister,'prepare'),

    process: function _processor_process(row, i) {
      var id = (importer.getId ? importer.getId(row, i) : i),
          data;

      if (!importer.filter || importer.filter(row, i, id)) {
        data =  importer.transform(row, i, id);
        if (persister && data) {
          if (!Array.isArray(data)) {
            data = [data];
          }
          for (var i = data.length -1;  i >= 0;  --i) {
            persister.persist(data[i]);
          }

          if (this.should_drain()) {
            this.drain();
          }
        }
      }

      return data;
    }
  };
}

module.exports = create_processor;