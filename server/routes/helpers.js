const fs = require('fs');
const request = require('request');
const inactiveEpisodes = process.env.BAD_EPISODES.split(',');
const Parser = require('rss-parser');
const parser = new Parser();

module.exports = {
  // body: the RSS XML
  // episodes: array of JSON-formatted episodes as stored in the database,
  //           or `true` to return all episodes
  parseRSS: function(body, episodes, cb) {
    // create an array of guid values of only active episodes
    let rssActiveEpisodes = [];
    if (Array.isArray(episodes)) {
      rssActiveEpisodes = episodes
                                  .filter(episode => !!episode.isEnabled === true)
                                  .map(episode => episode.guid);
    }
    parser.parseString(body, function(error, feed) {
      if (!error) {
        let unfilteredEpisodes = feed.items.sort((a,b) => {
            return Date.parse(b.pubDate) - Date.parse(a.pubDate);
          })
          // remove any feed items that don't have an mp3 enclosure
          .filter(episode => { return (episode.enclosure && episode.enclosure.url); })
          .map((episode) => {
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
              number,
              mp3: episode.enclosure.url
            };
          });
        let filteredEpisodes = unfilteredEpisodes
          // filter out inactive episodes specified in the .env file
          .filter((episode) => !inactiveEpisodes.includes(episode.number))
          // filter out inactive episodes (only include explicitly active episodes in the admin panel)
          .filter((episode) => rssActiveEpisodes.includes(episode.guid));
        cb({err: null, episodes: filteredEpisodes, episodesUnfiltered: unfilteredEpisodes});
      }
      else {
        cb({err: `This error occurred: ${error}`, episodes: null});
      }
    });
  },

  // get the show metadata from RSS
  parseRSSMeta: function(body, cb) {
    parser.parseString(body, function(error, feed) {
      let feedMissingRequiredField = feed && (!feed.title || !feed.description || !feed.link || !feed.itunes || !feed.itunes.author);
      if (!error && !feedMissingRequiredField && feed.items.length > 0) {
        let showData = {
          title: feed.title,
          description: feed.description,
          link: feed.link,
          author: feed.itunes.author,
          episodes: feed.items.length
        };
        cb({err: null, showData});
      }
      else if (feed && feed.items && feed.items.length === 0) {
        cb({err: `RSS feed has no mp3 enclosure items!`, showData: null});
      }
      else if (feedMissingRequiredField) {
        cb({err: `RSS feed is missing <title>, <description>, <link>, or <itunes:author>`, showData: null});
      }
      else {
        cb({err: `This error occurred: ${error}`, showData: null});
      }
    });
  },

  downloadFile: function(origPath, callback) {
    const tempDir = process.env.TEMP || '/tmp';

    var tempName = tempDir + '/' + origPath.split('/').pop();
    var dlStream = fs.createWriteStream(tempName);
    dlStream.on('finish', function(err) {
      if (err) {
        throw new Error(err);
      }
      dlStream.close(function(err) {
        if (err) {
          throw new Error(err);
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
    .on('end', function() {
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
  },

  isSourceSet: function() {
    const Database = require('better-sqlite3');
    const db = new Database('shortcut.db');
    const result = db.prepare('select * from kvs where key = ?').get('episodeSource');
    if (result !== undefined) {
      return JSON.parse(result.value).rss;
    }
    else {
      return false;
    }
  },

  getApplicationKeys: function() {
    // this is synchronous because better-sqlite3 is synchronous
    // first check the env vars
    if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME) {
      return {
        aws_region:           process.env.AWS_REGION,
        aws_accessKeyId:      process.env.AWS_ACCESS_KEY_ID,
        aws_secretAccessKey:  process.env.AWS_SECRET_ACCESS_KEY,
        aws_bucketName:       process.env.AWS_S3_BUCKET_NAME,
        twitter_key:          process.env.TWITTER_KEY,
        twitter_secret:       process.env.TWITTER_SECRET,
        twitter_callback:     process.env.TWITTER_CALLBACK,
        facebook_id:          process.env.FACEBOOK_ID,
        facebook_secret:      process.env.FACEBOOK_SECRET,
        facebook_callback:    process.env.FACEBOOK_CALLBACK
      };
    }
    // second, check the db, return empty values if neither are set
    const Database = require('better-sqlite3');
    const db = new Database('shortcut.db');
    let result = db.prepare('select * from kvs where key = ?').get('applicationKeys');
    result = result ? JSON.parse(result.value) : {
      aws_region:          '',
      aws_accessKeyId:     '',
      aws_secretAccessKey: '',
      aws_bucketName:      '',
      twitter_key:         '',
      twitter_secret:      '',
      twitter_callback:    '',
      facebook_id:         '',
      facebook_secret:     '',
      facebook_callback:   '',
    };
    return result;
  }
};
