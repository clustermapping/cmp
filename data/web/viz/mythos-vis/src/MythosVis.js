define(function (require) {
  'use strict';

  var layerFactory = require('LayerFactory'),
      layerBase = require('LayerBase'),
      scaleFactory = require('ScaleFactory'),
      plotFactory = require('PlotFactory'),
      eventDecorator = require('EventDecorator'),
      processDiction = require('ProcessDiction'),
      dataLoader = require('DataLib');

  return {
    version: '0.0.0',
    LayerFactory: layerFactory,
    LayerBase: layerBase,
    ScaleFactory: scaleFactory,
    PlotFactory: plotFactory,
    EventDecorator: eventDecorator,
    ProcessDiction: processDiction,
    DataLoader: dataLoader,
  };
});
