(function($) {
  Drupal.behaviors.hbs_breadcrumb = {
    attach: function(context, settings) {
      if (! Drupal.settings.hbs_dashboard) return;

      var regionCode, regionType, regionKey, clusterCode, subclusterCode, ie9;
      if (navigator.appVersion.indexOf("MSIE 9") > -1) { ie9 = true; }

      switch  (Drupal.settings.hbs_dashboard.type) {
        case 'region-cluster':
          clusterCode = Drupal.settings.hbs_dashboard.data.cluster.key_t;
          regionKey = Drupal.settings.hbs_dashboard.data.region.region_key_t;
        case 'region':
          regionType = Drupal.settings.hbs_dashboard.data.region.region_type_t;
          regionCode = Drupal.settings.hbs_dashboard.data.region.region_code_t;
          regionKey = Drupal.settings.hbs_dashboard.data.region.region_key_t;
          break;
        case 'subCluster':
          subclusterCode = Drupal.settings.hbs_dashboard.data.subcluster.key_t;
        case 'cluster':
          if (Drupal.settings.hbs_dashboard.data) {
            clusterCode = Drupal.settings.hbs_dashboard.data.cluster.key_t;
          }
          break;
      }

      var MythosVis = window.MythosVis,
        loader = new MythosVis.DataLoader();

      $('<div>').addClass('panel').attr('id', 'region-navigation-panel').appendTo('.main-container');
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

      loader.request(['/data/region', '/data/cluster'], function(regions, clusterData) {
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
        
        var stateCode = regionType == 'state' ? regionCode : 
          (regionType == 'county' ? Drupal.settings.hbs_dashboard.data.region.region_code_t.substr(0, 2): '');
        var eaCode = regionType == 'economic' ? regionCode : '';
        var msaCode = regionType == 'msa' ? regionCode : '';
        var countyCode = regionType == 'county' ? regionCode : '';

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
          .sort(function(a,b) { return d3.ascending(a.name_t, b.name_t);});
        clusters.forEach(function(d) {
          $('<option>').val(d.key_t).text(d.name_t).appendTo(select.cluster);
        });

        select.cluster
          .select2({allowClear: true, placeholder: "Select a Cluster"})
          .on('select2:select', function(e) {
            var key = $(this).val() || clusterCode;
            filterSubcluster(key)
          })
          .on('select2:unselect', function(e) {
            filterSubcluster(null);
          })
          .val(clusterCode).trigger('change')
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
            }
            if (cluster) target.push('cluster');

            var parts = ['', target.join('-')];
            if (cluster) parts.push(cluster)
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

            } else if (clusterCode && regionKey) {
              if (rtype && cluster) {
                parts.push(getTabPath(regionKey));
                hash = document.location.hash;
              } 
            } else if (clusterCode) {
              if (cluster && !rtype ) {
                parts.push(getTabPath(clusterCode));
                hash = document.location.hash;
              }

            } else if (regionKey) {
              if (rtype && !cluster) {
                parts.push(getTabPath(regionKey));
                hash = document.location.hash;
              }
            }

            var url = parts.join('/') + hash;
            $(this).attr('href', url);
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

    }
  };
 })(jQuery);