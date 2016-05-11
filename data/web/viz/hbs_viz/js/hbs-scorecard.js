(function($) {
  Drupal.behaviors.hbs_scorecard = {
    attach: function(context, settings) {
      settings.hbs_scorecard = settings.hbs_scorecard || Drupal.settings.hbs_scorecard;
      var selector = '#block-hbs-viz-'+settings.hbs_scorecard.delta+' .scorecard-wrapper',
          lKeys=[
              {type:'color',element:'circle',attr:{class: 'rank1-10'}, label: 'Rank 1-10'},
              {type:'color',element:'circle',attr:{class: 'rank11-20'},label: 'Rank 11-20'},
              {type:'color',element:'circle',attr:{class: 'rank21-30'},label: 'Rank 21-30'}
            ],
          lKeys2=[
            {type:'color',element:'circle',attr:{class: 'rank31-40'},label: 'Rank 31-40'},
            {type:'color',element:'circle',attr:{class: 'rank41-50'},label: 'Rank 41-50'},
            {type:'color',element:'line',attr:{stroke: '#000', 'fill-opacity': 0},label: 'Sparkline'}
          ];

      //D3 Elements & etc.
      //=======
      var scorecard,
          legend;

      //Data
      //=======
      var rows = [
        {
          label: 'Performance',
          cols:[
            'Starting rank*',
            'Underlying trend',
            'Current rank'
          ]
        },
        {
          label: 'Wages',
          link: 'scorecard/wages',
          description: 'Average Private wage, 1998-2011',
          keys: {
            rank:'private_wage_rank_i',
            value: 'private_wage_tf',
            year: 'year_t'
          }
        },
        {
          label: 'Dynamics'
        },
        {
          label: 'Job Creation',
          description: 'Private Employment Growth, 1998-2000 and 2009-2011',
          keys: {
            rank:'emp_creation_rank_i',
            value: 'emp_creation_tl',
            year: 'year_t'
          },
          start: 2  //Changes need to start with the second year as this is the first one which change can be calculated for
        },
        {
          label: 'New Business Formation',
          description: 'Traded Cluster Establishment Growth, 1998-2000 and 2009-2011',
          keys: {
            rank:'est_creation_rank_i',
            value: 'est_creation_tl',
            year: 'year_t'
          },
          start: 2 //Changes need to start with the second year as this is the first one which change can be calculated for
        },
        {
          label: 'Cluster Strength',
          description: 'Employment in Strong Clusters, 1998-2011',
          keys: {
            rank:'strong_emp_rank_i',
            value: 'str_emp_tl',
            year: 'year_t'
          }
        },
        {
          label: 'Intermediate'
        },
        {
          label: 'Labor Force Productivity',
          description: 'GDP per Labor Force Participant, 1998-2011',
          keys: {
            rank:'labor_productivity_rank_i',
            value: 'labor_productivity_tf',
            year: 'year_t'
          }
        }
      ];

      queue()
        .defer(d3.json, settings.hbs_scorecard.dataJson)
        .await(function(err, data) {
          data = data.sort(function(a,b){
            return a.year_t < b.year_t ? -1 : a.year_t > b.year_t ? 1 : 0;
          });

          for(var i in rows){
            rows[i].data = [];
            if (rows[i].keys) {
              for(var j in data){
                var obj = {};
                for(var k in rows[i].keys){
                  obj[k] = data[j][ rows[i].keys[k] ] || null;
                }
                rows[i].data.push(obj);
              }

              var start = rows[i].start || 0;
              rows[i].startPos = data[start] ? data[start][rows[i].keys.rank] : data[0][rows[i].keys.rank];
              rows[i].currPos = data[data.length-1][rows[i].keys.rank];
              if(rows[i].startPos) rows[i].diffPos = rows[i].startPos - rows[i].currPos;
            } else {
              rows[i].isHeader = true;
            }
          }
          console.log(rows);
          scorecard = d3.select(selector)
            .call(d3Scorecard, rows, data);

          legend = scorecard.select('ul')
            .append('li')
            .attr({class:'row'});

          legend.append('div')
            .attr({class: 'col-md-4 footnote label'});
          legend.select('.footnote')
            .append('p').attr({class: 'description'})
            .text('*in 50 states + D.C');
          legend.select('.footnote')
            .append('p').attr({class: 'description'})
            .text('*in 179 Economic Areas');

          legend.append('div')
            .datum(function(){
              d = {};
              d.keys = lKeys;
              return d;
            })
            .attr({class: 'col-md-4'})
            .append('svg')
            .call(d3Legend);


          legend.append('div')
            .datum(function(){
              d = {};
              d.keys = lKeys2;
              return d;
            })
            .attr({class: 'col-md-4'})
            .append('svg')
            .call(d3Legend);

          legend.selectAll('svg').attr({height:function(){return d3.select(this).select('.legend')[0][0].getBBox().height;}});


        });

      //$( window ).resize(function() {});
    }
  };
})(jQuery);
