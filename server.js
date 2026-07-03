// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

if (process.env.YT_COOKIES) {
  const cookiesPath = path.join(__dirname, 'cookies.txt');
  fs.writeFileSync(cookiesPath, process.env.YT_COOKIES, 'utf8');
  console.log('[Cookies] cookies.txt gerado a partir da env var YT_COOKIES');
}

const localYtDlp = path.join(__dirname, 'yt-dlp');
if (fs.existsSync(localYtDlp) && !process.env.YT_DLP_PATH) {
  process.env.YT_DLP_PATH = localYtDlp;
  console.log('[yt-dlp] usando binário local:', localYtDlp);
} else if (!fs.existsSync(localYtDlp)) {
  console.warn('[yt-dlp] AVISO: binário não encontrado em', localYtDlp);
}

app.use(cors());
app.use(express.json());

app.use('/api/feed', require('./routes/feed'));
app.use('/api/audio', require('./routes/audio'));
app.use('/api/lyrics', require('./routes/lyrics'));
app.use('/api/search', require('./routes/search'));
app.use('/api/artist', require('./routes/artist'));
app.use('/api/recognize', require('./routes/recognize'));

app.listen(PORT, () => {
  console.log(`Servidor na porta ${PORT}`);
});