define(['ScaleBase'], function(scaleBase) {

  var ScaleFactory = function(scaleId, options) {
    var scale = new scaleBase(options);
    scale.attrs = {};

    switch (scaleId) {
      case 'x':
        scale.attrs.range = function(data, dataKey, drawWidth, drawHeight, margin){ return [0, (drawWidth - margin.left - margin.right)]; };
        break;
      case 'y':
        scale.attrs.range = function(data, dataKey, drawWidth, drawHeight, margin){ return [(drawHeight - margin.top - margin.bottom),0]; };
        break;
      case 'r':
        scale.attrs.range = function(){ return options.plot.radius(); };
        break;
      case 'fill':
        scale.palette = ["#00f","#f00"];
        scale.attrs.interpolate = function(){return d3.interpolateHcl;};
        scale.attrs.range = function(d,k){return scale.palette;};
        break;
      /*default:
        throw "Attempt to create unregistered scale type '" +scaleId + "' not registered with MythosVis.";*/
    }

    // Scale defaults
    var defaults = {
      key: scaleId,
      scale: d3.scale.linear(),
      format: "",
      attrs:{
        domain: function(data, key){ return d3.extent( data, function(d){ return d[key];});},
      }
    };

    scale.SetOptions(defaults);
    scale.SetOptions(options);
    scale.Compile();
    return scale;
  };

  return ScaleFactory;
});