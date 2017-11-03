'use strict';

const allEpisodeData = require('./all-episode-data');
const cfSign = require('../auth/cf-sign.js');

/**
 *  Get signedUrl to access episode data from cloudfront.
 *
 *  Takes a request for an object like `580-data.json`,
 *  finds the latest version number (`getEpisodeVersion`),
 *  and generates a signedUrl that expires
 */
module.exports = function(req, res) {
  // get latest version of the S3 / CloudFront object key for this episode
  const epNumber = req.params.show.split('-')[0];
  let epVersion = allEpisodeData.getEpisodeVersion(epNumber);
  if (!epVersion) {
    epVersion = req.params.show; // backup
  }

  // generate signed url
  const protectedUrl = `${process.env.CLOUDFRONT_URL}${epVersion}`;
  const signedUrl = cfSign.getSignedUrl(protectedUrl, req);
  res.setHeader("Cache-Control", "public, max-age=2592000");
  res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());

  // redirect to signedURL if url contains 'api'
  if (req.baseUrl.indexOf('api') > -1) {
    return res.redirect(302, signedUrl);
  }
  return res.send(signedUrl);
};
