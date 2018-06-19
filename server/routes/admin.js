'use strict';
const express = require('express'),
      router = express.Router(),
      allEpisodeData = require('./all-episode-data');

// update the episodes db table and then
// return the state of enabled/disabled episodes
// any episode not in this list is considered disabled by default
router.get('/getEpisodes', function (req, res) {
  let db = req.app.get('db');
  allEpisodeData.update(db, function() {
    db.all('select * from episodes', (err, episodes) => {
      return res.json(episodes);
    });
  });
});

router.post('/setEpisode', function (req, res) {
  const guid = req.body.guid;
  const enabled = +(req.body.enabled === '1'); // convert "1" string to 1, everything else to 0
  if (guid === undefined || enabled === undefined) {
    return res.status(400).send('Bad request. Please make sure "guid" and "enabled" are properties in the POST body.');
  }
  let db = req.app.get('db');
  db.run('insert or replace into episodes(guid, isEnabled) values($guid, $enabled)', {
    $guid: guid,
    $enabled: enabled
  }, (err, episodes) => {
    allEpisodeData.update(db);
    return res.json(episodes);
  });
});

module.exports = router;
