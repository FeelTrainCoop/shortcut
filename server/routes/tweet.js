/**
 *  Tweet the video
 */

'use strict';

const Twit = require('twit');

module.exports = {

  tweetVideo: function(tweetData, filePath, callback) {

    var statusMsg = tweetData.msg;

    var authData = {
      consumer_key : process.env.TWITTER_KEY,
      consumer_secret :  process.env.TWITTER_SECRET,
      access_token : tweetData.accessToken,
      access_token_secret : tweetData.accessTokenSecret
    };

    var T = new Twit(authData);

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

    });
  }
}
