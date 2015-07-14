var area = function (persister) {
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
      var area = persister.get(data.id),
          stateCode = data.state_codes_txt[0];
      if (area) {

        data.regions_txt.forEach(function(r) {
          area.regions_txt.push(r);
        });
        if (area.state_codes_txt.indexOf(stateCode) == -1) {
          area.state_codes_txt.push(stateCode);
        }
        area.region_count_tl += data.region_count_tl;
        persister.persist(area);
      } else {
        persister.persist(data);
      }
    },

    end: _delegate(persister, 'end'),
    should_drain: _delegate(persister, 'should_drain'),
    drain: _delegate(persister, 'drain')
  }
};

module.exports = area;
