var zip = function (persister) {
  var _delegate = function(target, action, def) {
    return function () {
      if (target && target[action]) {
        return target[action].apply(persister, arguments);
      } else {
        return def;
      }
    }
  };

  return {
    persist: function(data) {
      var region = persister.get(data.countyId), regions = persister.getRev(data.stateId, data.countyId);
      if (region) regions.push(region);
      regions.forEach(function(r) {
        if (r === undefined) {
          console.log("Undef", data, regions);
        }
        if (!r.zip_codes_txt) {r.zip_codes_txt = []; }
        r.zip_codes_txt.push(data.zip);
      });
    },

    end: _delegate(persister, 'end'),
    should_drain: _delegate(persister, 'should_drain'),
    drain: _delegate(persister, 'drain')
  }
};

module.exports = zip;
