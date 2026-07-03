<script>
  import { createEventDispatcher } from 'svelte';
  export let open = false;
  export let isDark = false;
  const dispatch = createEventDispatcher();
</script>

{#if open}
  <div class="sheet-overlay" on:click={() => dispatch('close')}></div>
{/if}
<div class="sheet" class:open class:dark={isDark}>
  <div class="sheet-handle"></div>
  <div class="sheet-content">
    <slot />
  </div>
</div>

<style>
  .sheet-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.18);
  }
  .sheet {
    position: fixed; left: 0; right: 0; bottom: 0;
    z-index: 301; border-radius: 20px 20px 0 0;
    background: #fff;
    transform: translateY(100%);
    transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
    max-height: 80dvh; display: flex; flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .sheet.dark { background: #1C1C1E; }
  .sheet.open { transform: translateY(0); }
  .sheet-handle {
    width: 36px; height: 4px; border-radius: 2px;
    background: rgba(120,120,128,0.3); margin: 10px auto 4px; flex-shrink: 0;
  }
  .sheet-content { overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 8px 0 16px; flex: 1; }
</style>