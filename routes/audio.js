// routes/audio.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { spawn } = require('child_process');

const YTDLP_PATH = path.join(__dirname, '..', 'yt-dlp');
const FFMPEG_PATH = require('ffmpeg-static');
const COOKIES_PATH = path.join(__dirname, '..', 'cookies.txt');

const CLIENT_CASCADE = ['android', 'ios', 'tv', 'web_creator'];

// Busca o primeiro videoId fazendo scraping direto da página de resultados do YouTube.
async function searchYouTubeHtml(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
    },
  });
  
  if (!res.ok) {
    throw new Error(`Busca HTML falhou: HTTP ${res.status}`);
  }
  
  const html = await res.text();
  
  const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  if (!match) {
    throw new Error('Nenhum videoId encontrado na página de resultados');
  }
  
  const videoId = match[1];
  
  let title = query;
  const titleMatch = html.match(new RegExp(`"videoId":"${videoId}"[^}]*?"title":\\{"runs":\\[\\{"text":"([^"]+)"`));
  if (titleMatch) {
    title = titleMatch[1];
  }
  
  return { videoId, title };
}

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

// Extração de áudio: tenta primeiro formato legado "18" (mp4 360p progressive,
// às vezes escapa da verificação), depois cai para o melhor áudio disponível.
async function getAudioStreamUrl(videoId) {
  const formatsToTry = [
    '18',
    'bestaudio[ext=m4a]/bestaudio/best',
  ];
  
  let lastError = null;
  
  for (const format of formatsToTry) {
    try {
      const args = [
        `https://www.youtube.com/watch?v=${videoId}`,
        '-f', format,
        '--get-url',
        '--no-playlist',
        '--no-warnings',
      ];
      
      const stdout = await runYtDlpWithClientCascade(args);
      const url = stdout.trim().split('\n')[0];
      if (url) return url;
    } catch (err) {
      lastError = err;
      console.warn(`[Audio] Formato ${format} falhou: ${err.message}`);
    }
  }
  
  throw lastError || new Error('Sem formatos de áudio disponíveis');
}

router.get('/url', async (req, res) => {
  const { track, artist } = req.query;
  if (!track) return res.status(400).json({ error: 'track obrigatório' });
  
  const query = artist ? `${artist} ${track} audio` : `${track} audio`;
  
  try {
    const { videoId, title } = await searchYouTubeHtml(query);
    const url = await getAudioStreamUrl(videoId);
    
    return res.json({
      url,
      sourceTitle: title,
      videoId,
      type: 'music',
      source: 'html-scrape',
    });
  } catch (err) {
    console.error('[Audio] Erro:', err.message);
    
    return res.status(500).json({
      error: err.message,
      hint: isBotCheckError(err.message) ?
        'A extração do áudio foi bloqueada mesmo com formato legado e cascata de clients.' :
        undefined,
    });
  }
});

module.exports = router;