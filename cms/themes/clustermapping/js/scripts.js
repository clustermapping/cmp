(function ($, Drupal) {

  Drupal.behaviors.chartWrapperHeight = {
    attach: function (context, settings) {
      // Resize iframe container on load.
      frame_container_initial();

      // Resize on page resize.
      $(window).resize(function() {
        frame_container_resize();
      });

      // On cluster button clicks.
      $('#cluster-list-controls .btn').click(function() {
        // Call function at a slight delay.
        setTimeout(frame_container_resize, 800, $(this));
      });
      if (jQuery(document.location.hash).length) {
        setTimeout(function(){
          var top = jQuery(document.location.hash).offset().top - jQuery('#banner').height();
          console.log(top)
          jQuery('html, body').animate({
            scrollTop: top,
          }, 500);
        }, 1000);
      }
    }
  };

  function frame_container_initial() {
    $('.chart iframe').load(function() {
      _frame_container_height($(this));
    });
  }

  function frame_container_resize() {
    $('.chart iframe').each(function() {
      _frame_container_height($(this));
    });
    $('.chart-100').css('padding-bottom', 'initial');
  }

  function _frame_container_height(iframe) {
    // Set a minimum height to avoid setting low values.
    var min_height = 100;
    var h = iframe.contents().find('body').outerHeight();
    if (h > min_height) {
      iframe.parent().not('.sparkline').height(h);
    }
  }

})(jQuery, Drupal);
