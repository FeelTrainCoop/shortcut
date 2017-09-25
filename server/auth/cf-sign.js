'use strict';

/**
 AWS CloudFront sign for access to json files
 */

const cookieAge = 1000 * 60 * 30;  // 30 minutes
const cf = require('aws-cloudfront-sign');
const URLSafeBase64 = require('urlsafe-base64');
const privateKeyString = URLSafeBase64.decode(process.env.CLOUDFRONT_KEY_BASE64).toString();

module.exports = {
  cloudFrontCookies: function(req, res, next) {
    const options = {
      keypairId: process.env.CLOUDFRONT_KEY_ID,
      privateKeyString: privateKeyString,
      expireTime: new Date().getTime() + cookieAge
    };
    const signedCookies = cf.getSignedCookies(process.env.CLOUDFRONT_URL + '*', options);
    for (var cookieId in signedCookies) {
      res.cookie(cookieId, signedCookies[cookieId], {
        maxAge: cookieAge/*,
        domain: domain*/
      });
    }
    next();
  },
  getSignedUrl: function(url) {
    const options = {
      keypairId: process.env.CLOUDFRONT_KEY_ID,
      privateKeyString: privateKeyString,
      expireTime: new Date().getTime() + 7000
    };
    const signedUrl = cf.getSignedUrl(url, options);
    return signedUrl
  }
};
