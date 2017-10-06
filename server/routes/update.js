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
// create or update show data (waveform + transcript json) for a specific show
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
      if (err) return {message: err};
      const newKey = success.Key;
      console.log('uploaded', newKey);
      // clean up temp directory and mp3
      helpers.cleanDir(tempDir);
      if (err) {
        callback({
          status: 'error',
          message: err
        });
      }
      else {
        callback(null, {
          status: 'success',
          showNumber: episodeNum
        });
      }
    });
  }
}

function downloadEpisode(mp3Path, cb) {
  helpers.downloadFile(mp3Path, cb); 
}

function uploadWaveformAndTranscriptData(episodeNumber, showData, cb) {
  const dstKey = `episodes/${episodeNumber}-data.json`;

  var body = JSON.stringify(showData);

  var params = {
    Bucket: bucketName,
    Key: dstKey,
    ContentType: 'application/json',
    Body: body,
    ACL: 'public-read',
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
