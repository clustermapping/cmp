/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
    loader = new MythosVis.DataLoader(),
    numFormat = d3.format(' >8,.0f'),
    plusFormat = d3.format(' >+8,.0f'),
    defaults = {start: 1998, end: 2011, regionType: 'state', regionId: 51, cluster: 'traded', controls:true, benchmark: true, subcluster: true},
    options,
    container, chart, plot,
    plotData = [], totalData = {value: 0, benchmark: 0},
    yearRange, brush, gBrush,
    base = window.hbsBaseUrl || '';

  function buildChart(sel){
    plot = d3Plot()
      .height(960)
      .scale('y', 'key', 'value')
      .scale('y', 'domain', function(data, key) {
        var ydomain = d3.extent(data, function (d) { return d.value; }),
            adomain = d3.extent(data, function (d) { return d.benchmark; }),
          domain = [d3.min([adomain[0], ydomain[0]]), d3.max([adomain[1], ydomain[1]])];
        if (data.length == 1) {
          domain[0] = domain[0] >= 0 ? 0 : domain[0] * 0.5;
          domain[1] = domain[1] <= 0 ? 0 : domain[1] * 1.5;
        }
        return domain; })
      .scale('y', 'nice', 10)
      .scale("x", {
        key:'label',
        scale: d3.scale.ordinal(),
        attrs: {
          rangeRoundBands: function(data, key, drawWidth, drawHeight, margin){
            var w = plotData.length * 17.8;
            if (plotData.length < 12) {
              w = plotData.length * 45;
            } else if (plotData.length < 25) {
              w = plotData.length * 36;
            }
            return ({ args: [ [0, w], 0.15 ]});
          },
          domain: function(data, key){ return data.map( function(d) { return d[key];} );}
        }
      })
      .scale('barfill', {
        key: 'value',
        scale: d3.scale.threshold(),
        attrs: {
          range: ['#c10020', '#c10020', '#7de559', '#7de559'],
          domain: function (data, key) { return [d3.min(data, function (d) { return d[key]; }), 0, d3.max(data, function (d) { return d[key]; })];}
        }
      })
      .margin.top(150)
      .margin.bottom(420)
      .margin.left(150)
      .def('posBarGradient', {
        type: 'linearGradient',
        name: 'posBarGradient',
        attrs: {x1: 0, y1:0, x2:0, y2:'100%'},
        elements: [
          {
            type: 'stop',
            attrs :{offset: '0%', 'stop-color': 'white', 'stop-opacity': '0' }
          },
          {
            type: 'stop',
            attrs: { offset: '100%', 'stop-color': '#111', 'stop-opacity': '.3' }
          }
        ]
      })
      .def('negBarGradient', {
        type: 'linearGradient',
        name: 'negBarGradient',
        attrs: {x1: 0, y1:'100%', x2:0, y2:0},
        elements: [
          {
            type: 'stop',
            attrs :{offset: '0%', 'stop-color': 'white', 'stop-opacity': '0' }
          },
          {
            type: 'stop',
            attrs: { offset: '100%', 'stop-color': '#111', 'stop-opacity': '.3' }
          }
        ]
      })
      .layer('guideLayer',{
        kind: 'guide',
        name: "guides",
        enabled: true,
        selectable: false,
        clip: true,
        elements:[
          {
            type: 'line',
            axis: 'y',
            dataSource : function() { return 0;},
            attrs:{
              y1: 'y',
              y2: 'y',
              style: 'stroke: #333'
            }
          }]
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
            'vertical-tick-label': true,
            attrs:{
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
	    xoffset: -20,
            label:function(d){ return 'Job Creation ' + options.start + " to " + options.end },
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
        selectable: true,
        clip: true,
        elements:[
          {
            type: 'rect',
            attrs:{
              fill: 'barfill',
              x: 'x',
              y: function(d) {
                var sY = plot.scale('y');
                return sY.scale( Math.max( (d[sY.key]), 0) );
              },
              width: function(){return plot.scale('x').scale.rangeBand();},
              height: function(d) {
                var sY = plot.scale('y');
                return Math.abs(sY.scale(0)-sY.scale(d[sY.key]));
              }
            }
          }
        ]
      })
      .layer('barGrads', {
        kind:"bar",
        name: "barGrads",
        enabled: true,
        selectable: true,
        clip: true,
        elements:[
          {
            type: 'rect',
            attrs:{
              x: 'x',
              y: function(d) {
                var sY = plot.scale('y');
                return sY.scale( Math.max( (d[sY.key]), 0) );
              },
              width: function(){return plot.scale('x').scale.rangeBand();},
              height: function(d) {
                var sY = plot.scale('y');
                return Math.abs(sY.scale(0)-sY.scale(d[sY.key]));
              },
              style: function(d) { return  'fill:'+(d.value > 0 ? 'url(#posBarGradient)' : 'url(#negBarGradient)'); }
            }
          }
        ]
      })
      .layer('highlightBar', {
        kind:"bar",
        name: "highlightBar",
        enabled: true,
        selectable: true,
        clip: true,
        elements:[
          {
            type: 'rect',
            attrs:{
//              fill: '#eee',
              class: 'highlight-bar',
              x: 'x',
              y: 0,
              width: function(){return plot.scale('x').scale.rangeBand(); },
              height: function() {return plot.drawHeight(); }
            }
          }
        ],
        behaviors: {
          click: function(d, i) {
            updateOverlay('clusterDetail',[d]);
          }
        }
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
                text: function(d) { if (d) { return d.region; }}
              },
              {
                type: 'h3',
                attrs: {
                  class: 'title-text',
                  style: function (d) { return 'border: 0; margin: 0; padding: 0; color: #334f9f;';}
                },
                text: function(d) { if (d.cluster_name) { return d.cluster_name + ' Cluster' } else { return 'Job Creation by ' + d.type + ', ' + d.start + '-' + d.end; }}
              },
              {
                type: 'h3',
                attrs: {class: 'title-text', style: 'margin-top: 2px'},
                text: function(d){if (d.cluster_name) {return 'Job Creation by ' + d.type + ', ' + d.start + '-' + d.end;} else { return 'Private Employment, Absolute Job Gains'; }}
              }]
          }
        ]})
      .layer('chartNotation', {
        kind: 'info',
        name: 'chartNotation',
        enabled: true,
        dataFN: function() {return [totalData];},
        layerCanvas: 'div',
        attrs: {
          style: " width: 60%; top: 125px; left: 35%; padding: 2px; border: 0; text-align: right"
        },
        elements:[
          {
            type: 'div',
            attrs: {class: 'header'},
            append: [
              {
                type: 'h4',
                attrs: {class: 'title-text'},
                text: function(d){
                  if (d) { return 'Net ' + (d.cluster_name || d.type) + ' Job Creation, ' + d.start + ' to ' + d.end + ': ' + plusFormat(d.value);}
                }
              },
              /*{
                type: 'h4',
                attrs: {class: 'title-text'},
                text: function(d){
                  if (d.benchmark && options.benchmark ) {return "Expected job creation if matching national cluster benchmarks: " + plusFormat(d.benchmark);}
                }
              }*/
            ]
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
              y = plot.scale('y'),
              cr = this.getBoundingClientRect(),
              top = (y.scale(d.value) - (d.value > 0 ? cr.height : 0) + plot.margin.top()),
              left =(xo.scale(d.label) - (cr.width/2)  + plot.margin.left() + xo.scale.rangeBand()/2);
            if ((left + cr.width)  > window.innerWidth) {
              left = xo.scale(d.label) - cr.width/2 + xo.scale.rangeBand()/2;
              top -= Math.abs(y.scale(0)-y.scale(d[y.key]))/2 + cr.height/2;
            }
            return "top:" + top + "px; left: " + left + "px; width: 25%; display:block;";
          },
          class: function (d) {
            var position = 'top',
              xo = plot.scale('x'),
              cr = this.getBoundingClientRect(),
              left =(xo.scale(d.label) - (cr.width/2)  + plot.margin.left() + xo.scale.rangeBand()/2);
            if (d.value < 0) { position = 'bottom'; }
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
            text: function(d){if (d) {return d.label;}}
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
                    text: function(d) {return "Employment, " + options.end + ":";}
                  },
                  {
                    type: 'span',
                    attrs: {class: 'indicator-value'},
                    text: function(d) {if (d && d.end) {return numFormat(d.end);} }
                  }
                ]
              },
              {
                type: 'div',
                attrs: {class: 'indicator'},
                append: [
                  {
                    type: 'span',
                    attrs: {class: 'indicator-label'},
                    text: function(d) { return "Employment, " +  options.start + ":";}
                  },
                  {
                    type: 'span',
                    attrs: {class: 'indicator-value'},
                    text: function(d) {if (d && d.start) {return numFormat(d.start);} }
                  }
                ]
              },
              {
                type: 'div',
                attrs: {class: 'indicator'},
                append: [
                  {
                    type: 'span',
                    attrs: {class: 'indicator-label'},
                    text: "Job Creation:"
                  },
                  {
                    type: 'span',
                    attrs: {class: function (d) { return 'indicator-value ' + (d.value > 0 ? 'positive' : 'negative');}},
                    text: function(d) {if (d && d.value) {return plusFormat(d.value);} }
                  }
                ]
              },
              {
                type: 'div',
                attrs: {class: 'indicator'},
                append: [
                  {
                    type: 'span',
                    attrs: {class: 'indicator-label'},
                    text: "Expected:"
                  },
                  {
                    type: 'span',
                    attrs: {class: function (d) { return 'indicator-value ' + (d.benchmark > 0 ? 'positive' : 'negative');}},
                    text: function(d) {if (d && d.end) {return plusFormat(d.benchmark);} }
                  }
                ]
              },
              {
                type: 'div',
                attrs: {class: 'action',
                  style: function() {
                    return "display:" + (!options.subcluster? 'none':'')
                  }},
                append: [
                  {
                    type: 'a',
                    attrs: {
                      href: function(d) { return (options.clusterNotId ? location(d.key) : '/data/report/region/industry#/'  + options.regionType + '/' + options.regionId + '/' + d.parent_key + '/' + d.key); },
                      target: function () { return (options.clusterNotId ? '' : '_blank')}
                    },
                    text:  function() { return (!options.subcluster ? "" : (options.clusterNotId ? "Explore Subclusters" : "Explore Industries")); },
                    append: [
                      {
                        type: 'span',
                        attrs: {class: 'glyphicon glyphicon-zoom-in'}
                      }
                    ]
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
                        if(options.subcluster && !options.clusterNotId ){
                          return '/cluster/' + d.parent_key +'/subclusters/' + d.key;
                        }
                        return '/cluster/' + d.key;
                      },
                      target: '_parent'
                    },
                    text: function(d){
                      return options.subcluster && !options.clusterNotId ? "Go to Subcluster Dashboard" :"Go to US Cluster Dashboard";
                    },
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
                  style: function() {return "display:" + ((options.subcluster && !options.clusterNotId) || options.regionType == "country"? 'none':'');}
                },
                append: [
                  {
                    type: 'a',
                    attrs: {
                      href: function(d) {
                        return '/region-cluster/' + d.key + '/' + options.regionType + '/' + totalData.regionKey;
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

    if(options.benchmark) {
      plot.layer('benchmarkLines', {
        kind:"bar",
        name: "benchmarkLines",
        enabled: true,
        selectable: true,
        clip: true,
        elements:[
          {
            type: 'line',
            attrs:{
              stroke: '#fc5920',
              'stroke-width': 2,
              x1: 'x',
              x2: function(d){
                var sX = plot.scale('x');
                return  sX.scale(d[sX.key]) +  sX.scale.rangeBand();
              },
              y1: function(d,i){return plot.scale('y').scale(d.benchmark);},
              y2: function(d,i){return plot.scale('y').scale(d.benchmark);}
            }
          }
        ]
      });
      plot.layer('legend', {
        kind: 'info',
        name: 'legend',
        enabled: true,
        dataFN: function() {return [totalData];},
        layerCanvas: 'div',
        attrs: {
          style: " width: 40%; top: 200px; left: 55%; padding: 5px; border: 1px solid #777d85; "
        },
        elements:[
          {
            type: 'div',
            attrs: {class: 'header'},
            append: [
              {
                type: 'div',
                attrs: {style: "clear:both"},
                append: [
                  {type: 'div', attrs: {style: function(d) {return "height: 3px; width: 15px; margin: 10px 3px; float: left; background-color:#fc5920";}}},
                  {type: 'div', attrs: {style: function(d) {return "padding: 3px; float: left;font-size: 14px; color: #777d85";}}, text: "indicates expected job creation given national growth"}
                ]
              }
            ]
          }
        ]});
    }

    container = d3.select(sel);
    chart = container.append('div').datum(plotData).call(plot);
    d3.select(window).on("resize", plot.update).on("hashchange", update);
    return container;
  }

  function location(selectedCluster){
    var selected = selectedCluster || options.cluster,
        region = '/' + options.regionType + '/' + options.regionId,
        years= '/' + options.start + '/' + options.end,
        cluster =  '/' + selected,
      oldHash = window.location.hash,
      queryIndex = oldHash.indexOf('?'),
      qops = (queryIndex == -1 ? '' : oldHash.substring(queryIndex)),
      hash = '#' + region +  years + cluster + qops;
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
    if (parts.length < 5) {
      console.error("Please specify a hash in the form: /:type/:code/:start/:end/:cluster");
    }
    resetOptions(defaults);
    options.regionType = parts[0];
    options.regionId = parts[1];
    options.start = parts[2];
    options.end = parts[3];
    options.cluster = parts[4];
    options.clusterNotId = ( options.cluster === 'traded' || options.cluster === 'local' || options.cluster === 'all');
    Object.keys(q).forEach(function(qk) {
      options[qk] = q[qk];
    });

    if (!render) { return; }

    if (options.controls) {
      d3.selectAll('#controls').style('display', null);
      downloadControls();
      clusterControls();
      yearControls();
    } else {
      d3.selectAll('#controls').style('display', 'none');
    }
  }

  function getDatasources() {
    return base + '/report/region/jobcreation' + window.location.hash.substring(1).split('?')[0];
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
    loader.request(getDatasources(), function(){
      processData.apply(this, arguments);
      if (plotData.length < 12) {
        plot.margin.right(plot.width() - (40 * plotData.length) - plot.margin.left() );
      } else if (plotData.length < 25) {
        plot.margin.right(plot.width() - (30 * plotData.length) - plot.margin.left() );
      } else {
        plot.margin.right(plot.width() - (15.8 * plotData.length) - plot.margin.left() );
      }
      plot.update();
      ['chartTitle', 'chartNotation'].forEach(function (name) {
        updateOverlay(name, [totalData]);
      });
      updateOverlay('clusterDetail',[]);
      parent.jQuery(window.parent).trigger('resize');
    });
  }

  function clusterControls() {
    var container = d3.selectAll('.cluster-controls'),
        cluster = container.selectAll('.cluster-type'), label;
    if (cluster.empty()) {
      cluster = container.append('div').attr({class:'btn-group cluster-type', 'data-toggle':'buttons'});
      label = cluster.append('label').attr('class', 'btn btn-default').text('Traded');
      label.append('input').attr({type:'radio', name:'options', id:'option1', value:'traded'});
      label = cluster.append('label').attr('class', 'btn btn-default').text('Local');
      label.append('input').attr({type:'radio', name:'options', id:'option2', value:'local'});
    }
    cluster.attr('style', (!options.clusterNotId? 'display:none' : '') );


    if (!options.clusterNotId) { return; }
    var active = cluster.select('input[value=' + options.cluster + ']');

    cluster.selectAll('input').property('checked', false);
    cluster.selectAll('.btn').classed('active', false);
    active.property('checked', true);
    d3.select(active.node().parentNode).classed('active', true);
    $('.cluster-type input').change(function() {
      go(location(this.value));
    });
    d3.selectAll('.cluster-type input').on('change', function() {
      go(location(this.value));
    });
  }

  function fetchYears(cb) {
    loader.request(base + '/meta/years', function(years) {
      yearRange = d3.extent(years);
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

    options.start = extent1[0].getFullYear();
    options.end = extent1[1].getFullYear();
    go(location());
  }

  function yearControls() {
    if (!yearRange) {
      fetchYears(yearControls);
      return;
    }

    if (!brush) {
      var margin = {top: 20, right: 40, bottom: 20, left: 20},
          width = (plot.drawWidth() * .7) - margin.left - margin.right,
          height = 65 - margin.top - margin.bottom,
        x = d3.time.scale()
          .domain([new Date(yearRange[0],0,1), new Date(yearRange[1], 0, 1)])
          .range([0, width]);

      var arc = d3.svg.arc()
        .outerRadius(height / 2)
        .startAngle(0)
        .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });
      brush = d3.svg.brush()
        .x(x)
        .extent([new Date(options.start, 0, 1), new Date(options.end, 0, 1)])
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
          .tickPadding(0))
        .selectAll("text")
        .attr("x", 6)
        .style("text-anchor", null);

      gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.event);

      gBrush.selectAll(".resize").append("path")
        .attr("transform", "translate(0," +  height / 2 + ")")
        .attr("d", arc);

      gBrush.selectAll("rect")
        .attr("height", height);

    } else {
      gBrush.transition()
        .call(brush.extent([new Date(options.start, 0, 1), new Date(options.end, 0, 1)]))
        .call(brush.event);
    }
  }

  function serviceUrl(suffix) {
    var hash = window.location.hash.substring(1).split('?')[0];
    return window.location.pathname.replace(/viz\/.*/, 'report/region/jobcreation') +
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


  resetOptions(defaults);
  updateOptionsFromHash(false);
  buildChart('#chart');
  update();

})();
