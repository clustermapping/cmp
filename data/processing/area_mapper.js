function create_importer(type, options) {
  var ops = options || {},
    excluded = ops.excluded || [],
    type_exceptions = ops.type_exceptions || {},
    nameRe = new RegExp(/(.*)\((.*)\)/),
    keyName = function (str) {
      return str.replace(/[\(\)\*&,'":;\/\.]/g, '') // remove bad chars
        .replace(/[\- ]/g, '_') // remove spaces and dashes -> underscore
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2') //camel case -> snake case
        .replace(/__+/, '_') // multiple underscores get collapsed
        .replace(/_$/,'') // remove trailing underscores
        .toLowerCase(); // to lower case
    },
    fipsMapping = {
      '15901': ['15005','15009'],
      '51901': ['51003','51540'],
      '51903': ['51005','51580'],
      '51907': ['51015','51790','51820'],
      '51909': ['51019','51515'],
      '51911': ['51031','51680'],
      '51913': ['51035','51640'],
      '51918': ['51053','51570','51730'],
      '51919': ['51059','51600','51610'],
      '51921': ['51069','51840'],
      '51923': ['51081','51595'],
      '51929': ['51089','51690'],
      '51931': ['51095','51830'],
      '51933': ['51121','51750'],
      '51939': ['51143','51590'],
      '51941': ['51149','51670'],
      '51942': ['51153','51683','51685'],
      '51944': ['51161','51775'],
      '51945': ['51163','51530','51678'],
      '51947': ['51165','51660'],
      '51949': ['51175','51620'],
      '51951': ['51177','51630'],
      '51953': ['51191','51520'],
      '51955': ['51195','51720'],
      '51958': ['51199','51735'],
      '55901': ['55078','55115']
    };

  function shortName(name, type) {
      var names = name.split(', '),
          areas = names[0].split('-'),
          states = names[1] && names[1].split('-') || [''],
          area = areas[0], state = states[0];
    return area + ', ' + state + ' ' + type.replace('Statistical ', '');
  }

  return {
    getId: function (row) {
      return row.id;
    },
    filter: function (_r, _i, id) {
      return excluded.indexOf(id) == -1; // Filter out the excluded ids
    },
    transform: function (row, i, id) {
      var region_type = type_exceptions[id] || type,
          nameMatch = nameRe.exec(row.name),
          name = (nameMatch ? nameMatch[1] : row.name),
          areaType = (nameMatch ? nameMatch[2] : region_type),
          fips = fipsMapping[row.fips] || [ row.fips ],
          states = fips.map(function(d) { return d.substring(0,2) })
                    .reduce(function(ac, d) { ac[d] = true; return ac;}, {});
          doc = {
            id: 'region/' + region_type + '/' + id,
            type_t: 'region',
            region_code_t: id,
            region_type_t: region_type,
            key_t: keyName(name),
            name_t: name,
            region_name_t: name,
            region_short_name_t: shortName(name, areaType),
            area_type_t: areaType,
            regions_txt: fips.map(function(f) { return 'region/county/'+f; }),
            region_count_tl: fips.length,
            state_codes_txt: Object.keys(states)
          };

      if (row.short_name) {
        doc.region_short_name_t = row.short_name;
      }

      return doc;
    }
  }
}
module.exports = create_importer;
