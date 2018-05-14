'use strict';

// load .env variables (for development)
require('dotenv').config();

const express = require('express'),
  fs = require('fs'),
  http = require('http'),
  https = require('https'),
  compression = require('compression'),
  cookieParser = require('cookie-parser'),
  errorHandler = require('errorhandler'),
  session = require('cookie-session'),
  helmet = require('helmet'),
  bcrypt = require('bcrypt-nodejs'),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  basicAuth = require('express-basic-auth');

let sslOptions;
try {
  sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT)
  };
} catch(err) {
  if (err.errno === -2) {
    console.log('No SSL key and/or cert found, not enabling https server');
  }
  else {
    console.log(err);
  }
}

// template with marko https://github.com/marko-js/marko
require('marko/express');
require('marko/node-require').install();
const template = require('./views/home.marko');
const errorTemplate = require('./views/error.marko');

const app = express();
const routes = require('./routes');
const passportMiddleware = require('./auth/passport-middleware.js');
// synchronous read, but it only happens on server init
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('shortcut.db');
// helper functions to get and set key/value pairs stored in `kvs`
db.getKey = function(key, cb) {
  this.get('select * from kvs where key = $key', {$key: key}, cb);
};
db.setKey = function(key, value, cb) {
  if (typeof value !== 'string') {
    value = JSON.stringify(value);
  }
  this.run('insert or replace into kvs values($key, $value)', {
    $key: key,
    $value: value
  }, cb);
};

// if there is no `episodes` table in the DB, create an empty table
db.run('CREATE TABLE IF NOT EXISTS episodes (guid TEXT PRIMARY KEY, isEnabled INTEGER)');
// if there is no `kvs` (key/value store) table, create it
db.run('CREATE TABLE IF NOT EXISTS kvs (key TEXT PRIMARY KEY, value TEXT)', () => {
  // update `allEpisodes` in our key/value store
  routes.allEpisodeData.update(db);
});

// all environments
app.set('db', db);
app.set('port', process.env.PORT || 3000);
app.set('port-https', process.env.PORT_HTTPS || 8443);
app.use(compression());
app.disable('x-powered-by');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// add pw protection if the following environment variables are provided (i.e on staging not prod)
if (process.env.BETA_LOGIN && process.env.BETA_PW) {
  app.use('/', require('./auth/password-protect'));
}

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: true,
  maxAge: 128000
}));

// if the admin password is set as an environment variable and there isn't one already in the DB, set the admin user/password in the DB
db.getKey('admin', function(err, res) {
  if (res === undefined && process.env.ADMIN_PASSWORD) {
    db.setKey('admin', {username: bcrypt.hashSync('admin'), password: bcrypt.hashSync(process.env.ADMIN_PASSWORD)});
  }
});

let basicUserAuth = basicAuth({
  authorizer: asyncAuthorizer,
  authorizeAsync: true,
  challenge: true
});

let skipFirstAuth = basicAuth({
  authorizer: firstTimeAuthorizer,
  authorizeAsync: true,
  challenge: true
});

function asyncAuthorizer(username, password, cb) {
  let isAuthorized = false;
  db.getKey('admin', function(err, res) {
    res = JSON.parse(res.value);
    const isPasswordAuthorized = bcrypt.compareSync(password, res.password);
    const isUsernameAuthorized = bcrypt.compareSync(username, res.username);
    isAuthorized = isPasswordAuthorized && isUsernameAuthorized;
    if (isAuthorized) {
      return cb(null, true);
    }
    else {
      return cb(null, false);
    }
  });
}

function firstTimeAuthorizer(username, password, cb) {
  // if no admin password is set, we authorize without any credentials because this is first-time setup
  db.getKey('admin', function(err, res) {
    if (res === undefined) {
      return cb(null, true);
    }
    else {
      return asyncAuthorizer(username, password, cb);
    }
  });
}

// admin page
app.use('/admin', cors({ credentials: true, origin: true }), basicUserAuth, routes.admin);

// setup page
app.options('/setup', cors());
app.use('/setup', cors({credentials: true, origin: true}), skipFirstAuth, routes.setup);

// get recent episodes to display on main page
app.options('/recent', cors());
app.get('/recent', cors(), routes.recentEpisodes);

// seach episode data (not currently used)
app.get('/search', routes.search);

// update episode data with latest info, or update/add invidividual episode
app.use(`/api/${process.env.API_HASH}/update/`, routes.update);

// redirect to get data for a specific show from cloudfront / s3
app.get('/d/:show', routes.getEpisode);
//app.use(`/api/${process.env.API_HASH}/episode/:show`, routes.getEpisode);

// passport authentication
passportMiddleware.init(app);
app.use('/auth', routes.auth);

// create snippet video
app.options('/create-video', cors());
app.post('/create-video', cors(), routes.createVideo);

app.options('/api', cors());
app.use('/api', cors(), routes.api);

// post to social media
app.options('/social-post', cors());
app.post('/social-post', cors(), routes.socialPost);

app.use(helmet());

// index route
app.get('/', function(req, res) {
  // load all episodes
  let latestEpisodes =  JSON.stringify( routes.allEpisodeData.getAllEpisodes().slice(0, 600) );
  if (!latestEpisodes) {
    latestEpisodes = undefined;
  }

  // inject latest episodes and app version into Marko HTML template
  res.marko(template, {
    // version of client JS code
    latestEpisodes: latestEpisodes,
    inactiveEpisodes: process.env.BAD_EPISODES
  });
});

app.get('/*', function (req, res, next) {
  if (req.url.indexOf('/assets') === 0 || req.url.indexOf('.js') > -1 || req.url.indexOf('.html') > -1 || req.url.indexOf('.ico') > -1) {
    if (req.url.indexOf('auth') > -1) {
      return next();
    }
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());
  }
  next();
});

// serve the compiled distribution assets from the client directory
app.use(express.static('../client/dist', {
  maxAge: 128000
}));


// error handling

if ('development' === app.get('env')) {
  app.use(errorHandler());
}

app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') {
    console.error(err);
    if (res.headersSent) {
      return next(err);
    }
    return res.marko(errorTemplate, {
      errorMessage: 'Server error',
      errorAction: 'Please Submit a bug report'
    });
  }

  // handle CSRF token errors here
  res.status(403);
  res.send('form tampered with');
});

app.use(function(req, res, next) {
  if (res.headersSent) {
    return next();
  }
  else if (res.status >= 500) {
    return res.marko(errorTemplate, {
      errorMessage: 'Server error',
      errorAction: 'Please submit a bug report'
    });
  }
  return res.marko(errorTemplate, {
    errorMessage: 'Nothing to see here',
    errorAction: '404 — not found. <a href="/">Go home</a>'
  });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
if (sslOptions) {
  https.createServer(sslOptions, app).listen(app.get('port-https'), function(){
    console.log('Express https server listening on port ' + app.get('port-https'));
  });
}
