function d3Legend(selection){
  var padding = {top:10, right:50, bottom:10, left:10};

  var legend = selection.append('g')
    .attr({ class: 'legend', x:0, y:0 })
    .datum(function(d){
      d = d || {};
      d.open = d.open || true;
      d.fn = d.fn ||{};
      return d;
    })
    .on('click', function(d){
      if(d.open && typeof d.fn.close === 'function'){
          d.fn.close(this);
      }else if(!d.open && typeof d.fn.open === 'function'){
        d.fn.open(this);
      }
      d.open = !d.open;
    }).append('g').attr({class:'wrapper'});

  this.drawLegend = function (){
    legend.select('.wrapper')
      .remove();

    legend.append('g')
      .attr({class:'wrapper'})
      .append('rect')
      .attr({class:'legend-bkg', x:0, y:0,width: 0,height: 0});

    /*legend.select('.wrapper')
      .append('text')
      .text('Legend')
      .attr({
        class: 'title label',
        y: function(){return d3.select(this)[0][0].getBBox().height ;},
        x: padding.left
      });*/
    legend.select('.wrapper')
      .selectAll('g.key')
      .data(legend.data()[0].keys)
      .enter()
      .append('g')
      .attr({class: function(d){return d.type+'-key key';}})
      .each(addLegendKey);


    legend.select('.legend-bkg').attr({
      width: legend[0][0].getBBox().width + padding.right,
      height: legend[0][0].getBBox().height+ padding.bottom
    });

    legend.datum(function(d){
      d.open = false;
      return d;
    });
  };

  function addLegendKey(d){
    var key = d3.select(this),
        lBBox = legend[0][0].getBBox();

    d.fn = {};

    key.attr({transform: "translate("+(padding.left)+", " + (lBBox.height+ padding.top*2) + ")"})
      .append('text')
      .attr({class: 'title label'})
      .text(d.label);

    switch(d.type){
      case 'radius':
        key.call(radiusKey, d);
        break;
      case 'fill':
        key.call(fillKey, d);
        break;
      case 'color':
        key.call(colorKey, d);
        break;
    }
  }

  function radiusKey(key, d){
    var maxR = d.scale( d3.max( d.scale.domain() )),
        minR = d.scale( d3.min( d.scale.domain() )),
        scaleOff = [(maxR),  (maxR+padding.top) ];

    var g = key.append('g')
      .attr({
        class:'svg-group',
        transform: "translate("+maxR+", " + scaleOff[1] + ")"
      });

    g.append('circle')
      .attr({class: 'max', 'r': maxR});
    g.append('circle')
      .attr({class: 'min', 'r': minR});

    var scale = d3.scale.linear()
      .rangeRound(d.scale.range());


    key.call(makeAxis, d, scale, scaleOff);
  }

  function fillKey(key, d){
    var colors = d.scale.range(),
        step = 100/(colors.length - 1),
        scaleOff = [0,(15)],
        lBBox = legend[0][0].getBBox();


    var gradient = legend.append("svg:defs")
      .append("svg:linearGradient")
      .attr({id: "gradient", x1: "0%", y1: "0%", x2: "100%", y2: "0%", spreadMethod: "pad"});

    for(var i in colors){
      gradient.append("svg:stop")
      .attr({
        offset: (step * i)+"%",
        "stop-color": colors[i],
        "stop-opacity": 1
      });
    }

    var g = key.append('g')
      .attr({
        class:'svg-group',
        transform: "translate(0, " + padding.top + ")"
      });

    g.append('rect')
      .attr({'width': (lBBox.width+padding.left+padding.right) , 'height': scaleOff[1] })
      .style("fill", "url(#gradient)");

    var scale = d3.scale.linear()
      .rangeRound([0, (lBBox.width+padding.left+padding.right)]);

    scaleOff[1] += padding.top;
    key.call(makeAxis, d, scale, scaleOff);
  }

  function colorKey(key, d){
    var elemW = 10,
        elemH = 10,
        scaleOff = [0,  padding.top];
    key.select('text')
      .attr({transform: "translate("+(padding.left + elemW)+", " + (padding.top) + ")"})

    var g = key.append('g')
      .attr({class:'svg-group'});

    var elem = g.append(d.element)
      .attr(d.attr);

    switch(d.element){
      case 'line':
        elem.attr({
          x1: 0,
          x2: elemW,
          y1: elemH/2,
          y2: elemH/2
        });
        break;
      case 'rect':
        elem.attr({
          width: elemW,
          height: elemH,
        });
      case 'circle':
        elem.attr({
          cx: elemW/2,
          cy: elemH/2,
          r: elemW/2
        });
        break;
    }

  }

  function makeAxis(key, d, scale, scaleOff){
    scale.domain(d.scale.domain()).nice();

    var axis = d3.svg.axis()
      .scale(scale)
      .orient('bottom')
      .ticks(2)
      .tickValues(d.scale.domain());

    key.append("g")
      .attr({
        class:"axis",
        transform: "translate("+scaleOff[0]+", " + scaleOff[1] + ")"
      })
      .call(axis);

    key.selectAll(".tick text")
      .style("text-anchor", "end");

    key.select(".tick text")
      .style("text-anchor", 'start');
  }

  legend.call(this.drawLegend);
  return legend;
}
