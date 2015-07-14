var patentCluster = function (persister, region_cache) {
  var _delegate = function(target, action, def) {
      return function () {
        if (target && target[action]) {
          return target[action].apply(persister, arguments);
        } else {
          return def;
        }
      }
    },
    _add_to_cluster = function(cluster, data) {
      if (!cluster['patent_count_tf']) {
        cluster['patent_count_tf'] = 0;
      }
      cluster['patent_count_tf'] += data.value;
    };

  return {
    persist: function(data) {

      var cluster = persister.get(data.id),
        regions = region_cache.getRev(data.region);
      regions.push(region_cache.get(data.state));
      regions.push(region_cache.get(data.country));

      if (cluster) {
        _add_to_cluster(cluster, data);
      } else {
        console.log('No cluster for', data.id);
      }

      regions.forEach(function(region) {
        if (region) {
          var cid = 'cluster/' + region.region_type_t + '/' + region.region_code_t + '/' + data.cluster_code + '/' + data.year;
          cluster = persister.get(cid);
          if (cluster) {
            _add_to_cluster(cluster, data);
          }
        }
      });
    },

    end: _delegate(persister, 'end'),
    should_drain: _delegate(persister, 'should_drain'),
    drain: _delegate(persister, 'drain')
  }
};

module.exports = patentCluster;

