var ibrc = function (persister, region_cache) {
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

      var aggregate = persister.get(data.id),
          regions = region_cache.getRev(data.region),
          key = data.key + '_tf', akey,
          val = data.value, aval;

      if (aggregate) {
        aggregate[key] = val;
        if (key == 'poverty_rate_tf' || key == 'total_population_tf'
            && (aggregate.poverty_rate_tf && aggregate.total_population_tf)) {
          akey = 'persons_in_poverty_tf';
          aval = (aggregate.poverty_rate_tf / 100) * aggregate.total_population_tf;
          aggregate[akey] = aval;
        }
      } else {
        console.log('No aggregate for', data.id);
      }

      regions.forEach(function(region) {
        var aid = 'aggregate/' + region.region_type_t + '/' + region.region_code_t + '/' + data.year;
        aggregate = persister.get(aid);
        if (aggregate) {
          if (!aggregate[key]) {
            aggregate[key] = 0;
          }
          aggregate[key] += val;
          if (akey) {
            if (!aggregate[akey]) {
              aggregate[akey] = 0;
            }
            aggregate[akey] += aval;
          }
        }
      });
    },

    end: _delegate(persister, 'end'),
    should_drain: _delegate(persister, 'should_drain'),
    drain: _delegate(persister, 'drain')
  }
};

module.exports = ibrc;

