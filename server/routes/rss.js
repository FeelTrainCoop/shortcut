/**
 *  serve the rss feed of the podcast (as JSON) to get around any CORS issues
 */
'use strict';

const request = require('request');
const helpers = require('./helpers');
const rssUrl = process.env.RSS_FEED;

module.exports = function(req, res) {
  if (!rssUrl) {
    res.status(404).send(`Error 404: no RSS feed specified.`);
    return;
  }
  request.get({url: rssUrl}, function(err, resp, body) {
    if (!err) {
      let cache = req.app.get('cache');
      let episodes = cache.getKey('episodes') || [];
      var result = helpers.parseRSS(body, episodes, function(result) {
        if (result.err) {
          res.status(500).send(result.err);
        }
        else {
          res.send(result.episodes);
        }
      });
    }
    else {
      res.status(500).send(`This error occurred: ${err}`);
    }
  });
};
