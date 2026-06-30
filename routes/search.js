// routes/search.js
const express = require('express');
const router  = express.Router();

async function fetchJSON(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function fromITunesSong(s) {
  return {
    id: `itunes-${s.trackId}`,
    type: 'track',
    title: s.trackName,
    duration: s.trackTimeMillis ? Math.round(s.trackTimeMillis / 1000) : null,
    preview: s.previewUrl,
    artist: { id: `itunes-artist-${s.artistId}`, name: s.artistName },
    album: { id: `itunes-album-${s.collectionId}`, title: s.collectionName, cover_medium: s.artworkUrl100, cover_big: s.artworkUrl100?.replace('100x100', '600x600') },
    source: 'itunes',
  };
}

router.get('/', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ error: 'Query obrigatória' });

  try {
    const [tracks, albums, artists, playlists, itunesSongs] = await Promise.allSettled([
      fetchJSON(`https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=50`),
      fetchJSON(`https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=20`),
      fetchJSON(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=20`),
      fetchJSON(`https://api.deezer.com/search/playlist?q=${encodeURIComponent(q)}&limit=20`),
      fetchJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=25`),
    ]);

    let trackResults = tracks.status === 'fulfilled' ? (tracks.value.data || []).map(t => ({ ...t, type: 'track', source: 'deezer' })) : [];

    // Se Deezer trouxe poucos resultados, complementa com iTunes
    if (trackResults.length < 10 && itunesSongs.status === 'fulfilled') {
      const extra = (itunesSongs.value.results || []).map(fromITunesSong);
      const existingTitles = new Set(trackResults.map(t => `${t.title}-${t.artist?.name}`.toLowerCase()));
      for (const e of extra) {
        const key = `${e.title}-${e.artist?.name}`.toLowerCase();
        if (!existingTitles.has(key)) trackResults.push(e);
      }
    }

    res.json({
      tracks:    trackResults,
      albums:    albums.status    === 'fulfilled' ? (albums.value.data    || []).map(a => ({ ...a, type: 'album' }))    : [],
      artists:   artists.status   === 'fulfilled' ? (artists.value.data   || []).map(a => ({ ...a, type: 'artist' }))   : [],
      playlists: playlists.status === 'fulfilled' ? (playlists.value.data || []).map(p => ({ ...p, type: 'playlist' })) : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;