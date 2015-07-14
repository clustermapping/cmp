var naics = function (persister, naics_persister) {
  var _delegate = function (target, action, def) {
      return function () {
        if (target && target[action]) {
          return target[action].apply(target, arguments);
        } else {
          return def;
        }
      }
    },
    _calc_suppressed_value = function (empflag, total) {
      total = total || 0;
      empflag = (empflag ? empflag.toUpperCase() : 'none');

      var vals = {
        none: 0,
        A: 10,
        B: 60,
        C: 175,
        E: 375,
        F: 750,
        G: 1750,
        H: 3750,
        I: 7500,
        J: 17500,
        K: 37500,
        L: 75000,
        M: 100000
      };

      return total + vals[empflag];
    };

  return {
    persist: function (data) {
      var aggregate = persister.get(data.id);
      if (!aggregate) {
        persister.persist(data);
      } else {
        var naics_lookup =  ['naics', data.year_t, data.region_type_t, data.region_code_t, 'total'].join('/'),
          naics;
       if (naics_persister) naics = naics_persister.get(naics_lookup);
        if (naics) {
          aggregate.emp_tl = _calc_suppressed_value(naics.empflag_t, naics.emp_tl);
          aggregate.ap_tl = naics.ap_tl;
          aggregate.est_tl = naics.est_tl;
          aggregate.naics_b = true;
          aggregate.emp_reported_tl = aggregate.emp_tl;
        } else {
          aggregate.emp_tl += data.emp_tl;
          aggregate.ap_tl += data.ap_tl;
          aggregate.est_tl += data.est_tl;
          aggregate.emp_reported_tl += data.emp_reported_tl;
        }
        aggregate.emp_local_tl += data.emp_local_tl;
        aggregate.emp_traded_tl += data.emp_traded_tl;
        aggregate.emp_reported_local_tl += data.emp_reported_local_tl;
        aggregate.emp_reported_traded_tl += data.emp_reported_traded_tl;
        aggregate.ap_local_tl += data.ap_local_tl;
        aggregate.ap_traded_tl += data.ap_traded_tl;
        aggregate.est_local_tl += data.est_local_tl;
        aggregate.est_traded_tl += data.est_traded_tl;
        aggregate.private_wage_tf = (aggregate.ap_tl * 1000)/aggregate.emp_reported_tl;
        aggregate.private_wage_local_tf = (aggregate.ap_local_tl * 1000)/aggregate.emp_reported_local_tl;
        aggregate.private_wage_traded_tf = (aggregate.ap_traded_tl * 1000)/aggregate.emp_reported_traded_tl;
        if (isNaN(aggregate.private_wage_tf) || !isFinite(aggregate.private_wage_tf)) {
          aggregate.private_wage_tf = 0;
        }
      }
    },
    end: _delegate(persister, 'end'),
    should_drain: _delegate(persister, 'should_drain'),
    drain: _delegate(persister, 'drain')
  }
};

module.exports = naics;

