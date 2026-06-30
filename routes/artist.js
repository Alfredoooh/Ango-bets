// routes/artist.js
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

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'id obrigatório' });

  try {
    const [topR, albumsR, relatedR] = await Promise.allSettled([
      fetchJSON(`https://api.deezer.com/artist/${id}/top?limit=10`),
      fetchJSON(`https://api.deezer.com/artist/${id}/albums?limit=20`),
      fetchJSON(`https://api.deezer.com/artist/${id}/related?limit=10`),
    ]);

    res.json({
      topTracks: topR.status     === 'fulfilled' ? (topR.value.data     || []) : [],
      albums:    albumsR.status  === 'fulfilled' ? (albumsR.value.data  || []) : [],
      related:   relatedR.status === 'fulfilled' ? (relatedR.value.data || []) : [],
    });
  } catch (err) {
    console.error('[Artist] Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;