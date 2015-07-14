function create_importer(type, options) {
  var ops = options || {},
    excluded = ops.excluded || [],
    region_data = ops.region_data,
    type_exceptions = ops.type_exceptions || {},
    keyName = function (str) {
      return str.replace(/[\(\),'":;\/\.]/g, '').replace(/[\- ]/g, '_').replace(/([a-z0-9])([A-Z0-9])/g, '$1_$2').toLowerCase();
    };

  function titleCase(str) {
    return str.replace(/\w\S*/g,
        function(txt){
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
  }

  function getStateAbbr(region_state_code_t) {
    if (excluded.indexOf(region_state_code_t) !== -1) {
      return '';
    }

    var type = type_exceptions[region_state_code_t] || 'state';
    var state_id = 'region/' + type + '/' + region_state_code_t;
    if (region_data) {
      var state = region_data.get(state_id);
      if (state && state.abbr_t) {
        return state.abbr_t;
      } else {
        return '';
      }
    }
  }

  return {
    getId: function (row) {
      var id = row.properties.GEOID10;
      if (id.length == 1) { id = '0' + id; }
      return id;
    },
    filter: function (_r, _i, id) {
      return excluded.indexOf(id) == -1; // Filter out the excluded ids
    },
    transform: function (row, i, id) {
      var region_type = type_exceptions[id] || type,
        doc = {
          id: 'region/' + region_type + '/' + id,
          type_t: 'region',
          region_code_t: id,
          region_type_t: region_type,
          area_type_t: region_type
        };
      if (row.properties.STUSPS10) {
        doc.abbr_t = row.properties.STUSPS10;
      }

      if (row.properties.NAME10) {
        doc.name_t = row.properties.NAME10;
        doc.region_name_t = row.properties.NAME10;
        doc.region_short_name_t = titleCase(row.properties.NAME10);
      }

      if (row.properties.NAMELSAD10) {
        doc.name_t = row.properties.NAMELSAD10;
        doc.region_name_t = row.properties.NAMELSAD10;
        doc.region_short_name_t = titleCase(row.properties.NAMELSAD10);
      }

      doc.key_t = keyName(doc.name_t);

      if (row.properties.Shape_Leng) {
        doc.region_length_tf = +row.properties.Shape_Leng;
      }

      if (row.properties.Shape_Area) {
        doc.region_area_tf = +row.properties.Shape_Area;
      }

      if (row.properties.INTPTLAT10) {
        doc.region_int_lat_tf = +row.properties.INTPTLAT10;
      }

      if (row.properties.INTPTLON10) {
        doc.region_int_lon_tf = +row.properties.INTPTLON10;
      }

      delete row.geometry;

      if (id.length == 5) {
        var stCode = id.substring(0, 2),
          countCode = id.substring(2, 5);
        doc.state_codes_txt = [stCode];
        doc.region_state_code_t = stCode;
        doc.region_county_code_t = countCode;
      } else {
        doc.region_state_code_t = id;
      }

      if (type !== 'state' && doc.region_state_code_t) {
        var abbrev = getStateAbbr(doc.region_state_code_t)
        doc.region_short_name_t += ', ' + abbrev;
        doc.key_t += '_' + abbrev.toLowerCase();
      }

      return doc;
    }
  }
}
module.exports = create_importer;