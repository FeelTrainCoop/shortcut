/**
 *  load and access show data
 */
'use strict';

const request = require('request');
const mysql = require('mysql');
const api_route = process.env.API_URL + 'all.json';

// in memory cache of all available episodes as displayed on the home page (title, air date, description, number)
let allEpisodes = [];

// in memory cache of s3/cloudfront versions for each episode JSON file (waveform + transcript)
let episodeDataVersions = {};

// update `allEpisodes` and `episodeDataVersions`
const update = function(cb) {
  cb = cb || function(err, success) {console.log('update show data', err || success)};

  fetchEpisodeDataVersions(function(err, success) {
    if (err) console.log('could not fetch episode data versions', err);
    else  console.log('got episode data versions', success);
  });

  // get show data from TAL's API
  request.get({url: api_route, rejectUnauthorized: false}, function(err, res, body) {
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
    // if err or unparsable JSON, fallback to latestEpisodesBackup.json
    allEpisodes = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../data/latestEpisodesBackup.json'), 'utf8'));
    return cb('no body');

  });
};

// get `episodeDataVersions` (latest version of each waveform/transcript) from db as key/value pairs
const fetchEpisodeDataVersions = function(cb) {
  const myQuery = 'select EPISODE_NUMBER, KEYNAME from episode';

  const connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PW,
    database : process.env.DB_NAME,
    port     : process.env.DB_PORT || '3306'
    // debug    : true
    // ssl      : "Amazon RDS"
  });

  connection.query(myQuery, function(err, result) {
    if (err) {
      console.log('error');
      cb(err, {
        'msg': 'error fetching episode data from db'
      });
    } else {
      // {episodeNumber: keyNameOnS3_slash_Cloudfront}
      episodeDataVersions = result.reduce(function(prevVal, curVal) {
        prevVal[curVal['EPISODE_NUMBER']] = curVal['KEYNAME'];
        return prevVal;
      }, {});
      cb(null, {
        'msg': 'success fetching episode data from db',
      });
    }
    connection.end();
    return;
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
  },
  // return episode data version, i.e. 580-data_14195018950.json
  getEpisodeVersion: function(number) {
    return episodeDataVersions[number];
  }
}
