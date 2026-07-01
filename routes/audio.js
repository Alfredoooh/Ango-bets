// routes/audio.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { spawn } = require('child_process');

const YTDLP_PATH = path.join(__dirname, '..', 'yt-dlp');
const FFMPEG_PATH = require('ffmpeg-static');
const COOKIES_PATH = path.join(__dirname, '..', 'cookies.txt');

// Clients diferentes do YouTube reagem diferente ao bloqueio anti-bot.
// Tenta cada um em sequência até um funcionar.
const CLIENT_CASCADE = ['android', 'ios', 'tv', 'web_creator'];

function runYtDlp(args, { playerClient = null } = {}) {
  return new Promise((resolve, reject) => {
    const extraArgs = fs.existsSync(COOKIES_PATH) ?
      ['--cookies', COOKIES_PATH] :
      [];

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

// Tenta cada player_client da cascata até um funcionar
async function runYtDlpWithClientCascade(args) {
  let lastError = null;

  for (const client of CLIENT_CASCADE) {
    try {
      return await runYtDlp(args, { playerClient: client });
    } catch (err) {
      lastError = err;
      if (!isBotCheckError(err.message)) {
        throw err; // erro diferente de bot-check, não adianta trocar client
      }
      console.warn(`[Audio] player_client=${client} bloqueado, tentando próximo...`);
    }
  }

  throw lastError;
}

async function searchYouTube(query) {
  const args = [
    `ytsearch1:${query}`,
    '--dump-json',
    '--no-playlist',
    '--skip-download',
    '--no-warnings',
  ];

  const stdout = await runYtDlpWithClientCascade(args);
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

  const stdout = await runYtDlpWithClientCascade(args);
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

    const cookiesConfigured = fs.existsSync(COOKIES_PATH);
    let hint;
    if (isBotCheckError(err.message)) {
      hint = cookiesConfigured
        ? 'Todos os player_clients falharam mesmo com cookies — cookies podem estar expirados.'
        : 'Todos os player_clients falharam.';
    }

    res.status(500).json({ error: err.message, hint });
  }
});

module.exports = router;