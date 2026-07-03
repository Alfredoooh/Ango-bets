<script>
  import { createEventDispatcher } from 'svelte';
  import { getThemeColors, getTheme } from '$shared/theme.js';
  import { logout } from '$shared/auth-guard.js';

  export let isDark = false;
  export let user   = null;

  const dispatch = createEventDispatcher();
  $: c = getThemeColors(isDark);

  let themeValue = getTheme();
  $: userName    = user?.name || user?.displayName || user?.email || 'Utilizador';
  $: userEmail   = user?.email || '';
  $: userInitial = userName.trim()[0]?.toUpperCase() || 'U';
  const AVATAR_COLORS = ['#FF3B30','#FF9500','#FFCC00','#34C759','#00C7BE','#007AFF','#5856D6','#AF52DE'];
  function getAvatarColor(str) { if(!str)return AVATAR_COLORS[0];let h=0;for(let i=0;i<str.length;i++)h=str.charCodeAt(i)+((h<<5)-h);return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; }
  $: avatarColor = getAvatarColor(userName);

  function setThemeValue(v) {
    themeValue = v;
    localStorage.setItem('nexa_theme', v);
    const dark = v === 'dark' || (v === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    dispatch('nav', { to: 'main', data: { isDark: dark } });
  }
</script>

<div class="settings-root" style="background:{c.background}">
  <div class="topbar">
    <button class="back-btn" style="background:{c.appbarBtnBg}" on:click={() => dispatch('nav', { to: 'main' })}>
      <span class="icon-mask" style="mask-image:url('/icons/svg/back_arrow.svg');-webkit-mask-image:url('/icons/svg/back_arrow.svg');background:{c.iconTint};width:20px;height:20px;display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;"></span>
    </button>
    <span class="topbar-title" style="color:{c.textPrimary}">Definições</span>
    <div style="width:36px"></div>
  </div>
  <div class="content">
    <div class="profile-card" style="background:{c.dialogBackground}">
      <div class="avatar" style="background:{avatarColor}">{userInitial}</div>
      <div class="profile-info">
        <div class="profile-name" style="color:{c.textPrimary}">{userName}</div>
        {#if userEmail}<div class="profile-email" style="color:{c.textSecondary}">{userEmail}</div>{/if}
      </div>
    </div>
    <div class="section-label" style="color:{c.settings_section_label}">Aparência</div>
    <div class="section" style="background:{c.dialogBackground}">
      {#each [['light','Claro'],['dark','Escuro'],['system','Sistema']] as [v, label], i}
        <button class="row" on:click={() => setThemeValue(v)}>
          <span class="row-label" style="color:{c.textPrimary}">{label}</span>
          {#if themeValue === v}<span style="color:#2F7BF6">✓</span>{/if}
        </button>
        {#if i < 2}<div class="divider" style="background:{c.divider}"></div>{/if}
      {/each}
    </div>
    <div class="section-label" style="color:{c.settings_section_label}">Conta</div>
    <div class="section" style="background:{c.dialogBackground}">
      <button class="row" on:click={() => logout()}>
        <span class="row-label" style="color:#FF3B30">Terminar sessão</span>
      </button>
    </div>
  </div>
</div>

<style>
  .settings-root { position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden;transition:background 0.3s; }
  .topbar { display:flex;align-items:center;justify-content:space-between;padding:52px 16px 12px;flex-shrink:0; }
  .back-btn { width:36px;height:36px;border-radius:10px;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity 0.15s; }
  .back-btn:active { opacity:0.6; }
  .topbar-title { font-size:17px;font-weight:600; }
  .content { flex:1;overflow-y:auto;padding:8px 16px; }
  .profile-card { display:flex;align-items:center;gap:14px;padding:16px;border-radius:16px;margin-bottom:24px; }
  .avatar { width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0; }
  .profile-info { display:flex;flex-direction:column;min-width:0; }
  .profile-name { font-size:16px;font-weight:600; }
  .profile-email { font-size:13px;margin-top:2px; }
  .section-label { font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;padding:0 4px 8px; }
  .section { border-radius:14px;overflow:hidden;margin-bottom:24px; }
  .row { width:100%;display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:none;cursor:pointer;text-align:left;font-size:15px;font-family:inherit;transition:opacity 0.12s; }
  .row:active { opacity:0.6; }
  .row-label { flex:1;font-size:15px; }
  .divider { height:0.5px;margin:0 16px; }
  .icon-mask { display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;flex-shrink:0; }
</style>