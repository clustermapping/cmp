"use strict";
/* String additions */

if (!String.prototype.toTitleCase) {
  String.prototype.toTitleCase = function() {
    if (!this || typeof this !== 'string') {
      return '';
    }

    return this.replace(/\w\S*/g, function(match) {
      return match.charAt(0).toUpperCase() + match.substr(1).toLowerCase();
    });
  };
}
