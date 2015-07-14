/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
    loader = new MythosVis.DataLoader(),
    numFormat = d3.format(' >8,.0f'),
    percentFormat = d3.format('.3p'),
    plusFormat = d3.format(' >+8,.0f'),
    defaults = {year: 2011, controls: true, key: 'percent' },
    options,
    container, chart, plot,
    plotData = [], totalData = {value: 0, benchmark: 0},
    yearRange, brush, gBrush,
    colors = ['#2ca25f', '#2b8cbe', '#f03b20', '#b833bb', '#dd1c77', '#d95f0e', '#a6bddb', '#feb24c', '#c994c7', '#fa9fb5'],
    base = window.hbsBaseUrl || '';

  function buildChart(sel){
    plot = d3Plot()
      .height(500)
      .margin.top(150)
      .margin.bottom(100)
      .margin.left(100)
      .margin.right(50)
      .scale('x', {
        key: 'label',
        scale: d3.scale.ordinal(),
        attrs: {
          domain: function(data, key) {
            return plotData.map(function(d){ return d.label });
          },
          rangeRoundBands: function(data, key, drawWidth, drawHeight, margin) {
            var w = (drawWidth - margin.left - margin.right);
            return ({ args: [ [0, w], 0.15 ]});
          }
        }
      })
      .scale('x1', {
        key: 'regions',
        scale: d3.scale.ordinal(),
        attrs: {
          domain: function(data, key) {
            if (totalData && totalData.region_data) {
              return totalData.region_data.map(function(d){ return d.id });
            }
            return []
          },
          rangeRoundBands: function(data, key, drawWidth, drawHeight, margin) {
            var w = plot.scale('x').scale.rangeBand();
            return ({ args: [ [0, w], 0.08 ]});
          }
        }
      })
      .scale('y', 'nice', 10)
      .scale('y', 'key', options.key)
      .scale('y', 'format', options.key == 'percent' ? '.2p' : '>8,.0f')
      .scale('y', 'domain', function(data, key) {
          var min = d3.min(plotData.map(function(d){ return d3.min(d.regions, function(d){ return d[key] } )}));
          var max = d3.max(plotData.map(function(d){ return d3.max(d.regions, function(d){ return d[key] } )}));
          return [min, max];
        })
      .layer('axisLayer',{
        kind: 'axis',
        name: "axes",
        enabled: true,
        selectable: false,
        elements:[
          {
            type: 'x',
            label: function() { return (totalData.cluster_name ? 'Subclusters' : 'Clusters') },
            // 'vertical-tick-label': true,
            attrs:{
              class: 'axes-item wrap',
              transform: function(d){
                return "translate(0, " + (plot.drawHeight() - plot.margin.top() - plot.margin.bottom()) + ")";
              }
            },
            axis:{
              fn: d3.svg.axis(),
              attrs:{orient: 'bottom'}
            }
          },
          {
            type:'y',
            label:function(d) {
              if (totalData.indicator)
                return totalData.indicator.label + ', ' + options.year.replace('/', ', ')
            },
            axis:{
              fn: d3.svg.axis(),
              attrs:{orient: 'left'}
            }
          }]
      })
      .layer("barLayer", {
        kind:"bar",
        name: "barLayer",
        enabled: true,
        duration: 0,
        selectable: true,
        clip: true,
        elements:[
          {
            type: 'g',
            attrs:{
              transform: function(d) {
                var sX = plot.scale('x');
                return "translate(" + (sX.scale(d[sX.key])) + ", 0)";
              },
              class: 'cluster',
              y: function(d) {
                var sY = plot.scale('y');
                return sY.scale( Math.max( (d[sY.key]), 0) );
              },
              width: function(){return plot.scale('x').scale.rangeBand();},
              height: function(d) { return plot.drawHeight();
                var sY = plot.scale('y');
                return Math.abs(sY.scale(0) - sY.scale(d[sY.key]));
              }
            }
          }
        ]
      })
      .layer('chartLegend', {
        kind: 'info',
        name: 'chartLegend',
        enabled: true,
        dataFN: function() {return [totalData.region_data];},
        layerCanvas: 'div',
        attrs: {
          style: "width: 240px; top:10px; right: 0; padding: 2px; border: 0; text-align: left; z-index: 999; overflow:hidden;"
        },
        elements:[
          {
            type: 'div',
            attrs: { },
            html: function(d) {
              if (d) {
                return d.map(function(r, i){
                  return '<div class="compare-legend"><span class="compare-legend-'+i+'"></span><a target="_blank" href="/region/' + r.type + '/' + r.key + '">' + r.name + '</a></div>';
                }).join('')
              }
            }
          }
        ]
      })
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
                  if (totalData.name) {
                    return totalData.name ;
                  }
                }
              },
              {
                type: 'h3',
                attrs: {
                  class: 'title-text',
                  style: function (d) { return 'border: 0; margin: 0; padding: 0; color: #334f9f;';}
                },
                text: function(d) { 
                  if (totalData.indicator) {
                    return totalData.indicator.label + ', ' + options.year.replace('/', ', ') + '';
                  }
                  return '';
                }
              },
              {
                type: 'h3',
                attrs: {class: 'title-text', style: 'margin-top: 2px'},
                text: function(d){
                  if (totalData.indicator) {
                    return totalData.indicator.subtitle ;
                  }
                  return '';
                }
              }]
          }
        ]})
      .layer('clusterDetail', {
        duration: 150,
        kind: 'info',
        name: 'clusterDetail',
        enabled: true,
        dataFN: function() {return [];},
        layerCanvas: 'div',
        attrs: {
          style: function(d) {
            var xo = plot.scale('x'),
              x1 = plot.scale('x1'),
              y = plot.scale('y'),
              cr = this.getBoundingClientRect(),
              top = (y.scale(d[y.key]) - (d[y.key] > 0 ? cr.height : 0) + plot.margin.top()),
              left =(xo.scale(d.cluster) + x1.scale(d.id) - (cr.width/2)  + plot.margin.left() + x1.scale.rangeBand()/2);
            if ((left + cr.width)  > window.innerWidth) {
              left = xo.scale(d.cluster) + x1.scale(d.id) - cr.width/2 + xo.scale.rangeBand()/2;
              top -= Math.abs(y.scale(0)-y.scale(d[y.key]))/2 + cr.height/2;
            }
            return "top:" + top + "px; left: " + left + "px; width: 205%; display:block;";
          },
          class: function (d) {
            var position = 'top',
              xo = plot.scale('x'),
              y = plot.scale('y'),
              cr = this.getBoundingClientRect(),
              left =(xo.scale(d.label) - (cr.width/2)  + plot.margin.left() + xo.scale.rangeBand()/2);
            if (d[y.key] < 0) { position = 'bottom'; }
            if ((left + cr.width)  > window.innerWidth) { position = 'left'; }
            return 'popover ' + position + ' clusterDetail-item';
          }
        },
        elements:[
          {
            type: 'div',
            attrs: {class: 'arrow'}
          },
          {
            type: 'div',
            attrs:  {class: 'close'},
            append: [
              {
                type: 'span',
                attrs: {class: 'glyphicon glyphicon-remove'}
              }
            ]
          },
          {
            type: 'h3',
            attrs: {class: 'popover-title'},
            text: function(d){if (d) {
              var r = totalData.region_data.filter(function(r){ if (r.id == d.id) return true }).pop();
              return r.name;
            }}
          },
          {
            type: 'div',
            attrs: {class: 'popover-content'},
            append: [
              {
                type: 'div',
                attrs: {class: 'indicator'},
                append: [
                  {
                    type: 'span',
                    attrs: {class: 'indicator-label'},
                    text: function(d) {return 'Total ' + totalData.indicator.label + ", " + options.year + ":";}
                  },
                  {
                    type: 'span',
                    attrs: {class: function (d) { return 'indicator-value ' + (d.total > 0 ? 'positive' : 'negative');}},
                    text: function(d) {if (d) {return numFormat(d.total);} }
                  }
                ]
              },
              {
                type: 'div',
                attrs: {class: 'indicator', style: 'font-weight: bold;'},
                text: function(d) {if (d) return d.cluster + ' Cluster'; }
              },
              {
                type: 'div',
                attrs: {class: 'indicator'},
                append: [
                  {
                    type: 'span',
                    attrs: {class: 'indicator-label'},
                    text: function(d) {return totalData.indicator.label + ", " + options.year + ":";}
                  },
                  {
                    type: 'span',
                    attrs: {class: function (d) { return 'indicator-value ' + (d.value > 0 ? 'positive' : 'negative');}},
                    text: function(d) {if (d) {
                      var y = plot.scale('y');
                      var format = d3.format(y.format);
                      return format(d[y.key]);} }
                  }
                ]
              },
              {
                type: 'div',
                attrs: {class: 'action'},
                append: [
                  {
                    type: 'a',
                    attrs: {
                      href: function(d) {
                        return '/cluster/' + d.key;
                      },
                      target: '_parent'
                    },
                    text: "Go to US Cluster Dashboard",
                    append: [
                      {
                        type: 'span',
                        attrs: {class: 'glyphicon glyphicon-play'}
                      }
                    ]
                  }
                ]
              },
              {
                type: 'div',
                attrs: {
                  class: 'action',
                  style: ''
                },
                append: [
                  {
                    type: 'a',
                    attrs: {
                      href: function(d) {
                        var r = totalData.region_data.filter(function(r){ if (r.id == d.id) return true }).pop();
                        return '/region-cluster/' + d.key + '/' + r.type + '/' + r.key;
                      },
                      target: '_parent'
                    },
                    text:  "Go to Region-Cluster Dashboard",
                    append: [
                      {
                        type: 'span',
                        attrs: {class: 'glyphicon glyphicon-play'}
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        behaviors: {
          click: function() {
            updateOverlay('clusterDetail', []);
          }
        }});

    container = d3.select(sel);
    chart = container.append('div').datum(plotData).call(plot);
    d3.select(window).on("resize", function(){
      plot.update();
      renderClusterRegions();
    }).on("hashchange", update);

    return container;
  }

  function  location() {
    return '#/' + [options.code, options.key, options.indicator, options.year].join('/');
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
    if (parts.length < 4) {
      console.error("Please specify a hash in the form: /:code/:cluster/:indicator/:year");
    }

    resetOptions(defaults);
    options.code = parts[0];
    options.key = parts[1];
    options.indicator = parts[2];
    options.year = parts[3] + (parts[4] ? '/' + parts[4] : '');

    Object.keys(q).forEach(function(qk) {
      options[qk] = q[qk];
    });

    if (!render) { return; }

    if (options.controls) {
      d3.selectAll('#controls').style('display', null);
      downloadControls();
      filterControls();
      yearControls();
    } else {
      d3.selectAll('#controls').style('display', 'none');
    }
  }

  function getDatasources() {
    return base + '/report/region/compare/' + [options.code, options.key, options.indicator, options.year].join('/');
  }

  function processData(data) {
    totalData = data;
    data.results = data.results.slice(0, 8);
    data.results.forEach(function (d) { plotData.push(d); });
  }

  function updateOverlay(name, data) {
    plot.layer(name).config.dataFN = function() {return data;};
    plot.layer(name).draw();
  }

  function update() {
    window.plot = plot;
    plotData.length = 0;
    d3.selectAll('.cluster').remove();
    updateOptionsFromHash(true);
    loader.request(getDatasources(), function(){

      processData.apply(this, arguments);
      plot.scale('y', 'key', options.key);
      plot.scale('y', 'format', options.key == 'percent' ? '.2p' : '>8,.0f');
      plot.update();
      updateOverlay('chartTitle', [totalData]);
      updateOverlay('clusterDetail',[]);
      renderClusterRegions();
      parent.jQuery(window.parent).trigger('resize');
    });
  }

  function renderClusterRegions() {
    updateOverlay('axisLayer',[]);
    var enter = d3.selectAll('.cluster').data(plotData)
      .selectAll('rect')
      .data(function(d) {
        return d.regions.map(function(r) { r.cluster = d.label; r.key = d.key; return r; });
      })
      .enter()
    enter.append('rect')
      .attr('fill', function(d) {
        var i = totalData.region_data.map(function(r) { return r.id }).indexOf(d.id);
        return colors[i];
      })
      .attr('x', function(d, i) {
        return plot.scale('x1').scale(d.id);
      })
      .attr('y', function(d, i) {
        var sY = plot.scale('y');
        return sY.scale( Math.max( (d[sY.key]), 0) );
      })
      .attr('height', function(d) {
        var sY = plot.scale('y');
        return Math.abs(sY.scale(0)-sY.scale(d[sY.key]));
      })
      .attr('width', function(d) {
        return plot.scale('x1').scale.rangeBand();
      });
    enter.append('rect')
      .attr('class', 'highlight-bar')
      .attr('fill', 'transparent')
      .attr('x', function(d, i) {return plot.scale('x1').scale(d.id); })
      .attr('y', function(d, i) {var sY = plot.scale('y'), dom = sY.scale.domain(); return sY.scale( Math.max( (dom[1]), 0) ); })
      .attr('height', function(d) {var sY = plot.scale('y'); return plot.drawHeight(); })
      .attr('width', function(d) {return plot.scale('x1').scale.rangeBand(); })
      .on('click', function(d) {
        updateOverlay('clusterDetail',[d]);
      });
    d3.selectAll(".axes-item.wrap").selectAll(".tick text").call(wrap, plot.scale('x').scale.rangeBand() -5);
  }

  function filterControls() {
    var container = d3.selectAll('.cluster-controls'),
        cluster = container.selectAll('.cluster-type'), label;
    if (cluster.empty()) {
      cluster = container.append('div').attr({class:'btn-group cluster-type', 'data-toggle':'buttons'});
      label = cluster.append('label').attr('class', 'btn btn-default').text('Percent');
      label.append('input').attr({type:'radio', name:'options', id:'option1', value:'percent'});
      label = cluster.append('label').attr('class', 'btn btn-default').text('Absolute');
      label.append('input').attr({type:'radio', name:'options', id:'option2', value:'value'});
    }
    var active = cluster.select('input[value=' + options.key + ']');


    cluster.selectAll('input').property('checked', false);
    cluster.selectAll('.btn').classed('active', false);
    active.property('checked', true);
    d3.select(active.node().parentNode).classed('active', true);
    $('.cluster-type input').change(function() {
      options.key = this.value;
      go(location());
    });
    d3.selectAll('.cluster-type input').on('change', function() {
      options.key = this.value;
      go(location());
    });
  }

  function fetchYears(cb) {
    loader.request(base + '/meta/years', function(years) {
      yearRange = d3.extent(years);
      yearRange = [+yearRange[0], +yearRange[1]];
//      yearRange[1] += 1;
      if (cb) {cb();}
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

    var start = extent1[0].getFullYear();
    var end = extent1[1].getFullYear();

    if (options.year.split('/').length == 2) {
      options.year = start + '/' + end; 
    } else {
      options.year = String(start);
    }

    go(location());
  }

  function yearControls() {
    var margin = {top: 20, right: 40, bottom: 20, left: 20},
      width = (plot.drawWidth() * .7) - margin.left - margin.right,
      height = 65 - margin.top - margin.bottom,
      years = options.year.split('/'),
      start, end,
      x;

    if (years.length == 2) {
      start = +years[0];
      end = +years[1];
    } else {
      start = +years;
    }

    if (!yearRange) {
      fetchYears(yearControls);
      return;
    }

    if (!brush) {
      var arc = d3.svg.arc()
        .outerRadius(height / 2)
        .startAngle(0)
        .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });

      x = d3.time.scale()
        .domain([new Date(yearRange[0],0,1), new Date(yearRange[1]+1, 0, 1)])
        .range([0, width]);

      brush = d3.svg.brush()
        .x(x)
        .extent([new Date(start, 0, 1), new Date(end || start+1, 0, 1)])
        .on("brushend", brushended);

      var svg = d3.select(".year-control").insert("svg", ":first-child")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("rect")
        .attr("class", "grid-background")
        .attr("width", width)
        .attr("height", height);

      svg.append("g")
        .attr("class", "x grid")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(d3.time.years)
          .tickSize(-height)
          .tickFormat(""));

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(d3.time.years)
          .tickValues(d3.time.years(new Date(yearRange[0],0,1), new Date(yearRange[1]+1, 0, 1)))
          .tickPadding(0))
        .selectAll("text")
        .attr("x", 6)
        .style("text-anchor", null);

      gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.event);

      if (end) {
        gBrush.selectAll(".resize").append("path")
          .attr("transform", "translate(0," +  height / 2 + ")")
          .attr("d", arc);
      } else {
        gBrush.selectAll(".resize")
          .remove();
      }

      gBrush.selectAll("rect")
        .attr("height", height);
    } else {
      gBrush.transition()
        .call(brush.extent([new Date(start, 0, 1), new Date(end || start+1, 0, 1)]));
    }
  }

  function captureUrl() {
    var path = '/data/report/capture/comparison/';
    var url = encodeURIComponent( document.location.pathname + document.location.hash);
    return path + encodeURIComponent( url);
  }

  function serviceUrl(suffix) {
    var url = '/data/report/region/csv/compare/' + [options.code, options.key, options.indicator, options.year].join('/');
    return url;
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
    addButton(container, 'Download Image of Chart', 'picture', captureUrl());
  }

  updateOptionsFromHash(false);
  buildChart('#chart');
  update();

})();
