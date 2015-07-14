(function() {
  "use strict";
  var MythosVis = window.MythosVis,
      loader = new MythosVis.DataLoader(),
      numFormat = d3.format(',f'),
      moneyFormat = d3.format('$,.2f'),
      container,
      plotData = [],
      years = [],
      region = "Region", cluster = "Subcluster",
      sortYear, sortKey, sortOrder,
      base = window.hbsBaseUrl || '';

  function sortBy(year, key) {
    var sortFunc = d3.ascending;
    if (year == sortYear && key == sortKey && sortOrder == 'a') {
      sortFunc = d3.descending;
      sortOrder = 'd';
    } else {
      sortOrder = 'a';
    }
    plotData.sort(function(a, b) { return sortFunc(+a[year][key], +b[year][key]);});
    buildChart('#chart');
  }

  function addLegend() {
    var container = d3.select('#legend-wrapper');
    container.selectAll('div.legend').remove();
    container.append('div').classed('legend', true);
    var legend = container.select('div.legend');
    legend.append('span').classed('legend-title',true).html('Legend: ');
    legend.append('span').html('Emp: Employment');
    legend.append('span').html('Emp+: Approximate Supressed Employment');
    legend.append('span').html('Est: Establishments');
    legend.append('span').html('AP: Annual Payroll');
    legend.append('span').html('N/A: Data not available');
  }

  function formatted(format, val) {
    if (val && !isNaN(+val)) {
      return format(+val);
    } else {
      return 'N/A';
    }
  }

  function buildChart(sel) {
    container = d3.select(sel);
    d3.select('body').classed('industry-table', true);
    container.select('div.title').remove();
    container.select('table').remove();
    var title = container.append('div').classed('title', true);
    title.append('h1').html(region);
    title.append('h2').html(cluster);
    var table = container.append('table').attr('id', 'industryTable');
    var thead = table.append('thead');
    var tbody = table.append('tbody');

    var headerRow = thead.append('tr').attr('class', 'first-heading');
    var headerRow2 = thead.append('tr').attr('class', 'second-heading');
    // Adding a blank th balance out the table. gs
    headerRow2.append('th');
    headerRow.append('th').attr({rowspan:2}).html('Region (FIPS)');
    headerRow.append('th').attr({rowspan:2}).html('Industry (NAICS)');
    years.forEach(function(y) {
      headerRow.append('th').attr({colspan:4}).html(y);
      headerRow2.append('th')
        .classed('clickable', true)
        .classed('asc', (sortKey == 'emp' && sortYear == y && sortOrder == 'a'))
        .classed('desc', (sortKey == 'emp' && sortYear == y && sortOrder == 'd'))
        .html('Emp').on('click',function() {sortBy(y,'emp')});
      headerRow2.append('th')
        .classed('clickable', true)
        .classed('asc', (sortKey == 'emp' && sortYear == y && sortOrder == 'a'))
        .classed('desc', (sortKey == 'emp' && sortYear == y && sortOrder == 'd'))
        .html('Emp+').on('click',function() {sortBy(y,'emp_sup')});
      headerRow2.append('th')
        .classed('clickable', true)
        .classed('asc', (sortKey == 'est' && sortYear == y && sortOrder == 'a'))
        .classed('desc', (sortKey == 'est' && sortYear == y && sortOrder == 'd'))
        .html('Est').on('click',function() {sortBy(y,'est')});
      headerRow2.append('th')
        .classed('clickable', true)
        .classed('asc', (sortKey == 'ap' && sortYear == y && sortOrder == 'a'))
        .classed('desc', (sortKey == 'ap' && sortYear == y && sortOrder == 'd'))
        .html('AP').on('click',function() {sortBy(y,'ap')});
    });
    plotData.forEach(function(row) {
      var tableRow = tbody.append('tr');
      tableRow.append('th').html(row.region + ' (' + row.regionId + ')');
      tableRow.append('th').html(row.industry + ' (' + row.industryId + ')');
      years.forEach(function(y) {
        if (!row[y]) {row[y] = {emp:'N/A', est: 'N/A', ap: 'N/A'} }
        tableRow.append('td').html(formatted(numFormat, row[y].emp));
        tableRow.append('td').html(formatted(numFormat, row[y].emp_sup));
        tableRow.append('td').html(formatted(numFormat, row[y].est));
        tableRow.append('td').html(formatted(moneyFormat, row[y].ap));
      });
    });
    addLegend();
  }

  function getDatasources() {
    return base + '/report/region/industry' + window.location.hash.substring(1).split('?')[0];
  }
  function processData(data) {
    cluster = data.clusterName;
    region = data.regionName;
    years = d3.range(data.yearRange[0], data.yearRange[1]+1);
    Object.keys(data.data).forEach(function (d) {
      var region = data.data[d].region + ' (' + data.data[d].regionId + ')';
      var industry = data.data[d].industry + ' (' + data.data[d].industryId + ')';
      data.data[d].regionTitle = region;
      data.data[d].industryTitle = industry;
      plotData.push(data.data[d]);
    });
  }

  function update() {
    plotData.length = 0;
    loader.request(getDatasources(), function () {
      processData.apply(this, arguments);
      buildChart('#chart');
    });
  }
    d3.select('#controls').remove();
    update();
  })();
