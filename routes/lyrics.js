const express = require('express');
const router  = express.Router();

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Usa lyrics.ovh (gratuito, sem chave)
router.get('/', async (req, res) => {
  const { track, artist } = req.query;
  if (!track || !artist) return res.status(400).json({ error: 'track e artist obrigatórios' });

  try {
    const data = await fetchJSON(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`
    );
    res.json({ lyrics: data.lyrics || null });
  } catch (err) {
    // fallback: tenta chartlyrics
    try {
      const fb = await fetch(
        `http://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist=${encodeURIComponent(artist)}&song=${encodeURIComponent(track)}`
      );
      const text = await fb.text();
      const match = text.match(/<Lyric>([\s\S]*?)<\/Lyric>/);
      const lyrics = match?.[1]?.trim() || null;
      res.json({ lyrics });
    } catch {
      res.json({ lyrics: null });
    }
  }
});

module.exports = router;