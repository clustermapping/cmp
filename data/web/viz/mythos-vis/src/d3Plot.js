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
      defs = [],
      layers = [],
      diction = d3.map(),
      zoom,
      zoomX,
      zoomY;

  //SVGs & etc.
  //=======
  var pElems = d3.map(),
      svgDefs,
      clip,
      chart,
      guides,
      axes,
      title,
      axesLabels,
      zeroXAxis,
      zeroYAxis;

  function _plot_compileAttrs(attrz){
    var items = d3.map(attrz).entries(),
        attrs ={};

    items.forEach(function(a) {
      if (typeof a.value == 'object'){
        a.value.attrs = _plot_compileAttrs(a.value.attrs);
        attrs[a.key] = _plot_compileFunc( a.value.fn, a.value.attrs );
      }else{
        var iScale = scales.get(a.value);
        attrs[a.key] = scales.has(a.value) ? function(d) {return iScale.scale(d[iScale.key]);} : d3.functor(a.value);
      }
    });
    return attrs;
  }

  function _plot_compileFunc(fn , attrs){
    for(var i in attrs){fn = fn[i](attrs[i]);}
    return fn;
  }

  function _plot_updateScales(){
    MythosVis.ProcessDiction({plot:_plot, diction: diction});
    scales.forEach(function(k,v){v.Compile();});
  }

  function _plot_setupChart(sel) {
    pElems['root'] = sel.append('div')
      .attr({class: 'd3-plot mythos-plot plot'});

    if (autoSize) {
      scaleFactor = sel[0][0].offsetWidth/width;
      _plot_resize();
    }

    layers.forEach(function(layer) {
      if(layer.config){
        if(layer.config.layerCanvas == 'svg' && !pElems['svg'] ) _plot_createSVG();
        if(layer.config.parent)layer.append();
      }
    });
  }

  function _plot_createSVG(){
    pElems['svg'] = pElems['root'].append("svg")
      .attr({width: drawWidth, height: drawHeight});

    pElems['clip'] = pElems['svg'].append("clipPath")
            .attr({id: "plot-clip"})
            .append("rect")
            .attr({'width': drawWidth - margin.left - margin.right, 'height': drawHeight - margin.top - margin.bottom});

    pElems['chart'] = pElems['svg'].append("g")
      //Offsets to take axis/margins into account
      .attr({transform: "translate(" + margin.left + "," + margin.top + ")"});
  }

  function _plot_updateSVG(){
    pElems['svg'].attr({width: drawWidth, height:drawHeight});

    pElems.clip
      .interrupt()
      .transition()
      .delay(delay)
      .duration(dur)
        .attr({width: (drawWidth- margin.left - margin.right), height: (drawHeight  - margin.top - margin.bottom)});
  }

  function _plot_resize() {
    drawWidth = width * scaleFactor;
    drawHeight = height * scaleFactor;
    maxRadius = Math.min(width, height)*maxRadiusRatio;

    _plot_updateScales();
  }

  function _plot_drawDefs() {
    if(!svgDefs && defs.length){
      svgDefs = pElems['svg'].insert('defs', ':first-child');
    }
    defs.forEach(function(def) {
      if (!svgDefs.selectAll('#' + def.name).empty()) { return; };

      dElem = svgDefs.append(def.type).attr({id: def.name});
      dElem.attr(_plot_compileAttrs(def.attrs));
      def.elements.forEach(function(el) {
        var elem = dElem.append(el.type);
        elem.attr(_plot_compileAttrs(el.attrs));
      });
    });
  }

  // move to layer object? (might just be render capabilities for top level object)
  function _plot_drawChart() {
    _plot_drawDefs();

    if(pElems['svg']) _plot_updateSVG();

    layers.forEach(function(layer) {
      if (!layer.config.enabled) return;

      switch (layer.config.kind) {
        case "guide":
          _plot_drawGuide(layer);
          break;
        case "gauge":
          _plot_drawGauge(layer);
          break;
        // New style
        case "bar":
        case "path":
        case "pie":
        case "point":
        case "axis":
        case "map":
        case "choroplethMap":
        case "table":
        case "grid":
        case "info":
          layer.draw(layer.kind);
          break;
        // end new style
        case "markers":
          break;
        case "icons":
          break;
        case "simple":
          console.log("found simple");
          layer.draw(layer.kind)
//          layer(pElems['svg'].append("g"));
        default:
          //layer(['svg'], g);
      }
    });
  }

  // move to layer object
  function _plot_drawGauge(layer) {
    var tData = layer.data|| data.values(),
        g;

    g = pElems.chart.select("g.layer-" + layer.name)
      .selectAll( "g."+layer.name+"-item")
      .data(layer.elements, function(d){
        return layer.elements.indexOf(d);
      });

    g.enter()
      .append('g')
      .attr({class: layer.name+"-item"})
      .each(function(d,i){
        d3.select(this)
          .datum(tData)
          .append(d.type)
          .attr({ class:'enter element-'+i });
      });

    layer.elements.forEach(function(e, i){
      var type = e.type || 'rect',
          attrs = _plot_compileAttrs(e.attrs),
          initAttrs = {
            class: (e.type+"-"+layer.kind+' element-'+i),
            opacity: 1e-6,
          },
          elem;

      switch(e.type){
        case 'rect':
          initAttrs.width = 0;
          break;
        case 'use':
          initAttrs.x = 0;
          break;
      }
      if(e.static) initAttrs = {};

      g.selectAll(e.type+".enter.element-"+i)
        .classed('enter',false)
        .attr(attrs)
        .attr(initAttrs)
        .text(e.text || null);

      elem = g.selectAll(e.type+'.element-'+i);

      elem
        .interrupt()
        .transition()
        .delay(delay)
        .duration(dur)
          .attr("opacity", 1)
          .attr(attrs);
          //.classed(('element-'+i), true);

      pElems.chart.select("g.layer-" + layer.name)
        .selectAll( "g."+layer.name+"-item.exit")
        .selectAll(e.type)
          .interrupt()
          .transition()
          .duration(dur)
          .attr(initAttrs)
          .remove();
    });
  }

  // move to layer object
  function _plot_drawGuide(layer) {
    g = pElems.chart.select("g.layer-" + layer.config.name)
      .selectAll( "g."+layer.config.name+"-item")
      .data(layer.config.elements, function(d){
          return layer.config.elements.indexOf(d);
        });

    g.enter()
      .append('g')
      .attr({class:function(d){return layer.config.name+"-item "+d.type;} })
      .each(function(d,i){
          var attrs = _plot_compileAttrs(d.attrs),
              textAttrs = {},
              group = d3.select(this);

          if(d.label){
            group.append('text')
              .classed('enter', true)
              .text(d.label);
          }

          switch(d.type){
            case 'line':
              setVal(d);
              attrs = lineAttrs(attrs, d);
              textAttrs = lineTextAttrs(attrs, d);
              break;
            case 'rect':
              attrs = rectAttrs(attrs, d);
              textAttrs = rectTextAttrs(attrs, d);
          }

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
      var attrs = _plot_compileAttrs(d.attrs),
          textAttrs = {},
          group =  d3.select(this);

      switch(d.type){
        case 'line':
          setVal(d);
          attrs = lineAttrs(attrs, d);
          textAttrs = lineTextAttrs(attrs, d);
          break;
        case 'rect':
          attrs = rectAttrs(attrs, d);
          textAttrs = rectTextAttrs(attrs, d);
      }

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
          .attr(textAttrs)
          .text(d.label);
    });

    g.exit()
      .classed('exit', true)
      .interrupt()
      .transition()
      .duration(dur)
        .attr({opacity: 1e-6})
        .remove();

    function setVal (d){
      var s = scales.get(d.axis);
      d[s.key] = _plot_fVal(d.dataSource, d);
    }
    function lineAttrs (attrs, d, i){
      var key = (d.axis == 'x')?'y': 'x',
          s = scales.get(key),
          range = s.scale.range(),
          key1 = range[0] || 0,
          key2 = range[range.length - 1] || 0;
      if (s.scale.rangeBand) {
        key2 += s.scale.rangeBand();
      }
      attrs[(key+1)] = key1;
      attrs[(key+2)] = key2;
      return attrs;
    }
    function lineTextAttrs (attrs, d, i){
      function lineTextTrans(){
        // return (d.axis === 'x')? "rotate(90 "+ attrVal('x') +",10)": "";
        return (d.axis === 'x')? "" : "";
      }
      function attrVal(attr){
        return (d.axis === attr)? _plot_fVal(attrs[(attr)+2],d, i) + ( attr == 'x'? 5: -5) : 10;
      }
      return {
        x: attrVal('x'),
        y: attrVal('y'),
        transform: _plot_fVal(attrs['texttrans'], d, i),
        style: _plot_fVal(attrs['textstyle'], d, i)
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

  // Actual object returned by d3Plot().
  function _plot(sel) {
    // tmp, set data.
    var _this = this;
    _this.dur = dur;
    _this.scales = scales;

    _plot_setupChart(sel);
    _plot_setZoom();

    _plot.update = function _plot_mUpdate(dontResize) {
      data = d3.map(sel.datum());
      _plot_updateScales();

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

  function _plot_initScales(){
    var sKeys = ['x','y','r','fill'];
    var options = {plot: _plot};
    for(var i in sKeys){
      scales.set(sKeys[i], MythosVis.ScaleFactory(sKeys[i], options));
    }
  }

  _plot.svg = function _plot_mSVG() { return pElems.svg; };
  _plot.top  = function _plot_mTop() { return pElems.chart; };
  _plot.drawWidth = function _plot_mDrawWidth() { return drawWidth; };
  _plot.drawHeight = function _plot_mDrawHeight() { return drawHeight; };
  _plot.data = function _plot_mData() { return data.values(); };
  _plot.mapData = function _plot_mMapData() { return data; }

  // TMP, need to access various globals here.
  _plot.chart = function() {return pElems.chart;};
  // endtmp

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
  _plot.layer  = function _plot_mLayer(name, options) {
    switch(arguments.length){
      case 0:
        return layers;
      case 1:
        for (var i = layers.length; i--;) {
          if (layers[i].name == name) return layers[i];
        }
        break;
      default:
        options.plot = _plot;
        var layer;
        var registeredPlugins = ['path', 'pie', 'point', 'axis', 'map', 'choroplethMap', 'table', 'grid', 'bar', 'info', 'simple'];
        if (registeredPlugins.indexOf(options.kind) !== -1) {
          layer = MythosVis.LayerFactory(options.kind, options);
        } else {
          layer = new MythosVis.LayerBase();
          layer.init(options);
        }
        layer.name = name;
        layers.push(layer);
    }
    return _plot;
  };

  _plot.scales = function _plot_mScales() { return scales; };
  _plot.scale  = function _plot_mScale(scale, attr, value) {
    var s = scales.get(scale) || scales.set(scale, MythosVis.ScaleFactory(scale, {plot: _plot}));
    switch(arguments.length){
      case 0:
        return scales;
      case 1:
        return s;
      case 2:
        if(typeof attr === 'object'){
          s.SetOptions(attr);
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

  _plot.dataDiction = function _plot_mDiction(value) {
    if (!arguments.length) return diction;
    for(var i in value){
      diction.set(value[i]['data_key'], value[i]);
    }
    MythosVis.ProcessDiction({plot: _plot, diction: diction});
    return _plot;
  };

  _plot.behaviors  = function _behaviors_mBehaviors() { return behaviors; };
  _plot.behavior  = function _plot_mBehavior(behavior, value) {
    if (!arguments.length) return behaviors;
    if (arguments.length == 1) return behaviors.get(behavior);

    behaviors.set(behavior, value);
    return _plot;
  };

  _plot.elements = function _plot_mElems() { return pElems; };
  _plot.element = function _plot_mElems(elem, value) {
    if (!arguments.length)return pElems;
    if (arguments.length == 1) return pElems[elem];
    pElems[elem] = value;
    return _plot;
  };


  _plot.defs = function _plot_mDefs() { return defs; };
  _plot.def  = function _plot_mDef(name, def) {
    switch(arguments.length){
      case 0:
        return defs;
      case 1:
        for (var i = defs.length; i--;) {
          if (defs[i].name == name) return defs[i];
        }
        break;
      default:
        def.name = name;
        defs.push(def);
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
  _plot.radius = function _plot_mRadius(value){
    if (!arguments.length) return [minRadius, maxRadius];
    minRadius = value[0];
    maxRadius = value[1];
    return _plot;
  };
  _plot.radius.max = function _plotRadiusMax(value){
    if (!arguments.length) return maxRadius;
    maxRadius = value;
    return _plot;
  };
  _plot.radius.min = function _plotRadiusMin(value){
    if (!arguments.length) return minRadius;
    minRadius = value;
    return _plot;
  };

  _plot.zoomIn = function _plot_zoomIn(xDomain, yDomain){
    zoomX.scale.domain(xDomain);
    zoomY.scale.domain(yDomain);
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

  _plot.draw = function _plot_draw() {
    _plot_drawChart();
    return _plot;
  };

  _plot_initScales();

  _plot = MythosVis.EventDecorator(_plot);
  return _plot;
}
