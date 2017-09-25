'use strict';

/**
 *  Generate the video from our snippet information.
 */

const request = require('request');
const async = require('async');
const fs = require('fs');
const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const extension = '.mp4';
const dataBucket = process.env.DATA_BUCKET;
const segmentLength = 10; // length of .ts source files in seconds
const tempDir = process.env.TEMP || '/tmp';
const maxDuration = 30; // max allowed clip duration (in seconds)
const mimeType = 'video/mpeg';
const fps = 20;
const merge = require('./merge');
const animate = require('./anim/animcontrol');

module.exports = function(req, res) {
  // event variables
  const params = req.query;
  let showID, startTime, duration, type, bgColor, wordArray, opts;
  let tweetData = false, bucketName;
  let event = req.body;

  // destination file name / key
  let dstKey;

  //if (!bucketName) cb('no bucket name');

  // ensure valid event
  if (!checkRequest(event) ) {
    return failWithError('invalid query params', {});
  }

  // parse variables from event (should these be global?)
  showID = event.show;
  startTime = parseFloat( event.start );
  duration = parseFloat( event.dur || maxDuration );
  type = event.type || 'basic';
  wordArray = event.words ? event.words : [];
  opts = event.opts ? event.opts : {};
  bgColor = opts.style.bgColor;

  console.log(showID);

  const WORDS = wordArray.map(function(word) {
    return word.text;
  }).join(' ').trim();

  const SPEAKERS = wordArray.reduce(function(str, word) {
    var sep = '';
    if (word.heading) {
     if (str.length > 0) {
       sep = ', ';
     }
     return str += (sep + word.heading);
    } else {
     return str;
    }
  }, '');

  // check request details 
  var data = {'hash': event.h, 'ua': event['User-Agent']};

  // if wordArray is a string, JSON.parse it
  if (typeof wordArray === 'string') {
    wordArray = JSON.parse(wordArray);
  }

  // destination file name / key
  dstKey = `${showID}_${startTime}_${duration}_${bgColor.slice(1)}${extension}`;
  console.log(WORDS, SPEAKERS, data);

  // download HLS chunks
  var filesToDownload = parseFilesToDownload(showID, startTime, duration);
  var localFilePaths = filesToDownload.map(function(f) {
    return tempDir + '/' + f.split('/').pop();
  });

  async.each(filesToDownload, function(filePath, callback) {
    downloadFile(filePath, callback);
  }, function(err, msg) {
    if (err) {
      failWithError('Error downloading audiofiles', err);
      return;
    }
    else {
      console.log('downloaded the file!!!');
      // start time relative to the first clip
      var relStart = startTime % segmentLength;
      var tempOutName = tempDir + '/output.mp4';
      opts.showNumber = event.show;
      animate.start(startTime, duration, wordArray, event.Origin, opts, fps, function() {
        merge.mergeFiles(localFilePaths, relStart, duration, tempOutName, fps, function(err, success) {
          if (err) {
            failWithError('Error merging files', err);
          }

          console.log(tempOutName);

          uploadFile(tempOutName, dstKey, tweetData, function(err, results) {
            if (err) {
              failWithError('Error uploading video', err);
            }

            localFilePaths.push(tempOutName);

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            let videoData = {
              Bucket: results.s3.Bucket,
              Key: results.s3.Key,
              message: 'Successfully uploaded to S3.',
              url: results.s3.Location
            }

            res.json(videoData);

            // delete the downloaded .ts files
            cleanupFiles(localFilePaths, function(err, msg) {
              console.log('deleted files');
            });

          });

        });
      });

    }
  });

};

// ensure that event params are valid
function checkRequest(event) {
  if (!event.show || typeof event.start === 'undefined') {
    // error
    return false;
  } else {
    return true;
  }
}

function parseFilesToDownload(showID, startTime, duration) {
  var filesToDownload;

  // figure out start and end .ts files to download (assuming .ts files are 10 second chunks)
  var streamBase = dataBucket + showID;
  var startStreamID = timeToSegmentID(startTime);
  var endStreamID = timeToSegmentID(startTime + duration);

  var startStream = streamBase + startStreamID + '.ts';
  var endStream = streamBase + endStreamID + '.ts';

  // array of file URLs to download
  // var filesToDownload = startStream === endStream ? [startStream] : [startStream, endStream];
  filesToDownload = [startStream];

  // fill in any additional 10 second chunks between desired start and end time
  var dif = Number(endStreamID) - Number(startStreamID);
  while (dif > 1) {
    dif--;
    var midStreamID = Number(endStreamID) - dif;
    filesToDownload.push( streamBase + zeroPad(midStreamID) + '.ts');
  }

  if (endStream !== startStream) {
    filesToDownload.push(endStream);
  }

  return filesToDownload;
}

function timeToSegmentID(timeInSeconds) {
  return zeroPad( Math.floor(timeInSeconds / segmentLength) );
}

// segment IDs need to be formatted like this "001"
function zeroPad(number) {
  var str = String(number);

  while (str.length < 3) {
    str = '0' + str;
  }

  return str;
}

function failWithError(msg, err) {
  console.log(msg, err);
}

function downloadFile(origPath, callback) {
  var tempName = tempDir + '/' + origPath.split('/').pop();
  var dlStream = fs.createWriteStream(tempName);
  dlStream.on('finish', function(err, msg) {
    callback(err, msg);
  });

  request.get(origPath)
  .on('error', function(err) {
    console.log(err);
    callback(err);
  })
  .on('response', function(response) {
    response.pipe(dlStream);
  })
  .on('end', function(resp) {
    // console.log('downloaded');
  });
}

function cleanupFiles(filePaths, callback) {
  async.each(filePaths, function(filePath, callback) {
    fs.unlink(filePath, callback);
  }, function(err, msg) {
    callback(err, msg);
  });
}

function uploadFile(tempFile, dstKey, tweetData, callback) {
  var readStream = fs.createReadStream(tempFile);

  var params = {
    ACL: 'public-read',
    Bucket: bucketName,
    Key: dstKey,
    ContentType: mimeType,
    CacheControl: 'max-age=31536000' // 1 year (60 * 60 * 24 * 365)
  };

  // TO DO: gzip and encrypt first (a la https://github.com/binoculars/aws-lambda-ffmpeg)
  params.Body = readStream;

  // upload to s3, and to twitter (not any more!), in parallel
  async.parallel({
    s3: function(cb) {
      s3upload(params, tempFile, cb);
    },
    tweet: function(cb) {
      if (!tweetData){
        cb(null, 'no tweet');
      }
      else {
        // tweet.tweetVideo(tweetData, tempFile, cb);
      }
    }
  }, function(err, results) {
    console.log('results', results, 'err', err);
    // results is object with {'s3': , 'tweet' : }
    callback(err, results);
  });

}

function s3upload(params, filename, cb) {
  const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    // credentials: AWS.config.credentials,
    region: process.env.s3Region
  });

  s3.upload(params)
    .on('httpUploadProgress', function(evt) {
      // console.log(filename, 'Progress:', evt.loaded, '/', evt.total);
    })
    .send(function(err, success){
      cb(err, success);
    });
}
