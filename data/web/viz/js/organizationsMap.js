/* global MythosVis */
/* global d3 */
/* global $ */
/* global L */

(function() {
  "use strict";

  var MythosVis = window.MythosVis,
    /**
     * Describes the current state of the map at any particular time. Could be refactored
     * into a settings object for a general map object.
     */
    mapState = {
      display: 'wide',     // Which map is currently being shown? Options are `wide` (d3) or `detail` (leaflet)
      width: 0,            // Current width of the canvas.
      height: 0,           // Current height of the canvas.
      currentFilter: {},   // What filter(s) are we using to limit the number of orgs being shown?
      selectedPoint: null  // Holds a reference to the individual organization that is currently selected. Selection happens via a click method.
    },

    // For the d3 map, by how much should we adjust the scale after zooming in or out?
    zoomScaleFactor = 2,

    /**
     * Contains various data objects that are needed in more than one method. Eventually,
     * this could be refactored into a general map object, with many of the described methods
     * that appear in this file as public or private methods on the object.
     *
     * @type {{}}
     */
    mapObjects = {
      detailMap: undefined,     // Leaflet instance for detail map.
      zoomed: undefined,        // d3.behavior.zoom event callback.
      dataOverlay: undefined,   // Widget control for filtering org data.
      showDetailMap: undefined, // method to display leaflet/detail map
      showWideMap: undefined,   // method to display d3/wide map
      detailMapOrgLayer: undefined
    },

    // Wrapper around queue library that provides basic caching.
    loader = new MythosVis.DataLoader(),

    // See d3.behavior.zoom. @TODO: Could be moved into mapObjects.
    zoomBehavior;

  function init() {
    $('#chart').append('<div class="chart-credits chart-credits--map"></div>');
    $('.chart-credits--map').html('Source: <a href="http://clustermapping.us/" target="_top">U.S. Cluster Mapping Project</a>, ' +
    'Institute for Strategy and Competitiveness, Harvard Business School. <a href="/content/data-sources-and-limitations" target="_top">Data Sources</a>');

    var nav = d3.select('#chart').append('div').attr('class', 'nav-controls');
    var pan = nav.append('div').classed('pan-control', true);
    var btn = pan.append('button').classed('pan-left', true);
    btn.append('span').classed('glyphicon glyphicon-chevron-left', true)
    btn.on('click', function(e) {
      if (mapState.display == 'detail') {
        mapObjects.detailMap.panBy([-150, 0]);
      } else {
        var t = zoomBehavior.translate(),
          z = zoomBehavior.scale();

        t[0] = t[0] + (50 * z);
        zoomBehavior.translate(t);
        mapObjects.zoomed();
      }
    });
    btn = pan.append('button').classed('pan-right', true);
    btn.append('span').classed('glyphicon glyphicon-chevron-right', true)
    btn.on('click', function(e) {
      if (mapState.display == 'detail') {
        mapObjects.detailMap.panBy([150, 0]);
      } else {
        var t = zoomBehavior.translate(),
          z = zoomBehavior.scale();

        t[0] = t[0] - (50 * z);
        zoomBehavior.translate(t);
        mapObjects.zoomed();
      }
    });
    btn = pan.append('button').classed('pan-up', true);
    btn.append('span').classed('glyphicon glyphicon-chevron-up', true)
    btn.on('click', function(e) {
      if (mapState.display == 'detail') {
        mapObjects.detailMap.panBy([0, -150]);
      } else {
        var t = zoomBehavior.translate(),
          z = zoomBehavior.scale();

        t[1] = t[1] + (50 * z);
        zoomBehavior.translate(t);
        mapObjects.zoomed();
      }
    });
    btn = pan.append('button').classed('pan-down', true);
    btn.append('span').classed('glyphicon glyphicon-chevron-down', true);
    btn.on('click', function(e) {
      if (mapState.display == 'detail') {
        mapObjects.detailMap.panBy([0, 150]);
      } else {
        var t = zoomBehavior.translate(),
          z = zoomBehavior.scale();

        t[1] = t[1] - (50 * z);
        zoomBehavior.translate(t);
        mapObjects.zoomed();
      }
    });

    btn = nav.append('button').classed('btn btn-default', true);
    btn.append('span').classed('glyphicon glyphicon-minus', true);
    btn.on('click', function(e) {
      // For the d3/wide map, panning is achieved via a transformation on a root node in the svg.
      // As you zoom in further, the top-left corner gets pushed further and further up and to the
      // left in order to keep the same centerpoint in the map.
      //
      // Because d3.behavior.zoom doesn't give us a good way to access the current offset in a way that's
      // relatable to the current scale, we need to be able to calculate the offset difference for different
      // zoom levels, so that when we do zoom in via the controls, we have the ability to zoom in further
      // without affecting the center location of the viewport.
      function calculateTranslationFromCenter(scale) {
        var point = size.map(function(d) {return d / 2});
        return [size[0] / 2 - point[0] * scale, size[1] / 2 - point[1] * scale];
      }

      if (mapState.display == 'detail') {
        mapObjects.detailMap.zoomOut();
      } else {
        var t = zoomBehavior.translate(),
          s = zoomBehavior.scale(),
          size = zoomBehavior.size();

        var currentZoomTranslate = calculateTranslationFromCenter(s);
        s = s * (1 / zoomScaleFactor);
        var newZoomTranslate = calculateTranslationFromCenter(s);
        var offSetX = (currentZoomTranslate[0] - t[0]) * (1 / zoomScaleFactor);
        var offSetY = (currentZoomTranslate[1] - t[1]) * (1 / zoomScaleFactor);
        newZoomTranslate[0] = newZoomTranslate[0] - offSetX;
        newZoomTranslate[1] = newZoomTranslate[1] - offSetY;

        zoomBehavior.translate(newZoomTranslate)
          .scale(Math.max(zoomBehavior.scaleExtent()[0], s));

        mapObjects.zoomed();
      }
    });
    btn = nav.append('button').classed('btn btn-default', true);
    btn.append('span').classed('glyphicon glyphicon-plus', true);
    btn.on('click', function(e) {
      function calculateTranslationFromCenter(scale) {
        var point = size.map(function(d) {return d / 2});
        return [size[0] / 2 - point[0] * scale, size[1] / 2 - point[1] * scale];
      }

      if (mapState.display == 'detail') {
        mapObjects.detailMap.zoomIn();
      } else {
        var t = zoomBehavior.translate(),
          s = zoomBehavior.scale(),
          size = zoomBehavior.size();

        var currentZoomTranslate = calculateTranslationFromCenter(s);
        s = s * zoomScaleFactor;
        var newZoomTranslate = calculateTranslationFromCenter(s);
        var offSetX = (currentZoomTranslate[0] - t[0]) * zoomScaleFactor;
        var offSetY = (currentZoomTranslate[1] - t[1]) * zoomScaleFactor;
        newZoomTranslate[0] = newZoomTranslate[0] - offSetX;
        newZoomTranslate[1] = newZoomTranslate[1] - offSetY;

        zoomBehavior.translate(newZoomTranslate)
          .scale(Math.min(zoomBehavior.scaleExtent()[1], s));

        mapObjects.zoomed();
      }
    });

    var dataOverlayContent = '<div class="overlay data-overlay col-md-3">'
                           + '  <div class="row header-wrapper">'
                           + '    <div class="overlay-header col-xs-12"><a class="close"><span class="glyphicon glyphicon-remove"></span></a><a class="explore"><span class="glyphicon glyphicon-list"> Explore</span></a></div>'
                           + '  </div>'
                           + '  <div class="menu-body row">'
                           + '    <div class="info col-xs-12">'
                           + '      <div class="menu map-controls">'
                           + '        <div class="form-group map-control selects col-md-12 group-organizationType">'
                           + '          <label class="control-label">Organization Type</label>'
                           + '          <select name="map_organizationType" class="form-control"></select>'
                           + '        </div>'
                           + '        <div class="form-group map-control selects col-md-12 group-cluster">'
                           + '          <label class="control-label">Cluster</label>'
                           + '          <select name="map_cluster" class="form-control"><option value="all">Economy Wide</option></select>'
                           + '        </div>'
                           + '      </div>'
                           + '    </div>'
                           + '  </div>'
                           + '  <div class="row footer-wrapper">'
                           + '    <div class="overlay-footer col-xs-12">'
                           + '      <a id="organization-list" class="btn btn-default btn-info" href="/organization-type/all" target="_top">View Organization List</a>'
                           + '    </div>'
                           + '  </div>'
                           + '</div>';

    var orgOptions = [{key: 0, label: "All"}];

    window.Drupal = window.parent.Drupal;
    if (Drupal && Drupal.settings && Drupal.settings.hbs_viz && Drupal.settings.hbs_viz.organization_types) {
      orgOptions = Drupal.settings.hbs_viz.organization_types;
    }

    var dataOverlay = mapObjects.dataOverlay = $('.org-map-container').append(dataOverlayContent);

    queue()
      .defer(d3.json, hbsBaseUrl + '/meta/clusters')
      .await(function(err, clusters) {
        clusters = clusters.sort(function(a,b){return d3.ascending(a.name_t, b.name_t)})
        clusters.forEach(function(d) {
          if (d.traded_b) {
            $('[name="map_cluster"]').append('<option value="' + d.cluster_code_t + '" key="' + d.key_t + '">' + d.name_t + "</option>");
          }
        });
      });

    $('.close', dataOverlay).click(function() {
      $('.explore span').show().css('display', 'block');
      $('.close span').hide();
      $('.menu-body').slideUp();
      $('.footer-wrapper').slideUp();
    });

    $('.explore', dataOverlay).click(function() {
      $('.explore span').hide();
      $('.close span').show();
      $('.menu-body').slideDown();
      $('.footer-wrapper').slideDown();
    });

    orgOptions.sort(function(a,b){return d3.ascending(a.label,b.label)}).forEach(function(d) {
      $('[name="map_organizationType"]', dataOverlay).append('<option value="' + d.key + '" key="' + d.machine_name + '">' + d.label + "</option>");
    });

    $('[name="map_cluster"]', dataOverlay).val("all");
    function updateListUrl() {
      var cluster = $('[name="map_cluster"]').find('option:selected').attr('key') || "all",
          type = $('[name="map_organizationType"]').find('option:selected').attr('key'),
          url = '/organization-type/' + type + (cluster == 'all' ? '' : '/' + cluster);
      $('#organization-list').attr('href', url);
    }

    $('[name="map_organizationType"]', dataOverlay).change(function() {
      var value = $(this).val();
      updateListUrl();
      mapState.currentFilter.orgType = (value === '0') ? undefined : value;
      paint();
    });

    $('[name="map_cluster"]', dataOverlay).change(function() {
      var value = $(this).val();
      updateListUrl();
      mapState.currentFilter.cluster = (value === 'all') ? undefined : value;
      paint();
    });

    var detailMap = mapObjects.detailMap = L.map('detail-map', {
      minZoom: 3,
      zoomControl: false,
      attributionControl: false
    })
      .setView([39.833333, -98.583333], 6)
      .on('click', function(e) {
        if (mapState.selectedPoint) {
          mapState.selectedPoint.setStyle({
            fillColor: "#345198",
            fillOpacity: 0.6
          });
        }

        mapState.selectedPoint = null;
        hideOrgDetail();
      })
      // .on('zoomstart', function(e) {

      // })
      .on('zoomend', function(e) {
        if (this.getZoom() < 5) {
          mapObjects.showWideMap();
        }
        hideOrgDetail();
      });

    L.tileLayer('https://{s}.tiles.mapbox.com/v3/clustermapping.kcdbmg7d/{z}/{x}/{y}.png', {
      'attribution': 'Mapbox'
    }).addTo(detailMap);

    $('#chart').append('<div class="orgDetail-item item"></div>');
  }

    function clickToZoom(d, i) {
        d3.selectAll('.state').classed("active", false);
        d3.select(this).classed("active", true);
        var x = d3.event.layerX,
            y = d3.event.layerY;
        // Adjust position for Hawaii
        if (x > 150 && x < 280 && y > 440 && y < 520) {
            x = 5;
        }
        mapObjects.showDetailMap(x, y);
    }

  // Takes data from mapObjects, renders organization data.
  function paint() {
    var pointsRaw = mapObjects.pointsRaw;
    var orgData = mapObjects.orgData;
    var g = mapObjects.g;

    var filteredData = orgData;

    if (mapState.currentFilter.orgType) {
      filteredData = filteredData.filter(function(d) {
        var returnValue = false;

        if (d.im_vid_3) {
          for (var i = 0; i < d.im_vid_3.length; i++) {
            if (d.im_vid_3[i] == mapState.currentFilter.orgType) {
              returnValue = true;
              break;
            }
          }
        }

        return returnValue;
      });
    }

    if (mapState.currentFilter.cluster) {
      filteredData = filteredData.filter(function(d) {
        var returnValue = false;

        var cid = 'clusterData/' + mapState.currentFilter.cluster;
        if (d.tm_field_clusters) {
          if (d.tm_field_clusters.length == 1) {
            d.tm_field_clusters = d.tm_field_clusters[0].split(' ');
          }

          if (d.tm_field_clusters.indexOf(cid) >= 0) {
            returnValue = true;
          }
        }
        return returnValue;
      });
    }

    var filteredPoints = filteredData.map(function(d, i) {
      var point = mapObjects.projection([d['location_lng_s'], d['location_lat_s']]);
      if (point) {
        point.push(i);
        return point;
      } else {
        return null;
      }
    });

    filteredPoints = filteredPoints.filter(function(d) {return d !== null;});

    var quadtree = d3.geom.quadtree()(filteredPoints);

    // Find the nodes within the specified rectangle.
    function search(quadtree, x0, y0, x3, y3) {
      var validData = [];
      quadtree.visit(function(node, x1, y1, x2, y2) {
        var p = node.point;
        if (p) {
          p.selected = (p[0] >= x0) && (p[0] < x3) && (p[1] >= y0) && (p[1] < y3);
          if (p.selected) {
            validData.push(p);
          }
        }
        return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
      });
      return validData;
    }

    var clusterPoints = [];
    var clusterRange = 45;

    for (var x = 0; x <= mapState.width; x += clusterRange) {
      for (var y = 0; y <= mapState.height; y+= clusterRange) {

        var searched = search(quadtree, x, y, x + clusterRange, y + clusterRange);

        var centerPoint = searched.reduce(function(prev, current) {
          return [prev[0] + current[0], prev[1] + current[1]];
        }, [0, 0]);

        centerPoint[0] = centerPoint[0] / searched.length;
        centerPoint[1] = centerPoint[1] / searched.length;
        centerPoint.push(searched);

        if (centerPoint[0] && centerPoint[1]) {
          clusterPoints.push(centerPoint);
        }
      }
    }

    var pointSizeScale = d3.scale.linear()
      .domain([
        d3.min(clusterPoints, function(d) {return d[2].length;}),
        d3.max(clusterPoints, function(d) {return 115;})  //@todo: setting the max manually to ensure points aren't way too big on filtered display
      ])
      .rangeRound([10, 30]);

    // Remove circles and labels before painting because of grouping issues when changing the filtered set
    d3.selectAll(".org-label, .org").remove();

    var orgClusters = g.selectAll(".org")
      .data(clusterPoints);

    orgClusters.enter().append("circle")
      .attr("class", "org")
      .attr("cx", function(d) {return d[0];})
      .attr("cy", function(d) {return d[1];})
      .attr("fill", '#345198')
      .attr("stroke", "#1b9bda")
      .style("opacity", 0.75)
      .attr("r", 0)
      .on('click', clickToZoom);

    orgClusters
      .transition()
      .duration(750)
      .attr("r", function(d, i) {return pointSizeScale(d[2].length);});

    orgClusters.exit()
      .transition()
      .duration(750)
      .attr("r", 0)
      .remove();

    var orgClusterLabels = g.selectAll(".org-label")
      .data(clusterPoints);

    orgClusterLabels.enter().append("text")
      .attr("class", "org-label")
      .attr("x", function(d) {return d[0];})
      .attr("y", function(d) {return d[1];})
      .attr("fill", '#FFF')
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .style("pointer-events", "none");

    orgClusterLabels.text(function(d, i) {return d[2].length;});

    orgClusterLabels.exit()
      .remove();

    if (mapObjects.detailMapOrgLayer) {
      mapObjects.detailMap.removeLayer(mapObjects.detailMapOrgLayer);
    }

    var markers = mapObjects.detailMapOrgLayer = new L.MarkerClusterGroup({showCoverageOnHover: false});

    filteredData.forEach(function(d) {
      if (d['location_lat_s'] && d['location_lng_s']) {
        markers.addLayer(L.circleMarker([d['location_lat_s'], d['location_lng_s']], {
          color: '#FFF',
          fillColor: "#345198",
          fillOpacity: "0.6",
          opacity: "1",
          weight: "1.5"
        })
          .on("click", function() {
            if (mapState.selectedPoint !== null) {
              mapState.selectedPoint.setStyle({'fillColor': '#345198', 'fillOpacity': 0.6});
            }
            mapObjects.detailMap.setView(this.getLatLng());
            mapState.selectedPoint = this;

            this.setStyle({'fillColor': 'rgb(206, 239, 128)', 'fillOpacity': 1});

            var content = '<div class="region-type">Organization</div>'
              + '<div class="content">'
              + '<h3 class="title-text">' + d['label'] + '</h3>'
              + '<p>' + d['teaser'] + '</p>'
              + '<a target="_parent" href="/' + d['path_alias'] + '">Go to organization</a>'
              + '</div>';

            $('.orgDetail-item').html(content).addClass('visible');
          }));
      }
    });

    markers.on('clusterclick', function(e) {
      hideOrgDetail();
    });

    mapObjects.detailMap.addLayer(markers);
  }

  $(document).ready(function() {
    var width = mapState.width = $(window).width(),
        height = mapState.height = $(window).height();

    init();
    var detailMap = mapObjects.detailMap;

    windowResize();

    $(window).resize(function() {
      windowResize();
    });

    d3.select('#detail-map').classed('hide-map', mapState.display !== "detail");

    var svg = d3.select("#wide-map").append("svg")
      .attr("width", width)
      .attr("height", height);

    var projection = mapObjects.projection = d3AlbersUsaPr().translate([width / 2 + 140, height / 2 - 30]).scale(1050),
        path = d3.geo.path().projection(projection).pointRadius(1),
        basePath = d3.geo.path().projection(projection.baseProjection().translate([width / 2 + 140, height / 2 - 30]).scale(1050));

    var xExtent = d3.scale.linear().domain([0, width]).range([0, width]);
    var yExtent = d3.scale.linear().domain([0, height]).range([0, height]);

    var graticule = d3.geo.graticule()
      .extent([
        [-98 - 60, 38 - 60],
        [-98 + 60, 38 + 60]
      ])
      .step([5, 5]);

    mapObjects.zoomed = function zoomed() {
      // requires d3.event, width, height, zoomBehavior, g
      if (mapState.display == 'wide') {
        var t = [0, 0];
        var s = 1;

        if (d3.event !== null && d3.event.type == 'zoom') {
          t = d3.event.translate;
          s = d3.event.scale;
        } else {
          t = zoomBehavior.translate();
          s = zoomBehavior.scale();
        }

        if (s > 1) {
          mapObjects.showDetailMap();
        } else {
          // Keep the map within bounds
          var tx = Math.min(0, Math.max(t[0], width - width * s));
          var ty = Math.min(0, Math.max(t[1], height - height * s));

          t = [tx, ty];
        }

        zoomBehavior.translate(t).scale(s);
        g.attr("transform", "translate(" + t + ")scale(" + s + ")");
      }
    };

    zoomBehavior = mapObjects.zoomBehavior = d3.behavior.zoom()
      .translate([0, 0])
      .scale(1)
      .size([width, height])
      .scaleExtent([1, 8])
      .x(xExtent)
      .y(yExtent)
      .on("zoom", mapObjects.zoomed);

    var g = mapObjects.g = svg.append("g");

    // svg.append("rect")
    //   .attr("class", "overlay")
    //   .attr("width", width)
    //   .attr("height", height)
    //   .call(zoomBehavior);

    loader.request(["/viz/hbs_viz/json/states.json", "/viz/hbs_viz/json/stoutput.json"], function(geoData, countryData) {
      var states = topojson.feature(geoData, geoData.objects.states);
      var countries = topojson.feature(countryData, countryData.objects.nonUsStates);

      g.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", basePath);

      g.append("g")
        .attr("id", "breakoutRects")
        .selectAll("rect")
        .data(projection.clips())
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

      g.selectAll(".country")
        .data(countries.features)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", basePath)
        .on('click', clickToZoom);

      g.selectAll(".state")
        .data(states.features)
        .enter().append("path")
        .attr("class", function(d) {return "state state-" + string2CssClass(d.properties.name);})
        .attr("d", path)
        .on('click', clickToZoom);

      loader.request(['http://clustermapping.us/content/organization'], function (orgData) {
        mapObjects.orgData = orgData;
        var pointsRaw = orgData.map(function(d, i) {
          var point = projection([d['location_lng_s'], d['location_lat_s']]);
          if (point) {
            point.push(i);
            return point;
          } else {
            return null;
          }
        });

        mapObjects.pointsRaw = pointsRaw.filter(function(d) {return d !== null;});

        paint();
      });
    });

    mapObjects.showDetailMap = function showDetailMap(centerX, centerY) {
      mapState.display = 'detail';

      var translation = d3.event.translate;
      var scale = d3.event.scale;

      var projectionTranslation = projection.translate();
      var projectionScale = projection.scale();

      var centerPoint = [width / 2, height / 2];
      if (centerX > 0 && centerY > 0) {
        centerPoint = [centerX, centerY];
      }
      var x2 = xExtent.invert(centerPoint[0]);
      var y2 = yExtent.invert(centerPoint[1]);

      var centerCoordinate = projection.invert([x2, y2]);

      detailMap.setView([centerCoordinate[1], centerCoordinate[0]], 5);

      d3.select('#detail-map').classed('hide-map', false);
      d3.select('#wide-map').classed('hide-map', true);

      detailMap.invalidateSize(false);
      setTimeout(function() {
        detailMap._onResize();
      }, 300);
    };

    mapObjects.showWideMap = function showWideMap() {
      mapState.display = 'wide';

      if (mapState.selectedPoint !== null) {
        mapState.selectedPoint.setStyle({'fillColor': '#345198', 'fillOpacity': 0.6});
      }

      zoomBehavior
        .translate([0, 0])
        .scale(1);

      g.attr("transform", "translate(0,0)scale(1)");

      d3.select('#detail-map').classed('hide-map', true);
      d3.select('#wide-map').classed('hide-map', false);
        d3.selectAll('.state').classed("active", false);
    }
  });

  function windowResize() {
    var width = mapState.width = $(document).width(),
        height = mapState.height = $(document).height();

    $('#chart').width(width).height(height);
  }

  function string2CssClass(string) {
    return string.toLowerCase().replace(' ', '-');
  }

  function hideOrgDetail() {
    $('.orgDetail-item').removeClass('visible');
  }
})();
