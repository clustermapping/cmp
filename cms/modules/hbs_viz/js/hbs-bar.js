(function($) {
  Drupal.behaviors.hbs_bar = {
    attach: function(context, settings) {
      settings.hbs_bar = settings.hbs_bar || Drupal.settings.hbs_bar;

      var selector = '#block-hbs-viz-'+settings.hbs_bar.delta+ ' .bar-wrapper',
          width = $(selector).width(),
          lKeys =[
            {
              type:'color',
              element:'line',
              attr:{class: 'mark'},
              label: createRandomWord(10)
            },
            {
              type:'color',
              element:'rect',
              attr:{class: 'bar positive'},
              label: createRandomWord(10)
            }];

      // Settings for different types
      var regionSettings = {
          scales : {
            x: {
              key: 'cluster_name_t'
            },
            y: {
              key: 'emp_tl',
              key2: 'emp_reported_tl'
            }
          },
          axesData : [
            {
              label: null
            },
            {
              label: null
            }
          ],
          orderer: 'emp_tl'
        },
        clusterSettings = {
          scales : {
            x: {
              key: 'region_name_t'
            },
            y: {
              key: 'lq_tf',
              key2: 'lq_tf'
            }
          },
          axesData : [
            {
              label: null
            },
            {
              label: null
            }
          ],
          orderer: 'lq_tf'
        };

      //D3 elemets
      //=======
      var barChart,
          legend;

      d3.json(settings.hbs_bar.dataJson, function(error, json) {
        var settings = Drupal.settings.hbs_bar.typeFor == 'region' ? regionSettings : clusterSettings;
        json = json.sort(function(a, b) {
          var aVal = a[settings.orderer],
              bVal = b[settings.orderer];
          return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
        });
        json.length = 20;
        barChart = d3.select(selector)
          .call(d3BarChart, json, settings);

        barChart.setAxes();

      });

      $( window ).resize(function() {
        var tempW = $(selector).width();
        if (tempW == width ) return;

        width = tempW;
        var ops = barChart.options();

        if(barChart) barChart.update();
      });
    }
  };
})(jQuery);
