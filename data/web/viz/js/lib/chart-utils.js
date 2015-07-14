function tFn() {
  var funcs = [], i, s;
  for (i = 0; i < arguments.length; i++) {
    s = arguments[i];
    if (s[0] === '.') {
      funcs.push(aFn(s.substring(1)));
    } else {
      funcs.push(fn(s));
    }
  }
  return function(d) {
    var result = '';
    funcs.forEach(function(f) {
      result += f(d);
    });
    return result;
  }
}

function fn(v) {
  return typeof v === "function" ? v : function() { return v; };
}

function cr(wrap, d) { return function() { d = fn(d); return wrap(d()); }}

function aFn(key, def, func) {
  var dot = (key.indexOf ? key.indexOf('.') : -1);
  if (dot === -1) {
    key = isNaN(+key) ? key : +key;
    func = func || function(d) { return d; };
    return function (d) {
      var r = func(d);
      return (r && r[key] ? r[key] : def);
    }
  } else {
    return aFn(key.substring(dot + 1), def, aFn(key.substring(0,dot), def, func) );
  }
}

function layer(kind, name) {
  var _kind=kind, _name=name, _enabled = true, _selectable = true, _elements = [];
  function _layer_func() {
    return {
      kind: _kind,
      name: _name,
      enabled: _enabled,
      selectable: _selectable,
      elements: _elements
    }
  }

  _layer_func.el = function _layer_el(e) {
    _elements.push(e);
    return _layer_func
  };

  _layer_func.make = function() { return _layer_func(); };

  return _layer_func;
}

function createAxis(plot, type, orient, label) {
  var labelFunc = d3.functor(label), transformFunc;
  if (type === 'x' && orient === "bottom") {
    transformFunc = function(){return "translate(0, " + (plot().drawHeight() - plot().margin.top() - plot().margin.bottom()) + ")";}
  }
  return {
    type: type,
    label: labelFunc,
    attrs: {
      transform: transformFunc
    },
    axis:{
      fn: d3.svg.axis(),
      attrs:{orient: orient }
    }
  }
}

function createTitle(dataFn, title, subtitles) {
  var titleFn = d3.functor(title), subtitleFns, result;
  if (!Array.isArray(subtitles)) {
    subtitles = [subtitles];
  }
  subtitleFns = subtitles.map(function(d) { return d3.functor(d);});
  result = {
    kind: 'info',
    duration: 500,
    name: 'chartTitle',
    enabled: true,
    dataFN: dataFn,
    layerCanvas: 'div',
    attrs: {
      style: "width: 75%; top:0%; left: 12%; padding: 2px; border: 0; text-align: center"
    },
    elements:[
      {
        type: 'div',
        attrs: {class: 'header'},
        append: [
          {
            type: 'h2',
            attrs: {class: 'title-text', style: 'border: 0; margin-bottom: 2px; padding-bottom: 0'},
            text: titleFn
          }]
      }
    ]};

  subtitleFns.forEach(function(f) {
    result.elements[0].append.push({
      type: 'h3',
      attrs: {class: 'title-text', style: 'margin-top: 2px'},
      text: f
    });
  });
  return result;
}

