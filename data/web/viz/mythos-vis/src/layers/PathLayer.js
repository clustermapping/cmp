define(['LayerBase'], function(LayerBase) {
  PathLayer = function(options) {
    this.init(options);
  };
  PathLayer.prototype = new LayerBase();

//  PathLayer.prototype.enter =function(){
//    var c = this.config,
//        layer = this;
//
//    c.group = c.layerElem
//      .selectAll( c.groupType+"."+c.name+"-item")
//      .data(c.elements)
//      .datum(c.data);
//
//    c.group.enter()
//      .append(c.groupType)
//      .attr({class: c.name+"-item"})
//      .attr(c.attrs)
//      .each(function(d,i){
//          var e = c.elements[i],
//              attrs = layer.CompileAttrs(e.attrs),
//              initAttrs = {class:e.type+"-"+c.kind};
//          d3.select(this)
//            .data(c.data)
//            .append(e.type)
//            .attr(attrs)
//            .attr(initAttrs);
//        });
//  };

  PathLayer.prototype.update =function(){
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

  return PathLayer;
});
