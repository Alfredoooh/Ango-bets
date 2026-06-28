const express  = require('express');
const router   = express.Router();
const { exec } = require('child_process');
const util     = require('util');
const execAsync = util.promisify(exec);

async function getYouTubeAudioUrl(query) {
  const cmd = `yt-dlp --no-playlist -f bestaudio --get-url "ytsearch1:${query.replace(/"/g, '').replace(/'/g, '')}" --no-warnings`;
  const { stdout } = await execAsync(cmd, { timeout: 20000 });
  const lines = stdout.trim().split('\n').filter(Boolean);
  return lines[lines.length - 1];
}

router.get('/url', async (req, res) => {
  const { track, artist } = req.query;
  if (!track) return res.status(400).json({ error: 'track obrigatório' });
  const query = artist ? `${artist} ${track} audio` : `${track} audio`;
  try {
    const url = await getYouTubeAudioUrl(query);
    if (!url) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ url });
  } catch (err) {
    console.error('[Audio] Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;