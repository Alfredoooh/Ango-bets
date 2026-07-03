<script>
  import { onMount } from 'svelte';
  import { syncTheme, getTheme } from '$shared/theme.js';
  import { requireAuth } from '$shared/auth-guard.js';
  import GamesPage    from './pages/GamesPage.svelte';
  import SettingsPage from './pages/SettingsPage.svelte';

  let route  = 'main';
  let user   = null;
  let isDark = false;
  let ready  = false;

  onMount(() => {
    user = requireAuth();
    if (!user) return;
    const t = getTheme();
    isDark = t === 'dark';
    syncTheme(isDark);
    ready = true;
  });

  function handleNav(e) {
    const { to, data } = e.detail;
    if (data?.isDark !== undefined) {
      isDark = data.isDark;
      localStorage.setItem('nexa_theme', isDark ? 'dark' : 'light');
      syncTheme(isDark);
    }
    if (data?.logout) { localStorage.removeItem('nexa_user'); window.location.href = '/auth/'; return; }
    if (to === 'home') { window.location.href = '/home/'; return; }
    if (to === 'settings') { route = 'settings'; return; }
    if (to === 'main' || to === 'games') { route = 'main'; return; }
  }
</script>

{#if ready}
  {#if route === 'main'}
    <GamesPage    {isDark} {user} on:nav={handleNav} />
  {:else if route === 'settings'}
    <SettingsPage {isDark} {user} on:nav={handleNav} />
  {/if}
{/if}