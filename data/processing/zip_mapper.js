function create_importer(options) {
  var ops = options || {},
    excluded_states = ops.excluded_states || [];
  return {
    filter: function(row) {
      return excluded_states.indexOf(row.STATE) == -1; // Filter out the excluded ids
    },
    transform: function(row) {
      return {
        zip: row.ZCTA5,
        countyId: 'region/county/' + row.GEOID,
        stateId: 'region/state/' + row.STATE
      }
    }
  }
}

module.exports = create_importer;