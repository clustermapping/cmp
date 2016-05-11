function d3SmallBarChart(selection, data, options){
  var opt = {
        width: selection[0][0].offsetWidth,
        margin: {top: 10, right: 10, bottom: 10, left: 10},
        height: 200,
        dur: 750,
        filter: {
          region_type: 'states',
        }
      };

  //Filters
  //========
  var ac = function(p) { return function(d) {return d[p];}},
      aplus = function(p) { return function(d) {return +d[p];}},
      byYearByClusterByRegion = d3.nest().key(ac('year_t')).key(ac('cluster_code_t')).key(aplus('region_code_t')).map(data, d3.map),
      byClusterByYearByRegion = d3.nest().key(ac('cluster_code_t')).key(ac('year_t')).key(aplus('region_code_t')).map(data, d3.map),
      byClusterByYear = d3.nest().key(ac('cluster_code_t')).key(ac('year_t')).map(data, d3.map),
      byClusterByRegion = d3.nest().key(ac('cluster_code_t')).key(ac('region_code_t')).map(data, d3.map),
      year = d3.max(byYear.keys()),
      cluster = 'all',
      region = 'all';


  var values = byClusterByYear.get(cluster).get(year);


  //Scales
  //=======
  var s = {
        x:{
          key: 'name_t',
          attrs:{
            rangeRoundBands: function(){ return ({ sendMultiple: true, args: [ [0, opt.width], 0.15 ]});},
            domain : function(){ return values.map(function(d) { return d[s.x.key]; });},
          },
          scale: d3.scale.ordinal()
        },
        y:{
          key: 'ap_tl',
          key2: 'qp1_tl',
          attrs:{
            range: function(){ return [opt.height, 0];},
            domain : function(){
              var i = values.map(function(d){ return d[s.y.key];})
                .concat(values.map(function(d){ return d[s.y.key2];}));
              return d3.extent(i)
            }
          },
          scale: d3.scale.linear()
        }
      };

  values = values.sort(function(a,b) {
        return d3.descending(a[s.y.key], b[s.y.key]);
      });;

  //Axis
  //data that will be binded to axes
  //=======
  var axes,
      axesData = [
        {
          axis: 'x',
          label: s.x.key,
          transform: function(){return "translate(0, " + opt.height + ")";},
          fn: d3.svg.axis(),
          attrs:{
            scale: function(){return s.x.scale;},
            orient: function(){ return 'bottom';}
          },
          'vertical-label': true
        },
        {
          axis: 'y',
          label: s.y.key,
          transform: null,
          fn: d3.svg.axis(),
          attrs:{
            scale: function(){return s.y.scale;},
            orient: function(){ return 'left';},
            ticks: d3.functor(4)
          }
        }
      ];


  //SVGs & etc.
  //=======
  var svg,
      clip,
      chart,
      bars,
      marks,
      axes,
      axesLabels,
      zeroAxisSVG;

  function create(){
    if (!svg) {
      svg = selection.append("svg");

      clip = svg.append("clipPath")
        .attr({"id": "bar-clip"})
        .append("rect")
        .attr({"width": opt.width, "height": opt.height});
    }

    if (chart) {
      chart.remove();
    }

    chart = svg.append("g")
      //Offsets to take axis/margins into account
      .attr({
        transform: "translate(" + opt.margin.left + "," + opt.margin.top + ")",
        class: 'chart'
      });

    //Create bars
    bars = chart.append("g")
      .attr("clip-path", "url(#bar-clip)")
      .selectAll(".bar")
      .data(values)
      .enter().append("rect")
        .attr({
          //class to allow different coloring if pos or neg
          class: function(d) { return d[s.y.key] < 0 ? "bar negative" : "bar positive"; },
          y: s.y.scale(0),
          x: function(d) {return s.x.scale(d[s.x.key]);},
          height: 0,
          width: s.x.scale.rangeBand()
        });

    //Create marks
    // marks = chart.append("g")
    //   .attr({"clip-path": "url(#bar-clip)"})
    //   .selectAll(".mark")
    //   .data(values)
    //   .enter().append("line")
    //     .attr({
    //       class: "mark",
    //       y1: function(d) { return s.y.scale( 0 ); },
    //       y2: function(d) { return s.y.scale( 0 ); },
    //       x1: function(d) { return s.x.scale(d[s.x.key]); },
    //       x2: function(d) { return s.x.scale(d[s.x.key]) + s.x.scale.rangeBand(); }
    //     });

//    zeroAxisSVG =  chart.append("g")
//      .attr({class: "zero axis"})
//    .append("line")
//      .attr({
//        y1: y(0),
//        y2: y(0),
//        x2: width
//      });

    redraw();
  }

  function redraw(){
    svg
      .attr({
        "width": outterWidth(opt.width, opt.margin),
        "height": outterWidth(opt.height, opt.margin) + ( (svg.select('g.x.axis')[0][0])? svg.select('g.x.axis')[0][0].getBBox().height : 0)
      });

    clip
      .call(d3Update, {"width": opt.width, "height": opt.height}, opt.dur);

    chart
      .attr({transform: "translate(" + opt.margin.left + "," + opt.margin.top + ")"});

    bars
      .attr("class", function(d) { return d[s.y.key] < 0 ? "bar negative" : "bar positive"; })
      .call(d3Update,
        {
          y: function(d) { return s.y.scale( Math.max( (d[s.y.key]), 0) ); },
          x: function(d) { return s.x.scale(d[s.x.key]); },
          height: function(d) {return Math.abs(s.y.scale(0)-s.y.scale(d[s.y.key]));},
          width: s.x.scale.rangeBand()
        },
        opt.dur,
        function(d, i) { return i * opt.dur / values.length; }
      );

    // marks
    //   .call(d3Update,
    //       {
    //       y1: function(d) { return s.y.scale( d[s.y.key2] ); },
    //       y2: function(d) { return s.y.scale( d[s.y.key2] ); },
    //       x1: function(d) { return  s.x.scale(d[s.x.key]); },
    //       x2: function(d) { return  s.x.scale(d[s.x.key]) +  s.x.scale.rangeBand(); }
    //     },
    //     opt.dur,
    //     function(d, i) { return opt.dur+(i * opt.dur /values.length); }
    //   );

//    zeroAxisSVG
//      .transition()
//      .duration(dur)
//      .attr({
//        y1: y(0),
//        y2: y(0),
//        x2: width
//      });
  }

  function setAlias(){
    s = opt.scales;
    axesData = opt.axesData;
  }

  function setScales(){
    var ratio = outterWidth(opt.width, opt.margin)/940;
    opt.height = (200*ratio) - opt.margin.top - opt.margin.bottom;

    for(var i in s){
      for(var j in s[i].attrs){
        var args = s[i].attrs[j]();
        if (args.hasOwnProperty && args.sendMultiple) {
          s[i].scale = s[i].scale[j].apply(null, args.args);
        } else {
          s[i].scale = s[i].scale[j](args);
        }
      }
    }
  };

  this.update = function(){

    opt.width = selection[0][0].offsetWidth - opt.margin.left - opt.margin.right;
    setAlias();
    setScales();
    redraw();
    if(axes && (typeof axes.update === 'function') ) axes.update();
  }

  this.setAxes = function(aData){
    var oThis = this;
    opt.axesData = setVal(opt.axesData, aData||{});
    chart.selectAll('g.axes').remove();
    axes = chart.append('g')
      .attr({class:'axes'})
      .call(d3Axis, opt.axesData);

    //Set new margins
    axes.selectAll('g.axis').each(function(d){
      var bb = chart.select("g.axis."+d.axis)[0][0].getBBox();
      opt.margin[d.attrs.orient()] += (d.axis === 'x')? bb.height : bb.width;
    });
    this.update();
  };

  var ref = this;

  this.options = function(op, value){
    setAlias();
    var ret;
    if(typeof op === 'string'){
      if(value) opt[op] = setVal(opt[op], value);
      ret = opt[op];
    }else if( typeof op === 'object'){
      opt = setVal(opt, op);
    }

    if(svg) ref.update();
    return ret || opt;
  };

  this.updateWith = function(c, i) {
    if (c.year) year = c.year;
    if (c.region) region = c.region;
    if (c.cluster) cluster = c.cluster;

    if (year === 'all' && region !== 'all') {
      values = byClusterByRegion.get(cluster).get(region);
    } else if (region === 'all' && year !== 'all') {
      values =  byClusterByYear.get(cluster).get(year);
    } else if (region === 'all' && year === 'all') {
      values = [].concat()
    } else {
      values = byClusterByYearByRegion.get(cluster).get(year).get(region);
    }

    if (c.label) {
      s.x.key = c.label;
    }
    if (c.value_key) {
      s.y.key = c.value_key;
    }
    if (c.sort && values) {
      var sort_key = c.value_key,
          sort_func = d3.descending;

      if (c.sort_key) sort_key = c.sort_key;
      if (c.sort === 'a') sort_func = d3.ascending;

      values = values.sort(function(a,b) {
        return sort_func(a[sort_key], b[sort_key]);
      });

      if (c.limit) {
        values.length = c.limit;
      }
    }

    if (c.benchmark) {
        //TODO up in this mf
    }

    if (values && values[0][s.x.key] && values[0][s.y.key]) {
      console.log("Data for:" + s.x.key + " and  " + s.y.key);
      console.log("values for: " + year + ", " + region + ", " + cluster);
      console.log("values: " + values.length);
      console.log("x: " + values[0][s.x.key] + " y:"+ values[0][s.y.key]);
      setScales();
      create();
      this.setAxes();
    } else {
      console.log("No data for:" + s.x.key + " and  " + s.y.key);
      if (values) {
        console.log("values for: " + year + ", " + region + ", " + cluster);
        console.log("values: " + values.length);
        console.log("x: " + values[0][s.x.key] + " y:"+ values[0][s.y.key]);
      } else {
        console.log("no values for: " + year + ", " + region + ", " + cluster);
      }
    }
  }

  opt.axesData = axesData;
  opt.scales = s;
  if(options) this.options(options);
  setScales();
  create();

  return this;
}
