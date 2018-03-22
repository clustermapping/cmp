function create_importer(year) {

  //fips,year,count,cocode,company
  //01001,2007,0.5333333333,0473860,RHEEM MANUFACTURING COMPANY
  //01001,2007,0.25,0218550,GENERAL ELECTRIC COMPANY
  //01001,2008,1,0926110,"SHORELINE RESTORATION SERVICES, LLC"
  //01001,2008,0.6666666667,0281535,INTERNATIONAL PAPER CO.

  return {
    filter: function(row) {
      return row.year == year;
    },
    transform: function (row) {
      var fips = row.fips,
        region = 'county/' + fips,
        value = +row.count;

      if (value == null) {
        console.log('region/' + region, 'aggregate/' + region + '/' + year, v.key, row.value, +row.value);
      }

      return {
        id: 'aggregate/' + region + '/' + year,
        region: 'region/' + region,
        state: 'region/state/'+row.fips.substring(0,2),
        country: 'region/country/98',
        year: year,
        value: value,
        company: row.company
      }
    }
  }
}

module.exports = create_importer;
