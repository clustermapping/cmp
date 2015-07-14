function create_placeholders(year, clusters_cache) {
  var clusters,
    _cluster_id= function (region, cluster, y) {
      var region_type = region.region_type_t,
        region_code = region.region_code_t,
        year = y,
        cluster_code = cluster.cluster_code_t,
        subcluster_code = cluster.sub_code_t,
        base = 'cluster',
        ids = [base, region_type, region_code, cluster_code, year];
      if (subcluster_code) {
        ids.push(subcluster_code);
      }
      return ids.join('/');
    },
    _create_cluster = function(region, c, year) {
      var cluster = {
        id: _cluster_id(region, c, year),
        type_t: 'cluster',
        cluster_name_t: c.name_t,
        cluster_code_t: c.cluster_code_t,
        key_t: c.key_t,
        year_t: year,
        region_type_t: region.region_type_t,
        region_code_t: region.region_code_t,
        region_name_t: region ? region.name_t : '',
        region_short_name_t: region ? region.region_short_name_t : '',
        region_area_type_t: region && region.area_type_t ? region.area_type_t : '',
        region_key_t: region ? region.key_t : '',
        traded_b: c.traded_b,
        subcluster_b: false,
        empflag_t: '',
        emp_tl: 0,
        emp_reported_tl: 0,
        qp1_tl: 0,
        est_tl: 0,
        ap_tl: 0,
        private_wage_tf: 0,
        rec_count_tl: 0,
        supression_b: false
      };
      if (c.sub_name_t) {
        cluster.subcluster_b = true;
        cluster.sub_name_t = c.sub_name_t;
        cluster.sub_code_t = c.sub_code_t;
        cluster.parent_key_t = c.parent_key_t;
      }
      return cluster;
    },
    _create_aggregate = function (region, year) {
      var a = {
        id: 'aggregate/' + region.region_type_t + '/' + region.region_code_t + '/' + year,
        type_t: 'aggregate',
        region_name_t: region.name_t || '',
        region_short_name_t: region.region_short_name_t || '',
        region_type_t: region.region_type_t || '',
        region_code_t: region.region_code_t || '',
        cluster_code_t: 'all',
        year_t: year,
        name_t: region.name_t || '',
        emp_tl: 0,
        emp_local_tl: 0,
        emp_traded_tl: 0,
        emp_reported_tl: 0,
        emp_reported_local_tl: 0,
        emp_reported_traded_tl: 0,
        private_wage_tf: 0,
        private_wage_local_tf: 0,
        private_wage_traded_tf: 0,
        ap_tl: 0,
        ap_local_tl: 0,
        ap_traded_tl: 0,
        est_tl: 0,
        est_local_tl: 0,
        est_traded_tl: 0,
        key_t: region.key_t,
        region_key_t: region.key_t
      };

      if (region && region.regions_txt && region.region_type_t == 'custom')  {
        a.regions_txt = region.regions_txt;
      }

      if (region && region.abbr_t) {
        a.abbr_t = region.abbr_t;
      }
      return a;
    };

  return {
    transform: function(region) {
      if (!clusters) {
        clusters = clusters_cache.data();
      }
      var docs = [];
      clusters.forEach(function(c) {
        docs.push(_create_cluster(region, c, year));
      });
      docs.push(_create_aggregate(region, year));
      return docs;
    }
  };
}

module.exports = create_placeholders;
