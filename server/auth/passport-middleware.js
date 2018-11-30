// middleware for passport (twitter auth)
'use strict';

const passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy,
  helpers = require('../routes/helpers');

function init(app) {
  app.use(passport.initialize());

  const keys = helpers.getApplicationKeys();

  passport.use(new TwitterStrategy({
      consumerKey: keys.twitter_key || 'not set',
      consumerSecret: keys.twitter_secret || 'not set',
      passReqToCallback: true
    },
    function(req, token, tokenSecret, profile, done) {

      var userInfo = JSON.stringify({
        accessToken: token,
        accessTokenSecret: tokenSecret,
        userId: profile.id
      });

      var user = {
        twitter: {
          info: userInfo,
          userName: profile.username
        }
      }

      done(null, user);
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(id, done) {
    done(null, id);
  });
}

module.exports = { init: init };
