define(['d3'], function(d3) {
  // Internal global vars are tmp.
  var plot,
      minRadius = 5,
      delay = 0,
      dur = 750,
      scales = d3.map();


  var ScaleBase = function(options) {
    plot = options.plot;
  };

  ScaleBase.prototype.Compile = function(){
    var s = this.scale,
        dataKey = this.key,
        data = plot.data(),
        drawWidth = plot.drawWidth(),
        drawHeight = plot.drawHeight(),
        margin = plot.margin();

    for (var attr in this.attrs) {
      if (!this.attrs.hasOwnProperty(attr)) continue;
      var val = this.attrs[attr];
      if (typeof val === 'function') val = val(data, dataKey, drawWidth, drawHeight, margin);
      if (val.hasOwnProperty && val.args) {
        s[attr].apply(null, val.args);
      } else {
        if (typeof s[attr] == 'function') {
          s[attr](val);
        }
      }
    }
    if(s.hasOwnProperty('tickFormat')) s.tickFormat(d3.format(this.format));
  };

  ScaleBase.prototype.SetOptions = function(ops){
    function setVal(o, val){
      if( (typeof val === 'object' || val === 'array') && (typeof o === 'object' || o === 'array') ){
        for(var key in val){
          if (val.hasOwnProperty(key))o[key] = setVal(o[key], val[key]);
        }
      }
      else{o = val;}
      return o;
    }
    setVal(this, ops);
  };

  return ScaleBase;
});



