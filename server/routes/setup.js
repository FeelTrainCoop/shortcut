'use strict';
const express = require('express'),
      router = express.Router(),
      request = require('request'),
      helpers = require('./helpers'),
      allEpisodeData = require('./all-episode-data');

router.post('/setSource', function (req, res) {
  const type  = req.body.type;
  const rss = `https://${req.body.url}/rss`;
  if (type === undefined || rss === undefined) {
    return res.status(400).send('Bad request. Please make sure "type" and "url" are properties in the POST body.');
  }
  let db = req.app.get('db');
  const episodeSource = { type, rss };
  db.setKey('episodeSource', episodeSource, () => {
    allEpisodeData.update(db, function() {
      request.get({url: rss}, function(err, resp, body) {
        if (!err) {
          // get the show metadata
          helpers.parseRSSMeta(body, function(result) {
            if (result.err) {
              return res.status(400).send('Could not parse RSS data.');
            }
            else {
              return res.json(result);
            }
          });
        }
        else {
          return res.status(500).send(err);
        }
      });
    });
  });
});

module.exports = router;
