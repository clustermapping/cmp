define(['Plot'], function(Plot) {
  var PlotFactory = function(selection, data) {
    return new Plot(selection, data);
  };

  return PlotFactory;
});
