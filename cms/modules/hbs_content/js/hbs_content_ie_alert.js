(function($) {
  Drupal.behaviors.hbs_content_ie_alert = {
    attach: function(context, settings) {

      if (isIE() && isIE() < 9) {
        alert("This website only supports browser versions Internet Explorer 9 or higher. If you are using Internet Explorer 9, please turn off 'compatibility mode'.")
      } 

    }
  };

  function isIE () {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
  }

})(jQuery);
