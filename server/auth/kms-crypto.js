'use strict';

/*
 AWS Key Managagement Service is used to encrypt and decrypt
 user oAuth keys/secrets for social sharing (i.e. twitter, facebook)
 */

module.exports = function(_AWS, _keyId) {
  const AWS = _AWS;
  const keyId = _keyId;
  const options = {
    apiVersion: '2014-11-01',
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
  const kms = new AWS.KMS(options);
  const URLSafeBase64 = require('urlsafe-base64');

  return {
    /**
     *  Encrypt a string using AWS KMS
     *  @param  {String}   val      String to encrypt
     *  @param  {Function} callback Callback will receive error, response
     *                              as base64 encoded string
     */
    encrypt: function (val, callback) {
      const params = {
        KeyId: keyId,
        Plaintext: val
      };

      kms.encrypt(params, function(err, data) {
        var base64Cipher;
        if (err) console.log(err, err.stack); // an error occurred
        if (data) {
          base64Cipher = URLSafeBase64.encode(data.CiphertextBlob.toString('base64') );
        }
        callback(err, base64Cipher);
      });
    },

    /**
     *  Decrypt a base64 string using AWS KMS
     *  @param  {String}   val      base64 encoded string
     *  @param  {Function} callback err, response (string)
     */
    decrypt: function (val, callback) {
      const decodedVal = URLSafeBase64.decode(val);
      const blob = new Buffer(decodedVal, 'base64')

      const decryptParams = {
        CiphertextBlob: blob,
      };

      kms.decrypt(decryptParams, function(err, data) {
        var res = null;
        if (err) console.log(err, err.stack); // an error occurred
        else if (data) {
          res = data.Plaintext.toString();
        }
        callback(err, res) // successful response
      });
    }
  };
}
