define(['d3',
        'layers/SimpleLayer',
        'layers/PathLayer',
        'layers/PieLayer',
        'layers/PointLayer',
        'layers/AxisLayer',
        'layers/MapLayer',
        'layers/ChoroplethMapLayer',
        'layers/BarLayer',
        'layers/GridLayer',
        'layers/InfoLayer',
        'EventDecorator'],
      function(
        d3,
        SimpleLayer,
        PathLayer,
        PieLayer,
        PointLayer,
        AxisLayer,
        MapLayer,
        ChoroplethMapLayer,
        BarLayer,
        GridLayer,
        InfoLayer,
        EventDecorator
      ) {

  var layerRegistry = d3.map();
      layerRegistry.set('simple', SimpleLayer);
      layerRegistry.set('path', PathLayer);
      layerRegistry.set('pie', PieLayer);
      layerRegistry.set('point', PointLayer);
      layerRegistry.set('axis', AxisLayer);
      layerRegistry.set('grid', GridLayer);
      layerRegistry.set('bar', BarLayer);
      layerRegistry.set('map', MapLayer);
      layerRegistry.set('choroplethMap', ChoroplethMapLayer);
      layerRegistry.set('info', InfoLayer);

  LayerFactory = function(layerId, options) {
    var layer, layerObject;

    if (!layerRegistry.has(layerId)) {
      throw "Attempt to create unregistered layer type '" +layerId + "' not registered with MythosVis.";
    }

    layerObject = layerRegistry.get(layerId);
    layer = new layerObject(options);

    layer = EventDecorator(layer);
    return layer;
  };

  LayerFactory.registeredPlugins = function() {
    return layerRegistry.keys();
  };

  LayerFactory.addPlugin = function(name, layer) {
    layerRegistry.set(name, layer);
  };

  return LayerFactory;
});
