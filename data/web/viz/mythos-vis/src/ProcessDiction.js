define(['d3'], function(d3) {
  ProcessDiction = function(options){
    var dict = d3.map(options.diction),
        scales = options.plot.scales();

    scales.forEach(function(k,v){
      if(dict.get(v.key))v.SetOptions(dict.get(v.key));
    });
    return dict;
  };

  return ProcessDiction;
});
