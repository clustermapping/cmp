define(['d3', 'queue'], function(d3, queue) {
  var dataStore = {};
  var requestedQueue = [];
  var callbackQueue = [];
  var callOut = false;

  DataLib = function() {

  };

  DataLib.prototype.request = function(dataLoad, cb) {
    var returnData = [],
        dataToLoad = [],
        i,
        foundAllInCache;

    if (dataLoad === undefined) {
      return;
    }

    if (!(dataLoad instanceof Array)) {
      dataLoad = [dataLoad];
    }

    // Loop through each piece of external data, attempt to 
    // match to something already loaded.
    
    dataToLoad = this._loadRequestsFromCache(dataLoad, cb);

    if (dataToLoad !== undefined) {
      // Need to request our data.
      callbackQueue.push({
        calls: dataLoad,
        callback: cb
      });

      for (i in dataToLoad) {
        if (requestedQueue.indexOf(dataToLoad[i]) == -1) {
          requestedQueue.push(dataToLoad[i]);
        }
      }

      if (callOut === false) {
        callOut = true;
        this._loadRequestsFromRequestQueue();
      }
    }
  };

  // returns array of requests that aren't in the cache if cb wasn't fired, otherwise undefined.
  DataLib.prototype._loadRequestsFromCache = function(requests, cb) {
    var foundAllInCache = true,
        returnData = [],
        dataToLoad = [];

    for (var i in requests) {
      if (dataStore[requests[i]] !== undefined) {
        returnData.push(dataStore[requests[i]]);
      } else {
        foundAllInCache = false;
        dataToLoad.push(requests[i]);
      }
    }

    if (foundAllInCache === true) {
      cb.apply(null, returnData);
      return undefined;
    }

    return dataToLoad;
  };

  DataLib.prototype._loadRequestsFromRequestQueue = function() {
    var _queue = queue(3),
        dataToLoad = [],
        item,
        _this = this;

    for (var i = 0; i < 3; i++) {
      item = requestedQueue[i];
      if (item !== undefined) {
        dataToLoad.push(item);
      } else {
        requestedQueue.pop();
      }
    }

    for (i in dataToLoad) {
      _queue.defer(d3.json, dataToLoad[i]);
    }

    _queue.awaitAll(function(err, results) {
      if (err === null) {
        for (var i in results) {
          dataStore[dataToLoad[i]] = results[i];
          var requestedIndex = requestedQueue.indexOf(dataToLoad[i]);
          if (requestedIndex !== -1) {
            requestedQueue.splice(requestedIndex, 1);
          }
        }

        for (i in callbackQueue) {
          d = _this._loadRequestsFromCache(callbackQueue[i].calls, callbackQueue[i].callback);
          if (d === undefined) {
            callbackQueue[i] = null;
          }
        }

        callbackQueue = callbackQueue.filter(function(element) {return element !== null;});

        if (requestedQueue.length > 0) {
          _this._loadRequestsFromRequestQueue();
        }
        else {
          callOut = false;
        }
      }
    });
  };

  return DataLib;
});
