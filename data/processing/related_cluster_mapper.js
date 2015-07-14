function create_importer() {
  return {
    transform: function(row) {
      return {
        cluster_code_t: row.clustera,
        cluster_name_t: row.cluster_name,
        target_cluster_code_t: row.clusterb,
        target_cluster_name_t: row.cluster_name_2,
        related_90_i: row.rel_all_90_v3,
        related_i20_90_i: row.rel_i20_all_avg_90_v3,
        related_i20_90_min_i: row.rel_i20_all_min_90_v3,
        related_percentage_tl: row.cr_all_pc,
        related_avg_tf: row.cc_preli_all_avg_90_v3,
        related_min_tf: row.cc_preli_all_min_90_v3
      }
    }
  }
}

module.exports = create_importer;
