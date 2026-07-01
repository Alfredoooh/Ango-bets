const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { Readable } = require('stream');
const app = express();
const PORT = process.env.PORT || 3000;

const YTDLP_PATH = path.join(__dirname, 'yt-dlp');
const FFMPEG_PATH = require('ffmpeg-static');

app.use(express.static('public'));

const CLIENT_CASCADE = ['android', 'ios', 'tv', 'web_creator'];
const UPSTREAM_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function runYtDlp(args, { playerClient = null } = {}) {
  return new Promise((resolve, reject) => {
    const clientArgs = playerClient
      ? ['--extractor-args', `youtube:player_client=${playerClient}`]
      : [];

    const fullArgs = [
      ...args,
      '--ffmpeg-location', FFMPEG_PATH,
      ...clientArgs,
      '--no-check-certificates',
      '--geo-bypass',
      '--socket-timeout', '15',
    ];

    console.log('[yt-dlp] exec:', YTDLP_PATH, fullArgs.join(' '));

    const proc = spawn(YTDLP_PATH, fullArgs);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      console.error('[yt-dlp] erro ao iniciar processo:', err.message);
      reject(new Error(`Falha ao iniciar yt-dlp: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[yt-dlp] saiu com código', code, 'stderr:', stderr.slice(0, 800));
        reject(new Error(`yt-dlp saiu com código ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(stdout);
    });
  });
}

function isBotCheckError(message) {
  return /sign in to confirm|not a bot|please sign in/i.test(message);
}

async function runYtDlpWithClientCascade(args) {
  let lastError = null;
  for (const client of CLIENT_CASCADE) {
    try {
      return await runYtDlp(args, { playerClient: client });
    } catch (err) {
      lastError = err;
      if (!isBotCheckError(err.message)) throw err;
      console.warn(`[Audio] player_client=${client} bloqueado, tentando próximo...`);
    }
  }
  throw lastError;
}

async function getDirectAudioUrl(videoId) {
  const args = [
    `https://www.youtube.com/watch?v=${videoId}`,
    '-f', '18',
    '--get-url',
    '--no-playlist',
    '--no-warnings',
  ];

  let stdout;
  try {
    stdout = await runYtDlpWithClientCascade(args);
  } catch (err) {
    console.warn('[Extract] Formato 18 falhou, tentando bestaudio:', err.message);
    const fallbackArgs = [
      `https://www.youtube.com/watch?v=${videoId}`,
      '-f', 'bestaudio[ext=m4a]/bestaudio/best',
      '--get-url',
      '--no-playlist',
      '--no-warnings',
    ];
    stdout = await runYtDlpWithClientCascade(fallbackArgs);
  }

  const url = stdout.trim().split('\n')[0];
  if (!url) throw new Error('Nenhuma URL retornada pelo yt-dlp');
  return url;
}

// Endpoint de diagnóstico: confirma se o binário yt-dlp existe e é executável
app.get('/api/health', (req, res) => {
  const exists = fs.existsSync(YTDLP_PATH);
  let executable = false;
  let stat = null;
  if (exists) {
    try {
      fs.accessSync(YTDLP_PATH, fs.constants.X_OK);
      executable = true;
      stat = fs.statSync(YTDLP_PATH);
    } catch (e) {
      executable = false;
    }
  }
  res.json({
    ytdlpPath: YTDLP_PATH,
    ytdlpExists: exists,
    ytdlpExecutable: executable,
    size: stat ? stat.size : null,
    ffmpegPath: FFMPEG_PATH,
    ffmpegExists: fs.existsSync(FFMPEG_PATH),
    nodeVersion: process.version,
  });
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'query obrigatória' });

  try {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    const ytRes = await fetch(url, {
      headers: {
        'User-Agent': UPSTREAM_UA,
        'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
      },
    });

    if (!ytRes.ok) return res.status(502).json({ error: 'YouTube retornou HTTP ' + ytRes.status });

    const html = await ytRes.text();
    const idMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    const seen = new Set();
    const videoIds = [];
    for (const m of idMatches) {
      if (!seen.has(m[1])) { seen.add(m[1]); videoIds.push(m[1]); }
      if (videoIds.length >= 10) break;
    }

    const titleMatches = [...html.matchAll(/"title":\{"runs":\[\{"text":"([^"]+)"\}/g)];

    const results = videoIds.map((id, i) => ({
      videoId: id,
      title: titleMatches[i] ? titleMatches[i][1] : '(título não identificado)',
      thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    }));

    res.json({ results });
  } catch (err) {
    console.error('[Search] Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/extract', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'videoId obrigatório' });

  try {
    const url = await getDirectAudioUrl(videoId);
    res.json({ url, videoId });
  } catch (err) {
    console.error('[Extract] Erro:', err.message);
    res.status(500).json({
      error: err.message,
      isBotCheck: isBotCheckError(err.message),
    });
  }
});

app.get('/api/stream', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'videoId obrigatório' });

  try {
    console.log('[Stream] pedido para videoId:', videoId);
    const directUrl = await getDirectAudioUrl(videoId);
    console.log('[Stream] URL direta obtida, a fazer fetch upstream...');

    const upstreamHeaders = { 'User-Agent': UPSTREAM_UA };
    if (req.headers.range) upstreamHeaders['Range'] = req.headers.range;

    const upstreamRes = await fetch(directUrl, { headers: upstreamHeaders });
    console.log('[Stream] upstream status:', upstreamRes.status);

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      const bodyPreview = await upstreamRes.text().catch(() => '');
      console.error('[Stream] Upstream devolveu', upstreamRes.status, bodyPreview.slice(0, 300));
      return res.status(502).json({ error: 'Falha ao obter stream do YouTube (HTTP ' + upstreamRes.status + ')' });
    }

    res.status(upstreamRes.status);

    const passthroughHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    for (const key of passthroughHeaders) {
      const value = upstreamRes.headers.get(key);
      if (value) res.setHeader(key, value);
    }
    if (!res.getHeader('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
    if (!res.getHeader('content-type')) res.setHeader('Content-Type', 'audio/mp4');

    if (!upstreamRes.body) {
      console.error('[Stream] body vazio do upstream');
      return res.status(502).json({ error: 'Stream vazio do upstream' });
    }

    Readable.fromWeb(upstreamRes.body).pipe(res);

    req.on('close', () => {
      if (upstreamRes.body && typeof upstreamRes.body.cancel === 'function') {
        upstreamRes.body.cancel().catch(() => {});
      }
    });
  } catch (err) {
    console.error('[Stream] Erro:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message, isBotCheck: isBotCheckError(err.message) });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`yt-dlp path: ${YTDLP_PATH}, existe: ${fs.existsSync(YTDLP_PATH)}`);
});