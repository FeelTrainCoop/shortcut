const fs = require('fs');
const request = require('request');
const path = require('path');
const inactiveEpisodes = process.env.BAD_EPISODES.split(',');
const Parser = require('rss-parser');
const parser = new Parser();

module.exports = {
  parseRSS: function(body, cb) {
    parser.parseString(body, function(error, feed) {
      if (!error) {
        let episodes = feed.items.sort((a,b) => {
            return Date.parse(b.pubDate) - Date.parse(a.pubDate);
          })
          .map((episode, index, array) => {
            // infer an ID number from the chronological order of episodes
            let number = (array.length - index).toString();
            // unless there's an explicit "itunes:episode" tag, in which case we use that
            // according to the spec this should be a non-zero integer
            // http://podcasts.apple.com/resources/spec/ApplePodcastsSpecUpdatesiOS11.pdf
            let season = '';
            if (episode.itunes.episode !== undefined) {
              // prepend the "itunes:season" id if that exists, also should be nonzero int
              if (episode.itunes.season !== undefined) {
                season = 's' + episode.itunes.season;
              }
              let epNum = 'e' + episode.itunes.episode;
              number = season + epNum;
            }
            return {
              title: episode.title,
              description: episode.contentSnippet,
              original_air_date: episode.pubDate,
              number
            };
          })
          // filter out inactive episodes
          .filter((episode) => !inactiveEpisodes.includes(episode.number));
        cb({err: null, episodes});
      }
      else {
        cb({err: `This error occurred: ${error}`, episodes: null});
      }
    });
  },

  downloadFile: function(origPath, callback) {
    const tempDir = process.env.TEMP || '/tmp';

    var tempName = tempDir + '/' + origPath.split('/').pop();
    var dlStream = fs.createWriteStream(tempName);
    dlStream.on('finish', function(err, msg) {
      dlStream.close(function(err, msg) {
        if (err) {
          console.log(err);
        }
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
    let files;
    try { files = fs.readdirSync(dirPath); }
    catch(e) { return; }
    if (files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        try {
          var filePath = dirPath + '/' + files[i];
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        } catch(e) {
          console.log('unable to remove ', files[i]);
        }
      }
    }
  }
};
