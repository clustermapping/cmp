function create_importer(year, ibrcVars, overrides) {
  var getFips = function (st, co) {
      var fips = '';
      if (+st === 0) {
        return '98';
      }
      if (st.length < 2) {
        fips += '0';
      }
      fips += st;
      if (+co === 0) {
        return fips;
      }
      if (co.length < 3) {
        fips += '0';
      }
      if (co.length < 2) {
        fips += '0';
      }
      fips += co;
      return fips;
    },
    getType = function (st, co) {
      if (+st === 0) {
        return 'country';
      } else if (+co === 0) {
        return 'state';
      } else {
        return 'county';
      }
    },
    getRegion = function(type, fips) {
      var typeStr = type + '/' + fips;
      if (overrides && overrides[typeStr]) {
        typeStr = overrides[typeStr];
      }
      return typeStr;
    };

  return {
    filter: function(row) {
      return row.year == year && row.value !== 'NULL';
    },
    transform: function (row) {
      var fips = getFips(row.statefips, row.countyfips),
        type = getType(row.statefips, row.countyfips),
        region = getRegion(type, fips),
        v = ibrcVars.get(row.id),
        value = +row.value;

      if (value == null) {
        console.log('region/' + region, 'aggregate/' + region + '/' + year, v.key, row.value, +row.value);
      }

      if (!v) {
        console.log("no variable: " + row.id);
      }

      if (v && v.scaling) {
        if (v.scaling == '($000)' || v.scaling == '(000)') {
          value = 1000 * value;
        }
      }

      if (v) {
        return {
          id: 'aggregate/' + region + '/' + year,
          region: 'region/' + region,
          year: year,
          key: v.key,
          value: value
        }
      }
    }
  }
}

module.exports = create_importer;