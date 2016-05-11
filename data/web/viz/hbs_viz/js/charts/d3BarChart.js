function d3BarChart(selection, data, options){
  var opt = {
        width: selection[0][0].offsetWidth,
        margin: {top: 10, right: 10, bottom: 10, left: 15},
        height: 2000,
        dur: 750,
      };

  //Scales
  //=======
  var s = {
        x:{
          key: 'name_t',
          attrs:{
            rangeRoundBands: function(){ return ({ sendMultiple: true, args: [ [0, opt.width], 0.15 ]});},
            domain : function(){ return data.map(function(d) { return d[s.x.key]; });},
          },
          scale: d3.scale.ordinal()
        },
        y:{
          key: 'ap_tl',
          key2: 'qp1_tl',
          attrs:{
            range: function(){ return [opt.height, 0];},
            domain : function(){
              var i = data.map(function(d){ return d[s.y.key];})
                .concat(data.map(function(d){ return d[s.y.key2];}));
              return d3.extent(i)
            },
          },
          scale: d3.scale.linear()
        }
      };

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
            orient: function(){ return 'left';}
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
    svg = selection.append("svg");

    clip = svg.append("clipPath")
      .attr({"id": "bar-clip"})
      .append("rect")
      .attr({"width": opt.width, "height": opt.height});

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
      .data(data)
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
    marks = chart.append("g")
      .attr({"clip-path": "url(#bar-clip)"})
      .selectAll(".mark")
      .data(data)
      .enter().append("line")
        .attr({
          class: "mark",
          y1: function(d) { return s.y.scale( 0 ); },
          y2: function(d) { return s.y.scale( 0 ); },
          x1: function(d) { return s.x.scale(d[s.x.key]); },
          x2: function(d) { return s.x.scale(d[s.x.key]) + s.x.scale.rangeBand(); }
        });

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
        function(d, i) { return i * opt.dur / data.length; }
      );

    marks
      .call(d3Update,
          {
          y1: function(d) { return s.y.scale( d[s.y.key2] ); },
          y2: function(d) { return s.y.scale( d[s.y.key2] ); },
          x1: function(d) { return  s.x.scale(d[s.x.key]); },
          x2: function(d) { return  s.x.scale(d[s.x.key]) +  s.x.scale.rangeBand(); }
        },
        opt.dur,
        function(d, i) { return opt.dur+(i * opt.dur /data.length); }
      );

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
    opt.height = (700*ratio) - opt.margin.top - opt.margin.bottom;

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

  opt.axesData = axesData;
  opt.scales = s;
  if(options) this.options(options);
  setScales();
  create();

  return this;
}
