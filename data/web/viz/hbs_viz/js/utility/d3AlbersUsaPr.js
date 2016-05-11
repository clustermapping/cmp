// A modified d3.geo.albersUsaPr to include Puerto Rico.
function d3AlbersUsaPr() {
  // ε = 1e-6
  var ε = 0,
      lower48Offset = [0, 0],
      lower48Size = [.91, .5],
      alaskaScale = .35,
      alaskaOffset = [-.39, .21],
      alaskaSize = [.22, .13],
      hawaiiOffset = [-.47, .13],
      hawaiiSize = [.12, .08],
      prOffset = [.3, .25],
      prSize = [.065, .04];
 
  var lower48 = d3.geo.albers();
 
  var alaska = d3.geo.conicEqualArea()
      .rotate([159, -4])
      .center([-2, 58.5])
      .parallels([55, 65]);
 
  var hawaii = d3.geo.conicEqualArea()
      .rotate([158, -.5])
      .center([.5, 19.9])
      .parallels([8, 18]);
 
  var puertoRico = d3.geo.conicEqualArea()
      .rotate([66.5, -0.3])
      .center([0, 18])
      .parallels([8, 18]);
 
  var point,
      pointStream = {point: function(x, y) { point = [x, y]; }},
      lower48Point,
      alaskaPoint,
      hawaiiPoint,
      puertoRicoPoint;
 
  function albersUsaPr(coordinates) {
    var x = coordinates[0], y = coordinates[1];
    point = null;
    (lower48Point(x, y), point)
        || (alaskaPoint(x, y), point)
        || (hawaiiPoint(x, y), point)
        || (puertoRicoPoint(x, y), point);
    return point;
  }
 
  albersUsaPr.invert = function(coordinates) {
    var k = lower48.scale(),
        t = lower48.translate(),
        x = (coordinates[0] - t[0]) / k,
        y = (coordinates[1] - t[1]) / k;
    return (y >= .120 && y < .234 && x >= -.425 && x < -.214 ? alaska
        : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii
        : y >= .204 && y < .234 && x >= .320 && x < .380 ? puertoRico
        : lower48).invert(coordinates);
  };
 
  // A naïve multi-projection stream.
  // The projections must have mutually exclusive clip regions on the sphere,
  // as this will avoid emitting interleaving lines and polygons.
  albersUsaPr.stream = function(stream) {
    var ps = [lower48, alaska, hawaii, puertoRico],
        streams = ps.map(function(d) { return d.stream(stream);}),
        build = function(name) { return function() {
            var a = arguments;
            streams.forEach(function(d) {
              d[name].apply(d, a);
            });
          }
        },
        toBuild = ['point', 'sphere', 'lineStart', 'lineEnd', 'polygonStart', 'polygonEnd']
        o = {};

    toBuild.forEach(function(d) {
      o[d] = build(d);
    });

    return o;
  };
 
  albersUsaPr.precision = function(_) {
    if (!arguments.length) return lower48.precision();
    lower48.precision(_);
    alaska.precision(_);
    hawaii.precision(_);
    puertoRico.precision(_);
    return albersUsaPr;
  };
 
  albersUsaPr.scale = function(_) {
    if (!arguments.length) return lower48.scale();
    lower48.scale(_);
    alaska.scale(_ * alaskaScale);
    hawaii.scale(_);
    puertoRico.scale(_);
    return albersUsaPr.translate(lower48.translate());
  };
 
  albersUsaPr.translate = function(_) {
    if (!arguments.length) return lower48.translate();
    var k = lower48.scale(), x = +_[0], y = +_[1];
    function _scale(obj, of, sz) {
      return obj
              .translate([x + (of[0] * k), y + (of[1] * k)])
              .clipExtent([[x + (of[0] - sz[0]/2) * k + ε,  
                            y + (of[1] - sz[1]/2) * k + ε],
                           [x + (of[0] + sz[0]/2) * k + ε,  
                            y + (of[1] + sz[1]/2) * k + ε]])
              .stream(pointStream).point;
    } 

    lower48Point = _scale(lower48, lower48Offset, lower48Size);
    alaskaPoint = _scale(alaska, alaskaOffset, alaskaSize);
    hawaiiPoint = _scale(hawaii, hawaiiOffset, hawaiiSize);
    puertoRicoPoint = _scale(puertoRico, prOffset, prSize);
 
    return albersUsaPr;
  };

  albersUsaPr.baseProjection = function() {
    return d3.geo.albers().translate(lower48.translate());
  };

  albersUsaPr.clips = function() { return [alaska.clipExtent(), hawaii.clipExtent(), puertoRico.clipExtent()]; };
 
  return albersUsaPr.scale(1070);
}
