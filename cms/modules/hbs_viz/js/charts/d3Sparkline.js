function d3Sparkline(selection, data, options){

  var opt = {
        width: selection[0][0].offsetWidth,
        margin: {
          top:0,
          right:10,
          bottom:0,
          left:0
        },
        height: 50,
        dur: 750,
      };

  opt.width -= opt.margin.left + opt.margin.right;
  opt.height -= opt.margin.top + opt.margin.bottom;

  //Scales
  //=======
  var dKeys = d3.keys(data[0]),
      s = {
        'x':{
          attrs:{
            range: function(){ return [0, opt.width];},
            domain : function(){ return d3.extent(data, function(d){ return d[s.x.key] ;}); },
          },
          key: dKeys[0],
          scale: d3.scale.linear()
        },
        'y':{
          attrs:{
            range: function(){ return [0, opt.height];},
            domain : function(){ return d3.extent(data, function(d){ return d[s.y.key];}); }
          },
          key: dKeys[1],
          scale: d3.scale.linear()
        }
      },
      line;

  //SVGs & etc.
  //=======
  var svg,
      clip,
      chart;

  //Axis
  //data that will be binded to axes
  //=======
  var axes,
      axesData = [
        {
          axis: 'x',
          //label: s.x.key,
          transform: function(){return "translate("+opt.margin.left+"," + opt.height + ")";},
          fn: d3.svg.axis(),
          attrs:{
            scale: function(){return s.x.scale;},
            orient: function(){ return 'bottom';},
            ticks: function(){ return  data.length-1 ;}
          }
        },
        {
          axis: 'y',
          //label: s.y.key,
          transform: function(){return "translate(" + opt.margin.left + ",0)";},
          fn: d3.svg.axis(),
          attrs:{
            scale: function(){return s.y.scale;},
            orient: function(){ return 'left';},
            ticks: function(){ return  0 ;}
          }
        }
      ];

  function create(){
    svg = selection.append("svg")
      .attr({
        width: outterWidth(opt.width, opt.margin),
        height: outterWidth(opt.height, opt.margin)
      });

    clip = svg.append("clipPath")
      .attr({id: "clip"})
      .append("rect")
        .attr({'width': opt.width, 'height': opt.height});

    chart = svg.append("g");

    chart.append("path")
        .attr({"clip-path": "url(#clip)"})
        .datum(data)
        .attr({
          d: line,
          stroke: '#000',
          'fill-opacity': 0
        });
  }

  function redraw(){
    svg.call(d3Update, {
        width: outterWidth(opt.width, opt.margin),
        height: outterWidth(opt.height, opt.margin)
      },
      opt.dur
    );

    clip.call(d3Update,
      {'width': opt.width, 'height': opt.height},
      opt.dur
    );

    chart.select("path")
      .call(d3Update,
        {
          d: line(data),
          transform: 'translate('+opt.margin.left+','+opt.margin.top+')'
        },
        opt.dur
      );
  }

  opt.axesData = axesData;
  opt.scales = s;

  function setScales(){

    for(var i in s){
      for(var j in s[i].attrs){
        s[i].scale = s[i].scale[j]( s[i].attrs[j]() );
      }
    }

    line = d3.svg.line()
      .x(function(d) {return s.x.scale(d[s.x.key]); })
      .y(function(d) {return s.y.scale(d[s.y.key]);});
  }

  function setAlias(){
    s = opt.scales;
    axesData = opt.axesData;
  }

  this.options = function(op, value){
    var ret;

    if(typeof op === 'string'){
      if(value) opt[op] = setVal(opt[op], value);
      ret = opt[op];
    }else if( typeof op === 'object'){
      opt = setVal(opt, op);
    }
    if(svg) this.update();
    return ret || opt;
  };

  this.update = function(){
    opt.width = selection[0][0].offsetWidth - opt.margin.left - opt.margin.right;
    opt.height = selection[0][0].offsetHeight - opt.margin.top - opt.margin.bottom;
    setAlias();
    setScales();
    redraw();
    if(axes && typeof axes.update === 'function' ) axes.update();
  };

  this.setAxes = function(aData){
    var oThis = this;
    opt.axesData = setVal(opt.axesData, aData||{});
    axes = chart.append('g')
      .attr({class:'axes'})
      .call(d3Axis, opt.axesData);

    axes.selectAll('.axis')
      .each(function(d){
        var bb = this.getBBox();
        opt.margin[d.attrs.orient()] = (d.axis == 'x')? bb.height: bb.width;
      })
    this.update();
  };


  if(options) this.options(options);

  setScales();
  create();

  return this;
}
