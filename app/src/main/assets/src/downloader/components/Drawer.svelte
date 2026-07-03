<script>
  import { createEventDispatcher } from 'svelte';
  import { getThemeColors } from '$shared/theme.js';
  import AppsPopup from './AppsPopup.svelte';

  export let isDark = false;
  export let user = null;
  export let open = false;
  export let menuItems = [];

  const dispatch = createEventDispatcher();
  $: c = getThemeColors(isDark);

  let appsPopupOpen = false;
  const AVATAR_COLORS = ['#FF3B30','#FF9500','#FFCC00','#34C759','#00C7BE','#007AFF','#5856D6','#AF52DE'];
  function getAvatarColor(str) { if (!str) return AVATAR_COLORS[0]; let hash=0; for(let i=0;i<str.length;i++)hash=str.charCodeAt(i)+((hash<<5)-hash); return AVATAR_COLORS[Math.abs(hash)%AVATAR_COLORS.length]; }

  $: userName    = user?.name || user?.displayName || user?.email || 'U';
  $: userEmail   = user?.email || '';
  $: userInitial = userName.trim()[0]?.toUpperCase() || 'U';
  $: avatarColor = getAvatarColor(userName);

  function closeDrawer() { dispatch('close'); }
  function openSettings() { dispatch('openSettings'); closeDrawer(); }
  function triggerItem(item) { if(!item||item.disabled)return; item.action?.(); if(!item.keepOpen)closeDrawer(); }
</script>

<AppsPopup {isDark} open={appsPopupOpen} currentAppId="downloader" on:close={() => appsPopupOpen=false} />
<div class="overlay" class:open on:click|self={closeDrawer}></div>
<div class="drawer" class:open class:dark={isDark}>
  <div class="header">
    <span class="header-title" style="color:{c.textPrimary}">Downloader</span>
    <button class="apps-btn" style="background:{c.appbarBtnBg}" on:click={() => appsPopupOpen=true}>
      <span class="icon-mask" style="mask-image:url('/icons/svg/apps.svg');-webkit-mask-image:url('/icons/svg/apps.svg');background:{c.iconTint};width:20px;height:20px;display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;"></span>
    </button>
  </div>
  <div class="body">
    <div class="section">
      {#each menuItems as item}
        <button type="button" class="row" class:danger={item.danger} on:click={() => triggerItem(item)}>
          {#if item.icon}<span class="icon-mask row-icon" style="mask-image:url('/icons/svg/{item.icon}.svg');-webkit-mask-image:url('/icons/svg/{item.icon}.svg');"></span>{/if}
          <span class="row-label">{item.label}</span>
        </button>
      {/each}
    </div>
  </div>
  {#if user}
    <button type="button" class="user-footer" class:dark={isDark} on:click={openSettings}>
      <div class="avatar" style="background:{avatarColor}">{userInitial}</div>
      <div class="user-info">
        <span class="user-name" style="color:{c.textPrimary}">{userName}</span>
        {#if userEmail && userEmail !== userName}<span class="user-email" style="color:{c.textSecondary}">{userEmail}</span>{/if}
      </div>
    </button>
  {/if}
</div>

<style>
  .overlay { position:fixed;inset:0;z-index:100;opacity:0;pointer-events:none;background:rgba(0,0,0,0.18);transition:opacity .28s ease; }
  .overlay.open { opacity:1;pointer-events:auto; }
  .drawer { position:fixed;top:0;left:0;bottom:0;width:78vw;max-width:320px;z-index:101;display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .3s cubic-bezier(0.4,0,0.2,1);background:#fff;border-right:0.5px solid rgba(0,0,0,0.09); }
  .drawer.dark { background:#111;border-right-color:rgba(255,255,255,0.07); }
  .drawer.open { transform:translateX(0); }
  .header { padding:52px 16px 10px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between; }
  .header-title { font-size:26px;font-weight:700;letter-spacing:-0.5px; }
  .apps-btn { width:36px;height:36px;border-radius:10px;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity 0.15s; }
  .apps-btn:active { opacity:0.6; }
  .body { flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 0 16px; }
  .section { display:flex;flex-direction:column;padding:0 12px; }
  .row { width:100%;display:flex;align-items:center;gap:13px;padding:13px 10px;background:transparent;border:none;cursor:pointer;text-align:left;border-radius:10px;transition:background .12s;color:#000;font-family:-apple-system,BlinkMacSystemFont,sans-serif; }
  .dark .row { color:#fff; }
  .row:active { background:rgba(0,0,0,0.05); }
  .dark .row:active { background:rgba(255,255,255,0.06); }
  .row.danger { color:#FF3B30; }
  .row-icon { width:18px;height:18px;background:rgba(60,60,67,0.55);flex-shrink:0;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center; }
  .dark .row-icon { background:rgba(235,235,245,0.55); }
  .row-label { flex:1;font-size:15px;font-weight:400; }
  .user-footer { position:relative;z-index:102;flex-shrink:0;display:flex;align-items:center;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:0.5px solid rgba(0,0,0,0.07);border-left:none;border-right:none;border-bottom:none;background:#fff;width:100%;cursor:pointer;text-align:left;transition:background .12s; }
  .user-footer:active { background:rgba(0,0,0,0.04); }
  .user-footer.dark { border-top-color:rgba(255,255,255,0.07);background:#111; }
  .avatar { width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0; }
  .user-info { display:flex;flex-direction:column;min-width:0;flex:1; }
  .user-name { font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .user-email { font-size:11.5px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px; }
  .icon-mask { display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;flex-shrink:0; }
</style>