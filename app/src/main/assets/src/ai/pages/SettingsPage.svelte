<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { getThemeColors } from '$shared/theme.js';
  import { AuthApiService } from '$shared/api.js';
  import { showToast } from '$shared/utils.js';
  import { AVAILABLE_LANGUAGES } from '$shared/plans.js';
  import PlansModal from '../components/PlansModal.svelte';

  export let isDark = false;
  export let user   = null;

  const dispatch = createEventDispatcher();

  $: c = getThemeColors(isDark);
  $: credits      = user?.credits ?? 0;
  $: maxCredits   = 100;
  $: creditsPct   = Math.min(Math.max(credits / maxCredits, 0), 1);
  $: creditsColor = credits <= 10 ? '#FF3B30' : credits <= 30 ? '#FF9500' : '#007AFF';
  $: creditsLabel = credits <= 10 ? 'A acabar' : `${credits} créditos`;

  const AVATAR_COLORS = [
    '#FF3B30','#FF9500','#FFCC00','#34C759',
    '#00C7BE','#007AFF','#5856D6','#AF52DE',
    '#FF2D55','#A2845E'
  ];
  function getAvatarColor(str) {
    if (!str) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }
  $: userName    = user?.name || user?.displayName || user?.email || 'U';
  $: userEmail   = user?.email || '';
  $: userInitial = userName.trim()[0]?.toUpperCase() || 'U';
  $: avatarColor = getAvatarColor(userName);

  let loading    = true;
  let loadingMsg = '';
  onMount(() => { setTimeout(() => { loading = false; }, 700); });

  let showThemePicker = false;
  let showLangPicker  = false;
  let showPlansModal  = false;
  let langSearch      = '';
  let currentLanguage = localStorage.getItem('nexa_language') || 'pt';

  let popupPos = { top: 0, right: 0, maxHeight: 340 };

  $: filteredLangs = AVAILABLE_LANGUAGES.filter(l => {
    const f = langSearch.trim().toLowerCase();
    return !f || l.name.toLowerCase().includes(f) || l.native.toLowerCase().includes(f);
  });

  function openPopup(type, event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    popupPos = {
      top:       rect.bottom + 4,
      right:     window.innerWidth - rect.right + 10,
      maxHeight: Math.max(160, spaceBelow)
    };
    if (type === 'theme') { showLangPicker = false; showThemePicker = true; }
    if (type === 'lang')  { langSearch = ''; showThemePicker = false; showLangPicker = true; }
  }

  function setLang(code) {
    currentLanguage = code;
    localStorage.setItem('nexa_language', code);
    showLangPicker = false;
    showToast(`Idioma: ${AVAILABLE_LANGUAGES.find(l => l.code === code)?.name}`);
  }

  async function handleLogout() {
    showThemePicker = false;
    showLangPicker  = false;
    loadingMsg = 'A terminar sessão…';
    loading    = true;
    if (user) await AuthApiService.logout(user.token);
    setTimeout(() => { loading = false; dispatch('logout'); }, 800);
  }
</script>

