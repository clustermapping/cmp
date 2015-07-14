/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
    loader = new MythosVis.DataLoader(),
    numFormat = d3.format(' >8,.0f'),
    roundedNumFormat = d3.format(',.r'),
    percentFormat = d3.format('%'),
    plusFormat = d3.format(' >+8,.0f'),
    percentPlustFormat = d3.format('+%'),
    defaults = {start: 1998, end: 2011, regionType: 'state', regionId: 51, cluster: 'traded', controls:true, benchmark: true, subcluster: true},
    options,
    container, chart, plot,
    plotData = [], totalData = {value: 0, benchmark: 0},
    yearRange, brush, gBrush,
    base = window.hbsBaseUrl || '';

  function buildChart(sel){
    var zoomed;
    var zoomFunc = function(d,i){
      zoomed = (zoomed === d ? null: d);
      plot.layer('labelLayer').config.layerElem.selectAll('.labelLayer-item').remove();
      if(zoomed){
        var xKey = plot.scale('x').key,
          yKey = plot.scale('y').key,
          rKey = plot.scale('r').key,
          xOffset = Math.abs(d[xKey]),
          yOffset = Math.abs(d[yKey]),
          xD = [d[xKey] - xOffset, d[xKey] + xOffset],
          yD = [d[yKey] - yOffset, d[yKey] + yOffset];
        plot.zoomIn(xD, yD);
        updateOverlay('clusterDetail',[zoomed]);
      }else{
        updateOverlay('clusterDetail',[]);
        plot.update();
      }
    };
    plot = d3Plot()
      .height(960)
      .duration(250)
      .margin.top(125)
      .margin.bottom(100)
      .margin.left(100)
      .margin.right(50)
      .scale('y', 'key', 'value')
      .scale("y", 'domain', function(data, key) { return d3.extent(data, function (d) { return d[key];}); })
      .scale('y', 'format', '%')
      .scale('y', 'nice', 2)
      .scale('x', 'key', 'change')
      .scale("x", 'domain', function(data, key) { return d3.extent(data, function (d) { return d[key];}); })
      .scale('x', 'format', '%')
      .scale('x', 'nice', 4)
      .scale('r', 'key', 'end')
      .scale("r", 'domain', function(data, key) { return d3.extent(data, function (d) { return d[key];}); })
      .scale('circlefill', {
        key: 'gainloss',
        scale: d3.scale.threshold(),
        attrs: {
          range: ['#c10020', '#c10020', '#7de559', '#7de559'],
          domain: function (data, key) { return [d3.min(data, function (d) { return d[key]; }), 0, d3.max(data, function (d) { return d[key]; })];}
        }
      })
      .layer('axisLayer',{
        kind: 'axis',
        name: "axes",
        enabled: true,
        selectable: false,
        elements:[
          {
            type: 'x',
            label:function(d) { return "Change in " + totalData.region + 's national employment share , ' + totalData.start + '-' + totalData.end; },
            attrs:{
              transform: function(d){return "translate(0, " + (plot.drawHeight() - plot.margin.top() - plot.margin.bottom()) + ")";}
            },
            axis:{
              fn: d3.svg.axis(),
              attrs:{orient: 'bottom' }
            }
          },
          {
            type:'y',
            label:function(d) { return totalData.region + 's national employment share , ' + totalData.end; },
            axis:{
              fn: d3.svg.axis(),
              attrs:{orient:'left'}
            }
          }]
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
            axis: 'x',
            value : function() { return 0;},
            attrs:{
              x1: 'x',
              x2: 'x',
              style: 'stroke: #333'
            }
          }]
      })
      .layer("cirLayer", {
        kind:"point",
        name: "cirLayer",
        enabled: true,
        selectable: true,
        clip: true,
        behaviors:{
          'click': zoomFunc
        },
        elements:[
          {
            type: 'circle',
            attrs:{
              fill: 'circlefill',
              stroke: '#999',
              r: 'r',
              cx: 'x',
              cy: 'y',
              opacity: 1
            }
          }
        ]
      })
      .layer("labelLayer", {
        kind:"point",
        name: "labelLayer",
        enabled: true,
        selectable: true,
        clip: true,
        behaviors:{
          'click': zoomFunc
        },
        elements:[
          {
            type: 'text',
            attrs:{
              x: 'x',
              y: 'y',
              'text-anchor': 'middle',
              'font-size': '12px'
            },
            text: function(d){
              var r = plot.scale('r'),
                size = r.scale(d[r.key]),
                label = (size - (plot.drawWidth() * 0.0075)) > 0 ? d.label : null;
              label = (zoomed ? d.label : label);
              console.log("text: ", label, zoomed);
              return label;
            }
          }
        ]
      })
      .layer('chartTitle', {
        kind: 'info',
        duration: 500,
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
                attrs: {class: 'title-text', style: 'border: 0; margin-bottom: 2px; padding-bottom: 0'},
                text: function(d) { if (d) { return d.region}}
              },
              {
                type: 'h3',
                attrs: {class: 'title-text', style: 'margin-top: 2px'},
                text: function(d){if (d) {return 'Specialization by ' + d.type + ' Cluster, ' + d.start + ' to ' + d.end;}}
              }]
          }
        ]})
      .layer('jobLegend', {
        kind: 'info',
        name: 'jobLegend',
        enabled: true,
        dataFN: function() {return [totalData];},
        layerCanvas: 'div',
        attrs: {
          style: " width: 130px; top: 10px; left: 85%; padding: 5px; text-align: center; border: 0"
        },
        elements:[
          {
            type: 'div',
            attrs: {class: 'header'},
            append: [
              {
                type: 'div',
                attrs: {style: "font-size:14px; font-weight: bold; color: #777d85"},
                text: "Employment "
              },
              {
                type: 'div',
                attrs: {style: "font-size:14px; font-weight: bold; color: #777d85; padding-bottom: 3px"},
                text: function(d) { return  d.start + "-" + d.end; }
              },
              {
                type: 'div',
                attrs: {style: "clear:both"},
                append: [
                  {type: 'div', attrs: {style: function(d) {return "height: 18px; width: 18px; margin: 0; float: left; background-color:#7de559; border: 1px solid #999;border-radius: 15px";}}},
                  {type: 'div', attrs: {style: function(d) {return "padding: 3px; float: left;font-size: 14px; color: #777d85";}}, text: "Added Jobs"}
                ]
              },
              {
                type: 'div',
                attrs: {style: "clear:both"},
                append: [
                  {type: 'div', attrs: {style: function(d) {return "height: 18px; width: 18px; margin: 0; float: left; background-color:#c10020; border: 1px solid #999; border-radius: 15px";}}},
                  {type: 'div', attrs: {style: function(d) {return "padding: 3px; float: left;font-size: 14px; color: #777d85";}}, text: "Lost Jobs"}
                ]
              }
            ]
          }
        ]})
      .layer('legend', {
        kind: 'info',
        name: 'legend',
        enabled: true,
        dataFN: function() {return [totalData];},
        layerCanvas: 'div',
        attrs: {
          style: " width: 250px; top: 130px; left: 75%; padding: 5px; text-align: right; border: 1px solid #999;"
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
                  {type: 'div', attrs: {style: function(d) {
                    var r = plot.scale('r'),
                        dom = r.scale.domain(),
                        base =  d3.round(dom[0] + ((dom[1] - dom[0])/ 3), -3),
                        radius = r.scale(base) * 2;

                    return "height:" + radius + "px; width: " + radius + 'px; margin: 0; float: left; background-color:#7de559; border: 1px solid #999; border-radius:' + radius/2 + "px";}}},
                  {type: 'div', attrs: {
                    style: function(d) {
                      var r = plot.scale('r'),
                        dom = r.scale.domain(),
                        base =  d3.round(dom[0] + ((dom[1] - dom[0])/ 3), -3),
                        radius = r.scale(base);
                      return "padding:" + (radius-7) + "px 3px; float: left;font-size: 14px; color: #777d85";
                    }},
                    text: function(d) {
                      var r = plot.scale('r'),
                        dom = r.scale.domain(),
                        base =  d3.round(dom[0] + ((dom[1] - dom[0])/ 3), -3);
                      return " = " + roundedNumFormat(base) +  " Employees";
                    }
                  }
                ]
              }
            ]
          }
        ]})
      .layer('clusterDetail', {
        duration: 500,
        kind: 'info',
        name: 'clusterDetail',
        enabled: true,
        dataFN: function(){ return (zoomed)? [zoomed]: [];},
        layerCanvas: 'div',
        attrs: {
          style: function(d) {
            var x = plot.scale('x'),
              y = plot.scale('y'),
              r = plot.scale('r'),
              cr = this.getBoundingClientRect(),
              top = y.scale(d[y.key]) - cr.height - r.scale(d[r.key]) + plot.margin.top(),
              left =(x.scale(d[x.key]) - (cr.width/2)  + plot.margin.left());
            return "top:" + top + "px; left: " + left + "px; width: 20%; display:block;";
          },
          class: 'popover top clusterDetail-item'
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
                    text: "Change in Employment Share:"
                  },
                  {
                    type: 'span',
                    attrs: {class: function (d) { return 'indicator-value ' + (d.value > 0 ? 'positive' : 'negative');}},
                    text: function(d) {if (d && d.change) {return percentPlustFormat(d.change);} }
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
                    text: "Employment Share:"
                  },
                  {
                    type: 'span',
                    attrs: {class: 'indicator-value'},
                    text: function(d) {if (d && d.value) {return percentFormat(d.value);} }
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
                      href: function(d) { return (options.subcluster ? location(d.id) : '/cluster/' + d.id); },
                      target: function () { return (!options.subcluster ? '_parent' : '');}
                    },
                    text:  function() { return (!options.subcluster ? "Goto Cluster Dashboard" : (isNaN(+options.cluster) ? "Explore Subclusters" : "Explore Industries")); },
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
        behaviors:{
          'click': zoomFunc
        }});

    if(options.benchmark) {
//      plot.layer('benchmarkLines', {
//        kind:"bar",
//        name: "benchmarkLines",
//        enabled: true,
//        selectable: true,
//        clip: true,
//        elements:[
//          {
//            type: 'line',
//            attrs:{
//              stroke: '#fc5920',
//              'stroke-width': 2,
//              x1: 'xOrdinal',
//              x2: function(d){
//                var sX = plot.scale('xOrdinal');
//                return  sX.scale(d[sX.key]) +  sX.scale.rangeBand();
//              },
//              y1: function(d,i){return plot.scale('y').scale(d.benchmark);},
//              y2: function(d,i){return plot.scale('y').scale(d.benchmark);}
//            }
//          }
//        ]
//      });
//      plot.layer('legend', {
//        kind: 'info',
//        name: 'legend',
//        enabled: true,
//        dataFN: function() {return [totalData];},
//        layerCanvas: 'div',
//        attrs: {
//          style: " width: 40%; top: 200px; left: 55%; padding: 5px; border: 1px solid #777d85; "
//        },
//        elements:[
//          {
//            type: 'div',
//            attrs: {class: 'header'},
//            append: [
//              {
//                type: 'div',
//                attrs: {style: "clear:both"},
//                append: [
//                  {type: 'div', attrs: {style: function(d) {return "height: 3px; width: 15px; margin: 10px 3px; float: left; background-color:#fc5920";}}},
//                  {type: 'div', attrs: {style: function(d) {return "padding: 3px; float: left;font-size: 14px; color: #777d85";}}, text: "indicates expected job creation given national growth"}
//                ]
//              }
//            ]
//          }
//        ]});
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
    return base + '/report/region/specialization' + window.location.hash.substring(1).split('?')[0];
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
      plot.update();
      ['chartTitle','legend'].forEach(function (name) {
        updateOverlay(name, [totalData]);
      });
      updateOverlay('clusterDetail',[]);
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

    if (!isNaN(+options.cluster)) { return; }
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


  resetOptions(defaults);
  updateOptionsFromHash(false);
  buildChart('#chart');
  update();

})();
