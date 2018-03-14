'use strict';
const express = require('express'),
      router = express.Router(),
      allEpisodeData = require('./all-episode-data');

// return the state of enabled/disabled episodes
// any episode not in this list is considered disabled by default
router.get('/getEpisodes', function (req, res) {
  return res.json(req.app.get('cache').getKey('episodes'));
});

router.post('/setEpisode', function (req, res) {
  const guid = req.body.guid;
  const enabled = req.body.enabled;
  if (guid === undefined || enabled === undefined) {
    return res.status(400).send('Bad request. Please make sure "guid" and "enabled" are properties in the POST body.');
  }
  let cache = req.app.get('cache');
  let episodes = cache.getKey('episodes') || [];
  let episodeIndex = episodes.findIndex(episode => episode.value === guid);
  const newObject = {
    value: guid,
    enabled: enabled === 'true'
  };
  if (episodeIndex > -1) {
    episodes[episodeIndex] = newObject;
  }
  else {
    episodes.push(newObject);
  }
  cache.setKey('episodes', episodes);
  cache.save(true);
  allEpisodeData.update(cache);
  return res.json(cache.getKey('episodes'));
});

module.exports = router;
