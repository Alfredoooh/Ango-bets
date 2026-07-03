<script>
  import { createEventDispatcher } from 'svelte';
  import { getThemeColors } from '$shared/theme.js';
  import { ALL_APPS } from '$shared/plans.js';

  export let isDark = false;
  export let user = null;
  export let open = false;
  export let menuItems = [];

  const dispatch = createEventDispatcher();
  $: c = getThemeColors(isDark);

  const AVATAR_COLORS = [
    '#FF3B30','#FF9500','#FFCC00','#34C759',
    '#00C7BE','#007AFF','#5856D6','#AF52DE',
    '#FF2D55','#A2845E'
  ];

  function getAvatarColor(str) {
    if (!str) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  $: userName    = user?.name || user?.displayName || user?.email || 'U';
  $: userEmail   = user?.email || '';
  $: userInitial = userName.trim()[0]?.toUpperCase() || 'U';
  $: avatarColor = getAvatarColor(userName);

  let showProfilePopup = false;
  let showAppsPopup    = false;
  let footerBottom     = 0;
  let footerLeft       = 0;

  function openProfilePopup(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    footerBottom = window.innerHeight - rect.top + 8;
    footerLeft   = rect.left + 12;
    showAppsPopup    = false;
    showProfilePopup = true;
  }

  function goToApps() {
    showProfilePopup = false;
    showAppsPopup    = true;
  }

  function closeAllPopups() {
    showProfilePopup = false;
    showAppsPopup    = false;
  }

  function closeDrawer() { closeAllPopups(); dispatch('close'); }
  function openSettings() { closeAllPopups(); dispatch('openSettings'); closeDrawer(); }
  function triggerItem(item) { if (!item || item.disabled) return; item.action?.(); if (!item.keepOpen) closeDrawer(); }

  function navigateApp(app) {
    closeAllPopups();
    if (app.id === 'music') return;
    window.location.href = app.path;
  }
</script>

<div class="overlay" class:open on:click|self={closeDrawer}></div>

{#if showProfilePopup || showAppsPopup}
  <div class="popup-overlay" on:click={closeAllPopups}></div>
{/if}

{#if showProfilePopup}
  <div
    class="popup-box"
    class:dark={isDark}
    style="bottom:{footerBottom}px;left:{footerLeft}px;"
  >
    <button type="button" class="popup-row" class:dark={isDark} on:click={openSettings}>
      <span class="icon-mask popup-row-icon" style="mask-image:url('/icons/svg/settings.svg');-webkit-mask-image:url('/icons/svg/settings.svg');"></span>
      <span class="popup-label" class:dark={isDark}>Definições</span>
    </button>
    <div class="popup-sep" class:dark={isDark}></div>
    <button type="button" class="popup-row" class:dark={isDark} on:click={goToApps}>
      <span class="icon-mask popup-row-icon" style="mask-image:url('/icons/svg/apps.svg');-webkit-mask-image:url('/icons/svg/apps.svg');"></span>
      <span class="popup-label" class:dark={isDark}>Apps</span>
    </button>
  </div>
{/if}

{#if showAppsPopup}
  <div
    class="popup-box apps-popup"
    class:dark={isDark}
    style="bottom:{footerBottom}px;left:{footerLeft}px;"
  >
    <div class="popup-section-label" class:dark={isDark}>Plataformas</div>
    <div class="apps-list">
      {#each ALL_APPS as app}
        <button
          type="button"
          class="app-row"
          on:click={() => navigateApp(app)}
        >
          <div class="app-icon-wrap" style="background:{isDark ? '#2C2C2E' : '#F0F0F5'}">
            {#if app.icon.endsWith('.svg')}
              <span class="icon-mask" style="mask-image:url('{app.icon}');-webkit-mask-image:url('{app.icon}');background:{app.id === 'music' ? '#2F7BF6' : (isDark ? 'rgba(235,235,245,0.55)' : 'rgba(60,60,67,0.55)')};width:20px;height:20px;display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;"></span>
            {:else}
              <img src={app.icon} class="app-img" alt={app.label} />
            {/if}
          </div>
          <span class="app-label" style="color:{app.id === 'music' ? '#2F7BF6' : (isDark ? '#fff' : '#000')}">{app.label}</span>
          {#if app.id === 'music'}
            <span class="active-dot"></span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
{/if}

<div class="drawer" class:open class:dark={isDark}>

  <div class="header">
    <span class="header-title">Music</span>
  </div>

  <div class="body">
    {#if menuItems.length}
      <div class="section">
        {#each menuItems as item}
          <button type="button" class="row" class:danger={item.danger} on:click={() => triggerItem(item)}>
            {#if item.icon}
              <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/{item.icon}.svg');-webkit-mask-image:url('/icons/svg/{item.icon}.svg');"></span>
            {/if}
            <span class="row-label">{item.label}</span>
            {#if item.badge}
              <span class="row-badge">{item.badge}</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if user}
    <button type="button" class="user-footer" class:dark={isDark} on:click={openProfilePopup}>
      <div class="avatar" style="background:{avatarColor}">{userInitial}</div>
      <div class="user-info">
        <span class="user-name">{userName}</span>
        {#if userEmail && userEmail !== userName}
          <span class="user-email">{userEmail}</span>
        {/if}
      </div>
      <span class="icon-mask chevron-icon" style="mask-image:url('/icons/svg/chevron_right.svg');-webkit-mask-image:url('/icons/svg/chevron_right.svg');"></span>
    </button>
  {/if}

</div>

<style>
  .overlay { position:fixed; inset:0; z-index:100; opacity:0; pointer-events:none; background:rgba(0,0,0,0.18); transition:opacity .28s ease; }
  .overlay.open { opacity:1; pointer-events:auto; }

  .drawer { position:fixed; top:0; left:0; bottom:0; width:78vw; max-width:320px; z-index:101; display:flex; flex-direction:column; transform:translateX(-100%); transition:transform .3s cubic-bezier(0.4,0,0.2,1); background:#ffffff; border-right:0.5px solid rgba(0,0,0,0.09); }
  .drawer.dark { background:#111111; border-right-color:rgba(255,255,255,0.07); }
  .drawer.open { transform:translateX(0); }

  .header { padding:20px 20px 10px; flex-shrink:0; }
  .header-title { font-size:26px; font-weight:700; letter-spacing:-0.5px; color:#000; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif; }
  .dark .header-title { color:#fff; }

  .body { flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; padding:8px 0 16px; display:flex; flex-direction:column; }

  .section { display:flex; flex-direction:column; padding:0 12px; }

  .row { width:100%; display:flex; align-items:center; gap:13px; padding:13px 10px; background:transparent; border:none; cursor:pointer; text-align:left; border-radius:10px; -webkit-user-select:none; user-select:none; transition:background .12s ease; color:#000; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
  .dark .row { color:#fff; }
  .row:active { background:rgba(0,0,0,0.05); }
  .dark .row:active { background:rgba(255,255,255,0.06); }
  .row.danger { color:#FF3B30; }

  .row-icon { width:18px; height:18px; background:rgba(60,60,67,0.55); flex-shrink:0; display:block; mask-size:contain; -webkit-mask-size:contain; mask-repeat:no-repeat; -webkit-mask-repeat:no-repeat; mask-position:center; -webkit-mask-position:center; }
  .dark .row-icon { background:rgba(235,235,245,0.55); }
  .danger .row-icon { background:#FF3B30; }

  .row-label { flex:1; font-size:15px; font-weight:400; min-width:0; }
  .row-badge { font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px; background:rgba(0,0,0,0.07); color:rgba(60,60,67,0.7); flex-shrink:0; }
  .dark .row-badge { background:rgba(255,255,255,0.1); color:rgba(235,235,245,0.6); }

  .user-footer { position:relative; z-index:102; flex-shrink:0; display:flex; align-items:center; gap:10px; padding:12px 16px calc(12px + env(safe-area-inset-bottom)); border-top:0.5px solid rgba(0,0,0,0.07); border-left:none; border-right:none; border-bottom:none; background:#ffffff; width:100%; cursor:pointer; text-align:left; transition:background .12s ease; font-family:-apple-system,BlinkMacSystemFont,sans-serif; }
  .user-footer:active { background:rgba(0,0,0,0.04); }
  .user-footer.dark { border-top-color:rgba(255,255,255,0.07); background:#111111; }
  .user-footer.dark:active { background:rgba(255,255,255,0.05); }

  .avatar { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#fff; flex-shrink:0; letter-spacing:-0.3px; }
  .user-info { display:flex; flex-direction:column; min-width:0; flex:1; text-align:left; }
  .user-name { font-size:13.5px; font-weight:600; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dark .user-name { color:#fff; }
  .user-email { font-size:11.5px; font-weight:400; color:rgba(60,60,67,0.5); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
  .dark .user-email { color:rgba(235,235,245,0.4); }

  .chevron-icon { width:13px; height:13px; background:rgba(60,60,67,0.28); flex-shrink:0; }
  .dark .chevron-icon { background:rgba(235,235,245,0.28); }

  /* Popups */
  .popup-overlay { position:fixed; inset:0; z-index:200; }

  .popup-box {
    position:fixed; z-index:201; width:210px;
    border-radius:14px; overflow:hidden;
    background:#fff;
    box-shadow:0 8px 30px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08);
    transform-origin: bottom left;
    animation: popInBottomLeft .2s cubic-bezier(0.34,1.56,0.64,1);
  }
  .popup-box.dark { background:#2c2c2e; }

  @keyframes popInBottomLeft {
    from { opacity:0; transform:scale(0.75); }
    to   { opacity:1; transform:scale(1); }
  }

  .popup-sep { height:0.5px; background:rgba(0,0,0,0.08); margin:0 14px; }
  .popup-sep.dark { background:rgba(255,255,255,0.08); }

  .popup-row { width:100%; display:flex; align-items:center; gap:12px; padding:13px 16px; background:none; border:none; cursor:pointer; font-family:-apple-system,BlinkMacSystemFont,sans-serif; transition:background .1s; }
  .popup-row:active { background:rgba(0,0,0,0.04); }
  .popup-row.dark:active { background:rgba(255,255,255,0.05); }

  .popup-row-icon { width:17px; height:17px; background:rgba(60,60,67,0.55); flex-shrink:0; display:block; mask-size:contain; -webkit-mask-size:contain; mask-repeat:no-repeat; -webkit-mask-repeat:no-repeat; mask-position:center; -webkit-mask-position:center; }
  .popup-box.dark .popup-row-icon { background:rgba(235,235,245,0.55); }

  .popup-label { font-size:15px; font-weight:400; color:#000; }
  .popup-label.dark { color:#fff; }

  .popup-section-label { font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:rgba(60,60,67,0.5); padding:12px 16px 6px; }
  .popup-box.dark .popup-section-label { color:rgba(235,235,245,0.4); }

  .apps-popup { width:220px; }
  .apps-list { display:flex; flex-direction:column; padding:4px 8px 8px; gap:2px; }

  .app-row { display:flex; align-items:center; gap:12px; padding:10px 8px; border-radius:10px; border:none; background:transparent; cursor:pointer; text-align:left; transition:background .12s; font-family:-apple-system,BlinkMacSystemFont,sans-serif; width:100%; }
  .app-row:active { background:rgba(47,123,246,0.08); }

  .app-icon-wrap { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .app-img { width:22px; height:22px; border-radius:6px; object-fit:cover; }
  .app-label { flex:1; font-size:14px; font-weight:500; }
  .active-dot { width:7px; height:7px; border-radius:50%; background:#2F7BF6; flex-shrink:0; }

  .icon-mask { display:block; mask-size:contain; -webkit-mask-size:contain; mask-repeat:no-repeat; -webkit-mask-repeat:no-repeat; mask-position:center; -webkit-mask-position:center; flex-shrink:0; }
</style>