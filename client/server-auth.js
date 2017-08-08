/*
  Server for development that only handles
  auth with Twitter or Facebook. Runs on port 3000
 */

var express = require('express'),
  http = require('http'),
  passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy,
  cookieParser = require('cookie-parser'),
  errorHandler = require('errorhandler'),
  session = require('express-session'),
  RedisStore = require('connect-redis')(session),
  redis = require('redis'),
  client = redis.createClient();

var app = express();

var redis = require('redis').createClient();
var secret = '1f8607f07fe8816f9bd80de7b30f2ebda0bea46c';

passport.use(new FacebookStrategy({
    clientID: '1018979078139155',
    clientSecret: '3a90e8778e2d2d15f31345a524a5c2b7',
    callbackURL: '/auth/facebook/callback',
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    // get the session ID
    var sessionId = req.sessionID;

    // if there is a session ID, then query the db for the user object on the session ID
    if (sessionId) {
      client.get(`sess:${sessionId}`, function(err, reply) {
        if (err) {
          throw err;
        }
        else {
          // attach or overwrite a facebook object
          var user = JSON.parse(reply).passport.user;
          if (user) {
            user.facebook = {
              accessToken: accessToken,
              displayName: profile.displayName,
              id: profile.id
            }
          }
          else {
            user = {
              facebook: {
                accessToken: accessToken,
                displayName: profile.displayName,
                id: profile.id
              }
            }
          }
          done(null, user);
        }
      });
    }
    // if there's no session ID, treat this as a new request
    else {
      done(null, {
        facebook: {
          accessToken: accessToken,
          displayName: profile.displayName,
          id: profile.id
        }
      });
    }
  }
));

passport.use(new TwitterStrategy({
    consumerKey: 'kFy5Fh1NYFC0wWwVK5GlpNLsY',
    consumerSecret: 'nFOU4oPN5BphoNKDDca4iIUCeUQklYZuNxUG076rjKn1VA2K17',
    callbackURL: '/auth/twitter/callback',
    passReqToCallback: true
  },
  function(req, token, tokenSecret, profile, done) {
    // get the session ID
    var sessionId = req.sessionID;

    // if there is a session ID, then query the db for the user object on the session ID
    if (sessionId) {
      client.get(`sess:${sessionId}`, function(err, reply) {
        if (err) {
          throw err;
        }
        else {
          var user = JSON.parse(reply).passport.user;
          if (user) {
            user.twitter = {
              accessToken: token,
              displayName: profile.displayName,
              userName: profile.username,
              id: profile.id
            }
          }
          else {
            user = {
              twitter: {
                accessToken: token,
                displayName: profile.displayName,
                userName: profile.username,
                id: profile.id
              }
            }
          }
          // store this new object in the session store
          done(null, user);
        }
      });
    }
    // if there's no session ID, treat this as a new request
    else {
      done(null, {
        twitter: {
          accessToken: token,
          displayName: profile.displayName,
          userName: profile.username,
          id: profile.id
        }
      });
    }
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  done(null, id);
});

// all environments
app.set('port', process.env.PORT || 3000);
app.use(cookieParser(secret));
app.use(session({
  store: new RedisStore({
    client,
    host: 'localhost',
    port: 6397
    }),
  secret: secret,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

// Facebook login routes
app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['publish_actions']}));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect(`http://localhost:8000/#/login/facebook/${req.user.facebook.displayName}/${req.user.facebook.accessToken}`);
  });
// Twitter login routes
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect(`http://localhost:8000/#/login/twitter/${req.user.twitter.userName}/${req.user.twitter.accessToken}`);
  });

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
