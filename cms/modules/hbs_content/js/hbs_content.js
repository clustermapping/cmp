(function($) {
  Drupal.behaviors.hbs_content_links = {
    attach: function(context, settings) {

      $('.share-popup').click(function(event) {
        var width  = 575,
            height = 400,
            left   = ($(window).width()  - width)  / 2,
            top    = ($(window).height() - height) / 2,
            url    = this.href;

        if ($(this).hasClass("twitter")) {
          height = 270;
        }
        else if ($(this).hasClass("facebook")) {
          
        }
        else if ($(this).hasClass("linkedin")) {
          height = 470;
        }

        var opts  = 'status=1' +
                    ',width='  + width  +
                    ',height=' + height +
                    ',top='    + top    +
                    ',left='   + left;

        window.open(url, '_blank', opts);
        return false;
      });


      $('.close', '#homepage-welcome').click(function(e) {
        $('#homepage-welcome').slideUp();
        e.preventDefault();

        $('#welcome-trigger-side').fadeIn();
      });

      $('#welcome-trigger-side').click(function(e){
        // $(this).fadeOut();

        $('#homepage-welcome').slideDown();
        e.preventDefault();
      })


    }
  };    

})(jQuery);
