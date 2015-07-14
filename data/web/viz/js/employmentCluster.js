/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
    loader = new MythosVis.DataLoader(),
    numFormat = d3.format(' >8,.0f'),
    plusFormat = d3.format(' >+8,.0f'),
    defaults = {year: 2011, regionType: 'state', regionId: 51, cluster: 'traded', controls:true, subcluster: true, benchmark: true},
    options,
    container, chart, plot,
    plotData = [], totalData = {value: 0, benchmark: 0},
    yearRange, brush, gBrush,
    base = window.hbsBaseUrl || '';

  function buildChart(sel){
    plot = d3Plot()
      .height(options.height || 960)
      .scale('x', 'key', 'value')
      .scale('x', 'domain', function(data, key) {
        var xdomain = d3.extent(data, function (d) { return d[key]; });
        return xdomain; })
      .scale('x', 'nice', 5)
      .scale("y",{
        key:'label',
        scale: d3.scale.ordinal(),
        attrs: {
//          rangeRoundBands: function(data, key, drawWidth, drawHeight, margin){return ({ args: [ [0, (plotData.length > 15 ? drawHeight - margin.top - margin.bottom : plotData.length * 70)], 0.15 ]});},
          rangeRoundBands: function(data, key, drawWidth, drawHeight, margin){return ({ args: [ [0, drawHeight - margin.top - margin.bottom], 0.15 ]});},
          domain: function(data, key){ return data.map( function(d) { return d[key];} );}
        }
      })
      .scale('barfill', {
        key: 'value',
        scale: d3.scale.threshold(),
        attrs: {
          range: ['#fee66b', '#fee66b', '#407ad5', '#407ad5'],
          domain: function (data, key) { return [d3.min(data, function (d) { return d[key]; }), 0, d3.max(data, function (d) { return d[key]; })];}
        }
      })
      .margin.top(125)
      .margin.bottom(120)
      .margin.left(300)
      .margin.right(125)
      .def('barGradient', {
        type: 'linearGradient',
        name: 'barGradient',
        attrs: {x1: '100%', y1:0, x2:0, y2:0},
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
            axis: 'x',
            dataSource : function() { return 0;},
            attrs:{
              x1: 'x',
              x2: 'x',
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
            type: 'y',
            attrs:{
              class: 'y-axis-names axes-item',
            },
            axis:{
              fn: d3.svg.axis(),
              attrs:{orient: 'left'}
            }
          },
          {
            type:'x',
            label:function(d) { return 'Employment, ' + options.year; },
            attrs:{
              transform: function(d){return "translate(0, " + (plot.drawHeight() - plot.margin.top() - plot.margin.bottom()) + ")";}
            },
            axis:{
              fn: d3.svg.axis(),
              attrs:{orient: 'bottom'}
            }
          }]
      })
      .layer("barLayer", {
        kind:"bar",
        name: "bar",
        enabled: true,
        selectable: true,
        clip: true,
        elements:[
          {
            type: 'rect',
            attrs:{
              fill: 'barfill',
              y: 'y',
              x: function(d) {
                var sX = plot.scale('x');
                return sX.scale( Math.min( (d[sX.key]), 0) );
              },
              height: function(){return plot.scale('y').scale.rangeBand();},
              width: function(d) {
                var sX = plot.scale('x');
                return Math.abs(sX.scale(0)-sX.scale(d[sX.key]));
              }
            }
          },
          /*{
            type: 'text',
            text: function(d) { return numFormat(d.value);},
            attrs: {
              y: 'y',
              x: function(d) {
                var sX = plot.scale('x');
                return sX.scale(d[sX.key]) + 5;
              },
              dy: '.9em'
            }
          }*/
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
              y: 'y',
              x: function(d) {
                var sX = plot.scale('x');
                return sX.scale( Math.min( (d[sX.key]), 0) );
              },
              height: function(){return plot.scale('y').scale.rangeBand();},
              width: function(d) {
                var sX = plot.scale('x');
                return Math.abs(sX.scale(0)-sX.scale(d[sX.key]));
              },
              style: 'fill:url(#barGradient);'
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
              class: 'highlight-bar',
              y: 'y',
              x: 0,
              height: function(){return plot.scale('y').scale.rangeBand(); },
              width: function() {return plot.drawWidth(); }
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
                text: function(d){if (d) {return 'Employment by ' + d.type + ', ' + d.year;}}
              }]
          }
        ]})
      .layer('clusterDetail', {
        kind: 'info',
        name: 'clusterDetail',
        duration: 150,
        enabled: true,
        dataFN: function() {return [];},
        layerCanvas: 'div',
        attrs: {
          style: function(d) {
            var yo = plot.scale('y'),
              x = plot.scale('x'),
              cr = this.getBoundingClientRect(),
              left = x.scale(d.value) + plot.margin.left(),
              top = (yo.scale(d.label) - (cr.height/2)) + plot.margin.top() + yo.scale.rangeBand()/2;
            if ((left + cr.width)  > window.innerWidth) {
              left = plot.drawWidth() - plot.margin.right() - cr.width;
              if (left > x.scale(d.value)) {
                left = x.scale(d.value) - cr.width/2 - 10 + plot.margin.left();
              }
              top = yo.scale(d.label) + yo.scale.rangeBand() + plot.margin.top();
            }
            return "top:" + top + "px; left: " + left + "px; width: 25%; display:block;";
          },
          class: function (d) {
            var position = 'right',
              x = plot.scale('x'),
              cr = this.getBoundingClientRect(),
              left = x.scale(d.value) + plot.margin.left();
            if ((left + cr.width)  > window.innerWidth) { position = 'bottom'; }
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
                    text: function(d) {return "Employment, " + options.year + ":";}
                  },
                  {
                    type: 'span',
                    attrs: {class: 'indicator-value'},
                    text: function(d) {if (d && d.value) {return numFormat(d.value);} }
                  }
                ]
              },
             /* {
                type: 'div',
                attrs: {class: 'action',
                  style: function() {
                    return "display:" + (!options.subcluster? 'none':'')
                  }
                },
                append: [
                  {
                    type: 'a',
                    attrs: {
                      href: function(d) { return (isNaN(+options.cluster) ? location(d.id) : '/data/report/region/industry#/'  + options.regionType + '/' + options.regionId + '/' + options.cluster+ '/' + d.id.split('-')[1]); },
                      target: function () { return (isNaN(+options.cluster) ? '' : '_blank')}
                    },
                    text:  function() { return (!options.subcluster ? "" : (isNaN(+options.cluster) ? "Explore Subclusters" : "Explore Industries")); },
                    append: [
                      {
                        type: 'span',
                        attrs: {class: 'glyphicon glyphicon-zoom-in'}
                      }
                    ]
                  }
                ]
              },*/
              {
                type: 'div',
                attrs: {class: 'action'},
                append: [
                  {
                    type: 'a',
                    attrs: {
                      href: function(d) {
                        return '/region-cluster/' + ( d.parent_key|| d.key ) + '/' + d.id;
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
    d3.select(window).on("resize", plot.update).on("hashchange", update);
    return container;
  }

  function location(regionType){
    var region = '/' + (regionType || options.regionType),
        years= '/' + options.year,
        cluster =  '/' + options.cluster,
        subcluster =  '/' + options.subCluster,
        oldHash = window.location.hash,
        queryIndex = oldHash.indexOf('?'),
        qops = (queryIndex == -1 ? '' : oldHash.substring(queryIndex)),
        hash = '#' + cluster + subcluster + years + region + qops;
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
      console.error("Please specify a hash in the form: /:type/:code/:year/:cluster");
    }
    resetOptions(defaults);
    options.cluster = parts[0];
    options.subCluster = parts[1];
    options.year = parts[2];
    options.regionType = parts[3];
    Object.keys(q).forEach(function(qk) {
      options[qk] = q[qk];
    });

    if (!render) { return; }

    if (options.controls) {
      d3.selectAll('#controls').style('display', null);
      downloadControls();
      yearControls();
      regionTypeControls();
    } else {
      d3.selectAll('#controls').style('display', 'none');
    }
  }

  function getDatasources() {
    return base + '/report/cluster/employment' + window.location.hash.substring(1);
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
      if (options.height) {
        plot.height(options.height);
      } else if (plotData.length < 15 ) {
        plot.height(90 * plotData.length + plot.margin().top + plot.margin().bottom);
      } else if (options.limit) {
        plot.height(81 * options.limit + plot.margin().top + plot.margin().bottom);
      } else {
        plot.height(1280);
      }
      plot.update();
      updateOverlay('chartTitle', [totalData]);
      updateOverlay('clusterDetail',[]);
      parent.jQuery(window.parent).trigger('resize');
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
    var value = brush.extent()[0].getFullYear(),
        extent = [new Date(value, 0, 1), new Date(value+1, 0, 1)];

    d3.select(this)
      .call(brush.extent(extent));

    options.year = value;
    go(location());
  }

  function yearControls() {
    var margin = {top: 20, right: 40, bottom: 20, left: 20},
      width = (plot.drawWidth() * .7) - margin.left - margin.right,
      height = 65 - margin.top - margin.bottom,
      year = +options.year,
      x;

    if (!yearRange) {
      fetchYears(yearControls);
      return;
    }

    if (!brush) {

      x = d3.time.scale()
        .domain([new Date(yearRange[0],0,1), new Date(yearRange[1]+1, 0, 1)])
        .range([0, width]);

      brush = d3.svg.brush()
        .x(x)
        .extent([new Date(year, 0, 1), new Date(year+1, 0, 1)])
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

      gBrush.selectAll(".resize")
        .remove();

      gBrush.selectAll("rect")
        .attr("height", height);
    } else {
      gBrush.transition()
        .call(brush.extent([new Date(year, 0, 1), new Date(year+1, 0, 1)]));
    }
  }

  function serviceUrl(suffix) {
    var hash = window.location.hash.substring(1).split('?')[0];
    return window.location.pathname.replace(/viz\/.*/, 'report/region/employment') +
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
    console.log(options)
  }

  updateOptionsFromHash(false);
  buildChart('#chart');
  update();

})();
