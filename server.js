// server.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Fontes Deezer - géneros/charts variados
const DEEZER_SOURCES = [
  'https://api.deezer.com/chart/0/tracks?limit=100',        // Global top
  'https://api.deezer.com/chart/116/tracks?limit=100',      // Pop
  'https://api.deezer.com/chart/132/tracks?limit=100',      // Hip-Hop
  'https://api.deezer.com/chart/152/tracks?limit=100',      // R&B
  'https://api.deezer.com/chart/113/tracks?limit=100',      // Dance
  'https://api.deezer.com/chart/165/tracks?limit=100',      // Afro
  'https://api.deezer.com/chart/129/tracks?limit=100',      // Rock
  'https://api.deezer.com/chart/144/tracks?limit=100',      // Electronic
];

const DEEZER_ALBUM_SOURCES = [
  'https://api.deezer.com/chart/0/albums?limit=50',
  'https://api.deezer.com/chart/116/albums?limit=50',
  'https://api.deezer.com/chart/132/albums?limit=50',
  'https://api.deezer.com/chart/152/albums?limit=50',
  'https://api.deezer.com/chart/113/albums?limit=50',
  'https://api.deezer.com/chart/165/albums?limit=50',
];

// iTunes top albums por género
const ITUNES_SOURCES = [
  'https://itunes.apple.com/us/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/us/rss/topsongs/limit=50/json',
  'https://itunes.apple.com/gb/rss/topalbums/limit=50/json',
  'https://itunes.apple.com/br/rss/topalbums/limit=50/json',
];

let cache = {
  tracks: [],
  albums: [],
  itunes: [],
  lastFetch: null,
  sourceIndex: 0,
  albumSourceIndex: 0,
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function refreshCache() {
  try {
    const trackUrl = DEEZER_SOURCES[cache.sourceIndex % DEEZER_SOURCES.length];
    const albumUrl = DEEZER_ALBUM_SOURCES[cache.albumSourceIndex % DEEZER_ALBUM_SOURCES.length];
    const itunesUrl = ITUNES_SOURCES[cache.sourceIndex % ITUNES_SOURCES.length];

    const [tracks, albums, itunes] = await Promise.allSettled([
      fetchJSON(trackUrl),
      fetchJSON(albumUrl),
      fetchJSON(itunesUrl),
    ]);

    if (tracks.status === 'fulfilled') cache.tracks = tracks.value.data || [];
    if (albums.status === 'fulfilled') cache.albums = albums.value.data || [];
    if (itunes.status === 'fulfilled') cache.itunes = itunes.value.feed?.entry || [];

    cache.lastFetch = Date.now();
    cache.sourceIndex++;
    cache.albumSourceIndex++;

    console.log(`[${new Date().toISOString()}] Cache atualizado — fonte ${cache.sourceIndex}`);
  } catch (err) {
    console.error('Erro ao atualizar cache:', err.message);
  }
}

// Atualiza imediatamente e depois a cada 1 minuto
refreshCache();
setInterval(refreshCache, 60 * 1000);

// Rotas
app.get('/api/feed', (req, res) => {
  res.json({
    tracks: cache.tracks,
    albums: cache.albums,
    lastFetch: cache.lastFetch,
    source: cache.sourceIndex,
  });
});

app.get('/api/itunes', (req, res) => {
  res.json({ entries: cache.itunes });
});

app.get('/api/deezer/*', async (req, res) => {
  const path = req.params[0];
  const query = new URLSearchParams(req.query).toString();
  const url = `https://api.deezer.com/${path}${query ? '?' + query : ''}`;
  try {
    const data = await fetchJSON(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao contactar Deezer' });
  }
});

app.get('/health', (_, res) => res.json({ ok: true, lastFetch: cache.lastFetch, source: cache.sourceIndex }));

app.listen(PORT, () => console.log(`Proxy a correr na porta ${PORT}`));