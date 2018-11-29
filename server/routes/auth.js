/*
  Routes handling Passport authentication with Twitter
 */

'use strict';

const passport = require('passport');
const express = require('express');
const router = express.Router();
const helpers = require('./helpers');

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
