'use strict';

const express = require('express');
const router = express.Router();
const auth = require('basic-auth');

router.use('/', function(req, res, next) {
  const credentials = auth(req);

  if (!credentials || credentials.name !== process.env.BETA_LOGIN || credentials.pass !== process.env.BETA_PW) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="example"');
    res.end('Access denied.');
  } else {
    next();
  }
});

module.exports = router;
