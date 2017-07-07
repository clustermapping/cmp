var d3 = require('d3'),
    sf = d3.format('05d'),
    msf = d3.format('07.3f');

var cluster_calcs = function (persister, skipTypes, skipSubs) {
  var _delegate = function(target, action, def) {
        return function () {
          if (target && target[action]) {
            return target[action].apply(persister, arguments);
          } else {
            return def;
          }
        }
      },
      lqs = {};

  return {
    persist: function(data) {
      var subCode = (data.sub_code_t ? '/' + data.sub_code_t : ''),
          clusterKey = data.cluster_code_t + '/' + data.year_t + subCode,
          regionKey = data.region_type_t + '/' + data.region_code_t,
          key = (data.region_type_t == 'custom' ? 'economic': data.region_type_t) + '/' + clusterKey;
      if (skipSubs && data.subcluster_b) return;
      if (data.traded_b) {
        if (!lqs[key]) { lqs[key] = {}; }
        if (!lqs[key][clusterKey]) { lqs[key][clusterKey] = []; }
        lqs[key][clusterKey].push({region:regionKey, lq:+data.lq_tf, emp:+data.emp_tl, est:+data.est_tl});
      }
    },

    end: function (cb) {
      Object.keys(lqs).forEach(function(key){
        Object.keys(lqs[key]).forEach(function(clusterKey){
          var clusters = lqs[key][clusterKey],
              all_emp = clusters.filter(function(d) {return d.emp > 0;}).map(function(d) { return d.emp; }).sort(d3.ascending),
              all_est = clusters.filter(function(d) {return d.emp > 0;}).map(function(d) { return d.est; }).sort(d3.ascending),
              all_lq = clusters.filter(function(d) {return d.emp > 0;}).map(function(d) { return d.lq; }).sort(d3.ascending),
              bottom_emp_quartile = d3.quantile(all_emp, 0.25),
              bottom_est_quartile = d3.quantile(all_est, 0.25),
	      top_lq_decile = d3.quantile(all_lq, 0.90),
              top_lq_quartile = d3.quantile(all_lq, 0.75);
              lq_half = d3.quantile(all_lq, 0.5);
              bottom_lq_quartile = d3.quantile(all_lq, 0.25);
          clusters.forEach(function (d, i) {
              var cluster = persister.get('cluster/' + d.region + '/' + clusterKey);
              if (skipTypes && skipTypes.indexOf(cluster.region_type_t) != -1) return;
              cluster.qualifying_b = (d.lq > bottom_lq_quartile
                                && d.emp > bottom_emp_quartile
                                && d.est > bottom_est_quartile);
              cluster.significant_b = (d.lq > lq_half
                                && d.emp > bottom_emp_quartile
                                && d.est > bottom_est_quartile);
              cluster.strong_b = (d.lq >= top_lq_quartile
                                && d.emp > bottom_emp_quartile
                                && d.est > bottom_est_quartile
                                && d.lq >= 1);
              cluster.strong10_b = (d.lq >= top_lq_decile
                                && d.emp > bottom_emp_quartile
                                && d.est > bottom_est_quartile
                                && d.lq >= 1);
          });
        });
      });
      persister.end(cb);
    },
    should_drain: _delegate(persister, 'should_drain'),
    drain: _delegate(persister, 'drain')
  }
};

module.exports = cluster_calcs;

