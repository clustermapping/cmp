define(['d3'], function(d3) {
  var nonStandardEvents = ['focus', 'unfocus'];

  EventDecorator = function(obj) {
    obj._customEventDispatchers = d3.dispatch.apply(null, nonStandardEvents);

    obj.on = function(_event, cb) {

    };

    obj.off = function(_event) {

    };

    obj.trigger = function() {
      var _arg = Array.prototype.slice.call(arguments);
      var _event = _arg.shift();

      if (nonStandardEvents.indexOf(_event) !== -1) {
        this._customEventDispatchers[_event].apply(null, _arg);
      }
    };

    obj.listen = function() {
      var c = this.config;

      if (c.selectable) {
        for(var b in c.behaviors){
          if (c.group !== undefined) {
            c.group.on(b, c.behaviors[b]);
          }

          // Custom events
          if (nonStandardEvents.indexOf(b) !== -1) {
            this._customEventDispatchers.on(b, c.behaviors[b]);
          }
        }
      }
    };

    return obj;
  };

  return EventDecorator;
});
