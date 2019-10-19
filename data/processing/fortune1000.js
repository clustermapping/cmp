var d3 = require('d3');
function create_importer(aggregates) {
  var byTypeState, states, rank = 0;

  return {
    transform: function (row) {
      var state;
      rank++;
      if (!byTypeState) {
          byTypeState = d3.nest()
              .key(function (d) {
                  return d.region_type_t;
              })
              .key(function (d) {
                  return d.abbr_t;
              })
            .rollup(function(ds) { return ds[0];})
              .map(aggregates.data(), d3.map);
          states = byTypeState.get('state');
      }
      state = states.get(row.State.toUpperCase());
      if (state) {
        if(!state.fortune1000_tl) {
          state.fortune1000_tl = 0;
        }
        if(!state.fortune1000_year_txt) {
          state.fortune1000_year_txt = [];
        }
        if(!state.fortune1000_company_txt) {
          state.fortune1000_company_txt = [];
        }
        if (!state.fortune1000_address_txt) {
          state.fortune1000_address_txt = [];
        }
        if (!state.fortune1000_rank_txt) {
          state.fortune1000_rank_txt = [];
        }
        state.fortune1000_tl++;
        state.fortune1000_company_txt.push(row.Company);
        state.fortune1000_year_txt.push(row.Year);
        state.fortune1000_address_txt.push(row.Address + ' ' + row.City + ', ' + row.State + ' ' + row.Zipcode);
        state.fortune1000_rank_txt.push(row.Rank);
        return state;
      } else {
          console.log("Didn't find state:" , row.State.toLowerCase());
      }
    }
  }
}

module.exports = create_importer;

