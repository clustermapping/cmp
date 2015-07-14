(function($) {
  Drupal.behaviors.hbs_scatterplot = {
    attach: function(context, settings) {
      settings.hbs_scatterplot = settings.hbs_scatterplot || Drupal.settings.hbs_scatterplot;
      var selector = '#block-hbs-viz-'+settings.hbs_scatterplot.delta+ ' .scatterplot-wrapper',
          data,
          active = null,
          activeDefault = Drupal.settings.hbs_scatterplot.regionId,
          year = 2011,
          zoomed = null,
          zoomFunc;

      //D3 elemets
      //=======
      var plot,
          legend,
          chartMenus,
          plotElem;


      d3.json(settings.hbs_scatterplot.dataJson, function(error, json) {
        data = d3.nest()
          .key(function(d){return d.year_t;})
          .map(json, d3.map);

        var len = data.get(year).length;

        //var hover = d3Behaviors.hover()
        //  .on('over', function(d, i){
        //    active = d;
        //    //plot.update();
        //  })
        //  .on('out', function(d){
        //    if(active !== d) return;
        //    active = null;
        //    //plot.update();
        //  });
        //var hover = d3Behaviors.hover()
        //  .on('over', function(d, i){
        //    var tmp = data.get(year).filter( function(d2){return d2 !== d;} );
        //    plotElem.datum(tmp);
        //    plot.update();
        //    //console.log('hover over', d3.event, this)
        //  })
        //  .on('out', function(d){
        //    plotElem.datum(data.get(year));
        //    plot.update();
        //  });

        zoomFunc = function(d,i){
          console.log("Zoomed", d, i);
          zoomed = zoomed == d? null: d;
          if(zoomed){
            var xKey = plot.scale('x').key,
              yKey = plot.scale('y').key,
              xD = [d[xKey]- 100 , d[xKey]+100 ],
              yD = [d[yKey]- 100 , d[yKey]+100 ];
            plot.zoomIn(xD, yD);
          }else{
            plot.update();
          }
        };

        var diction = [
          {
            "data_key": "x",
            "label": "Diction Label X",
            "desc": "Praesent commodo cursus magna, vel 	scelerisque nisl consectetur et. Donec id elit non 	mi porta gravida at eget metus.",
            "type_name": "Type Name X",
            "format": "$,f",
            "format_short": "$.2s",
            "palette":["#5ab4ac","#f5f5f5", "#d8b365"]
          },
          {
            "data_key": "y",
            "label": "Diction Label Y",
            "desc": "Praesent commodo cursus magna, vel 	scelerisque nisl consectetur et. Donec id elit non 	mi porta gravida at eget metus.",
            "type_name": "Type Name Y",
            "format": "$,f",
            "palette":["#2c7fb8","#edf8b1", "#fec44f"]
          },
          {
            "data_key": "fill",
            "label": "Diction Label Fill",
            "desc": "Praesent commodo cursus magna, vel 	scelerisque nisl consectetur et. Donec id elit non 	mi porta gravida at eget metus.",
            "type_name": "Type Name Fill",
            "format": "$,f",
            "palette":["#e6550d","#fee6ce", "#1b9e77"]
          },
          {
            "data_key": "r",
            "label": "Diction Label Fill",
            "desc": "Praesent commodo cursus magna, vel 	scelerisque nisl consectetur et. Donec id elit non 	mi porta gravida at eget metus.",
            "type_name": "Type Name Fill",
            "format": "$,f",
            "palette":["#e6550d","#fee6ce", "#1b9e77"]
          }
        ]

        var ds = data.get(year).map(function(d) {
          d.x = d.emp_tl;
          d.y = d.private_wage_tf;
          d.fill = d.emp_tl;
          d.r = d.private_wage_tf;
          return d;
        })

        plot = d3Plot()
          .dataDiction(diction)
          .scale("y", 'domain', d3.extent(ds, function(d) {return d.y})) // make optional, use data scale
          .scale("x", 'domain', d3.extent(ds, function(d) {return d.x})) // make optional, use data scale
          .scale("r", 'domain', d3.extent(ds, function(d) {return d.r})) // make optional, use data scale
          .scale("fill", 'domain', d3.extent(ds, function(d) {return d.fill})) // make optional, use data scale
          .layer('gridLayer',{
            kind: 'grid',
            name: "grids",
            enabled: true,  // Make default
            selectable: false, // make default
            clip: true,  // make default
            elements:[
              {
                type:'x',
                axis:{
                  fn: d3.svg.axis(),
                  attrs:{orient: 'bottom'}
                }
              },
              {
                type:'y',
                axis:{
                  fn: d3.svg.axis(),
                  attrs:{orient: 'right'}
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
                //label: 'X Axis',
                'vertical-tick-label': true,
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
                label:'Y Axis',
                axis:{
                  fn: d3.svg.axis(),
                  attrs:{orient:'left'},
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
                label: 'Random Y Guide',
                axis: 'y',
                value: Math.random() * 1000,
                attrs:{
                  stroke: 'red',
                  y1: 'y',
                  y2: 'y'
                }
              },
              {
                type: 'line',
                label: 'Medium',
                axis: 'x',
                value : function(d){
                  var key = plot.scale('x', 'key');
                  return d3.median( plot.data(), function(d){ return d[key]; } );
                },
                attrs:{
                  stroke: 'red',
                  x1: 'x',
                  x2: 'x'
                }
              },
              {
                type: 'line',
                label: 'Top 25% of X',
                axis: 'x',
                value : function(d){
                  var key = plot.scale('x', 'key'),
                    data = [];
                  plot.data().forEach(function(elem){data.push(elem[key]);});
                  data = data.sort(function(a, b) {return a - b;});
                  return d3.quantile( data, 0.75 );
                },
                attrs:{
                  stroke: 'red',
                  x1: 'x',
                  x2: 'x'
                }
              },
              {
                type: 'line',
                label: 'Top 25% of Y',
                axis: 'y',
                value : function(d){
                  var key = plot.scale('y', 'key'),
                    data = [];
                  plot.data().forEach(function(elem){data.push(elem[key]);});
                  data = data.sort(function(a, b) {return a - b;});
                  return d3.quantile( data, 0.75 );
                },
                attrs:{
                  stroke: 'red',
                  y1: 'y',
                  y2: 'y'
                }
              },
              {
                type: 'rect',
                label: 'Top 25% of Each',
                range: {
                  x:[0.75, 1],
                  y:[0.75, 1]
                },
                attrs:{
                  fill: '#00f',
                  x: 'x',
                  y: 'y',
                  width: 'x',
                  height:'y'
                }
              }
            ]
          })
          .layer("cirLayer", {
            kind:"point",
            name: "plot",
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
                  fill: 'fill',
                  r: 'r',
                  cx: 'x',
                  cy: 'y',
                  opacity: 1
                }
              },
              {
                type: 'text',
                attrs:{
                  x: 'x',
                  y: 'y',
                  'text-anchor': 'middle',
                  'font-size': '0.5em'
                },
                text: function(d,i){ return d.name_t;}
              }
            ]
          })
          .layer('infoLayer', {
            kind: 'info',
            dataFN: function(){ return (zoomed)? [zoomed]: [];},
            name: 'infoLayer',
            enabled: true,
            layerCanvas: 'div',
            elements:[
              {
                type: 'div',
                attrs: {class: 'header'},
                append: [{
                  type: 'h2',
                  text: function(d){return d.title;}
                }]
              },
              {
                type: 'div',
                attrs: {class: 'body'},
                append:[{
                  type: 'p',
                  text: function(d){return d.year_t +" "+d.fill+" "+d.x;}
                },
                  {
                    type: 'a',
                    attrs:{'href': 'http://google.com'},
                    text: function(d){return d.year_t;}
                  }]
              }
            ],
            behavior:{
              'cirLayer.focus': function(d,i){
              }
            }
          });



        plotElem = d3.select(selector)
          .datum(ds)
          .call(plot);

      });

      $( window ).resize(function() {
        var tempW = $(selector).width();
        if (tempW == width ) return;

        width = tempW;

        plotElem.call(plot.update);
      });

//      d3.json(settings.hbs_plot.dataJson, function(error, json) {
//
//        data = d3.nest()
//          .key(function(d){return d.year_t;})
//          .map(json, d3.map);
//
//        yearList = data.keys().map(function(d){return {key: d, label: d};});
//
//        plot = d3.select(selector)
//          .call(d3Plot, data.get(2011), options);
//
//        chartMenus = d3.select('#block-hbs-viz-'+settings.hbs_plot.delta+ ' .chart-menu').append("div").attr("class", "plot-controls row");
//        buildMenus();
//        plot.setAxes();
//
//
//        plot.setTitle("Average Wage by State for 2011");
//      });

//      function listVariables(ex) {
//        var ops = [{label: "Cluster Strength", key: "str_emp_per_tf"},
//                 {label: "Employment", key: "emp_tl"},
//                 {label: "Employment Creation", key: "emp_creation_tl"},
//                 {label: "Establishments", key: "est_tl"},
//                 {label: "Establishment Creation", key: "est_creation_tl"},
//                 {label: "Annual Payroll", key: "ap_tl"},
//                 {label: "Average Yearly Wage", key: "private_wage_tf"},
//                 {label: "Location Quotient", key: "lq_tf"},
//                 {label: "% Cluster Employment from Region", key:"region_emp_per_tf"},
//                 {label: "% Regional Employment from Cluster", key: "cluster_emp_per_tf"}],
//            l = [];
//        ops.forEach(function(d) {
//          if (ex[d.key] != undefined) l.push(d);
//        });
//
//        return l;
//      }
//
//      function buildMenus() {
//        ops = plot.options();
//        var menus = [],
//            currentSel = {"x-axis": ops.scales.x.key, "y-axis": ops.scales.y.key, "radius": ops.scales.r.key, "color": ops.scales.c.key/*, years: 2011*/};
//
//        menus.push({name: "x-axis", options: listVariables( data.get(2011)[0]) });
//        menus.push({name: "y-axis", options: listVariables( data.get(2011)[0]) });
//        menus.push({name: "radius", options: listVariables( data.get(2011)[0]) });
//        menus.push({name: "color", options: listVariables( data.get(2011)[0]) });
//        //menus.push({name: "years", options: yearList});
//
//        chartMenus.selectAll("div.map-control").remove();
//        chartMenus.selectAll("div").data(menus)
//                    .enter().append("div")
//                    .attr("class", "map-control col-md-3")
//                      .text(function(d){return d.name+':  ';})
//                      .append("select")
//                      .attr("name",function(d) { return "map_" + d.name})
//                      .attr("class",'clearfix')
//                      .on("change", updateChartFromControls)
//                      .selectAll("option").data(function(d) { return d.options;})
//                        .enter().append("option")
//                          .attr("selected", function(d) {
//                            if (d.key == currentSel[d3.select(this.parentNode).datum().name]) return "selected";
//                          })
//                          .attr("value", function(d) { return d.key; })
//                          .text(function(d) { return d.label;});
//      }
//
//      function updateChartFromControls() {
//
//        var name = this.name, val = this.value;
//        //dur = 750,.log('name',name,val);
//        switch (name) {
//          case "map_x-axis":
//            plot.options({scales:{x:{key:val}}});
//            break;
//          case "map_y-axis":
//            plot.options({scales:{y:{key:val}}});
//            break;
//          case 'map_radius':
//            plot.options({scales:{r:{key:val}}});
//            break;
//          case 'map_color':
//            plot.options({scales:{c:{key:val}}});
//            break;
//          /*case 'map_year':
//            plot.options(activeYear);
//            break;*/
//        }
//
//      }

//      var create = function(){
//
//
//        //Creates X zero axis
//        zeroXAxis =  chart.append("g")
//          .attr({class: "zero axis"})
//        .append("line")
//          .attr({y1: y(0), y2: y(0), x2: width });
//
//        //Creates Y zero axis
//        zeroYAxis =  chart.append("g")
//          .attr("class", "zero axis")
//        .append("line")
//          .attr({x1: x(0), x2: x(0), y2: height });
//
//        //Creates guides
//        guides = chart.append("g")
//          .attr({"clip-path": "url(#plot-clip)", "class": "guides axis"})
//          .selectAll(".guide")
//          .data(guideData)
//          .enter()
//        .append("g")
//          .attr({class: 'guide-group'})
//        .append("line")
//          .attr({
//            x1: function(d){return (d.axis === 'x')? x(d.value): null;},
//            x2: function(d){return (d.axis === 'x')? x(d.value): width;},
//            y1: function(d){return (d.axis === 'y')? y(d.value): null;},
//            y2: function(d){return (d.axis === 'y')? y(d.value): height;}
//          });
//
//        //Creates guides labels
//        guideLabels = chart.selectAll(".guide-group")
//          .append('text')
//          .text(function(d){return d.lKey;})
//          .attr({
//            x: function(d) {return (d.axis === 'x')? x(d.value)+5: 10;},
//            y: function(d) {return(d.axis === 'y')? y(d.value)-5: 10;},
//            //When rotating you need to take in account previous movment
//            transform: function (d){ return (d.axis === 'x')? "rotate(90 "+(x(d.value)+5)+",10)": "";}
//          });
//
//        legend = chart.select('g')
//          .datum(function(d){
//            d = {};
//            d.fn = {
//              open: function(elem){
//                var bb = d3.select(elem)[0][0].getBBox();
//                d3.select(elem)
//                  .call(d3Update, {transform: ('translate('+(width-bb.width)+','+(height-bb.height)+')')}, dur);
//              },
//              close: function(elem){
//                var w = d3.select(elem).select('text.title')[0][0].getBBox().width + 20;
//                d3.select(elem)
//                  .call(d3Update, {transform: ('translate('+(width-w)+','+(height-30)+')')}, dur);
//              }
//            };
//            d.keys = lKeys;
//            return d;
//          })
//          .call(d3Legend);
//
//          legend.select('.legend')
//            .attr({
//              transform: function(d){
//                var w = d3.select(this).select('text.title')[0][0].getBBox().width + 20;
//                return 'translate('+(width-w)+','+(height-30)+')';
//              }
//            });
//
//
//        //Intro objects animations
//        redraw();
//      };

//      var redraw = function(){
//
//        guides.call(d3Update,{
//              x1: function(d){return (d.axis === 'x')? x(d.value): null;},
//              x2: function(d){return (d.axis === 'x')? x(d.value): width;},
//              y1: function(d){return (d.axis === 'y')? y(d.value): null;},
//              y2: function(d){return (d.axis === 'y')? y(d.value): height;}
//            },
//            dur);
//
//        guideLabels.call(d3Update,{
//              x: function(d) {return (d.axis === 'x')? x(d.value)+ 5 : 10;},
//              y: function(d) {return(d.axis === 'y')? y(d.value)-5 : 10;},
//              transform: function (d){ return (d.axis === 'x')? "rotate(90 "+(x(d.value)+5)+",10)": "";}
//            },
//            dur);
//
//        zeroXAxis.call(d3Update,{y1: y(0), y2: y(0), x2: width },dur);
//        zeroYAxis.call(d3Update,{x1: x(0), x2: x(0), y2: height },dur);
//
//
//        legend.datum(function(d){
//          d.keys = lKeys;
//          return d;
//        })
//          .select('.legend')
//          .call(d3Update,{
//              transform: function(d){
//                var w = d3.select(this).select('text.title')[0][0].getBBox().width + 20;
//                return 'translate('+(width-w)+','+(height-30)+')';
//              }
//            },
//            dur)
//          .call(legend.drawLegend);
//      };

    }
  };
})(jQuery);
