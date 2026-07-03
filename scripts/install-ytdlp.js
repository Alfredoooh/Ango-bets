// scripts/install-ytdlp.js
// Roda no postinstall: baixa o binário standalone do yt-dlp para dentro do projeto,
// já que o Render não tem yt-dlp pré-instalado no sistema.
const fs = require('fs');
const path = require('path');
const https = require('https');

const BIN_PATH = path.join(__dirname, '..', 'bin', 'yt-dlp');
const DOWNLOAD_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Muitos redirects'));
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location, dest, redirects + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download falhou: HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  const binDir = path.dirname(BIN_PATH);
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
  
  if (fs.existsSync(BIN_PATH)) {
    console.log('[yt-dlp] já existe, pulando download');
    return;
  }
  
  console.log('[yt-dlp] baixando binário standalone...');
  await download(DOWNLOAD_URL, BIN_PATH);
  fs.chmodSync(BIN_PATH, 0o755);
  console.log('[yt-dlp] instalado em', BIN_PATH);
}

main().catch(err => {
  console.error('[yt-dlp] erro na instalação:', err.message);
  // não derruba o build — o servidor ainda sobe, só a extração falhará até resolveres manualmente
});