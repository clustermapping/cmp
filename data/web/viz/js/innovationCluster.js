/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
    loader = new MythosVis.DataLoader(),
    numFormat = d3.format(' >8,.0f'),
    roundedNumFormat = d3.format(',.r'),
    percentFormat = d3.format('.3p'),
    plusFormat = d3.format(' >+8,.0f'),
    percentPlustFormat = d3.format('+.3p'),
    defaults = {start: 1998, end: 2011, regionType: 'state', regionId: 51, cluster: 'traded', controls:true, benchmark: true, subcluster: true},
    options,
    container, chart, plot,
    plotData = [], totalData = {value: 0, benchmark: 0},
    yearRange, brush, gBrush,
    base = window.hbsBaseUrl || '',
    zoomed;

  function buildChart(sel){
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
          xD = [d[xKey] - xOffset/5, d[xKey] + xOffset/5],
          yD = [d[yKey] - yOffset/1.5, d[yKey] + yOffset/1.5];
        if (yD[0] < yS.domain()[0]) yD[0] = yS.domain()[0];
        if (yD[1] > yS.domain()[1]) yD[1] = yS.domain()[1];
        if (xD[0] < xS.domain()[0]) xD[0] = xS.domain()[0];
        if (xD[1] > xS.domain()[1]) xD[1] = xS.domain()[1];
        updateZoom(xD[0], xD[1], yD[0], yD[1]);
        updateOverlay('clusterDetail',[zoomed]);
        updateOverlay('zoomOut', [totalData]);
        updateOverlay('clusterPopup', []);
      }else{
        updateZoom();
        updateOverlay('clusterDetail',[]);
        updateOverlay('clusterPopup', []);
        updateOverlay('zoomOut', []);
        plot.update();
      }
    };
    plot = d3Plot()
      .height(800)
      .duration(250)
      .margin.top(150)
      .margin.bottom(125)
      .margin.left(100)
      .margin.right(50)
      .scale('y', 'key', 'value')
      .scale("y", 'domain', function(data, key) { return d3.extent(data, function (d) { return d[key];}); })
      .scale('y', 'format', '.2p')
      .scale('y', 'nice', 2)
      .scale('x', 'key', 'change')
      .scale("x", 'domain', function(data, key) { return d3.extent(data, function (d) { return d[key];}); })
      .scale('x', 'format', '.2p')
      .scale('x', 'nice', 4)
      .scale('r', {
        key: 'end',
        scale: d3.scale.sqrt(),
        attrs: {
          domain: function(data, key) { return d3.extent(data, function (d) { return d[key];}); },
          range: [10, 100]
        }
      });

    if(options.benchmark) {
      plot.layer('benchMarkGuideLayer',{
        kind: 'guide',
        name: "benchmark",
        enabled: true,
        selectable: false,
        clip: true,
        elements:[
          {
            type: 'line',
            axis: 'y',
            dataSource : function() { return totalData.value; },
            label: function() { return totalData.clusterName + " Overall Share of US " + totalData.type + " Innovation: " + percentFormat(totalData.value) },
            attrs:{
              y1: 'y',
              y2: 'y',
              style: 'stroke: #333; stroke-width: 2px',
              'stroke-dasharray':"5,5",
              textstyle: 'font-size:12px;font-style:italic'
            }
          },
          {
            type: 'line',
            axis: 'x',
            dataSource : function() {
              return totalData.change;
            },
            label: function() { return "Overall Change in the " + totalData.region + " Share of US " + totalData.type + " Innovation: " + percentPlustFormat(totalData.change) },
            attrs:{
              x1: 'x',
              x2: 'x',
              style: 'stroke: #333; stroke-width: 2px',
              'stroke-dasharray':"5,5",
              textstyle: 'text-anchor:middle;font-size:12px;font-style:italic;',
              texttrans: 'translate(-10, 5)'
            }
          },
          {
            type: 'rect',
            attrs : {
              x: function() { return plot.scale('x').scale(totalData.change); },
              y: 0,
              width: function() {return plot.drawWidth() - plot.margin.right() - plot.margin.left() - plot.scale('x').scale(totalData.change);},
              height: function() {
                var height = plot.scale('y').scale(totalData.value);
                if (height < 0) height = '100%';
                return height;
              },
              style: 'stroke: #00f; fill: #99f; opacity: 0.25;z-index: -999;'
            }
          }
        ]
      });
    }

    plot.scale('circlefill', {
        key: 'change',
        scale: d3.scale.threshold(),
        attrs: {
          range: ['#c10020', '#c10020', '#7de559', '#7de559'],
          domain: function (data, key) {return [d3.min(data, function (d) { return d[key]; }), 0, d3.max(data, function (d) { return d[key]; })];}
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
            label:function(d) { return 'Change in Share of U.S. Utility Patents Awarded, ' + totalData.start + '-' + totalData.end; },
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
            label:function(d) { return 'Share of U.S. Utility Patents Awarded, ' + totalData.end; },
            axis:{
              fn: d3.svg.axis(),
              attrs:{orient:'left'}
            }
          }]
      })
      .layer('legend', {
        kind: 'info',
        name: 'legend',
        enabled: true,
        dataFN: function() {return [totalData];},
        layerCanvas: 'div',
        attrs: {
          style: function(d) {
            if (plotData.length <= 1) {
              return 'width: 300px; top: 200px; right: '+ ((plot.drawWidth() - plot.margin.right() - plot.margin.left() - 230)/2 ) +'px; padding: 5px; text-align: center; border: 1px solid #999;border-radius:5px;background:#fafafa;'
            }
            return 'display: none;';
          },
        },
        elements:[{type: 'div', text: function(d) {return "There is no data available for the specified parameters."; } } ]
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
              style: 'stroke: #333'
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
              fill: 'circlefill',
              stroke: '#333',
              r: function(d) { return plot.scale('r').scale(d.end)/Math.PI; },
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
              dx: function(d) {  return plot.scale('r').scale(d.end)/Math.PI + 2;},
              'text-anchor': 'start',
              'font-size': '12px'
            },
            text: function(d){
              var r = plot.scale('r'),
                size = r.scale(d[r.key])/Math.PI,
                label = (size - (plot.drawWidth() * 0.0075)) > 0 ? d.label : null;
              label = (zoomed ? d.label : label);
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
                text: function(d) {if (totalData.clusterName) { return totalData.clusterName + ' Cluster'; } }
              },
              {
                type: 'h3',
                attrs: {
                  class: 'title-text',
                  style: function (d) { return 'border: 0; margin: 0; padding: 0; color: #334f9f; display:' +  (totalData.subClusterName ? 'block' : 'none');}
                },
                text: function(d) {if (totalData.subClusterName) { return totalData.subClusterName + ' Subcluster'; } }
              },
              {
                type: 'h3',
                attrs: {class: 'title-text', style: 'margin-top: 2px'},
                text: function(d){if (d) {return 'Innovation by ' + d.type + ', ' + d.start + ' to ' + d.end;}}
              },
              {
                type: 'p',
                attrs: {class: 'title-text', style: 'margin-top: 7px; font-size: 13px;'},
                text: 'Click on a bubble or click and drag a box around an area to zoom.'
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
          style: " width: 180px; top: 10px; left: 85%; padding: 5px; text-align: center; border: 0"
        },
        elements:[
          {
            type: 'div',
            attrs: {class: 'header'},
            append: [
              {
                type: 'div',
                attrs: {style: "font-size:14px; font-weight: bold; color: #777d85"},
                text: "Innovation "
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
                  {type: 'div', attrs: {style: function(d) {return "padding: 3px; float: left;font-size: 14px; color: #777d85";}}, text: "Share increased"}
                ]
              },
              {
                type: 'div',
                attrs: {style: "clear:both"},
                append: [
                  {type: 'div', attrs: {style: function(d) {return "height: 18px; width: 18px; margin: 0; float: left; background-color:#c10020; border: 1px solid #999; border-radius: 15px";}}},
                  {type: 'div', attrs: {style: function(d) {return "padding: 3px; float: left;font-size: 14px; color: #777d85";}}, text: "Share decreased"}
                ]
              }
            ]
          }
        ]})
      .layer('clusterPopup', {
        duration: 100,
        kind: 'info',
        name: 'clusterPopup',
        enabled: true,
        dataFN: function() { return []},
        layerCanvas: 'div',
        attrs: {
          style: function(d) {
            var x = plot.scale('x'),
              y = plot.scale('y'),
              r = plot.scale('r'),
              cr = this.getBoundingClientRect(),
              top = y.scale(d[y.key]) - cr.height - r.scale(d[r.key])/Math.PI + plot.margin.top(),
              left =(x.scale(d[x.key]) - (cr.width/2)  + plot.margin.left());
            return "top:" + top + "px; left: " + left + "px; width: 20%; display:block;";
          },
          class: 'popover top clusterPopup-item'
        },
        elements:[
          {
            type: 'div',
            attrs: {class: 'arrow'}
          },
          {
            type: 'div',
            attrs: {class: 'popover-content'},
            text: function(d){if (d) {return d.label;}}
          }
        ]
      })
      .layer('clusterDetail', {
        duration: 300,
        kind: 'info',
        name: 'clusterDetail',
        enabled: true,
        dataFN: function(){ return (zoomed && zoomed.id)? [zoomed]: [];},
        layerCanvas: 'div',
        attrs: {
          style: function(d) {
            var x = plot.scale('x'),
              y = plot.scale('y'),
              r = plot.scale('r'),
              cr = this.getBoundingClientRect(),
              top = y.scale(d[y.key]) - cr.height - r.scale(d[r.key])/Math.PI + plot.margin.top(),
              left =(x.scale(d[x.key]) - (cr.width/2)  + plot.margin.left());
            return "top:" + top + "px; left: " + left + "px; width: 35%; display:block;";
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
                    text: function(d) {return "Patents, " + options.end + ":";}
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
                    text: function(d) { return "Patents, " +  options.start + ":";}
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
                    text: "Innovation Share:"
                  },
                  {
                    type: 'span',
                    attrs: {class: 'indicator-value'},
                    text: function(d) {if (d && d.value) {return percentPlustFormat(d.value);} }
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
                    text: "Change in Innovation Share:"
                  },
                  {
                    type: 'span',
                    attrs: {class: function (d) { return 'indicator-value ' + (d.change > 0 ? 'positive' : 'negative');}},
                    text: function(d) {if (d && d.change) {return percentPlustFormat(d.change);} }
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
                        return '/data/report/region/innovationtable#/' + totalData.regionTypeKey + '/' + d.key + '/100';
                      },
                      target: '_blank'
                    },
                    text:  "Go to Patents by Organization Table",
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
                attrs: {class: 'action'},
                append: [
                  {
                    type: 'a',
                    attrs: {
                      href: function(d) {
                        return '/region-cluster/' + ( totalData.clusterParentKey || totalData.clusterKey ) + '/' + totalData.regionTypeKey + '/' + d.key;
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
      if (y0 <= 0) y0 = 0.0001;
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

  function location(regionType){
    var region = '/' + (regionType || options.regionType),
        start = '/' + options.start,
        end = '/' + options.end,
        cluster =  '/' + options.cluster,
        oldHash = window.location.hash,
        queryIndex = oldHash.indexOf('?'),
        qops = (queryIndex == -1 ? '' : oldHash.substring(queryIndex)),
        hash = '#' + cluster + start + end + region + qops;
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
    if (parts.length < 4) {
      console.error("Please specify a hash in the form: /:cluster/:start/:end/:type");
    }
    resetOptions(defaults);
    
    options.cluster = parts[0];
    options.start = parts[1];
    options.end = parts[2];
    options.regionType = parts[3];
    options.zoom = parts[4] || '';

    Object.keys(q).forEach(function(qk) {
      options[qk] = q[qk];
    });

    if (!render) { return; }
  }

  function getDatasources() {
    return base + '/report/cluster/innovation'
      + '/' + options.cluster
      + '/' + options.start
      + '/' + options.end
      + '/' + options.regionType;
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
      if (plot) {
        plot.update();
      } else {
        buildChart('#chart');
        if (options.controls) {
          d3.selectAll('#controls').style('display', null);
          downloadControls();
          yearControls();
          regionTypeControls();
        } else {
          d3.selectAll('#controls').style('display', 'none');
        }
      }
      updateZoom.apply(this, options.zoom.split('_'));
      ['chartTitle'].forEach(function (name) {
        updateOverlay(name, [totalData]);
      });
      updateOverlay('clusterDetail',[]);
      plot.layer("cirLayer").config.group.select('circle').on('mouseover', function(d) { updateOverlay('clusterPopup', [d]); });
      plot.layer("cirLayer").config.group.select('circle').on('mouseout', function(d) { updateOverlay('clusterPopup', []); });
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
    if (suffix == 'png' && options.zoom) {
      suffix += '/' + options.zoom;
    }
    return window.location.pathname.replace(/viz\/.*/, 'report/region/innovation') + hash + '/' + suffix;
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

  function regionTypeControls() {
    d3.selectAll(".cluster-controls").remove();
    var container = d3.select("#controls").append('div').attr('class', 'cluster-controls'),
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

    var active = regionType.select('input[value=' + options.regionType + ']');

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
