// routes/audio.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { spawn } = require('child_process');

const YTDLP_PATH = path.join(__dirname, '..', 'yt-dlp');
const FFMPEG_PATH = require('ffmpeg-static');
const COOKIES_PATH = path.join(__dirname, '..', 'cookies.txt');

// Instâncias públicas Piped (proxy gratuito de YouTube, roda a partir do IP delas).
// Lista pode precisar de atualização de tempos em tempos — instâncias públicas vêm e vão.
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.yt',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi-libre.kavin.rocks',
  'https://pipedapi.drgns.space',
  'https://piped-api.privacy.com.de',
];

const CLIENT_CASCADE = ['android', 'ios', 'tv', 'web_creator'];

function fetchJson(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        clearTimeout(timeout);
        if (!res.ok) {
          reject(new Error(`HTTP ${res.status}`));
          return;
        }
        const data = await res.json();
        resolve(data);
      })
      .catch((err) => {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          reject(new Error('Timeout'));
        } else {
          reject(err);
        }
      });
  });
}

// Busca + extração via Piped: uma instância só resolve as duas etapas de uma vez.
async function tryPipedSearch(query) {
  let lastError = null;
  
  for (const instance of PIPED_INSTANCES) {
    try {
      // 1. Busca o vídeo
      const searchUrl = `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`;
      const searchData = await fetchJson(searchUrl);
      
      const items = Array.isArray(searchData) ? searchData : (searchData.items || []);
      const firstItem = items.find((i) => i.url && i.url.includes('watch?v='));
      if (!firstItem) throw new Error('Nenhum vídeo encontrado nesta instância');
      
      const videoId = firstItem.url.split('watch?v=')[1];
      
      // 2. Pega os streams de áudio desse vídeo
      const streamsUrl = `${instance}/streams/${videoId}`;
      const streamsData = await fetchJson(streamsUrl);
      
      const audioStreams = streamsData.audioStreams || [];
      if (audioStreams.length === 0) throw new Error('Sem streams de áudio nesta instância');
      
      // Pega o de maior bitrate
      const best = audioStreams.reduce((a, b) => ((b.bitrate || 0) > (a.bitrate || 0) ? b : a));
      
      console.log(`[Piped] Sucesso via ${instance} para "${query}"`);
      
      return {
        url: best.url,
        duration: streamsData.duration || firstItem.duration || null,
        sourceTitle: streamsData.title || firstItem.title,
        videoId,
        source: `piped:${instance}`,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[Piped] Instância ${instance} falhou: ${err.message}`);
    }
  }
  
  throw lastError || new Error('Todas as instâncias Piped falharam');
}

// --- Fallback: yt-dlp direto no YouTube, com cascata de player_client ---
function runYtDlp(args, { playerClient = null } = {}) {
  return new Promise((resolve, reject) => {
    const extraArgs = fs.existsSync(COOKIES_PATH) ? ['--cookies', COOKIES_PATH] : [];
    const clientArgs = playerClient ?
      ['--extractor-args', `youtube:player_client=${playerClient}`] :
      [];
    
    const proc = spawn(YTDLP_PATH, [
      ...args,
      ...extraArgs,
      '--ffmpeg-location', FFMPEG_PATH,
      ...clientArgs,
      '--no-check-certificates',
      '--geo-bypass',
      '--socket-timeout', '15',
    ]);
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    
    proc.on('error', (err) => {
      reject(new Error(`Falha ao iniciar yt-dlp: ${err.message}`));
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp saiu com código ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(stdout);
    });
  });
}

function isBotCheckError(message) {
  return /sign in to confirm|not a bot/i.test(message);
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

async function fallbackYtDlp(query) {
  const searchArgs = [
    `ytsearch1:${query}`,
    '--dump-json',
    '--no-playlist',
    '--skip-download',
    '--no-warnings',
  ];
  
  const stdout = await runYtDlpWithClientCascade(searchArgs);
  const line = stdout.trim().split('\n')[0];
  if (!line) throw new Error('Nenhum vídeo encontrado (yt-dlp)');
  
  const info = JSON.parse(line);
  const videoId = info.id;
  
  const urlArgs = [
    `https://www.youtube.com/watch?v=${videoId}`,
    '-f', 'bestaudio[ext=m4a]/bestaudio/best',
    '--get-url',
    '--no-playlist',
    '--no-warnings',
  ];
  
  const urlStdout = await runYtDlpWithClientCascade(urlArgs);
  const url = urlStdout.trim().split('\n')[0];
  if (!url) throw new Error('Sem formatos de áudio disponíveis (yt-dlp)');
  
  return {
    url,
    duration: info.duration || null,
    sourceTitle: info.title,
    videoId,
    source: 'yt-dlp',
  };
}

router.get('/url', async (req, res) => {
  const { track, artist } = req.query;
  if (!track) return res.status(400).json({ error: 'track obrigatório' });
  
  const query = artist ? `${artist} ${track} audio` : `${track} audio`;
  
  // 1ª tentativa: Piped (grátis, IP não é o da Render, evita o bloqueio de bot)
  try {
    const result = await tryPipedSearch(query);
    return res.json({ ...result, type: 'music' });
  } catch (err) {
    console.error('[Audio] Piped falhou totalmente:', err.message);
  }
  
  // 2ª tentativa: yt-dlp direto, cascata de clients
  try {
    const result = await fallbackYtDlp(query);
    return res.json({ ...result, type: 'music' });
  } catch (err) {
    console.error('[Audio] yt-dlp também falhou:', err.message);
    
    return res.status(500).json({
      error: err.message,
      hint: 'Piped e yt-dlp falharam. Instâncias Piped podem estar temporariamente indisponíveis.',
    });
  }
});

module.exports = router;