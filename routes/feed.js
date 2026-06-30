// routes/feed.js
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
  'https://api.deezer.com/chart/152/playlists?limit=25',
  'https://api.deezer.com/chart/113/playlists?limit=25',
];

const DEEZER_ARTIST_SOURCES = [
  'https://api.deezer.com/chart/0/artists?limit=25',
  'https://api.deezer.com/chart/116/artists?limit=25',
  'https://api.deezer.com/chart/132/artists?limit=25',
  'https://api.deezer.com/chart/152/artists?limit=25',
];

const ITUNES_SOURCES = [
  'https://itunes.apple.com/us/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/gb/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/br/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/pt/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/us/rss/topsongs/limit=50/json',
  'https://itunes.apple.com/br/rss/topsongs/limit=50/json',
];

// Podcasts (iTunes RSS) — usados para enriquecer o feed com conteúdo do tipo "podcast"
const ITUNES_PODCAST_SOURCES = [
  'https://itunes.apple.com/us/rss/toppodcasts/limit=30/json',
  'https://itunes.apple.com/br/rss/toppodcasts/limit=30/json',
  'https://itunes.apple.com/pt/rss/toppodcasts/limit=30/json',
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
  podcasts:  [],
  lastfm:    [],
  lastFetch: null,
  idx: 0,
};

async function fetchJSON(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function normalizeTrack(t) {
  return {
    id: t.id,
    type: 'track',
    title: t.title || t.title_short,
    duration: t.duration,
    preview: t.preview,
    artist: t.artist ? { id: t.artist.id, name: t.artist.name, picture_medium: t.artist.picture_medium } : null,
    album: t.album ? { id: t.album.id, title: t.album.title, cover_medium: t.album.cover_medium, cover_big: t.album.cover_big } : null,
  };
}

function normalizeAlbum(a) {
  return {
    id: a.id,
    type: 'album',
    title: a.title,
    cover_medium: a.cover_medium,
    cover_big: a.cover_big,
    artist: a.artist ? { id: a.artist.id, name: a.artist.name } : null,
    nb_tracks: a.nb_tracks,
  };
}

function normalizePlaylist(p) {
  return {
    id: p.id,
    type: 'playlist',
    title: p.title,
    picture_medium: p.picture_medium,
    picture_small: p.picture_small,
    nb_tracks: p.nb_tracks,
  };
}

function normalizeArtist(ar) {
  return {
    id: ar.id,
    type: 'artist',
    name: ar.name,
    picture_medium: ar.picture_medium,
    picture_small: ar.picture_small,
    nb_fan: ar.nb_fan,
  };
}

function normalizePodcastEntry(e) {
  return {
    id: e.id?.attributes?.['im:id'] || e.id?.label,
    type: 'podcast',
    title: e['im:name']?.label,
    image: e['im:image']?.[e['im:image'].length - 1]?.label,
    artist: e['im:artist'] ? { name: e['im:artist'].label } : null,
  };
}

function dedupeById(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (!item || item.id == null) return true;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

async function refreshCache() {
  const i = cache.idx;
  const results = await Promise.allSettled([
    fetchJSON(DEEZER_TRACK_SOURCES[i    % DEEZER_TRACK_SOURCES.length]),
    fetchJSON(DEEZER_ALBUM_SOURCES[i    % DEEZER_ALBUM_SOURCES.length]),
    fetchJSON(DEEZER_PLAYLIST_SOURCES[i % DEEZER_PLAYLIST_SOURCES.length]),
    fetchJSON(DEEZER_ARTIST_SOURCES[i   % DEEZER_ARTIST_SOURCES.length]),
    fetchJSON(ITUNES_SOURCES[i          % ITUNES_SOURCES.length]),
    fetchJSON(ITUNES_PODCAST_SOURCES[i  % ITUNES_PODCAST_SOURCES.length]),
    LASTFM_KEY ? fetchJSON(LASTFM_SOURCES[i % LASTFM_SOURCES.length]) : Promise.resolve(null),
    // Fontes extras de tracks/albums para diversificar (rotação maior)
    fetchJSON(DEEZER_TRACK_SOURCES[(i+3) % DEEZER_TRACK_SOURCES.length]),
    fetchJSON(DEEZER_ALBUM_SOURCES[(i+3) % DEEZER_ALBUM_SOURCES.length]),
  ]);

  const [
    tracksR, albumsR, playlistsR, artistsR, itunesR, podcastsR, lastfmR, tracksExtraR, albumsExtraR
  ] = results;

  if (tracksR.status === 'fulfilled') {
    const base = (tracksR.value.data || []).map(normalizeTrack);
    const extra = tracksExtraR.status === 'fulfilled' ? (tracksExtraR.value.data || []).map(normalizeTrack) : [];
    cache.tracks = dedupeById([...base, ...extra]);
  }
  if (albumsR.status === 'fulfilled') {
    const base = (albumsR.value.data || []).map(normalizeAlbum);
    const extra = albumsExtraR.status === 'fulfilled' ? (albumsExtraR.value.data || []).map(normalizeAlbum) : [];
    cache.albums = dedupeById([...base, ...extra]);
  }
  if (playlistsR.status === 'fulfilled') {
    cache.playlists = (playlistsR.value.data || []).map(normalizePlaylist);
  }
  if (artistsR.status === 'fulfilled') {
    cache.artists = (artistsR.value.data || []).map(normalizeArtist);
  }
  if (itunesR.status === 'fulfilled') {
    cache.itunes = itunesR.value.feed?.entry || [];
  }
  if (podcastsR.status === 'fulfilled') {
    cache.podcasts = (podcastsR.value.feed?.entry || []).map(normalizePodcastEntry);
  }
  if (lastfmR.status === 'fulfilled' && lastfmR.value) {
    cache.lastfm = lastfmR.value.tracks?.track || [];
  }

  // Loga falhas individuais sem derrubar o cache inteiro
  const labels = ['tracks','albums','playlists','artists','itunes','podcasts','lastfm','tracksExtra','albumsExtra'];
  results.forEach((r, idx) => {
    if (r.status === 'rejected') console.warn(`[Feed] Fonte falhou (${labels[idx]}):`, r.reason?.message || r.reason);
  });

  cache.lastFetch = Date.now();
  cache.idx++;
  console.log(`[Feed] Cache atualizado — rotação ${cache.idx} — tracks:${cache.tracks.length} albums:${cache.albums.length} playlists:${cache.playlists.length} artists:${cache.artists.length} podcasts:${cache.podcasts.length}`);
}

refreshCache();
setInterval(refreshCache, 60 * 1000);

router.get('/', (req, res) => {
  res.json({
    tracks:    cache.tracks,
    albums:    cache.albums,
    playlists: cache.playlists,
    artists:   cache.artists,
    podcasts:  cache.podcasts,
    itunes:    cache.itunes,
    lastfm:    cache.lastfm,
    lastFetch: cache.lastFetch,
    rotation:  cache.idx,
  });
});

module.exports = router;