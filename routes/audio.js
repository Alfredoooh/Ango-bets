// routes/audio.js
const express = require('express');
const router  = express.Router();
const ytdl    = require('@distube/ytdl-core');

// Busca no YouTube sem precisar de API key, usando a busca pública (HTML) do youtube.com
async function searchYouTube(query) {
  const url = `https://www.youtube.com/results?search_type=video&search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();

  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!match) throw new Error('Não foi possível ler resultados do YouTube');

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    throw new Error('Falha ao parsear resultados do YouTube');
  }

  const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
    ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

  for (const item of contents) {
    const vr = item.videoRenderer;
    if (vr?.videoId) {
      return {
        videoId: vr.videoId,
        title: vr.title?.runs?.[0]?.text || '',
        durationText: vr.lengthText?.simpleText || null,
      };
    }
  }
  throw new Error('Nenhum vídeo encontrado');
}

async function getAudioStreamUrl(videoId) {
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
  const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
  if (!audioFormats.length) throw new Error('Sem formatos de áudio disponíveis');

  // Prioriza maior bitrate de áudio disponível
  audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
  return {
    url: audioFormats[0].url,
    duration: parseInt(info.videoDetails.lengthSeconds, 10) || null,
    title: info.videoDetails.title,
  };
}

router.get('/url', async (req, res) => {
  const { track, artist } = req.query;
  if (!track) return res.status(400).json({ error: 'track obrigatório' });

  const query = artist ? `${artist} ${track} audio` : `${track} audio`;

  try {
    const found = await searchYouTube(query);
    const stream = await getAudioStreamUrl(found.videoId);

    res.json({
      url: stream.url,
      duration: stream.duration,
      sourceTitle: stream.title,
      videoId: found.videoId,
      type: 'music',
    });
  } catch (err) {
    console.error('[Audio] Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;