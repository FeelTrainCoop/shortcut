'use strict';

const allEpisodeData = require('./all-episode-data');

module.exports = function(req, res) {
  const allEpisodes = allEpisodeData.getAllEpisodes();
  if (!allEpisodes) {
    res.status(404).send('episodes have not loaded, try again later');
  } else {
    const searchTerm = req.query.q;

    const results = findShows(searchTerm, allEpisodes);

    res.send(results);
  }
};

function findShows(searchTerm, episodes) {
  let results = [];
  const regex = new RegExp(`${searchTerm}`, 'i');

  for (let i = 0; i < episodes.length; i++) {
    let contains = false;
    for (let key in episodes[i]) {
      const str = String(episodes[i][key]);
      if (str.match(regex)) {
        contains = true;
      }
    }
    if (contains) {
      results.push(episodes[i]);
    }
  }

  return results;
}
