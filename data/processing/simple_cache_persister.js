var d3 = require('d3'),
  cf = d3.format(',g');

var cache = function (name, reverseFunc) {
  var _cache_data = {},
    _reverse_data = {},
    _count = 0,
    _last_drain = 0;

  return {
    size: function() {
        return Object.keys(_cache_data).length;
    },
    data: function() {
      var result = [];
      Object.keys(_cache_data).forEach(function (k) {
        result.push(_cache_data[k]);
      });
      return result;
    },
    get: function (id) {
      return _cache_data[id];
    },

    getRev: function () {
      var result = [], revIds = Array.prototype.slice.call(arguments, 0);
      revIds.forEach(function(revId) {
        var rev = _reverse_data[revId];
        if (rev !== undefined) {
          result = result.concat(Object.keys(rev).map(function(k){return rev[k]}));
        }
      });
      return result;
    },

    forEach: function(cb) {
      Object.keys(_cache_data).forEach(function (k, i) {
        cb(k, _cache_data[k], i);
      });
    },

    writeToStream: function(writer, clear, cb) {
      var  first = true, keys = Object.keys(_cache_data), i = 0;

      function write() {
        var ok = true;
        do {
          if (i > 0 && i % 100000 == 0) {
            console.log('written:', i);
          }
          if (i == keys.length) {
            writer.end('\n]', 'utf-8');
            console.log('written:', i);
          } else {
            if (first) {
              writer.write('[\n',  'utf-8');
              first = false;
            } else {
              writer.write(',\n',  'utf-8');
            }
            ok = writer.write(JSON.stringify(_cache_data[keys[i]],  'utf-8'));
          }
          i++;
        } while ( i <= keys.length && ok);
        if (i <= keys.length) {
          writer.once('drain', write);
        }
      }

      writer.once('finish', function () {
        writer = undefined;
        if (clear) {
//          _cache_data = undefined;
//          _reverse_data = undefined;
        }
        if (cb) {
          process.nextTick(cb)
        }
      });

      write();
    },

    persist: function (data) {
      if (!data || !data.id) return;
      _cache_data[data.id] = data;
      if (reverseFunc) {
        var revIds = reverseFunc(data);
        revIds.forEach(function (revId) {
          if (!_reverse_data[revId]) _reverse_data[revId] = {};
          _reverse_data[revId][data.id] = data;
        });
      }
      _count++;
    },

    end: function (cb) {
      console.log(name, "End, processed", cf(_count), "entries");
      if (cb) {
        process.nextTick(cb);
      }
    },

    should_drain: function () {
      return (_count > 0 && _count % 100000 == 0 && _count !== _last_drain);
    },

    drain: function (cb) {
      _last_drain = _count;
      console.log(name, "processed", cf(_count), "entries");
      if (cb) {
        process.nextTick(cb);
      }
    }
  }
};


module.exports = cache;
