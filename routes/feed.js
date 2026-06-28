const express = require('express');
const router  = express.Router();

const DEEZER_TRACK_SOURCES = [
  'https://api.deezer.com/chart/0/tracks?limit=100',
  'https://api.deezer.com/chart/116/tracks?limit=100',
  'https://api.deezer.com/chart/132/tracks?limit=100',
  'https://api.deezer.com/chart/152/tracks?limit=100',
  'https://api.deezer.com/chart/113/tracks?limit=100',
  'https://api.deezer.com/chart/165/tracks?limit=100',
  'https://api.deezer.com/chart/129/tracks?limit=100',
  'https://api.deezer.com/chart/144/tracks?limit=100',
  'https://api.deezer.com/chart/153/tracks?limit=100',
  'https://api.deezer.com/chart/197/tracks?limit=100',
];

const DEEZER_ALBUM_SOURCES = [
  'https://api.deezer.com/chart/0/albums?limit=50',
  'https://api.deezer.com/chart/116/albums?limit=50',
  'https://api.deezer.com/chart/132/albums?limit=50',
  'https://api.deezer.com/chart/152/albums?limit=50',
  'https://api.deezer.com/chart/113/albums?limit=50',
  'https://api.deezer.com/chart/165/albums?limit=50',
  'https://api.deezer.com/chart/129/albums?limit=50',
  'https://api.deezer.com/chart/144/albums?limit=50',
];

const DEEZER_PLAYLIST_SOURCES = [
  'https://api.deezer.com/chart/0/playlists?limit=25',
  'https://api.deezer.com/chart/116/playlists?limit=25',
  'https://api.deezer.com/chart/132/playlists?limit=25',
];

const DEEZER_ARTIST_SOURCES = [
  'https://api.deezer.com/chart/0/artists?limit=25',
  'https://api.deezer.com/chart/116/artists?limit=25',
  'https://api.deezer.com/chart/132/artists?limit=25',
];

const ITUNES_SOURCES = [
  'https://itunes.apple.com/us/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/gb/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/br/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/pt/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/us/rss/topsongs/limit=50/json',
  'https://itunes.apple.com/br/rss/topsongs/limit=50/json',
];

const LASTFM_KEY = process.env.LASTFM_KEY || '';
const LASTFM_SOURCES = [
  `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${LASTFM_KEY}&format=json&limit=100`,
  `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${LASTFM_KEY}&format=json&limit=50`,
];

let cache = {
  tracks:    [],
  albums:    [],
  playlists: [],
  artists:   [],
  itunes:    [],
  lastfm:    [],
  lastFetch: null,
  idx: 0,
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function refreshCache() {
  const i = cache.idx;
  try {
    const results = await Promise.allSettled([
      fetchJSON(DEEZER_TRACK_SOURCES[i    % DEEZER_TRACK_SOURCES.length]),
      fetchJSON(DEEZER_ALBUM_SOURCES[i    % DEEZER_ALBUM_SOURCES.length]),
      fetchJSON(DEEZER_PLAYLIST_SOURCES[i % DEEZER_PLAYLIST_SOURCES.length]),
      fetchJSON(DEEZER_ARTIST_SOURCES[i   % DEEZER_ARTIST_SOURCES.length]),
      fetchJSON(ITUNES_SOURCES[i          % ITUNES_SOURCES.length]),
      LASTFM_KEY ? fetchJSON(LASTFM_SOURCES[i % LASTFM_SOURCES.length]) : Promise.resolve(null),
    ]);

    if (results[0].status === 'fulfilled') cache.tracks    = results[0].value.data || [];
    if (results[1].status === 'fulfilled') cache.albums    = results[1].value.data || [];
    if (results[2].status === 'fulfilled') cache.playlists = results[2].value.data || [];
    if (results[3].status === 'fulfilled') cache.artists   = results[3].value.data || [];
    if (results[4].status === 'fulfilled') cache.itunes    = results[4].value.feed?.entry || [];
    if (results[5].status === 'fulfilled' && results[5].value) {
      cache.lastfm = results[5].value.tracks?.track || [];
    }

    cache.lastFetch = Date.now();
    cache.idx++;
    console.log(`[Feed] Cache atualizado — rotação ${cache.idx}`);
  } catch (err) {
    console.error('[Feed] Erro:', err.message);
  }
}

refreshCache();
setInterval(refreshCache, 60 * 1000);

router.get('/', (req, res) => {
  res.json({
    tracks:    cache.tracks,
    albums:    cache.albums,
    playlists: cache.playlists,
    artists:   cache.artists,
    itunes:    cache.itunes,
    lastfm:    cache.lastfm,
    lastFetch: cache.lastFetch,
    rotation:  cache.idx,
  });
});

module.exports = router;