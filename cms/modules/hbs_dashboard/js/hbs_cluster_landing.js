(function($) {
  Drupal.behaviors.hbs_cluster_landing = {
    attach: function(context, settings) {
        $('.related-chart').show();
        $('.cluster-list').hide();
        $('.employment-chart').hide();
        $('.wages-chart').hide();
        $('.jobcreation-chart').hide();
        $('.specialization-chart').hide();
        var year_max = Drupal.settings.hbs_dashboard.year || 2013;

        $('#cluster-list-controls .btn').click(function() {
            $('.cluster-graph').hide();
            switch (this.id) {
                case 'clusters-list':
                    $('.cluster-list').show();
                    // Get current scroll location to set after default button clicked.
                    var scrollLocation = $(window).scrollTop();
                    if ( window.history && window.history.pushState ) {
                        window.history.pushState('', '', window.location.pathname);
                    } else {
                        window.location.href = window.location.href.replace(/#.*$/, '#');
                    }
                    $( window ).scrollTop( scrollLocation ).trigger('resize');
                    break;
                case 'clusters-employment':
                    $('.employment-chart').show();
                    if (! $.trim($('.employment-chart').html()) ) {
                        $('.employment-chart').html('<iframe src="/data/report/region/employment#/country/united_states/' + year_max + '/traded?subcluster=false&benchmark=false"" scrolling="no"></iframe>');
                    }
                    break;
                case 'clusters-wages':
                    $('.wages-chart').show();
                    if (! $.trim($('.wages-chart').html()) ) {
                        $('.wages-chart').html('<iframe src="/data/report/region/wages#/country/united_states/' + year_max + '/traded?subcluster=false&benchmark=false"" scrolling="no"></iframe>');
                    }
                    break;
                case 'clusters-jobs':
                    $('.jobcreation-chart').show();
                    if (! $.trim($('.jobcreation-chart').html())) {
                        $('.jobcreation-chart').html('<iframe src="/data/report/region/jobcreation#/country/united_states/1998/' + year_max + '/traded?subcluster=false&benchmark=false" scrolling="no"></iframe>');
                    }
                    break;
                case 'clusters-specialization':
                    $('.specialization-chart').show();
                    if (! $.trim($('.specialization-chart').html())) {
                        $('.specialization-chart').html('<iframe src="/data/report/region/specialization#/country/united_states/1998/' + year_max + '/traded?subcluster=false&benchmark=false" scrolling="no"></iframe>');
                    }
                    break;
                case 'clusters-timeline':
                    $('.timeline-chart').show();
                    if (! $.trim($('.timeline-chart').html())) {
                        $('.timeline-chart').html('<iframe src="/data/report/region/timeline#/country/united_states/traded/emp_tl?benchmark=false" scrolling="no"></iframe>');
                    }
                    break;
                case 'clusters-innovation':
                    var inno_year_max = Drupal.settings.hbs_dashboard.innovation_year || 2013;
                    $('.innovation-chart').show();
                    if (! $.trim($('.innovation-chart').html())) {
                        $('.innovation-chart').html('<iframe src="/data/report/region/innovation#/country/united_states/2000/' + inno_year_max + '/traded?subcluster=false&benchmark=false" scrolling="no"></iframe>');
                    }
                    break;
                case 'related-clusters':
                    $('.related-chart').show().height(800);
                    if (! $.trim($('.related-chart').html())) {
                        $('.related-chart').html('<iframe src="/data/report/relatedclusters#/" scrolling="no"></iframe>');
                    }
                    break;
            }
            window.location.hash = this.id;
            $('#cluster-list-controls .btn').removeClass('active');
            $(this).addClass('active');
        });

        var hash = window.location.hash.replace('#', '');
        if(hash) {
            $( "#" + hash ).trigger( "click" );
            switch(hash){
                case 'employment':
                    $('#clustersoremp').trigger('click');
                    break;
                default:
                    $('#clustersor' + hash).trigger('click');
            }

        } else {
            $('.related-chart').show().height(800);
            if (! $.trim($('.related-chart').html())) {
                $('.related-chart').html('<iframe src="/data/report/relatedclusters#/" scrolling="no"></iframe>');
            }
        }
    }
  }
})(jQuery);
