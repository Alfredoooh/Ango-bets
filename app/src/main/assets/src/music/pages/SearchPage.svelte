<!-- src/music/pages/SearchPage.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { searchBarRect, PROXY } from '../store/music.js';

  export let isDark = false;
  export let bgCard = '#242424';
  export let txtPrim = '#ffffff';
  export let txtSec = '#aaaaaa';
  export let divider = 'rgba(255,255,255,0.07)';
  export let currentTrackExists = false;
  export let onOpenDrawer = () => {};

  const dispatch = createEventDispatcher();
  const HEAD_H = 130;   // altura total reservada no scroll
  const APPBAR_H = 58;  // só a parte do título/appbar que desliza

  const genres = [
    { label: 'Pop',        color: '#FC3C44', img: 'pop-music-concert' },
    { label: 'Hip-Hop',    color: '#5856D6', img: 'hiphop-street' },
    { label: 'R&B',        color: '#FF9500', img: 'rnb-mic' },
    { label: 'Electronic', color: '#007AFF', img: 'electronic-dj' },
    { label: 'Rock',       color: '#34C759', img: 'rock-guitar' },
    { label: 'Afro',       color: '#FF2D55', img: 'afrobeat-drums' },
    { label: 'Jazz',       color: '#AF52DE', img: 'jazz-saxophone' },
    { label: 'Clássica',   color: '#FF6B35', img: 'classical-violin' },
    { label: 'Kizomba',    color: '#E8002D', img: 'kizomba-dance' },
    { label: 'Kuduro',     color: '#FF9F0A', img: 'kuduro-beat' },
    { label: 'Semba',      color: '#00A896', img: 'semba-dance' },
    { label: 'Country',    color: '#B5651D', img: 'country-guitar' },
    { label: 'Reggae',     color: '#009B3A', img: 'reggae-vibes' },
    { label: 'Gospel',     color: '#6A0DAD', img: 'gospel-choir' },
    { label: 'Amapiano',   color: '#F72585', img: 'amapiano-dj' },
    { label: 'Trap',       color: '#3A0CA3', img: 'trap-beats' },
    { label: 'Funk',       color: '#FFB703', img: 'funk-brasil' },
    { label: 'Indie',      color: '#8D99AE', img: 'indie-band' },
    { label: 'Latina',     color: '#EF476F', img: 'latin-dance' },
    { label: 'Soul',       color: '#B08968', img: 'soul-vinyl' },
    { label: 'Ambient',    color: '#219EBC', img: 'ambient-synth' },
    { label: 'Metal',      color: '#495057', img: 'metal-guitar' },
  ];

  function genreImg(seed) {
    return `https://picsum.photos/seed/${seed}/300/300`;
  }

  function openSearch(e) {
    const btn = e.currentTarget;
    searchBarRect.set(btn.getBoundingClientRect());
    dispatch('openSearch');
  }

  // ── Header desliza junto com o scroll, mas só até a appbar sumir ──
  let scrollWrapEl;
  let headOffset = 0; // 0..APPBAR_H

  function handleScroll() {
    if (!scrollWrapEl) return;
    headOffset = Math.min(Math.max(scrollWrapEl.scrollTop, 0), APPBAR_H);
  }

  // ── Recorder ──────────────────────────────────────────────
  let isRecording    = false;
  let showRecOverlay = false;
  let mediaRecorder  = null;
  let audioChunks    = [];
  let waveStream     = null;
  let waveCtx        = null;
  let waveAnalyser   = null;
  let waveSource     = null;
  let waveAnimFrame  = null;
  let recCanvasEl;
  let wavePhase      = 0;
  let recognizing    = false;
  let recognizeError = null;
  let recognizeOk    = false;
  let fileInputEl;

  function stopMicHard() {
    try { mediaRecorder?.stream?.getTracks().forEach(t => t.stop()); } catch (e) {}
    waveStream?.getTracks().forEach(t => t.stop());
    waveStream = null;
    stopWaveAnim();
  }

  async function startRecording() {
    if (isRecording) return;
    recognizeError = null;
    recognizeOk    = false;
    try {
      waveStream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      waveCtx      = new (window.AudioContext || window.webkitAudioContext)();
      waveAnalyser = waveCtx.createAnalyser();
      waveAnalyser.fftSize = 1024;
      waveAnalyser.smoothingTimeConstant = 0.25;
      waveAnalyser.minDecibels = -110;
      waveAnalyser.maxDecibels = -5;
      const gain = waveCtx.createGain();
      gain.gain.value = 6;
      waveSource = waveCtx.createMediaStreamSource(waveStream);
      waveSource.connect(gain);
      gain.connect(waveAnalyser);
      audioChunks   = [];
      mediaRecorder = new MediaRecorder(waveStream);
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.onstop = handleRecStop;
      mediaRecorder.start();
      isRecording    = true;
      showRecOverlay = true;
      startWaveAnim();
    } catch (err) {
      console.error('Mic:', err);
    }
  }

  function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false;
    mediaRecorder.stop();
  }

  function cancelRecording() {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false;
    mediaRecorder.onstop = null;
    mediaRecorder.stop();
    audioChunks    = [];
    showRecOverlay = false;
    stopMicHard();
  }

  function closeOverlay() {
    showRecOverlay = false;
    recognizeError = null;
    recognizeOk    = false;
  }

  function triggerUpload() {
    fileInputEl?.click();
  }

  async function extractAudioFromVideo(file) {
    const videoEl = document.createElement('video');
    videoEl.src = URL.createObjectURL(file);
    videoEl.muted = false;
    videoEl.playsInline = true;
    await new Promise((resolve, reject) => {
      videoEl.onloadedmetadata = resolve;
      videoEl.onerror = () => reject(new Error('Não foi possível ler o vídeo'));
    });

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const sourceNode = ctx.createMediaElementSource(videoEl);
    const dest = ctx.createMediaStreamDestination();
    sourceNode.connect(dest);

    const rec = new MediaRecorder(dest.stream);
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    const done = new Promise(resolve => {
      rec.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm' }));
    });

    rec.start();
    videoEl.play();
    const captureMs = Math.min(15000, (videoEl.duration || 15) * 1000);
    await new Promise(r => setTimeout(r, captureMs));
    rec.stop();
    videoEl.pause();
    URL.revokeObjectURL(videoEl.src);
    ctx.close();

    return done;
  }

  async function sendForRecognition(blob, contentType) {
    showRecOverlay = true;
    recognizing    = true;
    recognizeError = null;
    recognizeOk    = false;

    try {
      const res = await fetch(`${PROXY}/api/recognize`, {
        method:  'POST',
        headers: { 'Content-Type': contentType },
        body:    blob,
      });
      const data = await res.json();
      if (!res.ok || !data.title) throw new Error(data.error || 'Não reconhecido');

      recognizing = false;
      recognizeOk = true;

      const query = data.artist ? `${data.artist} ${data.title}` : data.title;
      setTimeout(() => {
        showRecOverlay = false;
        recognizeOk    = false;
        dispatch('openSearch', { prefillQuery: query });
      }, 550);

    } catch (err) {
      recognizing    = false;
      recognizeError = err.message || 'Não foi possível reconhecer';
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      showRecOverlay = true;
      recognizing    = true;
      recognizeError = null;
      recognizeOk    = false;
      try {
        const audioBlob = await extractAudioFromVideo(file);
        await sendForRecognition(audioBlob, 'audio/webm');
      } catch (err) {
        recognizing    = false;
        recognizeError = 'Não foi possível extrair áudio do vídeo';
      }
    } else {
      await sendForRecognition(file, file.type || 'audio/webm');
    }
  }

  async function handleRecStop() {
    stopMicHard();

    if (!audioChunks.length) { showRecOverlay = false; return; }
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    audioChunks = [];
    await sendForRecognition(blob, 'audio/webm');
  }

  function startWaveAnim() {
    const N = 5;
    const bh = new Array(N).fill(0);
    function frame() {
      if (!recCanvasEl) return;
      waveAnimFrame = requestAnimationFrame(frame);
      const c = recCanvasEl, dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w * dpr || c.height !== h * dpr) { c.width = w * dpr; c.height = h * dpr; }
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      let bands = new Array(N).fill(0.08);
      if (waveAnalyser) {
        const freq = new Uint8Array(waveAnalyser.frequencyBinCount);
        waveAnalyser.getByteFrequencyData(freq);
        const L = freq.length;
        const def = [
          [0, Math.floor(L * .04)],
          [Math.floor(L * .04), Math.floor(L * .10)],
          [Math.floor(L * .10), Math.floor(L * .25)],
          [Math.floor(L * .25), Math.floor(L * .50)],
          [Math.floor(L * .50), Math.floor(L * .80)],
        ];
        bands = def.map(([s, e]) => {
          const sl = [...freq].slice(s, e);
          return Math.pow(sl.reduce((a, b) => a + b, 0) / sl.length / 255, 0.5);
        });
      } else {
        wavePhase += 0.04;
        bands = [0, 1, 2, 3, 4].map(i => 0.06 + Math.abs(Math.sin(wavePhase * 1.2 + i * 0.8)) * 0.18);
      }
      for (let i = 0; i < N; i++) bh[i] += (bands[i] - bh[i]) * (bands[i] > bh[i] ? 0.65 : 0.12);
      const bw = 3.5, gap = 5, tw = N * bw + (N - 1) * gap, sx = (w - tw) / 2, cy = h / 2, mh = h * 0.72;
      for (let i = 0; i < N; i++) {
        const bhi = Math.max(4, bh[i] * mh), x = sx + i * (bw + gap), y = cy - bhi / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bhi, bw / 2);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)';
        ctx.fill();
      }
      wavePhase += 0.02;
    }
    frame();
  }

  function stopWaveAnim() {
    if (waveAnimFrame) { cancelAnimationFrame(waveAnimFrame); waveAnimFrame = null; }
    if (waveSource)    { try { waveSource.disconnect(); } catch (e) {} waveSource = null; }
    if (waveCtx)       { try { waveCtx.close(); }         catch (e) {} waveCtx = null; }
    waveAnalyser = null;
  }
