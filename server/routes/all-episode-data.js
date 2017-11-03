/**
 *  load and access show data
 */
'use strict';

const request = require('request');
const dataUrl = process.env.DATA_BUCKET + 'episodes.json';

// in memory cache of all available episodes as displayed on the home page (title, air date, description, number)
let allEpisodes = [];

// in memory cache of s3/cloudfront versions for each episode JSON file (waveform + transcript)
let episodeDataVersions = {};

// update `allEpisodes` and `episodeDataVersions`
const update = function(cb) {
  cb = cb || function(err, success) {console.log('update show data', err || success);};

  // get show data from TAL's API
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
        console.error('unable to parse full latest episodes from TAL', e);
      }
    }
    return cb('no body');
  });
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
