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
      var clusterId = 'clusterData/' + data.cluster_code_t,
          cluster = persister.get(clusterId);
      if (cluster) {
        if (!cluster.related_cluster_codes_txt) { cluster.related_cluster_codes_txt = []; }
        if (!cluster.related_cluster_names_txt) { cluster.related_cluster_names_txt = []; }
        if (!cluster.related_cluster_90_txt) { cluster.related_cluster_90_txt = []; }
        if (!cluster.related_cluster_i20_90_txt) { cluster.related_cluster_i20_90_txt = []; }
        if (!cluster.related_cluster_i20_90_min_txt) { cluster.related_cluster_i20_90_min_txt = []; }
        if (!cluster.related_cluster_percentage_txt) { cluster.related_cluster_percentage_txt = []; }
        if (!cluster.related_cluster_avg_txt) { cluster.related_cluster_avg_txt = []; }
        if (!cluster.related_cluster_min_txt) { cluster.related_cluster_min_txt = []; }
        cluster.related_cluster_codes_txt.push(data.target_cluster_code_t);
        cluster.related_cluster_names_txt.push(data.target_cluster_name_t);
        cluster.related_cluster_90_txt.push(data.related_90_i);
        cluster.related_cluster_i20_90_txt.push(data.related_i20_90_i);
        cluster.related_cluster_i20_90_min_txt.push(data.related_i20_90_min_i);
        cluster.related_cluster_percentage_txt.push(data.related_percentage_tl);
        cluster.related_cluster_avg_txt.push(data.related_avg_tf);
        cluster.related_cluster_min_txt.push(data.related_min_tf);
      }
    },

    end: _delegate(persister, 'end'),
    should_drain: _delegate(persister, 'should_drain'),
    drain: _delegate(persister, 'drain')
  }
};

module.exports = zip;
