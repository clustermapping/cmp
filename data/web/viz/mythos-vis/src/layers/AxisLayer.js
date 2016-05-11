define('layers/AxisLayer',['LayerBase'], function(LayerBase) {
  AxisLayer = function(options) {
    if(options)this.init(options);
  };
  AxisLayer.prototype = new LayerBase();

  AxisLayer.prototype.prep = function() {
    this.config.data = this.config.elements;
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
    this.config.dur = this.plot.duration();
    //this.config.nameSafe = this.makeSafeForCSS(this.config.name);

    this.config.elements.forEach(function(elem){
      var s = this.config.scales.get(elem.type);
      elem.scale = s.scale;
      elem.axis.attrs.scale = elem.scale;
      if(s.format != '') elem.axis.attrs.tickFormat = d3.format(s.format);
      elem.label = elem.label || s.label;
    }, this);
  };

  AxisLayer.prototype.enter = function() {
    var c = this.config,
        layer = this;

    c.group = c.layerElem
      .selectAll( c.groupType+"."+c.name+"-item")
      .data(c.data, function(d){return c.data.indexOf(d);});

    c.group.enter()
      .append(c.groupType)
      .attr({class: c.name+"-item"})
      .attr(c.attrs)
      .each(function(d,i){
        var elem = d3.select(this);
        elem.attr(layer.CompileAttrs(d.attrs));

        var axis = elem.append('g')
          .attr({class: d.type+' axis'});

        if(d.label){
          elem
            .append('text')
            .attr({class: 'axis-label label'});
        }
        layer.compileAxis(d.axis);
        axis.call(d.axis.fn);
      });
  };

  AxisLayer.prototype.update = function() {
    var c = this.config,
        layer = this;
    //c.group.call(c.fn.update);

    c.group.each(function(d,i){
      var elem = d3.select(this),
          attrs = layer.CompileAttrs(d.attrs),
          axis = elem.select("g.axis"),
          plot = layer.plot,
          pWidth = plot.drawWidth() - plot.margin.left() - plot.margin.right(),
          pHeight = plot.drawHeight() - plot.margin.top() - plot.margin.bottom();
      layer.compileAxis(d.axis);

      elem
        .interrupt()
        .transition()
        .duration(c.dur)
        .attr(attrs)
          .select("g.axis")
          .call(d.axis.fn)
          .each('end',function(){
            if(d.label){
              var bb = axis[0][0].getBBox();
              elem.select('text.label')
                .text(d.label)
                .attr({
                  // we'll see
                    'y': function(){
                      return (d.type === 'y')? pHeight/2 : bb.height + 15;
                    },
                    'x': function(){
                      return (d.type === 'x')? pWidth/2: bb.width - 10;
                    },
                    'transform':  function (){
                      return (d.type === 'y')? "translate(" + (-(pHeight/2) - 50) + "," +  pHeight/2 + ") rotate(-90)" : "";
                    }
                  });
            }
          });

      if(d['vertical-tick-label']){
        elem.selectAll(".tick text")
          .attr({
            dy: ".35em",
            transform: "rotate(-65,0,9)"
          })
          .style("text-anchor", "end");
      }

      if(d['wrap-tick-label']){
        var w = (d.type == 'x')? d.scale.rangeBand() : c.plot.margin().left -9;
        elem.selectAll(".tick text")
          .call(layer.wrap, w, d.type);
      }
    });
  };

  AxisLayer.prototype.compileAxis = function(a) {
    function propVal(prop, propV){
      return (typeof propV === 'function'&& prop !== 'scale'&& prop !== 'tickFormat') ? propV() : propV;
    }
    a.fn = a.fn || axis.svg.axis();
    for(var attr in a.attrs){
      a.fn = a.fn[attr]( propVal(attr, a.attrs[attr]) );
    }
  };

  AxisLayer.prototype.wrap = function(text, width, axis) {
    axis = axis || 'x';

    text.each(function(d) {

        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr('y'),
            x = text.attr('x'),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y )
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
                .attr("x",x)
                .attr("y", y)
                .attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
    });
  };

  return AxisLayer;
});