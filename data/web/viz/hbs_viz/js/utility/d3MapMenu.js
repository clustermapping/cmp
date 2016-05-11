function d3MapMenu(selection, stories) {
  window.Drupal = window.parent.Drupal;

  var footText = ['Explore the Map  ', 'Return to Map Story  '],
    footHref = '/region',
    dataManager,
    validEconomicIndicators,
    st = {
      menu: 0,
      story: -1,
      show: 1,
      timer: null,
      orgs: 0,
      fields: {
        "cluster": 1,
        "subCluster": 1,
        "indicatorType": 1,
        "economicIndicator": 1,
        "start": 1,
        "year": 1,
        "organizationType": 1,
        "regionType": 1
      }
    },
    el = {
      overlay: null,
      header: null,
      body: null,
      pager1: null,
      pager2: null,
      carousel: null,
      menu: null,
      playBtn: null,
      close: null,
      open: null,
      help: null
    },
    op = {
      dur: 500,
      rotate: 7000
    },
    behavior = {
      rotate: function () {
        if (typeof stories !== 'undefined' && stories !== null) {
          st.story++;
          if (st.story >= stories.length) st.story = 0;
          //if (cb) cb(s, i);
          showSlider(stories[st.story]);
          runTimer();
        }
      },

      slideMenu: function () {
        st.menu = flip(st.menu);
        draw(['carousel', 'body', 'footer', 'menu']);
        pausePlayRotate(st.menu);
      },

      slideOverlay: function () {
        st.show = flip(st.show);
        draw(['overlay']);
      },

      pagerClick: function (d, i) {
        st.story = i;
        showSlider(stories[st.story]);
        pausePlayRotate(1);
      }
    },
    dr = {
      pager1: function () {
        el.pager1
          .selectAll('div.pager')
          .data(stories)
          .enter()
          .append('div')
          .attr({class: 'pager'})
          .on('click', behavior.pagerClick);
        el.pager1
          .selectAll('div.pager')
          .classed('active', function (d, i) {
            return i == st.story;
          });
      },
      pager2: function () {
        el.pager2
          .selectAll('div.step')
          /*.data(stories)
           .enter()
           .append('div')
           .attr({class:'step'})*/
          .on('click', behavior.pagerClick);
        el.pager2
          .selectAll('div.step')
          .classed('active', function (d, i) {
            return i == st.story;
          });
      },
      playBtn: function () {
        if (el.playBtn) {
          el.playBtn
            .classed('glyphicon-pause', st.timer)
            .classed('glyphicon-play', !st.timer);
        }
      },
      carousel: function () {
        el.menu.style('display', 'block');

        el.carousel.selectAll('div.slide')
          .data(stories)
          .enter()
          .append('div')
          .attr({class: 'slide'})
          .each(function (d, i) {
            var e = d3.select(this);

            e.append('h3')
              .attr({class: 'title-text'})
              .text(d.headline);

            e.append('div')
              .attr({class:'row'})
              .append('div')
              .attr({class:'divider col-xs-2 clearfix'});

            e.append('p')
              .attr({class: 'abstract-text'})
              .html(d.abstract);
          });

        el.carousel.selectAll('div.slide')
          .classed('hidden', function (d, i) {
            return i != st.story;
          });

        el.carousel
          .interrupt()
          .transition()
          .duration(op.dur)
          .style('margin-top', (st.menu ? -el.carousel[0][0].offsetHeight + 'px' : '0px' ));
      },
      menu: function () {
        var items = el.menu
          .selectAll("div.map-control.selects")
          .data(mapData());

        items.enter()
          .append("div")
          .attr("class", function (d) {
            return "form-group map-control selects col-md-" + d.columns + ' group-' + d.name;
          })
          .attr('style', function (d) {
            return (d.columns == 12 ? 'clear: both' : null)
          })
          .each(function (d, i) {
            var e = d3.select(this);

            e.append("label")
              .attr({class: "control-label"})
              .text(d.label);
            var selects = e.append("select")
              .attr({ name: "map_" + d.name,
                //disabled: function(d) { if (st.timer) return "disabled"; },
                class: "form-control",
                disabled: function () {
                  return (d.disabled ? "disabled" : null)
                }
              })
              .on("change", updateMapFromControls);
          });

        items.exit().remove();


        items.each(function (data, i) {

          var options = d3.select(this)
            .select("select")
            .selectAll("option")
            .data(data.options, function (d) {
              return d.key;
            });

          options.enter()
            .append("option")
            .attr("value", function (d) {
              return d.key;
            })
            .text(function (d) {
              return d.label;
            });

          options.exit().remove();
          options.attr("selected", function (d) {
            if (d.key == dataManager[data.name]) return "selected";
          });
        });
        updateYears();

        // el.menu
        //   .selectAll('div.orgs-form')
        //   .data([st.orgs])
        //   .enter()
        //   .append("div")
        //   .attr("class", "map-control col-md-12 orgs-form")
        //   .append("label")
        //   .text("Show organizations")
        //   .append("input")
        //   .attr({
        //     type: 'checkbox',
        //     name: 'map_showOrgs',
        //     checked: function(d) {
        //       return d ? "checked" : null;
        //     },
        //   })
        //   .on("change", updateMapFromControls);
      },
      body: function () {
        el.body
          .interrupt()
          .transition()
          .duration(op.dur)
          .style('height', (st.menu ? el.menu[0][0].offsetHeight + 'px' : el.carousel[0][0].offsetHeight + 'px'))
          .each('end', function () {
            //if(!st.menu) el.menu.style('display', 'none');
          });
      },
      footer: function () {
        el.footer
          .text(footText[st.menu])
          .attr({class: function () {
            return 'btn btn-default btn-info';
          }})
          .attr({href: footHref, target: '_parent'})
        // .append('span')
        // .attr({class: function(){return 'glyphicon glyphicon-chevron-'+ (st.menu ?'down':'up'); }});
      },
      overlay: function () {
        el.close.style('display', 'block');
        el.help.style('display', 'block');
        el.open.style('display', 'none');

        var elem = selection.select('div.data-overlay');
        //.classed('closed',!st.show);

        elem.interrupt()
          .transition()
          .duration(op.dur)
          .style('height', (!st.show ? el.overlay.select('div.header-wrapper')[0][0].offsetHeight + 'px' : el.overlay[0][0].offsetHeight + 'px' ))
          .each("end", function () {
            if (st.show) {
              elem.style('height', null)
                .classed('closed', !st.show);
              //el.open.style('display', 'none');

            } else {
              el.help.style('display', 'none');
              el.close.style('display', 'none');
              el.open.style('display', 'block');
            }
          });
      }
    };

  this.init = function () {
    if (!stories) {
      st.menu = 1;
    }

    selection.append("div").classed('image-slider', true);

    el.overlay = selection.append("div")
      .classed('map-menu', true)
      .append("div")
      .attr({class: 'overlay data-overlay col-md-3'})
      .append("div")
      .attr({class: 'overlay-wrapper'});

    //var t = varLabelFromKey(s.color.key) + " in " + clusterLabelFromKey(cluster) + " by State" + ", " + year,
    el.header = el.overlay.append('div')
      .attr({class: "row header-wrapper"})
      .append('div')
      .attr({class: "overlay-header col-xs-12"});

    el.close = el.header.append('a')
      .attr({class: 'close'})
      .on('click', behavior.slideOverlay)
      .append('span')
      .attr('class', 'glyphicon glyphicon-remove');

    el.open = el.header.append('a')
      .attr({'class': 'explore'})
      .append('span')
      .on('click', behavior.slideOverlay)
      .attr({'class': 'glyphicon glyphicon-list'})
      .style({display: 'none'})
      .text(' Explore');

    var infoTitle = Drupal ? Drupal.settings.hbs_content.tooltiptitle1 : '';
    var infoTxt = Drupal ? Drupal.settings.hbs_content.tooltip1 : '';

    el.help = el.header.append('a');
      //.classed('col-md-12', true)
      //.classed('clearfix', true)

    el.help.attr({
      class: 'map-help',
      'data-container': "body",
      "data-toggle": "popover",
      "data-placement": "bottom",
      "data-original-title": infoTitle,
      "data-html": true,
      "data-content": infoTxt
    });

    el.help
      .text('Help')
      .append('span')
      .attr({class: 'glyphicon glyphicon-info-sign' });

    $('[data-toggle="popover"]').popover();
    //el.header.select('a.map-help')
    //  .text('Help');

    el.body = el.overlay
      .append('div')
      .attr({class: 'menu-body row'});

    el.carousel = el.body
      .append('div')
      .attr({class: 'info col-xs-12'});

    if (stories) {
      el.pager1 = el.carousel.append('div')
        .attr({class: "row"})
        .append('div')
        .attr({class: "controls col-xs-12"});

      el.playBtn = el.carousel
        .select('.controls')
        .append('span')
        .attr({class: 'glyphicon glyphicon-pause'})
        .on('click', pausePlayRotate);

      el.pager2 = d3.select('div.graph-rotator');
    }

    el.menu = el.body.append('div')
      .attr({class: 'menu map-controls'});

    el.footer = el.overlay.append('div')
      .attr({class: "row footer-wrapper"})
      .append('div')
      .attr({class: "overlay-footer col-xs-12"})
      .append('a')
    // .on('click', behavior.slideMenu);

    if (stories) draw(['footer', 'pager1', 'pager2', 'playBtn', 'carousel', 'body' ]);

  }

  function draw(elems) {
    var i;
    if (Object.prototype.toString.call(elems) === '[object Array]') {
      for (i in elems) {
        dr[elems[i]]();
      }
    } else {
      for (i in dr) {
        dr[i]();
      }
    }
  }

  function pausePlayRotate(flag) {
    flag = flag || 0;

    if (st.timer) {
      //Pause
      clearTimer();
    } else {
      //Play
      runTimer();
    }
    draw(['playBtn']);
  }

  function clearTimer() {
    window.clearTimeout(st.timer);
    st.timer = null;
  }

  function flip(x) {
    return 1 - x;
  }

  function runTimer() {
    var timeout = op.rotate;
    if (st.story < 0) timeout = 250;
    st.timer = setTimeout(function () {
      behavior.rotate();
    }, timeout);
  }

  function updateMapFromControls() {
    if (st.timer) {
      clearTimer();
    }

    var name = this.name, val = this.value;

    if (name === 'map_indicatorType') {
      dataManager.indicatorType = val;
      name = 'map_economicIndicator';
      val = buildValidEconomicIndicatorOptions()[0].key;
    }

    if (name === 'map_economicIndicator') {
      var v = dataManager.getVariable(val),
        sel = d3.selectAll('.map-control.selects.group-start select');
      if (v.range) {
        sel.attr('disabled', null);
      } else {
        sel.attr('disabled', 'disabled');
      }
    }

    for (var i in dataManager) {
      if ('map_' + i == name) {
        dataManager[i] = val;
        break;
      }
    }

    // Special case, map_showOrgs is a checkbox.
    if (name == 'map_showOrgs') {
      dataManager.showOrgs = this.checked;
    }

    dataManager.buildDataAndRedraw();
    updateYears();
  }

  function buildValidOrganizationTypeOptions() {
    var orgTypeOptions = [];
    try {
      orgTypeOptions = window.parent.Drupal.settings.hbs_viz.organization_types;
    } catch (e) {}
    if (! orgTypeOptions.length && dataManager.organizationType && dataManager.organizationTypeName) {
      orgTypeOptions = [ { key: dataManager.organizationType, label: dataManager.organizationTypeName }];
    }
    return orgTypeOptions;
  }

  function buildValidEconomicIndicatorOptions() {
    var economicIndicatorOptions = [],
      igroup = dataManager.indicatorType == 'region-cluster'? 'cluster': dataManager.indicatorType;
    var group = igroup ? igroup : (Drupal.settings.hbs_dashboard ? Drupal.settings.hbs_dashboard.type : 'performance');

    group = group == 'subCluster'? 'cluster': group;

    dataManager.varsList.forEach(function (d) {
      d.mapTypes.forEach(function (type) {
        if (type == group) {
          economicIndicatorOptions.push(d);
        }
      });
    });
    return economicIndicatorOptions;
  }

  function mapData() {
    var v = dataManager.getVariable(dataManager.economicIndicator);
    if (! v) return [];
    var startDisabled = v.range ? false : true,
      mapOpts = [
        {name: "organizationType", label: "Organization Type", icon: "", columns: 12, options: buildValidOrganizationTypeOptions() },
        {name: "cluster", label: "Cluster", icon: "", columns: 12, options: dataManager.clusterList},
        {name: "subCluster", label: "Subcluster", icon: "", columns: 12, options: dataManager.subClusterList},
        {name: "indicatorType", label: "Indicator Category", icon: "", columns: 12, options: dataManager.varTypes },
        {name: "economicIndicator", label: "Economic Indicator", icon: "", columns: 12, options: buildValidEconomicIndicatorOptions() },
        {name: "regionType", label: "Region Type", icon: "", columns: 12, options: dataManager.regionList},
        {name: "start", label: "Start Year", icon: "", columns: 6, disabled: startDisabled, options: dataManager.yearList},
        {name: "year", label: "End Year", icon: "", columns: 6, options: dataManager.yearList}
      ],
      data = [];
    for (var i in mapOpts) {
      if (st.fields[ mapOpts[i].name ]) {
        data.push(mapOpts[i]);
      }
    }

    return data;
  }

  function showSlider(story) {
    if (story.image) {
      showSlideImage(story);
    } else {
      showSlideMap(story.map);
    }
  }

  function showSlideImage(story) {
    $('#chart svg, .layer-mapTitle, .layer-simpleLegendThree, .nav-controls, .chart-credits, .layer-downloadControls, .layer-regionDetail').hide();
    var txt = footText[0],
        url = footHref;
    footText[0] = 'Read More';
    footHref = story.url;
    draw(['pager1', 'pager2', 'carousel', 'body', 'footer']);
    footHref = url;
    footText[0] = txt;
    var slider = d3.selectAll('.image-slider');
    slider.selectAll('img').remove();
    slider.append('img').attr('src', story.image);
  }

  function showSlideMap(map) {
    d3.selectAll('.image-slider img').remove();
    $('#chart svg, .layer-mapTitle, .layer-simpleLegendThree, .nav-controls, .chart-credits, .layer-downloadControls, .layer-regionDetail').show();
    updateDataManager(map);
    draw(['pager1', 'pager2', 'carousel', 'body', 'footer']);
  }

  function updateDataManager(sData) {

    if (dataManager) {
      dataManager.cluster = sData.cluster || 'all';
      dataManager.subCluster = sData.subcluster || 'all';
      dataManager.economicIndicator = sData.map_key;
      dataManager.regionType = sData.region_type;
      dataManager.year = sData.year;
      dataManager.start = sData.start;
      dataManager.zoom = sData.zoom || null;
      dataManager.regionCode = null;
      dataManager.highlight = sData.highlight;

      // dataManager.loadMetadata(function() {
        dataManager.buildDataAndRedraw();
        updateYears()
      // });
    }
  }

  this.dataUpdate = function (dm) {
    if (!dataManager && stories) pausePlayRotate();
    dataManager = dm;
    validEconomicIndicators = [];
    if (dataManager.mapType === 'all') {
      indicatorGroup = 'performance';
    }
//    if (dataManager !== undefined) {
//
//      dataManager.varsList.forEach(function (d) {
//        d.mapTypes.forEach(function (type) {
//          if ((Drupal.settings.hbs_dashboard && type == Drupal.settings.hbs_dashboard.type) || (indicatorGroup && type == indicatorGroup)) {
//            validEconomicIndicators.push(d.key);
//          }
//        });
//      });
//
//      if (validEconomicIndicators.length && validEconomicIndicators.indexOf(dataManager.economicIndicator) == -1) {
//        dataManager.economicIndicator = validEconomicIndicators[0];
//      }
//    }
    draw(['menu']);
  };

  function updateYears() {
    var r = dataManager.regionType;
    $('select[name="map_year"] option').add('select[name="map_start"] option')
      .each(function() {
        var y = $(this).val(),
          regionStatus = false;
        if (dataManager.dataByRegionYear[r] && dataManager.dataByRegionYear[r][y]) {
          regionStatus = dataManager.dataByRegionYear[r][y] > 1;
        }
        $(this)
          .prop('disabled', !regionStatus)
          .toggleClass('select-disabled', !regionStatus);
      });

    $('select[name="map_regionType"] option')
      .each(function() {
        var r = $(this).val(),
          regionStatus = false,
          years = dataManager.yearList.map(function(d) { return +d.key; }).sort();
        for (var i = 0; i < years.length; i++) {
          if (dataManager.dataByRegionYear[r] && dataManager.dataByRegionYear[r][years[i]]) {
            regionStatus = dataManager.dataByRegionYear[r][years[i]] > 1;
            if (regionStatus) break;
          }
        }

        $(this)
          .prop('disabled', !regionStatus)
          .toggleClass('select-disabled', !regionStatus);
      });
    return;
  }


  this.pause = function (option) {
    pausePlayRotate();
  };

  this.fields = function (f) {
    for (var i in f) {
      st.fields[i] = f[i];
    }
  };

  this.footerText = function (txt) {
    footText[1] = txt;
  };

  this.footerHref = function (href) {
    footHref = href;
  };

  this.draw = draw;

  return this;
}