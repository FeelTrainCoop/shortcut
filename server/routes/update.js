'use strict';

const express = require('express');
const router = express.Router();
const allEpisodeData = require('./all-episode-data');
const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const s3 = new AWS.S3({
  region: process.env.AWS_REGION
});
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const waveformWidth = 30000;
const async = require('async');
const makeWaveform = require('./makeWaveform');
const getTranscript = require('./getTranscript');
const helpers = require('./helpers');
const tempDir = process.env['TEMP'] || '/tmp';

// update show data (list of all episodes and their show data version numbers)
router.get('/', function(req, res) {
  allEpisodeData.update( function(err) {
    if (err) {
      return res.status(500).json({
        'status': 'error',
        'message': 'unable to update show data: ' + err
      });
    }
    else {
      return res.status(200).json({
        'status': 'success',
        'message': 'successfully updated show data'
      });
    }
  });
});

// http://localhost:3000/api/ABC123/update/580
// create or update show data (waveform + transcrtipt json) for a specific show
router.get('/:episodeNumber', function(req, res) {
  addEpisode(req.params.episodeNumber, function(err, success) {
    if (err) {
      return res.status(500).json(err);
    } else {
      allEpisodeData.update();
      return res.json(success);
    }
  });
});

function addEpisode(episodeNum, callback) {
  const targetWidth = 30000;
  const mp3Path = `${process.env.DATA_BUCKET}${episodeNum}/${episodeNum}.mp3`;

  const payload = JSON.stringify({
    episode: String(episodeNum),
    width: waveformWidth
  });

  const params = {
    FunctionName: 'shortcut-addEpisode', //process.env.LAMBDA_FUNCTION_NAME, /* required */
    Payload: payload
  };

  async.parallel({
    waveform: function(callback) {
      async.waterfall([
        function(callback) {
          console.log('downloading episode...');
          downloadEpisode(mp3Path, callback);
        },
        function(tempFilePath, callback) {
          console.log('making waveform...', tempFilePath);
          makeWaveform.go(tempFilePath, targetWidth, callback);
        }
      ], callback);
    },
    showData: function(callback) {
      console.log('fetching show data...');
      getTranscript.go(episodeNum, undefined, undefined, callback);
    }
  }, allDone);

  function allDone(err, msg) {
    // console.log(msg.waveform, msg.showData);
    if (err && !msg) return cb(err);

    const showData = msg.showData.showData;
    let regionData = msg.showData.range;
    let waveformData = msg.waveform;
    regionData.pointsPerSecond = msg.waveform.length / showData.duration;

    regionData.waveform = waveformData;

    const dataToSave = {
      date: new Date(),
      showData: showData,
      regionData: regionData
    };

    uploadWaveformAndTranscriptData(episodeNum, dataToSave, function(err, success) {
      if (err) return cb(err);
      const newKey = success.Key;
      console.log('uploaded', newKey);
      // clean up temp directory and mp3
      helpers.cleanDir(tempDir);

      // TO DO: update key in database
      var dbValues = {
        "EPISODE_NUMBER": episodeNumber,
        "KEYNAME": success.Key
      };

      db.upsert('episode', dbValues, function(err, success) {
        if (err) return cb(err);
        else {
          // cleanup older versions of this show from s3 files
          var params = {
            Bucket: bucketName, /* required */
            Prefix: newKey.split('-')[0] + '-' // i.e. episodes/36-
          };
          s3.listObjects(params, function(err, data) {
            if (err) return done(err);
            if (data.Contents.length > 1) {
              var params = {
                Bucket: bucketName, /* required */
                Delete: { /* required */
                  Objects: data.Contents.map( (item) => {
                    return {Key: item.Key}
                  }).filter( (item) => {
                    return item.Key !== newKey;
                  })
                }
              };
              s3.deleteObjects(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                // finish Lambda
                else return cb(null, {
                  message: newKey
                });
              });
            }
            else {
              // finish Lambda
              return cb(null, { message: newKey });
            }

          });
        }
      });
    });
  }

/*
  if (err) {
    callback({
      status: 'error',
      message: err
    });
  }
  else {
    callback(null, {
      status: 'success',
      message: JSON.parse(data.Payload).message,
      showNumber: episodeNum
    });
  }
  */
}

function downloadEpisode(mp3Path, cb) {
  helpers.downloadFile(mp3Path, cb); 
}

function uploadWaveformAndTranscriptData(episodeNumber, showData, cb) {
  const newVersion = new Date().valueOf().toString();
  const dstKey = `episodes/${episodeNumber}-data_${newVersion}.json`;

  // TO DO: gzip and encrypt first (a la https://github.com/binoculars/aws-lambda-ffmpeg)
  var body = JSON.stringify(showData);

  var params = {
    Bucket: bucketName,
    Key: dstKey,
    ContentType: 'application/json',
    Body: body,
    CacheControl: 'max-age=31536000' // 1 year (60 * 60 * 24 * 365)
  };

  s3upload(params, cb)
}

function s3upload(params, cb) {
  s3.upload(params)
    .on('httpUploadProgress', function(evt) {
      console.log('Progress:', evt.loaded, '/', evt.total);
    })
    .send(function(err, success){
      console.log(success);
      cb(err, success);
    });
}

module.exports = router;
