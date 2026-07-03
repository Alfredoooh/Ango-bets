<script>
  import { createEventDispatcher } from 'svelte';
  import { getThemeColors } from '$shared/theme.js';
  
  export let isDark = false;
  export let user = null;
  
  const dispatch = createEventDispatcher();
  $: c = getThemeColors(isDark);
  
  const WIDGETS = [
    { id: 'widget_table', label: 'Tabela', icon: 'sheets' },
    { id: 'widget_code', label: 'Código', icon: 'desktop' },
    { id: 'widget_bar', label: 'Gráfico Barras', icon: 'extras' },
    { id: 'widget_pie', label: 'Gráfico Pizza', icon: 'extras' },
    { id: 'widget_sheet', label: 'Folha', icon: 'sheets' },
    { id: 'widget_market', label: 'Mercado', icon: 'flash' },
    { id: 'widget_calendar', label: 'Calendário', icon: 'history' },
    { id: 'widget_timer', label: 'Temporizador', icon: 'record' },
    { id: 'widget_mindmap', label: 'Mapa Mental', icon: 'brain' },
    { id: 'widget_graph', label: 'Gráfico Função', icon: 'find' },
    { id: 'widget_map', label: 'Mapa', icon: 'search_engine' },
  ];
  
  let settings = {};
  try { settings = JSON.parse(localStorage.getItem('ipc_widget_settings_v1') || '{}'); } catch (e) {}
  
  function toggle(id) {
    settings[id] = settings[id] === false ? true : false;
    settings = { ...settings };
    localStorage.setItem('ipc_widget_settings_v1', JSON.stringify(settings));
  }
  
  function isEnabled(id) { return settings[id] !== false; }
</script>

<div class="widgets-root" style="background:{c.background}">
  <div class="topbar">
    <button class="back-btn" style="background:{c.appbarBtnBg}" on:click={()=> dispatch('nav', { to: 'settings' })}>
      <span class="icon-mask" style="mask-image:url('/icons/svg/back_arrow.svg');-webkit-mask-image:url('/icons/svg/back_arrow.svg');background:{c.iconTint};width:20px;height:20px;display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;"></span>
    </button>
    <span class="topbar-title" style="color:{c.textPrimary}">Widgets</span>
    <div style="width:36px"></div>
  </div>
  
  <div class="content">
    <div class="section" style="background:{c.dialogBackground}">
      {#each WIDGETS as w, i}
        <button class="row" on:click={() => toggle(w.id)}>
          <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/{w.icon}.svg');-webkit-mask-image:url('/icons/svg/{w.icon}.svg');background:{c.iconTint};"></span>
          <span class="row-label" style="color:{c.textPrimary}">{w.label}</span>
          <div class="toggle" class:on={isEnabled(w.id)}>
            <div class="toggle-thumb"></div>
          </div>
        </button>
        {#if i < WIDGETS.length - 1}<div class="divider" style="background:{c.divider}"></div>{/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .widgets-root { position: fixed; inset: 0; display: flex; flex-direction: column; overflow: hidden; }
  .topbar { display: flex; align-items: center; justify-content: space-between; padding: 52px 16px 12px; flex-shrink: 0; }
  .back-btn { width: 36px; height: 36px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: opacity 0.15s; }
  .back-btn:active { opacity: 0.6; }
  .topbar-title { font-size: 17px; font-weight: 600; }
  .content { flex: 1; overflow-y: auto; padding: 8px 16px; }
  .section { border-radius: 14px; overflow: hidden; }
  .row { width: 100%; display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: transparent; border: none; cursor: pointer; text-align: left; transition: opacity 0.12s; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  .row:active { opacity: 0.6; }
  .row-icon { width: 20px; height: 20px; flex-shrink: 0; mask-size: contain; -webkit-mask-size: contain; mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat; mask-position: center; -webkit-mask-position: center; }
  .row-label { flex: 1; font-size: 15px; }
  .divider { height: 0.5px; margin: 0 16px; }
  .toggle { width: 44px; height: 26px; border-radius: 13px; background: rgba(120,120,128,0.2); position: relative; flex-shrink: 0; transition: background 0.2s; }
  .toggle.on { background: #34C759; }
  .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s cubic-bezier(0.4,0,0.2,1); }
  .toggle.on .toggle-thumb { transform: translateX(18px); }
  .icon-mask { display: block; mask-size: contain; -webkit-mask-size: contain; mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat; mask-position: center; -webkit-mask-position: center; flex-shrink: 0; }
</style>