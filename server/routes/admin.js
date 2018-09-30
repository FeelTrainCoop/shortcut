'use strict';
const express = require('express'),
      router = express.Router(),
      fs = require('fs'),
      request = require('request'),
      helpers = require('./helpers'),
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
  // upsert individual columns without overwriting existing columns
  // https://stackoverflow.com/a/4330694/4869657
  db.run('insert or replace into episodes(guid, isEnabled, hasTranscript, transcript) values($guid, $enabled, (select hasTranscript from episodes where guid = $guid), (select transcript from episodes where guid = $guid))', {
    $guid: guid,
    $enabled: enabled
  }, (err, episodes) => {
    allEpisodeData.update(db);
    return res.json(episodes);
  });
});

router.get('/getTranscript', function (req, res) {
  const guid = req.query.guid;
  let db = req.app.get('db');
  db.get(`select transcript from episodes where guid = "${guid}"`, (err, result) => {
    if (!err && result === undefined) {
      err = { err: `unable to find episode with guid of "${guid}"`};
    }
    return res.json(err || JSON.parse(result.transcript));
  });
});

router.post('/syncEpisode', function (req, res) {
  const guid = req.body.guid;
  const transcript = req.body.transcript;
  if (guid === undefined || transcript === undefined) {
    return res.status(400).send('Bad request. Please make sure "guid" and "transcript" are properties in the POST body.');
  }
  // get episode data

  let episodes = allEpisodeData.getAllEpisodesUnfiltered();
  let episode = episodes.filter(ep => {
    return ep.guid === guid;
  })[0];
  // download the mp3 for the episode
  helpers.downloadFile(episode.mp3, (err, fileName) => {
    console.log('downloaded mp3', err, fileName);
    // send gentle the mp3 and the form data
     // curl -F "audio=@audio.mp3" -F "transcript=@words.txt" "http://localhost:8765/transcriptions?async=false"
     // do this via post
    var formData = {
      audio: fs.createReadStream(fileName),
      transcript: transcript
    };
    request.post({url:'http://localhost:8765/transcriptions?async=true', formData: formData}, function optionalCallback(err, httpResponse, body) {
      if (err) {
        console.error('upload failed:', err);
        return res.json({err});
      }
      // forward the status info back to the shortcut client so the client can check status of sync
      return res.json({err, location: httpResponse.headers.location});
    });
  }); 
});

router.get('/syncEpisodeDone', function (req, res) {
  let location = req.query.location;
  let guid = req.query.guid;
  let enable = +(req.query.enable === '1' || req.query.enable === 'true');
  if (location === undefined) {
    return res.json({err: 'You must specify a "location" parameter that you get from the `admin/syncEpisode` endpoint and a "guid" for the episode you are setting.'});
  }
  else {
    request('http://localhost:8765'+location+'/align.json', (err, resp, body) => {
      if (err) {
        return res.send(err);
      }
      else if (resp.statusCode === 200) {
        let db = req.app.get('db');
        db.run('insert or replace into episodes(guid, isEnabled, hasTranscript, transcript) values($guid, $isEnabled, $hasTranscript, $transcript)', {
          $guid: guid,
          $isEnabled: enable,
          $hasTranscript: 1,
          $transcript: body
        }, (err) => {
          return res.json(err || {err: null, msg: 'done'});
        });
      }
      else {
        return res.json(resp);
      }
    });
  }

});

router.get('/syncEpisodeStatus', function (req, res) {
  let location = req.query.location;
  if (location === undefined) {
    return res.json({err: 'You must specify a "location" parameter that you get from the `admin/syncEpisode` endpoint.'});
  }
  else {
    request('http://localhost:8765'+location+'/status.json', (err, resp, body) => {
      if (err) {
        return res.send(err);
      }
      else if (resp.statusCode === 200) {
        return res.json(JSON.parse(body));
      }
      else {
        return res.json(resp);
      }
    });
  }
});

module.exports = router;
