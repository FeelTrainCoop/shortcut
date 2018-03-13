'use strict';

const allEpisodeData = require('./all-episode-data');

module.exports = function(req, res) {
  const recentEpisodes = (req.query.filter === '0') ? allEpisodeData.getAllEpisodesUnfiltered() : allEpisodeData.getAllEpisodes();
  if (!recentEpisodes) {
    res.status(404).send('episodes have not loaded, try again later');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.status(200);
    res.send(recentEpisodes);
  }
};
