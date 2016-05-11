(function($) {
  Drupal.behaviors.hbs_gauge = {
    attach: function(context, settings) {
      settings.hbs_gauge = settings.hbs_gauge || Drupal.settings.hbs_gauge;
      var selector = '#block-hbs-viz-'+settings.hbs_gauge.delta+' .gauge-wrapper';

      //D3 Elements & etc.
      //=======
      var gauge;

      queue()
        .defer(d3.json, settings.hbs_gauge.dataJson)
        .await(function(err, data) {


          gauge = d3.select(selector)
            .call(d3Gauge);

        });


      //$( window ).resize(function() {});
    }
  };
})(jQuery);
