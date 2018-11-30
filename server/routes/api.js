'use strict';
const express = require('express'),
      router = express.Router(),
      helpers = require('./helpers'),
      allEpisodeData = require('./all-episode-data');

// return whether shortcut has been set up (a data source has been set)
router.get('/isSourceSet', function (req, res) {
  let db = req.app.get('db');
  let result = db.getKey('episodeSource');
  if (result !== undefined) {
    return res.json({isSourceSet: true});
  }
  else {
    return res.json({isSourceSet: false});
  }
});

// return whether shortcut has been set up (a data source has been set)
router.get('/getPodcastImage', function (req, res) {
  let db = req.app.get('db');
  let result = db.getKey('podcastImage');
  if (result !== undefined) {
    return res.json({err: null, data: result.value});
  }
  else {
    return res.json({err: 'No image defined', data: ''});
  }
});

// return whether shortcut has been set up (a data source has been set)
router.get('/getAmazonS3Info', function (req, res) {
  const keys = helpers.getApplicationKeys();
  let { aws_region, aws_bucketName } = keys;
  res.json({aws_region, aws_bucketName});
});

module.exports = router;
