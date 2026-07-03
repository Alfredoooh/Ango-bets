<script>
  import { onMount } from 'svelte';
  import { syncTheme, getTheme } from '$shared/theme.js';
  import { requireAuth } from '$shared/auth-guard.js';
  import ChatPage from './pages/ChatPage.svelte';
  import SettingsPage from './pages/SettingsPage.svelte';
  import WidgetsPage from './pages/WidgetsPage.svelte';
  
  let route = 'chat';
  let user = null;
  let isDark = false;
  let chatMounted = false;
  let ready = false;
  
  onMount(() => {
    user = requireAuth();
    if (!user) return;
    
    const t = getTheme();
    isDark = t === 'dark';
    syncTheme(isDark);
    
    chatMounted = true;
    ready = true;
    
    window.addEventListener('beforeunload', () =>
      localStorage.setItem('nexa_theme', isDark ? 'dark' : 'light'));
  });
  
  function handleNav(e) {
    const { to, data } = e.detail;
    if (data?.isDark !== undefined) {
      isDark = data.isDark;
      localStorage.setItem('nexa_theme', isDark ? 'dark' : 'light');
      syncTheme(isDark);
    }
    if (data?.logout) {
      localStorage.removeItem('nexa_user');
      window.location.href = '/auth/';
      return;
    }
    if (to === 'home') { window.location.href = '/home/'; return; }
    if (to === 'chat' || to === 'ai') { route = 'chat'; return; }
    if (to === 'settings') { route = 'settings'; return; }
    if (to === 'widgets') { route = 'widgets'; return; }
    route = to;
  }
</script>

{#if ready}
  {#if chatMounted}
    <div style="display:{route === 'chat' ? 'contents' : 'none'}">
      <ChatPage {isDark} {user} on:nav={handleNav} />
    </div>
  {/if}
  {#if route === 'settings'}
    <SettingsPage {isDark} {user} on:nav={handleNav} />
  {:else if route === 'widgets'}
    <WidgetsPage  {isDark} {user} on:nav={handleNav} />
  {/if}
{/if}

<style>
  :global(:root) {
    --primary: #2F7BF6;
  }
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }
  :global(html, body) { height: 100%; }
  :global(body) {
    margin: 0; padding: 0; overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  :global(#app) {
    width: 100vw; height: 100dvh;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
  }
</style>