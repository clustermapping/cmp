
/**
 *  Javascript to create popup for quicksearch
 */

(function ($) {
  //declare a class for creating and positioning an autocomplete style widget
  Drupal.QuickSearch = function(input) {
    //use a named function to do initialization for cleanliness
    this.id = $(input).attr('id');
    this.init(input);
  };

  Drupal.QuickSearch.prototype = {
    //initialize our class - bind handlers
    init : function (input) {
      this.input = input;

      var qs = this;
      // in the context of the event handling functions, this = the target of the event
      $(this.input).keyup(function(e){ qs.handleSearch(this, e); })
    },
    handleSearch : function() {
      //do an ajax call to our search area
      var path = Drupal.settings.quick_search[this.id].path;
      var region = Drupal.settings.quick_search[this.id].region;
      var search = this.input.value;

      //sanity check to keep longer calls from coming back from the dead
      var d = new Date();
      var cur = d.getTime() + ' - ' + d.getMilliseconds();
      this.cur = cur;

      if( search.length >= Drupal.settings.quick_search[this.id].minlength) {
        var qs = this;

        $.ajax({
          url : path + '/' + search + (region ? '?region=' + region : ''),
          success : function(data, status, xhr){
            if(qs.cur == cur) {
              qs.showResults(data);
            }
          },
          error : function(xhr, status, error){
            qs.logError(status);
          }
        });
      } else {
        this.close();
      }
    },
    showResults : function(data, status, xhr) {
      if(data && data.results) {
        this.open();
        //add the label
        this.display.append('<div class="quicksearch-label">' + data.label + '</div>');
        //add the results
        for (it in data.results) {
          var result = data.results[it];

          var markup = '<div class="quicksearch-result-item">';
          markup += result;
          markup += '</div>';

          this.display.append(markup);
        }
      }
    },
    open : function(items) {
      if (!this.isopen) {
        if(!this.display) {
          this.display = $('<div class="quicksearch-results"></div>');
        }

        //add the holder to the DOM
        $(this.input).after(this.display);

        //Placement logic to allow this to attach to differently themed inputs
        var offset = $(this.input).position();
        //we need to account for borders dynamically
        var border = ($(this.display).outerHeight() - $(this.display).innerHeight()) / 2;

        $(this.display).css('top', offset.top + $(this.input).outerHeight() + border)
                      .css('left', offset.left)
                      .css('width', $(this.input).width());

        this.addCloseButton(this.display);

        this.isopen = true;
      } else {
        $(this.display).empty();
        this.addCloseButton(this.display);
      };
    },
    close : function(input, event) {
      if (this.display) {
        $(this.display).empty().remove();
        this.display = false;
      }

      this.isopen = false;
    },
    addCloseButton : function(parent) {
      this.display.append('<a class="close-button" title="Close Suggestions" href="javascript:">X</a>');
      var qs = this;
      $('.close-button', parent).click(function(e) {
        qs.close();
      });
    },
    logError : function(status) {
      if (this.debug && typeof(console.log) == 'function') {
        console.log('QuickSearch: An ajax error has occurred.  Request returned status ' + status);
      }
    }
  }; //end class definition

  // register a behavior to attach to inputs with the .use-quicksearch class
  Drupal.behaviors.quicksearch = {
    attach : function (context, settings) {
      $('.use-quicksearch', context).each(function (index, el) {
        el.quicksearch = new Drupal.QuickSearch(el);
      });
    },
    detach : function (context, settings) {
      $('.use-quicksearch', context).each(function (index, el) {
        delete(el.quicksearch);
      });
    }
  };

})(jQuery);
