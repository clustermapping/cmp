(function($) {
  Drupal.behaviors.hbs_region_cluster = {
    attach: function(context, settings) {

        var rData = Drupal.settings.hbs_dashboard.data.region,
            cData = Drupal.settings.hbs_dashboard.data.cluster,
            regionType = (rData && rData.region_type_t)? rData.region_type_t : 'country',
            rId = (rData && rData.region_type_t)? rData.key_t : 'united_states',
            cId = ( cData )? cData.key_t : rData.cluster_code_t,
            year = Drupal.settings.hbs_dashboard.year;

        if(cId == 'all') cId = "traded";

        $('.employment-chart').show();
        $('.wages-chart').hide();
        $('.jobcreation-chart').hide();
        $('.specialization-chart').hide();
        $('.timeline-chart').hide();
        $('.innovation-chart').hide();
        $('#cluster-list-controls .btn').click(function() {
            embedIframe(this.id);
        });

        function embedIframe(id, dontHash){
            var yearStr = '/' + year,
                benchmark = true,
                indicatorStr = '';
            $('.cluster-listing .cluster-graph').hide();

            if( !dontHash ){
                window.location.hash = '#'+id;
            }
            switch (id) {
                case 'jobcreation':
                    //benchmark = false;
                case 'innovation':
                  yearStr = '/1998/' + year;
                  break;
                case 'specialization':
                  yearStr = '/1998/' + year;
                  break;
                case 'timeline':
                  yearStr = '';
                  indicatorStr = '/emp_tl';
                  break;
            }
            var query = '#/'+regionType+ '/'+ rId + yearStr+'/'+cId + indicatorStr +'?benchmark=' + benchmark;

            $('.'+id+'-chart').show();
            if (! $.trim($('.'+id+'-chart').html()) ) {
              $('.'+id+'-chart').html('<iframe src="/data/report/region/'+ id + query +'" scrolling="no"></iframe>');
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


        if (! $('.company-innovation-list').length) return;


            var data = settings.hbs_dashboard.data.region,
                region_type = data.region_type_t,
                region_id = data.region_code_t;

        $('.company-innovation-list').html('<iframe src="/data/report/region/innovationtable#/' + region_type + '/' + region_id + '/50" scrolling="no"></iframe>');
        return;
    }
  }
})(jQuery);
