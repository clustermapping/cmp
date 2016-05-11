define(['d3', 'topojson', 'DataLib', 'LayerBase', 'layers/MapLayer'], function(d3, topojson, DataLib, LayerBase, MapLayer) {
  var lib = new DataLib();

  ChoroplethMapLayer = function(options) {
    this.init(options);
  };
  ChoroplethMapLayer.prototype = new MapLayer();

  ChoroplethMapLayer.prototype.init = function(options){
    if (options === undefined) {
      options = {};
    }

    this.plot = options.plot;

    this.geoPaths = undefined;
    //Set layers init config
    this.config =  this.mergeRecursive(this.defaults(),options);
    var _this = this;

    if (this.config.dataMapping === undefined) {
      throw "ChoroplethMapLayer: Data mapping config not defined";
    }

    this.focusedElement = null;

    lib.request(this.config.geoSource, function(data) {
      _this.geoPaths = data;
      _this.draw();
    });
  };

  ChoroplethMapLayer.prototype.prep = function() {
    this.config.data = this.plot.mapData();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
    this.config.width = this.plot.width();
    this.config.height = this.plot.height();
  };

  ChoroplethMapLayer.prototype.enter = function() {
    var c = this.config;

    c.path = d3.geo.path()
      .projection(c.projection);

    if (this.geoPaths) {
      c.group = c.layerElem.selectAll("path." + c.name + "-item")
        .data(topojson.feature(this.geoPaths, this.geoPaths.objects[c.objectType]).features);

      c.group.enter().append("path")
          .attr("class", function(d) {return c.name + '-item item'; })
          .attr("id", function(d) { return c.name + '-item-' + d.id;})
          .attr("d", c.path);

      c.layerElem.selectAll("path." + c.name + "-item")
        .attr("style", function(d) {
            var styleAttributes = c.dataStyling(d, c.data, c.scales);
            var style = '';

            for (var i in styleAttributes) {
              style += i + ": " + styleAttributes[i] + "; ";
            }
            return style;
          });
    }
  };

  ChoroplethMapLayer.prototype.exit = function(){};

  ChoroplethMapLayer.prototype.focus = function(d) {
    var c = this.config,
        data = this.config.dataMapping(d, this.config.data, this.config.scales);

    if (data === undefined) {
      data = d;
    }

    var bounds = this.config.path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .3 / Math.max(dx / c.width, dy / c.height),
      translate = [x, y];

    data.geo = d;

    this.focusedElement = d;
    this.zoomTo(translate[0], translate[1], scale);

    this.trigger('focus', data, this);
  };

  ChoroplethMapLayer.prototype.unFocus = function() {
    this.focusedElement = null;
    
    var width = this.plot.width(),
        height = this.plot.height();

    this.zoomTo(width / 2, height / 2, 1);

    this.trigger('unfocus', this);
  };

  return ChoroplethMapLayer;
});
