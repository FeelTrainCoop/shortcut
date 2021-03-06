'use strict';

require('dotenv').config();
const request = require('request');
const async = require('async');
const allEpisodeData = require('./all-episode-data');

const Database = require('better-sqlite3');
const db = new Database('shortcut.db');

allEpisodeData.update(db, function(err) {
  if (!err) {
    let episodes = allEpisodeData.getAllEpisodes();
    episodes = episodes.map(episode => `http://localhost:3000/api/${process.env.API_HASH}/update/${episode.number}`);
    console.log(`Updating ${episodes.length} episodes. This might take ${0.5*episodes.length} minutes.`);
    async.mapSeries(episodes, function(url, callback) {
      console.log('sending GET request to', url);
      request(url, function(error, response, body) {
        callback(error, body);
      });
    }, function(err, results) {
      console.log(err);
      console.log('Done updating all episodes.', results);
    });
  }
  else {
    console.log('Error fetching episode data:', err);
  }
});
