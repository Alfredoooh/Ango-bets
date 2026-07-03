<script>
  import { createEventDispatcher } from 'svelte';
  import { ALL_APPS } from '$shared/plans.js';
  import { getThemeColors } from '$shared/theme.js';
  
  export let isDark = false;
  export let open = false;
  export let currentAppId = 'ProfileLens';
  
  const dispatch = createEventDispatcher();
  $: c = getThemeColors(isDark);
  
  function navigate(app) {
    dispatch('close');
    if (app.id === currentAppId) return;
    window.location.href = app.path;
  }
</script>

{#if open}
  <div class="overlay" on:click={() => dispatch('close')}></div>
  <div class="popup" class:dark={isDark} style="background:{c.dialogBackground};border-color:{c.divider}">
    <div class="popup-title" style="color:{c.textSecondary}">Plataformas</div>
    <div class="apps-list">
      {#each ALL_APPS as app}
        <button class="app-row" class:active={app.id === currentAppId} style="color:{app.id === currentAppId ? '#2F7BF6' : c.textPrimary}" on:click={() => navigate(app)}>
          <div class="app-icon-wrap" style="background:{isDark ? '#2C2C2E' : '#F0F0F5'}">
            {#if app.icon.endsWith('.svg')}
              <span class="icon-mask" style="mask-image:url('{app.icon}');-webkit-mask-image:url('{app.icon}');background:{app.id === currentAppId ? '#2F7BF6' : c.iconTint};width:20px;height:20px;display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;"></span>
            {:else}
              <img src={app.icon} class="app-img" alt={app.label} />
            {/if}
          </div>
          <span class="app-label">{app.label}</span>
          {#if app.id === currentAppId}<span class="active-dot"></span>{/if}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.15); }
  .popup { position: fixed; top: 108px; left: 16px; width: 220px; z-index: 201; border-radius: 16px; border: 1px solid; box-shadow: 0 8px 32px rgba(0,0,0,0.18); overflow: hidden; animation: popIn 0.18s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes popIn { from { opacity: 0; transform: scale(0.92) translateY(-8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .popup-title { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 12px 16px 6px; }
  .apps-list { display: flex; flex-direction: column; padding: 4px 8px 8px; gap: 2px; }
  .app-row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 10px; border: none; background: transparent; cursor: pointer; text-align: left; transition: background 0.12s; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  .app-row:active { background: rgba(47,123,246,0.08); }
  .app-icon-wrap { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .app-img { width: 22px; height: 22px; border-radius: 6px; object-fit: cover; }
  .app-label { flex: 1; font-size: 14px; font-weight: 500; }
  .active-dot { width: 7px; height: 7px; border-radius: 50%; background: #2F7BF6; flex-shrink: 0; }
</style>