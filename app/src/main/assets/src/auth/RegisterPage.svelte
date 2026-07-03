<script>
  import { createEventDispatcher } from 'svelte';
  import { AuthApiService } from '$shared/api.js';

  export let isDark = false;
  const dispatch = createEventDispatcher();

  let name = '', email = '', password = '', errorMsg = '', loading = false;

  async function handleRegister() {
    errorMsg = '';
    if (!name || !email || !password) { errorMsg = 'Preenche todos os campos.'; return; }
    if (password.length < 6) { errorMsg = 'Password deve ter pelo menos 6 caracteres.'; return; }
    loading = true;
    try {
      const user = await AuthApiService.register(name, email, password);
      if (user?.token) {
        localStorage.setItem('nexa_user', JSON.stringify(user));
        try { sessionStorage.setItem('nexa_just_registered', '1'); } catch(e) {}
        dispatch('nav', { to: 'home', data: { user } });
      } else { errorMsg = 'Erro ao criar conta.'; }
    } catch (e) { errorMsg = e.message; }
    loading = false;
  }
</script>

<div class="auth-page" style="background:{isDark ? '#0C0C0F' : '#FFFFFF'}">
  <div class="auth-inner">
    <div class="auth-logo-wrap">
      <img src="/icons/png/logo_1.png" class="auth-logo" alt="Nexa" />
      <div class="auth-title" class:dark={isDark}>Criar<br><span>conta</span> nova.</div>
      <div class="auth-subtitle" class:dark={isDark}>Junta-te à Nexa hoje</div>
    </div>
    <div class="auth-field">
      <input class="auth-input" class:dark={isDark} type="text" placeholder="Nome" autocomplete="name" bind:value={name} />
    </div>
    <div class="auth-field">
      <input class="auth-input" class:dark={isDark} type="email" placeholder="Email" autocomplete="email" bind:value={email} />
    </div>
    <div class="auth-field">
      <input class="auth-input" class:dark={isDark} type="password" placeholder="Password" autocomplete="new-password" bind:value={password} />
    </div>
    {#if errorMsg}<div class="auth-error">{errorMsg}</div>{/if}
    <button class="auth-btn-primary" disabled={loading} on:click={handleRegister}>
      {loading ? '…' : 'Criar conta'}
    </button>
    <div class="auth-switch" class:dark={isDark}>
      Já tens conta? <span class="auth-switch-link" on:click={() => dispatch('nav', { to: 'login' })}>Entrar</span>
    </div>
  </div>
</div>

<style>
  .auth-page {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    transition: background 0.3s;
  }
  .auth-inner {
    width: 100%; max-width: 380px; padding: 32px 28px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .auth-logo-wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
  .auth-logo { width: 56px; height: 56px; border-radius: 50%; display: block; }
  .auth-title { font-size: 26px; font-weight: 700; color: #10151c; line-height: 1.25; letter-spacing: -0.5px; }
  .auth-title.dark { color: #F2F2F2; }
  .auth-title span { color: #2F7BF6; }
  .auth-subtitle { font-size: 14px; color: #888; margin-top: -4px; }
  .auth-subtitle.dark { color: #666; }
  .auth-field { display: flex; flex-direction: column; }
  .auth-input {
    padding: 14px 16px; border-radius: 16px; border: none; outline: none;
    font-size: 15px; background: #F2F2F7; color: #10151c;
    -webkit-user-select: text; user-select: text;
    transition: background 0.2s;
  }
  .auth-input.dark { background: #2C2C2E; color: #F2F2F2; }
  .auth-input::placeholder { color: #aaa; }
  .auth-error { font-size: 13px; color: #FF3B30; text-align: center; }
  .auth-btn-primary {
    padding: 15px; border-radius: 18px; border: none; background: #2F7BF6;
    color: #fff; font-size: 16px; font-weight: 600; cursor: pointer;
    transition: opacity 0.15s;
  }
  .auth-btn-primary:active { opacity: 0.8; }
  .auth-btn-primary:disabled { opacity: 0.5; }
  .auth-switch { font-size: 13.5px; color: #888; text-align: center; }
  .auth-switch.dark { color: #666; }
  .auth-switch-link { color: #2F7BF6; font-weight: 600; cursor: pointer; }
</style>