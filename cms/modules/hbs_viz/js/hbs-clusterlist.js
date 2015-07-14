(function($) {
  Drupal.behaviors.hbs_cluster_grid = {
    attach: function(context, settings) {
      settings.hbs_cluster_grid = settings.hbs_cluster_grid || Drupal.settings.hbs_cluster_grid;
      var shortFmt = d3.format('.3s'),
          longFmt = d3.format(',d'),
          localColor = d3.scale.log().range(["#33A1DE", "#0371AE"]),
          tradedColor = d3.scale.log().range(["#0AAF86", "#0A7F56"]),
          radius = d3.scale.log().range([0,100]),
          tDiv, lDiv,
          fontSize = d3.scale.log().range([110, 160]);

      var clustersById, data, dividedData, empDom;

      var width = 960, itemsPerRow = 5,
        itemsPerCol,
        itemHeight = 39,
        itemRadius = 17,
          itemSize, height, rows,
          selected, hovered,
          container, svg, g, nodes, clicktargets;

      function ac(key) {
        if (typeof key == 'function') {
          return function(d) {
            return key(d);
          }
        } else {
          return function(d) {
            return d[key];
          }
        }
      }

      function ac2(f1, f2) {
        return function(d) {
          return f1(f2(d));
        }
      }

      function updateScales(extent) {
        [tradedColor, localColor, radius, fontSize].forEach(function(s) {
          s.domain(extent);
        });

        radius.range([62, (itemSize) / 2 - 2]);
      };

      function empVal(d) {
        if (!d.cluster_code_t) {
          return empDom[0];
        }

        var v = clustersById.get(d.traded_b).get(d.cluster_code_t).emp_tl;
        return v;
      };

      function loc(d, i) {
        var x = (Math.floor(i / itemsPerCol) * itemSize) + itemSize / 3,
          y = ((i % itemsPerCol) * itemHeight + itemHeight * 3);

        return 'translate(' + x + ',' + y + ')';
      }

      function color (d) {
        if (d.traded_b) {
          return tradedColor(empVal(d));
        } else {
          return localColor(empVal(d));
        }
      }

      function name(d) {
        if (d.short_name2_t && d.short_name2_t !== "0") return d.short_name2_t;
        if (d.short_name_t && d.short_name_t !== "0") return d.short_name_t;
        if (d.name_t) return d.name_t.substring(0, radius(empVal(d)) / 4);
        return '';
      }

      function splitName(d) {
        var n = name(d);
        if (n.length < 12) return [n];
        var parts = n.split(/ /);
        if (parts.length == 3 && parts[1] == '&') {
          parts = [parts[0] + ' ' + parts[1], parts[2]]
        }
        return parts;
      }

      function nameLoc(d) {
        if (d.divider) return -10;
        return (splitName(d).length > 1 ? 4 : 10);
      }

      function sortBy(key) {
        var sac = ac('name_t'),
            order = d3.ascending;
        key = key || "name";
        if (key === 'emp') {
          sac = ac(empVal);
          order = d3.descending;
        }

        return function(a, b) {
          if (a.traded_b === true && b.traded_b == false) return -1;
          if (a.traded_b === b.traded_b) return order(sac(a), sac(b));
          return 1;
        }
      }

      function buildDivided(data) {
        var traded = data.filter(function(d) {return d.traded_b; }),
            local = data.filter(function(d) {return !d.traded_b; }),
            tradedLabeled = (traded.length > 0 ? [tDiv].concat(traded) : []),
            localLabeled = (local.length >0 ? [lDiv].concat(local): []);
        itemsPerCol = Math.max(traded.length / 3, local.length);
        tDiv = {divider: true, traded_b: true, key_t: 'traded_div', name_t: "Traded Clusters", count: traded.length};
        lDiv = {divider: true, traded_b: false, key_t: 'local_div', name_t: "Local Clusters", count: local.length};
        return traded.concat(local);
      }

      function buildData(nData, sortKey, selected) {
        data = nData.sort(sortBy(sortKey, d3.descending));
        if (selected && selected.length > 0) {
          data = data.filter(function(d) { return selected.indexOf(d.cluster_code_t) != -1;})
        }
        dividedData = buildDivided(data);
      }

      function buildClusters(clusters, selected) {
        if (selected && selected.length > 0) {
          empDom = d3.extent(clusters.filter(function(d) { return selected.indexOf(d.cluster_code_t) != -1;}), function (d) {return d.emp_tl; });
        } else {
          empDom = d3.extent(clusters, function(d) {return d.emp_tl; });
        }
        if (empDom[0] == 0) empDom[0] = 1;
        clustersById = d3.nest()
            .key(function(d) {return d.traded_b; })
            .key(function(d) {return d.cluster_code_t; })
            .rollup(function(ds) {return ds[0]; })
          .map(clusters, d3.map);
      }

      function buildDivider(node, d) {
        var title = node.append('text').attr('class', 'cluster-info divider-title1')
          .attr('dy', '.3em')
          .attr('y', 0)
          .attr('x', 0)
          .style("text-anchor", "left")
          .style("fill",'#000')
          .style('font-size','170%')
          .style('font-weight', 'bold')
          .text(function(d) {
            return name(d);
          });
        node.append('text').attr('class', 'cluster-info divider-count')
          .attr('dy', '.3em')
          .attr('y', -5)
          .attr('x', title.node().getComputedTextLength() +5)
          .style("text-anchor", "left")
          .style("fill",'#999')
          .style('font-size','300%')
          .style('font-weight', 'bold')
          .text(function(d) {
            return d.count;
          });
      }

      function buildBubble(node, d) {
        node.append('circle') .attr('class', 'background')
          .attr('r', 0)
          .attr('fill', color)
          .transition()
          .duration(150)
          .delay(250)
          .attr('r', itemRadius);

        node.append('image').attr('class', 'cluster-image')
          .attr('x', -15)
          .attr('y', -15)
          .attr('height', 30)
          .attr('width', 30)
          .attr('xlink:href', function(d) {
            return "/profiles/clustermapping/modules/hbs_homepage/css/icons/" + d.icon_t + ".png";
          });

        node.append('text').attr('class', 'cluster-name cluster-info cluster-click-target')
          .attr('dy', '.3em')
          .attr('y', 0)
          .attr('x', 20)
          .style("text-anchor", "left")
          .style("fill", "#1b9bda")
          .style('font-size', '16px')
          .style('font-weight', '600')
          .text(function(d) {return name(d); });

        node.append("title").text(ac['name_t']);

        node.append('circle') .attr('class', 'cluster-click-target')
          .attr('r', ac2(radius, empVal))
          .attr('fill', '#fff')
          .attr('opacity', 0.01);
      }

      function buildNode(d, i) {
        var node = d3.select(this);
        if (d.divider) {
          buildDivider(node, d);
        } else {
          buildBubble(node, d);
        }
      }

      function buildTitles() {
        var g = svg.append('g').datum(tDiv);
        g.attr('transform', 'translate(70, 62)');
        buildDivider(g);

        var g = svg.append('g').datum(lDiv);
        g.attr('transform', 'translate(840, 62)');
        buildDivider(g);

      }

      function updateNodes() {
        nodes = g.selectAll('g.cluster-bubble-node')
                  .data(dividedData, ac('key_t'));
        nodes.enter().append('g').classed('cluster-bubble-node', true).attr('opacity', 0);
        nodes
          .attr('col', function(d, i) {return Math.floor(i / itemsPerCol); })
          .attr('row', function(d, i) { return i % itemsPerCol });
        nodes.exit().transition().remove();
        nodes.transition().attr("transform", loc).attr('opacity', 1);
      }

      function hover(d) {
        var node = d3.select(this.parentNode);
        if (hovered == d || selected == d) return;
        hovered = d;
        node.selectAll('circle')
          .transition().duration(150)
          .attr('r', itemRadius + 5);
        node.selectAll('circle')
          .transition().delay(150).duration(150)
          .attr('r', itemRadius);
      }

      function resetNodes() {
        nodes.transition().attr("transform", loc);
        nodes.selectAll('circle.cluster-click-target').transition().attr('r', itemRadius);
        nodes.selectAll('circle.background').transition().attr('r', itemRadius).attr('fill', color);
        nodes.selectAll('.cluster-info').transition().attr('opacity', 1);
        nodes.selectAll('.cluster-value-box').transition().attr('opacity', .25);
        nodes.selectAll('.cluster-image').transition().attr('y', -15).attr('x', -15).attr('height', 30).attr('width', 30);
        nodes.selectAll('.cluster-image').attr('xlink:href', function(d) {
          return "/profiles/clustermapping/modules/hbs_homepage/css/icons/" + d.icon_t + ".png";
        });
        nodes.selectAll('.local-badge').transition().attr('y', -15).attr('fill', '#ddd').attr('opacity',1);
        nodes.selectAll('circle.cluster-click-target').moveToFront();
        nodes.selectAll('.cluster-detail').remove();
      }

      function clearAndReset() {
        selected = null;
        resetNodes();
      }

      function buildDetail(node, title_text, sub_text) {
        var cluster = node.datum(),
            goToCluster = function(d, i) {
              window.location = dashType != 'region' ? '/cluster/' + cluster.key_t +(typeof d == "string"? '/subclusters/'+ (i+1) : '')
                    : '/region-cluster/' + cluster.key_t + '/' + rType + '/' + rId;
            },
            detail = node.append('g').attr('class', 'cluster-detail').attr('opacity', 0),
            dashType = settings.hbs_dashboard.type,
            linkText = dashType == 'region'? 'Go to Region’s Cluster Dashboard ►': 'Go to Cluster Dashboard ►',
            rType = dashType == 'region'? settings.hbs_dashboard.data.region.region_type_t: null,
            rId = dashType == 'region'? settings.hbs_dashboard.data.region.region_key_t: null;

        detail.selectAll('text.title').data(title_text)
          .enter()
          .append('text').attr('class', 'title')
          .attr('dy', '.3em')
          .attr('y', function(d, i) {
            return -110 + (i * 20)
          })
          .style("text-anchor", "middle")
          .style("fill", "#000")
          .style('font-size', '150%')
          .style('font-weight', 'bold')
          .text(function(d) {
            return d;
          })
          .style('cursor', 'pointer')
          .on('click', goToCluster);
        detail.append('text')
          .attr('dy', '.3em')
          .attr('y', -50)
          .style("text-anchor", "middle")
          .style("fill", "#000")
          .style('font-size', '100%')
          .style('font-weight', 'bold')
          .text("NUMBER EMPLOYED IN THIS CLUSTER");
        detail.append('rect')
          .attr({
            x: -125,
            y: -35,
            rx: 10,
            ry: 10,
            width: 250,
            height: 50,
            fill: '#000',
            opacity: '.8'
          });
        detail.append('text')
          .attr('dy', '.3em')
          .attr('y', -10)
          .style("text-anchor", "middle")
          .style("fill", "#fff")
          .style('font-size', '180%')
          .style('font-weight', 'bold')
          .text(ac2(longFmt, empVal));
        detail.append('text')
          .attr('dy', '.3em')
          .attr('y', 45)
          .style("text-anchor", "middle")
          .style("fill", "#000")
          .style('font-size', '100%')
          .style('font-weight', 'bold')
          .text("SUBCLUSTERS");
        detail.selectAll('text.subcluster')
          .data(sub_text)
          .enter()
          .append('text')
          .attr('class', 'subcluster')
          .attr('dy', '.3em')
          .attr('y', function(d, i) {
            return 60 + (i * 16)
          })
          .style("text-anchor", "middle")
          .style("fill", "#999")
          .style('font-size', '120%')
          .style('font-weight', 'bold')
          .style('cursor', 'pointer')
          .text(function(d) {
            return d;
          })
          .on('click', goToCluster);
        detail.append('text').attr('class', 'navigation')
          .attr('dy', '.3em')
          .attr('y', '155')
          .style("text-anchor", "middle")
          .style("fill", "#3ba4dc")
          .style('font-size', '120%')
          .style('font-weight', 'bold')
          .style('cursor', 'pointer')
          .text(linkText)
          .on('click', goToCluster);
        detail.append('rect')
          .attr({
            class: 'navigation',
            x: -10,
            y: 180,
            width: 20,
            height: 20,
            fill: '#dadbdf',
            opacity: '.8'
          })
          .on('click', clearAndReset);

        detail.append('text').attr('class', 'navigation')
          .attr('dy', '.5em')
          .attr('x', 0)
          .attr('y', 185)
          .style("text-anchor", "middle")
          .style("fill", "#81878a")
          .style('font-size', '170%')
          .style('font-weight', 'bold')
          .style('cursor', 'pointer')
          .text('x')
          .on('click', clearAndReset);

        detail.append('circle').attr('class', 'bubble-border')
            .attr('r', 200)
            .attr('fill', 'none')
            .attr('stroke', function(d) {
                var c = color(d);
                var v = d3.rgb(c).darker().toString();
                return v;
            })
            .attr('stroke-width', '3');
        return detail;
      }

      function detailLoc() {
        var t = d3.select(this);
        var r = t.attr('row');
        var c = t.attr('col');
        var x = (c * itemSize) + itemSize / 2;
        var y = (r * itemHeight) + itemHeight / 2;
        var offset = 0;
        if (r == 0) y += 190;
        if (r > (itemsPerCol - 3)) y -= 100;
        if (c == 0) x = itemSize + 10;
        if (c == itemsPerRow - 1) x = (width - itemSize - 10);
        if (y < 215) y = 215;
        return 'translate(' + x + ',' + y + ')';
      }

      if(!Array.isArray) {
        Array.isArray = function (vArg) {
          return Object.prototype.toString.call(vArg) === "[object Array]";
        };
      }

      function textToRows(src, width, dec, max) {
        var words, i = 0, text = [];
        dec = dec || 0;
        if (src === null || src === undefined) return [];
        if (typeof src === 'object' && !Array.isArray(src)) {
           src = Object.keys(src).map(function(k) { return src[k]});
        }
        if (Array.isArray(src)) { src = src.join(', ') }
        words = src.split(/ /);
        words.forEach(function(s) {
            if (!text[i]) text[i] = s;
            else {
              var line = text[i],
                  newline = line + ' ' + s;
              if (newline.length > width - (i * dec)) {
                text[++i] = s;
              } else {
                text[i] = newline;
              }
            }
          });
        if (max && text.length > max) {
            //console.log("trimming", src);
          text.length = max;
          text[max - 1] += '…';
        }
        return text;
      }

      if (!d3.selection.prototype.moveToFront) {
        d3.selection.prototype.moveToFront = function() {
          return this.each(function() {
            this.parentNode.appendChild(this);
          });
        };
      }

      function showDetail(d) {
        resetNodes();
        if (d != selected) {
          var t = d3.select(this.parentNode);
          t.moveToFront().transition().attr("transform", detailLoc);
          t.selectAll('circle.cluster-click-target').transition().attr('r', 200);
          t.selectAll('circle.background').transition().attr('r', 200).attr('fill', 'white');
          t.selectAll('circle.gradient').transition().attr('r', 200).attr('opacity', 0);
          t.selectAll('.cluster-image').transition().attr('y', -195).attr('x', -30).attr('height', 64).attr('width', 64);;
          t.selectAll('.cluster-image').attr('xlink:href', function(d) {
            return "/profiles/clustermapping/modules/hbs_homepage/css/icons/" + d.icon_t + "-big.png";
          });
          t.selectAll('.local-badge').transition().attr('opacity', 0);
          t.selectAll('.cluster-info').transition().attr('opacity', 0);
          var detail = buildDetail(t, textToRows(d.name_t, 35), textToRows(d.sub_clusters, 50, 5, 5));
          detail.transition().delay(150).attr('opacity', 1);
          selected = d;
        } else {
          selected = null;
        }
      }

      function calcLayout() {
        width = container.node().offsetWidth;
        itemSize = width / 4 - 20;
        height = itemsPerCol * itemHeight + 100;
        updateScales(empDom);
      }

      function update() {
        if(container.node().offsetWidth == width) return;
        calcLayout();
        resetNodes();
        svg.attr('width', width).attr('height', height);
        updateNodes();
        resetNodes();
      }

      function setup(selector, controls) {
        container = d3.select(selector);
        calcLayout();
        svg = container.append("svg")
          .attr("width", width)
          .attr("height", height);
        svg.append("defs").append('linearGradient')
            .attr("id", "cluster-bubble-gradient")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", '100%').attr("y2", '100%')
          .selectAll("stop")
            .data([
                {offset: "0%", color: "white", opacity: 0 },
                {offset: "100%", color: "#111", opacity: .3 }
            ])
          .enter().append("stop")
            .attr("offset", ac('offset'))
            .style("stop-color",ac('color'))
            .style("stop-opacity", ac('opacity'));
        buildTitles();
        g = svg.append('g').classed('cluster-bubble-list', true);
        updateNodes();
        nodes.each(buildNode);
        clicktargets = nodes.selectAll('.cluster-click-target');
        clicktargets.on('mouseover', hover);
        clicktargets.on('mouseout', function(d) {hovered = null; });
        clicktargets.on("click", showDetail);
        d3.selectAll(controls + " input[name=clustersort]").on('change', function() {
          buildData(data, this.value);
          updateNodes();
        });
        $( window ).resize(update);
      }
      var region = "/country/98";
      if (settings.hbs_dashboard && settings.hbs_dashboard.data && settings.hbs_dashboard.data.region
          && settings.hbs_dashboard.data.region.region_type_t) {
        var r = settings.hbs_dashboard.data.region;
        region = '/' + r.region_type_t + '/' + r.region_code_t;
      }
      var selectedClusters = settings.hbs_cluster_grid ? settings.hbs_cluster_grid.selected : undefined;
      queue()
        .defer(d3.json, '/data/meta/clusters')
        .defer(d3.json, '/data/region' + region  + '/2013/all')
        .await(function(err, data, clusters) {
            buildData(data, 'name', selectedClusters);
            buildClusters(clusters, selectedClusters);
            selectedClusters && setup("#cluster-list-0", '#cluster-list-controls');
            $(window).trigger('resize');
        });
    }
  }
})(jQuery);
