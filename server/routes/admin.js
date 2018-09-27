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
  db.run('insert or replace into episodes(guid, isEnabled) values($guid, $enabled)', {
    $guid: guid,
    $enabled: enabled
  }, (err, episodes) => {
    allEpisodeData.update(db);
    return res.json(episodes);
  });
});


router.post('/syncEpisode', function (req, res) {
  const guid = req.body.guid;
  const transcript = req.body.transcript;
  if (guid === undefined || transcript === undefined) {
    return res.status(400).send('Bad request. Please make sure "guid" and "transcript" are properties in the POST body.');
  }
  // get epiosode data

  let episodes = allEpisodeData.getAllEpisodesUnfiltered();
  let episode = episodes.filter(ep => {
    console.log(ep.guid === guid);
    return ep.guid === guid;
  })[0];
  console.log('AAAAAAAAAA',episode);
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
      // forward the status info back to the shortcut client so the client can check status
      // of sync
      // TODO: send back the domain/port of the Gentle server! probably needs to be in our env var?
      return res.json({err, location: httpResponse.headers.location});
    });

    // client handles all the updating stuff from there so we can move onto the next thing as soon as transcription is done
    // when client detects sync is done, display all that stuff in the client and then send it back to the server
    // store the plaintext transcript and the sync data in sqlite
  }); 
});

module.exports = router;
