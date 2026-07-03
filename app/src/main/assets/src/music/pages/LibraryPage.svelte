<script>
  import { newAlbums, playlists, artists, loadArtist } from '../store/music.js';

  export let isDark = false;
  export let bgCard = '#1c1c1e';
  export let txtPrim = '#ffffff';
  export let txtSec = '#8e8e93';
  export let divider = 'rgba(255,255,255,0.08)';
  export let currentTrackExists = false;

  const ACCENT = '#FC3C44';

  let libTab = 'playlists';
  const tabOrder = ['playlists', 'albums', 'artists'];

  const tabs = [
    ['playlists', 'Playlists'],
    ['albums', 'Álbuns'],
    ['artists', 'Artistas'],
  ];

  $: counts = {
    playlists: $playlists.length,
    albums: $newAlbums.length,
    artists: $artists.length,
  };

  $: emptyLabel = libTab === 'playlists' ?
    'Nenhuma playlist ainda' :
    libTab === 'albums' ?
    'Nenhum álbum guardado' :
    'Nenhum artista seguido';

  $: emptyHint = libTab === 'playlists' ?
    'As playlists que criares ou guardares aparecem aqui.' :
    libTab === 'albums' ?
    'Os álbuns que ouvires ou guardares aparecem aqui.' :
    'Segue artistas para os veres nesta lista.';

  // ---- Swipe horizontal para trocar de tab (mesmo padrão do FullPlayer) ----
  let tabDragging = false;
  let tabDragStartX = 0;
  let tabDragDeltaX = 0;

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
    const idx = tabOrder.indexOf(libTab);
    if (tabDragDeltaX < -threshold && idx < tabOrder.length - 1) {
      libTab = tabOrder[idx + 1];
    } else if (tabDragDeltaX > threshold && idx > 0) {
      libTab = tabOrder[idx - 1];
    }
    tabDragDeltaX = 0;
  }
</script>

