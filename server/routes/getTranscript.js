'use strict';

const request = require('request');
const striptags = require('striptags');
const rssFeed = process.env.RSS_FEED;
const dataBucket = process.env.DATA_BUCKET;
const allEpisodeData = require('./all-episode-data');

module.exports = {

  go: function(episodeNumber, startTime, endTime, cb) {
    // TODO: make this work with rss and our auto stuff
    // episodenumber.json is the Gentle file, which should be stored in our DB, so get transcript from episodes where guid = guid (how do I know the guid? all I have is episodeNumber)
    // so basically if it's RSS I just need to pass the JSON stringified gentle file from the DB into episodeDataCallBack
    if (rssFeed) {
      let episodes = allEpisodeData.getAllEpisodesUnfiltered();
      let episode = episodes.filter(ep => {
        return ep.number === episodeNumber;
      })[0];
      const Database = require('better-sqlite3');
      const db = new Database('shortcut.db');
      let result = db.prepare(`select transcript from episodes where guid = ?`).get(episode.guid);
      if (result === undefined) {
        console.log(`unable to find episode with guid of "${episode.guid}"`);
      }
      episodeDataCallback(null, result.transcript, startTime, endTime, episodeNumber, allEpisodeData.getAllEpisodes(), cb);
    }
    else {
      let episodeDataURL = `${dataBucket}${episodeNumber}/${episodeNumber}.json`;
      if (process.env.API_URL) {
        episodeDataURL = `${dataBucket}${episodeNumber}.json`;
      }

      request.get({
        url: episodeDataURL,
        rejectUnauthorized: false
        },
        function(err, response, body) {
          episodeDataCallback(err, body, startTime, endTime, episodeNumber, allEpisodeData.getAllEpisodes(), cb);
        });
    }
  }

};

function episodeDataCallback(err, body, _startTime, _endTime, episodeNumber, episodesBody, cb) {
  if (err) {
    console.log('error', err);
  }
  const showData = JSON.parse(body);
  const episodesData = episodesBody.length ? episodesBody : JSON.parse(episodesBody);
  const episodeData = episodesData.filter(episode => episode.number === episodeNumber)[0];
  let startTime, endTime, startTimeMillis, endTimeMillis, wordsInRange, paragraphsInRange;

  // Parse as TAL transcript if correct JSON format present
  if (showData.transcript && showData.transcript.words) {
    startTime = _startTime || 0;
    endTime = _endTime || showData.duration;
    startTimeMillis = startTime * 1000;
    endTimeMillis = endTime * 1000;
    wordsInRange = showData.transcript.words.filter(function(word) {
      return word[1].length > 0 && Number(word[0]) >= startTimeMillis && Number(word[0]) <= endTimeMillis;
    }).map(function(word) {
      return [word[0], striptags(decodeHTMLEntities(word[1]), ['&'])];
    });

    let index = false;
    paragraphsInRange = showData.transcript.paragraphs.filter(function(paragraph, i) {
      const val = paragraph >= startTimeMillis && paragraph <= endTimeMillis;

      // add first paragraph ... necessary?
      if (val && !index && i > 1) {
        index = true;
      }
      return val;
    });

    // add first paragraph if necessary
    if (index && index !== true) {
      paragraphsInRange.unshift(showData.transcript.paragraphs[index]);
    }

    cb(err, {
      showData: {
        number: showData.number, // episode number (Number)
        duration: showData.duration, // in seconds
        hls: showData.hls,
        original_air_date: showData.original_air_date,
        description: showData.description,
        url: showData.url,
        acts: showData.acts,
        title: showData.title
      },
      range:{
        start: startTime,
        end: endTime || showData.duration,
        words: wordsInRange, // times in ms
        paragraphs: paragraphsInRange // start times in ms
      }
    });
  }
  else {
    if (!showData.duration) {
      showData.duration = Math.round(showData.words[showData.words.length-1].end);
    }
    showData.number = episodeNumber;
    if (rssFeed) {
      showData.hls = `https://s3-${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_S3_BUCKET_NAME}/episodes/${episodeNumber}/${episodeNumber}.m3u8`;
    }
    else {
      showData.hls = `${dataBucket}${episodeNumber}/${episodeNumber}.m3u8`;
    }
    showData.description = episodeData.description;
    showData.title = episodeData.title;
    showData.original_air_date = episodeData.original_air_date;

    // not currently in use but may be useful in the future
    startTime = _startTime || 0;
    endTime = _endTime || showData.duration || showData.words[showData.words.length-1].end;
    startTimeMillis = startTime * 1000;
    endTimeMillis = endTime * 1000;

    let lastValidTimestamp;
    const wordsInRange = showData.words.map(function(word, i) {
      // keep track of the last known valid timestamp so we can fake times we don't have alignment for
      let nextWord = showData.words[i+1];
      if (nextWord === undefined) {
        nextWord = {startOffset: word.endOffset};
      }
      let timestamp;
      if (word.start) {
        timestamp = word.start*1000;
      }
      else {
        timestamp = lastValidTimestamp+1;
      }
      lastValidTimestamp = timestamp;
      return [Math.round(timestamp)+'', striptags(decodeHTMLEntities(showData.transcript.substr(word.startOffset, nextWord.startOffset-word.startOffset)).trim(), ['&'])];
    });
    // add a placeholder empty string at time 0 (necessary for the reduce function that the client does)
    wordsInRange.unshift(['0','']);

    // Fake paragraph breaks on every word that contains a terminal punctuation.
    paragraphsInRange = wordsInRange.filter(word => (word[1].match(/(\?$|\.$|\!$|(\.|\?|\!)\"$)$/) && word[1].length > 3))
                            .map(word => +word[0]);
    // Add the first paragraph
    paragraphsInRange.unshift(0);

    cb(err, {
      showData: {
        number: showData.number, // episode number (Number)
        duration: showData.duration, // in seconds
        hls: showData.hls,
        original_air_date: showData.original_air_date,
        description: showData.description,
        url: showData.url,
        acts: showData.acts,
        title: showData.title
      },
      range:{
        start: startTime,
        end: endTime || showData.duration,
        words: wordsInRange, // times in ms
        paragraphs: paragraphsInRange // start times in ms
      }
    });
  }
}

function decodeHTMLEntities(text) {
  var entities = [
    ['apos', '\''],
    ['amp', '&'],
    ['lt', '<'],
    ['gt', '>'],
    ['quot', '"']
  ];

  for (var i = 0, max = entities.length; i < max; ++i) {
    text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);
  }

  return text;
}