function detailPopup() {

  var posFn = function(el) { var mousepos = d3.mouse(d3.select('body').node()),
        cr = el.getBoundingClientRect(),
        y = mousepos[1] - cr.height - 70,
        x = mousepos[0] - cr.width/2;
    return [x, y];
  };
  var titleFn = function(d){if (d) {return d.label;}};
  var indicators = [ ];
  var actions = [ ];
  var behaviors = {};

  function detailPopup_func() {
    var result = {
      duration: 100,
      kind: 'info',
      name: 'clusterDetail',
      enabled: true,
      dataFN: function () {
        return [];
      },
      layerCanvas: 'div',
      attrs: {
        style: function (d) {
          var pos = posFn(this, d);
          return "top:" + pos[1] + "px; left: " + pos[0] + "px; width: 25%; display:block;";
        },
        class: 'popover top clusterDetail-item'
      },
      elements: [
        {
          type: 'div',
          attrs: {class: 'arrow'}
        },
        {
          type: 'div',
          attrs: {class: 'close'},
          append: [
            {
              type: 'span',
              attrs: {class: 'glyphicon glyphicon-remove'}
            }
          ]
        },
        {
          type: 'h3',
          attrs: {class: 'popover-title'},
          text: titleFn
        },
        {
          type: 'div',
          attrs: {class: 'popover-content'},
          append: [ ]
        }
      ],
      behaviors: behaviors};

    indicators.forEach(function (ind) {
      var labelFn = d3.functor(ind.label), valFn = d3.functor(ind.value);
      result.elements[3].append.push({
        type: 'div',
        attrs: {class: 'indicator'},
        append: [
          {
            type: 'span',
            attrs: {class: 'indicator-label'},
            text: labelFn
          },
          {
            type: 'span',
            attrs: {class: 'indicator-value'},
            text: valFn
          }
        ]
      });
    });

    actions.forEach(function (act) {
      var hrefFn = d3.functor(act.href), targetFn = d3.functor(act.target), labelFn = d3.functor(act.label), iconFn = d3.functor(act.icon);
      result.elements[3].append.push({
        type: 'div',
        attrs: {class: 'action'},
        append: [
          {
            type: 'a',
            attrs: {
              href: hrefFn,
              target: targetFn
            },
            text: labelFn,
            append: [
              {
                type: 'span',
                attrs: {class: function (d) {
                  return 'glyphicon glyphicon-' + iconFn(d);
                }}
              }
            ]
          }
        ]
      });
    });

    return result;
  }

  detailPopup_func.pos = function(position) {
    posFn = d3.functor(position);
    return detailPopup_func;
  };

  detailPopup_func.title = function(title) {
    titleFn = d3.functor(title);
    return detailPopup_func;
  };

  detailPopup_func.ind = function(ind) {
    indicators.push(ind);
    return detailPopup_func;
  };

  detailPopup_func.action = function(act) {
    actions.push(act);
    return detailPopup_func;
  };

  detailPopup_func.behavior = function(event, fn) {
    behaviors[event] = fn;
    return detailPopup_func;
  };

  detailPopup_func.make = function() {
    return detailPopup_func();
  };

  return detailPopup_func;
}

function yearControls(plot) {

  var yearRange;

  function fetchYears(cb) {
    loader.request(base + '/meta/years', function(years) {
      yearRange = d3.extent(years);
      if (cb) {cb(yearRange);}
    });
  }


  function yearControls_func() {
    if (!plot) return;

    if (!yearRange) {
      fetchYears(yearControls);
      return;
    }

    if (!brush) {
      var margin = {top: 20, right: 40, bottom: 20, left: 20},
          width = (plot.drawWidth() * .7) - margin.left - margin.right,
          height = 65 - margin.top - margin.bottom,
          x = d3.time.scale()
            .domain([new Date(yearRange[0], 0, 1), new Date(yearRange[1], 0, 1)])
            .range([0, width]);

      var arc = d3.svg.arc()
        .outerRadius(height / 2)
        .startAngle(0)
        .endAngle(function (d, i) {
          return i ? -Math.PI : Math.PI;
        });
      brush = d3.svg.brush()
        .x(x)
        .extent([new Date(options.start, 0, 1), new Date(options.end, 0, 1)])
        .on("brushend", brushended);

      var svg = d3.select(".year-control").insert("svg", ":first-child")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("rect")
        .attr("class", "grid-background")
        .attr("width", width)
        .attr("height", height);

      svg.append("g")
        .attr("class", "x grid")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(d3.time.years)
          .tickSize(-height)
          .tickFormat(""));

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(d3.time.years)
          .tickPadding(0))
        .selectAll("text")
        .attr("x", 6)
        .style("text-anchor", null);

      gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.event);

      gBrush.selectAll(".resize").append("path")
        .attr("transform", "translate(0," + height / 2 + ")")
        .attr("d", arc);

      gBrush.selectAll("rect")
        .attr("height", height);

    } else {
      gBrush.transition()
        .call(brush.extent([new Date(options.start, 0, 1), new Date(options.end, 0, 1)]))
        .call(brush.event);
    }
  }
}

function parseQuery(q) {
  var result = {},
    parts;
  if (!q) { return result; }
  parts = q.split('&');
  parts.forEach(function(p) {
    var v = p.split('='),
      k = v[0];

    v = v[1];
    if (!v || v.toLowerCase() === 'true') { v = true; }
    else if (v.toLowerCase() === 'false') { v = false; }
    else if (!isNaN(+v)) { v = +v; }

    if (result[k]) {
      if (!result[k].push) {
        result[k] = [result[k]];
      }
      result[k].push(v);
    } else {
      result[k] = v;
    }
  });
  return result;
}

if (!String.prototype.capitalize) {
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width && words.length) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}
