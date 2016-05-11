define(['d3', 'LayerFactory', 'ScaleFactory'], function(d3, LayerFactory, ScaleFactory) {
  var Plot = function(selection, data) {
    this._data = data;
    this._selection = selection;

    // Layer objects that compromise the display
    this._layers = d3.map();

    // D3 scales that help determine rendering. See https://github.com/mbostock/d3/wiki/Scales.
    this._scales = d3.map();

    // Various SVG/DOM elements for the plot.
    this._elements = d3.map();

    // Sizing variables
    this._sizeRatio = 1;
    this._width = null;  // By default svg will be set to width of selection
    this._height = null; // If null svg height will set by ratio var
    this._autoSize = 1;  // If true will resize with selection

    this._margin = {top: 10, right: 10, bottom: 70, left: 70};

    return this;
    return this;
  };

  Plot.prototype.layers = function() { return this._layers; };

  Plot.prototype.layer = function(name, options) {
    var layer;

    switch(arguments.length) {
      case 0:
        return this._layers;
      case 1:
        layer = this._layers.get(name);
        if (layer) {
          return layer;
        }
        throw ("MythosVis: Attempting to load unregistered layer " + name);
      case 2:
        options.plot = this;
        if (options.kind === undefined) {
          throw ("MythosVis: Attempting to create a layer without a layer type, use options.kind to create a layer type.");
        }
        layer = LayerFactory(options.kind, options);
        layer.name = name;
        this._layers.set(name, layer);
        break;
    }
    return this;
  };

  Plot.prototype.scales = function() {return this._scales; };

  Plot.prototype.scale = function(name, options, value) {
    var s = this._scales.get(name) || this._scales.set(name, ScaleFactory(name, {plot: this}));
    switch(arguments.length){
      case 0:
        return  this._scales;
      case 1:
        return s;
      case 2:
        if(typeof options === 'object'){
          s.SetOptions(options);
        }else{
          return s[options] ||  s.attrs[options];
        }
        break;
      default:
        if(s.hasOwnProperty(options)) s[options] = value;
        else s.attrs[options] = value;
    }
    return this;
  };

  Plot.prototype.init = function() {
    var _this = this;

    setupScales();

    var root = d3.select(this._selection)
      .append('div')
      .attr({class: 'mythos-plot'});

    this._elements.set('root', root);

    if (this._autoSize) {
      this.resize();
    }

    root
      .datum(this._data)
      .call(setupChart);

    setupLayers();
    return this;

    function setupChart(selection) {
      var svg = selection.append("svg")
            .attr({width: _this._width, height: _this._height});
      _this._elements.set("svg", svg);

      var clip = svg.append("clipPath")
        .attr({id: "plot-clip"})
        .append("rect")
        .attr({
          width: (_this._width - _this._margin.left - _this._margin.right),
          height: (_this._height - _this._margin.top - _this._margin.bottom) });
      _this._elements.set("clip", clip);

      // @TODO: Original had a translation for axis/margins.
      var chart = svg.append("g")
        .attr({transform: "translate(" + _this._margin.left + "," + _this._margin.top + ")"});
      _this._elements.set("chart", chart);

      // @TODO: Tmp.
      _this._elements.set('parent', 'svg');
    }

    function setupScales() {
      var sKeys = ['x','y','r','fill'];
      var options = {plot: _this};
      for(var i in sKeys){
        _this.scale(sKeys[i]);
      }
    }

    function setupLayers() {
      var plot = _this,
          chart = plot._elements.get("chart"),
          layers = plot._layers;

      layers.forEach(function(key, layer) {
        layer.append();
      });
    }
  };

  Plot.prototype.data = function(newData) {
    if (newData !== undefined) {
      this._data = newData;
      return this;
    }
    return this._data;
  };

  Plot.prototype.update = function() {

  };

  Plot.prototype.width = function(newWidth) {
    if (newWidth !== undefined) {
      this._autoSize = false;
      this._width = newWidth;
      return this;
    }
    return this._width;
  };
  Plot.prototype.height = function(newHeight) {
    if (newHeight !== undefined) {
      this._autoSize = false;
      this._height = newHeight;
      return this;
    }
    return this._height;
  };

  Plot.prototype.resize = function() {
    this._width = d3.select(this._selection)[0][0].offsetWidth;
    this._height = this._width / this._sizeRatio;
    return this;
  };

  // Stub functions.
  // @TODO: I don't want to keep the elements exposed like this. Should have
  //    individual methods for specifics that make sense, like svgElement, chartElement, etc.
  Plot.prototype.elements = function() {return this._elements; };
  Plot.prototype.element = function(elem, value) {
    if (!arguments.length) return this._elements;
    if (arguments.length === 1) return this._elements.get(elem);
    this._elements.set(elem, value);
    return this;
  };

  // @TODO: Radius definitely doesn't belong here. Probably the rest as well.
  Plot.prototype.drawWidth = function() {return this._width;};
  Plot.prototype.drawHeight = function() {return this._height;};
  Plot.prototype.margin = function() {return this._margin;};
  Plot.prototype.radius = function() {return [0, 0];};
  Plot.prototype.duration = function() {return 500;};

  return Plot;
});