</script>

<div class="page-root">

  <div class="head" style="background:{isDark ? '#121212' : '#ffffff'};transform:translateY(-{headOffset}px);">
    <div class="appbar">
      <button class="icon-btn" on:click={onOpenDrawer}>
        <span class="svg-mask" style="mask-image:url('/icons/svg/menu.svg');-webkit-mask-image:url('/icons/svg/menu.svg');background:{txtPrim};width:20px;height:20px;"></span>
      </button>
      <span class="appbar-title" style="color:{txtPrim}">Pesquisa</span>
    </div>

    <div class="search-wrap">
      <button class="search-bar" style="background:{bgCard}" on:click={openSearch}>
        <span class="svg-mask" style="mask-image:url('/icons/svg/search.svg');-webkit-mask-image:url('/icons/svg/search.svg');background:{txtSec};width:17px;height:17px;"></span>
        <span class="search-placeholder" style="color:{txtSec}">O que queres ouvir?</span>
      </button>
      <button class="rec-trigger" style="background:{bgCard}" on:click={startRecording}>
        <span class="svg-mask" style="mask-image:url('/icons/svg/record.svg');-webkit-mask-image:url('/icons/svg/record.svg');background:{txtSec};width:20px;height:20px;"></span>
      </button>
    </div>
  </div>

  <div class="scroll-wrap" bind:this={scrollWrapEl} on:scroll={handleScroll} style="padding-top:{HEAD_H}px;">
    <div class="page">
      <div class="section-hdr">
        <span class="section-title" style="color:{txtPrim}">Categorias</span>
      </div>
      <div class="genre-grid">
        {#each genres as g}
          <button class="genre-card" style="background:{g.color}" on:click={openSearch}>
            <span class="genre-label">{g.label}</span>
            <div class="genre-poster">
              <img class="genre-img" src={genreImg(g.img)} alt={g.label} loading="lazy" />
            </div>
          </button>
        {/each}
      </div>
    </div>

    <div style="height:{currentTrackExists ? 148 : 88}px"></div>
  </div>
</div>

<input
  bind:this={fileInputEl}
  type="file"
  accept="audio/*,video/*"
  style="display:none"
  on:change={handleFileUpload}
/>

{#if showRecOverlay}
  <div class="rec-overlay" class:dark={isDark}>
    <div class="rec-card" style="background:{isDark ? 'rgba(30,30,32,0.96)' : 'rgba(255,255,255,0.96)'}">

      {#if recognizing}
        <div class="rec-recognizing">
          <div class="spinner" style="border-top-color:{txtPrim}"></div>
          <span class="rec-hint" style="color:{txtSec}">A reconhecer música…</span>
        </div>

      {:else if recognizeOk}
        <div class="rec-recognizing">
          <div class="rec-check-circle">
            <span class="svg-mask" style="mask-image:url('/icons/svg/check.svg');-webkit-mask-image:url('/icons/svg/check.svg');width:20px;height:20px;background:#fff"></span>
          </div>
          <span class="rec-hint" style="color:{txtSec}">Música encontrada</span>
        </div>

      {:else if recognizeError}
        <div class="rec-recognizing">
          <span class="rec-error">{recognizeError}</span>
          <button class="rec-retry-btn" style="color:{txtPrim};background:{isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'}" on:click={closeOverlay}>
            <span class="svg-mask" style="mask-image:url('/icons/svg/close.svg');-webkit-mask-image:url('/icons/svg/close.svg');width:13px;height:13px;background:{txtPrim}"></span>
            Fechar
          </button>
        </div>

      {:else}
        <div class="rec-inner">
          <button class="rec-btn" style="background:{isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'}" on:click={cancelRecording}>
            <span class="svg-mask" style="mask-image:url('/icons/svg/close.svg');-webkit-mask-image:url('/icons/svg/close.svg');width:16px;height:16px;background:{txtPrim}"></span>
          </button>
          <div class="rec-center">
            <canvas bind:this={recCanvasEl} class="rec-canvas"></canvas>
            <div class="rec-dot"></div>
          </div>
          <button class="rec-btn rec-send" style="background:{isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)'}" on:click={stopRecording}>
            <span class="svg-mask" style="mask-image:url('/icons/svg/check.svg');-webkit-mask-image:url('/icons/svg/check.svg');width:16px;height:16px;background:{txtPrim}"></span>
          </button>
        </div>
        <div class="rec-footer">
          <span class="rec-hint" style="color:{txtSec}">A ouvir… toca a música perto do microfone</span>
          <button class="rec-upload-btn" style="color:{txtSec}" on:click={triggerUpload}>
            <span class="svg-mask" style="mask-image:url('/icons/svg/upload.svg');-webkit-mask-image:url('/icons/svg/upload.svg');width:13px;height:13px;background:{txtSec}"></span>
            Enviar áudio ou vídeo
          </button>
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  .page-root { position:relative; height:100%; overflow:hidden; }

  .head {
    position:absolute; top:0; left:0; right:0; z-index:5;
    transition:transform .05s linear;
  }

  .appbar {
    display:flex; align-items:center; gap:10px;
    padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 10px;
  }
  .appbar-title { font-size:22px; font-weight:900; letter-spacing:-.5px; }
  .icon-btn { width:36px; height:36px; border-radius:50%; border:none; background:transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:opacity .15s; flex-shrink:0; }
  .icon-btn:active { opacity:0.5; }

  .scroll-wrap { position:relative; height:100%; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; box-sizing:border-box; }
  .page { padding:0 0 8px; }

  .search-wrap { padding:8px 16px 8px; display:flex; align-items:center; gap:10px; }
  .search-bar {
    flex:1; display:flex; align-items:center; gap:10px;
    border-radius:999px; padding:13px 16px; border:none; cursor:pointer;
    text-align:left; transition:opacity .15s, transform .15s;
  }
  .search-bar:active { opacity:0.7; transform:scale(0.99); }
  .search-placeholder { font-size:16px; font-family:inherit; }

  .rec-trigger {
    width:48px; height:48px; flex-shrink:0;
    border-radius:50%; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:opacity .15s, transform .15s;
  }
  .rec-trigger:active { opacity:0.7; transform:scale(0.93); }

  .svg-mask { display:block; mask-size:contain; -webkit-mask-size:contain; mask-repeat:no-repeat; -webkit-mask-repeat:no-repeat; mask-position:center; -webkit-mask-position:center; flex-shrink:0; }

  .section-hdr { display:flex; align-items:center; justify-content:space-between; padding:16px 16px 10px; }
  .section-title { font-size:20px; font-weight:800; letter-spacing:-.4px; }
  .genre-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:0 16px; }

  .genre-card {
    position:relative; border:none; border-radius:12px; overflow:hidden;
    height:100px; cursor:pointer; padding:0;
    transition:opacity .15s, transform .15s;
  }
  .genre-card:active { opacity:0.88; transform:scale(0.97); }
  .genre-label {
    position:absolute; left:14px; top:14px; z-index:1;
    font-size:16px; font-weight:800; color:#fff; letter-spacing:-.3px;
    max-width:62%;
    text-shadow:0 1px 6px rgba(0,0,0,0.2);
  }
  .genre-poster {
    position:absolute;
    right:-14px; bottom:-16px;
    width:64px; height:64px;
    transform:rotate(22deg);
    border-radius:6px;
    overflow:hidden;
    box-shadow:0 6px 16px rgba(0,0,0,0.35);
  }
  .genre-img { width:100%; height:100%; object-fit:cover; display:block; }

  .rec-overlay {
    position:fixed; inset:0; z-index:150;
    display:flex; align-items:flex-end; justify-content:center;
    padding:0 16px 40px;
    background:rgba(0,0,0,0.30);
    backdrop-filter:blur(4px);
    -webkit-backdrop-filter:blur(4px);
    animation:overlayIn .22s ease both;
  }
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }

  .rec-card {
    width:100%; max-width:480px;
    border-radius:32px;
    padding:14px 14px 16px;
    box-shadow:0 16px 48px rgba(0,0,0,0.30);
    animation:cardIn .28s cubic-bezier(0.2,0.9,0.3,1) both;
    display:flex; flex-direction:column; gap:8px;
  }
  @keyframes cardIn { from{opacity:0;transform:translateY(24px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }

  .rec-inner { display:flex; align-items:center; justify-content:space-between; height:44px; }
  .rec-btn {
    width:38px; height:38px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    border-radius:50%; border:none; cursor:pointer;
    transition:opacity .15s, transform .15s;
  }
  .rec-btn:active { opacity:0.7; transform:scale(0.88); }
  .rec-center { flex:1; display:flex; align-items:center; justify-content:center; gap:10px; position:relative; height:38px; }
  .rec-canvas { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
  .rec-dot { width:6px; height:6px; border-radius:50%; background:#FF3B30; flex-shrink:0; animation:recPulse 1.1s ease-in-out infinite; z-index:1; }
  @keyframes recPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }

  .rec-footer { display:flex; flex-direction:column; align-items:center; gap:6px; padding-top:2px; }
  .rec-hint { font-size:11px; font-weight:500; text-align:center; opacity:0.7; }
  .rec-error { font-size:13px; font-weight:600; color:#FF3B30; text-align:center; }
  .rec-upload-btn {
    display:flex; align-items:center; gap:5px;
    background:none; border:none; cursor:pointer;
    font-size:11px; font-weight:600;
    padding:4px 8px; border-radius:999px;
    transition:opacity .15s;
  }
  .rec-upload-btn:active { opacity:0.6; }
  .rec-retry-btn {
    display:flex; align-items:center; gap:6px;
    border:none; cursor:pointer;
    font-size:12px; font-weight:600;
    padding:8px 16px; border-radius:999px;
    transition:opacity .15s;
  }
  .rec-retry-btn:active { opacity:0.6; }

  .rec-check-circle {
    width:40px; height:40px; border-radius:50%;
    background:#1DB954;
    display:flex; align-items:center; justify-content:center;
  }

  .rec-recognizing { display:flex; flex-direction:column; align-items:center; gap:12px; padding:12px 0; }
  .spinner { width:24px; height:24px; border-radius:50%; border:3px solid rgba(128,128,128,0.2); animation:spin .8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
</style>