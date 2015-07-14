(function($) {
  Drupal.behaviors.hbs_region_cluster = {
    attach: function(context, settings) {
        var regionType = Drupal.settings.hbs_dashboard.data.cluster.region_type_t || 'state',
            rId = Drupal.settings.hbs_dashboard.data.cluster.region_code_t || '98',
            scId = Drupal.settings.hbs_dashboard.type == 'subCluster' ? '/'+Drupal.settings.hbs_dashboard.data.subcluster.key_t:'/all',
            cId = Drupal.settings.hbs_dashboard.data.cluster.key_t,
            year = Drupal.settings.hbs_dashboard.year || 2013;

        if(cId == 'all') cId = "traded";

        $('.employment-chart').show();
        $('.wages-chart').hide();
        $('.jobcreation-chart').hide();
        $('.specialization-chart').hide();
        $('#cluster-list-controls .btn').click(function() {
            regionType = Drupal.settings.hbs_dashboard.data.cluster.region_type_t || 'state';
            embedIframe(this.id);
        });

        function embedIframe(id, dontHash){
            var yearStr = '/' + year,
                benchmark = true;
            $('.cluster-graph').hide();

            if( !dontHash ){
                window.location.hash = '#'+id;
            }

            switch (id) {
                case 'jobcreation':
                    //benchmark = false;
                    scId = '/all';
                    yearStr = '/1998/' + year;
                    break;
                case 'innovation':
                    yearStr = '/1998/' + year;
                    scId = '';
                    break;
                case 'specialization':
                    yearStr = '/1998/' + year;
                    break;
                case 'timeline':
                    yearStr = '';
                    regionType += '/emp_tl';
                    break;
            }
            var query = '#/' + cId + scId + yearStr + '/' + regionType + '?benchmark=' + benchmark ;
            $('.'+id+'-chart').show();

            if (! $.trim($('.'+id+'-chart').html()) ) {
                $('.'+id+'-chart').html('<iframe src="/data/report/cluster/'+ id + query +'" scrolling="no"></iframe>');
            }
            $('#cluster-list-controls .btn').removeClass('active');
            $('#'+id).addClass('active');
        }
        var hash = window.location.hash.replace('#', '');
        if(hash) {
            $( "#" + hash ).trigger( "click" );
        }else{
            embedIframe('employment', true);
        }
    }
  }
})(jQuery);
