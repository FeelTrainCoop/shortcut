/**
 *  load and access show data
 */
'use strict';

const request = require('request');
const helpers = require('./helpers');
const dataUrl = process.env.DATA_BUCKET + 'episodes.json';
const rssFeed = process.env.RSS_FEED;
const rss = require('./rss');

// in memory cache of all available episodes as displayed on the home page (title, air date, description, number)
let allEpisodes = [];

// in memory cache of s3/cloudfront versions for each episode JSON file (waveform + transcript)
let episodeDataVersions = {};

// update `allEpisodes` and `episodeDataVersions`
const update = function(cb) {
  cb = cb || function(err, success) {console.log('update show data', err || success);};

  // get show data
  if (rssFeed) {
    request.get({url: rssFeed}, function(err, resp, body) {
      if (!err) {
        var result = helpers.parseRSS(body, function(result) {
          if (result.err) {
            return cb(result.err);
          }
          else {
            allEpisodes = result.episodes;
            return cb(null, 'success');
          }
        });
      }
      else {
        return cb(err);
      }
    });
  }
  else {
    request.get({url: dataUrl, rejectUnauthorized: false}, function(err, res, body) {
      if (!err) {
        try {
          // update the value of allEpisodes
          allEpisodes = JSON.parse(body).map((item) => {
            return {
              'number': item.number,
              'description': item.description,
              'original_air_date': item.original_air_date,
              'title': item.title
            };
          });
          return cb(null, 'success');
        } catch(e) {
          console.error('unable to parse full latest episodes', e);
        }
      }
      return cb('no body');
    });
  }
};

// update allEpisodes when server launches
update();

module.exports = {
  getAllEpisodes: function() {
    return allEpisodes;
  },
  update: function(cb) {
    update(cb);
  }
};
