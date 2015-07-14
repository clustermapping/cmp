(function($) {
  Drupal.behaviors.hbs_region_dashboard = {
    attach: function(context, settings) {
      var loader = new MythosVis.DataLoader(),
          data = settings.hbs_dashboard.data.region,
          region_type = data.region_type_t,
          region_id = data.region_code_t;
      loader.request(['/data/region/' + region_type + '/' + region_id + '/all',
                      '/data/region/' + region_type + '/' + region_id + '/all/all'],
        function(aggs, clusters) {
          // Creating a counter element for charts, so we can style elements differently.
          var chartElementCounters = {
            tradedVsLocal: 0
          };

          var allData, byYear, byTraded, latest, primary;
          aggs.forEach(function(d) {
            d.region_name_t  = d.name_t;
            d.cluster_code_t = 'all';
          });
          allData = aggs.concat(clusters);
          byYear = d3.nest()
            .key(function(d) {return +d.year_t;})
            .key(function(d) {return d.cluster_code_t;})
            .map(allData, d3.map);
          byYearTraded = d3.nest()
            .key(function(d) {return +d.year_t;})
            .key(function(d) { return (d.traded_b ? 'traded' : 'local');})
            .map(clusters, d3.map);
          byYearTradedSum = d3.nest()
            .key(function(d) {return +d.year_t;})
            .key(function(d) { return (d.traded_b ? 'traded' : 'local');})
            .rollup(function(ds) { return d3.sum(ds, function(d) { return d.emp_tl; })} )
            .map(clusters, d3.map);
          latest = d3.max(byYear.keys());
          primary = byYear.get(latest).get('all')[0],
          top_traded = byYearTraded.get(latest).get('traded').slice(0),
          top_local = byYearTraded.get(latest).get('local').slice(0);
          if (! top_traded[0].emp_tl) {
            top_traded = byYearTraded.get(latest-1).get('traded').slice(0);
          }
          if (! top_local[0].emp_tl) {
            top_local = byYearTraded.get(latest-1).get('local').slice(0);
          }
          top_traded = top_traded.sort(function(a, b) { return d3.descending(a.emp_tl, b.emp_tl);}).slice(0, 10);
          top_local = top_local.sort(function(a, b) { return d3.descending(a.emp_tl, b.emp_tl);}).slice(0, 10);

          //drawStrongClusters(primary);
          var pieData = byYearTradedSum.get(latest).entries();
          if (!pieData[0].value && !pieData[1].value) {
            pieData = byYearTradedSum.get(latest -1).entries();
          }
          drawTradedLocalPie(pieData);
          drawClustersChart('.cluster-container .bar', top_traded);
          //drawClustersChart('#local-chart', top_local);
          //drawClusterChartLinks('#cluster-chart-links');


          function drawClusterChartLinks(selector) {
            var links = [['Job Creation', 'clusters/jobcreation'],
                         ['Employment',  'clusters/employment'],
                         ['Wages', 'clusters/wages']];
            d3.select(selector).selectAll('div.col-md-4').data(links).enter()
              .append('div').classed('col-md-4', true)
              .append('a')
              .attr('href', function(d) { return window.location.pathname + '/' + d[1];})
              .text(function(d) { return d[0]; });
          }

          function drawStrongClusters(data){
            d3.select('#cluster_strength').style('font-size', '200%').text(d3.format('.2p')(data.str_emp_per_tf));
            d3.select('#strong_clusters ul').selectAll('li')
              .data(data.strong_clusters)
              .enter()
              .append('li').text(function(d) { return d.name;});
          }

          function drawClustersChart(selector, data) {
            var plot = d3Plot()
              .width(320)
              .height(200)
              .scale("yOrdinal",
              {
                key:'cluster_name_t',
                scale: d3.scale.ordinal(),
                attrs: {
                  rangeRoundBands: function(data, key, drawWidth, drawHeight, margin){return ({ args: [ [0, drawHeight - margin.top - margin.bottom], 0.15 ]});},
                  domain: function(data, key){ return data.map( function(d) { return d[key];} );},
                }
              })
              .scale("x", 'key', 'emp_tl')
              .scale("x", 'domain', function (data, key){ return [0,d3.max( data, function(d){ return d[key];})];})
              .margin.left(150)
              .margin.bottom(80)
              .layer('gridLayer',{
                kind: 'grid',
                name: "grids",
                enabled: true,
                selectable: false,
                clip: true,
                elements:[
                  {
                    type:'x',
                    axis:{
                      fn: d3.svg.axis(),
                      attrs:{orient: 'top'}
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
                    type: 'yOrdinal',
                    label: '',
                    'wrap-tick-label': true,
                    attrs:{
                      //transform: function(d){return "translate(" + (plot.drawWidth() - plot.margin.left() - plot.margin.right()) + ",0)";}
                    },
                    axis:{
                      fn: d3.svg.axis(),
                      attrs:{orient: 'left'}
                    }
                  },
                  {
                    type:'x',
                    label:'Employment',
                    'vertical-tick-label': true,
                    attrs:{
                      transform: function(d){
                        return "translate(0," + (plot.drawHeight() - plot.margin.top() - plot.margin.bottom()) + ")";}
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
                      fill: function(d) {
                        switch (selector) {
                          case '#traded-chart':
                            return '#3c78d8';
                          case '#local-chart':
                            return '#f88f65';
                          default:
                            return '#0a936a';
                        }
                      },
                      y: 'yOrdinal',
                      x: function(d) {
                        var sX = plot.scale('x');
                        //return sX.scale( Math.max( (d[sX.key]), 0) );
                        return sX.scale( 0 );
                      },
                      height: function(){return plot.scale('yOrdinal').scale.rangeBand();},
                      width: function(d) {
                        var sX = plot.scale('x');
                        //return Math.abs(sX.scale(0)-sX.scale(d[sX.key]));
                        return sX.scale(d[sX.key]);
                      }
                    }
                  }
                ]
              });

            chart = d3.select(selector)
              .datum(data)
              .call(plot);
          }

          function drawTradedLocalPie(data) {

            var piePlot = d3Plot()
              .margin({top:0,right:0,bottom:0,left:0})
              .scale('pie', {
                scale: d3.scale.ordinal(),
                attrs:{
                  domain: ["local", "traded"],
                  range: ['#3c78d8', '#0a936a']
                }
              })
              .layer('pieLayer',{
                kind: 'pie',
                name: "pie",
                enabled: true,
                selectable: false,
                clip: false,
                pie:{
                  fn: d3.layout.pie(),
                  attrs: {
                    sort: null,
                    value: function(d){ return d.value; }
                  }
                },
                attrs:{
                  transform: function(){
                    var m = piePlot.margin(),
                      x = (piePlot.drawWidth()-m.left-m.right)/2,
                      y = (piePlot.drawHeight()-m.top-m.bottom) /2;
                    return "translate(" + (x + m.left) + "," + (y + m.top) + ")"  ;
                  }
                },
                elements:[
                  {
                    type: 'path',
                    attrs:{
                      fill: function(d){
                        var scale = piePlot.scale('pie').scale;
                        return scale(d.data.key);
                      },
                      stroke: '#fff',
                      'stroke-width': 1,
                      d:{
                        fn: d3.svg.arc(),
                        attrs: {
                          outerRadius: function() {
                            var m = piePlot.margin();
                            return d3.min( [( piePlot.drawWidth()-m.top-m.bottom ), ( piePlot.drawHeight()-m.left-m.right )] )/2 -10;
                          },
                          innerRadius: function(){ return d3.min( [piePlot.drawWidth(), piePlot.drawHeight()] )/4; }
                        }
                      }
                    }
                  },
                  {
                    type: 'text',
                    attrs: {
                      style: 'fill:#fff!important;',
                      dy: 0,
                      x: function(d, i) {
                        var m = piePlot.margin();
                        var r = d3.min( [piePlot.drawWidth(), piePlot.drawHeight()] )/4 + 25;
                        var a = d.endAngle - (d.endAngle - d.startAngle) / 2;
                        var x = r * Math.sin(a);
                        return x;
                      },
                      y: function(d, i) {
                        var m = piePlot.margin();
                        var r = d3.min( [piePlot.drawWidth(), piePlot.drawHeight()] )/4 + 25;
                        var a = d.endAngle - (d.endAngle - d.startAngle) / 2;
                        var y = r * Math.cos(a) * -1;
                        return y;
                      }
                    },
                    text: function (d) {
                      var val = (d.endAngle - d.startAngle) * 100 / (Math.PI * 2);
                      return Math.round(val) + '%';
                    }
                  }
                ]
              })
              .layer('enumLegendThree', {
                kind: 'info',
                name: 'enumLegendThree',
                enabled: true,
                dataFN: function() {
                  return [1];
                },
                layerCanvas: 'div',
                elements: [
                  {
                    type:'div',
                    attrs: {class: 'legend-three',style: "width:120%"},
                    append:[
                      {
                        type: 'div',
                        attrs: {style: "clear:both"},
                        append: [
                          {
                            type: 'div',
                            attrs: {style: function(d, i) {
                              var s = piePlot.scale('pie');
                              return "height: 15px; width: 15px; margin: 3px; float: left; background-color:" + piePlot.scale('pie').scale('traded');
                          }}},
                          {type: 'div', attrs: {style: function(d) {return "padding: 3px; float: left; font-size: 12px; color: #777d85";}},
                          text: "Traded"}
                        ]
                      },
                      {
                        type: 'div',
                        attrs: {style: "clear:both"},
                        append: [
                          {
                            type: 'div',
                            attrs: {style: function(d, i) {
                              return "height: 15px; width: 15px; margin: 3px; float: left; background-color:" + piePlot.scale('pie').scale('local');
                          }}},
                          {type: 'div', attrs: {style: function(d) {return "padding: 3px; float: left;font-size: 12px; color: #777d85";}},
                          text: "Local"}
                        ]
                      },
                    ]
                  }
                ]
              });

            var chart = d3.select('.cluster-container .pie')
              .datum(data)
              .call(piePlot);
          }
        }
      );
    }
  };
 })(jQuery);