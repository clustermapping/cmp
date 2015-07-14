(function($) {
  Drupal.behaviors.hbs_cluster_landing = {
    attach: function(context, settings) {
        $('.cluster-list').show();
        $('.employment-chart').hide();
        $('.wages-chart').hide();
        $('.jobcreation-chart').hide();
        $('.specialization-chart').hide();
        var year_max = d3.max(Drupal.settings.hbs_dashboard.years) || 2013;
        $('#cluster-list-controls .btn').click(function() {
            $('.cluster-graph').hide();
            switch (this.id) {
                case 'clustersortname':
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
                case 'clustersoremp':
                    window.location.hash = '#employment';
                    $('.employment-chart').show();
                    if (! $.trim($('.employment-chart').html()) ) {
                        $('.employment-chart').html('<iframe src="/data/report/region/employment#/country/united_states/' + year_max + '/traded?subcluster=false&benchmark=false"" scrolling="no"></iframe>');
                    }
                    break;
                case 'clustersorwage':
                    window.location.hash = '#wage';
                    $('.wages-chart').show();
                    if (! $.trim($('.wages-chart').html()) ) {
                        $('.wages-chart').html('<iframe src="/data/report/region/wages#/country/united_states/' + year_max + '/traded?subcluster=false&benchmark=false"" scrolling="no"></iframe>');
                    }
                    break;
                case 'clustersorjobcreate':
                    window.location.hash = '#jobcreate';
                    $('.jobcreation-chart').show();
                    if (! $.trim($('.jobcreation-chart').html())) {
                        $('.jobcreation-chart').html('<iframe src="/data/report/region/jobcreation#/country/united_states/1998/' + year_max + '/traded?subcluster=false&benchmark=false" scrolling="no"></iframe>');
                    }
                    break;
                case 'clustersorspecialize':
                    window.location.hash = '#specialize';
                    $('.specialization-chart').show();
                    if (! $.trim($('.specialization-chart').html())) {
                        $('.specialization-chart').html('<iframe src="/data/report/region/specialization#/country/united_states/1998/' + year_max + '/traded?subcluster=false&benchmark=false" scrolling="no"></iframe>');
                    }
                    break;
                case 'clustersortimeline':
                    window.location.hash = '#timeline';
                    $('.timeline-chart').show();
                    if (! $.trim($('.timeline-chart').html())) {
                        $('.timeline-chart').html('<iframe src="/data/report/region/timeline#/country/united_states/traded/emp_tl?benchmark=false" scrolling="no"></iframe>');
                    }
                    break;
                case 'clustersorinnovation':
                    window.location.hash = '#innovation';
                    $('.innovation-chart').show();
                    if (! $.trim($('.innovation-chart').html())) {
                        $('.innovation-chart').html('<iframe src="/data/report/region/innovation#/country/united_states/1998/' + year_max + '/traded?subcluster=false&benchmark=false" scrolling="no"></iframe>');
                    }
                    break;
            }
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
        }
    }
  }
})(jQuery);
