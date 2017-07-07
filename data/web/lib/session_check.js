var http = require('http');


function parseCookies (request) {
  var list = {},
      rc = request.headers.cookie;

  rc && rc.split(';').forEach(function( cookie ) {
    var parts = cookie.split('=');
    list[parts.shift().trim()] = unescape(parts.join('='));
  });

  return list;
}


function findCookie(cookies) {
  var cookiePat = /SESS[0-9a-f]{16}/i,
      result = undefined;

  Object.keys(cookies).forEach(function(name) {
    if (cookiePat.test(name)) {
      result = cookies[name];
    }
  });
  console.log(result);
  return result;
}

module.exports = function(config) {
  return function _session_check(req, res, next) {
    var sid = findCookie(parseCookies(req)),
        fail = function (reason, error) {
          error = error || "unknown";
          res.json(403, {
            status: 'Error',
            message: 'Invalid User Session: ' + reason,
            error: error
          })
        };

    if (sid) {
	return next();
/*
      http.get('http://' + config.baseUrl + '/session/api/check/' + sid, function (response) {
	console.log('http://' + config.baseUrl + '/session/api/check/' + sid);
	console.log(response.statusCode);
        if (response.statusCode == 200) {

          return next();
        } else {
          fail("Invalid cookie", response.statusCode);
        }
      }).on('error', function (e) {
        console.log('http://' + config.baseUrl + '/session/api/check/' + sid, '=>' + e);
        fail("Error validating cookie", e);
      });
*/
    } else {
      fail("Invalid SID");
    }
  }
};
