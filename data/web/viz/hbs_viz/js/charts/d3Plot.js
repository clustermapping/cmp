function d3Plot(){
  var width = 960,
      height = 500,
      dur = 750,
      delay = 0,
      scaleFactor = 1,
      margin = {top: 10, right: 10, bottom: 70, left: 70},
      maxRadiusRatio = 0.1,
      maxRadius = Math.min(width, height)* maxRadiusRatio,
      minRadius = 5,
      autoSize = true,
      drawWidth = width,
      drawHeight = height,

      behaviors = d3.map(),
      scales = d3.map(),
      data = d3.map(),
      layers = [],
      zoom,
      zoomX,
      zoomY;

  //SVGs & etc.
  //=======
  var selection,
      svg,
      clip,
      chart,
      circles,
      guides,
      axes,
      title,
      axesLabels,
      zeroXAxis,
      zeroYAxis;



  function _plot_scaledAttrs(attrz){
    var items = d3.map(attrz).entries(),
        attrs ={};
    items.forEach(function(a) {
      var iScale = scales.get(a.value);
      attrs[a.key] = scales.has(a.value) ? function(d) {return iScale.scale(d[iScale.key]);} : d3.functor(a.value);
    });
    return attrs;
  }

  function _plot_updateScales(){
    scales.forEach(function(_k, v) {
      var s = v.scale;
      var dataKey = v.key;
      for (var attr in v.attrs) {
        if (!v.attrs.hasOwnProperty(attr)) continue;
        var val = v.attrs[attr];
        if (typeof val === 'function') val = val(data, dataKey, drawWidth, drawHeight, margin);
        s[attr](val);
        if (val.hasOwnProperty && val.args) {
          s[attr].apply(null, val.args);
        } else {
          s[attr](val);
        }
      }
    });
  }

  function _plot_setupChart(sel) {
    if (autoSize) {
      scaleFactor = sel[0][0].offsetWidth/width;
      _plot_resize();
    }

    svg = sel.append("svg")
      .attr({class: 'd3-plot', width: drawWidth, height: drawHeight});

    clip = svg.append("clipPath")
      .attr({id: "plot-clip"})
      .append("rect")
        .attr({'width': drawWidth - margin.left - margin.right, 'height': drawHeight - margin.top - margin.bottom});

    chart = svg.append("g")
      //Offsets to take axis/margins into account
      .attr({transform: "translate(" + margin.left + "," + margin.top + ")"});

    layers.forEach(function(layer) {
      chart.append("g")
        .attr({
          class: "layer " + layer.kind + " layer-" + layer.name,
          "clip-path": layer.clip ? "url(#plot-clip)" : null
        });
    });
  }

  function _plot_resize() {

    drawWidth = width * scaleFactor;
    drawHeight = height * scaleFactor;
    maxRadius = Math.min(width, height)*maxRadiusRatio;
    _plot_updateScales();
  }

  function _plot_drawChart() {
    svg.attr("width", drawWidth)
      .attr("height", drawHeight);

    layers.forEach(function(layer) {
      if (!layer.enabled) return;

      switch (layer.kind) {
        case "bar":
        case "point":
          _plot_drawPoint(layer);
          break;
        case "grid":
        case "axis":
          _plot_drawAxis(layer);
          break;
        case "guide":
          _plot_drawGuide(layer);
          break;
        case "markers":
          break;
        case "icons":
          break;
        default:
          layer(svg, g);
      }
    });
  }

  function _plot_drawPoint(layer) {
    var tData = layer.data|| data.values(),
        g;

    g = chart.select("g.layer-" + layer.name)
      .selectAll( "g."+layer.name+"-item")
      .data(tData, function(d){
        return tData.indexOf(d);
      });

    g.enter()
      .append('g')
      .attr({class: layer.name+"-item"})
      .each(function(d,i){
          var group = d3.select(this);
          layer.elements.forEach(function(e){ group.append(e.type).attr({class:'enter'});});
        });

    g.exit()
      .classed('exit', true)
      .interrupt()
      .transition()
      .duration(dur)
        .remove();

    layer.elements.forEach(function(e){
      var type = e.type || 'circle',
          attrs = _plot_scaledAttrs(e.attrs),
          initAttrs = {class:e.type+"-"+layer.kind},
          elem;

      switch(layer.kind){
        case 'point':
          initAttrs.opacity = 1e-6;
          if(type == 'circle') initAttrs.r = minRadius;
          break;
        case 'bar':
          var y = scales.get('y').scale(0);
          switch(type){
            case 'rect':
              initAttrs.y = y;
              initAttrs.height = 0;
              break;
            case 'line':
              initAttrs.y1 = initAttrs.y2 = y;
              break;
          }
          break;
      }

      g.selectAll(type+".enter")
        .classed('enter',false)
        .attr(attrs)
        .attr(initAttrs)
        .text((type == 'text'? e.text : null) );

      elem = g.selectAll(type);

      elem
        .interrupt()
        .transition()
        .delay(delay)
        .duration(dur)
          .attr("opacity", 1)
          .attr(attrs);

      chart.select("g.layer-" + layer.name)
        .selectAll( "g."+layer.name+"-item.exit")
        .selectAll(type)
          .interrupt()
          .transition()
          .duration(dur)
          .attr(initAttrs)
          .remove();
    });

    if (layer.selectable) {
      for(var b in layer.behaviors){
        g.on(b, layer.behaviors[b]);
      }
      //g.call(behaviors.get('hover'));
    }
  }

  function _plot_drawAxis(layer) {
    layer.axes.forEach(function(elem){
      elem.props.scale = scales.get(elem.type).scale;
    });

    g = chart.select("g.layer-" + layer.name)
      .selectAll( "g."+layer.name+"-item")
      .data(layer.axes, function(d){
        return layer.axes.indexOf(d);
      });

    g.enter()
      .append('g')
      .attr({class: function(d){return layer.name+"-item axis-"+d.type;} })
      .call(layer.fn)
      .each(function(d){
        var elem = d3.select(this);
        d3.select(this)
          .attr(_plot_scaledAttrs(d.attrs || {}));
      });

    g.call(layer.fn.update);
  }

  function _plot_drawGuide(layer) {
    g = chart.select("g.layer-" + layer.name)
      .selectAll( "g."+layer.name+"-item")
      .data(layer.elements, function(d){
          return layer.elements.indexOf(d);
        });

    g.enter()
      .append('g')
      .attr({class:function(d){return layer.name+"-item "+d.type;} })
      .each(function(d,i){
          var attrs = _plot_scaledAttrs(d.attrs),
              textAttrs = {},
              group = d3.select(this);

          if(d.label){
            group.append('text')
              .classed('enter', true)
              .text(d.label);
          }

          if(d.type == 'line') setVal(d);
          attrs = elemAttrs(attrs, d);
          textAttrs = elemTextAttrs(attrs, d);

          group.append(d.type)
            .attr(attrs)
            .attr({
              class: function(){return d.type+'-guide';},
              opacity: 1e-6
            })
            .classed('enter',true);

          group.select('text')
            .attr(textAttrs);
        });

    g.each(function(d, i){
      var attrs = _plot_scaledAttrs(d.attrs),
          textAttrs = {},
          group =  d3.select(this);

      if(d.type == 'line') setVal(d);
      attrs = elemAttrs(attrs, d);
      textAttrs = elemTextAttrs(attrs, d);

      group.select(d.type)
        .interrupt()
        .transition()
        .delay(delay)
        .duration(dur)
          .attr({opacity: 1})
          .attr(attrs);

      group.select('text')
        .interrupt()
        .transition()
        .delay(delay)
        .duration(dur)
          .attr(textAttrs);
    });

    g.exit()
      .classed('exit', true)
      .interrupt()
      .transition()
      .duration(dur)
        .attr({opacity: 1e-6})
        .remove();

    function elemTextAttrs(attrs, d){
      switch(d.type){
        case 'line':
          return  lineTextAttrs(attrs, d);
        case 'rect':
          return rectTextAttrs(attrs, d);
      }
    }

    function elemAttrs(attrs, d){
      switch(d.type){
        case 'line':
          return  lineAttrs(attrs, d);
        case 'rect':
          return rectAttrs(attrs, d);
      }
    }

    function setVal (d){
      var s = scales.get(d.axis);
      d[s.key] = _plot_fVal(d.value, d);
    }
    function lineAttrs (attrs, d, i){
      var key = (d.axis == 'x')?'y': 'x',
          s = scales.get(key),
          range = s.scale.range();
      attrs[(key+1)] = range[0];
      attrs[(key+2)] = range[1];
      return attrs;
    }
    function lineTextAttrs (attrs, d, i){
      function lineTextTrans(){
        return (d.axis === 'x')? "rotate(90 "+ attrVal('x') +",10)": "";
      }
      function attrVal(attr){
        return (d.axis === attr)? _plot_fVal(attrs[(attr)+2],d, i) + ( attr == 'x'? 5: -5) : 10;
      }
      return {
        x: attrVal('x'),
        y: attrVal('y'),
        transform: lineTextTrans(),
      };
    }

    function rectAttrs (attrs, d, i){
      var rangeVals = {},
          j;
      if(d.range){
        for(j in d.range){
          setRectAttrs(j);
        }
      }

      function setRangeVals(elem, index){
        rangeVals[j][index] = _plot_fVal(attrs[j], rangeVals[j][index], i);
      }
      function setRectAttrs(key){
        rangeVals[key] = quantileValues(key , d.range[key]);
        rangeVals[key].forEach(setRangeVals);
        attrs[key] = d3.min(rangeVals[key]);
        attrs[(key == 'x')? 'width': 'height'] = d3.max(rangeVals[key]) - attrs[key];
      }
      return attrs;
    }

    function rectTextAttrs (attrs, d, i){
      var obj ={};
      function setRectTextCoord(key){
        obj[key] =_plot_fVal(attrs[key], d, i) + _plot_fVal( ( key== 'x'? attrs.width: attrs.height), d, i)/2;
      }
      setRectTextCoord('x');
      setRectTextCoord('y');
      return obj;
    }
    function quantileValues(skey, range){
      var key = scales.get(skey).key,
          tData = [],
          values = [];
      data.values().forEach(function(elem){tData.push(elem[key]);});
      tData = tData.sort( function(a, b) {return a - b;} );
      range.forEach(function(elem){
        var tmp = {};
        tmp[key] =d3.quantile( tData, elem );
        values.push( tmp );
      });
      return values;
    }
  }

  function _plot(sel) {
    _plot_setupChart(sel);
    _plot_setZoom();

    _plot.update = function _plot_mScatter(dontResize) {
      data = d3.map(sel.datum());

      if (autoSize) {
        scaleFactor = sel[0][0].offsetWidth/width;
      }
      if(!dontResize)_plot_resize();
      _plot_drawChart();
      return _plot;
    };

    _plot.update();
  }

  function _plot_fVal(val, d, i) {
    return (typeof val === 'function')? val(d,i) : val;
  }

  function _plot_setZoom(x, y) {
    zoomX = x || scales.get('x');
    zoomY = y || scales.get('y');

    zoom = d3.behavior.zoom()
      .x(zoomX.scale)
      .y(zoomY.scale);
  }

  scales.set("x", {
    key: 'x',
    scale: d3.scale.linear(),
    attrs: {
      range: function(){ return [0, (drawWidth - margin.left - margin.right)];},
      domain: function(data, key){ return d3.extent( data.values(), function(d){ return d[key];});}
    }
  });
  scales.set("y", {
    key: 'y',
    scale: d3.scale.linear(),
    attrs: {
      range: function(){ return [(drawHeight - margin.top - margin.bottom), 0];},
      domain: function(data, key){ return d3.extent( data.values(), function(d){ return d[key];});}
    }
  });
  scales.set("r", {
    key: 'r',
    scale: d3.scale.linear(),
    attrs: {
      range: function(){ return [minRadius, maxRadius];},
      domain: function(data, key){ return d3.extent( data.values(), function(d){ return d[key];});}
    }
  });
  scales.set("fill", {
    key: 'fill',
    scale: d3.scale.linear(),
    attrs: {
      interpolate: function(){return d3.interpolateHcl;},
      range: function(){ return ["#4575b4","#a50026"];},
      domain: function(data, key){ return d3.extent( data.values(), function(d){ return d[key];});}
    }
  });

  _plot.top  = function _plot_mTop() { return chart; };
  _plot.drawWidth = function _plot_mDrawWidth() { return drawWidth; };
  _plot.drawHeight = function _plot_mDrawHeight() { return drawHeight; };
  _plot.data = function _plot_mData() { return data.values(); };

  _plot.width = function _plot_mWidth(value) {
    if (!arguments.length) return width;
    width = value;
    return _plot;
  };
  _plot.height = function _plot_mHeight(value) {
    if (!arguments.length) return height;
    height = value;
    return _plot;
  };
  _plot.duration = function _plot_mDur(value) {
    if (!arguments.length) return dur;
    dur = value;
    return _plot;
  };
  _plot.delay = function _plot_mDelay(value) {
    if (!arguments.length) return delay;
    delay = value;
    return _plot;
  };

  _plot.layers  = function _plot_mLayers() { return layers; };
  _plot.layer  = function _plot_mLayer(name, layer) {
    switch(arguments.length){
      case 0:
        return layers;
      case 1:
        for (var i = layers.length; i--;) {
          if (layers[i].name == name) return layers[i];
        }
        break;
      default:
        layers.push(layer);
    }
    return _plot;
  };

  _plot.behaviors  = function _behaviors_mBehaviors() { return behaviors; };
  _plot.behavior  = function _plot_mBehavior(behavior, value) {
    if (!arguments.length) return behaviors;
    if (arguments.length == 1) return behaviors.get(behavior);

    behaviors.set(behavior, value);
    return _plot;
  };


  _plot.scales = function _plot_mScales() { return scales; };
  _plot.scale  = function _plot_mScale(scale, attr, value) {
    var s = scales.get(scale) || scales.set(scale, { scale: d3.scale.linear(), attr:{} });
    switch(arguments.length){
      case 0:
        return scales;
      case 1:
        return s;
      case 2:
        if(typeof attr === 'object'){
          scales.set(scale, attr);
        }else{
          return s[attr] ||  s.attrs[attr];
        }
        break;
      default:
        if(s.hasOwnProperty(attr)) s[attr] = value;
        else s.attrs[attr] = value;
    }
    return _plot;
  };

  _plot.margin = function _plot_mMargin(value){
    if (!arguments.length) return margin;
    margin = value;
    return _plot;
  };
  _plot.margin.top = function _plot_mMarginTop(value){
    if (!arguments.length) return margin.top;
    margin.top = value;
    return _plot;
  };
  _plot.margin.right = function _plot_mMarginRight(value){
    if (!arguments.length) return margin.right;
    margin.right = value;
    return _plot;
  };
  _plot.margin.bottom = function _plot_mMarginBottom(value){
    if (!arguments.length) return margin.bottom;
    margin.bottom = value;
    return _plot;
  };
  _plot.margin.left = function _plot_mMarginLeft(value){
    if (!arguments.length) return margin.left;
    margin.left = value;
    return _plot;
  };

  _plot.zoomIn = function _plot_zoomIn(xDomain, yDomain){
    var x = zoomX.scale.domain(xDomain),
        y = zoomY.scale.domain(yDomain),
        z = d3.behavior.zoom().x(x).y(y);

    _plot_drawChart();
  };

  _plot.zoom = function _plot_zoom(x, y) {
    if (!arguments.length) return zoom;
    zoomX = x || scales.get('x');
    zoomY = y || scales.get('y');
    zoom = d3.behavior.zoom()
      .x(zoomX.scale)
      .y(zoomY.scale);
  };

  return _plot;
}
