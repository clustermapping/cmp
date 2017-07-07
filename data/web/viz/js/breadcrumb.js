(function($) {
  var regionCode, regionType, regionKey, clusterCode, subclusterCode, ie9;
  var currentRegion, currentCluster, regionData, clusterData, metaData;
  if (navigator.appVersion.indexOf("MSIE 9") > -1) { ie9 = true; }

  var options = parseURL();

  var chartOptions = {
    region: [
      { id: 'map', label: 'Map' },
      { id: 'performance', label: 'Performance' },
      { id: 'subregions', label: 'Subregions' },
      { id: 'employment', label: 'Employment' },
      { id: 'wages', label: 'Wages' },
      { id: 'jobs', label: 'Job Creation' },
      { id: 'specialization', label: 'Specialization' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'innovation', label: 'Innovation' },
    ],
    cluster: [
      { id: 'map', label: 'Map' },
      { id: 'related', label: 'Related Clusters' },
      { id: 'employment', label: 'Employment' },
      { id: 'wages', label: 'Wages' },
      { id: 'jobs', label: 'Job Creation' },
      { id: 'specialization', label: 'Specialization' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'innovation', label: 'Innovation' },
    ],
    organization: [
      { id: 'organizations', label: 'Map' },
    ],
  }

  $(window).on('hashchange', hashChange);
  $(window).trigger('hashchange');

  $('.nav-tabs li').on('click', function(e){
    e.preventDefault();
    options.type = $(this).attr('id');
    options.chart = chartOptions[options.type][0].id;
    document.location.hash = '#' + urlParams();
  });

  function hashChange() {
    options = parseURL();
    if (options.type === 'cluster') {
      loadClusterChart();
    } else {
      loadRegionChart();
    }
    updateHeader();
  }

  var MythosVis = window.MythosVis,
    loader = new MythosVis.DataLoader();

  $('<div>').addClass('panel').attr('id', 'region-navigation-panel').appendTo('#controls');
  $panel = $('#region-navigation-panel');
  $handler = $('<div>').text('You are here').addClass('panel-handle').appendTo('#region-navigation-panel');
  $content = $('<div>').addClass('panel-content').appendTo('#region-navigation-panel');
  $handler.on('click', function() {
    if ($panel.hasClass('panel-open')) {
      $panel.animate({left:-382}, "easeIn").delay(400).removeClass('panel-open');
    } else {
      $panel.animate({left:-12}, "easeOut").addClass('panel-open');
    }
  });
  if (ie9) $panel.addClass('ie9');

  var select = {
    country: $('<select>').addClass('select2 form-control').attr('id', 'nav-country').append($('<option>').prop('selected', true)),
    state: $('<select>').addClass('select2 form-control').attr('id', 'nav-state').append($('<option>').prop('selected', true)),
    msa: $('<select>').addClass('select2 form-control').attr('id', 'nav-msa').append($('<option>').prop('selected', true)),
    economic: $('<select>').addClass('select2 form-control').attr('id', 'nav-economic').append($('<option>').prop('selected', true)),
    county: $('<select>').addClass('select2 form-control').attr('id', 'nav-county').append($('<option>').prop('selected', true)),
    cluster:  $('<select>').addClass('select2 form-control').attr('id', 'nav-cluster').append($('<option>').prop('selected', true)),
    subcluster:  $('<select>').addClass('select2 form-control').attr('id', 'nav-subcluster').append($('<option>').prop('selected', true)),
  };

  loader.request([hbsBaseUrl + '/region', hbsBaseUrl + '/cluster', hbsBaseUrl + '/meta'], function(regions, clusters, meta) {
    clusterData = clusters;
    regionData = regions;
    metaData = meta;
    getRegion();
    getCluster();
    
    // $(window).trigger('hashchange');

    $panel.animate({left: -382}, 2500);

    var l = regions.length, clusters, subclusters, countries, eas, msas, states, counties;

    var countryCode = '98';

    countries = regions.filter(function(d){return d.region_type_t == 'country'}).sort(function(a,b){return d3.ascending(a.name_t,b.name_t)});
    states = regions.filter(function(d){return d.region_type_t == 'state'}).sort(function(a,b){return d3.ascending(a.name_t,b.name_t)});
    msas = regions.filter(function(d){return d.region_type_t == 'msa'}).sort(function(a,b){return d3.ascending(a.name_t,b.name_t)});
    eas = regions.filter(function(d){return d.region_type_t == 'economic'}).sort(function(a,b){return d3.ascending(a.name_t,b.name_t)});
    counties = regions.filter(function(d){return d.region_type_t == 'county'}).sort(function(a,b){return d3.ascending(a.region_short_name_t,b.region_short_name_t)});

    $('<p>').addClass('nav-state').append($('<label>').text('State')).append(select.state).appendTo($content);
    $('<p>').addClass('nav-economic').append($('<label>').text('Economic Area')).append(select.economic).appendTo($content);
    $('<p>').addClass('nav-or').text('or').appendTo($content);
    $('<p>').addClass('nav-msa').append($('<label>').text('Metro/Micropolitan Statistical Areas')).append(select.msa).appendTo($content);
    $('<p>').addClass('nav-county').append($('<label>').text('County')).append(select.county).appendTo($content);
    $('<p>').addClass('nav-cluster').append($('<label>').text('Cluster')).append(select.cluster).appendTo($content);
    $('<p>').addClass('nav-subcluster').append($('<label>').text('Subcluster')).append(select.subcluster).appendTo($content);
    
    var stateCode = options.regionType == 'state' ? options.regionCode : 
      (options.regionType == 'county' ? options.regionCode.substr(0, 2): '');
    var eaCode = options.regionType == 'economic' ? options.regionCode : '';
    var msaCode = options.regionType == 'msa' ? options.regionCode : '';
    var countyCode = options.regionType == 'county' ? options.regionCode : '';

    // Country
    countries.forEach(function(d){
        $('<option>').val(d.region_code_t).text(d.name_t).appendTo(select.country);
      });
    select.country
      .select2({allowClear: true, placeholder: "Select a Country", minimumResultsForSearch: 8 })
      .on('change', function(e) {

      }).val(countryCode).trigger('change');

    // State
    states.forEach(function(d) {
      $('<option>').val(d.region_code_t).text(d.name_t).appendTo(select.state);
    });

    select.state
      .select2({allowClear: true, placeholder: "Select a State"}).val(stateCode)
      .on('select2:select', function(e) {
        var code = $(this).val();

        filterEAsByState(code);
        filterMSAsByState(code);

        if (msaCode) filterCountiesByMSA(msaCode)
        else if (eaCode) filterCountiesByEA(eaCode)
        else filterCountiesByState(code);
      })
      .on('select2:unselect', function(e) {
        filterEAsByState(null);
        filterMSAsByState(null);
        filterCountiesByState(null)
      })
      .val(stateCode).trigger('change')
      .trigger('select2:select');

    // County
    select.county
      .select2({allowClear: true, placeholder: "Select a County", minimumResultsForSearch: 10 })
      .val(countyCode).trigger('change')
      .on('select2:select', function(e) {
        var st = String($(this).val()).substr(0, 2);
        select.state.val(st).trigger('change');
      });
    
    // EA
    select.economic
      .select2({allowClear: true, placeholder: "Select an Economic Area", minimumResultsForSearch: 10 })
      .on('change', function(e) {
        var code = $(this).val();
        if (code) {
          filterCountiesByEA(code);
          select.msa.val('').trigger('change');
        }
      })
      .on('select2:unselect', function(e) {
        var st = select.state.val();
        if (st) filterCountiesByState(st);
        else filterCountiesByEA(null);
      })
      .val(eaCode).trigger('change');

    // MSA
    select.msa
      .select2({allowClear: true, placeholder: "Select an MSA", minimumResultsForSearch: 10 })
      .on('change', function(e) {
        var code = $(this).val();
        if (code) {
          filterCountiesByMSA(code);
          select.economic.val('').trigger('change');
        }
      })
      .on('select2:unselecting', function(e) {
        var st = select.state.val();
        if (st) filterCountiesByState(st);
        else filterCountiesByMSA(null);
      })
      .val(msaCode).trigger('change');

    // Subclusters
    subclusters = clusterData
      .filter(function(d){ return d.subcluster_b; })
      .sort(function(a,b) { return d3.ascending(a.sub_name_t, b.sub_name_t);});
    select.subcluster
      .select2({ minimumResultsForSearch: 10})
      .on('change', function(e) {
        var key = $(this).val();
        if (key) {
          var ckey = subclusters.filter(function(s){ return key == s.key_t }).shift().parent_key_t;
          if (key != ckey) {
            select.cluster.val(ckey).trigger('change');
          }
        }
      })

    // Clusters
    clusters = clusterData
      .filter(function(d){ return !d.subcluster_b; })
      .sort(function(a,b) { return d3.ascending(a.name_t, b.name_t);})
      .map(function(d){ return { id: d.key_t, text: d.name_t, code: d.code_t }; });
    // clusters.forEach(function(d) {
    //   $('<option>').val(d.key_t).text(d.name_t).attr('code', d.code_t).appendTo(select.cluster);
    // });

    select.cluster
      .select2({allowClear: true, placeholder: "Select a Cluster", data: clusters })
      .on('select2:select', function(e) {
        var key = $(this).val() || options.cluster;
        filterSubcluster(key);
      })
      .on('select2:unselect', function(e) {
        filterSubcluster(null);
      })
      .val(options.cluster).trigger('change')
      .trigger('select2:select');

    $('<a>')
      .attr('id', 'navigator-apply')
      .addClass('btn btn-info ')
      .text('Apply')
      .appendTo($('<p>').appendTo($content).css('text-align', 'right'))
      .on('click', function(e) {
        var country = select.country.val(),
          state = select.state.val(),
          economic = select.economic.val(),
          msa = select.msa.val(),
          county = select.county.val(),
          cluster = select.cluster.val(),
          subcluster = select.subcluster.val(),
          target = [],
          rtype = county ? 'county' :
            economic ? 'economic' :
            msa ? 'msa' :
            state ? 'state' : '',
          code = county ? county :
            economic ? economic :
            msa ? msa :
            state ? state : '';

        if (rtype) {
          target.push('region');
          var r = regions.filter(function(r){ return r.region_type_t == rtype && r.region_code_t == code }).shift();
          var key = r.key_t;
          options.regionKey = key;
          options.regionType = rtype;
        } else {
          delete options.regionType;
          delete options.regionKey;
        }
        if (cluster) target.push('cluster');

        var parts = ['', target.join('-')];
        if (cluster) {
          parts.push(cluster)
        }
        if (rtype) {
          parts.push(rtype);
          parts.push(key);
        } else if (subcluster) {
          parts.push('subclusters');
          parts.push(subcluster);
        }
        // Add current location tab to the URL
        var tab = { }, hash = '';
        if (subcluster) {
          // do nothing for now

        } else if (options.cluster && regionKey) {
          if (rtype && cluster) {
            parts.push(getTabPath(regionKey));
            hash = document.location.hash;
          } 
        } else if (options.cluster) {
          if (cluster && !rtype ) {
            parts.push(getTabPath(options.cluster));
            hash = document.location.hash;
          }

        } else if (regionKey) {
          if (rtype && !cluster) {
            parts.push(getTabPath(regionKey));
            hash = document.location.hash;
          }
        }

        var url = parts.join('/') + hash;
        options.regionCode = code;
        options.cluster = cluster;
        if (options.regionType && options.regionKey) {
          getRegion();
        }
        if (options.cluster) {
          getCluster();
          options.clusterCode = currentCluster.cluster_code_t;
        } else {
          delete options.clusterCode;
        }
        options.subcluster = subcluster;
        document.location.hash = urlParams();
        $handler.trigger('click'); // Close the navigation bar
        // $(this).attr('href', '#' + urlParams(options));
      });

    $('<button>').addClass('btn btn-link').text('Reset')
      .prependTo($('#navigator-apply').parent())
      .on('click', function(e) {
        select.state.val(stateCode).trigger('change').trigger('select2:select');
        select.county.val(countyCode).trigger('change');
        select.economic.val(eaCode).trigger('change');
        select.msa.val(msaCode).trigger('change');
        select.cluster.val(clusterCode).trigger('change');
        select.subcluster.val(subclusterCode).trigger('change');
      })

    function filterEAsByState(code) {
        var filteredEA = code ? eas.filter(function(d){return d.state_codes_txt.indexOf(code) >= 0}) : eas;
        var placeholder = code ? "Economic Area in Selected State" : "Select an Economic Area";
        select.economic.html($('<option>')).val('').trigger('change').select2({allowClear: true, placeholder: placeholder });
        filteredEA.forEach(function(d){
            $('<option>').val(d.region_code_t).text(d.name_t).appendTo(select.economic);
          });
        focus(select.economic);
    }

    function filterMSAsByState(code) {
        var filteredMSA = code ? msas.filter(function(d){return d.state_codes_txt.indexOf(code) >= 0}) : msas;
        var placeholder = code ? "MSA in Selected State" : "Select an MSA";
        select.msa.html($('<option>')).val('').trigger('change').select2({allowClear: true, placeholder: placeholder });
        filteredMSA.forEach(function(d){
            $('<option>').val(d.region_code_t).text(d.name_t).appendTo(select.msa);
          });
        focus(select.msa);
    }

    function filterCountiesByState(code) {
      var placeholder = code ? 'County in Selected State' : null;
      var filterFunction = code ? function(d){return d.region_state_code_t == code} : null;
      filterCounties(filterFunction, placeholder);
    }

    function filterCountiesByEA(code) {
      var placeholder = code ? 'County in Selected EA' : null;
      var countyIds = code ? eas.filter(function(ea){ return ea.region_code_t == code }).shift().regions_txt : null;
      var filterFunction = code ? function(d){return countyIds.indexOf(d.id) >= 0} : null;
      filterCounties(filterFunction, placeholder);
    }

    function filterCountiesByMSA(code) {
      var placeholder = code ? 'County in Selected MSA' : null;
      var countyIds = code ? msas.filter(function(msa){ return msa.region_code_t == code }).shift().regions_txt : null;
      var filterFunction = code ? function(d){return countyIds.indexOf(d.id) >= 0} : null;
      filterCounties(filterFunction, placeholder);
    }

    function filterCounties(filterFunction, placeholder) {
      var code = countyCode ? countyCode : '';
      var filteredCounties = filterFunction ? counties.filter(filterFunction) : counties;
      select.county.html($('<option>')).val('').trigger('change');
      filteredCounties.forEach(function(d){
          $('<option>').val(d.region_code_t).text(d.region_short_name_t).appendTo(select.county);
        });
      if (! placeholder) placeholder = 'Select a County';
      select.county.select2({ placeholder: placeholder, allowClear: true });
      focus(select.county);
    }

    function filterSubcluster(key) {
      var filtered = key ? subclusters.filter(function(d){return d.parent_key_t == key}) : subclusters;
      var placeholder = 'Select a Subcluster';
      select.subcluster.html($('<option>'));
      filtered.forEach(function(d){
        $('<option>').val(d.key_t).text(d.sub_name_t).appendTo(select.subcluster);
      });
      if (key) {
        focus(select.subcluster);
        placeholder = 'Subclusters in Selected Cluster';
      }
      select.subcluster.val(subclusterCode).trigger('change').select2({ placeholder: placeholder, allowClear: true });
    }

    function focus(el) {
      el.next().addClass("focused").delay(1000).queue(function(){
          $(this).removeClass("focused").dequeue();
      });            
    }
    function getTabPath(path) {
      var current_path = document.location.pathname.split('/'),
          i = current_path.indexOf(path) + 1;
      return current_path[i] ? current_path[i] : undefined;
    }
  });

  function loadRegionChart() {
    var year_max = options.year || 2013;
    var urls = [];
    var region = options.regionType && options.regionKey ? '/' + options.regionType + '/' + options.regionKey : '';
    var country = '/country/united_states';
    var cluster = options.clusterCode ? '/' + options.clusterCode : '';
    var regionType = '/' + (options.regionType || 'state');

    $('#chart').empty();
    switch (options.chart) {
      case 'subregions':
        if (! region) {
          $('<div>').addClass('container').css('padding', '15px').text('Select a Region first.').appendTo('#chart');
          return;
        }
        if (options.regionType === 'county') {
          $('<div>').addClass('container').css('padding', '15px').text('No subregions available for counties.').appendTo('#chart');
          return;
        }
        var subType = options.regionType === 'state' ? 'economic' : 'county';
        urls.push('/report/region/subregions#' + (region || country) + '/1998/'+ year_max + '/' + subType + '/private_wage_tf');
        urls.push('/report/region/subregions#' + (region || country) + '/1998/'+ year_max + '/' + subType + '/emp_tl');
        break;
      case 'innovation':
        if (! cluster) {
          $('<div>').addClass('container').css('padding', '15px').text('Select a Cluster first.').appendTo('#chart');
          return;
        }
        var chart = '/report/cluster/innovation#/' + options.cluster + '/1998/' + year_max + regionType
          + '?subcluster=false&benchmark=false';
        urls.push(chart);
        break;
      case 'specialization':
        if (! cluster) {
          $('<div>').addClass('container').css('padding', '15px').text('Select a Cluster first.').appendTo('#chart');
          return;
        }
        var chart = '/report/cluster/specialization#/' + options.cluster + '/all/1998/' + year_max + regionType
          + '?benchmark=true';
        urls.push(chart);
        break;
      case 'performance':
        loadPerformanceCharts();
        break;
      case 'timeline':
        if (! cluster) {
          $('<div>').addClass('container').css('padding', '15px').text('Select a Cluster first.').appendTo('#chart');
          return;
        }
        var chart = '/report/cluster/timeline#/' + options.cluster + '/all' + regionType + '/emp_tl?benchmark=true';
        urls.push(chart);
        break;
      case 'jobs':
        if (! cluster) {
          $('<div>').addClass('container').css('padding', '15px').text('Select a Cluster first.').appendTo('#chart');
          return;
        }
        var chart = '/report/cluster/jobcreation#/' + options.cluster + '/' + (options.subcluster || 'all') + '/1998/'+ year_max 
          + regionType + '?subcluster=true&benchmark=true';
        urls.push(chart);
        break;
      case 'wages':
        if (! cluster) {
          $('<div>').addClass('container').css('padding', '15px').text('Select a Cluster first.').appendTo('#chart');
          return;
        }
        var chart = '/report/cluster/wages#' + cluster + '/' + (options.subcluster || 'all') + '/' + year_max
          + regionType + '?subcluster=true&benchmark=false';
        urls.push(chart);
        break;
      case 'employment':
        if (! cluster) {
          $('<div>').addClass('container').css('padding', '15px').text('Select a Cluster first.').appendTo('#chart');
          return;
        }
        var chart = '/report/cluster/employment#' + cluster + '/' + (options.subcluster || 'all') + '/' + year_max
          + regionType + '?subcluster=false&benchmark=false';
        urls.push(chart);
        break;
      case 'map':
        var region = options.regionType && options.regionCode ? options.regionType + '/' + options.regionCode : 'economic/0';
        var chart = '/report/map#/all/1998/2013/' + (region || country) + '/all/all/gdp_per_capita_tf';
        urls.push(chart);
        break;
      case 'organizations':
        var region = options.regionType && options.regionCode ? options.regionType + '/' + options.regionCode : 'economic/0';
        var chart = '/report/map/organization#/1998/' + year_max + (region || country) + '/all/all/all';
        urls.push(chart);
        break;
    }
    urls.forEach(function(url){
      var $iframe = $('<iframe>').attr('src', hbsBaseUrl + url)
      $iframe.appendTo('#chart');
    });
  }

  function loadClusterChart() {
    var year_max = options.year || 2013;
    var url = '';
    var region = options.regionType && options.regionKey ? '/' + options.regionType + '/' + options.regionKey : '';
    var country = '/country/united_states';
    var cluster = options.cluster ? '/' + options.cluster : '/traded';
    $('#chart').empty();
    switch (options.chart) {
      case 'map':
        if (! options.cluster) {
          $('<div>').addClass('container').css('padding', '15px').text('Select a Cluster first.').appendTo('#chart');
          return;
        }
        url = '/report/map#/cluster/1998/2013' + '/' 
          + (options.regionType  || 'economic') + '/' 
          + (options.regionCode  || 0) + '/' 
          + (options.clusterCode || 0) + '/all/specialization_tl';
        break;
      case 'related':
        url = '/report/relatedclusters#/' + (options.clusterCode || '') + region;
        break;
      case 'innovation':
        url = '/report/region/innovation#' + (region || country) + '/1998/' + year_max + cluster + '?subcluster=false&benchmark=false';
        break;
      case 'specialization':
        url = '/report/region/specialization#' + (region || country) + '/1998/' + year_max + cluster + '?subcluster=false&benchmark=false';
        break;
      case 'timeline':
        url = '/report/region/timeline#' + (region || country) + cluster + '/emp_tl?benchmark=false';
        break;
      case 'jobs':
        url = '/report/region/jobcreation#' + (region || country) + '/1998/' + year_max + cluster + '?subcluster=false&benchmark=false';
        break;
      case 'wages':
        url = '/report/region/wages#' + (region || country) + '/' + year_max + cluster + '?benchmark=true';
        break;
      case 'employment':
        url = '/report/region/employment#' + (region || country) + '/' + year_max + cluster + '?benchmark=true';
        break;
    }
    $('<iframe>').attr('src', hbsBaseUrl + url).appendTo('#chart');
  }

  function updateHeader() {
    $('#region-header').css('visibility', options.regionType && options.regionCode ? 'visible' : 'hidden');
    if (options.regionType && options.regionCode) {
      
    }
    $('#cluster-header').css('visibility', options.cluster ? 'visible' : 'hidden');
    $('#subcluster-header').css('visibility', options.subcluster ? 'visible' : 'hidden');
    
    $('.nav-tabs li').removeClass('active').filter('#'+options.type).addClass('active');
    
    chartControls();
  }

  function urlParams() {
    var result = [];
    for (var key in options) {
      if (options[key]) {
        result.push(key + '=' + options[key]);
      }
    }
    return '?' + result.join('&');
  }

  function parseURL() {
    var parts = document.location.hash.split('?'),
      hash = parts[0],
      params = parts[1];
    var result = {};
    if (params && params.split('&').length) {
      params.split('&').forEach(function(p){
        if (p) {
          var param = p.split('=');
          result[param[0]] = param[1];
        }
      });
    }
    if (!result.type) {
      result.type = 'region';
    }
    if (!result.chart) {
      result.chart = 'map';
    }
    return result;
  }

  function getRegion() {
    if (options.regionType && options.regionKey) {
      currentRegion = regionData.filter(function(d){
        return d.region_type_t === options.regionType && d.key_t === options.regionKey;
      }).shift();
      $('#region-name').text(currentRegion.name_t);
    } else {
      currentRegion = undefined;
      $('#region-name').empty();
    }
  }

  function getCluster() {
    if (options.cluster) {
      currentCluster = clusterData.filter(function(d){
        return d.key_t === options.cluster;
      }).shift();
      $('#cluster-name').text(currentCluster.name_t);
    } else {
      currentCluster = undefined;
      $('#cluster-name').html('');
    }
  } 

  function chartControls() {
    var $controls = $('#cluster-list-controls');
    
    $controls.empty();
    
    chartOptions[options.type].forEach(function(d){
      var $btn = $('<a>')
        .addClass('btn btn-sm btn-default')
        .data(d)
        .html(d.label);

      if (d.id === options.chart){
        $btn.addClass('active');
      }
      $btn.appendTo($controls);

    });

    $controls.find('a.btn').on('click', function(e){
      e.preventDefault();
      options.chart = $(this).data().id;
      document.location.hash = '#' + urlParams();
    });
  }

  function loadPerformanceCharts() {
    if (! options.regionType || ! options.regionCode) {
      $('<div>').addClass('container').css('padding', '15px').text('Select a Region first.').appendTo('#chart');
      return;
    }
    var dict = ['gdp_per_capita_tf',
      'private_wage_tf',
      'real_per_capita_personal_income_chained_2008_dollars_tf',
      'labor_mobilization_tf',
      'emp_tl',
      'unemployment_rate_tf',
      'poverty_rate_tf',
      'labor_force_productivity_tf',
      'innovation_tf',
      'est_tl',
      'exports_tf',
      'bea_foreign_employment_by_state_industry__all_industries_tf',
      'rd_per_capita_tf',
      'federal_rd_per_capita_tf',
      'venture_capital_per_gdp_tf',
      'scientific_degrees_tf',
      'advanced_scientific_workers_tf',
      'educational_attainment_25_years_and_over_high_school_graduate_per_tf',
      'educational_attainment_25_years_and_over_some_college_or_associates_per_tf',
      'educational_attainment_25_years_and_over_bachelors_per_tf',
      'unionization_rate_tf',
      'taxes_per_gdp_tf',
      'corp_taxes_per_gdp_tf',
      'str_emp_per_tf',
      'manufacturing_intensity_tf',
      'personal_consumption_expenditures_per_capita_tf',
      'population_by_age_ages_0_to_4_preschool_per_tf',
      'population_by_age_ages_5_to_17_school_age_per_tf',
      'population_by_age_ages_18_to_24_college_age_per_tf',
      'population_by_age_ages_25_to_44_young_adult_per_tf',
      'population_by_age_45_to_64_older_adult_per_tf',
      'population_by_age_age_65_and_older_older_per_tf',
      'total_population_gr',
      'young_adult_population_gr',
      'population_density_tf',
      'net_international_migration_per_tf',
      'net_domestic_migration_per_tf',
      'agricultural_output_gdp_tf',
      'gov_employment_local_services_tf',
      'gov_employment_federal_services_tf',
      'gov_employment_higher_education_tf',
      'gov_employment_health_hospitals_tf',
      'military_payroll_per_capita_tf',
      'avg_firm_size_tf',
      'fortune1000_tl',
    ];
    var legendURL = hbsBaseUrl + '/viz/perf_legend.html#' + options.regionType;
    $('#chart').append('<iframe src="' + legendURL +'" scrolling="no" style="height:70px;margin-top:12px;"></iframe>');
    dict.forEach(function(d){
      var url = hbsBaseUrl + '/report/region/spark#/' + options.regionType + '/' + options.regionCode + '/' + d;
      $('<div class="col-md-6 sparkline sparkline-1 odd chart chart-100" style="padding-bottom: initial;height:340px;">')
        .append('<iframe src="' + url + '">')
        .appendTo('#chart')
    });
  }


})(jQuery);
