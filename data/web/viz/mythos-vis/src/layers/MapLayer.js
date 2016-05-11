define(['d3', 'topojson', 'DataLib', 'LayerBase'], function(d3, topojson, DataLib, LayerBase) {
  var lib = new DataLib();

  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };

  MapLayer = function(options) {
    this.init(options);
  };
  MapLayer.prototype = new LayerBase();

  MapLayer.prototype.init = function(options){
    if (options === undefined) {
      options = {};
    }

    this.plot = options.plot;
    this.geoPaths = undefined;
    //Set layers init config
    this.config =  this.mergeRecursive(this.defaults(),options);
    var _this = this;

    this.focusedElement = null;

    if (this.config.geoSource !== undefined) {
      lib.request(this.config.geoSource, function(data) {
        _this.geoPaths = data;
          _this.draw();
      });
    }
  };

  MapLayer.prototype.prep = function() {
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
    this.config.width = this.plot.width();
    this.config.height = this.plot.height();
  };

  MapLayer.prototype.enter = function() {
    var c = this.config;

    c.path = d3.geo.path()
      .projection(c.projection);

    if (this.geoPaths) {
      c.group = c.layerElem.selectAll("path." + c.name + "-item")
        .data(topojson.feature(this.geoPaths, this.geoPaths.objects[c.objectType]).features)
        .enter().append("path")
          .attr("class", function(d) {return c.name + '-item item'; })
          .attr("id", function(d) { return c.name + '-item-' + d.id;})
          .attr("d", c.path);
    }
  };

  MapLayer.prototype.exit = function(){};

  MapLayer.prototype.highlight = function(id) {
    var c = this.config,
        g = c.layerElem,
        ids = (id.forEach ? id : [id]);

    g.selectAll('path.' + c.name + '-item').classed("active", false);
    ids.forEach(function(d) {
      g.selectAll('path#' + c.name + '-item-' + d).classed("active", true);
    });
    g.selectAll("path.active").moveToFront();
  };

  MapLayer.prototype.focus = function(d) {
    var c = this.config,
        centroid = c.projection(d3.geo.centroid(d)),
        data = (c.data && c.data[d.id] !== undefined) ? c.data[d.id] : d;

    data.geo = d;

    this.focusedElement = d;
    this.zoomTo(centroid[0], centroid[1], 3);

    this.trigger('focus', data, this);
  };

  MapLayer.prototype.unFocus = function() {
    this.focusedElement = null;
    
    var width = this.plot.width(),
        height = this.plot.height();

    this.zoomTo(width / 2, height / 2, 1);

    this.trigger('unfocus', this);
  };

  MapLayer.prototype.zoomTo = function(x, y, k) {
    var layers = this.plot.layers();
    for (var i in layers) {
      if (layers[i] instanceof MapLayer) {
        layers[i]._zoomTo(x, y, k);
      }
    }
  };

  MapLayer.prototype._zoomTo = function(x, y, k) {
    var c = this.config,
        width = this.plot.width(),
        height = this.plot.height(),
        dur = this.plot.duration();
    this.zoomX = x;
    this.zoomY = y;
    this.zoomK = k;

    c.layerElem.transition()
      .duration(dur)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + (-x) + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
  };

  return MapLayer;
});
