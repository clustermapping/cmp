(function($) {
  Drupal.behaviors.hbs_datatable = {
    attach: function(context, settings) {
      var allSettings = settings.hbs_datatable || Drupal.settings.hbs_datatable;

      if (!allSettings.splice) {
        allSettings = [allSettings];
      }

      var makeDataTable = function(localSettings) {
        var selector = '#block-hbs-viz-'+localSettings.delta+' .data-table-wrapper';

        localSettings.orderer = localSettings.orderer || 'emp_tl';
        localSettings.limit = localSettings.limit || 5;

        var map = localSettings.map || [];

        //D3 Elements & etc.
        //=======

        var table;

        queue()
          .defer(d3.json, localSettings.dataJson)
          .await(function(err, data) {

            data = data.sort(function(a, b) {
              var aVal = a[localSettings.orderer],
                  bVal = b[localSettings.orderer];
              return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
            });

            data.length = localSettings.limit;

            table = d3.select(selector)
              .append('table')
              .attr({ class: 'table'});

            table
              .append('thead')
              .append('tr')
              .selectAll('th')
              .data(map)
              .enter()
              .append('th')
              .attr({ width: function(d) { return d.width ? d.width : null; } } )
              .html(function(d) { return d.second ? d.label + '<hr/>' + d.second.label : d.label; });

            var tbody = table
              .append('tbody');

            var rows = tbody
              .selectAll('tr')
              .data(data)
              .enter()
                .append('tr');

            var cells = rows.selectAll("td")
              .data(function(row) {
                  return map.map(function(column) {
                      return {
                        column: column.label,
                        value: column.value ? column.value : row[column.key],
                        percent: column.percent,
                        round: column.round,
                        dollar: column.dollar,
                        heading: column.heading,
                        second: column.second ? (column.second.value ? column.second.value : row[column.second.key]) : false
                      };
                  });
              })
              .enter()
              .append("td")
                  .attr({ class: function(d){ return d.heading ? 'heading' : '' } })
                  .html(function(d) {
                    var view = d.value;
                    if (d.percent) {
                      view = (Math.round(d.value * 1000000) / 10000) + '%';
                    }

                    if (d.round || d.dollar) {
                      view = (+d.value).toFixed(2);
                    }

                    if (d.dollar) {

                      view = '$' + view;
                    }

                    if (d.second) {
                      view += '<hr/>' + d.second;
                    }
                    return view;
                  });
          });
      }

      var l = allSettings.length;
      while(l--) {
        makeDataTable(allSettings[l]);
      }
      //$( window ).resize(function() {});
    }
  };
})(jQuery);
