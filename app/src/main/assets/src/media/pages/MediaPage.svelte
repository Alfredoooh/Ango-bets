<script>
  import { createEventDispatcher } from 'svelte';
  import { getThemeColors } from '$shared/theme.js';
  import { showToast } from '$shared/utils.js';
  import Drawer from '../components/Drawer.svelte';

  export let isDark = false;
  export let user   = null;

  const dispatch = createEventDispatcher();
  $: c = getThemeColors(isDark);

  let drawerOpen = false;
  const menuItems = [
    { icon: 'home_outline', label: 'Início',     action: () => showToast('Em breve') },
    { icon: 'star',         label: 'Favoritos',  action: () => showToast('Em breve') },
    { icon: 'history',      label: 'Recentes',   action: () => showToast('Em breve') },
  ];
</script>

<div class="root" style="background:{c.background};color:{c.textPrimary}">
  <Drawer {isDark} {user} open={drawerOpen} {menuItems}
    on:close={() => drawerOpen=false}
    on:openSettings={() => dispatch('nav', { to: 'settings' })} />

  <div class="appbar" style="border-bottom:0.5px solid {c.divider}">
    <button class="appbar-btn" style="background:{c.appbarBtnBg}" on:click={() => drawerOpen=true}>
      <span class="icon-mask" style="mask-image:url('/icons/svg/menu.svg');-webkit-mask-image:url('/icons/svg/menu.svg');background:{c.iconTint};width:20px;height:20px;display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;"></span>
    </button>
    <span class="appbar-title" style="color:{c.textPrimary}">Media</span>
    <div style="width:36px"></div>
  </div>

  <div class="placeholder">
    <img src="/icons/png/media.png" class="placeholder-icon" alt="Media" />
    <div class="placeholder-title" style="color:{c.textPrimary}">Media</div>
    <div class="placeholder-sub" style="color:{c.textSecondary}">Em desenvolvimento</div>
  </div>
</div>

<style>
  .root { position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden; }
  .appbar { display:flex;align-items:center;justify-content:space-between;padding:52px 16px 12px;flex-shrink:0;background:inherit; }
  .appbar-btn { width:36px;height:36px;border-radius:10px;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity 0.15s; }
  .appbar-btn:active { opacity:0.6; }
  .appbar-title { font-size:17px;font-weight:700; }
  .placeholder { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px; }
  .placeholder-icon { width:72px;height:72px;border-radius:20px;opacity:0.6; }
  .placeholder-title { font-size:22px;font-weight:700; }
  .placeholder-sub { font-size:14px; }
  .icon-mask { display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;flex-shrink:0; }
</style>