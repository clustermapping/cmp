//  data = [
//    {
//      axis: 'x',
//      label: '',
//      orient: 'bottom',
//      transform: function(){return "translate(0, " + height + ")";}
//      scale: //function returning scale
//      fn: //axis function
//      attr: {} //attr to run on fn
//    }
//  ];

function d3AxisBak(selection, data){
  var bb = selection[0][0].getBBox(),
      dur = 750;
  //D3 Elements & etc.
  //=======
  var axes,
      axesLabels;

  function create(){
    axes = selection.selectAll("g.axis")
      .data(data)
      .enter()
      .append("g")
        .attr({
          class: function(d){return d.axis+" axis";},
          transform: function(d){
            return (typeof d.transform == 'function')? d.transform(): d.transform;
          }
        })
        .each(function(d) { d.fn(d3.select(this)); });

    axes.each(function(d){
      var axis = d3.select(this);
      if(d['vertical-label']){
        axis.selectAll(".tick text")
          .attr({
            y: 0,
            x: 9,
            dy: ".35em",
            transform: "rotate(90)"
          })
          .style("text-anchor", "start");
      }

      if(d.label){

        var yTickDim = getTickDimension('y','width'),
            axisBb = axis[0][0].getBBox();
        axis.append('text')
          .text(d.label)
          .attr({
            'class': 'label',
            y: function(){
              return(d.axis === 'y')? axisBb.height/2: axisBb.height + d3.select(this)[0][0].getBBox().height;
            },
            x: (d.axis === 'x')? axisBb.width/2: -yTickDim,
            transform: (d.axis === 'y')? "rotate(-90 "+(-yTickDim)+","+(axisBb.height/2)+")": ""
          });
      }
    })


  }

  function redraw(){
    axes.call(d3Update, {
        transform: function(d){
          return (typeof d.transform === 'function')? d.transform(): d.transform;
        }
      },
      dur)
      .each(function(d) {
        d.fn(d3.select(this));
      });

    axes.each(function(d){
      var axis = d3.select(this);

      if(d['vertical-label']){
        axis.selectAll(".tick text")
          .attr({
            y: 0,
            x: -10,
            dy: "0.5em",
            transform: "rotate(-60)"
          })
          .style("text-anchor", "end");
      }

      if(d.label){
        var yTickDim = getTickDimension('y','width'),
            axisBb = axis[0][0].getBBox();
        axis.select('text.label')
          .text(d.label)
          .attr({
        //    y: function(){
        //      return(d.axis === 'y')? axisBb.height/2: axisBb.height + d3.select(this)[0][0].getBBox().height;
        //    },
        //    x: (d.axis === 'x')? axisBb.width/2: -yTickDim,
            transform: (d.axis === 'y')? "rotate(-90 "+(-yTickDim)+","+(axisBb.height/2)+")": ""
          });
      }
    });
  }

  function setScales(){

    for(var i in data){
        for(var a in data[i].attrs){
          data[i].fn = data[i].fn[a](data[i].attrs[a]());
        }
    }
  }

  //finds longest tick on axis for placement of axis label
  function getTickDimension(axis, dimension){
    return d3.max(selection.selectAll(".axis."+axis+' .tick')[0],
      function(d,i){
        return this[i].getBBox()[dimension];
      });
  }

  this.update = function(){
    setScales();
    redraw();
  };

  setScales();
  create();
  return this;
}
