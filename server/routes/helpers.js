const fs = require('fs');
const request = require('request');
const path = require('path');
const inactiveEpisodes = process.env.BAD_EPISODES.split(',');
const Parser = require('rss-parser');
const parser = new Parser();

module.exports = {
  // body: the RSS XML
  // episodes: array of JSON-formatted episodes as stored in the cache object,
  //           or `true` to return all episodes
  parseRSS: function(body, episodes, cb) {
    // create an array of guid values of only active episodes
    let rssActiveEpisodes = [];
    if (Array.isArray(episodes)) {
      rssActiveEpisodes = episodes
                                  .filter(episode => episode.enabled === true)
                                  .map(episode => episode.value);
    }
    parser.parseString(body, function(error, feed) {
      if (!error) {
        let unfilteredEpisodes = feed.items.sort((a,b) => {
            return Date.parse(b.pubDate) - Date.parse(a.pubDate);
          })
          .map((episode, index, array) => {
            let guid = episode.guid || episode.link;
            // set the ID number to the guid
            let number = guid;
            // overwrite the number if there's an explicit "itunes:episode" tag, in which
            // case we use that. according to the spec this should be a non-zero integer
            // http://podcasts.apple.com/resources/spec/ApplePodcastsSpecUpdatesiOS11.pdf
            let season = '';
            if (episode.itunes && episode.itunes.episode !== undefined) {
              // prepend the "itunes:season" id if that exists, should also be nonzero int
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
              guid,
              number
            };
          });
        let filteredEpisodes = unfilteredEpisodes
          // filter out inactive episodes specified in the .env file
          .filter((episode) => !inactiveEpisodes.includes(episode.number))
          // filter out inactive episodes (only include explicitly active episodes in the admin panel)
          // unless we passed `true` to `episodes` in which case, include all episodes
          .filter((episode) => episodes === true || rssActiveEpisodes.includes(episode.guid));
        cb({err: null, episodes: filteredEpisodes, episodesUnfiltered: unfilteredEpisodes});
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
