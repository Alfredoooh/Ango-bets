// routes/audio.js
const express = require('express');
const router = express.Router();

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

// Procura a faixa no Deezer e devolve a preview de 30s (fonte licenciada oficial)
async function findOnDeezer(track, artist) {
  const q = artist ? `${artist} ${track}` : track;
  const data = await fetchJSON(`https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=1`);
  const hit = data?.data?.[0];
  if (!hit || !hit.preview) return null;
  
  return {
    url: hit.preview,
    sourceTitle: `${hit.title} - ${hit.artist?.name || ''}`.trim(),
    durationSeconds: 30,
    fullDurationSeconds: hit.duration || null,
    type: 'preview',
    source: 'deezer',
  };
}

// Fallback: iTunes Search API, também preview de 30s licenciado
async function findOnItunes(track, artist) {
  const term = artist ? `${artist} ${track}` : track;
  const data = await fetchJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=1`);
  const hit = data?.results?.[0];
  if (!hit || !hit.previewUrl) return null;
  
  return {
    url: hit.previewUrl,
    sourceTitle: `${hit.trackName} - ${hit.artistName}`.trim(),
    durationSeconds: 30,
    fullDurationSeconds: hit.trackTimeMillis ? Math.round(hit.trackTimeMillis / 1000) : null,
    type: 'preview',
    source: 'itunes',
  };
}

router.get('/url', async (req, res) => {
  const { track, artist } = req.query;
  if (!track) return res.status(400).json({ error: 'track obrigatório' });
  
  try {
    let result = await findOnDeezer(track, artist);
    if (!result) result = await findOnItunes(track, artist);
    
    if (!result) {
      return res.status(404).json({
        error: 'Nenhuma prévia encontrada para esta faixa',
      });
    }
    
    return res.json(result);
  } catch (err) {
    console.error('[Audio] Erro:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;