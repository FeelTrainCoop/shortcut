'use strict';
const express = require('express'),
      router = express.Router(),
      request = require('request'),
      helpers = require('./helpers'),
      bcrypt = require('bcrypt-nodejs'),
      querystring = require('querystring'),
      allEpisodeData = require('./all-episode-data');

router.post('/setSource', function (req, res) {
  console.log('setting source');
  const type  = req.body.type;
  const rss = `${req.body.url}`;
  if (type === undefined || rss === undefined) {
    return res.status(400).send('Bad request. Please make sure "type" and "url" are properties in the POST body.');
  }
  let db = req.app.get('db');
  const episodeSource = { type, rss };
  db.prepare('drop table if exists episodes').run();
  db.prepare('CREATE TABLE IF NOT EXISTS episodes (guid TEXT PRIMARY KEY, isEnabled INTEGER, hasTranscript INTEGER DEFAULT 0, transcript TEXT)').run();
  db.setKey('episodeSource', episodeSource);
  allEpisodeData.update(db, function() {
    let url = new URL(rss);
    let qs = querystring.parse(url.search.replace('?',''));
    let baseUrl = url.origin + url.pathname;
    request.get({url: baseUrl, qs, headers: {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:65.0) Gecko/20100101 Firefox/65.0'}}, function(err, resp, body) {
      console.log(body);
      if (!err) {
        // get the show metadata
        helpers.parseRSSMeta(body, function(result) {
          if (result.err) {
            return res.status(400).json({code: `Could not parse RSS data: ${result.err}`});
          }
          else {
            db.setKey('meta', result);
            return res.json(result);
          }
        });
      }
      else {
        return res.status(500).send({code: err});
      }
    });
  });
});

router.post('/setAdmin', function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (username === undefined || password === undefined) {
    return res.status(400).send('Bad request. Please make sure "username" and "password" are properties in the POST body.');
  }
  let db = req.app.get('db');
  const passwordHash = bcrypt.hashSync(password);
  const usernameHash = bcrypt.hashSync(username);
  const adminData = {
    username: usernameHash,
    password: passwordHash
  };
  db.setKey('admin', adminData);
  allEpisodeData.update(db, function() {
    res.json('user/pass set!');
  });
});

module.exports = router;
