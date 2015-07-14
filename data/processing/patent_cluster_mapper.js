function create_importer(year) {

  //fips,cluster_code,year,cluster_name,count
  //01001,1,1998,Aerospace Vehicles and Defense,0.0324630882
  //01001,1,1999,Aerospace Vehicles and Defense,0.0013025538
  //01001,1,2001,Aerospace Vehicles and Defense,0.1058221287
  //01001,1,2002,Aerospace Vehicles and Defense,0.0244024342
  //01001,1,2003,Aerospace Vehicles and Defense,0.0326015614
  //01001,1,2004,Aerospace Vehicles and Defense,0.0269109769
  //01001,1,2005,Aerospace Vehicles and Defense,0.0355693062
  //01001,1,2007,Aerospace Vehicles and Defense,0.0002558411
  //01001,1,2008,Aerospace Vehicles and Defense,0.0754406467

  return {
    filter: function(row) {
      return row.year == year;
    },
    transform: function (row) {
      var fips = row.fips,
        region = 'county/' + fips,
        value = +row.count,
        cluster_code = row.cluster_code;

      if (value == null) {
        console.log('region/' + region, 'aggregate/' + region + '/' + year, v.key, row.value, +row.value);
      }

      return {
        id: 'cluster/' + region + '/' + cluster_code +'/' + year,
        region: 'region/' + region,
        state: 'region/state/'+row.fips.substring(0,2),
        country: 'region/country/98',
        cluster_code: cluster_code,
        year: year,
        value: value
      }
    }
  }
}

module.exports = create_importer;
