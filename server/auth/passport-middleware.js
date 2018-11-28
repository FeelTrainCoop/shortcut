// middleware for passport (twitter and facebook auth)
'use strict';

const passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy;

function init(app) {
  app.use(passport.initialize());

  passport.use(
    new FacebookStrategy({
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      passReqToCallback: true,
      enableProof: false
    },
    function(req, accessToken, refreshToken, profile, done) {

      var userInfo = JSON.stringify({
        accessToken: accessToken,
        displayName: profile.displayName,
        userId: profile.id
      });

      var user = {
        facebook: {
          info: userInfo,
          displayName: profile.displayName
        }
      }

      done(null, user);
    }
  ));

  passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
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
