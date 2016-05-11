function d3Scorecard(selection, rowData, data){

  //Scales
  //=======
  var s = {
        'class':{
          attrs:{
            domain : function(){return[1,50]},
            range: function(){ return d3.range(5).map(function(d) { return "rank" + (d*10+1)+'-'+ ((d+1)*10) ; });}
          },
          scale: d3.scale.quantize()
        }
      };


  //SVGs & etc.
  //=======
  var card,
      rows;

  function create(){
    card = selection.append("ul")
      .attr({class: 'scorecard container'});

    rows = card.selectAll('.row')
      .data(rowData)
      .enter()
      .append("li")
        .attr({ class: function(d){ return d.isHeader ? 'header row' : 'row'; } } );

    var label = rows.append('div')
      .attr({class:'label col-xs-12 col-sm-5'});

    label.append('h3')
      .attr({ class: function(d){ return d.isHeader ? 'header' : ''; } })
      .append(function(d){ return document.createElement(d.link ? 'a' : 'span');})
      .attr({ href: function(d) {
        var cur = window.location.pathname;
        return d.link ? cur + '/' + d.link : null;
      } })
      .text(function(d){return d.label; });

    label.append('p')
      .attr({ class: 'description' })
      .text(function(d) { return d.description; });


    rows.append('div')
      .attr({class:'col-xs-4 col-sm-2 start-pos col'})
      .append('div')
      .attr({class: function(d){return  ( s.class.scale(d['startPos']) || '') + ' rank';}})
      .append('h3')
      //.text(function(d){return d.isHeader ? '' : d['startPos'] || 'N/A';})
      .text(function(d){
        return d.isHeader ? d.cols && d.cols[0]? d.cols[0] : ''  :  d['startPos'] || 'N/A';})


    rows.append('div')
      .attr({class:'col-xs-4 col-sm-3 start-pos col'})
      .append('div')
      .attr({class: function(d){ return d.isHeader? 'rank' :'sparkline-wrapper';}})
      .each(function(d){
        if(d.isHeader){
          if(d.cols) d3.select(this).append('h3').text(d.cols[1]);
        }else{
          d3.select(this).call(addSparkline, d);
        }
      });

    rows.append('div')
      .attr({class:'col-xs-4 col-sm-2 curr-pos col'})
      .append('div')
      .attr({class: function(d){return  ( s.class.scale(d['currPos']) || '') + ' rank';}})
      .append('h3')
      .attr({class:' pull-left'})
      //.text(function(d){ return d.isHeader ? '' : d['currPos']; });
      .text(function(d){ return d.isHeader ? d.cols && d.cols[2]? d.cols[2] : '' : d['currPos']; });

    rows.selectAll('.curr-pos .rank')
      .append('span')
      .attr({
        class: function(d){
          return (d.diffPos<0)? 'negative h3 pull-right diff': 'positive h3 pull-right diff';
        }
      })
      .text(function(d){
        if (d.isHeader) {
          return '';
        }
        return (!d.diffPos)? 0: (d.diffPos<0)? d.diffPos : '+'+d.diffPos;
      })
  }

  function setScales(){

    for(var i in s){
      for(var j in s[i].attrs){
        s[i].scale = s[i].scale[j]( s[i].attrs[j]() );
      }
    }
  }

  function addSparkline(selection, d){
    var sl = selection.call(d3Sparkline, d.data,
      {
        scales: {x:{key:'year'}, y:{key:'value'}},
        axesData: [{label: 'Year'},{label: d.label}]
      });

    if (!d.sparklines) d.sparklines = [];
    d.sparklines.push(sl);

    sl.update();
    // sl.setAxes();
  }

  setScales();
  create();

  return this;
}
