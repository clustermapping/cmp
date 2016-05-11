function noop(){}
function d3Update (selection, attr, dur, delay) {
	selection
	.interrupt()
    .transition()
    .delay((delay || 0))
    .duration(dur)
    .attr(attr);
}

function d3ButtonGroup (selection, args) {

	var g = selection.append('div')
		.attr({class:'btn-group'});

	g.selectAll('.btn')
		.data(args)
		.enter()
		.append('button')
		.attr({class: function(d){ return d.type + ' btn btn-primary';}})
		.text(function(d){return d.type;})
		.on('click', function(d){
			g.select('button.active')
				.classed('active', false);
			d3.select(this)
				.classed('active', true);
		});

}

function headerDropdown(selection, cb) {

	var keyFunc = function(d) { return d.key; },
		dropDown = selection.append('div').attr({class:'dropdown col-md-4 map-dropdown'}),
		header = dropDown.append('h4').attr({ 'class':'dropdown-toggle', 'data-toggle': "dropdown"}),
		updateHeaderText = function(sel, title) {
				sel.text(function(d) {
					return title || d.default;
				});
				sel.append('span').attr('class', 'caret');
			};

	header.call(updateHeaderText);

	dropDown.append('ul')
		.attr({class:'dropdown-menu'})
		.selectAll('li')
		.data(function(d) { return d.options; })
		.enter()
		.append('li').attr("role", "presentation")
		.append('a').attr("role", "menuitem")
		.text(function(d){return d.label;})
		.on('click', function(d) {
			var h = d3.select(this.parentNode.parentNode.parentNode).select('h4');
			h.call(updateHeaderText, d.label);
			if (cb) cb(d);
		});
}

function d3Dropdown (selection, args) {

	var dds = selection.append('div')
		.attr({class:'dropdown'});

	dds.append('button')
		.attr({
			class: 'btn btn-primary dropdown-toggle',
			type: 'button',
			'data-toggle': "dropdown",
			'data-key': function(d){return d.key}
		})
		.text(function(d){return d.key+' ';})

	dds.selectAll('button')
		.append('span')
		.attr({class: 'caret'});

	dds.append('ul')
		.attr({class:'dropdown-menu'})
		.selectAll('li')
		.data(args)
		.enter()
		.append('li').attr("role", "presentation")
		.append('a').attr("role", "menuitem")
		.text(function(d){return d.type.label;})
}


function setVal(o, val){
  if( (typeof val === 'object' || val === 'array') && (typeof o === 'object' || o === 'array') ){

    for(var key in val){
			if (val.hasOwnProperty(key)) {
				o[key] = setVal(o[key], val[key]);
			}
    }
  }else{
    o = val;
  }
  return o;
}

function outterWidth(w, m){
  return w + m.left + m.right;
}

function outterHeight(h, m){
  return h + m.top + m.bottom;
}


function randArb(min, max) {
  return Math.random() * (max - min) + min;
};
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function createRandomWord (length) {
  var consonants = 'bcdfghjklmnpqrstvwxyz',
      vowels = 'aeiou',
      rand = function(limit) {
          return Math.floor(Math.random()*limit);
      },
      i, word='', length = parseInt(length,10),
      consonants = consonants.split(''),
      vowels = vowels.split('');
  for (i=0;i<length/2;i++) {
      var randConsonant = consonants[rand(consonants.length)],
          randVowel = vowels[rand(vowels.length)];
      word += (i===0) ? randConsonant.toUpperCase() : randConsonant;
      word += i*2<length-1 ? randVowel : '';
  }
  return word;
};

function glow(url) {
  var stdDeviation = 2,
      rgb = "#000",
      colorMatrix = "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0";

  if (!arguments.length) {
    url = "glow";
  }

  function my() {

    var defs = this.append("defs");

    var filter = defs.append("filter")
        .attr("id", url)
        .attr("x", "-20%")
        .attr("y", "-20%")
        .attr("width", "140%")
        .attr("height", "140%")
      .call(function() {
        this.append("feColorMatrix")
            .attr("type", "matrix")
            .attr("values", colorMatrix);
        this.append("feGaussianBlur")
             // .attr("in", "SourceGraphics")
            .attr("stdDeviation", stdDeviation)
            .attr("result", "coloredBlur");
      });

    filter.append("feMerge")
      .call(function() {
        this.append("feMergeNode")
            .attr("in", "coloredBlur");
        this.append("feMergeNode")
            .attr("in", "SourceGraphic");
      });
  }

  my.rgb = function(value) {
    if (!arguments.length) return color;
    rgb = value;
    color = d3.rgb(value);
    var matrix = "0 0 0 red 0 0 0 0 0 green 0 0 0 0 blue 0 0 0 1 0";
    colorMatrix = matrix
      .replace("red", color.r)
      .replace("green", color.g)
      .replace("blue", color.b);

    return my;
  };

  my.stdDeviation = function(value) {
    if (!arguments.length) return stdDeviation;
    stdDeviation = value;
    return my;
  };

  return my;
}