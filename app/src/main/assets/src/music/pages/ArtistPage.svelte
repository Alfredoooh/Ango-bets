<script>
  import { currentArtist, currentPage, queue, playTrack, loadFeed } from '../store/music.js';
  import TrackRow from '../components/TrackRow.svelte';
  import AlbumCard from '../components/AlbumCard.svelte';
  import { onMount } from 'svelte';

  export let isDark = false;
  export let bgCard = '#242424';
  export let txtPrim = '#ffffff';
  export let txtSec = '#aaaaaa';
  export let divider = 'rgba(255,255,255,0.07)';
  export let currentTrackExists = false;

  $: artist = $currentArtist;
  $: if (artist?.topTracks) queue.set(artist.topTracks);

  let scrollY = 0;
  let scrollEl;
  let following = false;
  let mounted = false;

  const HERO_H = 320;
  const COLLAPSE_AT = HERO_H - 90;

  $: collapseProgress = Math.min(Math.max(scrollY / COLLAPSE_AT, 0), 1);
  $: headerTitleOpacity = Math.min(Math.max((scrollY - (COLLAPSE_AT - 40)) / 40, 0), 1);

  function handleScroll(e) {
    scrollY = e.target.scrollTop;
  }

  function goBack() { currentPage.set('home'); }

  function toggleFollow() {
    following = !following;
    if (navigator.vibrate) navigator.vibrate(8);
  }

  function fmtFans(n) {
    if (!n) return '';
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M fãs`;
    if (n >= 1_000) return `${(n/1_000).toFixed(0)}K fãs`;
    return `${n} fãs`;
  }

  function icon(name) {
    return `mask-image:url('/icons/svg/${name}.svg');-webkit-mask-image:url('/icons/svg/${name}.svg');`;
  }

  onMount(() => {
    requestAnimationFrame(() => { mounted = true; });
  });
</script>

<div class="page">

  <!-- Sticky compact header: SÓ o título e voltar. Sem botão de Seguir aqui. -->
  <div class="sticky-header" style="opacity:{headerTitleOpacity}; pointer-events:{headerTitleOpacity > 0.5 ? 'auto' : 'none'}; background:{isDark ? 'rgba(18,18,18,0.92)' : 'rgba(255,255,255,0.92)'}">
    <button class="sticky-back" on:click={goBack} style="color:{txtPrim}">
      <span class="icon-mask" style="{icon('back_arrow')}background:{txtPrim};width:22px;height:22px;"></span>
    </button>
    <span class="sticky-title" style="color:{txtPrim}">{artist?.name || ''}</span>
    <div class="sticky-spacer"></div>
  </div>

  <!-- Back button flutuante sobre o hero, funde-se com a sticky ao rolar -->
  <button class="float-back" on:click={goBack} style="opacity:{1 - headerTitleOpacity}">
    <span class="icon-mask" style="{icon('back_arrow')}background:#fff;width:22px;height:22px;"></span>
  </button>

  <div class="scroll-area" bind:this={scrollEl} on:scroll={handleScroll}>

    <!-- Hero com parallax -->
    <div class="hero" style="transform: translateY({Math.min(scrollY,0) * 0.5}px) scale({scrollY < 0 ? 1 + (-scrollY / HERO_H) : 1}); height:{HERO_H}px;">
      {#if artist?.picture_xl || artist?.picture_big}
        <img src={artist.picture_xl || artist.picture_big} alt={artist?.name} class="hero-img" class:loaded={mounted} />
      {:else}
        <div class="hero-img hero-fallback">
          <span>{artist?.name?.[0]}</span>
        </div>
      {/if}
      <div class="hero-overlay"></div>

      <div class="hero-info" style="opacity:{1 - collapseProgress * 1.3}; transform: translateY({collapseProgress * 12}px)">
        <span class="hero-name">{artist?.name}</span>
        {#if artist?.nb_fan}
          <span class="hero-fans">{fmtFans(artist.nb_fan)}</span>
        {/if}
      </div>
    </div>

    {#if !artist}
      <div class="skeleton-wrap">
        <div class="skel-row" style="width:70%"></div>
        <div class="skel-tracks">
          {#each Array(5) as _}
            <div class="skel-track">
              <div class="skel-thumb"></div>
              <div class="skel-lines">
                <div class="skel-line" style="width:60%"></div>
                <div class="skel-line" style="width:35%"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}

      <!-- Única barra de ações: Reproduzir + botão circular de Add (seguir). Sem duplicação, sem glow vermelho. -->
      <div class="actions-bar" style="background:{isDark ? '#121212' : '#fff'}">
        <button class="play-all-btn" on:click={() => artist?.topTracks?.[0] && playTrack(artist.topTracks[0])}>
          <span class="icon-mask" style="{icon('play')}background:#fff;width:16px;height:16px;"></span>
          Reproduzir
        </button>
        <button
          class="add-circle-btn"
          class:active={following}
          on:click={toggleFollow}
          aria-label={following ? 'Seguindo' : 'Seguir'}
          style="border-color:{isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'}"
        >
          {#if following}
            <span class="icon-mask" style="{icon('close')}background:{txtPrim};width:16px;height:16px;transform:rotate(45deg);"></span>
          {:else}
            <span class="icon-mask" style="{icon('add')}background:{txtPrim};width:18px;height:18px;"></span>
          {/if}
        </button>
      </div>

      <div class="content" class:reveal={mounted}>

        {#if artist.topTracks?.length}
          <div class="section-hdr">
            <span class="section-title" style="color:{txtPrim}">Músicas populares</span>
          </div>
          <div class="tracks-list">
            {#each artist.topTracks as t, i (t.id ?? i)}
              <div class="track-item" style="animation-delay:{Math.min(i,8) * 35}ms">
                <TrackRow track={t} {isDark} {bgCard} {txtPrim} {txtSec} rank={i+1} />
              </div>
            {/each}
          </div>
        {/if}

        {#if artist.albums?.length}
          <div class="section-hdr" style="margin-top:28px">
            <span class="section-title" style="color:{txtPrim}">Discografia</span>
          </div>
          <div class="h-scroll">
            {#each artist.albums as a}
              <AlbumCard album={a} {txtPrim} {txtSec} {bgCard} size={148} />
            {/each}
          </div>
        {/if}

        {#if artist.related?.length}
          <div class="section-hdr" style="margin-top:28px">
            <span class="section-title" style="color:{txtPrim}">Artistas relacionados</span>
          </div>
          <div class="h-scroll">
            {#each artist.related as ar}
              <button class="rel-card" on:click={() => { currentArtist.set(null); setTimeout(() => { import('../store/music.js').then(m => m.loadArtist(ar)); }, 50); }}>
                <div class="rel-avatar">
                  {#if ar.picture_medium}
                    <img src={ar.picture_medium} alt={ar.name} class="rel-img" loading="lazy" />
                  {:else}
                    <div class="rel-img rel-fallback"><span>{ar.name[0]}</span></div>
                  {/if}
                </div>
                <span class="rel-name" style="color:{txtPrim}">{ar.name?.length>12?ar.name.slice(0,12)+'…':ar.name}</span>
              </button>
            {/each}
          </div>
        {/if}

      </div>
    {/if}

    <div style="height:{currentTrackExists?148:88}px"></div>
  </div>
</div>

<style>
  .page { position:relative; height:100%; overflow:hidden; }

  .scroll-area {
    height:100%;
    overflow-y:auto;
    -webkit-overflow-scrolling:touch;
    overscroll-behavior-y:contain;
  }

  .sticky-header {
    position:absolute;
    top:0; left:0; right:0;
    height:calc(env(safe-area-inset-top,0px) + 56px);
    padding-top:env(safe-area-inset-top,0px);
    display:flex;
    align-items:center;
    gap:12px;
    padding-left:8px;
    padding-right:16px;
    z-index:20;
    backdrop-filter:blur(20px);
    -webkit-backdrop-filter:blur(20px);
    transition:opacity .15s ease-out;
    border-bottom:1px solid rgba(128,128,128,0.08);
  }
  .sticky-back {
    width:36px;height:36px;flex-shrink:0;
    border-radius:50%;border:none;background:transparent;
    display:flex;align-items:center;justify-content:center;cursor:pointer;
  }
  .sticky-back:active { background:rgba(128,128,128,0.15); }
  .sticky-title {
    flex:1;
    font-size:16px;font-weight:700;letter-spacing:-.2px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .sticky-spacer { width:36px;flex-shrink:0; }

  .float-back {
    position:absolute;
    top:calc(env(safe-area-inset-top,0px) + 12px);
    left:16px;
    width:36px;height:36px;
    border-radius:50%;border:none;
    background:rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;backdrop-filter:blur(8px);
    z-index:21;
    transition:opacity .1s linear;
  }
  .float-back:active { transform:scale(0.9); }

  .hero {
    position:relative;
    overflow:hidden;
    flex-shrink:0;
    transform-origin:top center;
    will-change:transform;
  }
  .hero-img {
    width:100%;height:100%;object-fit:cover;display:block;
    opacity:0;
    transform:scale(1.08);
    transition:opacity .5s ease-out, transform .8s cubic-bezier(.2,.7,.3,1);
  }
  .hero-img.loaded { opacity:1; transform:scale(1); }
  .hero-fallback { background:#333;display:flex;align-items:center;justify-content:center;opacity:1 !important;transform:none !important; }
  .hero-fallback span { font-size:80px;font-weight:800;color:rgba(255,255,255,0.3); }
  .hero-overlay { position:absolute;inset:0;background:linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%); }

  .hero-info {
    position:absolute;bottom:20px;left:16px;right:16px;
    transition:opacity .1s linear, transform .1s linear;
    will-change:opacity, transform;
  }
  .hero-name { display:block;font-size:34px;font-weight:900;color:#fff;letter-spacing:-.8px;text-shadow:0 2px 12px rgba(0,0,0,0.3); }
  .hero-fans { display:block;font-size:14px;color:rgba(255,255,255,0.65);margin-top:4px; }

  .actions-bar {
    position:sticky;
    top:calc(env(safe-area-inset-top,0px) + 56px);
    z-index:10;
    display:flex;
    gap:12px;
    align-items:center;
    padding:14px 16px;
    border-bottom:1px solid rgba(128,128,128,0.08);
  }
  .play-all-btn {
    display:flex;align-items:center;gap:8px;
    background:#FC3C44;border:none;border-radius:999px;
    padding:11px 22px;font-size:15px;font-weight:700;color:#fff;
    cursor:pointer;
    transition:transform .12s ease, opacity .12s ease;
  }
  .play-all-btn:active { transform:scale(0.95); opacity:0.9; }

  .add-circle-btn {
    width:42px;height:42px;flex-shrink:0;
    border-radius:50%;
    border:1.5px solid;
    background:transparent;
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;
    transition:transform .12s ease, background .15s ease, border-color .15s ease;
  }
  .add-circle-btn:active { transform:scale(0.9); }
  .add-circle-btn.active { background:rgba(128,128,128,0.12); }

  .content { padding-top:4px; }
  .content.reveal .track-item { animation:slideUp .35s cubic-bezier(.2,.7,.3,1) backwards; }

  @keyframes slideUp {
    from { opacity:0; transform:translateY(10px); }
    to { opacity:1; transform:translateY(0); }
  }

  .section-hdr { display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px; }
  .section-title { font-size:20px;font-weight:800;letter-spacing:-.4px; }
  .tracks-list { display:flex;flex-direction:column;padding:0 16px; }
  .h-scroll { display:flex;gap:12px;padding:0 16px 8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none; }
  .h-scroll::-webkit-scrollbar { display:none; }

  .rel-card { display:flex;flex-direction:column;align-items:center;gap:8px;background:transparent;border:none;cursor:pointer;flex-shrink:0;padding:0;transition:transform .12s ease; }
  .rel-card:active { transform:scale(0.94); opacity:0.8; }
  .rel-avatar { width:80px;height:80px;border-radius:50%;overflow:hidden; }
  .rel-img { width:100%;height:100%;object-fit:cover;display:block; }
  .rel-fallback { background:#333;display:flex;align-items:center;justify-content:center; }
  .rel-fallback span { font-size:22px;font-weight:700;color:#fff; }
  .rel-name { font-size:12px;font-weight:600;text-align:center; }

  .skeleton-wrap { padding:16px; }
  .skel-row, .skel-line, .skel-thumb {
    background:linear-gradient(90deg, rgba(128,128,128,0.12) 25%, rgba(128,128,128,0.22) 37%, rgba(128,128,128,0.12) 63%);
    background-size:400% 100%;
    animation:shimmer 1.4s ease infinite;
    border-radius:6px;
  }
  .skel-row { height:22px;margin-bottom:20px; }
  .skel-tracks { display:flex;flex-direction:column;gap:14px; }
  .skel-track { display:flex;align-items:center;gap:12px; }
  .skel-thumb { width:48px;height:48px;border-radius:8px;flex-shrink:0; }
  .skel-lines { flex:1;display:flex;flex-direction:column;gap:8px; }
  .skel-line { height:14px; }
  @keyframes shimmer { 0% { background-position:100% 0; } 100% { background-position:-100% 0; } }

  .icon-mask { display:block; mask-size:contain; -webkit-mask-size:contain; mask-repeat:no-repeat; -webkit-mask-repeat:no-repeat; mask-position:center; -webkit-mask-position:center; flex-shrink:0; }
</style>