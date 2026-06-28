const express = require('express');
const router  = express.Router();
const ytdl    = require('@distube/ytdl-core');
const { exec } = require('child_process');
const util     = require('util');
const execAsync = util.promisify(exec);

// Procura o vídeo no YouTube e retorna só a URL do stream de áudio
async function findYouTubeAudio(query) {
  // usa yt-dlp para pesquisar e extrair URL de áudio (mais estável que ytdl em produção)
  const cmd = `yt-dlp --no-playlist -f bestaudio --get-url "ytsearch1:${query.replace(/"/g, '')}"`;
  const { stdout } = await execAsync(cmd, { timeout: 15000 });
  return stdout.trim();
}

// Retorna URL de áudio do YouTube para uma faixa
router.get('/url', async (req, res) => {
  const { track, artist } = req.query;
  if (!track) return res.status(400).json({ error: 'track obrigatório' });

  const query = artist ? `${artist} - ${track} audio` : `${track} audio`;
  try {
    const url = await findYouTubeAudio(query);
    if (!url) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ url });
  } catch (err) {
    console.error('[Audio] Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Stream direto do áudio (proxy)
router.get('/stream', async (req, res) => {
  const { track, artist } = req.query;
  if (!track) return res.status(400).json({ error: 'track obrigatório' });

  const query = artist ? `${artist} - ${track} audio` : `${track} audio`;
  try {
    const url = await findYouTubeAudio(query);
    if (!url) return res.status(404).json({ error: 'Não encontrado' });

    // Redireciona para a URL de áudio direta
    res.redirect(url);
  } catch (err) {
    console.error('[Audio] Stream erro:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;