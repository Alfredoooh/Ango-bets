<script>
  import { onMount } from 'svelte';
  import { syncTheme, getTheme } from '$shared/theme.js';
  import { getUser } from '$shared/auth-guard.js';
  import LoginPage from './LoginPage.svelte';
  import RegisterPage from './RegisterPage.svelte';
  
  let route = 'login';
  let isDark = false;
  
  onMount(() => {
    const user = getUser();
    if (user?.token) { window.location.href = '/home/'; return; }
    const t = getTheme();
    isDark = t === 'dark';
    syncTheme(isDark);
  });
  
  function handleNav(e) {
    const { to, data } = e.detail;
    if (to === 'register') { route = 'register'; return; }
    if (to === 'login') { route = 'login'; return; }
    if (to === 'home' || to === 'chat') {
      if (data?.user) localStorage.setItem('nexa_user', JSON.stringify(data.user));
      window.location.href = '/home/';
    }
  }
</script>

{#if route === 'login'}
  <LoginPage    {isDark} on:nav={handleNav} />
{:else if route === 'register'}
  <RegisterPage {isDark} on:nav={handleNav} />
{/if}