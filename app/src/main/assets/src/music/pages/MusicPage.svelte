<!-- src/music/pages/MusicPage.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import Drawer           from '../components/Drawer.svelte';
  import HomePage         from './HomePage.svelte';
  import SearchPage       from './SearchPage.svelte';
  import SearchActivePage from './SearchActivePage.svelte';
  import LibraryPage      from './LibraryPage.svelte';
  import ArtistPage       from './ArtistPage.svelte';
  import MiniPlayer       from '../components/MiniPlayer.svelte';
  import FullPlayer       from '../components/FullPlayer.svelte';
  import { loadFeed, currentTrack, currentPage } from '../store/music.js';

  export let isDark = false;
  export let user   = null;

  const dispatch = createEventDispatcher();

  $: bg      = isDark ? '#121212' : '#ffffff';
  $: bgCard  = isDark ? '#1c1c1e' : '#f0f0f0';
  $: bgChip  = isDark ? '#2c2c2e' : '#e8e8e8';
  $: txtPrim = isDark ? '#ffffff' : '#000000';
  $: txtSec  = isDark ? '#8e8e93' : '#6c6c70';
  $: divider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  let activeTab     = 'home';
  let drawerOpen    = false;
  let pulseTab      = null;
  let pulseSeq      = 0;
  let searchPrefill = '';

  const menuItems = [
    { icon: 'home_outline', label: 'Início',    action: () => { activeTab = 'home'; currentPage.set('home'); drawerOpen = false; } },
    { icon: 'bookmark',     label: 'Guardados', action: () => {} },
    { icon: 'history',      label: 'Recentes',  action: () => {} },
  ];

  let feedTimer = null;
  onMount(() => {
    loadFeed();
    feedTimer = setInterval(loadFeed, 60 * 1000);
    return () => clearInterval(feedTimer);
  });

  $: themeProps       = { isDark, bg, bgCard, bgChip, txtPrim, txtSec, divider };
  $: showArtist       = $currentPage === 'artist';
  $: showSearchActive = $currentPage === 'search-active';
  // O tab de pesquisa passa a ter o próprio appbar (dentro do SearchPage), por isso
  // também entra no hideChrome do appbar do MusicPage — mas mantém o bottom-bar.
  $: hideAppbar       = showArtist || showSearchActive || activeTab === 'search';
  $: hideBottomBar    = showArtist || showSearchActive;
  $: appbarTitle      = activeTab === 'home' ? 'Início' : 'Biblioteca';

  function tapTab(id) {
    activeTab = id;
    currentPage.set(id);
    const seq = ++pulseSeq;
    pulseTab = id;
    setTimeout(() => { if (pulseSeq === seq) pulseTab = null; }, 380);
  }

  function openSearchActive(e) {
    searchPrefill = e?.detail?.prefillQuery || '';
    currentPage.set('search-active');
  }

  function closeSearchActive() {
    searchPrefill = '';
    currentPage.set('search');
  }
</script>

