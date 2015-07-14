var d3 = require('d3'),
  sf = d3.format('05d'),
  msf = d3.format('07.3f'),
  mf = d3.format('.3f');

function create_importer(year, clusterData, clusters, aggregates) {
  var us, usClusters,
      aggregateForRegion = function(type, code, year) {
        return aggregates.get(['aggregate', type, code, year].join('/'));
      },
      clustersForRegion = function(type, code, year) {
        var regionClusters = {};
        clusterData.forEach(function (_k, v) {
          var ids = ['cluster', type, code, v.cluster_code_t, year], key;
          if (v.sub_code_t) {
            ids.push(v.sub_code_t);
          }
          key = ids.join('/');
          regionClusters[key] = clusters.get(key);
        });
        return regionClusters;
      },
      initialize = function() {
        us  = aggregateForRegion('country', 98, year);
        usClusters = clustersForRegion('country', 98, year);
        if (!us) {
          console.log('no us data', us, 'country', 98, year, aggregates.get(['aggregate', 'country', 98, year].join('/')));
          aggregates.forEach(function (k, v) {
            if (v.region_type_t =='country' || v.region_type_t == 'state') {
              console.log(k);
            }
          });
          throw "Cannot process cluster calcs, no US data";
        }
      },
      safeSet = function(obj, key, value) {
        if (!isNaN(value) && isFinite(value)) {
          obj[key] = value;
        } else {
          obj[key] = 0;
        }
      };

  return {
    getId: function (row) {
      return row.id;
    },
    transform: function (row, i, id) {
      if (!us) {
        initialize();
      }
      var agg, subCode, usKey, usCluster, emp_per, natl_per, natl_cluster_per, clusterEmployment, totalRegionalEmploymentForClusterType, totalUsEmploymentForClusterType, usClusterEmployment;

      agg = aggregateForRegion(row.region_type_t, row.region_code_t, row.year_t);
      subCode =  (row.sub_code_t ? '/' + row.sub_code_t : '');
      usKey = 'cluster/country/98/' + row.cluster_code_t + '/' + row.year_t + subCode;
      usCluster = usClusters[usKey];
      clusterEmployment = +row.emp_tl;
      usClusterEmployment = +usCluster.emp_tl;
      if (row.traded_b) {
        totalRegionalEmploymentForClusterType = +agg.emp_traded_tl;
        totalUsEmploymentForClusterType = +us.emp_traded_tl;
      } else {
        totalRegionalEmploymentForClusterType = +agg.emp_local_tl;
        totalUsEmploymentForClusterType = +us.emp_local_tl;
      }
      emp_per = clusterEmployment/totalRegionalEmploymentForClusterType;
      natl_per = usClusterEmployment/totalUsEmploymentForClusterType;
      natl_cluster_per = clusterEmployment/usClusterEmployment;
      safeSet(row, 'lq_tf', emp_per / natl_per);
      safeSet(row, 'region_emp_per_tf', emp_per);
      safeSet(row, 'cluster_emp_per_tf', natl_cluster_per);
      return row;
    }
  }
}
module.exports = create_importer;
