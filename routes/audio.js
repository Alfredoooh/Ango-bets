// routes/audio.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { spawn } = require('child_process');

const YTDLP_PATH = path.join(__dirname, '..', 'yt-dlp');
const FFMPEG_PATH = require('ffmpeg-static');
const COOKIES_PATH = path.join(__dirname, '..', 'cookies.txt');

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const extraArgs = fs.existsSync(COOKIES_PATH) ?
      ['--cookies', COOKIES_PATH] :
      [];
    
    const proc = spawn(YTDLP_PATH, [
      ...args,
      ...extraArgs,
      '--ffmpeg-location', FFMPEG_PATH,
      '--extractor-args', 'youtube:player_client=android',
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

async function searchYouTube(query) {
  const args = [
    `ytsearch1:${query}`,
    '--dump-json',
    '--no-playlist',
    '--skip-download',
    '--no-warnings',
  ];
  
  const stdout = await runYtDlp(args);
  const line = stdout.trim().split('\n')[0];
  if (!line) throw new Error('Nenhum vídeo encontrado');
  
  const info = JSON.parse(line);
  return {
    videoId: info.id,
    title: info.title,
    duration: info.duration || null,
  };
}

async function getAudioStreamUrl(videoId) {
  const args = [
    `https://www.youtube.com/watch?v=${videoId}`,
    '-f', 'bestaudio[ext=m4a]/bestaudio/best',
    '--get-url',
    '--no-playlist',
    '--no-warnings',
  ];
  
  const stdout = await runYtDlp(args);
  const url = stdout.trim().split('\n')[0];
  if (!url) throw new Error('Sem formatos de áudio disponíveis');
  
  return { url };
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
      duration: found.duration,
      sourceTitle: found.title,
      videoId: found.videoId,
      type: 'music',
    });
  } catch (err) {
    console.error('[Audio] Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;