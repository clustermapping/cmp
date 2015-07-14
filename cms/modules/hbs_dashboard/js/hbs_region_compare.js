(function($) {
  Drupal.behaviors.hbs_region_dashboard = {
    attach: function(context, settings) {
      $('#region-compare-menu .close').on('click', function(e) { $(this).parent().hide(); });
      $('#region-compare-dropdown').on('click', function (e) {
        e.preventDefault();
        $('#region-compare-menu').show();
        $('#region-compare-input-regions').focus();
      }).parent().show();
      $('#compare-region-add').hide();
      $('#region-compare-input-regions').insertBefore('#region-compare-regions');

      // BETA
      $('h1').append('<div class="beta-wrapper" style="vertical-align:middle;display:inline;"><a href="/about" class="beta-btn btn btn-primary btn-xs">Beta</a></div>')

      var compare = settings.hbs_region_compare,
        clusters = compare.clusters,
        cluster_data = compare.cluster_data,
        indicator_data = compare.indicator_data,
        indicators = compare.indicators,
        regions = compare.regions, 
        code = compare.code,
        owner = compare.owner || compare.owner,
        max = { clusters: 10, regions: 10, indicators: 10 };

      function addItem(kind, key, name) {
        var container = $('#region-compare-' + kind);
        if (key && !container.find('a[key="' + key + '"]').length) {
          container.append('<p><a type="button" kind="'+kind+'" key="'+key+'" class="compare-delete"><span aria-hidden="true">&times;</span></a>'+ name +'</p>');
        }
        var disabled = container.find('a').length >= max[kind];
        $('#region-compare-input-' + kind).attr('disabled', disabled).val('');
      }

      // Clusters List
      cluster_data.forEach(function(c) {
        if (clusters.indexOf(c.key) >= 0) {
          addItem('clusters', c.key, c.name);
        }
      });

      // Clusters select
      $('#region-compare-input-clusters')
      .append(cluster_data.map(function(c){ return '<option value="' + c.key + '"">' + c.name + '</option>' }).join(''))
      .on('change', function(e){
        var key = $(this).val(), name = $(this).find('option:selected').text();
        addItem('clusters', key, name);
      });

      // Indicators List
      indicator_data.forEach(function(i) {
        if (indicators.indexOf(i.key) >= 0) {
          addItem('indicators', i.key, i.name);
        }
      });

      // Indicators select
      $('#region-compare-input-indicators')
        .append(indicator_data.sort(function(a, b) { return d3.ascending(a.name, b.name);}).map(function(i){ return '<option value="' + i.key + '"">' + i.name + '</option>' }).join(''))
        .on('change', function(e) {
          var key = $(this).val(), name = $(this).find('option:selected').text();
          addItem('indicators', key, name);
        });

      // Add Region
      $('#region-compare-menu').on('click', '.quicksearch-results a', function(e) {
        e.preventDefault();
        $('.quicksearch-results .close-button').trigger('click');
        var name = $(this).text(), key = $(this).attr('region');
        addItem('regions', key, name);
      });

      // Delete
      $('#region-compare-edit').on('click', '.compare-delete', function(e) {
        e.preventDefault();
        $(this).parent().remove();
        var kind = $(this).attr('kind');
        $('#region-compare-input-' + kind).attr('disabled', false);
      });

      // Regions List
      compare.region_data.forEach(function(r) {
        addItem('regions', 'region/' + r.type + '/' + r.code, r.name);
      });

      // Open Menu
      $('#region-compare-dropdown').html('<span class="glyphicon glyphicon-plus"></span> Edit Comparison')
      .off('click').on('click', function(e) {
        e.preventDefault();
        var name = (compare.name == 'New Comparison' ? '' : compare.name) ;
        $('#region-compare-edit').show();
        $('#region-compare-name').val(name);
        $('#region-compare-menu').show();
      });

      $('.list-expand').next().hide();
      $('.list-collapse').prepend('<span class="glyphicon glyphicon-collapse-down"></span>')
      $('.list-expand').prepend('<span class="glyphicon glyphicon-expand"></span>')
      $('.list-collapse, .list-expand').on('click', function(e) {
          $(this).find('span.glyphicon').toggleClass('glyphicon-collapse-down glyphicon-expand').next().toggle();
          $(this).toggleClass('list-collapse list-expand').next().toggle();
        });

      $("#region-compare-name").on('keyup', function(e) {
        if ($(this).val().trim().length) {
          $(this).parent().removeClass('error');
        }
      });

      // Save Comparison
      $('#region-compare-cancel').on('click', function() {
          document.location = '/compare/' + code;
      });
      $('#region-compare-save').on('click', function() {
        var name = $("#region-compare-name").val(),
          regions = $('#region-compare-regions a').map(function(i, a){ return $(a).attr('key') }).toArray(),
          clusters = $('#region-compare-clusters a').map(function(i, a){ return $(a).attr('key') }).toArray(),
          indicators = $('#region-compare-indicators a').map(function(i, a){ return $(a).attr('key') }).toArray(),
          data = {
            code: code,
            name: name,
            regions: regions,
            clusters: clusters,
            indicators: indicators,
          };
        if (!name.trim().length) {
          $("#region-compare-name").focus().parent().addClass('error');
          return false;
        }
        $(this).text('Saving...');
        $.post('/compare/save', data)
        .then(function(result) {
          $('#region-compare-save').text('Reloading...');
          document.location = '/compare/' + result.code;
        });
      });

      $('.employment-chart').show();
      $('.wages-chart').hide();
      $('.jobcreation-chart').hide();
      $('.specialization-chart').hide();
      $('.timeline-chart').hide();
      $('.innovation-chart').hide();
      $('#region-compare-controls .btn').click(function() {
          embedIframe(this.id);
      });

      function embedIframe(id, dontHash){
          var year = '2013',
              benchmark = true,
              indicator = '';
          $('.cluster-listing .cluster-graph').hide();

          if( !dontHash ){
              window.location.hash = '#'+id;
          }
          switch (id) {
              case 'employment':
                indicator = 'emp_tl';
                break;
              case 'jobcreation':
                year = '1998/2013'
                indicator = 'emp_creation_tl';
                break;
              case 'wages':
                indicator = 'private_wage_tf';
                break;
          }
          var query = '#/' + code + '/percent/' + indicator + '/'+ year ;

          $('.'+id+'-chart').show();
          if (! $.trim($('.'+id+'-chart').html()) ) {
            $('.'+id+'-chart').html('<iframe src="/data/report/region/compare' + query +'" scrolling="no"></iframe>');
          }
          $('#region-compare-controls .btn').removeClass('active');
          $('#'+id).addClass('active');
      }

      var hash = window.location.hash.replace('#', '');
      if(hash) {
          $( "#" + hash ).trigger( "click" );
      }else{
          embedIframe('employment', true);
      }

      $(window).on('scroll', function(e) {
        var top = $(this).scrollTop()
        var left = jQuery('#region-compare-dropdown').parent().offset().left;
        if (top > 265) {
          $('#region-compare-dropdown').parent().addClass('sticky-button').css('left', left);
        } else {
          $('#region-compare-dropdown').parent().removeClass('sticky-button').css('left', 'initial');
        }
      });

    }
  }
 })(jQuery);