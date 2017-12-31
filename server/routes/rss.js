/**
 *  serve the rss feed of the podcast to get around any CORS issues
 */
'use strict';

const request = require('request');
const rssUrl = process.env.RSS_FEED;
const parser = require('rss-parser');

module.exports = function(req, res) {
  request.get({url: rssUrl}, function(err, resp, body) {
    if (!err) {
      parser.parseString(body, function(error, parsed) {
        if (!error) {
          res.send(parsed);
        }
        else {
          res.status(500).send(`This error occurred: ${error}`);
        }
      });
    }
    else {
      res.status(500).send(`This error occurred: ${err}`);
    }
  });
};
