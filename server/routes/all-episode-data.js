/**
 *  load and access show data
 */
'use strict';

const request = require('request'),
      helpers = require('./helpers'),
      dataUrl = process.env.DATA_BUCKET + 'episodes.json',
      rssFeed = process.env.RSS_FEED,
      inactiveEpisodes = process.env.BAD_EPISODES.split(',');

// in memory cache of all available episodes as displayed on the home page (title, air date, description, number)
let cache;

// update `allEpisodes` and `episodeDataVersions`
const update = function(globalCache, cb) {
  cb = cb || function(err) {
    if (err) {
      throw new Error('Unable to update episode data: ' + err);
    }
  };
  cache = globalCache;

  // get show data
  if (rssFeed) {
    request.get({url: rssFeed}, function(err, resp, body) {
      if (!err) {
        let episodes = cache.getKey('episodes') || [];
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
          let activeEpisodes = [];
          let episodes = cache.getKey('episodes');
          if (Array.isArray(episodes)) {
            activeEpisodes = episodes
                              .filter(episode => episode.enabled === true)
                              .map(episode => episode.value);
          }
          // update the value of allEpisodes
          let unfilteredEpisodes = JSON.parse(body).map((item) => {
            return {
              'number': item.number,
              'description': item.description,
              'original_air_date': item.original_air_date,
              'title': item.title,
              'guid': item.number
            };
          });
          cache.setKey('allEpisodesUnfiltered', unfilteredEpisodes);
          let filteredEpisodes = unfilteredEpisodes
            // filter out inactive episodes specified in the .env file
            .filter((episode) => !inactiveEpisodes.includes(episode.number))
            // filter out inactive episodes (only include explicitly active episodes in the admin panel)
            .filter((episode) => activeEpisodes.includes(episode.guid));
          cache.setKey('allEpisodes', filteredEpisodes);
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
