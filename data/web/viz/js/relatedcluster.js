/* global MythosVis */
/* global d3 */
/* global d3Plot */

(function() {
  "use strict";
  var MythosVis = window.MythosVis,
      loader = new MythosVis.DataLoader(),
      cagrForm = d3.format('.2%'),
      changeForm = d3.format('+,f'),
      monForm = d3.format('$,.2f'),
      numForm = d3.format(',f'),
      defaults = { className: "", filter: 'default' },
      options = {},
      clustersByKey = {},
      clustersByCode = {},
      yearRange, brush, gBrush,
      container, chart, plot,
      plotData = [],
      positions,
      totalData = {},
      regionData,
      focalCluster = {},
      base = window.hbsBaseUrl || '';

  function resetOptions(defaults){
    options = options || {};
    Object.keys(defaults).forEach(function(d) {
      options[d] = defaults[d];
    });
  }

  function location(cluster) {
    var parts = [],
      year =  options.year ? '?year=' + options.year : '',
      hash;

    if (cluster) parts.push(cluster);
    if (options.regionType) parts.push(options.regionType);
    if (options.regionKey) parts.push(options.regionKey);

    hash = '#/' + parts.join('/') + year;
    return hash;
  }

  function go(hash) {
    window.location.hash = hash;
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

  function updateOptionsFromHash(render) {
    var h = window.location.hash.substring(2),
      uq = h.split('?'),
      parts = uq[0].split('/'),
      q = parseQuery(uq[1]);
    resetOptions(defaults);

    Object.keys(q).forEach(function(qk) {
      options[qk] = q[qk];
    });

    switch (parts.length) {
      case 1:
        options.cluster = parts[0];
        options.regionType = undefined;
        options.regionKey = undefined;
        break;
      case 2:
        options.cluster = undefined;
        options.regionType = parts[0];
        options.regionKey = parts[1];
        yearControls();
        break;
      case 3:
        options.cluster = parts[0];
        options.regionType = parts[1];
        options.regionKey = parts[2];
        yearControls();
        break;
      default:
        console.error("Please specify a hash in the form: /:clusterCode");
    }

    if (!render) { return; }
  }

  function buildTitle(wrapper) {
    d3.select('.title-container').remove();
    d3.select('#chart').append('div').classed('title-container', true).style('text-align', 'center');

    var titleContainer = d3.select('.title-container');
    var title = titleContainer.append('h1');
    var subtitle = titleContainer.append('h3');

    if (options.cluster) {
      title.text('Cluster Linkages');
    } else {
      title.text(regionData ? ' Cluster Linkages and Economic Diversification' : 'Full Portfolio View of Related Clusters')
    }

    
    if (options.regionType && options.regionKey) {
      subtitle.text((focalCluster.name ? focalCluster.name + ', ' : '') + regionData.region_short_name_t + ', ' + totalData.year);
    } else {
      subtitle.text(focalCluster.name ? focalCluster.name : '');
    }
  }

  function captureUrl() {
    var path = hbsBaseUrl + '/report/capture/related/';
    var url = document.location.pathname + document.location.hash
           + (document.location.hash.indexOf('?') < 0 ? '?' : '&') + 'controls=false',
      encodedUrl = encodeURIComponent(url);
    return path + encodeURIComponent(encodedUrl);
  }

  function captureButton() {
    d3.select('.related-clusters-capture').remove();
    var capture = d3.select('#chart').append('div').classed('related-clusters-capture', true);
        
    capture
      .attr('style', 'position:absolute;top:0;left:0;display:none;')
      .on('mouseover', function(e) {
        d3.select(this).style('display', 'block');
      })
      .append('a').classed('btn btn-default', true)
        .attr('href', captureUrl)
        .attr('title', 'Download Capture')
        .style('padding', '4px 10px')
          .style('margin', '2px')
      .append('span').classed('glyphicon glyphicon-picture', true);

    if (window !== window.parent) {
      capture
        .append('a').classed('btn btn-default', true)
          .attr('href', document.location)
          .attr('target', '_blank')
          .attr('title', 'Open in new window')
          .style('padding', '4px 10px')
          .style('margin-left', '4px')
        .append('span').classed('glyphicon glyphicon-new-window', true);
    
    } 

    if (options.cluster) {
      capture
        .append('a').classed('btn btn-default', true)
          .attr('title', 'Back to all clusters view')
          .style('padding', '4px 10px')
          .style('margin-left', '4px')
          .attr('href', location())
        .append('span').classed('glyphicon glyphicon-arrow-left', true)
    }

    d3.selectAll('body')
      .on('mousemove', function(e) {
          d3.select('.related-clusters-capture').style('display', 'inline-block');
        })
      .on('mouseleave', function(e) {
          d3.select('.related-clusters-capture').style('display', 'none');
        });
  }

  function createLegends() {
    if (options.params == 'all') return;
    
    d3.select('.legend-container').remove();
    var container = d3.select('#chart')
      .append('div').classed('legend-container', true)

    container
      .attr('style', 'display:inline-block;position:absolute;top:40px;left:2px;width:158px;height:106px;')
      .on('mouseover', function(e) {
      })
    
    if (regionData) {
      container.append('div').text('Cluster Specialization').attr('style', 'padding:0 4px;font-size:13px;font-weight:bold;margin-bottom:4px;')

      var row = container.append('div').attr('style','font-size:10.5px;margin-bottom:4px;')
      row.append('span').attr('style', 'background:#6ab690;display:inline-block;width:15px;height:15px;float:left;margin:2px;border:1px solid black;')
      row.append('span').text('Strong clusters above 90th percentile specialization')
        .style('display', 'block')
      
      var row = container.append('div').attr('style','font-size:10.5px;margin-bottom:4px;')
      row.append('span').attr('style', 'background:#92D14F;display:inline-block;width:15px;height:15px;float:left;margin:2px;border:1px solid black;')
      row.append('span').text('Strong clusters above 75th percentile specialization')
        .style('display', 'block')
      
      var row = container.append('div').attr('style','font-size:10.5px;margin-bottom:4px;')
      row.append('span').attr('style', 'background:#D4D445;display:inline-block;width:15px;height:15px;float:left;margin:2px;border:1px solid black;')
      row.append('span').text('Other specialized clusters (LQ > 1.0)')
        .style('display', 'block')
    }

    linksLegends(container);
  }


  function linksLegends(wrapper) {
    var container = wrapper.append('div').classed('legend-container', true);
    container.style('border', '1px solid #999').style('padding', '4px').style('margin', '0').style('width', '140px')
    
    var row = container.append('div').attr('style','font-size:10.5px;margin-bottom:4px;')
    row.append('span').attr('style', 'border-top: 2px solid black;display:inline-block;width:15px;height:10px;float:left;margin:4px 4px 4px;')
    row.append('span').text('BCR >= 95th pctile & RI >= 20%')
      .style('padding-top', '2px')
      .style('display', 'block')
    
    var row = container.append('div').attr('style','font-size:10.5px;margin-bottom:4px;')
    row.append('span').attr('style', 'border-top: 2px solid gray;display:inline-block;width:15px;height:15px;float:left;margin:4px 4px 4px;')
    row.append('span').text('BCR 90th-94th pctile & RI >= 20%')
      .style('padding-top', '2px')
      .style('display', 'block')
    
    var row = container.append('div').attr('style','font-size:10.5px;margin-bottom:4px;')
    row.append('span').attr('style', 'border-top:2px dashed gray ;display:inline-block;width:15px;height:15px;float:left;margin:4px 4px 24px;')
    row.append('span').text('Next closest clusters not meeting above criteria')
      .style('padding-top', '0px')
      .style('display', 'block')
  }

  var width = 960,
    height = 690,
    radius = Math.min(width, height) / 4,
    centerX = width / 2,
    centerY = height / 2, 
    radius = 75,
    iconSize = 60,
    distance = regionData ? radius * 1.8 : radius * 1.8;

  function toDegrees(rad) {
    return rad * (180 / Math.PI);
  }

  function buildChartForce(sel) {
    plot = function(selection) {
      createLegends();
      var width = 960,
          height = 720;

      var iconSize = 22;
      var radius = 35;
      var stroke = 1.5, strokeSelected = 3, strokeFade = 1;

      var force = d3.layout.force()
          .size([width, height])
          .charge(-400)
          .linkDistance(400)
          .on("tick", tick);

      d3.select(sel).select('svg').remove();
      var svg = d3.select(sel).append("svg")
          .attr("width", width)
          .attr("height", height);

      var link = svg.selectAll(".link"),
          node = svg.selectAll(".node");

      force.stop();

      var nodes = plotData;
      var links = [];

      plotData.forEach(function(c, i) {
        // Apply static positions
        c.px = c.x;
        c.py = c.y;
        c.fixed = true;

        if (localStorage.getItem(c.key)) {
          var d = JSON.parse(localStorage.getItem(c.key));
        }

        if (!c.related.length){
          c.related = c.weak.sort(function(a,b){return d3.descending(a.bcr,b.bcr);}).slice(0,2);
        }

        c.related.forEach(function(r, j) {
          var targetIndex;
          plotData.some(function (elem, i) {
            return +elem.code === +r.cluster_code_2 && ~(targetIndex = i);
          });
          if (links.filter(function(d){return d.target === i && d.source === targetIndex; }).length) {
            return;
          }
          links.push({
            source: i,
            target: targetIndex,
            bcr: r.bcr,
            ri: r.ri,
          });
        });
      });

      force
          .nodes(nodes)
          .links(links)
          .start();

      link = link.data(links)
        .enter().append("line")
          .attr("class", "link")
          .attr('stroke', function(d) {
            return d.bcr >= 95 && d.ri ? 'black' : '#999';
          })
          .classed('dashed', function(d) {
            return ! d.ri;
          })
          .attr('stroke-width', stroke)
          .attr('fill', 'none');

        d3.selectAll('.dashed').style('stroke-dasharray', [5,6]);

        node = node.data(nodes)
        var elemEnter = node
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")"})
          .on("click", linkToCluster)
          .on("mouseenter", function(d) {
            d3.select(this).transition().select('circle').attr("r", radius + 3);
            var related = links
              .filter(function(l){return l.target.code == d.code || l.source.code == d.code;})
              .map(function(l){ return l.target.code == d.code ? +l.source.code : +l.target.code; });
            
            node.transition().style('opacity', function(c) {
              return (+c.code == d.code || related.indexOf(+c.code) >= 0)  ? 1 : .3;
            });

            link.transition().style("opacity", function(o) {
              return o.source.code === d.code || o.target.code === d.code  ? 1 : .1;
            });
          })
          .on("mouseleave", function(d){
            d3.select(this).transition().select('circle').attr("r", radius);
            link.transition().style("opacity", 1);
            node.transition().style('opacity', 1);
          })
    
        var circle = elemEnter.append("circle")
            .attr("r", radius)
            .on("dblclick", dblclick)
            .style("stroke", 'black')
            .style("fill", function(d) {
              if (regionData) {
                //if (d.lq_tf > 1 && d.percentile <= 10) {
                if (d.lq_tf > 1 && d.strong10) {
                  return '#6ab690';
                } else if (d.lq_tf > 1 && d.strong && Math.round(d.percentile) <= 25) {
                  return '#92d14f';
                } else if (d.lq_tf > 1) {
                  return '#D4D445';
                } else {
                  return '#bfbfbf';
                }
              }
    
              if (positions[d.key].color2) {
                var gradient = svg.append("svg:defs")
                    .append("svg:linearGradient")
                    .attr("id", "gradient-" + d.code)
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "100%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");

                 gradient.append("svg:stop")
                    .attr("offset", "0%")
                    .attr("stop-color", positions[d.key].color)
                    .attr("stop-opacity", 1);

                gradient.append("svg:stop")
                    .attr("offset", "100%")
                    .attr("stop-color", positions[d.key].color2)
                    .attr("stop-opacity", 1);
                    return 'url(#gradient-' + d.code + ')'
              } else {
                return positions[d.key].color;
              }

            })
            .style("cursor", 'pointer')

        var textContainer = node.append('g').classed('cluster-text', true);

        textContainer.append("text")
          .attr('fill', function(d) {
            if (regionData) return 'black';
            return positions[d.key].text ? positions[d.key].text : 'white';
          })
          .attr('style', regionData ? 'font-size:10px;':'font-size:10.5px;')
          .attr("dx", function(d){
            var twidth = this.getBoundingClientRect().width;
            return -radius;
          })
          .attr("dy", function(d){return !regionData && d.focal ? iconSize/2 : 0; })
          .text(function(d){return d.short_name})
          .style("cursor", 'pointer')
          .call(wrap, radius*2, true);

        textContainer
          .attr('transform', function(d) {
            var theight = this.getBoundingClientRect().height;
            var twidth = this.getBoundingClientRect().width;
            var top = 0;
            var top = (-theight) / 2 + 10;
            return 'translate(' + (-radius ) + ',' + (top) + ')';
          })

      function tick() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        node
            .attr("transform", function(d) { return 'translate(' + [d.x, d.y] + ')'; })
        force.stop();
      }

      function dblclick(d) {
        d3.select(this).classed("fixed", d.fixed = false);
      }
    };

    captureButton();
    container = d3.select(sel);
    chart = container.append('div').datum(plotData).call(plot);

    d3.select(window).on("resize", plot.update).on("hashchange", update);
    return container;
  }

  function buildClusterChart(sel) {
    plot = function(selection) {
  
      var l = plotData.length -1 < 5 ? 4 : plotData.length - 1,
        angleDif = 2 * Math.PI / l,
        angle = -Math.PI / 2 // 90 deg.
      
      plotData.forEach(function(d, i) {
        d.distance = distance * (d.ri ? (d.bcr >= 95 ? 1.2 : 1.4) : (d.bcr > 90 ? 1.4 : 1.7 ));
        d.angle = d.focal ? 0 : angle;
        d.centerX = d.focal ? centerX : centerX + d.distance * Math.cos(angle);
        d.centerY = d.focal ? centerY : centerY + d.distance * Math.sin(angle);
        d.radius = d.focal ? radius : radius *.65 - 1 * l;

        if (!d.focal) {
          angle =  angle + angleDif;
        }
      });

      var transform = ["", "-webkit-", "-moz-", "-ms-", "-o-"].reduce(function(p, v) { return v + "transform" in document.body.style ? v : p; }) + "transform";

      //Create the SVG Viewport
      d3.select(sel).select('svg').remove();
      var svgContainer = d3.select(sel).append("svg")
        .attr("width",width)
        .attr("height",height);
      var x = d3.scale.linear().range([0, width]),
          y = d3.scale.linear().range([0, height]);

      var line = d3.svg.line();
      
      // Enter
      var join = svgContainer.selectAll("path")
        .data(plotData)
        .enter()
          .append("path")
          .attr('stroke', function(d) {
            return d.bcr >= 95 && d.ri ? 'black' : '#999';
          })
          .classed('dashed', function(d) {
            return ! (d.bcr >= 90 && d.ri);
          })
          .attr('stroke-width', 3)
          .attr('fill', 'none')
          .attr('d', function(d){ return line([[centerX, centerY],[d.centerX, d.centerY]]); });
      
      d3.selectAll('.dashed').style('stroke-dasharray', [5,6]);
      
      //Add circles to the svgContainer
      var elem = svgContainer.selectAll("g").data(plotData);
      var elemEnter = elem.enter().append("g");
      var circles = elemEnter.append('circle');

      var textContainer = elemEnter.append('g')
        .classed('cluster-text', true)
        .attr('fill', function(d){return d.focal ? 'white' : 'black'});

      textContainer.append("text")
        .attr('style', regionData ? 'font-size:14px;font-weight:bold;':'')
        .attr("dx", function(d){return 0; })
        .attr("dy", function(d){return !regionData && d.focal ? iconSize/2 + 5 : 0; })
        .text(function(d){return d.short_name})
        .call(wrap, radius * (regionData ? 1.8 : 1.5));

      if (options.regionType && options.regionKey) {
        textContainer.append("text")
          .attr("dy", function(d){
            return this.parentElement.getBoundingClientRect().height;
          })
          .text(function(d) { return d.emp_tl ? 'Employment: ' + numForm(d.emp_tl) : ''; });
        
        textContainer.append("text")
          .attr("dy", function(d){
            return this.parentElement.getBoundingClientRect().height;
          })
          .text(function(d) { return d.rank ? 'Rank in US: ' + d.rank : ''; });
      }

      textContainer
        .attr('transform', function(d) {
          var theight = this.getBoundingClientRect().height;
          var twidth = this.getBoundingClientRect().width;
          var centerV = 10 - theight/2;
          var distanceX =  d.focal ? -twidth/2 : Math.cos(d.angle) * (regionData ? distance : Math.max(radius, twidth)+8) - twidth/2;
          var distanceY =  d.focal ? 0 : 15 + Math.sin(d.angle) * (radius +2) - theight/2;
          return 'translate(' + (d.centerX + distanceX ) + ',' + (d.centerY + distanceY) + ')';
        })

      
      var icons = elemEnter.append('image').attr('class', 'cluster-image')
        .attr("x", function (d, i) { return d.centerX - iconSize/2; })
        .attr("y", function (d, i) {
          return d.centerY - iconSize/2 + (d.focal ? (regionData ? -35 : 0) : 0);
        })
        .attr('height', iconSize)
        .attr('width', iconSize)
        .attr('xlink:href', function(d) {
          return "/viz/css/icons/" + d.icon + ".png";
        })
        .style("cursor", 'pointer')
        .on('click', linkToCluster);

      var circleAttributes = circles 
        .attr("cx", function (d, i) { return d.centerX; })
        .attr("cy", function (d, i) { return d.centerY; })
        .attr("r", function (d) { return d.radius; })
        .style("fill", function(d) {
          if (!options.regionType || !options.regionKey) {
            return '#6ab690';
          }
          if (d.lq_tf > 1 && d.percentile <= 10) {
            return '#6ab690';
          } else if (d.lq_tf > 1 && d.percentile <= 25) {
            return '#92d14f';
          } else if (d.lq_tf > 1) {
            return '#D4D445';
          } else {
            return '#bfbfbf';
          }
        })
        .style("cursor", 'pointer')
        .on('click', linkToCluster);

      addArrow();
      captureButton();
      createLegends();
    };

    container = d3.select(sel);
    chart = container.append('div').datum(plotData).call(plot);

    d3.select(window).on("resize", plot.update).on("hashchange", update);
    return container;
  }

  function addArrow() {
    var svg = d3.select("svg");
    svg.append('image').attr('class', 'cluster-image')
      .attr("x", 800 )
      .attr("y", 225 )
      .attr('height', 200)
      .attr('width', 200)
      .attr('xlink:href', function(d) {
        return hbsBaseUrl + "/viz/css/img/arrow.png";
      })
      .on('click', function(d){
        window.parent.location = '/content/related-clusters-methodology';
      })
      .style("cursor", 'pointer');
  }

  function wrap(text, width, center) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 15, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "px");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        var twidth = tspan.node().getComputedTextLength() + 4 ; // + padding 

        if (twidth > width && line.length > 1) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", (++lineNumber ? lineHeight : 0) + "px")
            .text(word);
        }
        if (center) {
          twidth = tspan.node().getComputedTextLength();
          tspan.attr('dx', (width - twidth)/2)
        }
      }
    });
  }

  function getDatasources() {
    var parts = [], 
      year = options.year ? '?year=' + options.year : '';
    if (options.cluster) {
      parts.push(options.cluster);
    } else {
      parts.push('none');
    }

    if (options.regionType && options.regionKey) {
      parts.push(options.regionType, options.regionKey)
    }
    return base + '/report/relatedclusters/' + parts.join('/') + year;
  }

  function processData(data, positionsData, relatedClusters) {
    clustersByKey = {};
    clustersByCode = {};
    positions = positionsData;
    clustersByKey = positionsData;
    plotData = [];
    totalData = data;
    options.year = data.year;
    data.clusters.forEach(function(d) {
      d.focal = false;
      d.name = d.name;
      d.short_name = d.short_name;
      d.related = [];
      d.weak = [];
      clustersByCode[d.code] = $.extend(d, positions[d.key]);
      plotData.push(clustersByCode[d.code]);
    });

    relatedClusters.forEach(function(d) {
      if (d.cluster_code == d.cluster_code_2) {
        return;
      }

      // For BCR we use values from Column "O"
      d.bcr = +d.cr_all_pc;

      // For RI we use values from Columns "J" and "K"
      d.ri = +d.rel_all_90_v3 && +d.rel_i20_all_min_90_v3;

      // Strong Related Clusters require BCR > 90 and RI
      if (d.bcr >= 90 && d.ri) {
        // d.strong = true;
        clustersByCode[d.cluster_code].related.push(d);

      // Other Related Clusters require BCR > 70 only
      } else if (d.bcr > 50 && d.cr_lc_pc >=25) {
        clustersByCode[d.cluster_code].weak.push(d);
      }
    });

    regionData = data.region;
    
    if (!options.cluster) {
      return;
    }

    focalCluster = clustersByCode[options.cluster];
    focalCluster.focal = true;
    if (!focalCluster.related.length ) {
      focalCluster.related = focalCluster.weak.sort(function(a,b){return d3.descending(a.bcr,b.bcr);}).slice(0,2);
    }

    plotData = [focalCluster];
    focalCluster.related
      .forEach(function(r) {
        var cluster = $.extend(clustersByCode[r.cluster_code_2], r);
        plotData.push(cluster);
      });
  }


  function linkToCluster(d) {
    var url = '/cluster/' + d.key;
    if (options.regionType && options.regionKey) {
      url = '/region-cluster/' + d.key + '/' + options.regionType +'/'+ options.regionKey;
    }
    if (window === window.parent) {
      window.location.hash = '#/' + d.code 
        + (options.regionType && options.regionKey ? '/' + options.regionType +'/'+ options.regionKey : '')
    } else {
      window.parent.location = url + '#related-clusters';
    }
  }

  function updateOverlay(name, data) {
    plot.layer(name).config.dataFN = function() {return data;};
    plot.layer(name).draw();
  }

  function fetchYears(cb) {
    loader.request(base + '/meta/years', function(years) {
      yearRange = d3.extent(years);
      yearRange = [+yearRange[0], +yearRange[1]];
      if (cb) {cb();}
    });
  }

  function brushended() {
    if (!d3.event.sourceEvent) return; // only transition after input
    var value = brush.extent()[0].getFullYear(),
        extent = [new Date(value, 0, 1), new Date(value+1, 0, 1)];

    d3.select(this)
      .call(brush.extent(extent));

    options.year = value;
    go(location(options.cluster));
  }

  function yearControls() {
    if (options.controls === false) {
      $('.year-control').toggle(options.controls !== false);
      return;
    }
    var margin = {top: 20, right: 40, bottom: 20, left: 20},
      yearWidth =  (width * .7) - margin.left - margin.right,
      yearHeight = 65 - margin.top - margin.bottom,
      year = +options.year || +totalData.year || 2013,
      x;

    if (!yearRange) {
      fetchYears(yearControls);
      return;
    }

    if (!brush) {

      x = d3.time.scale()
        .domain([new Date(yearRange[0],0,1), new Date(yearRange[1]+1, 0, 1)])
        .range([0, yearWidth]);

      brush = d3.svg.brush()
        .x(x)
        .extent([new Date(year, 0, 1), new Date(year+1, 0, 1)])
        .on("brushend", brushended);

      d3.select(".year-control").style('margin', 0)

      var svg = d3.select(".year-control").insert("svg", ":first-child")
        .attr("width", yearWidth + margin.left + margin.right)
        .attr("height", yearHeight + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("rect")
        .attr("class", "grid-background")
        .attr("width", yearWidth)
        .attr("height", yearHeight);

      svg.append("g")
        .attr("class", "x grid")
        .attr("transform", "translate(0," + yearHeight + ")")
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(d3.time.years)
          .tickSize(-yearHeight)
          .tickFormat(""));

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + yearHeight + ")")
        .call(d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(d3.time.years)
          .tickValues(d3.time.years(new Date(yearRange[0],0,1), new Date(yearRange[1]+1, 0, 1)))
          .tickPadding(0))
        .selectAll("text")
        .attr("x", 6)
        .style("text-anchor", null);

      gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.event);

      gBrush.selectAll(".resize")
        .remove();

      gBrush.selectAll("rect")
        .attr("height", yearHeight);
    } else {
      gBrush.transition()
        .call(brush.extent([new Date(year, 0, 1), new Date(year+1, 0, 1)]));
    }
  }


  function update() {
    plotData = [];
    // $('svg, .related-clusters-wrapper').remove();
    $('#chart').width(960).height(840).css('margin', '0 auto');

    updateOptionsFromHash(true);
    var datasource;
    function runLoader() {
      var ds = [];
      ds.push(getDatasources());
      ds.push(hbsBaseUrl + '/viz/json/positions.json');
      ds.push(hbsBaseUrl + '/viz/json/relatedClusters.json');
      loader.request(ds, function(){
        processData.apply(this, arguments);
        buildTitle(wrapper);
        if (options.regionType && options.regionKey) {
          yearControls();
          $('#controls').show();
        } else {
          $('#controls').hide();
        }
        if (!Number(options.cluster)) {
          buildChartForce('#chart');
        } else {
          buildClusterChart('#chart');
        }
      });
    }

    runLoader();
  }
  d3.selectAll('.download-controls, .cluster-controls').remove();

    var wrapper = d3.select('#chart').append('div').classed('related-clusters-wrapper', true)
      .append('div').classed('related-clusters', true).datum(totalData);
    
    d3.select('#chart').append('div').classed('title-container', true).style('text-align', 'center');

  d3.selectAll('p.chart-credits').remove();
  resetOptions(defaults);
  updateOptionsFromHash(false);
  update();
})();
