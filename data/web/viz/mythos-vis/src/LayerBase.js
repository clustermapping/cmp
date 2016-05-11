define(['d3'], function(d3) {

  LayerBase = function() {
    this.config = {};
  };

  LayerBase.prototype.init = function(options){
    if (options === undefined) {
      options = {};
    }

    this.plot = options.plot;
    //Set layers init config
    this.config =  this.mergeRecursive(this.defaults(),options);
  };

  //Appends layer to svg. Removed from d3Plot.
  LayerBase.prototype.append = function(){
    this.config.parent = this.plot.element(this.config.parent);
    this.config.layerElem = this.config.parent.append(this.config.layerType)
      .attr({
        class: "layer " + this.config.kind + " layer-" + this.config.name,
          "clip-path": this.config.clip ? "url(#plot-clip)" : null
      });
  };

  //Called everytime plot is updated
  LayerBase.prototype.draw = function() {
    //Prepares layer for rendering
    this.prep();
    //Attaches data and adds new elements
    this.enter();
    //Removes elements that are no longer part of the data
    this.exit();
    //Updates element attrs
    this.update();

    //Adds event listeners. Event handling provided by EventDecorator.
    if (this.listen !== undefined) {
      this.listen();
    }
  };

  LayerBase.prototype.prep = function() {
    this.config.data = this.plot.data();
    this.config.dur = this.plot.duration();
    this.config.delay = this.plot.delay();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
  };

  LayerBase.prototype.enter = function() {
    var c = this.config;

    c.group = c.layerElem
      .selectAll( c.groupType+"."+c.name+"-item")
      .data(c.data, function(d){return c.data.indexOf(d);});

    c.group.enter()
      .append(c.groupType)
      .attr({class: c.name+"-item"})
      .attr(c.attrs)
      .each(function(d,i){
          var group = d3.select(this);
          c.elements.forEach(function(e){
            group.append(e.type).attr({class:'enter'});
          });
        });
  };

  LayerBase.prototype.update = function() {};

  LayerBase.prototype.exit = function() {
    var c = this.config;
    c.group.exit()

      .classed('exit', true)
      .interrupt()
      .transition()
      .duration(c.dur)
        .remove();
  };

  LayerBase.prototype.defaults = function(){
    var p = this.plot;

    return {
      clip: false,
      enabled: true,
      selectable:true,
      parent: 'chart',
      layerCanvas: 'svg',
      layerType: 'g',
      groupType: 'g',
      attrs: {},
      duration: 1000,
      delay: 0
    };
  };

  LayerBase.prototype.appendElements = function _layerBase_append_elements(sel, elements){
    var i = i || 0;
    elements.forEach(function(e,i){
      i = sel.append(e.type)
        .attr(e.attrs)
        .text(e.text || null);
      if(e.html) i.html(e.html);
      if(e.append) _layerBase_append_elements(i, e.append);
    });
  };


  LayerBase.prototype.mergeRecursive = function _layerBase_mergeRecursive(obj1, obj2) {
    for (var p in obj2) {
      try {
        if ( obj2[p].constructor==Object ) {
          obj1[p] = _layerBase_mergeRecursive(obj1[p], obj2[p]);
        } else {
          obj1[p] = obj2[p];
        }
      } catch(e) {
        obj1[p] = obj2[p];
      }
    }
    return obj1;
  };

  // Returns an attribute object for use in layers
  LayerBase.prototype.CompileAttrs = function _layerBase_compileAttrs(attrz){
    var items = d3.map(attrz).entries(),
        scales = this.plot.scales(),
        attrs ={};

    items.forEach(function(a) {
      if (typeof a.value == 'object'){
        a.value.attrs = this.CompileAttrs(a.value.attrs);
        attrs[a.key] = this.CompileFunc( a.value.fn, a.value.attrs );
      }else{
        var iScale = scales.get(a.value);
        attrs[a.key] = scales.has(a.value) ? function(d) {return iScale.scale(d[iScale.key]);} : d3.functor(a.value);
      }
    }, this);
    return attrs;
  };


  LayerBase.prototype.CompileFunc = function _layerBase_compileFunc(fn , attrs){
    for(var i in attrs){fn = fn[i](attrs[i]);}
    return fn;
  };

  LayerBase.prototype.focus = function(d) {
    this._customEventDispatchers.focus(d, this);
  };

  LayerBase.prototype.unFocus = function() {
    this._customEventDispatchers.unfocus(this);
  };

  return LayerBase;
});

/**
 * Old functions
 */

  // move to layer object
  function _plot_drawGauge(layer) {
    var tData = layer.data|| data.values(),
        g;

    g = chart.select("g.layer-" + layer.name)
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

      chart.select("g.layer-" + layer.name)
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
    g = chart.select("g.layer-" + layer.name)
      .selectAll( "g."+layer.name+"-item")
      .data(layer.elements, function(d){
          return layer.elements.indexOf(d);
        });

    g.enter()
      .append('g')
      .attr({class:function(d){return layer.name+"-item "+d.type;} })
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
          .attr(textAttrs);
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
