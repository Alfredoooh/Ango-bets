const express = require('express');
const cors = require('cors');
const feedRouter    = require('./routes/feed');
const searchRouter  = require('./routes/search');
const audioRouter   = require('./routes/audio');
const lyricsRouter  = require('./routes/lyrics');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/feed',    feedRouter);
app.use('/api/search',  searchRouter);
app.use('/api/audio',   audioRouter);
app.use('/api/lyrics',  lyricsRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));