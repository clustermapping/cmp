(function() {
  "use strict";
  var MythosVis = window.MythosVis,
      loader = new MythosVis.DataLoader(),
      numFormat = d3.format(',f'),
      moneyFormat = d3.format('$,.2f'),
      container,
      plotData = [],
      years = [],
      region = "Region", 
      cluster = "Patents by Organization",
      sortKey, sortOrder,
      base = window.hbsBaseUrl || '';

  if (!String.prototype.capitalize) {
    String.prototype.capitalize = function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
    };
  }

  function sortBy(key) {
    var sortFunc = d3.ascending;
    if (key == sortKey && sortOrder == 'a') {
      sortFunc = d3.descending;
      sortOrder = 'd';
    } else {
      sortOrder = 'a';
    }
    sortKey = key;
    plotData.sort(function(a, b) {return sortFunc(a[key], b[key]);});
    buildChart('#chart');
  }

  function addLegend() {
    var container = d3.select('#legend-wrapper');
    container.selectAll('div.legend').remove();
    container.append('div').classed('legend', true);
    var legend = container.select('div.legend');
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
    d3.select('body').classed('innovation-table', true);
    container.select('div.title').remove();
    container.select('table').remove();
    var title = container.append('div').classed('title', true);
    title.append('h1').html(region);
    title.append('h2').html(cluster);
    var table = container.append('table').attr('id', 'innovationTable');
    var thead = table.append('thead');
    var tbody = table.append('tbody');

    var headerRow = thead.append('tr').attr('class', 'first-heading');
    headerRow.append('th').attr({}).html('Organization')
      .classed('clickable', true)
        .classed('asc', (sortKey == 'name' && sortOrder == 'a'))
        .classed('desc', (sortKey == 'name' && sortOrder == 'd'))
      .on('click',function() {sortBy('name')});
    years.forEach(function(y) {
      headerRow.append('th').attr().html(String(y).capitalize())
        .classed('clickable', true)
        .classed('asc', (sortKey == y && sortOrder == 'a'))
        .classed('desc', (sortKey == y && sortOrder == 'd'))
        .on('click',function() {sortBy(y)});
    });
    plotData.forEach(function(row) {
      var tableRow = tbody.append('tr');
      tableRow.append('td').attr('class', 'organization-name').html( row.name);
      years.forEach(function(y) {
        if (!row[y]) {row[y] = 'N/A' }
        tableRow.append('td').html(formatted(numFormat, row[y]));
      });
    });
    // addLegend();
  }

  function getDatasources() {
    return base + '/report/region/innovation' + window.location.hash.substring(1).split('?')[0];
  }
  function processData(data) {
    // cluster = data.clusterName;
    region = data.regionName;
    years = Object.keys(data.totals);
    plotData = data.results;
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
