d3Behaviors = {};

d3Behaviors.hover = function _behavior_hover() {
  var event = d3.dispatch(_hover,'over','move','out'),
      mouseover = _hoverover(noop, d3.mouse, 'mousemove', 'mouseout'),
      selection;

  event.of = function(thiz, argumentz) {
    var target = this;
    return function(e1) {
      try {
        var e0 = e1.sourceEvent = d3.event;
        e1.target = target;
        d3.event = e1;
        event[e1.type].apply(thiz, argumentz);
      } finally {
        d3.event = e0;
      }
    };
  };

  function _hover(){
    this.on("mouseover.hover", mouseover);
  }
  function _hoverover(id, position, move, out){
    return function(){
      var target = this,
          event_ = event.of(target, arguments),
          elem = d3.select(this)
                .on(move + ".hover", moved)
                .on(out + ".hover", ended);
      event_({
        type: "over"
      });
      function moved() {
        event_({
            type: "move",
          });
      }
      function ended() {
        elem.on(move + ".hover", null)
            .on(out + ".hover", null);
        event_({
            type: "out",
          });
      }

    };
  }
  return d3.rebind(_hover, event, "on");
};

d3Behaviors.click = function _behavior_click() {

}