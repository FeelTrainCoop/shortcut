const AWS = require('aws-sdk');
const async = require('async');
const fs = require('fs');

const tempDir = process.env.TEMP || '/tmp';

var tweetData = {};
var fbData = {};

const tempFileName =  tempDir + '/' + 'temp.mp4';

module.exports = function(req, res) {
  let data = req.body;
  tweetData = JSON.parse(data.twitter_info);
  tweetData.msg = data.msg;
  async.series({

    // download video from S3
    downloadVideo: function(callback) {
      downloadVideo(data, function(err, res) {
        if (err) {
          failWithError('Error downloading video', err, callback);
        } else {
          callback(null, res);
        }
      });
    },

    share: function(callback) {
      async.parallel([

        function(shareCallback) {
          if (!data.twitter_info) {
            shareCallback(null, {});
          } else {
            require('./tweet').tweetVideo(tweetData, tempFileName, function(err, res) {
              if (err) {
                tweetData.errorMessage = 'Tweet failed';
              }
              else {
                tweetData.TWITTER_POST_ID = res.TWITTER_POST_ID;
                tweetData.TWITTER_NAME = res.TWITTER_NAME;
              }
              shareCallback(err, res);
            });
          }
        }
      ], callback);
    },
  }, function(err, results) {
    console.log('results:', results);

    // if there was an error and there was no tweet
    if (err && !results.tweet) {
      failWithError('Tweet failed: ' + err.msg, err, console.log);
      return;
    }

    res.json({
      tweetId: tweetData.TWITTER_POST_ID,
      facebookId: null
    });
  });
};

function downloadVideo(event, callback) {
  const s3 = new AWS.S3();
  var dlStream = fs.createWriteStream(tempFileName);

  dlStream.on('finish', function(err) {
    if (err) {
      callback(err);
      return;
    }
    callback(null, tempFileName);
  });

  dlStream.on('error', function(err) {
    callback(err);
  });

  const params = {
    Bucket: event.video_data.Bucket, /* required */
    Key: event.video_data.Key, /* required */
  };

  s3.getObject(params).createReadStream().pipe(dlStream);

}

/**
 *  context.fail with an error and status 'failure'
 *  
 *  @param  {String}   msg Error message
 *  @param  {Object}   err i.e. {status: 'failure', msg: 'message'}
 *  @param  {Function} cb  callback of the Lambda context, where first
 *                         param is equal to context.fail()
 */
function failWithError(msg, err, cb) {
  let errorData = {
    'status': 'failure',
    'msg' : msg
  };
  console.error('there was an error: ', msg);
  console.error(err);
  let error = new Error(JSON.stringify(errorData));
  return cb(error);
}
