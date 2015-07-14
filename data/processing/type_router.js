var router = function(clusters, aggregates) {
  var _delegate = function (target, action, def) {
    return function () {
      if (target && target[action]) {
        return target[action].apply(target, arguments);
      } else {
        return def;
      }
    }
  };
  return {
    persist: function (data) {
      if (data.type_t == 'cluster') {
        clusters.persist(data);
      } else {
        aggregates.persist(data);
      }
    },
    end: _delegate(clusters, 'end'),
    should_drain: _delegate(clusters, 'should_drain'),
    drain: _delegate(clusters, 'drain')
  }
};

module.exports = router;