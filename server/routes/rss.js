/**
 *  serve the rss feed of the podcast (as JSON) to get around any CORS issues
 */
'use strict';

const request = require('request');
const helpers = require('./helpers');
const rssUrl = process.env.RSS_FEED;

module.exports = function(req, res) {
  request.get({url: rssUrl}, function(err, resp, body) {
    if (!err) {
      var result = helpers.parseRSS(body, function(result) {
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
