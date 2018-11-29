'use strict';
const express = require('express'),
      router = express.Router(),
      fs = require('fs'),
      passportMiddleware = require('../auth/passport-middleware.js'),
      request = require('request'),
      helpers = require('./helpers'),
      update = require('./update'),
      allEpisodeData = require('./all-episode-data'),
      exec = require('child_process').exec,
      AWS = require('aws-sdk');

// update the episodes db table and then
// return the state of enabled/disabled episodes
// any episode not in this list is considered disabled by default
router.get('/getEpisodes', function (req, res) {
  let db = req.app.get('db');
  allEpisodeData.update(db, function() {
    let episodes = db.prepare('select * from episodes').all();
    return res.json(episodes);
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
  db.prepare('insert or replace into episodes(guid, isEnabled, hasTranscript, transcript) values(?, ?, (select hasTranscript from episodes where guid = ?), (select transcript from episodes where guid = ?))').run(guid, enabled, guid, guid);
  allEpisodeData.update(db, function() {
    let episodes = db.prepare('select * from episodes').all();
    return res.json(episodes);
  });
});

router.get('/getTranscript', function (req, res) {
  const guid = req.query.guid;
  let db = req.app.get('db');
  let result = db.prepare(`select transcript from episodes where guid = ?`).get(guid);
  let err = null;
  if (result === undefined) {
    err = { err: `unable to find episode with guid of "${guid}"`};
  }
  return res.json(err || JSON.parse(result.transcript));
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
    request.post({url:'http://localhost:8765/transcriptions?async=true&disfluency=true', formData: formData}, function optionalCallback(err, httpResponse, body) {
      if (err) {
        console.error('upload failed:', err);
        return res.json({err});
      }
      // forward the status info back to the shortcut client so the client can check status of sync
      return res.json({err, location: httpResponse.headers.location});
    });

    // while transcription is happening, process the mp3 into *.ts files and put them in the temp directory
    // ffmpeg -i s01e03.mp3 -map 0:a -profile:v baseline -level 3.0 -start_number 0 -hls_time 10 -hls_list_size 0 -hls_segment_filename 's01e03%03d.ts' -f hls s01e03.m3u8
    const tempDir = process.env.TEMP || '/tmp';
    const cmd = `ffmpeg -i ${fileName} -map 0:a -profile:v baseline -level 3.0 -start_number 0 -hls_time 10 -hls_list_size 0 -hls_segment_filename '${tempDir}/${episode.number}%03d.ts' -f hls '${tempDir}/${episode.number}.m3u8'`;
    exec(cmd, function (error) {
      if (error) {
        console.log(error);
      }
      else {
        console.log('ffmpeg processed mp3 into *.ts files and placed into', tempDir);
      }
    });
  }); 
});

router.get('/syncEpisodeDone', function (req, res) {
  let location = req.query.location;
  let guid = req.query.guid;
  let episodes = allEpisodeData.getAllEpisodesUnfiltered();
  let episode = episodes.filter(ep => {
    return ep.guid === guid;
  })[0];
  let enable = +(req.query.enable === '1' || req.query.enable === 'true');
  if (location === undefined) {
    return res.json({err: 'You must specify a "location" parameter that you get from the `admin/syncEpisode` endpoint and a "guid" for the episode you are setting.'});
  }
  else {
    // get the aligned transcript from the DB and put it in the server
    request('http://localhost:8765'+location+'/align.json', (err, resp, body) => {
      if (err) {
        return res.send(err);
      }
      else if (resp.statusCode === 200) {
        let db = req.app.get('db');
        db.prepare('insert or replace into episodes(guid, isEnabled, hasTranscript, transcript) values(?, ?, ?, ?)').run(guid, enable, 1, body);
        // upload all files that were created by ffmpeg
        const tempDir = process.env.TEMP || '/tmp';
        fs.readdir(tempDir, (err, files) => {
          // filter to list of just-created files
          let regex = new RegExp('^'+episode.number);
          files = files.filter(file => file.match(regex));
          const promiseArray = files.map(fileName => {
            return new Promise((resolve, reject) => {
              fs.readFile(tempDir + '/' + fileName, (err, data) => {
                console.log(err);
                uploadS3(episode.number, data, fileName, () => { resolve('done');});
              });
            });
          });
          // when all uploads are done...
          Promise.all(promiseArray).then(() => {
            // later, after syncEpisodeDone, we call the "update" function for the episode, equivalent of
            // http://YOUR_SERVER:3000/api/API_HASH/update/EPISODE_ID with a GET
            //
            update.addEpisode(episode.number, function() {
              console.log('EPISODE UPDATED');
            });
            return res.json(err || {err: null, msg: 'done'});
          });

        });
      }
      else {
        return res.json(resp);
      }
    });
  }

});

function uploadS3(episodeNumber, body, fileName, cb) {
  const dstKey = `episodes/${episodeNumber}/${fileName}`;
  console.log('uploading',dstKey);

  const keys = helpers.getApplicationKeys();
  AWS.config.update({
    region:            keys.aws_region,
    accessKeyId:       keys.aws_accessKeyId,
    secretAccessKey:   keys.aws_secretAccessKey
  });
  const s3 = new AWS.S3({
    region: keys.aws_region
  });
  const bucketName = keys.aws_bucketName;

  var params = {
    Bucket: bucketName,
    Key: dstKey,
    ContentType: 'application/json',
    Body: body,
    ACL: 'public-read',
    CacheControl: 'max-age=31536000' // 1 year (60 * 60 * 24 * 365)
  };

  s3.upload(params)
    .on('httpUploadProgress', function(evt) {
      console.log('Progress:', evt.loaded, '/', evt.total);
    })
    .send(function(err, success){
      console.log(err, success);
      cb(err, success);
    });
}

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

router.get('/getApplicationKeys', function (req, res) {
  const keys = helpers.getApplicationKeys();
  res.json(keys);
});

router.post('/setApplicationKeys', function (req, res) {
  const applicationKeys = req.body.applicationKeys;
  if (applicationKeys === undefined) {
    return res.status(400).send('Bad request. Please make sure "applicationKeys" is a property in the POST body.');
  }
  let db = req.app.get('db');
  db.setKey('applicationKeys', applicationKeys);
  // re-authorize passport
  passportMiddleware.init(req.app);
  res.json({err: null, data: applicationKeys});
});

module.exports = router;
