define(['LayerBase'], function(LayerBase) {
  var InfoLayer = function(options) {
    if(options){
      var defaults = {
        layerCanvas: 'div',
        layerType: 'div',
        groupType: 'div',
        parent: 'root'
      };
      this.mergeRecursive(defaults, options);

      this.init(defaults);
    }
  };
  InfoLayer.prototype = new LayerBase();

  InfoLayer.prototype.prep = function() {
    this.config.data = this.config.dataFN();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
    this.config.initStyle = {opacity: 1e-6};
  };

  InfoLayer.prototype.enter = function() {
    var c = this.config;
    var layer = this;

    c.group = c.layerElem
      .selectAll( c.groupType+"."+c.name+"-item")
      .data(c.data, function(d){return c.data.indexOf(d);});

    c.group.enter()
      .append(c.groupType)
      .attr({class: c.name+"-item item"})
      .classed('enter', true)
      .each(function(d,i){
          layer.appendElements(d3.select(this), c.elements);
        });
  };

  InfoLayer.prototype.exit = function() {
    var c = this.config;
    c.group.exit()
      .classed('exit', true)
      .interrupt()
      .transition()
      .duration(c.duration)
      .style(c.initStyle)
      .each('end', function() {
        d3.select(this).remove();
      });
  };

  InfoLayer.prototype.update = function() {
    var c = this.config;

    c.group
      .each(function(d){
        var item = d3.select(this);
        if(item.classed('enter')){
          item.classed('enter', false)
            .style(c.initStyle)
            .attr(c.attrs);
        }
        if(!item.classed('exit')){
          item
            .transition()
            .duration(c.duration)
            .style({opacity:1})
            .attr(c.attrs);
        }
      });
  };

  return InfoLayer;
});
