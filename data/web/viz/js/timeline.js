/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
    loader = new MythosVis.DataLoader(),
    numFormat = d3.format(' >8,.0f'),
    roundedNumFormat = d3.format(',.r'),
    percentFormat = d3.format('.2%'),
    plusFormat = d3.format(' >+8,.0f'),
    percentPlustFormat = d3.format('+.2%'),
    defaults = {regionType: 'state', regionId: 51, controls:true, benchmark: true, subcluster: true, page: 1, pageCount: 5},
    options,
    container, chart, plot,
    plotData = [], totalData = {value: 0, benchmark: 0},
    yearRange, brush, gBrush,
    base = window.hbsBaseUrl || '',
    order = [],
    stack = d3.layout.stack()
                .offset('zero')
                .values(function(d) { return d.values;})
                .x(function(d){ return d.year; })
                .y(function(d) { return d.value})
                .order(function (data) {
                  order = data.map(function(d,i) { return [i,d[0][1]]; })
                             .sort(function(a,b) { return d3.ascending(a[1], b[1]); })
                             .map(function(d) { return d[0];});
                  return order;
                }),
    color = d3.scale.category10();

  function inCurrentPage(i) {
    var pos = order.indexOf(i),
        chunk = order.length/options.pageCount,
        pageStart = order.length - (chunk * options.page) - 1,
        pageEnd = order.length - (chunk * (options.page -1));
    return pos > pageStart && pos < pageEnd;
  }

  function rangeForCurrentPage(data) {
    return [0, d3.max(data.map(function(d,i) { return inCurrentPage(i) ? d3.max(d.values, function(d) { return d.y0 + d.y; }): 0 }))];
  }

  function buildChart(sel){
  var area = d3.svg.area().interpolate('monotone')
      .x(function(d) {
        return plot.scale('x').scale(d.year);
      })
      .y0(function(d){
        return plot.scale('y').scale(d.y0);
      })
      .y1(function(d) {
        return plot.scale('y').scale(d.y0 + d.y);
      }),
      plotFn = function()  { return plot;},
      totalDataFn = function() { return [totalData]};

    plot = d3Plot()
      .height(700)
      .duration(250)
      .margin.top(125)
      .margin.bottom(125)
      .margin.left(100)
      .margin.right(200)
      .scale('y', 'scale', (totalData.type.plot_scale === 'log' ? d3.scale.log() : d3.scale.linear()) )
      .scale("y", 'domain', rangeForCurrentPage)
      .scale('y', 'format', totalData.type.format)
      .scale('y', 'nice', 10)
      .scale('x', 'format', 'g')
      .scale('x', 'key', 'year')
      .scale("x", 'domain', function(data, key) {
          return (data[0] ? d3.extent(data[0].values, aFn(key)) : [0,1]);
      })
      .layer('axisLayer', layer('axis', 'axisLayer')
                            .el(createAxis(plotFn, 'x', 'bottom', 'Year'))
                            .el(createAxis(plotFn, 'y', 'left', cr(aFn('0.type.label', ''), totalDataFn)))
                            .make())
      .layer('chartTitle', {
        kind: 'info',
        name: 'chartTitle',
        enabled: true,
        dataFN: function() {return [totalData];},
        layerCanvas: 'div',
        attrs: {
          style: "width: 75%; top:0%; left: 12%; padding: 2px; border: 0; text-align: center"
        },
        elements:[
          {
            type: 'div',
            attrs: {class: 'header'},
            append: [
              {
                type: 'h2',
                attrs: {class: 'title-text', style: 'border: 0; margin-bottom: 2px, padding-bottom: 0'},
                text: function(d) {
                  if (totalData.clusterName) {
                    return totalData.clusterName + ' Cluster';
                  } else if (d) {
                    return d.region;
                  }
                }
              },
              {
                type: 'h3',
                attrs: {
                  class: 'title-text',
                  style: function (d) { return 'border: 0; margin: 0; padding: 0; color: #334f9f; display:' 
                    +  (d.cluster_name || totalData.subClusterName ? 'block' : 'none');}
                },
                text: function(d) {
                  if (totalData.subClusterName) {
                    return totalData.subClusterName + ' Subcluster';
                  } else {
                    return totalData.cluster_name + ' Cluster';
                  }
                }
              },
              {
                type: 'h3',
                attrs: {class: 'title-text', style: 'margin-top: 2px'},
                text: function(d){if (d) {return totalData.indicator.label + ' Time series by ' + d.type + ', ' + d.start + '-' + d.end;}}
              }]
          }
        ]})
      .layer('areas', {
        kind:"point",
        name: "areas",
        enabled: true,
        selectable: true,
        clip: true,
        elements:[
          {
            type: 'path',
            attrs:{
              'stroke-width': 1,
              stroke: function(d,x,i) {
                return (inCurrentPage(i) ? d3.rgb(color(d.id)).darker() : "#ccc")
              },
              fill: function(d,x,i) {
                return (inCurrentPage(i) ? color(d.id) : "#ccc");
              },
              'fill-opacity': 0.2,
              d:function(d) {
                  return area(d.values)
                }
            }
          }
        ],
        behaviors: {
          click: function(d, i) {
            updateOverlay('clusterDetail',[d]);
          }
        }
      })
      .layer('labels', {
        kind:"point",
        name: "labels",
        enabled: true,
        selectable: true,
        clip: false,
        elements:[
          {
            type: 'text',
            attrs: {
              x: function()  {
                return plot.drawWidth() - plot.margin().right - plot.margin().left;
              },
              y: function(d) {
                var y0 = plot.scale('y').scale(d.values[0].y0), y1 = plot.scale('y').scale(d.values[0].y0 + d.values[0].y);
                return y0 + ((y1 - y0) / 2);
              },
              dx: '4',
              dy: '4',
              'text-anchor': 'start',
              style: function(d, x, i) { return "display:" + ( inCurrentPage(i) ? null : 'none'); }
            },
            text: function(d,x,i) { return  d.label;}
          }
        ],
        behaviors: {
          click: function(d, i) {
            updateOverlay('clusterDetail', [d]);
          }
        }
      })
      .layer('clusterDetail', detailPopup()
        .ind({
          label:  function(d) {return totalData.indicator.label + ", " + d.values[0].year + ":";},
          value: function(d) {if (d) { return numFormat(d.values[0].value);} }
        })
        .ind({
          label: function(d) { return totalData.indicator.label + ", " + d.values[d.values.length - 1].year + ":";},
          value: function(d) { if (d) { return numFormat(d.values[d.values.length - 1].value); } }
        })
        /*.action({
          href: function(d) { return (options.subcluster ? location(d.id) : '/cluster/' + d.id); },
          target: function () { return (!options.subcluster ? '_parent' : '');},
          label: function() { return (!options.subcluster ? "Go to US Cluster Dashboard" : (isNaN(+options.cluster) ? "Explore Subclusters" : "Explore Industries")); },
          icon: 'play'
        })*/
        .action({
          href: function(d) {
            if (options.cluster == 'state' || totalData.type == 'State') {
              return '/region-cluster/' + (d.parent_key || d.key) + '/' + totalData.regionType + '/' + ( typeof totalData.regionKey == 'undefined'? d.regionKey : totalData.regionKey );
            } else if (totalData.type == 'Subcluster') {
              return '/cluster/' + d.parent_key +'/subclusters/' + d.key;
            } else {
              return '/cluster/' + d.key;
            }
          },
          target: function () { return options.subcluster && !isNaN(+options.cluster) ? '':'_parent';},
          label: function() {
            if (options.cluster == 'state' || totalData.type == 'State') {
              return "Go to Region-Cluster Dashboard";
            } else if (totalData.type == 'Subcluster') {
                return "Go to Subcluster Dashboard";
            } else {
              return "Go to US Cluster Dashboard";
            }
          },
          icon: 'play'
        })
        .behavior('click', function () { updateOverlay('clusterDetail', []); })
        .make()
      );

    container = d3.select(sel);
    if (plotData && plotData.length>0) {totalData.end = plotData[0].lastYear;}
    chart = container.append('div').datum(plotData).call(plot);
    d3.select(window).on("resize", plot.update).on("hashchange", update);
    return container;
  }

  function location(cluster, indicator) {
    var region = '/' + options.regionType + '/' + options.regionId,
      cluster = '/' + (cluster || options.cluster),
      indicator = '/' + (indicator || options.indicator),
      oldHash = window.location.hash,
      queryIndex = oldHash.indexOf('?'),
      qops = (queryIndex == -1 ? '' : oldHash.substring(queryIndex)),
      hash = '#' + region + cluster + indicator + qops;
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

  function resetOptions(defaults){
    options = options || {};
    Object.keys(defaults).forEach(function(d) {
      options[d] = defaults[d];
    });
  }

  function updateOptionsFromHash(render) {
    var h = window.location.hash.substring(2),
      uq = h.split('?'),
      parts = uq[0].split('/'),
      q = parseQuery(uq[1]);

    /*if (parts.length < 4) {
      console.error("Please specify a hash in the form: /:type/:code/:cluster/:indicator");
    }*/
    resetOptions(defaults);
    options.regionType = parts[0];
    options.regionId = parts[1];
    options.cluster = parts[2];
    options.indicator = parts[3];
    Object.keys(q).forEach(function(qk) {
      options[qk] = q[qk];
    });

    if (!render) { return; }

    if (options.controls) {
      d3.selectAll('#controls').style('display', null);
      downloadControls();
    } else {
      d3.selectAll('#controls').style('display', 'none');
    }
  }

  function getDatasources() {
    return window.location.pathname + window.location.hash.substring(1).split('?')[0];
  }

  function processData(data) {
    // remove empty years
    for (var i=0;i<data.results.length;i++) {
      while (data.results[i].lastVal == 0) {
        data.results[i].values.shift();
        data.results[i].lastVal = data.results[i].values[0].value;
        data.results[i].lastYear = data.results[i].values[0].year;
      }
    }
    data.totals.end = data.results[0].lastYear;

    totalData = data.totals;
    color.domain(data.results.map(function(d) { return d.id; }));
    stack(data.results).forEach(function (d) { plotData.push(d); });
  }

  function updateOverlay(name, data) {
    plot.layer(name).config.dataFN = function() {return data;};
    plot.layer(name).draw();
  }

  function update() {
    plotData.length = 0;
    updateOptionsFromHash(true);

    loader.request(getDatasources(), function(){
      processData.apply(this, arguments);
      if (plot) {
        plot.update();

      } else {
        buildChart('#chart');
        downloadControls();
        indicatorControls();
        regionTypeControls();
      }
      ['chartTitle'].forEach(function (name) {
        updateOverlay(name, [totalData]);
      });
      updateOverlay('clusterDetail',[]);
      parent.jQuery(window.parent).trigger('resize');
    });
  }



  function brushended() {
    if (!d3.event.sourceEvent) return; // only transition after input
    var extent0 = brush.extent(),
      extent1 = extent0.map(d3.time.year.round);
    // if empty when rounded, use floor & ceil instead
    if (extent1[0] >= extent1[1]) {
      extent1[0] = d3.time.year.floor(extent0[0]);
      extent1[1] = d3.time.year.ceil(extent0[1]);
    }

    d3.select(this).transition()
      .call(brush.extent(extent1))
      .call(brush.event);

    options.start = extent1[0].getFullYear();
    options.end = extent1[1].getFullYear();
    go(location());
  }

  function yearControls() {

  }

  function serviceUrl(suffix) {
    var hash = window.location.hash.substring(1).split('?')[0];
    return window.location.pathname.replace(/viz\/.*/, 'report/region/specialization') +
      hash + '/' + suffix;
  }

  function addButton(container, label, icon, url) {
    var button = container.selectAll('.control-' + icon);
    if (button.empty()) {
      button = container.append('a')
        .attr({role: 'button', class:'btn btn-default control-' + icon, title: label});
      button.append('span').attr('class', 'glyphicon glyphicon-' + icon);
    }

    button.attr('href', url);
  }

  function downloadControls() {
    var container = d3.selectAll(".download-controls");
    addButton(container, 'Download Chart Data', 'download', serviceUrl('csv'));
    addButton(container, 'Download Image of Chart', 'picture', serviceUrl('png'));
  }

  function indicatorControls() {
    var container = d3.selectAll('.cluster-controls'),
        indicator = container.selectAll('.indicator-type'), label;
    if (indicator.empty()) {
      indicator = container.append('div').attr({class:'btn-group indicator-type', 'data-toggle':'buttons'});
      label = indicator.append('label').attr('class', 'btn btn-default').text('Employment');
      label.append('input').attr({type:'radio', name:'options', id:'option1', value:'emp_tl'});
      label = indicator.append('label').attr('class', 'btn btn-default').text('Establishments');
      label.append('input').attr({type:'radio', name:'options', id:'option2', value:'est_tl'});
    }

    var active = indicator.select('input[value=' + options.indicator + ']');

    indicator.selectAll('input').property('checked', false);
    indicator.selectAll('.btn').classed('active', false);
    active.property('checked', true);
    d3.select(active.node().parentNode).classed('active', true);
    $('.indicator-type input').change(function() {
      go(location(options.cluster, this.value));
    });
    d3.selectAll('.indicator-type input').on('change', function() {
      go(location(options.cluster, this.value));
    });
  }

  function regionTypeControls() {
    if (['state', 'economic', 'msa', 'county'].indexOf(options.cluster) < 0) return;
    
    d3.selectAll(".year-control").remove();
    var container = d3.selectAll("#controls").append('div').attr('class', 'cluster-controls'),
        regionType = container.selectAll('.regionType'), label;
    if (regionType.empty()) {
      regionType = container.append('div').attr({class:'btn-group regionType', 'data-toggle':'buttons'});
      label = regionType.append('label').attr('class', 'btn btn-default').text('State');
      label.append('input').attr({type:'radio', name:'options', id:'option1', value:'state'});
      label = regionType.append('label').attr('class', 'btn btn-default').text('Economic');
      label.append('input').attr({type:'radio', name:'options', id:'option2', value:'economic'});
      label = regionType.append('label').attr('class', 'btn btn-default').text('MSA');
      label.append('input').attr({type:'radio', name:'options', id:'option2', value:'msa'});
      label = regionType.append('label').attr('class', 'btn btn-default').text('County');
      label.append('input').attr({type:'radio', name:'options', id:'option2', value:'county'});
    }

    var active = regionType.select('input[value=' + options.cluster + ']');

    regionType.selectAll('input').property('checked', false);
    regionType.selectAll('.btn').classed('active', false);
    active.property('checked', true);
    d3.select(active.node().parentNode).classed('active', true);
    $('.regionType input').change(function() {
      go(location(this.value));
    });
    d3.selectAll('.regionType input').on('change', function() {
      go(location(this.value));
    });
  }

  resetOptions(defaults);
  updateOptionsFromHash(false);
  update();

})();
