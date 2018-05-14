'use strict';
const express = require('express'),
      router = express.Router(),
      allEpisodeData = require('./all-episode-data');

// return whether shortcut has been set up (a data source has been set)
router.get('/isSourceSet', function (req, res) {
  let db = req.app.get('db');
  db.getKey('episodeSource', function(err, result) {
    if (result !== undefined) {
      return res.json({isSourceSet: true});
    }
    else {
      return res.json({isSourceSet: false});
    }
  });
});

module.exports = router;
