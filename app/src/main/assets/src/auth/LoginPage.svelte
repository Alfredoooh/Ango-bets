<script>
  import { createEventDispatcher } from 'svelte';
  import { AuthApiService } from '$shared/api.js';
  import { showToast } from '$shared/utils.js';

  export let isDark = false;
  const dispatch = createEventDispatcher();

  let email = '', password = '', errorMsg = '', loading = false;

  async function handleLogin() {
    errorMsg = '';
    if (!email || !password) { errorMsg = 'Preenche todos os campos.'; return; }
    loading = true;
    try {
      const user = await AuthApiService.login(email, password);
      if (user?.token) {
        localStorage.setItem('nexa_user', JSON.stringify(user));
        dispatch('nav', { to: 'home', data: { user } });
      } else { errorMsg = 'Email ou password incorretos.'; }
    } catch (e) { errorMsg = 'Erro de rede: ' + e.message; }
    loading = false;
  }

  async function handleGoogle() {
    if (!window._firebaseAuth || !window._googleProvider) { showToast('Firebase não carregou.'); return; }
    window._googleProvider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await window._signInWithPopup(window._firebaseAuth, window._googleProvider);
      if (!result?.user) return;
      const idToken = await result.user.getIdToken(true);
      showToast('A verificar conta…');
      const user = await AuthApiService.loginWithGoogle(idToken);
      if (user?.token) {
        localStorage.setItem('nexa_user', JSON.stringify(user));
        dispatch('nav', { to: 'home', data: { user } });
      } else { showToast('Erro no servidor.'); }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        showToast('Erro Google: ' + (err.code || err.message));
      }
    }
  }
</script>

<div class="auth-page" style="background:{isDark ? '#0C0C0F' : '#FFFFFF'}">
  <div class="auth-inner">
    <div class="auth-logo-wrap">
      <img src="/icons/png/logo_1.png" class="auth-logo" alt="Nexa" />
      <div class="auth-title" class:dark={isDark}>Olá,<br><span>bem-vindo</span> de volta.</div>
      <div class="auth-subtitle" class:dark={isDark}>Entra para aceder a todo o conteúdo</div>
    </div>
    <div class="auth-field">
      <input class="auth-input" class:dark={isDark} type="email" placeholder="Email" autocomplete="email" bind:value={email} />
    </div>
    <div class="auth-field">
      <input class="auth-input" class:dark={isDark} type="password" placeholder="Password" autocomplete="current-password" bind:value={password} />
    </div>
    {#if errorMsg}<div class="auth-error">{errorMsg}</div>{/if}
    <button class="auth-btn-primary" disabled={loading} on:click={handleLogin}>
      {loading ? '…' : 'Entrar'}
    </button>
    <div class="auth-divider" class:dark={isDark}>
      <hr /><span>ou continua com</span><hr />
    </div>
    <button class="auth-btn-google" class:dark={isDark} on:click={handleGoogle}>
      <img src="/icons/png/google.png" alt="Google" />
      <span>Google</span>
    </button>
    <div class="auth-switch" class:dark={isDark}>
      Não tens conta? <span class="auth-switch-link" on:click={() => dispatch('nav', { to: 'register' })}>Criar conta</span>
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
  .auth-divider { display: flex; align-items: center; gap: 10px; }
  .auth-divider hr { flex: 1; border: none; border-top: 1px solid #E5E5EA; }
  .auth-divider.dark hr { border-top-color: #2A2A2A; }
  .auth-divider span { font-size: 12px; color: #aaa; white-space: nowrap; }
  .auth-btn-google {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 14px; border-radius: 18px; border: 1px solid #E5E5EA;
    background: #fff; color: #10151c; font-size: 15px; font-weight: 500;
    cursor: pointer; transition: background 0.15s;
  }
  .auth-btn-google.dark { background: #1C1C1E; border-color: #2A2A2A; color: #F2F2F2; }
  .auth-btn-google img { width: 20px; height: 20px; display: block; }
  .auth-btn-google:active { opacity: 0.7; }
  .auth-switch { font-size: 13.5px; color: #888; text-align: center; }
  .auth-switch.dark { color: #666; }
  .auth-switch-link { color: #2F7BF6; font-weight: 600; cursor: pointer; }
</style>