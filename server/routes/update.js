'use strict';

const express = require('express');
const router = express.Router();
const allEpisodeData = require('./all-episode-data');
const AWS = require('aws-sdk');
const waveformWidth = 30000;

// update show data (list of all episodes and their show data version numbers)
router.get('/', function(req, res) {
  allEpisodeData.update( function(err) {
    if (err) {
      return res.status(500).json({
        'status': 'error',
        'message': 'unable to update show data'
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
  const lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });

  function makeWaveformForEpisode(episodeNum) {
    const payload = JSON.stringify({
      episode: String(episodeNum),
      width: waveformWidth
    });

    const params = {
      FunctionName: 'shortcut-addEpisode', //process.env.LAMBDA_FUNCTION_NAME, /* required */
      Payload: payload
    };

    lambda.invoke(params, function(err, data) {
      if (err) callback({
        status: 'error',
        message: err
      });
      else {
        callback(null, {
          status: 'success',
          message: JSON.parse(data.Payload).message,
          showNumber: episodeNum
        });
      }
    });
  }

  makeWaveformForEpisode(episodeNum);
}

module.exports = router;
