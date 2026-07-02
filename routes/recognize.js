// routes/recognize.js
const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MB_BASE = 'https://musicbrainz.org/ws/2';
const CAA_BASE = 'https://coverartarchive.org';
const MB_UA = 'MusicApp/1.0 (contact@example.com)';
const FPCALC_PATH = path.join(__dirname, '..', 'fpcalc');

async function fetchJSON(url, headers = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = body?.error?.message || JSON.stringify(body) || `HTTP ${res.status}`;
      throw new Error(detail);
    }
    return body;
  } finally {
    clearTimeout(t);
  }
}

async function fingerprintBuffer(buf, ext) {
  return new Promise((resolve, reject) => {
    const tmp = path.join(os.tmpdir(), `rec_${Date.now()}${ext}`);
    fs.writeFileSync(tmp, buf);
    execFile(FPCALC_PATH, ['-json', tmp], { timeout: 15000 }, (err, stdout) => {
      fs.unlink(tmp, () => {});
      if (err) return reject(err);
      try { resolve(JSON.parse(stdout)); }
      catch (e) { reject(e); }
    });
  });
}

async function lookupAcoustID(duration, fingerprint) {
  const apiKey = 'T8VV7Zzc5h';
  const url = `https://api.acoustid.org/v2/lookup?client=${apiKey}&meta=recordingids+compress&duration=${Math.round(duration)}&fingerprint=${encodeURIComponent(fingerprint)}`;
  const data = await fetchJSON(url);
  if (data.status !== 'ok' || !data.results?.length) return null;
  const best = data.results.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  const mbid = best.recordings?.[0]?.id;
  return mbid ? { mbid, score: best.score } : null;
}

async function lookupMusicBrainz(mbid) {
  const url = `${MB_BASE}/recording/${mbid}?inc=artists+releases+release-groups&fmt=json`;
  return fetchJSON(url, { 'User-Agent': MB_UA });
}

async function getCoverArt(releaseMbid) {
  try {
    const url = `${CAA_BASE}/release/${releaseMbid}`;
    const data = await fetchJSON(url, {}, 5000);
    const front = data.images?.find(i => i.front) || data.images?.[0];
    return front?.thumbnails?.['500'] || front?.thumbnails?.large || front?.image || null;
  } catch {
    return null;
  }
}

router.post('/', async (req, res) => {
  try {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    await new Promise(r => req.on('end', r));
    const buf = Buffer.concat(chunks);
    const ct = req.headers['content-type'] || '';
    const ext = ct.includes('ogg') ? '.ogg' : ct.includes('mp4') ? '.mp4' : '.webm';
    
    let fp;
    try {
      fp = await fingerprintBuffer(buf, ext);
    } catch {
      return res.status(422).json({ error: 'Não foi possível gerar fingerprint. Instala fpcalc (chromaprint).' });
    }
    if (!fp?.fingerprint || !fp?.duration) {
      return res.status(422).json({ error: 'Fingerprint inválido' });
    }
    
    let acoustResult;
    try {
      acoustResult = await lookupAcoustID(fp.duration, fp.fingerprint);
    } catch (e) {
      console.error('[Recognize] AcoustID erro:', e.message);
      return res.status(502).json({ error: `AcoustID: ${e.message}` });
    }
    if (!acoustResult) {
      return res.status(404).json({ error: 'Música não reconhecida' });
    }
    
    let mb;
    try {
      mb = await lookupMusicBrainz(acoustResult.mbid);
    } catch {
      return res.status(502).json({ error: 'Falha ao consultar MusicBrainz' });
    }
    
    const title = mb.title || '';
    const artist = mb['artist-credit']?.[0]?.artist?.name || mb['artist-credit']?.[0]?.name || '';
    const album = mb.releases?.[0]?.title || mb.releases?.[0]?.['release-group']?.title || '';
    const year = mb.releases?.[0]?.date?.slice(0, 4) || mb['first-release-date']?.slice(0, 4) || '';
    const releaseMbid = mb.releases?.[0]?.id || null;
    const recordingMbid = acoustResult.mbid;
    
    const cover = releaseMbid ? await getCoverArt(releaseMbid) : null;
    
    return res.json({
      title,
      artist,
      album,
      year,
      cover,
      score: acoustResult.score,
      mbid: recordingMbid,
    });
  } catch (err) {
    console.error('[Recognize] Erro:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;