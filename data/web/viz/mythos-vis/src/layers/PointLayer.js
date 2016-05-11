define(['LayerBase'], function(LayerBase) {
  PointLayer = function(options) {
    if(options)this.init(options);
  };
  PointLayer.prototype = new LayerBase();

  PointLayer.prototype.prep = function() {
    this.config.data = this.plot.data();
    this.config.dur = this.plot.duration();
    this.config.delay = this.plot.delay();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);

    this.config.elements.forEach(function(elem){
      elem.type =  elem.type || 'circle';
      elem.initAttrs = {
        class:elem.type+"-"+this.config.kind,
        opacity: 1e-6
      };
      if(elem.type == 'circle') elem.initAttrs.r = this.plot.radius.min();
    }, this);
  };

  PointLayer.prototype.update = function() {
    var c = this.config;

    c.elements.forEach(function(e){
      var attrs = this.CompileAttrs(e.attrs),
          elem;

      if(e.static) initAttrs = {};
      c.group
        .selectAll(e.type+".enter")
        .classed('enter',false)
        .attr(attrs)
        .attr(e.initAttrs)
        .text((e.type == 'text'? e.text : null) );

      elem = c.group.selectAll(e.type);

      elem
        .interrupt()
        .transition()
        .delay(c.delay)
        .duration(c.dur)
          .attr("opacity", 1)
          .attr(attrs);

      c.layerElem
        .selectAll( c.groupType+"."+c.name+"-item.exit")
        .selectAll(e.type)
          .interrupt()
          .transition()
          .duration(c.dur)
          .attr(e.initAttrs)
          .remove();
    }, this);
  };

  return PointLayer;
});
