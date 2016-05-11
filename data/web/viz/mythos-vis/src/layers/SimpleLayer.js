define(['d3', 'LayerBase'], function(d3, LayerBase) {
  var SimpleLayer = function(options) {
    this.init(options);
  };
  SimpleLayer.prototype = new LayerBase();

  var NoOp = function _no_op() {};

  SimpleLayer.prototype.append = function() {
    this.config.parent = this.plot.element(this.config.parent);
    this.config.layerElem = this.config.parent.append(this.config.layerType)
      .attr({
        class: "layer " + this.config.kind + " layer-" + this.config.name,
          "clip-path": this.config.clip ? "url(#plot-clip)" : null
      });

    if (this.config.append !== undefined) {
      this.config.append(this.config.layerElem);
    }
  };

  SimpleLayer.prototype.enter = NoOp;
  SimpleLayer.prototype.exit = NoOp;
  SimpleLayer.prototype.update = function() {
    if (this.config.draw !== undefined) {
      this.config.draw(this.config.layerElem);
    }
  };

  return SimpleLayer;
});
