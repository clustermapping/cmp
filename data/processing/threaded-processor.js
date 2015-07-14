var Worker = require('webworker-threads').Worker;

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

  var persist_worker = new Worker(function(){
    onerror = function(e) {
      console.log(e);
    };
    onmessage = function(event) {
      console.log(persister == null);
      console.log('message', persister);
      persister.persist(event.data);
      console.log('after persist');
      if (persister.should_drain()) {
        persister.drain();
      }
      console.log('done');
    };
  });


  return {
    end: function _processor_end(cb) {
      persist_worker.terminate();
      persist_worker = null;
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
          persist_worker.postMessage(data);
        }
      }

      return data;
    }
  };
}

module.exports = create_processor;