{#if loading}
  <div class="loader-overlay" class:dark={isDark} transition:fade={{ duration: 200 }}>
    <div class="loader" class:dark={isDark}>
      <div class="bar1"></div><div class="bar2"></div><div class="bar3"></div>
      <div class="bar4"></div><div class="bar5"></div><div class="bar6"></div>
      <div class="bar7"></div><div class="bar8"></div><div class="bar9"></div>
      <div class="bar10"></div><div class="bar11"></div><div class="bar12"></div>
    </div>
    {#if loadingMsg}
      <span class="loading-msg" class:dark={isDark}>{loadingMsg}</span>
    {/if}
  </div>
{/if}

{#if !loading}
<div class="page" class:dark={isDark} transition:fade={{ duration: 180 }}>

  <div class="header">
    <button type="button" class="back-btn" on:click={() => dispatch('close')}>
      <span class="icon-mask" style="mask-image:url('/icons/svg/arrow_left.svg');-webkit-mask-image:url('/icons/svg/arrow_left.svg');width:20px;height:20px;background:{isDark?'#fff':'#000'};"></span>
    </button>
    <span class="header-title">Definições</span>
    <button type="button" class="logout-btn" on:click={handleLogout}>
      <span class="icon-mask" style="mask-image:url('/icons/svg/logout.svg');-webkit-mask-image:url('/icons/svg/logout.svg');width:18px;height:18px;background:#FF3B30"></span>
    </button>
  </div>

  <div class="body">

    <div class="user-block">
      <div class="avatar" style="background:{avatarColor}">{userInitial}</div>
      <div class="user-info">
        <span class="user-name">{userName}</span>
        {#if userEmail && userEmail !== userName}
          <span class="user-email">{userEmail}</span>
        {/if}
      </div>
    </div>

    <div class="section-label">Conta</div>
    <div class="section">
      <button type="button" class="row" on:click={() => showPlansModal = true}>
        <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/tabs.svg');-webkit-mask-image:url('/icons/svg/tabs.svg');"></span>
        <span class="row-label">Planos</span>
        <span class="row-sub">Básico e Premium</span>
      </button>
      <div class="row credits-row">
        <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/clock.svg');-webkit-mask-image:url('/icons/svg/clock.svg');background:{creditsColor};"></span>
        <div class="credits-body">
          <div class="credits-head">
            <span class="row-label" style="flex:none">Saldo</span>
            <span class="credits-val" style="color:{creditsColor}">{creditsLabel}</span>
          </div>
          <div class="progress-track" class:dark={isDark}>
            <div class="progress-fill" style="width:{creditsPct*100}%;background:{creditsColor};box-shadow:0 0 5px {creditsColor}55;"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-label">Preferências</div>
    <div class="section">
      <button type="button" class="row" on:click={(e) => openPopup('theme', e)}>
        <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/appearance.svg');-webkit-mask-image:url('/icons/svg/appearance.svg');"></span>
        <span class="row-label">Aparência</span>
        <span class="row-trail">{isDark ? 'Escuro' : 'Claro'}</span>
      </button>
      <button type="button" class="row" on:click={(e) => openPopup('lang', e)}>
        <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/language.svg');-webkit-mask-image:url('/icons/svg/language.svg');"></span>
        <span class="row-label">Idioma</span>
        <span class="row-trail">{AVAILABLE_LANGUAGES.find(l=>l.code===currentLanguage)?.name || 'Português'}</span>
      </button>
      <button type="button" class="row" on:click={() => showToast('Privacidade em breve')}>
        <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/privacy.svg');-webkit-mask-image:url('/icons/svg/privacy.svg');"></span>
        <span class="row-label">Privacidade</span>
      </button>
      <button type="button" class="row" on:click={() => showToast('Segurança em breve')}>
        <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/security.svg');-webkit-mask-image:url('/icons/svg/security.svg');"></span>
        <span class="row-label">Segurança</span>
      </button>
    </div>

    <div class="section-label">Informação</div>
    <div class="section">
      <button type="button" class="row" on:click={() => showToast('Sobre a app em breve')}>
        <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/about.svg');-webkit-mask-image:url('/icons/svg/about.svg');"></span>
        <span class="row-label">Sobre a app</span>
      </button>
      <button type="button" class="row" on:click={() => showToast('Web & links em breve')}>
        <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/web.svg');-webkit-mask-image:url('/icons/svg/web.svg');"></span>
        <span class="row-label">Web & links</span>
      </button>
      <button type="button" class="row danger" on:click={handleLogout}>
        <span class="icon-mask row-icon" style="mask-image:url('/icons/svg/logout.svg');-webkit-mask-image:url('/icons/svg/logout.svg');background:#FF3B30;"></span>
        <span class="row-label">Terminar sessão</span>
      </button>
    </div>

  </div>
</div>
{/if}

<PlansModal {isDark} {user} open={showPlansModal} on:close={() => showPlansModal=false} />

{#if showThemePicker || showLangPicker}
  <div class="popup-overlay" on:click={() => { showThemePicker=false; showLangPicker=false; }}></div>
{/if}

{#if showThemePicker}
  <div class="popup-box" class:dark={isDark} style="top:{popupPos.top}px;right:{popupPos.right}px;" transition:scale={{ duration:150, start:0.9, opacity:0 }}>
    {#each [[false,'Claro'],[true,'Escuro']] as [dark, label], i}
      {#if i > 0}<div class="popup-sep" class:dark={isDark}></div>{/if}
      <button type="button" class="popup-row" class:dark={isDark} on:click={() => { showThemePicker=false; dispatch('themeChange',{isDark:dark}); }}>
        <span class="popup-label" class:dark={isDark}>{label}</span>
        {#if isDark === dark}
          <span class="icon-mask check-icon" style="mask-image:url('/icons/svg/check.svg');-webkit-mask-image:url('/icons/svg/check.svg');width:16px;height:16px;background:#007AFF;"></span>
        {/if}
      </button>
    {/each}
  </div>
{/if}

{#if showLangPicker}
  <div class="popup-box lang-box" class:dark={isDark} style="top:{popupPos.top}px;right:{popupPos.right}px;max-height:{popupPos.maxHeight}px;" transition:scale={{ duration:150, start:0.9, opacity:0 }}>
    <div class="lang-search-wrap">
      <input class="lang-search" class:dark={isDark} placeholder="Pesquisar idioma..." bind:value={langSearch} readonly on:focus={(e) => e.currentTarget.removeAttribute('readonly')} />
    </div>
    <div class="lang-list">
      {#if !filteredLangs.length}
        <div class="lang-empty" class:dark={isDark}>Nenhum idioma encontrado</div>
      {:else}
        {#each filteredLangs as lang, i}
          {#if i > 0}<div class="popup-sep" class:dark={isDark}></div>{/if}
          <button type="button" class="popup-row" class:dark={isDark} on:click={() => setLang(lang.code)}>
            <div class="lang-info">
              <span class="lang-name" class:dark={isDark} class:active={lang.code === currentLanguage}>{lang.name}</span>
              <span class="lang-native" class:dark={isDark}>{lang.native}</span>
            </div>
            {#if lang.code === currentLanguage}
              <span class="icon-mask check-icon" style="mask-image:url('/icons/svg/check.svg');-webkit-mask-image:url('/icons/svg/check.svg');width:16px;height:16px;background:#007AFF;"></span>
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  .loader-overlay {
    position:fixed; inset:0; z-index:200;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;
    background:#fff;
  }
  .loader-overlay.dark { background:#111; }
  .loader { position:relative; width:32px; height:32px; border-radius:6px; }
  .loader div {
    width:8%; height:24%; background:rgba(0,0,0,0.55);
    position:absolute; left:50%; top:30%; opacity:0;
    border-radius:50px; box-shadow:0 0 3px rgba(0,0,0,0.2);
    animation:fade458 1s linear infinite;
  }
  .loader.dark div { background:rgba(255,255,255,0.55); }
  @keyframes fade458 { from{opacity:1} to{opacity:0.25} }
  .loader .bar1  { transform:rotate(0deg)   translate(0,-130%); animation-delay:0s;    }
  .loader .bar2  { transform:rotate(30deg)  translate(0,-130%); animation-delay:-1.1s; }
  .loader .bar3  { transform:rotate(60deg)  translate(0,-130%); animation-delay:-1s;   }
  .loader .bar4  { transform:rotate(90deg)  translate(0,-130%); animation-delay:-0.9s; }
  .loader .bar5  { transform:rotate(120deg) translate(0,-130%); animation-delay:-0.8s; }
  .loader .bar6  { transform:rotate(150deg) translate(0,-130%); animation-delay:-0.7s; }
  .loader .bar7  { transform:rotate(180deg) translate(0,-130%); animation-delay:-0.6s; }
  .loader .bar8  { transform:rotate(210deg) translate(0,-130%); animation-delay:-0.5s; }
  .loader .bar9  { transform:rotate(240deg) translate(0,-130%); animation-delay:-0.4s; }
  .loader .bar10 { transform:rotate(270deg) translate(0,-130%); animation-delay:-0.3s; }
  .loader .bar11 { transform:rotate(300deg) translate(0,-130%); animation-delay:-0.2s; }
  .loader .bar12 { transform:rotate(330deg) translate(0,-130%); animation-delay:-0.1s; }
  .loading-msg { font-size:13px; font-weight:400; color:rgba(60,60,67,.5); font-family:-apple-system,sans-serif; letter-spacing:-.1px; }
  .loading-msg.dark { color:rgba(235,235,245,.4); }

  .page { position:fixed; inset:0; z-index:150; display:flex; flex-direction:column; background:#fff; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
  .page.dark { background:#111; }

  .header { display:flex; align-items:center; gap:8px; padding:16px 16px 10px; padding-top:calc(16px + env(safe-area-inset-top)); flex-shrink:0; }
  .header-title { flex:1; font-size:17px; font-weight:600; color:#000; text-align:center; letter-spacing:-.3px; }
  .page.dark .header-title { color:#fff; }
  .back-btn, .logout-btn { width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:none; border:none; cursor:pointer; border-radius:50%; transition:background .12s; }
  .back-btn:active { background:rgba(0,0,0,.06); }
  .logout-btn:active { background:rgba(255,59,48,.08); }
  .page.dark .back-btn:active { background:rgba(255,255,255,.08); }

  .body { flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; padding:8px 0 40px; display:flex; flex-direction:column; }

  .user-block { display:flex; align-items:center; gap:12px; padding:16px 20px 20px; }
  .avatar { width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700; color:#fff; flex-shrink:0; }
  .user-info { display:flex; flex-direction:column; min-width:0; }
  .user-name { font-size:16px; font-weight:600; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .page.dark .user-name { color:#fff; }
  .user-email { font-size:13px; color:rgba(60,60,67,.5); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
  .page.dark .user-email { color:rgba(235,235,245,.4); }

  .section-label { font-size:11.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:rgba(60,60,67,.5); padding:16px 20px 6px; }
  .page.dark .section-label { color:rgba(235,235,245,.4); }
  .section { display:flex; flex-direction:column; padding:0 12px; }

  .row { width:100%; display:flex; align-items:center; gap:13px; padding:13px 10px; background:transparent; border:none; cursor:pointer; text-align:left; border-radius:10px; -webkit-user-select:none; user-select:none; transition:background .12s; color:#000; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif; }
  .page.dark .row { color:#fff; }
  .row:active { background:rgba(0,0,0,.05); }
  .page.dark .row:active { background:rgba(255,255,255,.06); }
  .row.danger { color:#FF3B30; }
  .row-icon { width:17px; height:17px; background:rgba(60,60,67,.55); flex-shrink:0; display:block; mask-size:contain; -webkit-mask-size:contain; mask-repeat:no-repeat; -webkit-mask-repeat:no-repeat; mask-position:center; -webkit-mask-position:center; }
  .page.dark .row-icon { background:rgba(235,235,245,.55); }
  .danger .row-icon { background:#FF3B30 !important; }
  .row-label { flex:1; font-size:15px; font-weight:400; min-width:0; }
  .row.danger .row-label { color:#FF3B30; }
  .row-sub   { font-size:13px; color:rgba(60,60,67,.45); flex-shrink:0; }
  .row-trail { font-size:13px; color:rgba(60,60,67,.45); flex-shrink:0; }
  .page.dark .row-sub, .page.dark .row-trail { color:rgba(235,235,245,.35); }

  .credits-row { align-items:center; cursor:default; }
  .credits-row:active { background:transparent !important; }
  .credits-body { flex:1; display:flex; flex-direction:column; gap:7px; min-width:0; }
  .credits-head { display:flex; align-items:center; justify-content:space-between; }
  .credits-val  { font-size:13px; font-weight:600; flex-shrink:0; }
  .progress-track { height:4px; border-radius:10px; background:rgba(0,0,0,.08); overflow:hidden; }
  .progress-track.dark { background:rgba(255,255,255,.1); }
  .progress-fill { height:100%; border-radius:10px; transition:width .6s cubic-bezier(.34,1.56,.64,1); min-width:4px; }

  .popup-overlay { position:fixed; inset:0; z-index:160; }
  .popup-box { position:fixed; z-index:161; width:200px; border-radius:14px; overflow:hidden; background:#fff; box-shadow:0 8px 30px rgba(0,0,0,.16),0 2px 8px rgba(0,0,0,.08); transform-origin:top right; }
  .popup-box.dark { background:#2c2c2e; }
  .popup-sep { height:.5px; background:rgba(0,0,0,.08); margin:0 14px; }
  .popup-sep.dark { background:rgba(255,255,255,.08); }
  .popup-row { width:100%; display:flex; align-items:center; justify-content:space-between; padding:13px 16px; background:none; border:none; cursor:pointer; font-family:inherit; transition:background .1s; }
  .popup-row:active { background:rgba(0,0,0,.04); }
  .popup-row.dark:active { background:rgba(255,255,255,.05); }
  .popup-label { font-size:15px; font-weight:400; color:#000; }
  .popup-label.dark { color:#fff; }

  .lang-box { width:240px; display:flex; flex-direction:column; overflow:hidden; }
  .lang-search-wrap { padding:10px 12px 8px; flex-shrink:0; }
  .lang-search { width:100%; border:none; outline:none; border-radius:8px; padding:8px 11px; font-size:14px; font-family:inherit; background:rgba(0,0,0,.05); color:#000; box-sizing:border-box; }
  .lang-search.dark { background:rgba(255,255,255,.08); color:#fff; }
  .lang-search::placeholder { color:rgba(60,60,67,.4); }
  .lang-search.dark::placeholder { color:rgba(235,235,245,.3); }
  .lang-list { overflow-y:auto; flex:1; -webkit-overflow-scrolling:touch; padding-bottom:env(safe-area-inset-bottom,8px); }
  .lang-empty { padding:16px; text-align:center; font-size:13px; color:rgba(60,60,67,.4); }
  .lang-empty.dark { color:rgba(235,235,245,.3); }
  .lang-info { display:flex; flex-direction:column; text-align:left; }
  .lang-name { font-size:15px; font-weight:400; color:#000; }
  .lang-name.dark { color:#fff; }
  .lang-name.active { color:#007AFF; font-weight:600; }
  .lang-native { font-size:12px; color:rgba(60,60,67,.5); margin-top:1px; }
  .lang-native.dark { color:rgba(235,235,245,.35); }

  .icon-mask { display:block; mask-size:contain; -webkit-mask-size:contain; mask-repeat:no-repeat; -webkit-mask-repeat:no-repeat; mask-position:center; -webkit-mask-position:center; flex-shrink:0; }
  .check-icon { background:#007AFF; }
</style>