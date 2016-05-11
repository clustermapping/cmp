function d3Gauge(selection, data, options){
  var opt = {
        width: selection[0][0].offsetWidth,
        margin: {top: 10, right: 10, bottom: 50, left: 50},
        height: 500,
        dur: 750,
      };

  data = {value: 33, avg: 62, max:100};
  //Elements & etc.
  //=======
  var gauge;

  function create(){
    gauge = selection.append("div")
      .datum(data)
      .attr({
        class: 'progress progress-striped active'
      });

    gauge.append('div')
      .attr({
        class:'progress-bar',
        role: 'progressbar',
        'aria-valuenow': function(d){return d.value},
        'aria-valuemin': 0,
        'aria-valuemax': function(d){return d.max}
      })
      .style('width', function(d){return d.value + '%'; });

      gauge.append('div')
        .attr({class:'gauge-marker'})
        .style('left', function(d){return d.avg + '%'; })
  }

  function redraw(){
  }


  function setScales(){
  };

  this.update = function(){

    opt.width = selection[0][0].offsetWidth - opt.margin.left - opt.margin.right;
    setAlias();
    setScales();
    redraw();
    if(typeof axes.update === 'function' ) axes.update();
  }

  this.setAxes = function(aData){

  };

  this.options = function(op, value){
    setAlias();
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


  if(options) this.options(options);
  setScales();
  create();

  return this;
}
