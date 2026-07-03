<!-- src/music/components/FullPlayer.svelte -->
<script>
  import {
    currentTrack, playing, progress, duration, playerOpen,
    shuffle, repeatMode, liked, audioLoading,
    togglePlay, seekTo, toggleLike, playNext, playPrev,
    lyrics, lyricsLoading
  } from '../store/music.js';
  import { tick } from 'svelte';

  let tab = 'player';
  const tabOrder = ['player', 'lyrics'];
  let visible = false;
  let entered = false;

  let dragY = 0;
  let dragging = false;
  let dragStartY = 0;

  let tabDragging = false;
  let tabDragStartX = 0;
  let tabDragDeltaX = 0;

  $: pct = $duration > 0 ? ($progress / $duration) * 100 : 0;
  $: coverUrl = $currentTrack?.album?.cover_big || $currentTrack?.album?.cover_medium || null;

  let dominantColor = '#1a1a2e';
  let imgEl;

  function extractColor() {
    if (!imgEl || !imgEl.complete || !imgEl.naturalWidth) return;
    try {
      const canvas = document.createElement('canvas');
      const size = 24;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 200) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      if (!count) return;
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      const darken = 0.55;
      r = Math.round(r * darken);
      g = Math.round(g * darken);
      b = Math.round(b * darken);

      dominantColor = `rgb(${r},${g},${b})`;
    } catch {
      // canvas pode falhar por CORS — mantém fallback
    }
  }

  $: if (coverUrl) {
    dominantColor = '#1a1a2e';
  }

  let closeTimer = null;

  $: if ($playerOpen) {
    openSheet();
  } else {
    closeSheet();
  }

  async function openSheet() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (!visible) {
      visible = true;
      entered = false;
      dragY = 0;
      await tick();
      requestAnimationFrame(() => {
        entered = true;
      });
    } else {
      dragY = 0;
      entered = true;
    }
  }

  function closeSheet() {
    if (!visible) return;
    entered = false;
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      visible = false;
      dragY = 0;
      closeTimer = null;
    }, 380);
  }

  function handleClose() {
    playerOpen.set(false);
  }

  function onDragStart(e) {
    dragging = true;
    dragStartY = (e.touches ? e.touches[0].clientY : e.clientY);
  }

  function onDragMove(e) {
    if (!dragging) return;
    const y = (e.touches ? e.touches[0].clientY : e.clientY);
    const delta = y - dragStartY;
    dragY = Math.max(0, delta);
  }

  function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    if (dragY > 110) {
      entered = false;
      handleClose();
    } else {
      dragY = 0;
    }
  }

  function handleSeek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - rect.left) / rect.width);
  }

  function onTabDragStart(e) {
    tabDragging = true;
    tabDragStartX = (e.touches ? e.touches[0].clientX : e.clientX);
    tabDragDeltaX = 0;
  }

  function onTabDragMove(e) {
    if (!tabDragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    tabDragDeltaX = x - tabDragStartX;
  }

  function onTabDragEnd() {
    if (!tabDragging) return;
    tabDragging = false;
    const threshold = 60;
    const idx = tabOrder.indexOf(tab);
    if (tabDragDeltaX < -threshold && idx < tabOrder.length - 1) {
      tab = tabOrder[idx + 1];
    } else if (tabDragDeltaX > threshold && idx > 0) {
      tab = tabOrder[idx - 1];
    }
    tabDragDeltaX = 0;
  }

  function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function icon(name) {
    return `mask-image:url('/icons/svg/${name}.svg');-webkit-mask-image:url('/icons/svg/${name}.svg');`;
  }

  const platforms = [
    {
      name: 'spotify',
      label: 'Spotify',
      color: '#1DB954',
      logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/spotify.svg',
      url: (query) => `https://open.spotify.com/search/${encodeURIComponent(query)}`
    },
    {
      name: 'apple_music',
      label: 'Apple Music',
      color: '#FA243C',
      logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/applemusic.svg',
      url: (query) => `https://music.apple.com/us/search?term=${encodeURIComponent(query)}`
    },
    {
      name: 'youtube_music',
      label: 'YouTube Music',
      color: '#FF0000',
      logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/youtubemusic.svg',
      url: (query) => `https://music.youtube.com/search?q=${encodeURIComponent(query)}`
    },
  ];

  function buildSearchQuery() {
    const title = $currentTrack?.title || '';
    const artist = $currentTrack?.artist?.name || '';
    return `${artist} ${title}`.trim();
  }

  function openPlatform(p) {
    const query = buildSearchQuery();
    if (!query) return;

    const url = p.url(query);

    try {
      window.location.href = url;
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
</script>

{#if visible && $currentTrack}
  <div
    class="scrim"
    class:show={entered}
    on:click={handleClose}
  ></div>

  <div
    class="screen"
    class:dragging
    style="
      background:{dominantColor};
      transform:translateY({dragging ? dragY : (entered ? 0 : '100%')}{dragging ? 'px' : ''});
    "
  >
    {#if coverUrl}
      <img
        bind:this={imgEl}
        src={coverUrl}
        alt=""
        crossorigin="anonymous"
        class="hidden-sampler"
        on:load={extractColor}
      />
    {/if}

    <div class="bg-overlay"></div>

    <div
      class="drag-handle-zone"
      on:touchstart={onDragStart}
      on:touchmove={onDragMove}
      on:touchend={onDragEnd}
      on:touchcancel={onDragEnd}
    >
      <div class="drag-handle"></div>
    </div>

    <div
      class="header"
      on:touchstart={onDragStart}
      on:touchmove={onDragMove}
      on:touchend={onDragEnd}
      on:touchcancel={onDragEnd}
    >
      <button class="icon-btn" on:click={handleClose} aria-label="Fechar">
        <span class="icon-mask" style="{icon('chevron_right')}background:#fff;width:20px;height:20px;transform:rotate(90deg);"></span>
      </button>
      <div class="header-center">
        <span class="header-label">A reproduzir agora</span>
      </div>
      <button class="icon-btn">
        <span class="icon-mask" style="{icon('more_vertical')}background:rgba(255,255,255,0.8);width:18px;height:18px;"></span>
      </button>
    </div>

    <div class="tabs-pill-wrap">
      <div class="tabs-pill">
        {#each [['player','Tocando'],['lyrics','Letra']] as [id,label]}
          <button
            class="tab-pill-btn"
            class:active={tab===id}
            on:click={() => tab=id}
          >{label}</button>
        {/each}
      </div>
    </div>

    <div
      class="tab-swipe-area"
      on:touchstart={onTabDragStart}
      on:touchmove={onTabDragMove}
      on:touchend={onTabDragEnd}
    >
      {#if tab === 'player'}

        <div class="cover-wrap">
          {#if coverUrl}
            <div class="disc-wrap" class:spin={$playing}>
              <img src={coverUrl} alt={$currentTrack.title} class="cover" class:pop={entered} />
              <div class="disc-hole"></div>
            </div>
          {:else}
            <div class="disc-wrap">
              <div class="cover no-cover">
                <span class="icon-mask" style="{icon('playlist_music')}background:rgba(255,255,255,0.3);width:64px;height:64px;"></span>
              </div>
              <div class="disc-hole"></div>
            </div>
          {/if}
        </div>

        <div class="info-row">
          <div class="info">
            <span class="track-title">{$currentTrack.title}</span>
            <span class="track-artist">{$currentTrack.artist?.name}</span>
          </div>
          <button class="icon-btn" on:click={() => toggleLike($currentTrack.id)}>
            {#if $liked.has($currentTrack.id)}
              <span class="icon-mask" style="{icon('bookmark_filled')}background:#FC3C44;width:22px;height:22px;"></span>
            {:else}
              <span class="icon-mask" style="{icon('bookmark')}background:rgba(255,255,255,0.7);width:22px;height:22px;"></span>
            {/if}
          </button>
        </div>

        <div class="platforms-row">
          <span class="platforms-label" style="color:rgba(255,255,255,0.4)">Abrir na app</span>
          <div class="platforms-icons">
            {#each platforms as p}
              <button class="platform-btn" style="background:{p.color}" aria-label={p.label} on:click={() => openPlatform(p)}>
                <img class="platform-logo" src={p.logo} alt={p.label} />
              </button>
            {/each}
          </div>
        </div>

        <div class="progress-wrap">
          <button class="progress-track" on:click={handleSeek}>
            <div class="progress-fill" style="width:{pct}%"></div>
            <div class="progress-thumb" style="left:{pct}%"></div>
          </button>
          <div class="times">
            <span>{fmtTime($progress)}</span>
            {#if $audioLoading}
              <span style="color:rgba(255,255,255,0.4);font-size:11px">A carregar…</span>
            {:else}
              <span>{fmtTime($duration)}</span>
            {/if}
          </div>
        </div>

        <div class="controls">
          <button class="ctrl-sm" on:click={() => shuffle.update(s => !s)}>
            <span class="icon-mask" style="{icon('random')}background:{$shuffle?'#FC3C44':'rgba(255,255,255,0.5)'};width:20px;height:20px;"></span>
          </button>
          <button class="ctrl-md" on:click={playPrev}>
            <span class="icon-mask" style="{icon('backward')}background:#fff;width:30px;height:30px;"></span>
          </button>
          <button class="play-btn" on:click={togglePlay} disabled={$audioLoading}>
            {#if $audioLoading}
              <div class="play-spinner"></div>
            {:else if $playing}
              <span class="icon-mask" style="{icon('pause')}background:#1c1c1e;width:26px;height:26px;"></span>
            {:else}
              <span class="icon-mask play-icon" style="{icon('play')}background:#1c1c1e;width:26px;height:26px;"></span>
            {/if}
          </button>
          <button class="ctrl-md" on:click={playNext}>
            <span class="icon-mask" style="{icon('forward')}background:#fff;width:30px;height:30px;"></span>
          </button>
          <button class="ctrl-sm" on:click={() => repeatMode.update(r => (r+1)%3)}>
            {#if $repeatMode === 2}
              <span class="icon-mask" style="{icon('repeat_1')}background:#FC3C44;width:20px;height:20px;"></span>
            {:else}
              <span class="icon-mask" style="{icon('repeat')}background:{$repeatMode===1?'#FC3C44':'rgba(255,255,255,0.5)'};width:20px;height:20px;"></span>
            {/if}
          </button>
        </div>

        <div class="actions">
          <button class="action-btn">
            <span class="icon-mask" style="{icon('share')}background:rgba(255,255,255,0.6);width:20px;height:20px;"></span>
            <span style="color:rgba(255,255,255,0.5);font-size:11px">Partilhar</span>
          </button>
          <button class="action-btn">
            <span class="icon-mask" style="{icon('playlist_music')}background:rgba(255,255,255,0.6);width:20px;height:20px;"></span>
            <span style="color:rgba(255,255,255,0.5);font-size:11px">Playlist</span>
          </button>
        </div>

      {:else if tab === 'lyrics'}
        <div class="lyrics-wrap">
          {#if $lyricsLoading}
            <div class="lyrics-center"><div class="lyrics-spinner"></div></div>
          {:else if $lyrics}
            <p class="lyrics-text">{$lyrics}</p>
          {:else}
            <div class="lyrics-center">
              <span class="icon-mask" style="{icon('meassage')}background:rgba(255,255,255,0.2);width:40px;height:40px;"></span>
              <span class="lyrics-empty">Letra não disponível</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .scrim {
    position:fixed;inset:0;z-index:199;
    background:rgba(0,0,0,0);
    opacity:0;
    transition:opacity .38s cubic-bezier(.32,.72,0,1), background .38s cubic-bezier(.32,.72,0,1);
    pointer-events:none;
  }
  .scrim.show {
    background:rgba(0,0,0,0.5);
    opacity:1;
    pointer-events:auto;
  }

  .screen {
    position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;
    padding:calc(env(safe-area-inset-top,0px) + 6px) 20px calc(env(safe-area-inset-bottom,0px) + 20px);
    overflow:hidden;
    transition:transform .38s cubic-bezier(.32,.72,0,1), background .4s ease;
    will-change:transform;
  }
  .screen.dragging {
    transition:none;
  }

  .drag-handle-zone {
    flex-shrink:0;
    padding:2px 0 10px;
    margin:0 -20px;
    display:flex;
    justify-content:center;
    touch-action:none;
  }
  .drag-handle {
    width:36px;height:4px;border-radius:999px;
    background:rgba(255,255,255,0.35);
  }

  .hidden-sampler { position:absolute;width:1px;height:1px;opacity:0;pointer-events:none; }

  .bg-overlay {
    position:absolute;inset:0;z-index:0;
    background:linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 100%);
  }

  .header,.tabs-pill-wrap,.tab-swipe-area,.cover-wrap,.info-row,.progress-wrap,.controls,.actions,.lyrics-wrap,.queue-wrap,.platforms-row {
    position:relative;z-index:1;
  }

  .header {
    display:flex;align-items:center;justify-content:space-between;
    margin-bottom:12px;touch-action:none;
  }
  .header-center { flex:1;text-align:center; }
  .header-label {
    font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);
    text-transform:uppercase;letter-spacing:.04em;
  }

  .tabs-pill-wrap { display:flex;justify-content:center;margin-bottom:20px; }
  .tabs-pill {
    display:inline-flex;
    background:rgba(255,255,255,0.1);
    border-radius:999px;
    padding:3px;
    gap:2px;
  }
  .tab-pill-btn {
    border:none;
    background:transparent;
    border-radius:999px;
    padding:7px 20px;
    font-size:13px;
    font-weight:600;
    font-family:inherit;
    color:rgba(255,255,255,0.55);
    cursor:pointer;
    transition:background .25s cubic-bezier(.4,0,.2,1), color .25s ease;
  }
  .tab-pill-btn.active {
    background:rgba(255,255,255,0.95);
    color:#1c1c1e;
  }

  .tab-swipe-area {
    flex:1;
    display:flex;
    flex-direction:column;
    min-height:0;
    touch-action:pan-y;
  }

  .cover-wrap {
    flex:1;
    display:flex;
    align-items:center;
    justify-content:center;
    margin-bottom:16px;
  }

  .disc-wrap {
    position:relative;
    width:min(72vw,300px);
    height:min(72vw,300px);
    border-radius:50%;
    transform:scale(0.92);
    opacity:0;
    transition:transform .42s cubic-bezier(.2,.7,.3,1) .06s, opacity .42s ease .06s;
  }
  .cover-wrap :global(.disc-wrap.spin) {
    animation:disc-spin 18s linear infinite;
  }

  .cover {
    width:100%;
    height:100%;
    border-radius:50%;
    object-fit:cover;
    display:block;
    box-shadow:0 32px 80px rgba(0,0,0,0.6);
  }
  .no-cover {
    width:100%;
    height:100%;
    border-radius:50%;
    background:rgba(255,255,255,0.08);
    display:flex;
    align-items:center;
    justify-content:center;
  }

  .disc-hole {
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    width:14%;
    height:14%;
    border-radius:50%;
    background:#0a0a0a;
    box-shadow:0 0 0 2px rgba(255,255,255,0.15) inset;
  }

  @keyframes disc-spin {
    from { transform:rotate(0deg); }
    to { transform:rotate(360deg); }
  }

  .cover-wrap .disc-wrap.pop-init,
  .disc-wrap {
  }
  .cover.pop { }
  .disc-wrap:has(.cover.pop) {
    transform:scale(1);
    opacity:1;
  }

  .info-row {
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:12px;
  }
  .info { min-width:0;flex:1; }
  .track-title {
    display:block;
    font-size:22px;
    font-weight:800;
    color:#fff;
    letter-spacing:-.4px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .track-artist {
    display:block;
    font-size:15px;
    color:rgba(255,255,255,0.6);
    margin-top:3px;
  }

  .platforms-row {
    display:flex;
    flex-direction:column;
    align-items:flex-start;
    gap:8px;
    margin-bottom:12px;
    padding:0;
  }
  .platforms-label {
    font-size:11.5px;
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:.05em;
  }
  .platforms-icons {
    display:flex;
    align-items:center;
    gap:12px;
    flex-wrap:wrap;
  }
  .platform-btn {
    width:42px;
    height:42px;
    border-radius:50%;
    border:none;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:0 4px 14px rgba(0,0,0,0.3);
    transition:transform .12s ease, opacity .15s ease;
    overflow:hidden;
  }
  .platform-btn:active {
    transform:scale(0.9);
    opacity:0.85;
  }
  .platform-logo {
    width:20px;
    height:20px;
    display:block;
    object-fit:contain;
    filter: brightness(0) invert(1);
    pointer-events:none;
    user-select:none;
  }

  .progress-wrap { margin-bottom:12px; }
  .progress-track {
    position:relative;
    height:5px;
    border-radius:999px;
    background:rgba(255,255,255,0.18);
    cursor:pointer;
    margin-bottom:8px;
    width:100%;
    border:none;
    padding:0;
  }
  .progress-fill {
    height:100%;
    border-radius:999px;
    background:#FC3C44;
    transition:width .5s linear;
  }
  .progress-thumb {
    position:absolute;
    top:50%;
    transform:translate(-50%,-50%);
    width:14px;
    height:14px;
    border-radius:50%;
    background:#fff;
    box-shadow:0 0 4px rgba(0,0,0,0.4);
    transition:left .5s linear, transform .15s cubic-bezier(.4,0,.2,1);
  }
  .progress-track:active .progress-thumb {
    transform:translate(-50%,-50%) scale(1.35);
  }
  .times {
    display:flex;
    justify-content:space-between;
    font-size:12px;
    color:rgba(255,255,255,0.45);
  }

  .controls {
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:20px;
  }
  .ctrl-sm {
    position:relative;
    width:40px;
    height:40px;
    border-radius:50%;
    border:none;
    background:transparent;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
  }
  .ctrl-sm:active { opacity:0.6; }
  .ctrl-md {
    width:52px;
    height:52px;
    border-radius:50%;
    border:none;
    background:transparent;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
  }
  .ctrl-md:active { opacity:0.6; }
  .play-btn {
    width:70px;
    height:70px;
    border-radius:50%;
    border:none;
    background:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    box-shadow:0 4px 24px rgba(0,0,0,0.4);
    transition:transform .12s ease;
  }
  .play-btn:active { transform:scale(0.94); }
  .play-btn:disabled { opacity:0.7; }
  .play-icon { margin-left:3px; }
  .play-spinner {
    width:28px;
    height:28px;
    border-radius:50%;
    border:3px solid rgba(28,28,30,0.2);
    border-top-color:#1c1c1e;
    animation:spin .7s linear infinite;
  }
  @keyframes spin { to { transform:rotate(360deg); } }

  .actions {
    display:flex;
    align-items:center;
    justify-content:space-around;
    margin-bottom:12px;
  }
  .action-btn {
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:4px;
    background:none;
    border:none;
    cursor:pointer;
    padding:0;
  }
  .action-btn:active { opacity:0.6; }

  .lyrics-wrap { flex:1;overflow-y:auto;padding:4px 0; }
  .lyrics-text {
    font-size:16px;
    line-height:1.9;
    color:rgba(255,255,255,0.85);
    white-space:pre-wrap;
    margin:0;
  }
  .lyrics-center {
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    height:200px;
    gap:12px;
  }
  .lyrics-empty { color:rgba(255,255,255,0.35);font-size:15px; }
  .lyrics-spinner {
    width:24px;
    height:24px;
    border-radius:50%;
    border:3px solid rgba(255,255,255,0.15);
    border-top-color:#FC3C44;
    animation:spin .7s linear infinite;
  }

  .queue-wrap { flex:1;overflow-y:auto; }
  .queue-label { font-size:16px;font-weight:700;color:#fff;margin:0 0 12px; }

  .icon-btn {
    width:36px;
    height:36px;
    border-radius:50%;
    border:none;
    background:transparent;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    flex-shrink:0;
  }
  .icon-btn:active { opacity:0.5; }
  .icon-mask {
    display:block;
    mask-size:contain;
    -webkit-mask-size:contain;
    mask-repeat:no-repeat;
    -webkit-mask-repeat:no-repeat;
    mask-position:center;
    -webkit-mask-position:center;
    flex-shrink:0;
  }
</style>