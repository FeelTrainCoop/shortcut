const fs = require('fs');
const request = require('request');
const path = require('path');

module.exports = {

  downloadFile: function(origPath, callback) {
    const tempDir = process.env['TEMP'] || '/tmp';

    var tempName = tempDir + '/' + origPath.split('/').pop();
    var dlStream = fs.createWriteStream(tempName);
    dlStream.on('finish', function(err, msg) {
      dlStream.close(function(err, msg) {
        if (err) console.log(err);
        console.log('finish');
        setTimeout(function() {
          callback(null, tempName);
        }, 300);
      });
    });

    request.get(origPath)
    .on('error', callback)
    .on('response', function(response) {
      response.pipe(dlStream);
    })
    .on('end', function(resp) {
      console.log('downloaded');
      dlStream.end();
    });
  },

  cleanDir: function(dirPath) {
    try { var files = fs.readdirSync(dirPath); }
    catch(e) { return; }
    if (files.length > 0)
      for (var i = 0; i < files.length; i++) {
        try {
          var filePath = dirPath + '/' + files[i];
          if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath);
        } catch(e) {
          console.log('unable to remove ', files[i]);
        }
      }
  }

}