<div class="root" style="background:{bg};color:{txtPrim}">

  <Drawer {isDark} {user} open={drawerOpen} {menuItems}
    on:close={() => drawerOpen = false}
    on:openSettings={() => dispatch('nav', { to: 'settings' })} />

  {#if !hideAppbar}
    <div class="appbar" style="background:{bg}">
      <button class="icon-btn" on:click={() => drawerOpen = true}>
        <span class="svg-mask" style="mask-image:url('/icons/svg/menu.svg');-webkit-mask-image:url('/icons/svg/menu.svg');background:{txtPrim};width:20px;height:20px;"></span>
      </button>
      <span class="appbar-title" style="color:{txtPrim}">{appbarTitle}</span>
    </div>
  {/if}

  <div class="body">
    {#if showArtist}
      <ArtistPage {...themeProps} currentTrackExists={!!$currentTrack} />
    {:else if showSearchActive}
      <SearchActivePage {...themeProps} currentTrackExists={!!$currentTrack} prefillQuery={searchPrefill} on:close={closeSearchActive} />
    {:else if activeTab === 'home'}
      <HomePage {...themeProps} currentTrackExists={!!$currentTrack} />
    {:else if activeTab === 'search'}
      <SearchPage {...themeProps} currentTrackExists={!!$currentTrack} onOpenDrawer={() => drawerOpen = true} on:openSearch={openSearchActive} />
    {:else if activeTab === 'library'}
      <LibraryPage {...themeProps} currentTrackExists={!!$currentTrack} />
    {/if}
  </div>

  {#if !hideBottomBar}
    <div class="bottom-chrome">
      <div class="bottom-bar-gradient" class:dark={isDark}></div>
      <div class="bottom-bar">
        {#each [['home','Início'],['search','Pesquisa'],['library','Biblioteca']] as [id,label]}
          <button class="tab-btn" on:click={() => tapTab(id)}>
            {#if pulseTab === id}
              <span class="pulse-ring" style="background:{txtPrim}"></span>
            {/if}
            {#if id === 'home'}
              <span class="svg-mask tab-icon" style="mask-image:url('/icons/svg/{activeTab==='home'?'home_filled':'home_outline'}.svg');-webkit-mask-image:url('/icons/svg/{activeTab==='home'?'home_filled':'home_outline'}.svg');background:{activeTab===id?txtPrim:txtSec};"></span>
            {:else if id === 'search'}
              <span class="svg-mask tab-icon" style="mask-image:url('/icons/svg/{activeTab==='search'?'search_filled':'search'}.svg');-webkit-mask-image:url('/icons/svg/{activeTab==='search'?'search_filled':'search'}.svg');background:{activeTab===id?txtPrim:txtSec};"></span>
            {:else}
              <span class="svg-mask tab-icon" style="mask-image:url('/icons/svg/{activeTab==='library'?'library_filled':'library_outline'}.svg');-webkit-mask-image:url('/icons/svg/{activeTab==='library'?'library_filled':'library_outline'}.svg');background:{activeTab===id?txtPrim:txtSec};"></span>
            {/if}
            <span class="tab-label" style="color:{activeTab===id?txtPrim:txtSec}">{label}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

</div>

<MiniPlayer {bg} {bgCard} {txtPrim} {txtSec} {divider} hasBottomBar={!hideBottomBar} />
<FullPlayer />

<style>
  .root { position:fixed; inset:0; display:flex; flex-direction:column; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
  .appbar { display:flex; align-items:center; gap:10px; padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 10px; flex-shrink:0; }
  .appbar-title { font-size:22px; font-weight:900; letter-spacing:-.5px; }
  .icon-btn { width:36px; height:36px; border-radius:50%; border:none; background:transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:opacity .15s; flex-shrink:0; }
  .icon-btn:active { opacity:0.5; }
  .body { flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; }

  .bottom-chrome { position:absolute; left:0; right:0; bottom:0; z-index:39; pointer-events:none; }

  .bottom-bar-gradient {
    position:absolute; left:0; right:0; bottom:0; height:130px;
  }
  .bottom-bar-gradient:not(.dark) {
    background:linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 40%, rgba(255,255,255,0) 100%);
  }
  .bottom-bar-gradient.dark {
    background:linear-gradient(to top, rgba(18,18,18,1) 0%, rgba(18,18,18,0.95) 40%, rgba(18,18,18,0) 100%);
  }

  .bottom-bar {
    position:absolute; left:0; right:0; bottom:0; z-index:40;
    display:flex; align-items:center; justify-content:space-around;
    padding:8px 0 calc(8px + env(safe-area-inset-bottom,0px));
    background:transparent;
    pointer-events:all;
  }

  .tab-btn { position:relative; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; cursor:pointer; padding:4px 20px; transition:transform .15s; overflow:visible; }
  .tab-btn:active { transform:scale(0.88); }
  .pulse-ring { position:absolute; top:50%; left:50%; width:52px; height:52px; border-radius:50%; transform:translate(-50%,-50%) scale(0.3); opacity:0.18; pointer-events:none; animation:tabPulse .38s ease-out forwards; }
  @keyframes tabPulse { 0%{transform:translate(-50%,-50%) scale(0.3);opacity:0.22} 100%{transform:translate(-50%,-50%) scale(1.15);opacity:0} }
  .tab-icon { width:24px; height:24px; display:block; }
  .tab-label { font-size:10px; font-weight:500; }
  .svg-mask { display:block; mask-size:contain; -webkit-mask-size:contain; mask-repeat:no-repeat; -webkit-mask-repeat:no-repeat; mask-position:center; -webkit-mask-position:center; flex-shrink:0; }
</style>