var Worker = require('webworker-threads').Worker;
//reader -> mapper -> reducer -> persister
// pipeline(csv, mapper, reducer, persister);
function pipeline() {
  var workers=[], wires = [], cb;
  var last = {
    thread:{id:'last'},
    postMessage:function(data) {
        if (cb) {
          cb(null,data);
        }
    }
  };
  var handleError = function(e) {
    if (cb) {
      cb(e, null);
    }
  };
  function buildWires(ws) {
    var cur, prev, i;
    for (i = ws.length-1; i >=0; i--) {
      cur = ws[i];
      workers.push(cur);
      cur.onerror = handleError;
      if (prev){
        wires.unshift(wire(cur, prev));
      } else {
        wires.unshift(wire(cur, last));
      }
      prev = cur;
    }
  }
  buildWires(arguments);


  function _pipeline(data, callback) {
    cb = callback;
    wires[0](data);
  }
  p.close = function _pipeline_close(closeAll) {
    if (closeAll) {
      workers.forEach(function (w) {
        w.terminate();
      });
    }
    workers = null;
    wires = null;
    cb = null;
  };
  return _pipeline;
}

function wire(from, to) {
  if (to) {
    from.onmessage = function(ev) {
      to.postMessage(ev.data);
    }
  }
  return function(data) {
    from.postMessage(data);
  }
}

var first = new Worker(function() {
  onmessage = function(event) {
    postMessage(event.data + " 1");
  }
});

var second = new Worker(function() {
  onmessage = function(event) {
    postMessage(event.data + " 2");
  }
});

var third = new Worker(function() {
  onmessage = function(event) {
    postMessage(event.data + " 3");
  }
});

var t = pipeline(first,second,third);
t("test", function(err, data) {
  console.log('done:', data);
  t.close();
});