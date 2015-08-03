(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['d3', 'topojson', 'queue'], factory);
    } else {
        // Browser globals
        root.MythosVis = factory(root.d3, root.topojson, root.queue);
    }
}(this, function (d3, topojson, queue) {
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define('LayerBase',['d3'], function(d3) {

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
;
define('layers/SimpleLayer',['d3', 'LayerBase'], function(d3, LayerBase) {
  var SimpleLayer = function(options) {
    this.init(options);
  };
  SimpleLayer.prototype = new LayerBase();

  var NoOp = function _no_op() {};

  SimpleLayer.prototype.append = function() {
    this.config.parent = this.plot.element(this.config.parent);
    this.config.layerElem = this.config.parent.append(this.config.layerType)
      .attr({
        class: "layer " + this.config.kind + " layer-" + this.config.name,
          "clip-path": this.config.clip ? "url(#plot-clip)" : null
      });

    if (this.config.append !== undefined) {
      this.config.append(this.config.layerElem);
    }
  };

  SimpleLayer.prototype.enter = NoOp;
  SimpleLayer.prototype.exit = NoOp;
  SimpleLayer.prototype.update = function() {
    if (this.config.draw !== undefined) {
      this.config.draw(this.config.layerElem);
    }
  };

  return SimpleLayer;
});

define('layers/PathLayer',['LayerBase'], function(LayerBase) {
  PathLayer = function(options) {
    this.init(options);
  };
  PathLayer.prototype = new LayerBase();

//  PathLayer.prototype.enter =function(){
//    var c = this.config,
//        layer = this;
//
//    c.group = c.layerElem
//      .selectAll( c.groupType+"."+c.name+"-item")
//      .data(c.elements)
//      .datum(c.data);
//
//    c.group.enter()
//      .append(c.groupType)
//      .attr({class: c.name+"-item"})
//      .attr(c.attrs)
//      .each(function(d,i){
//          var e = c.elements[i],
//              attrs = layer.CompileAttrs(e.attrs),
//              initAttrs = {class:e.type+"-"+c.kind};
//          d3.select(this)
//            .data(c.data)
//            .append(e.type)
//            .attr(attrs)
//            .attr(initAttrs);
//        });
//  };

  PathLayer.prototype.update =function(){
    var c = this.config;

    c.elements.forEach(function(e){
      var attrs = this.CompileAttrs(e.attrs),
          elem;

      if(e.static) initAttrs = {};
      c.group
        .selectAll(e.type+".enter")
        .classed('enter',false)
        .attr(attrs)
        .attr(e.initAttrs)
        .text((e.type == 'text'? e.text : null) );

      elem = c.group.selectAll(e.type);

      elem
        .interrupt()
        .transition()
        .delay(c.delay)
        .duration(c.dur)
        .attr("opacity", 1)
        .attr(attrs);

      c.layerElem
        .selectAll( c.groupType+"."+c.name+"-item.exit")
        .selectAll(e.type)
        .interrupt()
        .transition()
        .duration(c.dur)
        .attr(e.initAttrs)
        .remove();
    }, this);
  };

  return PathLayer;
});

define('layers/PointLayer',['LayerBase'], function(LayerBase) {
  PointLayer = function(options) {
    if(options)this.init(options);
  };
  PointLayer.prototype = new LayerBase();

  PointLayer.prototype.prep = function() {
    this.config.data = this.plot.data();
    this.config.dur = this.plot.duration();
    this.config.delay = this.plot.delay();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);

    this.config.elements.forEach(function(elem){
      elem.type =  elem.type || 'circle';
      elem.initAttrs = {
        class:elem.type+"-"+this.config.kind,
        opacity: 1e-6
      };
      if(elem.type == 'circle') elem.initAttrs.r = this.plot.radius.min();
    }, this);
  };

  PointLayer.prototype.update = function() {
    var c = this.config;

    c.elements.forEach(function(e){
      var attrs = this.CompileAttrs(e.attrs),
          elem;

      if(e.static) initAttrs = {};
      c.group
        .selectAll(e.type+".enter")
        .classed('enter',false)
        .attr(attrs)
        .attr(e.initAttrs)
        .text((e.type == 'text'? e.text : null) );

      elem = c.group.selectAll(e.type);

      elem
        .interrupt()
        .transition()
        .delay(c.delay)
        .duration(c.dur)
          .attr("opacity", 1)
          .attr(attrs);

      c.layerElem
        .selectAll( c.groupType+"."+c.name+"-item.exit")
        .selectAll(e.type)
          .interrupt()
          .transition()
          .duration(c.dur)
          .attr(e.initAttrs)
          .remove();
    }, this);
  };

  return PointLayer;
});

define('layers/PieLayer',['layers/PointLayer'], function(PointLayer) {
  var PieLayer = function(options) {
    if(options)this.init(options);
  };
  PieLayer.prototype = new PointLayer();

  PieLayer.prototype.prep = function() {
    var pie = this.CompileFunc(this.config.pie.fn, this.config.pie.attrs);
    this.config.data = pie( this.plot.data() );
    this.config.dur = this.plot.duration();
    this.config.delay = this.plot.delay();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);

    this.config.elements.forEach(function(elem){
      elem.type =  elem.type || 'path';
      elem.initAttrs = {
        class:elem.type+"-"+this.config.kind,
        opacity: 1e-6
      };
      switch(elem.type){
        case 'path':
          elem.initAttrs.d ={
            fn: d3.svg.arc(),
            attrs:{ innerRadius: 0.1, outerRadius:1 }
          };
          elem.initAttrs = this.CompileAttrs(elem.initAttrs);
          break;
      }
    }, this);
  };

  return PieLayer;
});

define('layers/AxisLayer',['LayerBase'], function(LayerBase) {
  AxisLayer = function(options) {
    if(options)this.init(options);
  };
  AxisLayer.prototype = new LayerBase();

  AxisLayer.prototype.prep = function() {
    this.config.data = this.config.elements;
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
    this.config.dur = this.plot.duration();
    //this.config.nameSafe = this.makeSafeForCSS(this.config.name);

    this.config.elements.forEach(function(elem){
      var s = this.config.scales.get(elem.type);
      elem.scale = s.scale;
      elem.axis.attrs.scale = elem.scale;
      if(s.format != '') elem.axis.attrs.tickFormat = d3.format(s.format);
      elem.label = elem.label || s.label;
    }, this);
  };

  AxisLayer.prototype.enter = function() {
    var c = this.config,
        layer = this;

    c.group = c.layerElem
      .selectAll( c.groupType+"."+c.name+"-item")
      .data(c.data, function(d){return c.data.indexOf(d);});

    c.group.enter()
      .append(c.groupType)
      .attr({class: c.name+"-item"})
      .attr(c.attrs)
      .each(function(d,i){
        var elem = d3.select(this);
        elem.attr(layer.CompileAttrs(d.attrs));

        var axis = elem.append('g')
          .attr({class: d.type+' axis'});

        if(d.label){
          elem
            .append('text')
            .attr({class: 'axis-label label'});
        }
        layer.compileAxis(d.axis);
        axis.call(d.axis.fn);
      });
  };

  AxisLayer.prototype.update = function() {
    var c = this.config,
        layer = this;
    //c.group.call(c.fn.update);

    c.group.each(function(d,i){
      var elem = d3.select(this),
          attrs = layer.CompileAttrs(d.attrs),
          axis = elem.select("g.axis"),
          plot = layer.plot,
          pWidth = plot.drawWidth() - plot.margin.left() - plot.margin.right(),
          pHeight = plot.drawHeight() - plot.margin.top() - plot.margin.bottom();
      layer.compileAxis(d.axis);

      elem
        .interrupt()
        .transition()
        .duration(c.dur)
        .attr(attrs)
          .select("g.axis")
          .call(d.axis.fn)
          .each('end',function(){
            if(d.label){
              var bb = axis[0][0].getBBox();
              elem.select('text.label')
                .text(d.label)
                .attr({
                  // we'll see
                    'y': function(){
                      return (d.type === 'y')? pHeight/2 : bb.height + 15;
                    },
                    'x': function(){
                      return (d.type === 'x')? pWidth/2: bb.width - 10;
                    },
                    'transform':  function (){
                      return (d.type === 'y')? "translate(" + (-(pHeight/2) - 50) + "," +  pHeight/2 + ") rotate(-90)" : "";
                    }
                  });
            }
          });

      if(d['vertical-tick-label']){
        elem.selectAll(".tick text")
          .attr({
            dy: ".35em",
            transform: "rotate(-65,0,9)"
          })
          .style("text-anchor", "end");
      }

      if(d['wrap-tick-label']){
        var w = (d.type == 'x')? d.scale.rangeBand() : c.plot.margin().left -9;
        elem.selectAll(".tick text")
          .call(layer.wrap, w, d.type);
      }
    });
  };

  AxisLayer.prototype.compileAxis = function(a) {
    function propVal(prop, propV){
      return (typeof propV === 'function'&& prop !== 'scale'&& prop !== 'tickFormat') ? propV() : propV;
    }
    a.fn = a.fn || axis.svg.axis();
    for(var attr in a.attrs){
      a.fn = a.fn[attr]( propVal(attr, a.attrs[attr]) );
    }
  };

  AxisLayer.prototype.wrap = function(text, width, axis) {
    axis = axis || 'x';

    text.each(function(d) {

        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr('y'),
            x = text.attr('x'),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y )
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
                .attr("x",x)
                .attr("y", y)
                .attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
    });
  };

  return AxisLayer;
});
define('DataLib',['d3', 'queue'], function(d3, queue) {
  var dataStore = {};
  var requestedQueue = [];
  var callbackQueue = [];
  var callOut = false;

  DataLib = function() {

  };

  DataLib.prototype.request = function(dataLoad, cb) {
    var returnData = [],
        dataToLoad = [],
        i,
        foundAllInCache;

    if (dataLoad === undefined) {
      return;
    }

    if (!(dataLoad instanceof Array)) {
      dataLoad = [dataLoad];
    }

    // Loop through each piece of external data, attempt to 
    // match to something already loaded.
    
    dataToLoad = this._loadRequestsFromCache(dataLoad, cb);

    if (dataToLoad !== undefined) {
      // Need to request our data.
      callbackQueue.push({
        calls: dataLoad,
        callback: cb
      });

      for (i in dataToLoad) {
        if (requestedQueue.indexOf(dataToLoad[i]) == -1) {
          requestedQueue.push(dataToLoad[i]);
        }
      }

      if (callOut === false) {
        callOut = true;
        this._loadRequestsFromRequestQueue();
      }
    }
  };

  // returns array of requests that aren't in the cache if cb wasn't fired, otherwise undefined.
  DataLib.prototype._loadRequestsFromCache = function(requests, cb) {
    var foundAllInCache = true,
        returnData = [],
        dataToLoad = [];

    for (var i in requests) {
      if (dataStore[requests[i]] !== undefined) {
        returnData.push(dataStore[requests[i]]);
      } else {
        foundAllInCache = false;
        dataToLoad.push(requests[i]);
      }
    }

    if (foundAllInCache === true) {
      cb.apply(null, returnData);
      return undefined;
    }

    return dataToLoad;
  };

  DataLib.prototype._loadRequestsFromRequestQueue = function() {
    var _queue = queue(3),
        dataToLoad = [],
        item,
        _this = this;

    for (var i = 0; i < 3; i++) {
      item = requestedQueue[i];
      if (item !== undefined) {
        dataToLoad.push(item);
      } else {
        requestedQueue.pop();
      }
    }

    for (i in dataToLoad) {
      _queue.defer(d3.json, dataToLoad[i]);
    }

    _queue.awaitAll(function(err, results) {
      if (err === null) {
        for (var i in results) {
          dataStore[dataToLoad[i]] = results[i];
          var requestedIndex = requestedQueue.indexOf(dataToLoad[i]);
          if (requestedIndex !== -1) {
            requestedQueue.splice(requestedIndex, 1);
          }
        }

        for (i in callbackQueue) {
          d = _this._loadRequestsFromCache(callbackQueue[i].calls, callbackQueue[i].callback);
          if (d === undefined) {
            callbackQueue[i] = null;
          }
        }

        callbackQueue = callbackQueue.filter(function(element) {return element !== null;});

        if (requestedQueue.length > 0) {
          _this._loadRequestsFromRequestQueue();
        }
        else {
          callOut = false;
        }
      }
    });
  };

  return DataLib;
});

define('layers/MapLayer',['d3', 'topojson', 'DataLib', 'LayerBase'], function(d3, topojson, DataLib, LayerBase) {
  var lib = new DataLib();

  d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };

  MapLayer = function(options) {
    this.init(options);
  };
  MapLayer.prototype = new LayerBase();

  MapLayer.prototype.init = function(options){
    if (options === undefined) {
      options = {};
    }

    this.plot = options.plot;
    this.geoPaths = undefined;
    //Set layers init config
    this.config =  this.mergeRecursive(this.defaults(),options);
    var _this = this;

    this.focusedElement = null;

    if (this.config.geoSource !== undefined) {
      lib.request(this.config.geoSource, function(data) {
        _this.geoPaths = data;
          _this.draw();
      });
    }
  };

  MapLayer.prototype.prep = function() {
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
    this.config.width = this.plot.width();
    this.config.height = this.plot.height();
  };

  MapLayer.prototype.enter = function() {
    var c = this.config;

    c.path = d3.geo.path()
      .projection(c.projection);

    if (this.geoPaths) {
      c.group = c.layerElem.selectAll("path." + c.name + "-item")
        .data(topojson.feature(this.geoPaths, this.geoPaths.objects[c.objectType]).features)
        .enter().append("path")
          .attr("class", function(d) {return c.name + '-item item'; })
          .attr("id", function(d) { return c.name + '-item-' + d.id;})
          .attr("d", c.path);
    }
  };

  MapLayer.prototype.exit = function(){};

  MapLayer.prototype.highlight = function(id) {
    var c = this.config,
        g = c.layerElem,
        ids = (id.forEach ? id : [id]);

    g.selectAll('path.' + c.name + '-item').classed("active", false);
    ids.forEach(function(d) {
      g.selectAll('path#' + c.name + '-item-' + d).classed("active", true);
    });
    g.selectAll("path.active").moveToFront();
  };

  MapLayer.prototype.focus = function(d) {
    var c = this.config,
        centroid = c.projection(d3.geo.centroid(d)),
        data = (c.data && c.data[d.id] !== undefined) ? c.data[d.id] : d;

    data.geo = d;

    this.focusedElement = d;
    this.zoomTo(centroid[0], centroid[1], 3);

    this.trigger('focus', data, this);
  };

  MapLayer.prototype.unFocus = function() {
    this.focusedElement = null;
    
    var width = this.plot.width(),
        height = this.plot.height();

    this.zoomTo(width / 2, height / 2, 1);

    this.trigger('unfocus', this);
  };

  MapLayer.prototype.zoomTo = function(x, y, k) {
    var layers = this.plot.layers();
    for (var i in layers) {
      if (layers[i] instanceof MapLayer) {
        layers[i]._zoomTo(x, y, k);
      }
    }
  };

  MapLayer.prototype._zoomTo = function(x, y, k) {
    var c = this.config,
        width = this.plot.width(),
        height = this.plot.height(),
        dur = this.plot.duration();
    this.zoomX = x;
    this.zoomY = y;
    this.zoomK = k;

    c.layerElem.transition()
      .duration(dur)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + (-x) + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
  };

  return MapLayer;
});

