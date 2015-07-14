(function($) {
  Drupal.behaviors.hbs_viz = {
    attach: function(context, settings) {
      settings.hbs_viz = settings.hbs_viz || Drupal.settings.hbs_viz;

      settings.randomValues = function(sizeRange, valueRange){
        var arr = [],
            count = randInt(sizeRange[0],sizeRange[1]);

        while (count--) {
          var obj = {value: randArb(valueRange[0],valueRange[1])};
          arr.push(obj);
        }
        return arr;
      };
    }
  };
})(jQuery);
