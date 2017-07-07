var d3 = require('d3');

function create_importer(data, startData, dataDict, types, regionTypes) {

 function percentile(index, adjustedCount) {
    index = index+1;
    return Math.round((100/adjustedCount)*(index-.5));
  }

  function rank(values, key, reverse) {
    var vs = values.slice(0);
    var perKeys = ['lq_tf', 'emp_tf', 'est_tf'];
    if (perKeys.indexOf(key) != -1) {
      vs = vs.filter(function(a){return a.emp_tl>0;});
    }
    var rank_key = key + '_rank_i',
        percentile_key = key + '_per_rank_i',
        actualCount = values.length,
        adjustedCount = vs.length,
        sort = (reverse? d3.ascending : d3.descending),
        sorted = values.sort(function(a, b) { return sort(+a[key], +b[key]); });

    sorted.forEach(function(v, i) {
      if (v[key]) {
        v[rank_key] = i + 1;
        if (v['region_type_t'] === 'state') {
          v[percentile_key] = i+1;
        } else {
          v[percentile_key] = percentile(i, adjustedCount);
        }
      }
    });
  }  
  
  function rankChange(values, startValuesByRegion, key, changeType, reverse) {
    var change_key = key + '_change_tf';
    values.forEach(function(v) {
      var start = startValuesByRegion.get(v.region_type_t + '/' + v.region_code_t), ys, startVal;
      if (!start || !v[key]) {
        return;
      } else {
        start = start[0];
        startVal = +start[key].value;
        ys = (+v.year_t) - (+start[key].year);
      }
      if (changeType === 'cagr') {
        v[change_key] = Math.pow((+v[key])/startVal, 1/ys) - 1;
      } else {
        v[change_key] = (+v[key]) - startVal;
      }
    });
    rank(values, change_key, reverse);
  }

  function inTypes(varTypes) {
    var result = false;
    varTypes.forEach(function(vt) {
      if (types.indexOf(vt) != -1) result = true;
    });
    return result;
  }

  function getStartId(r) {
    var rid = r.type_t;
    if (rid == 'cluster') {
      rid += '/' + r.cluster_code_t;
      if (r.subcluster_b) {
        rid += '/' + r.sub_code_t;
      }
    }
    return rid;
  } 

  return {
    transform: function (row) {
      var clusters = data.getRev(row.id), earliestId = getStartId(row), startClusters;
      if (startData)  {
        startClusters = startData.getRev(earliestId);
      }
      this.rankData(clusters, startClusters);
    },
    rankData: function(values, startValues) {
      var byType = d3.nest().key(function(d) { return d.region_type_t;}).map(values, d3.map), startByType;
      if (startValues) {
        startByType = d3.nest().key(function(d) { return d.region_type_t;}).map(startValues, d3.map);
      }
      byType.forEach(function(k, vs) {

        var startVs, startByRegion;
        if (regionTypes && regionTypes.indexOf(k) == -1) {
            return;
        }

        if (startByType) {
          startVs = startByType.get(k);
        }

        if (k == 'custom') {
          vs = vs.concat(byType.get('economic'));

          if (vs[vs.length - 1] == undefined) {
            return;
          }

          if (startByType) {
            if (!startVs) {
              startVs = [];
            }
            startVs = startVs.concat(startByType.get('economic'));
          }
        }

        if (startVs) {
          startByRegion = d3.nest().key(function(d) { return (d ? d.region_type_t + '/' + d.region_code_t : '');}).map(startVs, d3.map)
        }

        dataDict.vars.forEach(function(v) {
          if (!v.calc_source && inTypes(v.mapTypes)) {
            rank(vs, (v.range_source || v.key), v.reverse_color);
            if (startVs && v.type) {
              rankChange(vs, startByRegion, (v.range_source || v.key), v.type, v.reverse_color);
            }
          }
        });
      });
    }
  }
}

module.exports = create_importer;
