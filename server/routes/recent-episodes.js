'use strict';

const allEpisodeData = require('./all-episode-data');
const perPage = 40;

module.exports = function(req, res) {
  const recentEpisodes = allEpisodeData.getAllEpisodes();
  if (!recentEpisodes) {
    res.status(404).send('episodes have not loaded, try again later');
  } else {
    const page = Number(req.query.page) || 0;
    const startIndex = page * perPage;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.status(200);
    res.send(recentEpisodes.slice(startIndex, startIndex + perPage));
  }
};
