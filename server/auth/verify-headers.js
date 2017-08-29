'use strict';

/*
 Verify request headers to mitigate web scraping
 */

module.exports = function(req, res, next) {
  const u = {
    userAgent : req.headers['user-agent'],
    referer : req.headers['referer'],
    host : req.headers['host'],
    postmanToken : req.headers['postman-token'],
    xhr: req.xhr
  };
  if (!u.xhr || u.referer && u.referer.indexOf(u.host) < -1) {
    res.status(403);
    res.json({
      error: 'unauthorized'
    });
  } else {
    next();
  }
};
