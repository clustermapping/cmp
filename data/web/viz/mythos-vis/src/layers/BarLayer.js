 define(['layers/PointLayer'], function(layerBase) {
  var BarLayer = function(options) {
    if(options)this.init(options);
  };
  BarLayer.prototype = new PointLayer();

  BarLayer.prototype.prep = function() {
    this.config.data = this.plot.data();
    this.config.dur = this.plot.duration();
    this.config.delay = this.plot.delay();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);

    this.config.elements.forEach(function(elem){
      elem.type =  elem.type || 'rect';
      elem.initAttrs = {};

      if (this.config.scales.get('x')) {
        var x = this.config.scales.get('x').scale(0);
        switch(elem.type){
          case 'rect':
            elem.initAttrs.x = x;
            elem.initAttrs.width = 0;
            break;
          case 'line':
            elem.initAttrs.x1 = elem.initAttrs.x2 = x;
            break;
          case 'circle':
            elem.initAttrs.cx = x;
            elem.initAttrs.r = this.plot.radius.min();
            elem.initAttrs.opacity = 1e-6;
            break;
          case 'path':
            break;
        }
      } else if (this.config.scales.get('y')) {
        var y = this.config.scales.get('y').scale(0);
        switch(elem.type){
          case 'rect':
            elem.initAttrs.y = y;
            elem.initAttrs.height = 0;
            break;
          case 'line':
            elem.initAttrs.y1 = elem.initAttrs.y2 = y;
            break;
          case 'circle':
            elem.initAttrs.cy = y;
            elem.initAttrs.r = this.plot.radius.min();
            elem.initAttrs.opacity = 1e-6;
            break;
          case 'path':
            break;
        }
      }
    }, this);
  };

  return BarLayer;
});
