/* global phantom */
"use strict";
var page = require('webpage').create(),
    system = require('system'),
    address, output, options;

address = system.args[1];
output = system.args[2];
options = system.args[3];
page.viewportSize = { width: 1280, height: 1080 };
page.open(address, function (status) {
  if (status !== 'success') {
    console.log('Unable to load the address!');
    phantom.exit();
  } else {
    if (options == "sparkline") {
      page.viewportSize = { width: 480, height: 320 };
    }
    if (options == "noheader") {
      page.evaluate(function() {
        jQuery('footer, header, nav').hide();
        jQuery('body').css('padding-top', 0);
      });
    }
    page.evaluate(function() {
      document.body.bgColor = 'white';
    });
    window.setTimeout(function () {
      page.render(output);
      phantom.exit();
    }, 750);
  }
});