define('layers/ChoroplethMapLayer',['d3', 'topojson', 'DataLib', 'LayerBase', 'layers/MapLayer'], function(d3, topojson, DataLib, LayerBase, MapLayer) {
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

 define('layers/BarLayer',['layers/PointLayer'], function(layerBase) {
  var BarLayer = function(options) {
    if(options)this.init(options);
  };
  BarLayer.prototype = new PointLayer();

  BarLayer.prototype.prep = function() {
    this.config.data = this.plot.data();
    this.config.dur = this.plot.duration();
    this.config.delay = this.plot.delay();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);

    this.config.elements.forEach(function(elem){
      elem.type =  elem.type || 'rect';
      elem.initAttrs = {};

      if (this.config.scales.get('x')) {
        var x = this.config.scales.get('x').scale(0);
        switch(elem.type){
          case 'rect':
            elem.initAttrs.x = x;
            elem.initAttrs.width = 0;
            break;
          case 'line':
            elem.initAttrs.x1 = elem.initAttrs.x2 = x;
            break;
          case 'circle':
            elem.initAttrs.cx = x;
            elem.initAttrs.r = this.plot.radius.min();
            elem.initAttrs.opacity = 1e-6;
            break;
          case 'path':
            break;
        }
      } else if (this.config.scales.get('y')) {
        var y = this.config.scales.get('y').scale(0);
        switch(elem.type){
          case 'rect':
            elem.initAttrs.y = y;
            elem.initAttrs.height = 0;
            break;
          case 'line':
            elem.initAttrs.y1 = elem.initAttrs.y2 = y;
            break;
          case 'circle':
            elem.initAttrs.cy = y;
            elem.initAttrs.r = this.plot.radius.min();
            elem.initAttrs.opacity = 1e-6;
            break;
          case 'path':
            break;
        }
      }
    }, this);
  };

  return BarLayer;
});

define('layers/GridLayer',['LayerBase'], function(layerBase) {
  var GridLayer = function(options) {
    if(options)this.init(options);
  };
  GridLayer.prototype = new AxisLayer();

  GridLayer.prototype.prep = function() {
    var layer = this;
    this.config.data = this.config.elements;
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
    this.config.dur = this.plot.duration();
    this.config.delay = this.plot.delay();

    this.config.elements.forEach(function(elem){
      var s = this.config.scales.get(elem.type);
      elem.axis.attrs.scale = s.scale;
      elem.axis.attrs.tickFormat = '';
      elem.label = null;

      switch(elem.type){
        case 'x':
          elem.axis.attrs.tickSize = layer.plot.drawHeight();
          break;
        case 'y':
          elem.axis.attrs.innerTickSize = layer.plot.drawWidth();
          break;
      }
    }, this);
  };

  return GridLayer;
});

define('layers/InfoLayer',['LayerBase'], function(LayerBase) {
  var InfoLayer = function(options) {
    if(options){
      var defaults = {
        layerCanvas: 'div',
        layerType: 'div',
        groupType: 'div',
        parent: 'root'
      };
      this.mergeRecursive(defaults, options);

      this.init(defaults);
    }
  };
  InfoLayer.prototype = new LayerBase();

  InfoLayer.prototype.prep = function() {
    this.config.data = this.config.dataFN();
    this.config.scales = this.plot.scales();
    this.config.attrs = this.CompileAttrs(this.config.attrs);
    this.config.initStyle = {opacity: 1e-6};
  };

  InfoLayer.prototype.enter = function() {
    var c = this.config;
    var layer = this;

    c.group = c.layerElem
      .selectAll( c.groupType+"."+c.name+"-item")
      .data(c.data, function(d){return c.data.indexOf(d);});

    c.group.enter()
      .append(c.groupType)
      .attr({class: c.name+"-item item"})
      .classed('enter', true)
      .each(function(d,i){
          layer.appendElements(d3.select(this), c.elements);
        });
  };

  InfoLayer.prototype.exit = function() {
    var c = this.config;
    c.group.exit()
      .classed('exit', true)
      .interrupt()
      .transition()
      .duration(c.duration)
      .style(c.initStyle)
      .each('end', function() {
        d3.select(this).remove();
      });
  };

  InfoLayer.prototype.update = function() {
    var c = this.config;

    c.group
      .each(function(d){
        var item = d3.select(this);
        if(item.classed('enter')){
          item.classed('enter', false)
            .style(c.initStyle)
            .attr(c.attrs);
        }
        if(!item.classed('exit')){
          item
            .transition()
            .duration(c.duration)
            .style({opacity:1})
            .attr(c.attrs);
        }
      });
  };

  return InfoLayer;
});

define('EventDecorator',['d3'], function(d3) {
  var nonStandardEvents = ['focus', 'unfocus'];

  EventDecorator = function(obj) {
    obj._customEventDispatchers = d3.dispatch.apply(null, nonStandardEvents);

    obj.on = function(_event, cb) {

    };

    obj.off = function(_event) {

    };

    obj.trigger = function() {
      var _arg = Array.prototype.slice.call(arguments);
      var _event = _arg.shift();

      if (nonStandardEvents.indexOf(_event) !== -1) {
        this._customEventDispatchers[_event].apply(null, _arg);
      }
    };

    obj.listen = function() {
      var c = this.config;

      if (c.selectable) {
        for(var b in c.behaviors){
          if (c.group !== undefined) {
            c.group.on(b, c.behaviors[b]);
          }

          // Custom events
          if (nonStandardEvents.indexOf(b) !== -1) {
            this._customEventDispatchers.on(b, c.behaviors[b]);
          }
        }
      }
    };

    return obj;
  };

  return EventDecorator;
});

define('LayerFactory',['d3',
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

define('ScaleBase',['d3'], function(d3) {
  // Internal global vars are tmp.
  var plot,
      minRadius = 5,
      delay = 0,
      dur = 750,
      scales = d3.map();


  var ScaleBase = function(options) {
    plot = options.plot;
  };

  ScaleBase.prototype.Compile = function(){
    var s = this.scale,
        dataKey = this.key,
        data = plot.data(),
        drawWidth = plot.drawWidth(),
        drawHeight = plot.drawHeight(),
        margin = plot.margin();

    for (var attr in this.attrs) {
      if (!this.attrs.hasOwnProperty(attr)) continue;
      var val = this.attrs[attr];
      if (typeof val === 'function') val = val(data, dataKey, drawWidth, drawHeight, margin);
      if (val.hasOwnProperty && val.args) {
        s[attr].apply(null, val.args);
      } else {
        if (typeof s[attr] == 'function') {
          s[attr](val);
        }
      }
    }
    if(s.hasOwnProperty('tickFormat')) s.tickFormat(d3.format(this.format));
  };

  ScaleBase.prototype.SetOptions = function(ops){
    function setVal(o, val){
      if( (typeof val === 'object' || val === 'array') && (typeof o === 'object' || o === 'array') ){
        for(var key in val){
          if (val.hasOwnProperty(key))o[key] = setVal(o[key], val[key]);
        }
      }
      else{o = val;}
      return o;
    }
    setVal(this, ops);
  };

  return ScaleBase;
});




define('ScaleFactory',['ScaleBase'], function(scaleBase) {

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
define('Plot',['d3', 'LayerFactory', 'ScaleFactory'], function(d3, LayerFactory, ScaleFactory) {
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

define('PlotFactory',['Plot'], function(Plot) {
  var PlotFactory = function(selection, data) {
    return new Plot(selection, data);
  };

  return PlotFactory;
});

define('ProcessDiction',['d3'], function(d3) {
  ProcessDiction = function(options){
    var dict = d3.map(options.diction),
        scales = options.plot.scales();

    scales.forEach(function(k,v){
      if(dict.get(v.key))v.SetOptions(dict.get(v.key));
    });
    return dict;
  };

  return ProcessDiction;
});

define('MythosVis',['require','LayerFactory','LayerBase','ScaleFactory','PlotFactory','EventDecorator','ProcessDiction','DataLib'],function (require) {
  

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

    //Register in the values from the outer closure for common dependencies
    //as local almond modules
    define('d3', function () {
        return d3;
    });
    define('topojson', function () {
        return topojson;
    });

    define('queue', function() {
        return queue;
    });

    //Use almond's special top-level, synchronous require to trigger factory
    //functions, get the final module value, and export it as the public
    //value.
    return require('MythosVis');
}));
