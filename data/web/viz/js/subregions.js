/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
    loader = new MythosVis.DataLoader(),
    numFormat = d3.format(' >8,.0f'),
    moneyFormat = d3.format('$,.0f'),
    roundedNumFormat = d3.format(',.r'),
    percentFormat = d3.format('.2%'),
    plusFormat = d3.format(' >+8,.0f'),
    percentPlustFormat = d3.format('+.2%'),
    defaults = {start: 1998, end: 2011, regionType: 'state', regionId: 51, controls:true, benchmark: true, subcluster: true},
    options,
    container, chart, plot,
    plotData = [], totalData = {value: 0, benchmark: 0},
    yearRange, brush, gBrush,
    base = window.hbsBaseUrl || '',
    zoomed;

  function buildChart(sel){
    numFormat = d3.format(totalData.type.format);
    var zoomed, type = totalData.type.plot_type || totalData.type.type;
    var zoomFunc = function(d,i){
      zoomed = (zoomed === d ? null: d);
      plot.layer('labelLayer').config.layerElem.selectAll('.labelLayer-item').remove();
      if(zoomed && zoomed.id){
        var xKey = plot.scale('x').key,
          xS = plot.scale('x').scale,
          yKey = plot.scale('y').key,
          yS = plot.scale('y').scale,
          xOffset = Math.abs(d[xKey]),
          yOffset = Math.abs(d[yKey]),
          xD = [d[xKey] - xOffset/1.5, d[xKey] + xOffset/1.5],
          yD = [d[yKey] - yOffset/1.5, d[yKey] + yOffset/1.5];
        if (yD[0] < yS.domain()[0]) yD[0] = yS.domain()[0];
        if (yD[1] > yS.domain()[1]) yD[1] = yS.domain()[1];
        if (xD[0] < xS.domain()[0]) xD[0] = xS.domain()[0];
        if (xD[1] > xS.domain()[1]) xD[1] = xS.domain()[1];
        updateZoom(xD[0], xD[1], yD[0], yD[1]);
        updateOverlay('clusterDetail',[zoomed]);
        updateOverlay('zoomOut', [totalData]);
//        updateOverlay('clusterPopup', []);
      }else{
        updateZoom();
        updateOverlay('clusterDetail',[]);
        updateOverlay('zoomOut', []);
        plot.update();
      }
    };
    plot = d3Plot()
      .height(700)
      .duration(250)
      .margin.top(125)
      .margin.bottom(125)
      .margin.left(100)
      .margin.right(50)
      .scale('y', 'key', 'wage')
      .scale('y', 'scale', d3.scale.linear() )
      .scale("y", 'domain', function(data, key) { return d3.extent(data, function (d) { return d[key];}); })
      .scale('y', 'format', '$,.0f')
      .scale('y', 'nice', 2)
      .scale('x', 'key', (type == 'cagr'? 'cagr' : 'change'))
      .scale("x", 'domain', function(data, key) { return d3.extent(data, function (d) { return d[key];}); })
      .scale('x', 'format', (type == 'cagr'? '+.2%' : totalData.type.format))
      .scale('x', 'nice', 4)
      .layer('axisLayer',{
        kind: 'axis',
        name: "axes",
        enabled: true,
        selectable: false,
        elements:[
          {
            type: 'x',
            label:function(d) { return "Real Growth in " + (totalData.type ? totalData.type.label : '') + ', ' + totalData.start + ' to ' + totalData.end; },
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
            label:function(d) { return 'Annual Wage' + ' , ' + totalData.end; },
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
            dataSource : function() { return 0;},
            attrs:{
              x1: 'x',
              x2: 'x',
              style: 'stroke: #333;'
            }
          },
          {
            type: 'rect',
            attrs: {
              x: 0,
              y: 0,
              width: function() { return plot.drawWidth() - plot.margin.right() - plot.margin.left() - 1 },
              height: function() { return plot.drawHeight() - plot.margin.top() - plot.margin.bottom() - 1 },
              style: 'stroke: #333;'
            }
          }
        ]
      })
     .layer('benchMarkGuideLayer',{
       kind: 'guide',
       name: "benchMark",
       enabled: true,
       selectable: false,
       clip: true,
       elements:[
         {
           type: 'line',
           axis: 'x',
           dataSource : function() { return totalData.cagr;},
           label: function() { return totalData.benchmark + " " + totalData.type.label + " Growth Rate: " + percentFormat(totalData.cagr) },
           attrs:{
             x1: 'x',
             x2: 'x',
             style: 'stroke: #00f; stroke-width: 2px',
             'stroke-dasharray':"5,5",
             textstyle: 'text-anchor:end;fill:#00f;'
           }
         },
         {
           type: 'line',
           axis: 'y',
           dataSource : function() {
             return totalData.wage;
           },
           label: function() { return totalData.benchmark + " Annual Wage: " + moneyFormat(totalData.wage) },
           attrs:{
             y1: 'y',
             y2: 'y',
             style: 'stroke: #00f; stroke-width: 2px',
             'stroke-dasharray':"5,5",
             textstyle: 'fill: #00f;'
           }
         },
         {
           type: 'rect',
           attrs : {
             x: function() { 
              return plot.scale('x').scale(totalData.cagr); },
             y: 0,
             width: function() { return plot.drawWidth() - plot.margin.right() - plot.margin.left() - plot.scale('x').scale(totalData.cagr);},
             height: function() { return plot.scale('y').scale(totalData.value); },
             style: 'stroke: #00f; fill: #99f; opacity: 0.25'
           }
         },
         {
           type: 'line',
           axis: 'x',
           style: 'position:relative;',
           dataSource : function() { 
            let startValue = plotData.reduce(function(x,d,i){ return x+d.start; }, 0);
            let endValue = plotData.reduce(function(x,d,i){ return x+d.value; }, 0);
            let years = +totalData.end - +totalData.start;
            totalData.cagrRegion = Math.pow(endValue/startValue, 1/years) - 1;
            return totalData.cagrRegion;
          },
           label: function() { 
            return totalData.benchmarkRegion + " " + totalData.type.label + " Growth Rate: " + percentFormat(totalData.cagrRegion) },
           attrs:{
             x1: 'x',
             x2: 'x',
             style: 'stroke:green;stroke-width:2px;',
             'stroke-dasharray':"5,5",
             textstyle: 'fill:green;color:green;position:absolute;top:50px;text-anchor:start'
           }
         },
         {
           type: 'line',
           axis: 'y',
           dataSource : function() {
             return totalData.wageRegion;
           },
           label: function() { return totalData.benchmarkRegion + " Annual Wage: " + moneyFormat(totalData.wageRegion) },
           attrs:{
             y1: 'y',
             y2: 'y',
             style: 'stroke: green; stroke-width: 2px',
             'stroke-dasharray':"5,5",
             textstyle: 'fill:green;'
           }
         }
       ]
     })
      .layer('zoomBrush', brushToZoom())
      .layer('zoomOut', zoomOut())
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
              fill: function (d) { return (d.id == totalData.focus ? '#f22': '#99f')},
              stroke: function (d) { return (d.id == totalData.focus ? '#900': '#009')},
              r: function(d) {
                return (d.wage * 20 ) / totalData.wage;
              },
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
              dy: '4',
              dx: '12',
              'text-anchor': 'start',
              'font-size': '12px'
            },
            text: function(d){
              return d.label;
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
                attrs: {class: 'title-text', style: 'border: 0; margin-bottom: 2px; font-size: 20px; margin-top: 0; padding-bottom: 0'},
                text: function(d) { if (d) { return d.title;}}
              },
              {
                type: 'h2',
                attrs: {class: 'title-text', style: 'border: 0; margin-bottom: 2px; margin-top: 0; padding-bottom: 0'},
                text: function(d) { if (d) { return (d.type? d.type.label : '') + " Performance"}}
              },
              {
                type: 'h4',
                attrs: {class: 'title-text', style: 'margin-top: 2px'},
                text: function(d){if (d) {return  (d.type.subtitle ? d.type.subtitle + ', ' : '' ) + d.start + ' - ' + d.end;}}
              }]
          }
        ]})
      .layer('clusterDetail', {
        duration: 500,
        kind: 'info',
        name: 'clusterDetail',
        enabled: true,
        dataFN: function(){ return (zoomed && zoomed.id)? [zoomed]: [];},
        layerCanvas: 'div',
        attrs: {
          style: function(d) {
            var x = plot.scale('x'),
              y = plot.scale('y'),
              r = 10,
              cr = this.getBoundingClientRect(),
              top = y.scale(d[y.key]) - cr.height - r + plot.margin.top(),
              left =(x.scale(d[x.key]) - (cr.width/2)  + plot.margin.left());
            return "top:" + top + "px; left: " + left + "px; width: 24%; display:block;";
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
                    text: function(d) {return totalData.type.label + ", " + options.end + ":";}
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
                    text: function(d) { return totalData.type.label + ", " +  options.start + ":";}
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
                    text: "Growth Rate in " + totalData.type.label + ":"
                  },
                  {
                    type: 'span',
                    attrs: {class: function (d) { return 'indicator-value ' + (d.cagr > 0 ? 'positive' : 'negative');}},
                    text: function(d) {if (d && d.change) {return percentPlustFormat(d.cagr);} }
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
                    text: "Change in " + totalData.type.label + ":"
                  },
                  {
                    type: 'span',
                    attrs: {class: 'indicator-value'},
                    text: function(d) {if (d && d.value) {return numFormat(d.change);} }
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
                        return (options.subcluster ? location(d.key, d.type) : '/cluster/' + d.id); },
                      target: function () { return (isNaN(+options.cluster) ? '_parent' : '');}
                    },
                    text:  function() { return (!options.subcluster ? "Goto Cluster Dashboard" : (isNaN(+options.cluster) ? "Go to Region Dashboard" : "Explore Industries")); },
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

    container = d3.select(sel);
    chart = container.append('div').datum(plotData).call(plot);
    d3.select(window).on("resize", plot.update).on("hashchange", update);
    return container;
  }

  function updateZoom(x0, x1, y0, y1) {
    if (x0 && x1 && y0 && y1) {
      options.zoom = [x0, x1, y0, y1].join('_');
      plot && plot.zoomIn([x0, x1], [y0, y1]);
      plot.zoomIn([x0, x1], [y0, y1]);
    } else {
      options.zoom = '';
    }
    downloadControls();
  }

  function brushToZoom() {
    function zBrushed() {

    }

    function zBrushEnded() {
      if (!d3.event.sourceEvent) return; // only transition after input
      var extent = zoomBrush.extent(),
        x0 = extent[0][0], y0 = extent[0][1],
        x1 = extent[1][0], y1 = extent[1][1],
        exWidth = x1 - x0,
        exHeight = y1 - y0,
        height = plot.drawHeight() - plot.margin.top() - plot.margin.bottom(),
        width = plot.drawWidth() - plot.margin.left() - plot.margin.right(),
        wRatio = height/width, hRatio = width/height,
        zDiff;
      if (exWidth < 0.0001) return;

      zoomed = true;
      plot.layer('labelLayer').draw();
      if (exWidth > exHeight) {
        zDiff = (exHeight * hRatio) - exHeight;
        y0 = y0 - zDiff/2;
        y1 = y1 + zDiff/2;
      } else {
        zDiff = (exWidth * wRatio) - exWidth;
        x0 = x0 - zDiff/2;
        x1 = x1 - zDiff/2;
      }
      zoomBrush.clear();
      updateZoom(x0, x1, y0, y1);
      plot.layer('axisLayer').draw();
      updateOverlay('zoomOut', [totalData]);
    }

    var zoomBrush = d3.svg.brush()
      .on("brush", zBrushed)
      .on("brushend", zBrushEnded);

    return {
      kind: 'simple',
      name: 'zoomBrush',
      clip: true,
      elements: [],
      append: function(g) {
        g.classed('brush', true).call(zoomBrush.event);
      },
      draw: function(g) {
        if (plot && plot.scale('x')) {
          zoomBrush
            .x(plot.scale('x').scale)
            .y(plot.scale('y').scale);
          g.call(zoomBrush);
        }
      }
    };
  }

  function zoomOut() {
    return {
      kind: 'info',
      name: 'zoomOut',
      enabled: true,
      dataFN: function() {return [];},
      layerCanvas: 'div',
      attrs: {
        style: function() { return "width: 90px; top: " + plot.margin().top + "px; left: "+ plot.margin().left + "px; padding: 5px; border: 1px solid black; cursor: pointer; text-align:center; color: white; background-color: #444"}
      },
      elements:[
        {
          type: 'div',
          html: '<span class="glyphicon glyphicon-zoom-out"></span> Zoom Out'
        }
      ],
      behaviors: {
        click: function() {
          plot.update();
          updateOverlay('zoomOut', []);
          updateZoom();
        }
      }
    };
  }

  function location(regionKey, regionType){
    if (regionKey && regionType) {
      return '/region/' + regionType + '/' + regionKey;
    }
    var region = '/' + options.regionType + '/' + options.regionId,
      years= '/' + options.start + '/' + options.end,
      subtype = '/' + options.subtype,
      indicator =  '/' + options.indicator,
      oldHash = window.location.hash,
      queryIndex = oldHash.indexOf('?'),
      qops = (queryIndex == -1 ? '' : oldHash.substring(queryIndex)),
      hash = '#' + region +  years + subtype + indicator + qops;
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
    if (parts.length < 6) {
      console.error("Please specify a hash in the form: /:type/:code/:start/:end/:subtype/:indicator");
    }
    resetOptions(defaults);
    options.regionType = parts[0];
    options.regionId = parts[1];
    options.start = parts[2];
    options.end = parts[3];
    options.subtype = parts[4];
    options.indicator = parts[5];
    options.zoom = parts[6] || '';
    Object.keys(q).forEach(function(qk) {
      options[qk] = q[qk];
    });

    if (!render) { return; }

    if (options.controls) {
      d3.selectAll('#controls').style('display', null);
      downloadControls();
      yearControls();
    } else {
      d3.selectAll('#controls').style('display', 'none');
    }
  }

  function getDatasources() {
    return base + '/report/region/subregions' 
      + '/' + options.regionType
      + '/' + options.regionId
      + '/' + options.start
      + '/' + options.end
      + '/' + options.subtype
      + '/' + options.indicator;
  }

  function processData(data) {
    totalData = data.totals;
    data.results.forEach(function (d) { 
        if (d.type !== 'county') {
           d.wage = 1;
        }
        plotData.push(d); 
    });
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
        yearControls();
      }
      updateZoom.apply(this, options.zoom.split('_'));
      ['chartTitle'].forEach(function (name) {
        updateOverlay(name, [totalData]);
      });
      updateOverlay('clusterDetail',[]);
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
    if (!plot) return;
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
    if (suffix == 'png' && options.zoom) {
      suffix += '/' + options.zoom;
    }
    return window.location.pathname.replace(/viz\/.*/, 'report/region/specialization') + hash + '/' + suffix;
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
//  buildChart('#chart');
  update();

})();
