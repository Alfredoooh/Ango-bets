// src/music/store/music.js
import { writable } from 'svelte/store';

export const PROXY    = 'https://nexavps00001-test.onrender.com';
export const ACCENT   = '#FC3C44';

// Debug visual (aparece na tela, sem precisar de DevTools)
export const debugLog = writable([]);
function log(msg) {
  const line = `${new Date().toLocaleTimeString()} — ${msg}`;
  console.log(line);
  debugLog.update(l => [...l.slice(-19), line]);
}

// Feed
export const feedTracks    = writable([]);
export const newAlbums     = writable([]);
export const trendTracks   = writable([]);
export const playlists     = writable([]);
export const artists       = writable([]);
export const feedLoading   = writable(true);
export const feedError     = writable(false);

// Player
export const currentTrack  = writable(null);
export const playing       = writable(false);
export const progress      = writable(0);
export const duration      = writable(0);
export const playerOpen    = writable(false);
export const shuffle       = writable(false);
export const repeatMode    = writable(0);
export const queue         = writable([]);
export const liked         = writable(new Set());
export const lyrics        = writable(null);
export const lyricsLoading = writable(false);
export const audioLoading  = writable(false);

// Navigation
export const currentArtist = writable(null);
export const currentPage   = writable('home');
export const searchBarRect = writable(null);

export let audioInstance = null;
let progressTimer        = null;

function setAudio(a) { audioInstance = a; }

export async function loadFeed() {
  feedLoading.set(true);
  feedError.set(false);
  try {
    const res = await fetch(`${PROXY}/api/feed`);
    if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
    const feed = await res.json();

    feedTracks.set(feed.tracks    || []);
    newAlbums.set(feed.albums     || []);
    trendTracks.set((feed.tracks  || []).slice(50));
    playlists.set(feed.playlists  || []);
    artists.set(feed.artists      || []);

    const isEmpty = !(feed.tracks?.length || feed.albums?.length || feed.playlists?.length || feed.artists?.length);
    if (isEmpty) feedError.set(true);

  } catch (err) {
    console.error('[loadFeed]', err);
    feedError.set(true);
  } finally {
    feedLoading.set(false);
  }
}

export async function playTrack(track) {
  log(`playTrack chamado: ${track?.title || 'SEM TITULO'}`);

  if (!track) {
    log('ERRO: track é null/undefined');
    return;
  }

  if (audioInstance) {
    audioInstance.pause();
    audioInstance.src = '';
    clearInterval(progressTimer);
  }

  currentTrack.set(track);
  progress.set(0);
  duration.set(0);
  playing.set(false);
  lyrics.set(null);
  audioLoading.set(true);

  const fetchUrl = `${PROXY}/api/audio/url?track=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist?.name || '')}`;
  log(`fetch: ${fetchUrl}`);

  try {
    const res = await fetch(fetchUrl);
    log(`status HTTP: ${res.status}`);

    if (!res.ok) {
      const errBody = await res.text();
      log(`corpo erro: ${errBody.slice(0, 150)}`);
      throw new Error(`Audio not found (status ${res.status})`);
    }

    const data = await res.json();
    log(`JSON recebido, url presente: ${!!data.url}`);

    const { url } = data;
    if (!url) {
      log('ERRO: resposta sem campo url');
      throw new Error('Resposta sem url de áudio');
    }

    log(`url stream: ${url.slice(0, 60)}...`);

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    setAudio(audio);

    audio.onloadedmetadata = () => {
      log(`metadata OK, duration: ${audio.duration}`);
      duration.set(audio.duration || 0);
      audioLoading.set(false);
    };

    audio.onended = () => {
      playing.set(false);
      progress.set(0);
      let r = 0;
      repeatMode.subscribe(v => r = v)();
      if (r === 2) { audio.currentTime = 0; audio.play(); playing.set(true); }
      else playNext();
    };

    audio.onerror = (e) => {
      const code = audio.error?.code;
      const msgs = { 1:'ABORTED', 2:'NETWORK', 3:'DECODE', 4:'SRC_NOT_SUPPORTED' };
      log(`ERRO no <audio>: código ${code} (${msgs[code] || 'desconhecido'})`);
      audioLoading.set(false);
      playing.set(false);
    };

    await audio.play();
    log('audio.play() executado com sucesso');
    playing.set(true);

    progressTimer = setInterval(() => {
      if (audioInstance) progress.set(audioInstance.currentTime);
    }, 500);

  } catch (err) {
    log(`ERRO CAPTURADO: ${err.message}`);
    audioLoading.set(false);
    playing.set(false);
  }

  fetchLyrics(track);
}

async function fetchLyrics(track) {
  if (!track?.title || !track?.artist?.name) return;
  lyricsLoading.set(true);
  try {
    const res = await fetch(
      `${PROXY}/api/lyrics?track=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist.name)}`
    );
    if (res.ok) {
      const data = await res.json();
      lyrics.set(data.lyrics || null);
    }
  } catch { lyrics.set(null); }
  finally { lyricsLoading.set(false); }
}

export function togglePlay() {
  if (!audioInstance) return;
  playing.update(p => {
    if (p) audioInstance.pause();
    else   audioInstance.play().catch(() => {});
    return !p;
  });
}

export function seekTo(pct) {
  if (!audioInstance) return;
  let d = 0;
  duration.subscribe(v => d = v)();
  audioInstance.currentTime = pct * d;
  progress.set(audioInstance.currentTime);
}

export function stopAll() {
  if (audioInstance) { audioInstance.pause(); audioInstance.src = ''; }
  clearInterval(progressTimer);
  currentTrack.set(null);
  playing.set(false);
  progress.set(0);
  playerOpen.set(false);
  lyrics.set(null);
}

export function toggleLike(id) {
  liked.update(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
}

export function playNext() {
  let q = [], ct = null, sh = false;
  queue.subscribe(v => q = v)();
  currentTrack.subscribe(v => ct = v)();
  shuffle.subscribe(v => sh = v)();
  if (!q.length) return;
  if (sh) { playTrack(q[Math.floor(Math.random() * q.length)]); return; }
  const i = q.findIndex(t => t.id === ct?.id);
  playTrack(q[(i + 1) % q.length]);
}

export function playPrev() {
  let q = [], ct = null;
  queue.subscribe(v => q = v)();
  currentTrack.subscribe(v => ct = v)();
  if (!q.length) return;
  const i = q.findIndex(t => t.id === ct?.id);
  playTrack(q[(i - 1 + q.length) % q.length]);
}

export async function loadArtist(artist) {
  currentArtist.set(null);
  currentPage.set('artist');
  try {
    const res = await fetch(`${PROXY}/api/artist/${artist.id}`);
    if (!res.ok) throw new Error(`Artist HTTP ${res.status}`);
    const data = await res.json();
    currentArtist.set({
      ...artist,
      topTracks: data.topTracks || [],
      albums:    data.albums    || [],
      related:   data.related   || [],
    });
  } catch (err) {
    console.error('[loadArtist]', err);
    currentArtist.set({ ...artist, topTracks: [], albums: [], related: [] });
  }
}