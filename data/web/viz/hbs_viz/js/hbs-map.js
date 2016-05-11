(function ($) {
  Drupal.behaviors.hbs_map = {
    attach: function (context, settings) {
      settings.hbs_map = settings.hbs_map || Drupal.settings.hbs_map;
      var selector = '#block-hbs-viz-' + settings.hbs_map.delta + ' .map-wrapper',
        year = settings.hbs_map.year,
        start = 1998,
        regionType = settings.hbs_map.region_type,
        mapType = settings.hbs_dashboard ? settings.hbs_dashboard.type :'all',
        indicator = 'gdp_per_capita_tf',
        regionCode = 0,
        cluster = 'all',
        subcluster = 'all';
        if (settings.hbs_dashboard) {
          if (settings.hbs_dashboard.data && settings.hbs_dashboard.data.region) {
            regionType = settings.hbs_dashboard.data.region.region_type_t;
            regionCode = settings.hbs_dashboard.data.region.region_code_t;
          }
          if (settings.hbs_dashboard.data && settings.hbs_dashboard.data.cluster) {
            cluster = settings.hbs_dashboard.data.cluster.cluster_code_t;
          }
          if (settings.hbs_dashboard.data && settings.hbs_dashboard.data.subcluster) {
            subcluster = settings.hbs_dashboard.data.subcluster.sub_code_t;
          }

          if(mapType == "subCluster" || mapType == "cluster") {
            indicator = 'specialization_tl';
            regionType = 'economic';

          } else if (mapType == 'all') {
            regionType = 'economic';
          }

          switch (settings.hbs_dashboard.tab) {
            case 'topRegions':
              indicator = 'specialization_tl';
              regionType = 'economic';
              break;
            case 'subClusters':
              indicator = 'specialization_tl';
              this.subCluster = '1';
              regionType = 'economic';
            case 'summary':
              indicator = 'specialization_tl';
              if(settings.hbs_dashboard.type == "cluster"){
                regionType = 'economic';
              }
              break;
          }
        }
        if (settings.hbs_map.play_carousel) {
          mapType = 'carousel';
        }
        if (settings.hbs_viz && settings.hbs_viz.isOrgDashboard) {
          mapType =  'organization';
          indicator =  'all';
          $(selector).html('<iframe src="/data/report/map/organization#/' + start + '/' + year +'/' + regionType +'/' + regionCode +'/' + cluster +'/' + subcluster +'/' + indicator + '" scrolling="no"></iframe>');
        
        } else {
          $(selector).html('<iframe src="/data/report/map#/' + mapType + '/' + start + '/' + year +'/' + regionType +'/' + regionCode +'/' + cluster +'/' + subcluster +'/' + indicator + '" scrolling="no"></iframe>');
        }
        return;
    }
  };
})(jQuery);
