var naics = function (data_persister, naics_persister, clusters_persister, regions, overrides) {
  var _delegate = function (target, action, def) {
      return function () {
        if (target && target[action]) {
          return target[action].apply(data_persister, arguments);
        } else {
          return def;
        }
      }
  },
    _cluster_id= function (data, region, cluster) {
      var region_type = region.region_type_t,
          region_code = region.region_code_t,
          year = data.year_t,
          cluster_code = cluster.cluster_code_t,
          subcluster_code = cluster.sub_code_t,
          base = 'cluster',
          ids = [base, region_type, region_code, cluster_code, year];
      if (subcluster_code) {
        ids.push(subcluster_code);
      }
      return ids.join('/');
    },
    _make_num = function(val) {
      val = +val;
      if (isNaN(val)) { return 0; }
      return val;
    },
    _calc_suppressed_value = function (empflag, total) {
      total = total || 0;
      empflag = (empflag ? empflag.toUpperCase() : 'none');

      var vals = {
        none: 0,
        A: 10,
        B: 60,
        C: 175,
        E: 375,
        F: 750,
        G: 1750,
        H: 3750,
        I: 7500,
        J: 17500,
        K: 37500,
        L: 75000,
        M: 100000
      };

      return total + vals[empflag];
    },
    _naics_year = function(data) {
      var y = +data.year_t;
      if (y < 2003) { return '1997'; }
      else if (y < 2008) { return '2002'; }
      else if (y < 2012) { return '2007'; }
      else { return '2012'; }
    },
    _override_value = function(data) {
      if (!overrides) return undefined;
      var ov = overrides.get(data.region_type_t + '/' + data.region_code_t + '/' + data.year_t + '/' + data.naics_t);
      //if (ov && data.region_type_t == 'country') {
      if (ov) {
        return ov.emp;
      }
      return undefined;
    };

  return {
    persist: function (data) {
      var naics_lookup = _naics_year(data) + '/' + data.naics_t,
          clusters = clusters_persister.getRev(naics_lookup),
          region_lookup = 'region/' + data.region_type_t + '/' + data.region_code_t,
          region = regions.get(region_lookup),
          allregions = regions.getRev(region_lookup),
          region_ids = allregions.map(function(d) { return d.id});

      if (region && region_ids.indexOf(region.id) == -1) {
        allregions = [region].concat(allregions);
      }

      var override = _override_value(data);
      if (naics_persister) {
        data.empl_suppressed_tl = override || _calc_suppressed_value(data.empflag_t, data.emp_tl);
        naics_persister.persist(data);
      }

      clusters.forEach(function(c) {
        allregions.forEach(function(region) {
          if (!region) {
            return;
          }
          var id = _cluster_id(data, region, c),
            cluster = data_persister.get(id);

          if (!cluster) {
            cluster = {
              id: id,
              type_t: 'cluster',
              cluster_name_t: c.name_t,
              cluster_code_t: c.cluster_code_t,
              key_t: c.key_t,
              year_t: data.year_t,
              region_type_t: region.region_type_t,
              region_code_t: region.region_code_t,
              region_name_t: region ? region.name_t : '',
              region_short_name_t: region ? region.region_short_name_t : '',
              region_area_type_t: region && region.area_type_t ? region.area_type_t : '',
              region_key_t: region ? region.key_t : '',
              traded_b: c.traded_b,
              subcluster_b: false,
              empflag_t: data.empflag_t,
              emp_tl: 0,
              emp_reported_tl: 0,
              qp1_tl: 0,
              est_tl: 0,
              ap_tl: 0,
              private_wage_tf: 0,
              patent_count_tf: 0,
              rec_count_tl: 0,
              supression_b: false
            };
            if (c.sub_name_t) {
              cluster.subcluster_b = true;
              cluster.sub_name_t = c.sub_name_t;
              cluster.sub_code_t = c.sub_code_t;
              cluster.parent_key_t = c.parent_key_t;
            }

            data_persister.persist(cluster);
          }
          var naics_id =  ['naics', data.year_t, region.region_type_t, region.region_code_t, data.naics_t].join('/');
          // Clear the sum when finding more specific cbp data
          if (!cluster.naics_b && naics_id == data.id) {
            cluster.emp_tl = 0;
            cluster.qp1_tl = 0;
            cluster.ap_tl = 0;
            cluster.est_tl = 0;
            cluster.emp_reported_tl = 0;
            cluster.naics_b = true;
          }
          if (!cluster.naics_b || naics_id == data.id) {
            cluster.emp_tl += override || _calc_suppressed_value(data.empflag_t, data.emp_tl);
            cluster.qp1_tl += _make_num(data.qp1_tl);
            cluster.ap_tl += _make_num(data.ap_tl);
            cluster.est_tl += _make_num(data.est_tl);
          }
          cluster.emp_reported_tl += _make_num(data.emp_tl);
          cluster.supression_b = Boolean(cluster.supression_b || (data.empflag && data.empflag_t.length > 0));
          cluster.rec_count_tl += 1;
          cluster.private_wage_tf = (cluster.ap_tl * 1000)/cluster.emp_reported_tl;
          if (isNaN(cluster.private_wage_tf) || !isFinite(cluster.private_wage_tf)) {
            cluster.private_wage_tf = 0;
          }
        });
      });
    },
    end: _delegate(data_persister, 'end'),
    should_drain: _delegate(data_persister, 'should_drain'),
    drain: _delegate(data_persister, 'drain')
  }
};

module.exports = naics;
