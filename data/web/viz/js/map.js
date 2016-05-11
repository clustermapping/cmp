/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
    defaults = { start: 1998, end: 2011, regionType: 'state' },
    options, settings,
    zoomed;

  var settings = {};
  settings.hbs_dashboard = {data: {region: {} } };
  settings.hbs_content = { };
  settings.hbs_map = {
    countryJson: "/viz/hbs_viz/json/stoutput.json",
    countyJson: "/viz/hbs_viz/json/countiesEasMsas.json",
    dataJson: hbsBaseUrl + "/region/state/all/all",
    mapJson: "/viz/hbs_viz/json/states.json",
    play_carousel: false
  };
  window.Drupal = { settings: settings };

  function resetOptions(defaults){
    options = options || {};
    Object.keys(defaults).forEach(function(d) {
      options[d] = defaults[d];
    });
  }

  function updateOptionsFromHash(render) {
    var h = window.location.hash.substring(2),
      uq = h.split('?'),
      parts = uq[0].split('/'),
      q = parseQuery(uq[1]);
    if (parts.length < 3) {
      console.error("Please specify a hash in the form: /:type/:start/:end");
    }
    resetOptions(defaults);
    
    options.mapType = parts[0];
    options.start = parts[1];
    options.year = parts[2];
    options.regionType = parts[3];
    options.regionCode = parts[4];
    options.cluster = parts[5];
    options.subcluster = parts[6] || 'all';
    options.indicator = parts[7];
    options.zoom = parts[8];

    if (options.mapType == 'carousel') {
      settings.hbs_map.play_carousel = true;
      options.mapType = 'all';
      d3.select('body').classed('carousel', true);
    }

    Object.keys(q).forEach(function(qk) {
      options[qk] = q[qk];
    });

    if (!render) { return; }
  }

  updateOptionsFromHash(false);

  var selector = '#chart',
    year = options.start,
    type = options.mapType,
    color = '';

  function glow(url) {
    var stdDeviation = 2,
      rgb = "#000",
      colorMatrix = "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0";

    if (!arguments.length) {
      url = "glow";
    }

    function my() {

      var defs = this.insert('defs', ':first-child');

      var filter = defs.append("filter")
        .attr("id", url)
        .attr("x", "-20%")
        .attr("y", "-20%")
        .attr("width", "140%")
        .attr("height", "140%")
        .call(function () {
          this.append("feColorMatrix")
            .attr("type", "matrix")
            .attr("values", colorMatrix);
          this.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", stdDeviation)
            .attr("result", "coloredBlur");
        });

      filter.append("feMerge")
        .call(function () {
          this.append("feMergeNode")
            .attr("in", "coloredBlur");
          this.append("feMergeNode")
            .attr("in", "SourceGraphic");
        });
    }

    my.rgb = function (value) {
      if (!arguments.length) return color;
      rgb = value;
      color = d3.rgb(value);
      var matrix = "0 0 0 red 0 0 0 0 0 green 0 0 0 0 blue 0 0 0 1 0";
      colorMatrix = matrix
        .replace("red", color.r)
        .replace("green", color.g)
        .replace("blue", color.b);

      return my;
    };

    my.stdDeviation = function (value) {
      if (!arguments.length) return stdDeviation;
      stdDeviation = value;
      return my;
    };

    return my;
  }

  //SVGs & etc.
  //=======
  var regionGlowDef = glow("region_glow").rgb("#ceef80").stdDeviation(4);
  var map, bars, carousel, plot;
  var loader = new MythosVis.DataLoader();
  var width = 1039,
    height = 674,
    choroplethData = {},
    numFormat = d3.format(',f'),
    perFormat = d3.format('.2%'),
    moneyFormat = d3.format('$,f'),
    lqFormat = d3.format('.2f'),
    stateIdMapping;

  d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
      this.parentNode.appendChild(this);
    });
  };

  function isInt(n) {
    return typeof n === 'number' && n % 1 == 0;
  }

  var HBSHomeRotatorDataManager = function () {
    // settings
    this.mapType = options.mapType;
    this.year = options.year;
    this.start = options.start;
    this.regionType = options.regionType;
    this.regionCode = options.regionCode;

    if (this.regionType === 'custom') {
      this.regionType = 'county';
      this.highlightRegions = true;
    }

    this.cluster = options.cluster || 'all';
    this.subCluster = options.subcluster || 'all';

    // this.indicatorType = options.indicatorType || 'performance';
    this.economicIndicator = options.indicator || 'gdp_per_capita_tf';
    this.colorsForIndicator = ['#4e45c3', "#3ecffc"];
    this.highlight = [];
    this.colors = {};
    this.varTypes = [];
    this.varsList = [];


    this.mapData = {
      state: {
        file: settings.hbs_map.mapJson,
        object: 'states'
      },
      msa: {
        file: settings.hbs_map.countyJson,
        object: 'msas'
      },
      economic: {
        file: settings.hbs_map.countyJson,
        object: 'eas'
      },
      county: {
        file: settings.hbs_map.countyJson,
        object: 'counties'
      }
    };

    this.regionList = [
      {label: "States", legend: 'State', key: "state"},
      {label: "Economic Areas", legend: 'Economic Area', key: "economic"},
      {label: "Metro/Micropolitan Statistical Areas", legend: 'MSA', key: "msa"},
      {label: "Counties", legend: 'County', key: "county"}
    ];
    this.clusterList = [
      {label: "Economy Wide", key: "all", solrkey: 'all'}
    ];
    this.yearList = [];

    // data structures
    this.byCluster = null;
    this.byId = null;
    // this.regionsById = null;
    this.allData = null;

    this.subClusterList = [
      {label: "All", key: "all"}
    ];

    this._currentRegionType = this.regionType;
    var _this = this;

    this.loadMetadata = function (cb) {
      loader.request([hbsBaseUrl + '/meta'], function (metaData) {
        metaData.clusters.forEach(function(c) {
          _this.clusterList.push({label: c.short_name_t, key: c.cluster_code_t, solrkey: c.key_t});

          if ((_this.mapType == 'all' || _this.mapType == 'cluster' || _this.mapType == 'subCluster' ) && c.cluster_code_t == _this.cluster) {
            var subclusters = Object.keys(c.sub_clusters);
            for (var i = 0; i < subclusters.length; i++) {
              var sub_id = subclusters[i];
              _this.subClusterList.push({label: c.sub_clusters[sub_id], key: sub_id});
            }
          }
        });
        metaData.years.forEach(function(y) {
          _this.yearList.push({label: y, key: y});
        });
        _this.varTypes = metaData.dict.varTypes;
        _this.varsList = metaData.dict.vars;
        _this.varsList.forEach(function(v) {
          v.format = d3.format(v.format);
        });
        _this.colors = metaData.dict.colors;
        stateIdMapping = metaData.dict.stateIdMapping;
        if (cb) {
          cb();
        }
      });
    };

    this.sortClusterListbyKey = function(clusterList, sort_key) {
      dataManager.clusterList = clusterList.sort(function(a, b) {
          var x = a[sort_key]; var y = b[sort_key];
          return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      });
    }

    this.getVariable = function (key) {
      return _this.varsList.filter(function (d) {
        return d.key == key;
      })[0];
    };

    this.buildDataAndRedraw = function () {
      map.select('.states-loading').text('Loading...').style({ display: 'inline-block'});
      var l = this.regionType,
        y = this.year,
        s = this.start || 1998,
        v = _this.varsList.filter(function (d) {
          return d.key == _this.economicIndicator;
        })[0],
        requests = [];
      _this.indicatorType = _this.indicatorType || (_this.getVariable(_this.economicIndicator) ? _this.getVariable(_this.economicIndicator).mapTypes[0] : "performance");

      requests.push(hbsBaseUrl + '/report/map/' + [l, s, y, _this.cluster, _this.subCluster, _this.economicIndicator].join('/'));
      requests.push(_this.mapData[_this.regionType].file);

      if (!v) return;
      var metaIndicatorUrl = hbsBaseUrl + '/meta/indicator/' + (v.range ? v.range_source : v.key);
      if (_this.cluster) metaIndicatorUrl += '/' + _this.cluster;
      if (_this.subCluster) metaIndicatorUrl += '/' + _this.subCluster;
      requests.push(metaIndicatorUrl);
      loader.request(requests, function () {
          var a = arguments[0];
          var geoData = arguments[1], lq75, shares, share25, share90;
          var start = arguments[2];
          _this.dataByRegionYear = arguments[arguments.length -1];
          if (! _this.validateData()) {
            if (_this.selectValidData()) {
              _this.buildDataAndRedraw();
              return false;
            }
          }

          if (v && v.range && !start) {
            start = geoData;
            geoData = undefined;
          }

          if (geoData !== undefined) {
            var mapLayer = plot.layer('states');
            mapLayer.config.layerElem.selectAll("path.states-item").remove();
            mapLayer.geoSource = _this.mapData[_this.regionType].file;
            mapLayer.geoPaths = geoData;
            mapLayer.objectType = mapLayer.config.objectType = _this.mapData[_this.regionType].object;
            _this._currentRegionType = _this.regionType;
          } else {
            var mapLayer = plot.layer('states');
            mapLayer.config.layerElem.selectAll("path.states-item").remove();
          }

          if (_this.cluster === 'all') {

            a.forEach(function (d) {
              d.region_name_t = d.name_t;
              d.cluster_code_t = 'all';
            });
          } else {
            if (_this.economicIndicator === 'specialization_tl') {
              var emps = a.map(function (d) {
                return d.emp_tl;
              }).sort(d3.ascending);
              var lq75 = d3.quantile(a.map(function (d) {
                return d.lq_tf;
              }).sort(d3.ascending), .75);
              var share25 = d3.quantile(emps, .25);
              var est25 = d3.quantile(a.map(function (d) {
                return d.est_tl;
              }).sort(d3.ascending),.25);
              share90 = d3.quantile(emps, .90);
              a.forEach(function (d) {
                var highEmpSpec = false, highEmpShare = false;
                if (d.empt_tl <= 0) d.specialization = -1;

                if (d.emp_tl > 0) {
                  if (d.lq_tf > lq75 && d.lq_tf > 1.0 && d.emp_tl > share25 && d.est_tl > est25) {
                    highEmpSpec = true;
                  }

                  if (d.emp_tl >= share90) {
                    highEmpShare = true;
                  }
                }

                if (highEmpShare && highEmpSpec) {
                  d.specialization_tl = 1
                }
                else if (highEmpSpec) {
                  d.specialization_tl = 0
                }
                else if (highEmpShare) {
                  d.specialization_tl = -1
                }
                else {
                  d.specialization_tl = NaN
                }
              });
            }
          }

          _this.allData = a;

          _this.byCluster = d3.nest()
            .key(function (d) {
              return d.cluster_code_t;
            })
            .key(function (d) {
              return d.region_code_t;
            })
            .map(_this.allData, d3.map);

          _this.byRegionId = d3.nest()
            .key(function (d) {
              return d.region_code_t;
            }).rollup(function (ds) {
              return ds[0]
            })
            .map(_this.allData, d3.map);

          _this.byId = _this.byCluster.get(_this.cluster);

          choroplethData = _this.byId;
          d3.select(selector + " .map-view").datum(choroplethData);

          var aLayer = plot.layer('states');

          if (v && v.colors) {
            var vc = v.colors;
            _this.colorsForIndicator = v.colors.palette;
          }

          plot.update();

          plot.layer('mapTitle').config.dataFN = function () {
            return [
              {year: _this.year, start: _this.start, regionType: _this.regionType, cluster: _this.cluster, economicIndicator: _this.economicIndicator}
            ];
          };
          plot.layer('mapTitle').draw();
          plot.layer('downloadControls').config.dataFN = function () {
            return [{year: _this.year, start: _this.start, regionType: _this.regionType, cluster: _this.cluster, subcluster:_this.subcluster, economicIndicator:_this.economicIndicator}];
          };
          plot.layer('downloadControls').draw();

          if (_this.economicIndicator == 'specialization_tl') {
            plot.layer('simpleLegendThree').config.dataFN = function () {
              return [];
            };
            plot.layer('enumLegendThree').config.dataFN = function () {
              return [
                {colors: vc}
              ]
            };
          } else {
            if (v && v.format) {
              plot.layer('enumLegendThree').config.dataFN = function () {
                return [];
              };
              var acc = function (d) {
                  return d[_this.economicIndicator]
                },
                ld = d3.extent(_this.allData, acc),
                formatter = v.format,
                data = {format: formatter, min: ld[0], max: ld[1], colors: vc};
              if (ld[0] >= 0) {
                data.middle = d3.median(_this.allData, acc)
              }
              plot.layer('simpleLegendThree').config.dataFN = function () {
                return [data];
              };
            }
          }

          plot.layer('simpleLegendThree').draw();
          plot.layer('enumLegendThree').draw();
          carousel.dataUpdate(_this);

          if (options.regionType === 'custom') {
            loader.request([hbsBaseUrl + '/region/custom/' + _this.regionCode + '/' + _this.year], function (result) {
              if (result && result.regions_txt && result.regions_txt instanceof Array) {
                aLayer.unFocus();
                aLayer.highlight(result.regions_txt.map(function(d) {return d.slice(-5);}));
              }
            });

          } else if (_this.highlight && _this.highlight.length) {
            aLayer.unFocus();
            aLayer.highlight(_this.highlight);

          } else if (Number(_this.regionCode) > 0) {
            if (aLayer.hasOwnProperty('config')) {
              aLayer.config.group
                .each(function (d, i) {
                  if (Number(d.id) == Number(_this.regionCode)) {
                    aLayer.focus(d);
                  }
                });
            }
            aLayer.highlight(_this.regionCode);

          } else {
            aLayer.unFocus();
            aLayer.highlight([]);
          }

          if (options.zoom) {
            var z = options.zoom.split('_');
            aLayer.zoomTo(+z[0], +z[1], +z[2]);
            zoomMiscComponents(+z[0], +z[1], +z[2]);
          } else {
            zoomMiscComponents();
          }
          if (dataManager.updating) {
            dataManager.updating = false;
          } else {
            map.select('.states-loading').style({ display: 'none'});
          }
        }
      );
      if (_this.regionType == 'state') {
        d3.selectAll('.layer-states-background').style('display', 'none');
      } else {
        d3.selectAll('.layer-states-background').style('display', 'block');
      }
    };
  
    this.selectValidData = function() {
      var _this = this;
      var r = _this.regionType,
        validRegionTypes = ['state', 'economic', 'msa', 'county'];
      if (selectValidYears(r)) {
        return true;
      } else {
        for (var i = 0; i < validRegionTypes.length; i++) {
          if (r == validRegionTypes[i]) continue;
          if (selectValidYears(validRegionTypes[i])) {
            _this.regionType = validRegionTypes[i];
            return true;
          }
        }
      }

      function selectValidYears(r) {
        if (!_this.dataByRegionYear[r]) return false;
        var years = _this.yearList.map(function(d) { return +d.key; }).sort();
        var valid;
        for (var i = years.length -1; i >= 0; i--) {
          var y = years[i];
          if (_this.dataByRegionYear[r][y] >= 2) {
            _this.year = y;
            valid = true;
            break;
          }
        }
        if (dataManager.getVariable(dataManager.economicIndicator).range) {
          valid = false;
          for (var i = 0; i < years.length; i++) {
            var y = years[i];
            if (_this.dataByRegionYear[r][y] >= 2) {
             _this.start = y;
              valid = true;
              break;
            }
          }
        }
        return valid;
      }
    };
  
    this.validateData = function() {
      var r = this.regionType,valid_end, valid_start;
      if (! this.dataByRegionYear || !this.dataByRegionYear[r]) return false;

      valid_end = this.dataByRegionYear[r][this.year];
      valid_start = this.dataByRegionYear[r][this.start];
      if (isNaN(valid_end) || valid_end <= 1) return false;
      if (dataManager.getVariable(dataManager.economicIndicator).range) {
        if (isNaN(valid_start) || valid_start <= 1) return false;
      }
      return true;
    };
  };

  function zoomMiscComponents(x, y, k) {
    var countriesLayer = plot.layer('countries'),
      stateLayer = plot.layer('states'),
      layer = (countriesLayer.focusedElement !== null ? countriesLayer : stateLayer),
      projection = layer.config.projection,
      zoomed = (layer.focusedElement !== null),
      width = plot.width(),
      height = plot.height(),
      duration = layer.config.duration - 200, // Adjust duration to account for slight delay in processing the zoom.
      x, y, k;

    if (x && y && k) {
      duration = 0;

    } else if (zoomed) {
      var centroid = projection(d3.geo.centroid(layer.focusedElement));
      x = layer.zoomX;
      y = layer.zoomY;
      k = layer.zoomK;
      var zoomFactor = Math.round(layer.zoomK/10);
      if (zoomFactor > 10) zoomFactor = 10;
      map.attr('class', 'map-view zoom' + zoomFactor)
    } else {
      x = width / 2;
      y = height / 2;
      k = 1;
    }

    d3.select('g#graticule')
      .interrupt()
      .transition()
      .duration(duration)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + (-x) + "," + -y + ")");

    d3.select('#breakoutRects')
      .interrupt()
      .transition()
      .duration(duration)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + (-x) + "," + -y + ")");
  }

  var dataManager = new HBSHomeRotatorDataManager(),
    hbsProjection = d3AlbersUsaPr().translate([width / 2 + 100, height / 2]),
    basePath = d3.geo.path().projection(hbsProjection.baseProjection());

  var regionDetailElems = [
        {
          type: 'div',
          attrs: {class: 'region-type'},
          append: [
            {
              type: 'span',
              text: function (d) {
                if (d) {
                  return "Region Type: ";
                }
              }
            },
            {
              type: 'span',
              attrs: {class: 'region-type-label'},
              text: function (d) {
                if (d && d[0]) {
                  var type = d[0].region_type_t;
                  return type.charAt(0).toUpperCase() + type.slice(1);
                }
              }
            }
          ]
        },
        {
          type: 'div',
          attrs: {class: 'header'},
          append: [
            {
              type: 'h3',
              attrs: {class: 'title-text'},
              text: function (d) {
                if (d && d[0]) {
                  return d[0].region_short_name_t;
                }
              }
            }
          ]
        },
        {
          type: 'div',
          attrs: {class: 'indicators'},
          append: [
            {
              type: 'div',
              attrs: {style: function() { return "display:" + (dataManager.economicIndicator == 'emp_tl' ? "none":""); }},
              append: [
                {
                  type: 'div',
                  attrs: {class: 'indicator-label'},
                  text: function (d) {
                    if (dataManager.economicIndicator && d && d[0] && d[0][dataManager.economicIndicator]) {
                      var v = dataManager.getVariable(dataManager.economicIndicator);
                      if (v && v.label != 'Specialization') {
                        return v.label;
                      }
                    }
                  }
                },
                {
                  type: 'h3',
                  text: function (d) {
                    if (dataManager.economicIndicator && d && d[0] && d[0][dataManager.economicIndicator]) {
                      var v = dataManager.getVariable(dataManager.economicIndicator);
                      if (v && v.label != 'Specialization') {
                        return v.format(d[0][dataManager.economicIndicator]);
                      }
                    }
                  }
                }
              ]
            },
            {
              type: 'div',
              append: [
                {
                  type: 'div',
                  attrs: {class: 'indicator-label'},
                  text: function (d) {
                    if (d && d[0] && d[0].emp_tl) {
                      return "Employment";
                    }
                  }
                },
                {
                  type: 'h3',
                  text: function (d) {
                    if (d && d[0] && d[0].emp_tl) {
                      return numFormat(d[0].emp_tl);
                    }
                  }
                }
              ]
            },
            {
              type: 'div',
              append: [
                {
                  type: 'div',
                  attrs: {class: 'indicator-label'},
                  text: function (d) {
                    if (d && d[0] && d[0].emp_creation_rank_i) {
                      return "National Employment Rank";
                    }
                  }
                },
                {
                  type: 'h3',
                  text: function (d) {
                    if (d && d[0] && d[0].emp_creation_rank_i) {
                      return numFormat(d[0].emp_creation_rank_i);
                    }
                  }
                }
              ]
            },
            {
              type: 'div',
              append: [
                {
                  type: 'div',
                  attrs: {class: 'indicator-label'},
                  text: function (d) {
                    if (d && d[0] && d[0].private_wage_tf) {
                      return "Wages";
                    }
                  }
                },
                {
                  type: 'h3',
                  text: function (d) {
                    if (d && d[0] && d[0].private_wage_tf) {
                      return moneyFormat(d[0].private_wage_tf);
                    }
                  }
                }
              ]
            },
            {
              type: 'div',
              append: [
                {
                  type: 'div',
                  attrs: {class: 'indicator-label'},
                  text: function (d) {
                    if (d && d[0] && d[0].lq_tf) {
                      return "Specialization (Location Quotient)";
                    }
                  }
                },
                {
                  type: 'h3',
                  text: function (d) {
                    if (d && d[0] && d[0].lq_tf) {
                      return lqFormat(d[0].lq_tf);
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'div',
          attrs: {class: 'more-link'},
          append: [
            {
              type: 'a',
              attrs: {target: '_parent', href: function (d) {
                if (d && d[0]) {
                  return typeof settings.hbs_dashboard != 'undefined' && settings.hbs_dashboard == 'cluster' ? '/region-cluster/'+ settings.hbs_dashboard.data.cluster.key_t + '/' + d[0].region_type_t + '/' + d[0].region_key_t
                    :'/region/' + d[0].region_type_t + '/' + d[0].region_key_t;
                }
              }},
              text: function (d) {
                return typeof settings.hbs_dashboard != 'undefined' && settings.hbs_dashboard == 'cluster' ? 'Go to Region’s Cluster Dashboard': "Go to Region Dashboard";
              }
            }
          ]
        }
      ];

  plot = d3Plot()
    .width(width)
    .height(height)
    .scale('fill', {
      attrs: {
        interpolate: function () {
          return d3.interpolateHcl;
        },
        range: function () {
          return dataManager.colorsForIndicator;
        },
        domain: function () {
          if (dataManager.byId) {
            var acc = function (d) {
                return d[0][dataManager.economicIndicator]
              },
              vals = dataManager.byId.values(),
              min = d3.min(vals, acc),
              max = d3.max(vals, acc),
              middle = d3.median(vals, acc);
            var domain = [];

            if (min < 0) {
              var incMin = (0 - min) / 5;
              for (var i = 1; i <= 5; i++) {
                domain.push(incMin * i + min);
              }
              var incMax = max / 4;
              for (var i = 1; i <= 4; i++) {
                domain.push(incMax * i);
              }
            } else {
              var increment = (max - min) / 10;
              for (var i = 1; i <= 9; i++) {
                domain.push(increment * i + min)
              }
            }
            return domain;
          }
          return [0, 0];
        }
      }
    })
    .layer('countries', {
      kind: 'map',
      name: 'countries',
      geoSource: settings.hbs_map.countryJson,
      objectType: "nonUsStates",
      projection: hbsProjection.baseProjection(),
      behaviors: {
        click: function (d, i) {
          return false;
          var layer = plot.layer('countries');
          if (layer.focusedElement !== d) {
            layer.focus(d);
            layer.highlight(d.id);
          } else {
            layer.unFocus();
            layer.highlight([]);
          }
        },
        focus: function (d, i) {
          return false;
          if (plot.layer('countries').focusedElement !== d) {
            plot.layer('countries').focus(d);
            plot.layer('countries').highlight(d.id);
          }
          carousel.pause(1);
          zoomMiscComponents();
          var layer = plot.layer('regionDetail');
          if (d.region_type_t) {
            layer.config.dataFN = function () {
              return [d];
            };
          } else {
            layer.config.dataFN = function () {
              return [];
            };
          }
          layer.draw();
        },
        unfocus: function () {
          carousel.pause(0);
          var layer = plot.layer('regionDetail');
          layer.config.dataFN = function () {
            return [];
          };
          zoomMiscComponents();
          layer.draw();
        }
      }
    })
    .layer('states', {
      kind: 'choroplethMap',
      name: 'states',
      geoSource: settings.hbs_map.mapJson,
      objectType: /*dataManager.mapData[dataManager.regionType].object ||*/ "states",
      projection: hbsProjection,
      dataMapping: function (item, data, scales) {
        var ds = data.get(item.id),
          d = ds ? ds[0] : undefined;
        if (d) return d;
        return false;
      },
      dataStyling: function (item, data, scales) {
        var returnData = {};
        var ds = data.get(item.id),
          d = ds ? ds[0] : undefined,
          v = d ? d[dataManager.economicIndicator] : undefined,
          fill = scales.get('fill').scale(v);
        var domain = scales.get('fill').scale.domain(),
          min = domain[0],
          max = domain[3],
          increase = (max - min) / 9,
          range = Math.floor((v - min) / increase);
        var scale = d3.scale.threshold().domain(domain).range(dataManager.colorsForIndicator);
        fill = min && max && v != null ? scale(v) : undefined;
        if (fill !== '#000000') {
          returnData.fill = fill;
        }
        return returnData;
      },
      behaviors: {
        click: function (d, i) {
          var layer = plot.layer('states');

          if (layer.focusedElement !== d) {
            carousel.pause(1);
            layer.focus(d);
            layer.highlight(d.id);
          } else {
            carousel.pause(0);
            layer.unFocus();
            layer.highlight([]);
          }
        },
        mousemove: function (d, i) {
          var container = document.getElementById('chart'),
            x = (d3.event.x - 80)+ 'px',
            y = (d3.event.y + 16)+ 'px';
          d3.select('.states-tooltip')
            .style({top: y, left: x, display: 'inline-block'});
        },
        mouseover: function (d, i) {
          if (!dataManager.byRegionId) return;
          var div = d3.select('.states-tooltip').html(''),
            r = dataManager.byRegionId.get(d.id),
            v = dataManager.getVariable(dataManager.economicIndicator),
            value = r[v.key] ? v.format(r[v.key]) : 'N/A';
          div.append('div').classed('title', true).text(r.region_short_name_t);
          div.append('div').classed('indicator-label', true).text(v.label);
          if (dataManager.economicIndicator === 'specialization_tl') {
            value = lqFormat(r['lq_tf']);
          }
          div.append('div').classed('indicator-value', true).text(value);
        },
        mouseout: function (d, i) {
          d3.select('.states-tooltip').style({display:'none'});
        },
        mouseleave: function (d, i) {
          d3.select('.states-tooltip').style({display:'none'});
        },
        focus: function (d, i) {
          if (d.region_code_t) {
            dataManager.regionCode = d.region_code_t;
          }
          if (plot.layer('states').focusedElement == null) {
            carousel.pause(1);
            plot.layer('states').focus(d);
            plot.layer('states').highlight(d.id);
          } else {
            var layer = plot.layer('regionDetail');
            var data = choroplethData.get(d.id);
            layer.config.dataFN = function () {
              return [data || [d]];
            };
            zoomMiscComponents();
            layer.draw();
          }
          plot.layer('downloadControls').draw();
        },
        unfocus: function () {
          dataManager.regionCode = '0';
          plot.layer('downloadControls').draw();
          var layer = plot.layer('regionDetail');
          layer.config.dataFN = function () {
            return [];
          };
          zoomMiscComponents();
          layer.draw();
        }
      }
    })
    .layer('statesBackground', {
      kind: 'map',
      name: 'states-background',
      geoSource: settings.hbs_map.mapJson,
      objectType: "states",
      projection: hbsProjection
    })
    .layer('mapTitle', {
      kind: 'info',
      name: 'mapTitle',
      enabled: true,
      dataFN: function () {
        return [];
      },
      layerCanvas: 'div',
      attrs: { hidden: function () {
        return null;
      } },
      elements: [
        {
          type: 'div',
          attrs: {class: 'map-title' },
          append: [
            {
              type: 'span',
              html: function (d) {
                var v = dataManager.getVariable(d.economicIndicator),
                  year = (v.range ? d.start + '-' + d.year : d.year),
                  region = dataManager.regionList.filter(function (r) {
                    return r.key == d.regionType
                  })[0],
                  regionType = (region ? region.legend : ''),
                  clusters = (d.cluster == 'all' ? 'All Clusters'
                    : (  dataManager.clusterList.filter( function (c) {return c.key == d.cluster;} )[0].label ) ),
                  subcluster = ( d.cluster != 'all' &&  dataManager.subCluster != 'all')?  dataManager.subClusterList[dataManager.subCluster].label + " Subcluster ": '',
                  indicator = v.label;
                if (dataManager.indicatorType != 'cluster' && d.cluster == 'all' ) {
                  clusters = '';
                  subcluster = '';
                } else {
                  clusters = " in " + clusters + ' Cluster' + (subcluster != ''? ", " : '') ;
                }

                return indicator + ' ' + clusters + "<br>" + subcluster + "by " + regionType + ", " + year;
              }
            }
          ]
        }
      ]
    })
    .layer('simpleLegendThree', {
      kind: 'info',
      name: 'simpleLegendThree',
      enabled: true,
      dataFN: function () {
        return []
      },
      layerCanvas: 'div',
      attrs: { hidden: function () {
        return null;
      } },
      elements: [
        {
          type: 'div',
          attrs: {class: 'legend-three', style: function(d) { if (!d.min && !d.max) { return 'display:none;'; } return '' }},
          append: [
            {
              type: 'div',
              append: [
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[0]+ ';'; } } },
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[1]+ ';'; } } },
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[2]+ ';'; } } },
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[3]+ ';'; } } },
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[4]+ ';'; } } },
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[5]+ ';'; } } },
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[6]+ ';'; } } },
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[7]+ ';'; } } },
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[8]+ ';'; } } },
                { type: 'span', attrs: {style: function(d) { return 'display:inline-block;width:10%;height:15px;background:' +d.colors.palette[9]+ ';'; } } },
              ],
              attrs: {
                style: "height: 15px; margin: 5px;"
              }
            },
            { type: 'div', attrs: {class: 'legend-two-min', style: 'width: 33%; text-align:left; float:left'}, text: function (d) {
              return d.format(d.min);
            }},
            { type: 'div', attrs: {class: 'legend-two-min', style: 'width: 33%; text-align:center; float:left'}, text: function (d) {
              return (d.middle ? "med=" + d.format(d.middle) : '0');
            }},
            { type: 'div', attrs: {class: 'legend-two-max', style: 'width: 33%; text-align:right; float:right'}, text: function (d) {
              return d.format(d.max);
            }}
          ]
        }, 
        {
          type: 'div',
          attrs: { class: 'legend-three', style: function(d) { if (d.min || d.max) { return 'display:none;'; } return 'text-align:center;' } },
          text: 'There is no data for the parameters selected.'
        }
      ]
    })
    .layer('enumLegendThree', {
      kind: 'info',
      name: 'enumLegendThree',
      enabled: true,
      dataFN: function () {
        return []
      },
      layerCanvas: 'div',
      elements: [
        {
          type: 'div',
          attrs: {class: 'legend-three'},
          append: [
            {
              type: 'div',
              attrs: {style: "clear:both"},
              append: [
                {type: 'div', attrs: {style: function (d) {
                  return "height: 15px; width: 15px; margin: 3px; float: left; background-color:" + d.colors.max;
                }}},
                {type: 'div', attrs: {style: function (d) {
                  return "padding: 3px; float: left;font-size: 14px; color: #777d85";
                }}, text: "High Employment Specialization and Share"}
              ]
            },
            {
              type: 'div',
              attrs: {style: "clear:both"},
              append: [
                {type: 'div', attrs: {style: function (d) {
                  return "height: 15px; width: 15px; margin: 3px; float: left; background-color:" + d.colors.zero;
                }}},
                {type: 'div', attrs: {style: function (d) {
                  return "padding: 3px; float: left; font-size: 14px; color: #777d85";
                }}, text: "High Employment Specialization"}
              ]
            },
            {
              type: 'div',
              attrs: {style: "clear:both"},
              append: [
                {type: 'div', attrs: {style: function (d) {
                  return "height: 15px; width: 15px; margin: 3px; float: left; background-color:" + d.colors.min;
                }}},
                {type: 'div', attrs: {style: function (d) {
                  return "padding: 3px; float: left; font-size: 14px; color: #777d85";
                }}, text: "High Employment Share"}
              ]
            }
          ]
        }
      ]
    })
    .layer('regionDetail', {
      kind: 'info',
      name: 'regionDetail',
      enabled: true,
      dataFN: function () {
        return [];
      },
      layerCanvas: 'div',
      elements: regionDetailElems
    })
    .layer('downloadControls', {
      kind: 'info',
      name: 'downloadControls',
      enabled: true,
      dataFN: function() { return [dataManager] },
      layerCanvas: 'div',
      attrs: {
        style: function() {
          if (navigator.userAgent.indexOf('PhantomJS') < 0) {
            return 'position:absolute; top:auto; bottom: 26px; left: 4px; padding: 0; margin: 0 10px 10px 0; border: 0; min-width:0; width: 140px';
          } else {
            return 'display:none;';
          }
        }
      },
      elements: [
        {
          type: 'a',
          attrs: {role: 'button', class:'btn btn-default control-share', title: "Embed map", style: "margin-right: 4px", 
            'data-toggle': '','onclick':'jQuery(\'#map-share-tooltip\').show().find(\'input\').select().focus();'
          },
          append: [{ type: 'span', attrs: {class: 'glyphicon glyphicon-share'}}]
        },
        {
          type: 'div',
          attrs: {id:'map-share-tooltip',class: 'form-group popover fade top in', title: "Download selected data", style: "margin-top:-90px;margin-left:0px;padding:10px 12px;height:80px;width:280px;" },
          append: [
            { type: 'label', text: 'Embed map', attrs: {class: 'control-label'}},
            { type: 'a', attrs: {class: 'close small', 'onclick':'javascript:jQuery(\'#map-share-tooltip\').hide();' }, append: [{ type: 'span', attrs: {class: 'glyphicon glyphicon-remove pull-right small', 'data-dismiss':'popover', }} ], },
            {
              type: 'input', attrs: { class: 'form-control', type: 'text', style:'margin-top:10px;', onfocus: 'this.select();', onclick: 'this.select();', 
                value: function(d) { 
                  var height = $(window).height(), width = $(window).width();
                  return '<iframe width="' + width + '" height="' + height + '" src="' + mapUrl(d, 'share') + '" frameborder="0" allowfullscreen></iframe>'; }}
            }
          ]
        },
        {
          type: 'a',
          attrs: {role: 'button', class:'btn btn-default control-download', title: "Download selected data", style: "margin-right: 4px",
            onclick: function(d) { 
              if (dataManager.legendData && isNaN(dataManager.legendData.min) && isNaN(dataManager.legendData.max)) {
                return "$('#map-csv-download-tooltip').show().delay(9000).fadeOut();"
              }
              return 'javascript:;'
            },
            href: function(d) {
              if (dataManager.legendData && isNaN(dataManager.legendData.min) && isNaN(dataManager.legendData.max)) {
                return 'javascript:;'
              }
              return mapUrl(d, 'csv');
            }
          },
          append: [{ type: 'span', attrs: {class: 'glyphicon glyphicon-download' }}]
        },
        {
          type: 'div',
          attrs: {id:'map-csv-download-tooltip',class: 'popover fade bottom in', title: "Download selected data", style: "margin-top:-60px;margin-right:180px;padding:10px 12px;width:180px;text-align:center;" },
          text: 'There is no data for the parameters selected.',
        },
        {
          type: 'a',
          attrs: {role: 'button', class:'btn btn-default control-picture', title: "Download map image", href: function(d) { 
            return mapUrl(d, 'png')}},
          append: [{ type: 'span', attrs: {class: 'glyphicon glyphicon-picture'}}]
        }
      ]
    });

  var mapUrl = function(d, suffix) {
    var url = hbsBaseUrl + '/report/map',
        l = plot.layer('states'),
        zoom = l.zoomX && l.zoomY && l.zoomK ? '/' + [l.zoomX, l.zoomY, l.zoomK].join('_') : '';
    if (suffix == 'csv') {
      url += '/' + d.regionType + '/' + d.start + '/' + d.year + '/' + dataManager.cluster + '/' + dataManager.subCluster + '/' + d.economicIndicator;
    
    } else if (suffix == 'share') {
      url += '#/' + dataManager.mapType + '/' + d.start + '/' + d.year
          + '/' + d.regionType + '/' + dataManager.regionCode
          + '/' + dataManager.cluster + '/' + dataManager.subCluster
          + '/' + d.economicIndicator
          + zoom;
      return document.location.origin + url;

    } else if (suffix == 'png') {
      url += '/' + dataManager.mapType + '/' + d.start + '/' + d.year
          + '/' + d.regionType + '/' + dataManager.regionCode
          + '/' + dataManager.cluster + '/' + dataManager.subCluster
          + '/' + d.economicIndicator
          + zoom;
    }
    return url + '/' + suffix;
  };

  map = d3.select(selector)
    .append('div')
    .classed('map-view', true)
    .datum(choroplethData)
    .call(plot);

  map.append('div').attr('class', 'states-tooltip layer info');
  map.append('div').attr('class', 'states-loading layer info').text('Loading...');
  
  if (navigator.userAgent.indexOf('PhantomJS') < 0) {
    var threshold = 20;
    var nav = map.append('div').attr('class', 'nav-controls');
    var pan = nav.append('div').classed('pan-control', true);
    var btn = pan.append('button').classed('pan-left', true);
    btn.append('span').classed('glyphicon glyphicon-chevron-left', true)
    btn.on('click', function(e) {
      applyZoom(-threshold, 0, 1);
    });
    var btn = pan.append('button').classed('pan-right', true);
    btn.append('span').classed('glyphicon glyphicon-chevron-right', true)
    btn.on('click', function(e) {
      applyZoom(threshold, 0, 1);
    });
    var btn = pan.append('button').classed('pan-up', true);
    btn.append('span').classed('glyphicon glyphicon-chevron-up', true)
    btn.on('click', function(e) {
      applyZoom(0, -threshold, 1);
    });
    var btn = pan.append('button').classed('pan-down', true);
    btn.append('span').classed('glyphicon glyphicon-chevron-down', true)
    btn.on('click', function(e) {
      applyZoom(0, threshold, 1);
    });

    var btn = nav.append('button').classed('btn btn-default', true);
    btn.append('span').classed('glyphicon glyphicon-minus', true)
    btn.on('click', function(e) {
      applyZoom(0, 0, 0.9);
    });
    var btn = nav.append('button').classed('btn btn-default', true);
    btn.append('span').classed('glyphicon glyphicon-plus', true)
    btn.on('click', function(e) {
      applyZoom(0, 0, 1.1);
    });
  }

  function applyZoom(dx, dy, dk) {
    var layer = plot.layer('states');
    if (!layer.zoomX && !layer.zoomY) layer.unFocus();

    var dur = layer.plot.duration(),
      x = layer.zoomX ? layer.zoomX + dx : dx,
      y = layer.zoomY ? layer.zoomY + dy : dy,
      k = layer.zoomK ? layer.zoomK * dk : (dk || 1);
    layer.plot.duration(0);
    zoomMiscComponents(x, y, k);
    layer.zoomTo(x, y, k)
    layer.plot.duration(dur);
    plot.layer('downloadControls').draw();
  }

  // Add credit line under all maps.
  map.append('div')
    .attr('class', 'chart-credits chart-credits--map')
    .html('Source: <a href="http://clustermapping.us/" target="_top">U.S. Cluster Mapping Project</a>, ' +
      'Institute for Strategy and Competitiveness, Harvard Business School. <a href="/content/data-sources-and-limitations" target="_top">Data Sources</a>');

  plot.svg().call(regionGlowDef);

  var graticule = d3.geo.graticule()
    .extent([
      [-98 - 50, 38 - 50],
      [-98 + 50, 38 + 50]
    ])
    .step([5, 5]);

  //var region_glow = glow("region_glow").rgb("#0f0").stdDeviation(4);

  //d3.select(selector + " svg")
  //  .call(region_glow);
  d3.select(selector + " svg g").insert("g", '.layer-countries').attr("id", "graticule")
    .append("path").datum(graticule).attr("class", "graticule").attr("d", basePath);

  d3.select(selector + " svg g")
    .insert("g", '.layer-states')
    .attr("id", "breakoutRects")
    .selectAll("rect")
    .data(hbsProjection.clips())
    .enter().append("rect")
    .attr({
      x: function (d) {
        return d[0][0];
      },
      y: function (d) {
        return d[0][1];
      },
      width: function (d) {
        return d[1][0] - d[0][0];
      },
      height: function (d) {
        return d[1][1] - d[0][1];
      },
      style: "fill: white; stroke: #eee; stroke-width: 2"
    });

  dataManager.loadMetadata(function() {
    dataManager.buildDataAndRedraw(dataManager.year, dataManager.regionType);
  });

  var fields = (dataManager.mapType == "region") ? {'subCluster': 0, 'economicIndicator': 0, 'indicatorType': 0, 'year': 0, 'start': 0, 'cluster': 0, 'organizationType': 0 }
    : (dataManager.mapType == "cluster" && settings.hbs_dashboard.tab == 'subClusters') ? { 'indicatorType': 0, 'organizationType': 0, 'cluster': 0, 'subCluster': 1, 'economicIndicator': 1 }
    : (dataManager.mapType == "subCluster") ? { 'indicatorType': 0, 'organizationType': 0, 'cluster': 0, 'subCluster': 0, 'economicIndicator': 1 }
    : (dataManager.mapType == "cluster") ? {'subCluster': 0, 'indicatorType': 0, 'organizationType': 0, 'cluster': 0, 'economicIndicator': 1 }
    : (dataManager.mapType == "region-cluster") ? {'subCluster': 0, 'indicatorType': 0, 'organizationType': 0, 'cluster': 0, 'economicIndicator': 1 }
    : {'subCluster': 0, 'cluster': 0, 'organizationType': 0 };

  var homepage_stories_dummy_data = [
      {
          "id":2794,
          "headline":"U.S. Commerce Secretary Penny Pritzker champions U.S. Cluster Mapping site",
          "abstract":"<p>\"Our cluster mapping tool gives us the ability to <a href=\"http://www.commerce.gov/news/secretary-speeches/2014/07/14/us-secretary-commerce-penny-pritzker-delivers-remarks-power-and-p\" style=\"text-decoration:none\" target=\"_blank\"><b><span style=\"color: rgb(0, 192, 251);\">reinvent and modernize</span></b></a> economic development strategies – all driven by open data.  Local officials are using it to make strategic investments, recruit new companies, and lay the groundwork for new industries.\"</p>\n",
          "map":{
              "region_type":"economic",
              "map_key":"gdp_per_capita_tf",
              "cluster":"all",
              "highlight":[0],"year":2012
          }
      },
      {
          "id":2737,
          "headline":"New U.S. Cluster Mapping Tool Launched in Minneapolis",
          "abstract":"<p>The new U.S. Cluster Mapping tool was launched on September 29th as part of a two-day conference called <a href=\"http://www.cce.umn.edu/mapping-the-midwest-future/\" style=\"color: rgb(64, 97, 182); text-decoration: none; font-weight: bold;\" target=\"_blank\">Mapping the Midwest Future</a>, hosted by the University of Minnesota's Humphrey School of Public Affairs. The conference hosted over 200 attendees from 12 Midwest states and four Canadian provinces.  <a href=\"http://www.hbs.edu/news/releases/Pages/michael-porter-improve-economic-development.aspx\" style=\"color: rgb(0, 192, 251); text-decoration: none; font-weight: bold;\" target=\"_blank\">Learn more</a></p>\n",
          "map":{
              "region_type":"state",
              "map_key":"innovation_gr",
              "cluster":"all",
              "highlight":[27],"year":2012,"start":2007
          }
      },
      {
          "id":2736,
          "headline":"The Midwest: Where things are made",
          "abstract":"<p>Featured in the <a href=\"http://www.startribune.com/opinion/commentaries/274541931.html\" style=\"text-decoration: none;\" target=\"_blank\"><b><span style=\"color: rgb(0, 192, 251);\">Minneapolis StarTribune</span></b></a>, this commentary by our regional partner Lee Munnich profiles the U.S. Cluster Mapping tool, which reveals a fascinating picture of manufacturing clusters fueling a regional economic rebound in the Midwest.</p>\n",
          "map":{
              "region_type":"economic",
              "map_key":"emp_creation_tl",
              "cluster":40,"highlight":[0],"year":2012,"start":2009
          }
      },
      {
          "id":2735,
          "headline":"\"Defining Clusters of Related Industries\" (Delgado, Porter, Stern 2014) released as an NBER Working Paper",
          "abstract":"<p>This paper developed the novel clustering algorithm that drives the set of cluster definitions on the U.S. Cluster Mapping site.  <a href=\"http://www.nber.org/papers/w20375?utm_campaign=ntw&amp;utm_medium=email&amp;utm_source=ntwutm_source=ntw\" style=\"color: rgb(0, 192, 251); text-decoration: none; font-weight: bold;\" target=\"_blank\">Learn more</a></p>\n",
          "map":{
              "region_type":"economic",
              "map_key":"avg_firm_size_tf",
              "cluster":"all",
              "highlight":[0],"year":2012
          }
      }
  ];

  var homepage_story_data = homepage_stories_dummy_data;

  if(Drupal.settings.hbs_homepage && (Drupal.settings.hbs_homepage.story_map_data.length > 0 )) {
    homepage_story_data = Drupal.settings.hbs_homepage.story_map_data;

  } else try {
      if (window.parent.Drupal && window.parent.Drupal.settings.hbs_homepage && window.parent.Drupal.settings.hbs_homepage.story_map_data) {
        homepage_story_data = window.parent.Drupal.settings.hbs_homepage.story_map_data;
      }
    } catch (e) {

    }

  var stories = settings.hbs_map.play_carousel ? homepage_story_data : null;
  carousel = d3.select(selector + ' .plot')
    .call(d3MapMenu, stories);

  carousel.fields(fields);
  carousel.init();
  if (settings.hbs_map.play_carousel) {
    carousel.dataUpdate(dataManager);
  }

  $(window).resize(function () {
    if (map[0][0].offsetWidth == width) return;
    plot.update();
  });

})();