<div class="lib">

  <!-- Recentes: só aparece se houver conteúdo, dá ao topo uma sensação de "continuar" -->
  {#if $playlists.length || $newAlbums.length}
    <div class="recent-section">
      <div class="recent-hdr">
        <span class="svg-mask" style="mask-image:url('/icons/svg/history.svg');-webkit-mask-image:url('/icons/svg/history.svg');background:{txtSec};width:14px;height:14px;"></span>
        <span class="recent-label" style="color:{txtSec}">Acedido recentemente</span>
      </div>
      <div class="recent-scroll">
        {#each [...$playlists.slice(0,4), ...$newAlbums.slice(0,4)].slice(0,8) as item}
          <button class="recent-card">
            <div class="recent-img-wrap" style="background:{bgCard}">
              {#if item.picture_medium || item.cover_medium}
                <img src={item.picture_medium || item.cover_medium} alt={item.title} class="recent-img" loading="lazy" />
              {:else}
                <span class="svg-mask" style="mask-image:url('/icons/svg/playlist_music.svg');-webkit-mask-image:url('/icons/svg/playlist_music.svg');background:{txtSec};width:22px;height:22px;"></span>
              {/if}
            </div>
            <span class="recent-title" style="color:{txtPrim}">{item.title?.length>16?item.title.slice(0,16)+'…':item.title}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Tabs nativos em pill, mesmo padrão do FullPlayer -->
  <div class="tabs-pill-wrap">
    <div class="tabs-pill">
      {#each tabs as [id,label]}
        <button
          class="tab-pill-btn"
          class:active={libTab===id}
          style="color:{libTab===id ? '#1c1c1e' : txtSec}"
          on:click={() => libTab=id}
        >
          {label}
          <span class="tab-pill-count" style="color:{libTab===id?ACCENT:txtSec};opacity:{libTab===id?1:0.7}">{counts[id]}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Conteúdo com swipe horizontal -->
  <div
    class="tab-swipe-area"
    on:touchstart={onTabDragStart}
    on:touchmove={onTabDragMove}
    on:touchend={onTabDragEnd}
  >

  {#if libTab === 'playlists'}
    {#if $playlists.length}
      <div class="lib-list">
        {#each $playlists as pl, i}
          <button class="lib-row">
            <span class="lib-row-index" style="color:{txtSec}">{String(i+1).padStart(2,'0')}</span>
            <div class="lib-sq" style="background:linear-gradient(135deg,{ACCENT},#B8232C)">
              {#if pl.picture_small}
                <img src={pl.picture_small} alt={pl.title} class="lib-sq-img" loading="lazy" />
              {:else}
                <span class="svg-mask" style="mask-image:url('/icons/svg/playlist_music.svg');-webkit-mask-image:url('/icons/svg/playlist_music.svg');background:#fff;width:20px;height:20px;"></span>
              {/if}
            </div>
            <div class="lib-row-info">
              <span class="lib-row-title" style="color:{txtPrim}">{pl.title}</span>
              <span class="lib-row-sub" style="color:{txtSec}">Playlist · {pl.nb_tracks ?? '—'} músicas</span>
            </div>
            <span class="svg-mask lib-chevron" style="mask-image:url('/icons/svg/chevron_right.svg');-webkit-mask-image:url('/icons/svg/chevron_right.svg');background:{txtSec};width:13px;height:13px;"></span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="lib-empty">
        <div class="lib-empty-icon" style="background:{bgCard}">
          <span class="svg-mask" style="mask-image:url('/icons/svg/playlist_music.svg');-webkit-mask-image:url('/icons/svg/playlist_music.svg');background:{txtSec};width:26px;height:26px;"></span>
        </div>
        <span class="lib-empty-title" style="color:{txtPrim}">{emptyLabel}</span>
        <span class="lib-empty-hint" style="color:{txtSec}">{emptyHint}</span>
      </div>
    {/if}

  {:else if libTab === 'albums'}
    {#if $newAlbums.length}
      <div class="lib-grid">
        {#each $newAlbums as a}
          <div class="lib-grid-card">
            <div class="lib-grid-img-wrap">
              {#if a.cover_medium}
                <img src={a.cover_medium} alt={a.title} class="lib-grid-img" loading="lazy" />
              {:else}
                <div class="lib-grid-img lib-grid-fallback" style="background:{bgCard}">
                  <span class="svg-mask" style="mask-image:url('/icons/svg/playlist_music.svg');-webkit-mask-image:url('/icons/svg/playlist_music.svg');background:{txtSec};width:24px;height:24px;"></span>
                </div>
              {/if}
            </div>
            <span class="lib-grid-title" style="color:{txtPrim}">{a.title?.length>18?a.title.slice(0,18)+'…':a.title}</span>
            <span class="lib-grid-sub" style="color:{txtSec}">{a.artist?.name}</span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="lib-empty">
        <div class="lib-empty-icon" style="background:{bgCard}">
          <span class="svg-mask" style="mask-image:url('/icons/svg/playlist_music.svg');-webkit-mask-image:url('/icons/svg/playlist_music.svg');background:{txtSec};width:26px;height:26px;"></span>
        </div>
        <span class="lib-empty-title" style="color:{txtPrim}">{emptyLabel}</span>
        <span class="lib-empty-hint" style="color:{txtSec}">{emptyHint}</span>
      </div>
    {/if}

  {:else}
    {#if $artists.length}
      <div class="lib-list">
        {#each $artists as ar, i}
          <button class="lib-row" on:click={() => loadArtist(ar)}>
            <span class="lib-row-index" style="color:{txtSec}">{String(i+1).padStart(2,'0')}</span>
            <div class="lib-avatar">
              {#if ar.picture_small}
                <img src={ar.picture_small} alt={ar.name} class="lib-avatar-img" loading="lazy" />
              {:else}
                <span class="lib-avatar-letter">{ar.name[0]}</span>
              {/if}
            </div>
            <div class="lib-row-info">
              <span class="lib-row-title" style="color:{txtPrim}">{ar.name}</span>
              <span class="lib-row-sub" style="color:{txtSec}">Artista{ar.nb_fan ? ` · ${Intl.NumberFormat('pt-PT',{notation:'compact'}).format(ar.nb_fan)} fãs` : ''}</span>
            </div>
            <span class="svg-mask lib-chevron" style="mask-image:url('/icons/svg/chevron_right.svg');-webkit-mask-image:url('/icons/svg/chevron_right.svg');background:{txtSec};width:13px;height:13px;"></span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="lib-empty">
        <div class="lib-empty-icon" style="background:{bgCard}">
          <span class="svg-mask" style="mask-image:url('/icons/svg/history.svg');-webkit-mask-image:url('/icons/svg/history.svg');background:{txtSec};width:26px;height:26px;"></span>
        </div>
        <span class="lib-empty-title" style="color:{txtPrim}">{emptyLabel}</span>
        <span class="lib-empty-hint" style="color:{txtSec}">{emptyHint}</span>
      </div>
    {/if}
  {/if}

  </div>

  <div style="height:{currentTrackExists?148:88}px"></div>
</div>

<style>
  .lib { padding-top:8px; }

  /* Recentes */
  .recent-section { padding:4px 0 18px; }
  .recent-hdr { display:flex;align-items:center;gap:6px;padding:0 16px 10px; }
  .recent-label { font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em; }
  .recent-scroll { display:flex;gap:12px;padding:0 16px 4px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none; }
  .recent-scroll::-webkit-scrollbar { display:none; }
  .recent-card { flex-shrink:0;width:92px;background:transparent;border:none;cursor:pointer;padding:0;text-align:left; }
  .recent-card:active { opacity:0.7; }
  .recent-img-wrap { width:92px;height:92px;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:8px;box-shadow:0 6px 16px rgba(0,0,0,0.28); }
  .recent-img { width:100%;height:100%;object-fit:cover;display:block; }
  .recent-title { display:block;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3; }

  /* Tabs pill nativos — mesmo padrão visual do FullPlayer */
  .tabs-pill-wrap { display:flex;justify-content:center;padding:4px 16px 16px; }
  .tabs-pill {
    display:inline-flex;
    background:rgba(128,128,128,0.14);
    border-radius:999px;
    padding:3px;
    gap:2px;
    width:100%;
  }
  .tab-pill-btn {
    flex:1;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:6px;
    border:none;
    background:transparent;
    border-radius:999px;
    padding:8px 10px;
    font-size:13.5px;
    font-weight:700;
    font-family:inherit;
    cursor:pointer;
    transition:background .25s cubic-bezier(.4,0,.2,1), color .25s ease;
    white-space:nowrap;
  }
  .tab-pill-btn.active {
    background:#ffffff;
  }
  .tab-pill-count { font-size:11.5px;font-weight:700; }

  .tab-swipe-area { touch-action:pan-y; }

  /* Lista com índice numerado — encoda a posição/ordem real do item na biblioteca */
  .lib-list { display:flex;flex-direction:column;padding:6px 16px 4px; }
  .lib-row { display:flex;align-items:center;gap:12px;padding:10px 0;background:transparent;border:none;cursor:pointer;text-align:left;width:100%;transition:opacity .15s; }
  .lib-row:active { opacity:0.6; }
  .lib-row-index { font-size:12px;font-weight:700;width:18px;flex-shrink:0;font-variant-numeric:tabular-nums; }
  .lib-sq { width:52px;height:52px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,0.25); }
  .lib-sq-img { width:100%;height:100%;object-fit:cover;display:block; }
  .lib-avatar { width:52px;height:52px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#333;overflow:hidden; }
  .lib-avatar-img { width:100%;height:100%;object-fit:cover;display:block; }
  .lib-avatar-letter { font-size:20px;font-weight:700;color:#fff; }
  .lib-row-info { flex:1;min-width:0; }
  .lib-row-title { display:block;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .lib-row-sub { display:block;font-size:12.5px;margin-top:2px; }
  .lib-chevron { flex-shrink:0; }

  /* Grid de álbuns */
  .lib-grid { display:grid;grid-template-columns:1fr 1fr;gap:20px 14px;padding:14px 16px 4px; }
  .lib-grid-card { cursor:pointer;transition:opacity .15s; }
  .lib-grid-card:active { opacity:0.75; }
  .lib-grid-img-wrap { width:100%;aspect-ratio:1;border-radius:10px;overflow:hidden;margin-bottom:9px;box-shadow:0 8px 20px rgba(0,0,0,0.3); }
  .lib-grid-img { width:100%;height:100%;object-fit:cover;display:block; }
  .lib-grid-fallback { display:flex;align-items:center;justify-content:center; }
  .lib-grid-title { display:block;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .lib-grid-sub { display:block;font-size:12px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }

  /* Estado vazio — orienta a ação, não só informa a ausência */
  .lib-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 32px 40px;text-align:center; }
  .lib-empty-icon { width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px; }
  .lib-empty-title { font-size:16px;font-weight:700;margin-bottom:6px; }
  .lib-empty-hint { font-size:13.5px;line-height:1.5;max-width:220px; }

  .svg-mask { display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;flex-shrink:0; }
</style>