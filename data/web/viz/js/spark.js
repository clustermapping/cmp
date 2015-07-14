/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
      loader = new MythosVis.DataLoader(),
      cagrForm = d3.format('.2%'),
      changeForm = d3.format('+,f'),
      monForm = d3.format('$,.2f'),
      defaults = { className: "", filter: 'default' },
      options = {},
      container, chart, plot,
      plotData = [], totalData = {},
      base = window.hbsBaseUrl || '';

  function resetOptions(defaults){
    options = options || {};
    Object.keys(defaults).forEach(function(d) {
      options[d] = defaults[d];
    });
  }

  function location(selectedCluster){
    var region = '/' + options.regionType + '/' + options.regionId,
      indicator =  '/' + options.indicator,
      hash = '#' + region +  indicator;
    return hash;
  }

  function go(hash) {
    window.location.hash = hash;
  }

  function parseQuery(q) {
    var result = {},
      parts;
    if (!q) { return result; }
    parts = q.split('&');
    parts.forEach(function(p) {
      var v = p.split('='),
        k = v[0];

      v = v[1];
      if (!v || v.toLowerCase() === 'true') { v = true; }
      else if (v.toLowerCase() === 'false') { v = false; }
      else if (!isNaN(+v)) { v = +v; }

      if (result[k]) {
        if (!result[k].push) {
          result[k] = [result[k]];
        }
        result[k].push(v);
      } else {
        result[k] = v;
      }
    });
    return result;
  }

  function updateOptionsFromHash(render) {
    var h = window.location.hash.substring(2),
      uq = h.split('?'),
      parts = uq[0].split('/'),
      q = parseQuery(uq[1]);
    resetOptions(defaults);

    if (parts.length < 3) {
      console.error("Please specify a hash in the form: /:type/:code/:indicator");
    }

    options.regionType = parts[0];
    options.regionId = parts[1];
    options.indicator = parts[2];
    options.params = parts[3];
    Object.keys(q).forEach(function(qk) {
      options[qk] = q[qk];
    });

    if (!render) { return; }
  }

  function addRank(sel, name, rank, rankQ, showRank, style) {
    var r = sel.append('div').classed('performance-rank', true);
    r.classed("rank-" + name, true);
    r.classed("rank-" + rankQ, true);
    if (style) {
      r.attr({style: style});
    }
    r.text(rank);
    if (showRank) {
      sel.append('div').classed('rank-label', true).text('rank');
    }
  }

  function buildWrapper(selection, data) {
    d3.select('html').classed(options.className, true);
    return selection.append('div').classed('performance-indicator-wrapper', true)
      .append('div').classed('performance-indicator', true).datum(data);
  }

  function buildTitle(wrapper) {
    var subtitle;
    wrapper.append('div').classed('performance-title-wrapper', true)
      .append('span').classed('performance-title',true).text(function (d) { return d.title; });

    wrapper.append('div').classed('performance-region-title',true).text(function(d) { return d.region; });

    subtitle = wrapper.append('div').classed('performance-sub-title',true);
    subtitle.append('span').classed('sub-title', true).text(function (d) { return d.subtitle; });
    subtitle.append('span').classed('sub-title-years', true).text(function (d) {
      if (options.indicator == 'fortune1000_tl') return d.end_year;
      if (d.start_year == d.end_year) return d.end_year;
      return d.start_year + '-' + d.end_year; 
    });
  }

  function buildNumbers(wrapper, data, indicator) {
    var format = d3.format(indicator.format),
        endFormat = d3.format(indicator.spark_end_format || indicator.format),
        changeFormat = d3.format('+' + indicator.format),
        positiveF = function(d) {return changeVal(d) >= 0;},
        negativeF = function(d) {return changeVal(d) < 0;},
        yearRange = d3.extent(plotData, function(d) { return d.year; }),
        changeLabel, changeVal, changeClass, change, temp, value, benchRank;

    if (indicator.type !== 'level' || indicator.benchmark) {
      value = wrapper.append('div').classed('performance-value', true).classed('performance-value-benchmark', indicator.benchmark)
      if (indicator.benchmark) {
        benchRank = value.append('div').classed('bench-rank', true);
      }
      value.append('span').text(function (d) {
        return endFormat(d.end_value);
      });
    }

    if (indicator.type === 'cagr') {
      changeVal = function(d) { return d.cagr; };
      changeLabel = "growth rate";
      changeFormat = cagrForm;
      changeClass = 'growth';
    } else if (indicator.type === 'level') {
      if (indicator.benchmark) {
        changeLabel = 'us avg';
        changeVal = function (d) {
          return d.end_bench_value;
        };
        changeFormat = format;
        changeClass = 'benchmark';
      } else {
        changeLabel = '';
        changeVal = function (d) {
          return d.end_value;
        };
        changeFormat = format;
        changeClass = 'level';
        positiveF = negativeF = function () {
          return false;
        };
      }
    } else {
      changeLabel = "change";
      changeVal = function(d) { return d.change; };
      changeClass = 'change';
    }

    if (indicator.reverse_color) {
      temp = positiveF;
      positiveF = negativeF;
      negativeF = temp;
    }

    wrapper.append('div').classed('performance-' + changeClass + '-label', true).text(changeLabel);

    change = wrapper.append('div')
      .classed('performance-change', true)
      .classed('performance-single', (yearRange[0] == yearRange[1]))
      .classed('performance-change-positive', positiveF)
      .classed('performance-change-negative', negativeF)
      .classed('performance-benchmark', indicator.benchmark)
      .text(function (d) { return changeFormat(changeVal(d)); });

    if (indicator.type == 'simple') {
      change.append('span')
        .classed('arrow', true)
        .classed('glyphicon', true)
        .classed('glyphicon-chevron-up', function (d) {
          return d.change > 0;
        })
        .classed('glyphicon-chevron-down', function (d) {
          return d.change < 0;
        });
    }

    if (indicator.spark_type == '3-rank' || indicator.spark_type == '1-rank') {
        if (indicator.type === 'level') {
            if (indicator.benchmark) {
                addRank(benchRank, 'rate', data.end_rank, data.end_rank_q, true);
            } else {
                addRank(change, 'rate', data.end_rank, data.end_rank_q, true);
            }
        } else {
            addRank(change, 'rate', data.change_rank, data.change_rank_q, true);
        }
    }
  }

  function buildPlot(wrapper, data, totalData, indicator) {
    var w = 364, h = 100,
        chartRow =  wrapper.append('div').classed('performance-data', true),
        yearRange = d3.extent(plotData, function(d) { return d.year; }),
//        x =  d3.scale.linear().domain(d3.extent(plotData, function(d) { return d.year; })).range([0, w]),
        x = d3.time.scale().domain(yearRange).range([0, w]),
        y = d3.scale.linear().domain(d3.extent(plotData, function(d) { return d.value; })).range([0, h-20]).nice(),
        xPos = function(d) { return x(d.year);},
        yPos = function(d) { return h - y(d.value);},
        yBenchmarkPos = function(d) { return h - y(d.benchmarkValue);},
        area = d3.svg.area().x(xPos).y0(h).y1(yPos),
        line = d3.svg.area().x(xPos).y(yPos),
        benchmarkLine = d3.svg.area().x(xPos).y(yBenchmarkPos),
        graph,range;
    if (yearRange[0] == yearRange[1]) {
      chartRow.text('Data is only available for ' + yearRange[0])
      return;
    }
    if (indicator.benchmark) {
      var valExtent = d3.extent(plotData, function(d) { return d.value; });
      var benchExtent = d3.extent(plotData, function(d) { return d.benchmarkValue; });
      y.domain([d3.min([valExtent[0], benchExtent[0]]), d3.max([valExtent[1], benchExtent[1]])]).nice();
    }
    if (indicator.spark_type == '3-rank') {
      addRank(chartRow, 'start', totalData.start_rank, totalData.start_rank_q, false, "margin-top:" + (h - y(totalData.start_value) - 14) + 'px');
    }
    graph = chartRow.append('div').classed('performance-sparkline', true).append("svg").attr("width", w+"px").attr("height", h+"px");
    graph.append('path').classed('area', true).datum(plotData).attr('d', area);
    graph.append('path').classed('line', true).datum(plotData).attr('d', line);
    if (indicator.benchmark) {
      graph.append('path').classed('benchmarkLine', true).datum(plotData).attr('d', benchmarkLine);
    }

    if (indicator.spark_type == '3-rank') {
      addRank(chartRow, 'end', totalData.end_rank, totalData.end_rank_q, false, "margin-top:-" + (y(totalData.end_value) + 10) + 'px');
    }

    range = wrapper.append('div').classed('performance-range', true);
    range.append('div').classed('performance-start', true).text(function (d) { return d.start_year; });
    range.append('div').classed('performance-end', true).text(function (d) { return d.end_year; });
  }

  function linkToChart(selection, indicator) {
    if (options.params == 'all') return;
    var href, tooltip;
    if (indicator.lookup == 'hqs_of_large_firms') {
      href = window.location.hash + '/all';
      tooltip = 'Please click here to view a list of this region\'s HQ of Large (Fortune 1000) Firms.';
    } else {
      var regionType = options.compareId ? 'compare' : totalData.regionType;
      var regionCode = options.compareId ? options.compareId : totalData.regionCode;
      href = "/data/report/region/scorecard#/" 
        + [regionType, regionCode, totalData.start_year, totalData.end_year, totalData.type.lookup, options.filter].join('/');
      tooltip = 'Please click here to view a scatterplot of this region\'s performance compared to other similar regions.';
    }
    if (indicator.lookup) {
      selection.append('div').classed('performance-click-target', true).on('click', function() {
        window.open(href, "_blank");
      }).on('mouseenter', function(e) {
        selection.append('div').classed('performance-tooltip', true);
      }).on('mousemove', function(e) {
        var x = (d3.mouse(this)[0] - 80)+ 'px', y = (d3.mouse(this)[1] + 16)+ 'px';
        setTimeout(function() {
          d3.select('.performance-tooltip')
            .text(tooltip)
            .style({top: y, left: x, display: 'inline-block'});
        }, 100);
      }).on('mouseleave', function(e) {
        d3.select('.performance-tooltip').remove();
      });
    }
  }

  function captureButton() {
    if (options.params == 'all') return;
    d3.select('.performance-indicator')
      .append('div').classed('performance-capture', true)
        .on('mouseover', function(e) {
          d3.select(this).style('display', 'inline-block');
        })
      .append('a').classed('btn btn-default', true)
        .attr('href', function() {
          return getDatasources() + '/png';
        })
        .attr('title', 'Download Capture')
      .append('span').classed('glyphicon glyphicon-picture', true);
    d3.selectAll('body')
      .on('mouseenter', function(e) {
          d3.select('.performance-capture').style('display', 'inline-block');
        })
      .on('mouseleave', function(e) {
          d3.select('.performance-capture').style('display', 'none');
        });
  }

  function buildCompanies(wrapper, data, totalData, indicator) {
    var change = wrapper.select('.performance-change').html(''),
      title, companies;
    change.append('span').classed('performance-companies-label', true).text('HQs: ');
    change.append('span').text(totalData.end_value)
    
    var rankContainer = change.append('div').classed('performance-companies-rank', true);
    addRank(rankContainer, 'rate', totalData.end_rank, totalData.end_rank_q, true);

    var container = wrapper.append('div').classed('performance-companies-wrapper', true);
    if (options.params == 'all') {
      title = 'All firms:';
      companies = totalData.companies;
    } else {
      title = 'Top 5 firms:';
      companies = totalData.companies.slice(0, 5);
    }

    container.append('div').classed('performance-companies-title', true).text(title);
    container.selectAll('span')
      .data(companies).enter()
        .append('span').classed('performance-companies-item',true).text(function (d, i) {
          return totalData.rank[i] + '. ' + d; 
        });
  }

  function buildChart(sel) {

    d3.selectAll('div#controls').remove();
    plot = function(selection) {
      var wrapper = buildWrapper(selection, totalData);
      buildTitle(wrapper);
      buildNumbers(wrapper, totalData, totalData.type);
      if (totalData.type.spark_type !== 'none') {
        buildPlot(wrapper, plotData, totalData, totalData.type);
      }
      if (totalData.type.key == 'fortune1000_tl') {
        buildCompanies(wrapper, plotData, totalData, totalData.type);
      }

      linkToChart(selection, totalData.type);
      captureButton();
    };

    container = d3.select(sel);
    chart = container.append('div').datum(plotData).call(plot);

    d3.select(window).on("resize", plot.update).on("hashchange", update);
    return container;
  }

  function getDatasources() {
    return base + '/report/region/spark'+ '/' + options.regionType + '/' + options.regionId + '/' + options.indicator;
  }

  function processData(data) {
    totalData = data.totals;
    data.results.forEach(function (d) { plotData.push(d); });
  }

  function updateOverlay(name, data) {
    plot.layer(name).config.dataFN = function() {return data;};
    plot.layer(name).draw();
  }

  function update() {
    plotData.length = 0;
    updateOptionsFromHash(true);
    var datasource;
    function runLoader() {
      loader.request(getDatasources(), function(){
        processData.apply(this, arguments);
        buildChart('#chart');
      });
    }
    function loadComparison(data) {
        var params = options.params.split(',');
        var i = params[0] || 0;
        options.compareId = options.regionId;
        options.regionType = data.region_data[i].type;
        options.regionId = data.region_data[i].code;
        options.filter = options.regionType;
        if (params[1]) {
          options.className = "indicator-" + params[1];
        }
        runLoader();
      }

    if (options.regionType == 'compare') {
      if (window.parent.Drupal && window.parent.Drupal.settings.hbs_region_compare) {
        loadComparison(window.parent.Drupal.settings.hbs_region_compare)
      } else {
        loader.request('/data/report/region/compare/' + options.regionId, loadComparison)
      }

    } else {
      runLoader();
    }
  }

  d3.selectAll('div#controls').remove();
  d3.selectAll('p.chart-credits').remove();
  resetOptions(defaults);
  updateOptionsFromHash(false);
  update();
})();
