(function($) {
  Drupal.behaviors.hbs_homepage = {
    attach: function(context, settings) {

      if ($('#homepage-welcome').length && !$.cookie('seen_welcome')) {
        $('#homepage-welcome').delay(600).slideDown();
        $.cookie("seen_welcome", 1, { expires : 90 });

        $('#welcome-trigger').slideUp();
      }

      $('.close', '#homepage-welcome').click(function(e) {
        $('#homepage-welcome').slideUp();
        e.preventDefault();

        $('#welcome-trigger').fadeIn();
      });

      $('#welcome-trigger').click(function(e){
        $(this).fadeOut();

        $('#homepage-welcome').slideDown();
        e.preventDefault();
      })
    }
  }
})(jQuery);
