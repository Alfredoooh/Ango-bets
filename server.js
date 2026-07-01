// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'query obrigatória' });
  
  try {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
    
    const ytRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
      },
    });
    
    if (!ytRes.ok) {
      return res.status(502).json({ error: 'YouTube retornou HTTP ' + ytRes.status });
    }
    
    const html = await ytRes.text();
    
    const idMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    const seen = new Set();
    const videoIds = [];
    for (const m of idMatches) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        videoIds.push(m[1]);
      }
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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});