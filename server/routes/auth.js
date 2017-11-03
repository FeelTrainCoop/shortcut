/*
  Routes handling Passport authentication with Twitter and Facebook
 */

'use strict';

const passport = require('passport');
const express = require('express');
const router = express.Router();

router.get('/facebook', function(req, res, next){
  // set callback url
  req.app.locals.fbCallback = (req.headers['x-forwarded-proto'] || req.protocol)  + '://' + req.get('host') + process.env.FACEBOOK_CALLBACK + '?redirect_uri=shortcut.thisamericanlife.org';
  passport.authenticate('facebook', {
    scope: ['publish_actions'],
    callbackURL: req.app.locals.fbCallback,
    session: false
  })(req, res, next);
});

router.get('/facebook/callback',
  function(req, res, next) {
    passport.authenticate('facebook', {
        failureRedirect: '/login',
        callbackURL: req.app.locals.fbCallback
      })(req, res, next);
  },
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect(`${(req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host')}/#/login/facebook/${req.user.facebook.displayName}/${req.user.facebook.info}`);
  }
);

// Twitter login routes
router.get('/twitter', function(req, res, next){
  passport.authenticate('twitter', {callbackURL: (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host') + process.env.TWITTER_CALLBACK})(req, res, next);
});

router.get('/twitter/callback',
  passport.authenticate('twitter', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    if ('development' === req.app.get('env')) {
      res.redirect(`http://localhost:8000/#/login/twitter/${req.user.twitter.userName}/${req.user.twitter.info}`);
    }
    else {
      res.redirect(`${(req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host')}/#/login/twitter/${req.user.twitter.userName}/${req.user.twitter.info}`);
    }
  }
);

module.exports = router;
