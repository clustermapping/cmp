function d3Axis(){
  var dur = 750,
      delay = 0,
      g;

  function _axis_updateAxisFN() {
    var setProps = function (d){
          d.fn = d.fn || d3.svg.axis();
          for(var prop in d.props){
            d.fn = d.fn[prop](propVal(prop, d.props[prop]));
          }
        },
        propVal = function (prop, propV){
          return (typeof propV === 'function'&& prop !== 'scale') ? propV() : propV;
        };
    g.each(setProps);
  }

  function _axis_setupAxis() {
    _axis_updateAxisFN();
    g.append("g")
      .attr({class: function(d){return d.type +' axis';} });

    g.each(function(d){
      if(d.label){
        d3.select(this)
          .append('text')
          .attr({class: 'axis-label label'});
      }
    });
  }

  function _axis_drawAxis() {

    g.each(function(d,i){
      var elem = d3.select(this),
          axis = elem.select("g.axis");

      if(d.label){
        var bb = axis[0][0].getBBox();
        elem.select('text.label')
          .text(d.label)
          .attr({
              'y': function(){return (d.type === 'y')? bb.height/2: bb.height+ d3.select(this)[0][0].getBBox().height;},
              'x': function(){return (d.type === 'x')? bb.width/2: -bb.width;},
              'transform':  function (){ return (d.type === 'y')? "rotate(-90 "+(-bb.width)+","+(bb.height/2)+")" : "";}
            });
      }

      axis.interrupt()
        .transition()
        .delay(delay)
        .duration(dur)
        .call(d.fn);

      if(d['vertical-tick-label']){
        elem.selectAll(".tick text")
          .attr({
            dy: ".35em",
            transform: "rotate(90,0,9)"
          })
          .style("text-anchor", "start");
      }

    });
  }

  function _axis(sel) {
    if(!sel[0][0])return;

    g = sel;
    _axis_setupAxis();

    _axis.update = function _axis_mAxis() {
      _axis_updateAxisFN();

      _axis_drawAxis();
      return _axis;
    };

    _axis.update();
  }

  _axis.duration = function _axis_mDur(value) {
    if (!arguments.length) return dur;
    dur = value;
    return _axis;
  };
  _axis.delay = function _axis_mDelay(value) {
    if (!arguments.length) return delay;
    delay = value;
    return _axis;
  };

  return _axis;
}