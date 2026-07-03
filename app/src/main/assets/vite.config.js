import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { cpSync, mkdirSync, existsSync } from 'fs';

// nome da pasta no disco -> nome da rota final em dist/
const apps = [
  { dir: 'auth', route: 'auth' },
  { dir: 'home', route: 'home' },
  { dir: 'ai', route: 'ai' },
  { dir: 'music', route: 'music' },
  { dir: 'games', route: 'games' },
  { dir: 'media', route: 'media' },
  { dir: 'profilelens', route: 'profilelens' },
  { dir: 'downloader', route: 'downloader' },
];

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'post-build-copy',
      closeBundle() {
        const dist = resolve(__dirname, 'dist');
        for (const { dir, route } of apps) {
          const src = resolve(dist, 'src', dir, 'index.html');
          const dest = resolve(dist, route, 'index.html');
          if (existsSync(src)) {
            mkdirSync(resolve(dist, route), { recursive: true });
            cpSync(src, dest);
            console.log(`✓ dist/${route}/index.html`);
          } else {
            console.warn(`⚠ não encontrado: dist/src/${dir}/index.html`);
          }
        }
      }
    }
  ],
  publicDir: 'static',
  resolve: {
    alias: {
      '$shared': resolve(__dirname, 'src/shared'),
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        auth: resolve(__dirname, 'src/auth/index.html'),
        home: resolve(__dirname, 'src/home/index.html'),
        ai: resolve(__dirname, 'src/ai/index.html'),
        music: resolve(__dirname, 'src/music/index.html'),
        games: resolve(__dirname, 'src/games/index.html'),
        media: resolve(__dirname, 'src/media/index.html'),
        profilelens: resolve(__dirname, 'src/profilelens/index.html'),
        downloader: resolve(__dirname, 'src/downloader/index.html'),
      }
    }
  }
});