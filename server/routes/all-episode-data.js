/**
 *  load and access show data
 */
'use strict';

const request = require('request'),
      helpers = require('./helpers'),
      dataUrl = process.env.DATA_BUCKET + 'episodes.json',
      inactiveEpisodes = process.env.BAD_EPISODES.split(',');

let rssFeed = process.env.RSS_FEED;

let db;
let cache = {
  allEpisodes: [],
  allEpisodesUnfiltered: []
};

// update `allEpisodes` and `episodeDataVersions`
const update = function(globalDb, cb) {
  cb = cb || function(err) {
    if (err) {
      throw new Error('Unable to update episode data: ' + err);
    }
  };

  db = globalDb;

  // if 'episodeSource' is set on the DB use this for `rssFeed`
  db.getKey('episodeSource', function(err, res) {
    if (res !== undefined) {
      let episodeSource = JSON.parse(res.value);
      rssFeed = episodeSource.rss;
    }
  });

  console.log(rssFeed);

  // get show data
  if (rssFeed) {
    request.get({url: rssFeed}, function(err, resp, body) {
      if (!err) {
        // get the episode enabled list from our db
        db.all('select * from episodes', (err, episodes) => {
          console.log('episodes:', episodes);
          helpers.parseRSS(body, episodes, function(result) {
            if (result.err) {
              return cb(result.err);
            }
            else {
              db.setKey('allEpisodes', result.episodes);
              cache.allEpisodes = result.episodes;
              db.setKey('allEpisodesUnfiltered', result.episodesUnfiltered);
              cache.allEpisodesUnfiltered = result.episodesUnfiltered;
              return cb(null, 'success');
            }
          });
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
          db.all('select * from episodes', (err, episodes) => {
            if (Array.isArray(episodes)) {
              activeEpisodes = episodes
                                .filter(episode => !!episode.isEnabled === true)
                                .map(episode => episode.guid);
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
            db.setKey('allEpisodesUnfiltered', unfilteredEpisodes);
            cache.allEpisodesUnfiltered = unfilteredEpisodes;
            let filteredEpisodes = unfilteredEpisodes
              // filter out inactive episodes specified in the .env file
              .filter((episode) => !inactiveEpisodes.includes(episode.number))
              // filter out inactive episodes (only include explicitly active episodes in the admin panel)
              .filter((episode) => activeEpisodes.includes(episode.guid));
            db.setKey('allEpisodes', filteredEpisodes);
            cache.allEpisodes = filteredEpisodes;
            return cb(null, 'success');
          });
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
    return cache.allEpisodes;
  },
  getAllEpisodesUnfiltered: function() {
    return cache.allEpisodesUnfiltered;
  },
  update: function(db, cb) {
    if (!db) {
      throw new Error('Must provide a sqlite database object in all-episode-data.js\' `update` function');
    }
    update(db, cb);
  }
};
