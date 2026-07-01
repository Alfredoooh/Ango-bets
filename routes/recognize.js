// routes/recognize.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const chromaprint = require('chromaprint');

const MB_BASE = 'https://musicbrainz.org/ws/2';
const CAA_BASE = 'https://coverartarchive.org';
const MB_UA = 'MusicApp/1.0 (contact@example.com)';
const SAMPLE_RATE = 11025;

async function fetchJSON(url, headers = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function decodeToPCM(inputPath) {
  return new Promise((resolve, reject) => {
    const outPath = inputPath + '.pcm';
    execFile(
      ffmpegPath,
      ['-y', '-i', inputPath, '-f', 's16le', '-ac', '1', '-ar', String(SAMPLE_RATE), outPath],
      { timeout: 15000 },
      (err) => {
        if (err) return reject(err);
        fs.readFile(outPath, (err2, data) => {
          fs.unlink(outPath, () => {});
          if (err2) return reject(err2);
          resolve(data);
        });
      }
    );
  });
}

function pcmBufferToStream(pcmBuf) {
  const int16 = new Int16Array(
    pcmBuf.buffer,
    pcmBuf.byteOffset,
    pcmBuf.length / 2
  );
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return {
    sampleRate: SAMPLE_RATE,
    channels: 1,
    data: float32,
  };
}

async function fingerprintBuffer(buf, ext) {
  const tmp = path.join(os.tmpdir(), `rec_${Date.now()}${ext}`);
  fs.writeFileSync(tmp, buf);
  try {
    const pcmBuf = await decodeToPCM(tmp);
    const stream = pcmBufferToStream(pcmBuf);
    const duration = stream.data.length / SAMPLE_RATE;

    const fingerprint = await new Promise((resolve, reject) => {
      chromaprint.calculateFingerprint(stream, (err, fp) => {
        if (err) return reject(err);
        resolve(fp);
      });
    });

    return { fingerprint, duration };
  } finally {
    fs.unlink(tmp, () => {});
  }
}

async function lookupAcoustID(duration, fingerprint) {
  const apiKey = 'COveVaNrFZ';
  const url = `https://api.acoustid.org/v2/lookup?client=${apiKey}&meta=recordingids+compress&duration=${Math.round(duration)}&fingerprint=${fingerprint}`;
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
    } catch (e) {
      console.error('[Recognize] Fingerprint error:', e.message);
      return res.status(422).json({ error: 'Não foi possível gerar fingerprint.' });
    }
    if (!fp?.fingerprint || !fp?.duration) {
      return res.status(422).json({ error: 'Fingerprint inválido' });
    }

    const acoustResult = await lookupAcoustID(fp.duration, fp.fingerprint);
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