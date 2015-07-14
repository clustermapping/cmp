function create_importer(datadict, dataCache) {

  var keys, oKeys = {};
  datadict.vars.forEach(function(v) {
    var k = v.range_source || v.key;
    oKeys[k] = 1;
  });
  keys = Object.keys(oKeys);
  return {
    getId: function(row) {
      var idParts = ['changeBase', row.type_t,row.region_type_t,row.region_code_t]
      if (row.type_t === 'cluster') {
        idParts.push(row.cluster_code_t);
        if (row.subcluster_b) {
          idParts.push(row.sub_code_t);
        }
      }
      return idParts.join('/');
    },
    transform: function (row, i, id) {
      var rec = dataCache.get(id);
      if (!rec) {
        rec = {id:id, region_code_t: row.region_code_t, region_type_t: row.region_type_t, base_type_t:row.type_t, type_t:'changeBase'};
        if (row.type_t == 'cluster') {
          rec.cluster_code_t = row.cluster_code_t;
          rec.subcluster_b = row.subcluster_b;
          if (row.subcluster_b) {
            rec.sub_code_t = row.sub_code_t;
          }
        }
      }
      keys.forEach(function(dataKey) {
        if (typeof row[dataKey] !== 'undefined') {
          if (!rec[dataKey]) {
            rec[dataKey] = {year: +row.year_t, value: row[dataKey]};
          } else if (rec[dataKey].year > +row.year_t) {
            rec[dataKey].year = +row.year_t;
            rec[dataKey].value = row[dataKey];
          }
        }
      });
      return rec;
    }
  }
}

module.exports = create_importer;
