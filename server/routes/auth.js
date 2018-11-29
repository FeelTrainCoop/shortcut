/*
  Routes handling Passport authentication with Twitter and Facebook
 */

'use strict';

const passport = require('passport');
const express = require('express');
const router = express.Router();
const helpers = require('./helpers');

router.get('/facebook', function(req, res, next){
  // set callback url
  const keys = helpers.getApplicationKeys();
  const redirect_uri = req.query.redirect_uri;
  req.app.locals.fbCallback = (req.headers['x-forwarded-proto'] || req.protocol)  + '://' + req.get('host') + keys.facebook_callback + `?redirect_uri=${redirect_uri}`;
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
  const keys = helpers.getApplicationKeys();
  passport.authenticate('twitter', {callbackURL: (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host') + keys.twitter_callback})(req, res, next);
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
      res.redirect(`${(req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host').replace(/:\d*/,'')}/#/login/twitter/${req.user.twitter.userName}/${req.user.twitter.info}`);
    }
  }
);

module.exports = router;
