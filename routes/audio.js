const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const ROOT = path.join(__dirname, '..');
const YT_DLP_BIN = process.env.YT_DLP_PATH || path.join(ROOT, 'yt-dlp');
const COOKIES_PATH = path.join(ROOT, 'cookies.txt');
const HAS_COOKIES = fs.existsSync(COOKIES_PATH);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

console.log('[Audio] yt-dlp binário em:', YT_DLP_BIN, '| existe:', fs.existsSync(YT_DLP_BIN));
console.log('[Audio] cookies.txt presente:', HAS_COOKIES);

// cache simples em memória: "titulo|artista" -> resultado completo, evita repesquisar
const urlCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 horas (URLs diretas do YouTube expiram)

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

function baseYtDlpArgs() {
  const args = ['--no-warnings', '--user-agent', USER_AGENT];
  if (HAS_COOKIES) args.push('--cookies', COOKIES_PATH);
  return args;
}

function ytSearchCandidates(query, limit = 5) {
  return new Promise((resolve, reject) => {
    const args = [
      `ytsearch${limit}:${query}`,
      '--flat-playlist',
      '--print', '%(id)s|||%(title)s|||%(duration)s|||%(channel)s',
      ...baseYtDlpArgs(),
    ];

    console.log('[Audio] yt-dlp search:', query);

    execFile(YT_DLP_BIN, args, { timeout: 25000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        const stderrText = stderr || err.message || '';
        console.error('[Audio] yt-dlp search ERRO:', stderrText.slice(0, 800));
        const botDetected = /sign in|not a bot|confirm you/i.test(stderrText);
        const wrapped = new Error(stderrText.slice(0, 500));
        wrapped.botDetected = botDetected;
        return reject(wrapped);
      }
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
      console.log('[Audio] candidatos encontrados:', items.length);
      resolve(items);
    });
  });
}

function pickBestCandidate(candidates, referenceDuration) {
  if (!candidates.length) return null;
  if (!referenceDuration) return candidates[0];
  let best = candidates[0];
  let bestDiff = Infinity;
  for (const c of candidates) {
    if (!c.duration) continue;
    const diff = Math.abs(c.duration - referenceDuration);
    if (diff < bestDiff) { bestDiff = diff; best = c; }
  }
  return best;
}

function getDirectAudioUrl(videoId) {
  return new Promise((resolve, reject) => {
    const args = [
      `https://www.youtube.com/watch?v=${videoId}`,
      '-f', 'bestaudio',
      '--get-url',
      ...baseYtDlpArgs(),
    ];

    console.log('[Audio] extraindo URL direta para videoId:', videoId);

    execFile(YT_DLP_BIN, args, { timeout: 25000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        const stderrText = stderr || err.message || '';
        console.error('[Audio] yt-dlp get-url ERRO:', stderrText.slice(0, 800));
        const botDetected = /sign in|not a bot|confirm you/i.test(stderrText);
        const wrapped = new Error(stderrText.slice(0, 500));
        wrapped.botDetected = botDetected;
        return reject(wrapped);
      }
      const url = stdout.trim().split('\n')[0];
      if (!url) return reject(new Error('yt-dlp não devolveu URL'));
      resolve(url);
    });
  });
}

router.get('/url', async (req, res) => {
  const { track, artist } = req.query;
  if (!track) return res.status(400).json({ error: 'track obrigatório' });

  const cacheKey = `${track}|${artist || ''}`.toLowerCase();
  const cached = urlCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
    console.log('[Audio] cache hit:', cacheKey);
    return res.json(cached.data);
  }

  console.log(`[Audio] /url chamado: track="${track}" artist="${artist}"`);

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

    console.log('[Audio] escolhido:', chosen.id, chosen.title, `(${chosen.duration}s)`);

    // URL direta do YouTube (sem streaming/proxy via ffmpeg).
    // Atenção: esta URL costuma ter IP-lock (só funciona a partir do IP
    // que a pediu) e expira ao fim de algumas horas.
    const directUrl = await getDirectAudioUrl(chosen.id);

    const responseData = {
      url: directUrl,
      sourceTitle: `${meta.title} - ${meta.artist}`.trim(),
      durationSeconds: chosen.duration || meta.durationSeconds,
      fullDurationSeconds: meta.durationSeconds,
      album: meta.album,
      cover: meta.cover,
      type: 'full',
      source: 'youtube',
      videoId: chosen.id,
      matchedChannel: chosen.channel,
    };

    urlCache.set(cacheKey, { data: responseData, ts: Date.now() });

    return res.json(responseData);
  } catch (err) {
    console.error('[Audio] Erro em /url:', err.message);
    return res.status(err.botDetected ? 503 : 500).json({
      error: err.botDetected
        ? 'YouTube bloqueou o servidor (bot detection). Cookies precisam ser atualizados.'
        : err.message,
      botDetected: !!err.botDetected,
    });
  }
});

module.exports = router;