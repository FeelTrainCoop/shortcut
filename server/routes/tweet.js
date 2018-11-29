/**
 *  Tweet the video
 */

'use strict';

const Twit = require('twit');
const helpers = require('./helpers');

module.exports = {

  tweetVideo: function(tweetData, filePath, callback) {

    var statusMsg = tweetData.msg;

    
    const keys = helpers.getApplicationKeys();

    var authData = {
      consumer_key : keys.twitter_key,
      consumer_secret : keys.twitter_secret,
      access_token : tweetData.accessToken,
      access_token_secret : tweetData.accessTokenSecret
    };

    var T = new Twit(authData);

    console.log(filePath);
    T.postMediaChunked({ file_path: filePath }, function (err, data) {
      if (err) {
        console.log('Twitter Error Posting Media: ', err);
        // catch authentication errors
        callback(err);
        return;
      }

      // now we can assign alt text to the media, for use by screen readers and
      // other text-based presentations and interpreters
      var mediaIdStr = data.media_id_string;

      console.log('uploaded media', mediaIdStr);

      // now we can reference the media and post a tweet (media will attach to the tweet)
      var params = { status: statusMsg, media_ids: [mediaIdStr] };

      setTimeout(function() {
        T.post('statuses/update', params, function (err, data, response) {
          if (err) {
            console.log('Twitter Error Creating Post: ', err);
            callback(err);
            return;
          }
          else {
            callback(null, {
              'data': data,
              'TWITTER_POST_ID': data.id_str,
              'TWITTER_NAME': data.user.screen_name
            });
          }
        });
      }, 5000, this);

    });
  }
};
