var patentCompany = function (persister, region_cache) {
  var _delegate = function(target, action, def) {
    return function () {
      if (target && target[action]) {
        return target[action].apply(persister, arguments);
      } else {
        return def;
      }
    }
  },
    _add_to_agg = function(aggregate, data) {
      if (!aggregate['patent_count_tf'] || !aggregate['patent_company_txt'] || !aggregate['patent_company_counts_txt']) {
        aggregate['patent_count_tf'] = 0;
        aggregate['patent_company_txt'] = [];
        aggregate['patent_company_counts_txt'] = []
      }
      aggregate['patent_count_tf'] += data.value;
      aggregate['patent_company_txt'].push(data.company);
      aggregate['patent_company_counts_txt'].push(data.value);
    };

  return {
    persist: function(data) {

      var aggregate = persister.get(data.id),
        regions = region_cache.getRev(data.region);

      regions.push(region_cache.get(data.state));
      regions.push(region_cache.get(data.country));

      if (aggregate) {
        _add_to_agg(aggregate, data);
      } else {
        console.log('No aggregate for', data.id);
      }

      regions.forEach(function(region) {
        if (region) {
          var aid = 'aggregate/' + region.region_type_t + '/' + region.region_code_t + '/' + data.year;
          aggregate = persister.get(aid);
          if (aggregate) {
            _add_to_agg(aggregate, data);
          }
        }
      });
    },

    end: _delegate(persister, 'end'),
    should_drain: _delegate(persister, 'should_drain'),
    drain: _delegate(persister, 'drain')
  }
};

module.exports = patentCompany;

