// routes/audio.js
const express = require('express');
const { spawn, execFile } = require('child_process');
const router = express.Router();

const YT_DLP_BIN = process.env.YT_DLP_PATH || 'yt-dlp';
const COOKIES_PATH = require('path').join(__dirname, '..', 'cookies.txt');
const fs = require('fs');
const HAS_COOKIES = fs.existsSync(COOKIES_PATH);

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

// Usa Deezer para pegar metadados confiáveis: título oficial, artista, duração real
async function getReferenceMetadata(track, artist) {
  const q = artist ? `${artist} ${track}` : track;
  try {
    const data = await fetchJSON(`https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=1`);
    const hit = data?.data?.[0];
    if (hit) {
      return {
        title: hit.title,
        artist: hit.artist?.name || artist || '',
        durationSeconds: hit.duration || null,
        album: hit.album?.title || null,
        cover: hit.album?.cover_medium || hit.album?.cover_big || null,
      };
    }
  } catch (err) {
    console.warn('[Audio] Deezer metadata falhou:', err.message);
  }
  // fallback: iTunes
  try {
    const term = artist ? `${artist} ${track}` : track;
    const data = await fetchJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=1`);
    const hit = data?.results?.[0];
    if (hit) {
      return {
        title: hit.trackName,
        artist: hit.artistName,
        durationSeconds: hit.trackTimeMillis ? Math.round(hit.trackTimeMillis / 1000) : null,
        album: hit.collectionName || null,
        cover: hit.artworkUrl100?.replace('100x100', '600x600') || null,
      };
    }
  } catch (err) {
    console.warn('[Audio] iTunes metadata falhou:', err.message);
  }
  return { title: track, artist: artist || '', durationSeconds: null, album: null, cover: null };
}

// Roda yt-dlp para pesquisar candidatos no YouTube (flat-playlist = rápido, sem baixar nada)
function ytSearchCandidates(query, limit = 5) {
  return new Promise((resolve, reject) => {
    const args = [
      `ytsearch${limit}:${query}`,
      '--flat-playlist',
      '--print', '%(id)s|||%(title)s|||%(duration)s|||%(channel)s',
      '--no-warnings',
    ];
    if (HAS_COOKIES) args.push('--cookies', COOKIES_PATH);
    
    execFile(YT_DLP_BIN, args, { timeout: 20000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
      if (err) return reject(err);
      const lines = stdout.trim().split('\n').filter(Boolean);
      const items = lines.map(line => {
        const [id, title, duration, channel] = line.split('|||');
        return {
          id,
          title,
          duration: duration && duration !== 'NA' ? parseInt(duration, 10) : null,
          channel,
        };
      });
      resolve(items);
    });
  });
}

// Escolhe o candidato cuja duração mais se aproxima da duração de referência (Deezer/iTunes)
function pickBestCandidate(candidates, referenceDuration) {
  if (!candidates.length) return null;
  if (!referenceDuration) return candidates[0];
  
  let best = candidates[0];
  let bestDiff = Infinity;
  for (const c of candidates) {
    if (!c.duration) continue;
    const diff = Math.abs(c.duration - referenceDuration);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  // Se a diferença for muito grande (> 25s), ainda assim usa o melhor disponível,
  // mas prioriza descartar vídeos claramente errados (>90s de diferença) se houver alternativa melhor
  return best;
}

// Pega a URL direta de áudio de um vídeo específico do YouTube
function getDirectAudioUrl(videoId) {
  return new Promise((resolve, reject) => {
    const args = [
      `https://www.youtube.com/watch?v=${videoId}`,
      '-f', 'bestaudio',
      '--get-url',
      '--no-warnings',
    ];
    if (HAS_COOKIES) args.push('--cookies', COOKIES_PATH);
    
    execFile(YT_DLP_BIN, args, { timeout: 20000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
      if (err) return reject(err);
      const url = stdout.trim().split('\n')[0];
      if (!url) return reject(new Error('yt-dlp não devolveu URL'));
      resolve(url);
    });
  });
}

router.get('/url', async (req, res) => {
  const { track, artist } = req.query;
  if (!track) return res.status(400).json({ error: 'track obrigatório' });
  
  try {
    const meta = await getReferenceMetadata(track, artist);
    const searchQuery = `${meta.artist} ${meta.title} audio`.trim();
    
    const candidates = await ytSearchCandidates(searchQuery, 5);
    if (!candidates.length) {
      return res.status(404).json({ error: 'Nenhum vídeo encontrado no YouTube' });
    }
    
    const chosen = pickBestCandidate(candidates, meta.durationSeconds);
    if (!chosen) {
      return res.status(404).json({ error: 'Nenhum candidato válido' });
    }
    
    return res.json({
      // rota de streaming proxied — ver /stream/:id abaixo
      url: `${req.protocol}://${req.get('host')}/api/audio/stream/${chosen.id}`,
      sourceTitle: `${meta.title} - ${meta.artist}`.trim(),
      durationSeconds: chosen.duration || meta.durationSeconds,
      fullDurationSeconds: meta.durationSeconds,
      album: meta.album,
      cover: meta.cover,
      type: 'full',
      source: 'youtube',
      videoId: chosen.id,
      matchedChannel: chosen.channel,
    });
  } catch (err) {
    console.error('[Audio] Erro:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Faz streaming do áudio completo do YouTube, convertido para mp3 em tempo real
router.get('/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) return res.status(400).json({ error: 'videoId obrigatório' });
  
  try {
    const audioUrl = await getDirectAudioUrl(videoId);
    
    const ffmpegPath = require('ffmpeg-static');
    const ffmpegArgs = [
      '-i', audioUrl,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ab', '128k',
      '-f', 'mp3',
      'pipe:1',
    ];
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    
    const ffmpeg = spawn(ffmpegPath, ffmpegArgs);
    ffmpeg.stdout.pipe(res);
    
    ffmpeg.stderr.on('data', () => {}); // silencia logs verbosos do ffmpeg
    
    ffmpeg.on('error', (err) => {
      console.error('[Stream] ffmpeg erro:', err.message);
      if (!res.headersSent) res.status(500).end();
    });
    
    req.on('close', () => {
      ffmpeg.kill('SIGKILL');
    });
    
  } catch (err) {
    console.error('[Stream] Erro:', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

module.exports = router;