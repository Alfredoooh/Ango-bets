// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Escreve o cookies.txt a partir da env var, se existir
if (process.env.YT_COOKIES) {
  const cookiesPath = path.join(__dirname, 'cookies.txt');
  fs.writeFileSync(cookiesPath, process.env.YT_COOKIES, 'utf8');
  console.log('[Cookies] cookies.txt gerado a partir da env var YT_COOKIES');
}

app.use(cors());
app.use(express.json());

app.use('/api/feed', require('./routes/feed'));
app.use('/api/audio', require('./routes/audio'));
app.use('/api/lyrics', require('./routes/lyrics'));
app.use('/api/search', require('./routes/search'));
app.use('/api/artist', require('./routes/artist'));

app.listen(PORT, () => {
  console.log(`Servidor na porta ${PORT}`);
});