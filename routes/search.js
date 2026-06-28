const express = require('express');
const router  = express.Router();

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

router.get('/', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ error: 'Query obrigatória' });

  try {
    const [tracks, albums, artists, playlists] = await Promise.allSettled([
      fetchJSON(`https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=50`),
      fetchJSON(`https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=20`),
      fetchJSON(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=20`),
      fetchJSON(`https://api.deezer.com/search/playlist?q=${encodeURIComponent(q)}&limit=20`),
    ]);

    res.json({
      tracks:    tracks.status    === 'fulfilled' ? tracks.value.data    || [] : [],
      albums:    albums.status    === 'fulfilled' ? albums.value.data    || [] : [],
      artists:   artists.status   === 'fulfilled' ? artists.value.data   || [] : [],
      playlists: playlists.status === 'fulfilled' ? playlists.value.data || [] : [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;