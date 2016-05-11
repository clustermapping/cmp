define(['layers/PointLayer'], function(PointLayer) {
  var PieLayer = function(options) {
    if(options)this.init(options);
  };
  PieLayer.prototype = new PointLayer();

  PieLayer.prototype.prep = function() {
    var pie = this.CompileFunc(this.config.pie.fn, this.config.pie.attrs);
    this.config.data = pie( this.plot.data() );
    this.config.dur = this.plot.duration();
    this.config.delay = this.plot.delay();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);

    this.config.elements.forEach(function(elem){
      elem.type =  elem.type || 'path';
      elem.initAttrs = {
        class:elem.type+"-"+this.config.kind,
        opacity: 1e-6
      };
      switch(elem.type){
        case 'path':
          elem.initAttrs.d ={
            fn: d3.svg.arc(),
            attrs:{ innerRadius: 0.1, outerRadius:1 }
          };
          elem.initAttrs = this.CompileAttrs(elem.initAttrs);
          break;
      }
    }, this);
  };

  return PieLayer;
});
