function create_importer(regions) {
  return {
    getId: function(row) {
      return 'aggregate/' + row.region_type_t + '/' + row.region_code_t + '/' + row.year_t;
    },
    filter: function(row) {
      return !row.subcluster_b;
    },
    transform: function (row, i, id) {
      var regionId = 'region/' + row.region_type_t + '/' + row.region_code_t,
          region = (regions ? regions.get(regionId) : undefined),
          a;

      a = {
        id: id,
        type_t: 'aggregate',
        region_name_t: row.region_name_t || '',
        region_short_name_t: row.region_short_name_t || '',
        region_type_t: row.region_type_t || '',
        region_code_t: row.region_code_t || '',
        cluster_code_t: 'all',
        year_t: row.year_t,
        name_t: row.region_name_t || '',
        emp_tl: row.emp_tl,
        emp_local_tl: (row.traded_b ? 0 : row.emp_tl),
        emp_traded_tl: (row.traded_b ? row.emp_tl : 0),
        emp_reported_tl: row.emp_reported_tl,
        emp_reported_local_tl: (row.traded_b ? 0 : row.emp_reported_tl),
        emp_reported_traded_tl: (row.traded_b ? row.emp_reported_tl : 0),
        private_wage_tf: row.private_wage_tf,
        private_wage_local_tf: (row.traded_b ? 0 : row.private_wage_tf),
        private_wage_traded_tf: (row.traded_b ? row.private_wage_tf : 0),
        ap_tl: row.ap_tl,
        ap_local_tl: (row.traded_b ? 0 : row.ap_tl),
        ap_traded_tl: (row.traded_b ? row.ap_tl : 0),
        est_tl: row.est_tl,
        est_local_tl: (row.traded_b ? 0 : row.est_tl),
        est_traded_tl: (row.traded_b ? row.est_tl : 0),
        key_t: row.region_key_t,
        region_key_t: row.region_key_t
      };

      if (region && region.area_type_t) {
          a.area_type_t = region.area_type_t;
      }

      if (region && region.regions_txt && region.region_type_t == 'custom')  {
        a.regions_txt = region.regions_txt;
      }

      if (region && region.abbr_t) {
        a.abbr_t = region.abbr_t;
      }

      return a;
    }
  }
}

module.exports = create_importer;
