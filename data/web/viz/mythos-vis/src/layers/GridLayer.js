define(['LayerBase'], function(layerBase) {
  var GridLayer = function(options) {
    if(options)this.init(options);
  };
  GridLayer.prototype = new AxisLayer();

  GridLayer.prototype.prep = function() {
    var layer = this;
    this.config.data = this.config.elements;
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
    this.config.dur = this.plot.duration();
    this.config.delay = this.plot.delay();

    this.config.elements.forEach(function(elem){
      var s = this.config.scales.get(elem.type);
      elem.axis.attrs.scale = s.scale;
      elem.axis.attrs.tickFormat = '';
      elem.label = null;

      switch(elem.type){
        case 'x':
          elem.axis.attrs.tickSize = layer.plot.drawHeight();
          break;
        case 'y':
          elem.axis.attrs.innerTickSize = layer.plot.drawWidth();
          break;
      }
    }, this);
  };

  return GridLayer;
});
