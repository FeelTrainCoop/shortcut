/**
 *  load and access show data
 */
'use strict';

const request = require('request'),
      helpers = require('./helpers'),
      dataUrl = process.env.DATA_BUCKET + 'episodes.json',
      rssFeed = process.env.RSS_FEED;

// in memory cache of all available episodes as displayed on the home page (title, air date, description, number)
let cache;

// update `allEpisodes` and `episodeDataVersions`
const update = function(globalCache, cb) {
  cb = cb || function(err, success) {console.log('update show data', err || success);};
  cache = globalCache;

  // get show data
  if (rssFeed) {
    request.get({url: rssFeed}, function(err, resp, body) {
      if (!err) {
        let episodes = cache.getKey('episodes') || [];
        console.log('AAAA',episodes);
        helpers.parseRSS(body, episodes, function(result) {
          if (result.err) {
            return cb(result.err);
          }
          else {
            cache.setKey('allEpisodes', result.episodes);
            cache.setKey('allEpisodesUnfiltered', result.episodesUnfiltered);
            cache.save(true);
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
          cache.setKey('allEpisodes', JSON.parse(body).map((item) => {
            return {
              'number': item.number,
              'description': item.description,
              'original_air_date': item.original_air_date,
              'title': item.title
            };
          }));
          cache.save(true);
          return cb(null, 'success');
        } catch(e) {
          console.error('unable to parse full latest episodes', e);
        }
      }
      return cb('no body');
    });
  }
};

module.exports = {
  getAllEpisodes: function() {
    return cache.getKey('allEpisodes');
  },
  getAllEpisodesUnfiltered: function() {
    return cache.getKey('allEpisodesUnfiltered');
  },
  update: function(globalCache, cb) {
    if (!globalCache) {
      throw 'Must specify a cache object in all-episode-data.js\' `update` function';
    }
    update(globalCache, cb);
  }
};
