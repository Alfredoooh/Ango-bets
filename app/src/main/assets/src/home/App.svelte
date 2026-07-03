<script>
  import { onMount, tick } from 'svelte';
  import { requireAuth, logout } from '$shared/auth-guard.js';
  import { ALL_APPS } from '$shared/plans.js';
  import { getTheme, syncTheme } from '$shared/theme.js';

  let user = null;
  $: userName = user?.name || user?.displayName || user?.email || 'Utilizador';
  $: userInitial = userName.trim()[0]?.toUpperCase() || 'U';

  const AVATAR_COLORS = ['#FF3B30','#FF9500','#FFCC00','#34C759','#00C7BE','#007AFF','#5856D6','#AF52DE'];
  function getAvatarColor(str) {
    if (!str) return AVATAR_COLORS[0];
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  $: avatarColor = getAvatarColor(userName);

  const platformApps = ALL_APPS.filter(a => a.id !== 'home');
  $: topApps = platformApps.slice(0, 3);
  $: bottomApps = platformApps.slice(3, 6);

  const MODELS = [
    { id: 'mistral-nemo',    label: 'Nemo',     sublabel: 'mistral-nemo'    },
    { id: 'deepseek-v4',     label: 'DeepSeek', sublabel: 'deepseek-v4'     },
    { id: 'deepseek-v4-pro', label: 'DS Pro',   sublabel: 'deepseek-v4-pro' },
  ];
  let currentModelId = MODELS[0].id;
  $: currentModel = MODELS.find(m => m.id === currentModelId) ?? MODELS[0];

  let themeValue = 'dark';
  let isDark = true;

  function resolveIsDark(v) {
    return v === 'dark' || (v === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function applyThemeValue(v, persist = true) {
    themeValue = v;
    isDark = resolveIsDark(v);
    if (persist) localStorage.setItem('nexa_theme', v);
    syncTheme(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  let mediaQuery;
  function handleSystemChange() {
    if (themeValue === 'system') applyThemeValue('system', false);
  }

  let drawerOpen = false;
  let drawerVisible = false;
  let themeExpanded = false;

  async function openDrawer() {
    if (drawerOpen) return;
    drawerOpen = true;
    drawerVisible = false;
    themeExpanded = false;
    await tick();
    requestAnimationFrame(() => {
      drawerVisible = true;
    });
  }
  function closeDrawer() {
    drawerVisible = false;
    themeExpanded = false;
    setTimeout(() => {
      drawerOpen = false;
    }, 280);
  }
  function toggleThemeExpanded() {
    themeExpanded = !themeExpanded;
  }

  const THEME_OPTIONS = [
    { id: 'dark', label: 'Escuro' },
    { id: 'light', label: 'Claro' },
    { id: 'system', label: 'Predefinição do sistema' },
  ];

  const DRAWER_ITEMS = [
    { icon: 'settings', label: 'Definições', action: () => {} },
    { icon: 'help', label: 'Ajuda', action: () => {} },
  ];

  function openApp(app) {
    if (app.id === 'ai') {
      try { sessionStorage.removeItem('nexa_pending_message'); } catch(e) {}
    }
    window.location.href = app.path;
  }

  function goToPlans() {
    window.location.href = '/plans';
  }

  const POPUP_W = 230;
  let showPopup = false;
  let popupVisible = false;
  let popupMode = '';
  let popupPos = { bottom: 0, left: 0 };
  let popupFading = false;
  let flashMode = false;
  let thinkMoreMode = false;
  let sheetsEnabled = false;

  function openPopup(mode, event) {
    popupMode = mode;
    const rect = event.currentTarget.getBoundingClientRect();
    const M = 12;
    let left = rect.left - 8;
    if (left + POPUP_W > window.innerWidth - M) left = window.innerWidth - POPUP_W - M;
    if (left < M) left = M;
    popupPos = { bottom: window.innerHeight - rect.top + 8, left };
    showPopup = true;
    requestAnimationFrame(() => requestAnimationFrame(() => { popupVisible = true; }));
  }
  function closePopup() {
    popupVisible = false;
    setTimeout(() => {
      showPopup = false;
      popupMode = '';
    }, 220);
  }
  function switchPopup(mode) {
    popupFading = true;
    setTimeout(() => { popupMode = mode; popupFading = false; }, 130);
  }

  let lottieEl;
  let lottieInstance;
  let lottieFinished = false;
  let togglesVisible = false;
  let shouldPlayLottie = false;

  const SUGGESTION_TOGGLES = [
    {
      id: 'image',
      label: 'Cria uma imagem',
      prompt: 'Cria uma imagem de ',
      icon: '/icons/svg/bw/image.svg',
    },
    {
      id: 'story',
      label: 'Conta uma história',
      prompt: 'Conta-me uma história sobre ',
      icon: '/icons/svg/bw/open_book.svg',
    },
    {
      id: 'math',
      label: 'Resolve um problema',
      prompt: 'Resolve este problema matemático: ',
      icon: '/icons/svg/bw/math.svg',
    },
    {
      id: 'search',
      label: 'Procure na web',
      prompt: 'Procura por ',
      icon: '/icons/svg/bw/browser.svg',
    },
    {
      id: 'slides',
      label: 'Cria slides',
      prompt: 'Cria uma apresentação de slides sobre ',
      icon: '/icons/svg/bw/slides.svg',
    },
    {
      id: 'pdf',
      label: 'Analisa um PDF',
      prompt: 'Analisa este PDF: ',
      icon: '/icons/svg/bw/pdf.svg',
    },
  ];

  let activeToggle = null;

  function selectToggle(t) {
    activeToggle = activeToggle?.id === t.id ? null : t;
    if (activeToggle) {
      inputText = activeToggle.prompt;
      setTimeout(() => {
        if (textInputEl) {
          autoResize();
          textInputEl.focus();
          textInputEl.setSelectionRange(inputText.length, inputText.length);
        }
      }, 80);
    } else {
      inputText = '';
      setTimeout(autoResize, 10);
    }
  }

  async function loadLottie() {
    if (typeof window === 'undefined') return;
    if (!window.lottie) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      }).catch(() => {});
    }
    if (window.lottie && lottieEl) {
      lottieInstance = window.lottie.loadAnimation({
        container: lottieEl,
        renderer: 'canvas',
        loop: false,
        autoplay: true,
        path: '/icons/lottie/welcome.json',
      });
      lottieInstance.addEventListener('complete', () => {
        lottieFinished = true;
        setTimeout(() => { togglesVisible = true; }, 60);
      });
    }
  }

  let inputText = '';
  let textInputEl;
  function autoResize() {
    if (!textInputEl) return;
    textInputEl.style.height = 'auto';
    textInputEl.style.height = Math.min(textInputEl.scrollHeight, 150) + 'px';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      const mob = window.matchMedia('(hover:none) and (pointer:coarse)').matches;
      if (!mob && !e.shiftKey) {
        e.preventDefault();
        if (inputText.trim()) navigateToAI();
      }
    }
  }

  function navigateToAI() {
    const text = inputText.trim();
    if (!text) return;
    const ai = ALL_APPS.find(x => x.id === 'ai');
    if (!ai) return;
    try {
      sessionStorage.setItem('nexa_pending_message', text);
      sessionStorage.setItem('nexa_model', currentModelId);
    } catch(e) {}
    window.location.href = ai.path;
  }

  let searchSuggestions = [];
  let suggestLoading = false;
  let suggestDebounce;
  let abortSuggest;

  $: showSuggestBox = !!inputText.trim() && !isRecording;
  $: scheduleSuggestFetch(inputText);

  function scheduleSuggestFetch(text) {
    clearTimeout(suggestDebounce);
    const q = (text || '').trim();
    if (!q) {
      abortSuggest?.abort();
      searchSuggestions = [];
      suggestLoading = false;
      return;
    }
    suggestDebounce = setTimeout(() => fetchSuggestions(q), 250);
  }

  async function fetchSuggestions(q) {
    abortSuggest?.abort();
    abortSuggest = new AbortController();
    suggestLoading = true;

    const googleUrl = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-PT&gl=ao&q=${encodeURIComponent(q)}`;

    try {
      const res = await fetch(googleUrl, {
        signal: abortSuggest.signal,
        mode: 'cors',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('google suggest http ' + res.status);
      const data = await res.json();

      let raw = [];
      if (Array.isArray(data) && Array.isArray(data[1])) raw = data[1];
      else if (data?.[1] && Array.isArray(data[1])) raw = data[1];

      if (inputText.trim() !== q) return;
      searchSuggestions = raw.filter(Boolean).slice(0, 6);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        try {
          const fallbackUrl = `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`;
          const res2 = await fetch(fallbackUrl, {
            signal: abortSuggest.signal,
            mode: 'cors',
            cache: 'no-store',
          });
          if (!res2.ok) throw new Error('fallback suggest http ' + res2.status);
          const data2 = await res2.json();
          if (inputText.trim() !== q) return;
          searchSuggestions = (Array.isArray(data2) ? data2.map(x => x?.phrase).filter(Boolean) : []).slice(0, 6);
        } catch {
          searchSuggestions = [];
        }
      }
    } finally {
      suggestLoading = false;
    }
  }

  function fillSuggestion(s) {
    inputText = s;
    searchSuggestions = [];
    setTimeout(() => {
      autoResize();
      textInputEl?.focus();
      textInputEl?.setSelectionRange(inputText.length, inputText.length);
    }, 10);
  }

  function useSuggestion(s) {
    inputText = s;
    setTimeout(navigateToAI, 10);
  }

  let mediaRecorder = null, audioChunks = [], isRecording = false;
  let waveCtx = null, waveAnalyser = null, waveSource = null, waveStream = null;
  let waveAnimFrame = null, recSeconds = 0, recInterval = null, recCanvasEl;
  let wavePhase = 0;

  $: recTimerStr = (() => {
    const m = Math.floor(recSeconds / 60), s = recSeconds % 60;
    return `${m}:${s.toString().padStart(2,'0')}`;
  })();

  async function startRecording() {
    if (isRecording) return;
    try {
      waveStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      waveCtx = new (window.AudioContext || window.webkitAudioContext)();
      waveAnalyser = waveCtx.createAnalyser();
      waveAnalyser.fftSize = 1024;
      waveAnalyser.smoothingTimeConstant = 0.25;
      waveAnalyser.minDecibels = -110;
      waveAnalyser.maxDecibels = -5;
      const gain = waveCtx.createGain();
      gain.gain.value = 6;
      waveSource = waveCtx.createMediaStreamSource(waveStream);
      waveSource.connect(gain);
      gain.connect(waveAnalyser);

      audioChunks = [];
      mediaRecorder = new MediaRecorder(waveStream);
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      mediaRecorder.onstop = handleRecStop;
      mediaRecorder.start();

      isRecording = true;
      recSeconds = 0;
      recInterval = setInterval(() => recSeconds++, 1000);
      startWaveAnim();
    } catch(err) {
      console.error('Mic:', err);
    }
  }

  function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false;
    clearInterval(recInterval);
    mediaRecorder.stop();
    waveStream?.getTracks().forEach(t => t.stop());
    stopWaveAnim();
  }

  function cancelRecording() {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false;
    clearInterval(recInterval);
    mediaRecorder.onstop = null;
    mediaRecorder.stop();
    waveStream?.getTracks().forEach(t => t.stop());
    audioChunks = [];
    stopWaveAnim();
  }

  async function handleRecStop() {
    if (!audioChunks.length) return;
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    audioChunks = [];
    try {
      const form = new FormData();
      form.append('file', blob, 'audio.webm');
      form.append('language', 'pt');
      const res = await fetch('https://ipc.alfredoooh.workers.dev/ai/transcribe', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + (user?.token || '') },
        body: form
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const text = (data.text || '').trim();
      if (text) {
        inputText = (inputText ? inputText + ' ' : '') + text;
        setTimeout(autoResize, 10);
      }
    } catch(e) {
      console.error('Transcribe:', e);
    }
  }

  function startWaveAnim() {
    const N = 5;
    const bh = new Array(N).fill(0);

    function frame() {
      if (!recCanvasEl) return;
      waveAnimFrame = requestAnimationFrame(frame);
      const c = recCanvasEl, dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w * dpr || c.height !== h * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,w,h);

      let bands = new Array(N).fill(0.08);
      if (waveAnalyser) {
        const freq = new Uint8Array(waveAnalyser.frequencyBinCount);
        waveAnalyser.getByteFrequencyData(freq);
        const L = freq.length;
        const def = [
          [0, Math.floor(L * .04)],
          [Math.floor(L * .04), Math.floor(L * .10)],
          [Math.floor(L * .10), Math.floor(L * .25)],
          [Math.floor(L * .25), Math.floor(L * .50)],
          [Math.floor(L * .50), Math.floor(L * .80)]
        ];
        bands = def.map(([s,e]) => {
          const sl = [...freq].slice(s,e);
          return Math.pow(sl.reduce((a,b)=>a+b,0)/sl.length/255,0.5);
        });
      } else {
        wavePhase += 0.04;
        bands = [0,1,2,3,4].map(i => 0.06 + Math.abs(Math.sin(wavePhase * 1.2 + i * 0.8)) * 0.18);
      }

      for (let i=0; i<N; i++) bh[i] += (bands[i] - bh[i]) * (bands[i] > bh[i] ? 0.65 : 0.12);
      const bw = 3.5, gap = 5, tw = N * bw + (N - 1) * gap, sx = (w - tw) / 2, cy = h / 2, mh = h * 0.72;

      for (let i=0; i<N; i++) {
        const bhi = Math.max(4, bh[i] * mh), x = sx + i * (bw + gap), y = cy - bhi / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bhi, bw / 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      }
      wavePhase += 0.02;
    }
    frame();
  }

  function stopWaveAnim() {
    if (waveAnimFrame) {
      cancelAnimationFrame(waveAnimFrame);
      waveAnimFrame = null;
    }
    if (waveSource) {
      try { waveSource.disconnect(); } catch(e) {}
      waveSource = null;
    }
    if (waveCtx) {
      try { waveCtx.close(); } catch(e) {}
      waveCtx = null;
    }
    waveAnalyser = null;
  }

  $: contentPaddingBottom = 28;

  let mountToggles = false;
  $: if ((lottieFinished || !shouldPlayLottie) && !mountToggles) mountToggles = true;
  let inputFocused = false;
  $: togglesShouldShow = (lottieFinished || !shouldPlayLottie) && !inputText.trim() && !inputFocused;
  $: panelShouldShow = mountToggles ? togglesShouldShow : false;

  function handleInputFocus() {
    inputFocused = true;
  }
  function handleInputBlur() {
    inputFocused = false;
  }

  let mounted = false;
  onMount(() => {
    user = requireAuth();
    if (!user) return;

    const saved = getTheme();
    applyThemeValue(localStorage.getItem('nexa_theme') || saved, false);

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemChange);

    function onStorage(e) {
      if (e.key === 'nexa_theme' && e.newValue) applyThemeValue(e.newValue, false);
    }
    window.addEventListener('storage', onStorage);

    requestAnimationFrame(() => { mounted = true; });

    let justRegistered = false;
    try {
      justRegistered = sessionStorage.getItem('nexa_just_registered') === '1';
      sessionStorage.removeItem('nexa_just_registered');
    } catch(e) {}

    if (justRegistered) {
      shouldPlayLottie = true;
      loadLottie();
    } else {
      shouldPlayLottie = false;
      lottieFinished = true;
      togglesVisible = true;
    }

    return () => {
      if (lottieInstance) lottieInstance.destroy();
      mediaQuery?.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', onStorage);
      clearTimeout(suggestDebounce);
      abortSuggest?.abort();
    };
  });
</script>

<div class="root">
  <div class="bg-layer"></div>

  <div class="top-panel" class:in={mounted && panelShouldShow}>
    <header class="header">
      <div class="logo-wrap">
        <img src="/icons/png/logo.png" alt="Nexa" class="logo-img" />
      </div>
      <button class="upgrade-pill pulse-tap" on:click={goToPlans}>
        <span class="icon-mask" style="mask-image:url('/icons/svg/star.svg');-webkit-mask-image:url('/icons/svg/star.svg');width:14px;height:14px;background:var(--upgrade-text)"></span>
        <span class="upgrade-text">Upgrade</span>
      </button>
      <div class="header-right">
        <button class="hdr-seg pulse-tap" on:click={openDrawer}>
          <span class="icon-mask" style="mask-image:url('/icons/svg/menu.svg');-webkit-mask-image:url('/icons/svg/menu.svg');width:19px;height:19px;background:var(--icon-strong)"></span>
        </button>
      </div>
    </header>

    <div class="apps-grid-fixed">
      <div class="apps-row-fixed">
        {#each topApps as app}
          <button class="home-app-btn pulse-tap" on:click={() => openApp(app)}>
            <div class="home-app-icon">
              <img src={app.icon} alt={app.label} class="home-app-img" />
            </div>
            <span class="home-app-name">{app.label}</span>
          </button>
        {/each}
      </div>

      <div class="apps-row-fixed">
        {#each bottomApps as app}
          <button class="home-app-btn pulse-tap" on:click={() => openApp(app)}>
            <div class="home-app-icon">
              <img src={app.icon} alt={app.label} class="home-app-img" />
            </div>
            <span class="home-app-name">{app.label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <main class="content" style="padding-bottom:{contentPaddingBottom}px;">
    {#if shouldPlayLottie}
      <div class="lottie-wrap" class:lottie-hidden={lottieFinished} bind:this={lottieEl}></div>
    {/if}
  </main>
</div>

<div class="bottom" class:in={mounted}>
  {#if mountToggles}
    <div class="toggles-wrap" class:toggles-in={panelShouldShow} class:toggles-hidden={!togglesShouldShow}>
      {#each [SUGGESTION_TOGGLES.slice(0,2), SUGGESTION_TOGGLES.slice(2,4), SUGGESTION_TOGGLES.slice(4,6)] as row, ri}
        <div class="toggles-row">
          {#each row as t, i}
            <button
              class="suggestion-toggle pulse-tap"
              class:toggle-active={activeToggle?.id === t.id}
              style="transition-delay:{panelShouldShow ? (ri*2+i)*45 : 0}ms;"
              on:click={() => selectToggle(t)}
            >
              <img src={t.icon} alt={t.label} class="toggle-img" />
              <span class="toggle-label">{t.label}</span>
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {/if}

  {#if showSuggestBox && (searchSuggestions.length > 0 || suggestLoading)}
    <div class="suggest-box">
      {#if suggestLoading && !searchSuggestions.length}
        <div class="suggest-row suggest-loading">
          <svg class="suggest-search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--icon-faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span class="suggest-text suggest-text-faint">A procurar sugestões...</span>
        </div>
      {:else}
        {#each searchSuggestions as s (s)}
          <button class="suggest-row pulse-tap" on:click={() => useSuggestion(s)}>
            <svg class="suggest-search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--icon-faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span class="suggest-text">{s}</span>
            <span
              class="suggest-fill pulse-tap"
              role="button"
              tabindex="0"
              on:click|stopPropagation={() => fillSuggestion(s)}
              on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ') fillSuggestion(s); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--icon-faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="17" y1="7" x2="7" y2="17"/>
                <polyline points="7 9 7 17 15 17"/>
              </svg>
            </span>
          </button>
        {/each}
      {/if}
    </div>
  {/if}

  {#if isRecording}
    <div class="rec-card">
      <canvas bind:this={recCanvasEl} class="rec-canvas"></canvas>
      <div class="rec-inner">
        <button class="rec-btn pulse-tap" on:click={cancelRecording}>
          <span class="icon-mask" style="mask-image:url('/icons/svg/close.svg');-webkit-mask-image:url('/icons/svg/close.svg');width:18px;height:18px;background:var(--icon-strong)"></span>
        </button>
        <div class="rec-center">
          <div class="rec-dot"></div>
          <span class="rec-timer">{recTimerStr}</span>
        </div>
        <button class="rec-btn rec-send pulse-tap" on:click={stopRecording}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--icon-strong)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      </div>
    </div>
  {:else}
    <div class="bottom-bar">
      <textarea
        class="chat-input"
        placeholder="Escreve aqui..."
        rows="1"
        bind:value={inputText}
        bind:this={textInputEl}
        on:input={autoResize}
        on:keydown={handleKeyDown}
        on:focus={handleInputFocus}
        on:blur={handleInputBlur}
      ></textarea>
      <div class="bb-row">
        <button class="bb-btn pulse-tap" on:click={(e) => openPopup('add', e)}>
          <span class="icon-mask" style="mask-image:url('/icons/svg/add.svg');-webkit-mask-image:url('/icons/svg/add.svg');width:18px;height:18px;background:var(--icon-strong)"></span>
        </button>
        <div class="flex1"></div>
        <button class="model-pill pulse-tap" on:click={(e) => openPopup('models', e)}>
          <span class="model-pill-label">{currentModel.label}</span>
          <span class="icon-mask" style="mask-image:url('/icons/svg/arrow_down.svg');-webkit-mask-image:url('/icons/svg/arrow_down.svg');width:11px;height:11px;background:var(--icon-soft)"></span>
        </button>
        <div style="width:8px"></div>
        {#if inputText.trim()}
          <button class="bb-btn pulse-tap" on:click={navigateToAI}>
            <span class="icon-mask" style="mask-image:url('/icons/svg/ic_send_arrow.svg');-webkit-mask-image:url('/icons/svg/ic_send_arrow.svg');width:15px;height:15px;background:var(--icon-strong)"></span>
          </button>
        {:else}
          <button class="bb-btn pulse-tap" on:click={startRecording}>
            <span class="icon-mask" style="mask-image:url('/icons/svg/record.svg');-webkit-mask-image:url('/icons/svg/record.svg');width:18px;height:18px;background:var(--icon-strong)"></span>
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <div class="legal-card">
    <div class="legal-row">
      <button class="legal-link pulse-tap" on:click={() => window.location.href = '/legal/terms'}>Termos de Utilização</button>
      <span class="legal-dot">·</span>
      <button class="legal-link pulse-tap" on:click={() => window.location.href = '/legal/privacy'}>Política de Privacidade</button>
    </div>
  </div>
</div>

{#if showPopup}
  <div class="popup-overlay" on:click={closePopup}></div>
  <div class="popup-box" class:popup-in={popupVisible} style="bottom:{popupPos.bottom}px;left:{popupPos.left}px;width:{POPUP_W}px;">
    <div class="popup-content" class:fading={popupFading}>
      {#if popupMode === 'add'}
        <label class="popup-row pulse-tap" style="cursor:pointer">
          <div class="popup-icon-wrap"><span class="icon-mask" style="mask-image:url('/icons/svg/image.svg');-webkit-mask-image:url('/icons/svg/image.svg');width:17px;height:17px;background:var(--icon-strong)"></span></div>
          <span class="popup-label">Enviar Imagem</span>
          <input type="file" accept="image/*" style="display:none" on:change={closePopup} />
        </label>
        <div class="popup-sep"></div>
        <label class="popup-row pulse-tap" style="cursor:pointer">
          <div class="popup-icon-wrap"><span class="icon-mask" style="mask-image:url('/icons/svg/upload.svg');-webkit-mask-image:url('/icons/svg/upload.svg');width:17px;height:17px;background:var(--icon-strong)"></span></div>
          <span class="popup-label">Enviar Ficheiro</span>
          <input type="file" accept="*/*" style="display:none" on:change={closePopup} />
        </label>
        <div class="popup-sep"></div>
        <button class="popup-row pulse-tap" on:click={() => switchPopup('extras')}>
          <div class="popup-icon-wrap"><span class="icon-mask" style="mask-image:url('/icons/svg/extras.svg');-webkit-mask-image:url('/icons/svg/extras.svg');width:17px;height:17px;background:var(--icon-strong)"></span></div>
          <span class="popup-label" style="flex:1">Extras</span>
          <span class="icon-mask" style="mask-image:url('/icons/svg/arrow_right.svg');-webkit-mask-image:url('/icons/svg/arrow_right.svg');width:13px;height:13px;background:var(--icon-faint)"></span>
        </button>
      {:else if popupMode === 'extras'}
        <button class="popup-row popup-back pulse-tap" on:click={() => switchPopup('add')}>
          <span class="icon-mask" style="mask-image:url('/icons/svg/arrow_left.svg');-webkit-mask-image:url('/icons/svg/arrow_left.svg');width:15px;height:15px;background:var(--icon-faint)"></span>
          <span class="popup-label" style="color:var(--text-faint);font-size:13px">Extras</span>
        </button>
        <div class="popup-sep"></div>
        {#each [
          [flashMode,     'Flash',      'flash',  'flash_filled',  () => { flashMode = !flashMode; if (flashMode) thinkMoreMode = false; }],
          [thinkMoreMode, 'Think More', 'brain',  'brain_filled',  () => { thinkMoreMode = !thinkMoreMode; if (thinkMoreMode) flashMode = false; }],
          [sheetsEnabled, 'Sheets',     'sheets', 'sheets_filled', () => { sheetsEnabled = !sheetsEnabled; }],
        ] as [active, title, ico, icoOn, action], i}
          {#if i > 0}<div class="popup-sep"></div>{/if}
          <button class="popup-row pulse-tap" style={active ? 'background:var(--row-active)' : ''} on:click={action}>
            <div class="popup-icon-wrap"><span class="icon-mask" style="mask-image:url('/icons/svg/{active?icoOn:ico}.svg');-webkit-mask-image:url('/icons/svg/{active?icoOn:ico}.svg');width:17px;height:17px;background:var(--icon-strong)"></span></div>
            <span class="popup-label" style="flex:1">{title}</span>
            {#if active}<div class="popup-active-dot"></div>{/if}
          </button>
        {/each}
      {:else if popupMode === 'models'}
        <div class="popup-title">Modelo</div>
        {#each MODELS as model, i}
          {#if i > 0}<div class="popup-sep"></div>{/if}
          <button class="popup-row pulse-tap" style={currentModelId === model.id ? 'background:var(--row-active)' : ''} on:click={() => { currentModelId = model.id; closePopup(); }}>
            <div class="model-info">
              <span class="popup-label">{model.label}</span>
              <span class="model-sub">{model.sublabel}</span>
            </div>
            {#if currentModelId === model.id}
              <span class="icon-mask" style="mask-image:url('/icons/svg/check.svg');-webkit-mask-image:url('/icons/svg/check.svg');width:15px;height:15px;background:var(--icon-strong)"></span>
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  </div>
{/if}

{#if drawerOpen}
  <div class="drawer-overlay" class:drawer-overlay-in={drawerVisible} on:click={closeDrawer}></div>
  <div class="drawer" class:drawer-in={drawerVisible}>
    <div class="drawer-avatar-block">
      <div class="drawer-avatar" style="background:{avatarColor}">{userInitial}</div>
      <span class="drawer-user-name">{userName}</span>
    </div>
    <div class="drawer-sep"></div>
    <nav class="drawer-nav">
      <button class="drawer-item pulse-tap" on:click={toggleThemeExpanded}>
        <span class="icon-mask" style="mask-image:url('/icons/svg/appearance.svg');-webkit-mask-image:url('/icons/svg/appearance.svg');width:20px;height:20px;background:var(--drawer-text)"></span>
        <span class="drawer-item-label" style="flex:1">Tema</span>
        <span class="icon-mask drawer-chevron" class:drawer-chevron-open={themeExpanded} style="mask-image:url('/icons/svg/chevron_right.svg');-webkit-mask-image:url('/icons/svg/chevron_right.svg');width:14px;height:14px;background:var(--drawer-text-faint)"></span>
      </button>
      <div class="theme-accordion" class:theme-accordion-open={themeExpanded}>
        <div class="theme-accordion-inner">
          {#each THEME_OPTIONS as opt}
            <button class="theme-opt pulse-tap" on:click={() => { applyThemeValue(opt.id); themeExpanded = false; }}>
              <span class="theme-opt-label" style={themeValue === opt.id ? 'color:var(--drawer-text);font-weight:600' : ''}>{opt.label}</span>
              {#if themeValue === opt.id}
                <span class="icon-mask" style="mask-image:url('/icons/svg/check.svg');-webkit-mask-image:url('/icons/svg/check.svg');width:14px;height:14px;background:var(--drawer-text);display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;flex-shrink:0;"></span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
      {#each DRAWER_ITEMS as item}
        <button class="drawer-item pulse-tap" on:click={() => { item.action(); closeDrawer(); }}>
          <span class="icon-mask" style="mask-image:url('/icons/svg/{item.icon}.svg');-webkit-mask-image:url('/icons/svg/{item.icon}.svg');width:20px;height:20px;background:var(--drawer-text)"></span>
          <span class="drawer-item-label">{item.label}</span>
        </button>
      {/each}
    </nav>
    <div style="flex:1"></div>
    <div class="drawer-sep"></div>
    <button class="drawer-logout pulse-tap" on:click={() => { closeDrawer(); logout(); }}>
      <span class="icon-mask" style="mask-image:url('/icons/svg/logout.svg');-webkit-mask-image:url('/icons/svg/logout.svg');width:19px;height:19px;background:var(--logout-icon)"></span>
      <span class="drawer-logout-label">Terminar sessão</span>
    </button>
    <div style="height:max(env(safe-area-inset-bottom,0px),12px)"></div>
  </div>
{/if}

<style>
  * { box-sizing:border-box; margin:0; padding:0; }

  :global(html), :global(body) {
    overflow: hidden;
    overscroll-behavior: none;
    height: 100%;
    width: 100%;
  }

  /* ===== TEMA ESCURO ===== */
  :global([data-theme="dark"]) {
    --app-bg:             #0b0b0d;
    --surface:            #18181b;
    --surface-strong:     #1e1e21;
    --surface-popover:    #202023;
    --border-soft:        rgba(255,255,255,0.12);
    --border-faint:       rgba(255,255,255,0.09);
    --icon-strong:        rgba(255,255,255,0.88);
    --icon-soft:          rgba(255,255,255,0.52);
    --icon-faint:         rgba(255,255,255,0.30);
    --icon-on-accent:     #fff;
    --text-faint:         rgba(255,255,255,0.38);
    --row-active:         rgba(255,255,255,0.07);
    --btn-bg:             rgba(255,255,255,0.10);
    --btn-bg-active:      rgba(255,255,255,0.18);
    --hdr-seg-bg:         rgba(255,255,255,0.08);
    --hdr-seg-active:     rgba(255,255,255,0.16);
    --overlay-soft:       rgba(0,0,0,0.22);
    --drawer-bg:          #1c1c1e;
    --drawer-border:      rgba(255,255,255,0.08);
    --drawer-shadow:      rgba(0,0,0,0.45);
    --drawer-text:        rgba(255,255,255,0.82);
    --drawer-text-faint:  rgba(255,255,255,0.35);
    --drawer-sep:         rgba(255,255,255,0.10);
    --drawer-overlay-in:  rgba(0,0,0,0.35);
    --drawer-row-active:  rgba(255,255,255,0.06);
    --toggle-bg:          #232326;
    --toggle-bg-act:      #2c2c30;
    --toggle-border:      rgba(255,255,255,0.14);
    --toggle-border-act:  rgba(255,255,255,0.32);
    --toggle-label:       rgba(255,255,255,0.90);
    --logo-border:        rgba(255,255,255,0.22);
    --logo-bg:            #202023;
    --upgrade-bg:         rgba(64,132,255,0.16);
    --upgrade-border:     rgba(64,132,255,0.35);
    --upgrade-text:       #6ea8ff;
    --logout-bg:          var(--btn-bg);
    --logout-bg-active:   var(--btn-bg-active);
    --logout-icon:        #FF453A;
  }

  /* ===== TEMA CLARO ===== */
  :global([data-theme="light"]) {
    --app-bg:             #f2f2f4;
    --surface:            #ffffff;
    --surface-strong:     #ffffff;
    --surface-popover:    #ffffff;
    --border-soft:        rgba(0,0,0,0.09);
    --border-faint:       rgba(0,0,0,0.07);
    --icon-strong:        rgba(20,20,20,0.85);
    --icon-soft:          rgba(20,20,20,0.48);
    --icon-faint:         rgba(20,20,20,0.28);
    --icon-on-accent:     #fff;
    --text-faint:         rgba(20,20,20,0.40);
    --row-active:         rgba(0,0,0,0.05);
    --btn-bg:             rgba(0,0,0,0.06);
    --btn-bg-active:      rgba(0,0,0,0.11);
    --hdr-seg-bg:         rgba(0,0,0,0.06);
    --hdr-seg-active:     rgba(0,0,0,0.11);
    --overlay-soft:       rgba(0,0,0,0.14);
    --drawer-bg:          #ffffff;
    --drawer-border:      rgba(0,0,0,0.07);
    --drawer-shadow:      rgba(0,0,0,0.13);
    --drawer-text:        #111111;
    --drawer-text-faint:  rgba(0,0,0,0.30);
    --drawer-sep:         rgba(0,0,0,0.09);
    --drawer-overlay-in:  rgba(0,0,0,0.20);
    --drawer-row-active:  rgba(0,0,0,0.05);
    --toggle-bg:          #ffffff;
    --toggle-bg-act:      #f0f0f2;
    --toggle-border:      rgba(0,0,0,0.10);
    --toggle-border-act:  rgba(0,0,0,0.24);
    --toggle-label:       rgba(20,20,20,0.85);
    --logo-border:        rgba(0,0,0,0.14);
    --logo-bg:            #f5f5f7;
    --upgrade-bg:         rgba(64,132,255,0.10);
    --upgrade-border:     rgba(64,132,255,0.28);
    --upgrade-text:       #2f6fe0;
    --logout-bg:          var(--btn-bg);
    --logout-bg-active:   var(--btn-bg-active);
    --logout-icon:        #E0342A;
  }

  .root {
    position:fixed;
    inset:0;
    overflow:hidden;
    overscroll-behavior:none;
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;
    touch-action: pan-y;
  }

  .bg-layer {
    position:absolute;
    inset:0;
    z-index:0;
    background:var(--app-bg);
  }

  .top-panel {
    position:fixed;
    top:12px;
    left:12px;
    right:12px;
    z-index:15;
    display:flex;
    flex-direction:column;
    background:var(--surface);
    border:0.5px solid var(--border-soft);
    border-radius:26px;
    box-shadow:0 10px 28px rgba(0,0,0,0.16);
    padding-bottom:10px;
    opacity:0;
    transform:translateY(-16px) translateZ(0);
    transition:opacity .4s ease, transform .4s ease;
    pointer-events:none;
    contain: layout style paint;
  }
  .top-panel.in {
    opacity:1;
    transform:translateY(0) translateZ(0);
    pointer-events:auto;
  }

  .header {
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:calc(env(safe-area-inset-top,0px) + 6px) 14px 4px;
    gap:10px;
  }

  .logo-wrap {
    width:46px;
    height:46px;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }
  .logo-img { width:46px; height:46px; object-fit:contain; }

  .header-right {
    display:flex;
    align-items:center;
    height:34px;
    border-radius:17px;
    background:var(--hdr-seg-bg);
    overflow:hidden;
    flex-shrink:0;
  }
  .hdr-seg {
    width:36px;
    height:34px;
    border:none;
    background:transparent;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    transition:background .18s ease;
  }
  .hdr-seg:active { background:var(--hdr-seg-active); }

  .apps-grid-fixed {
    display:flex;
    flex-direction:column;
    gap:8px;
    align-items:center;
    width:100%;
    padding-top:2px;
  }

  .apps-row-fixed {
    display:flex;
    justify-content:center;
    align-items:flex-start;
    width:100%;
    gap:10px;
  }

  .home-app-btn {
    width:66px;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:4px;
    background:transparent;
    border:none;
    padding:0;
    border-radius:14px;
    cursor:pointer;
    flex-shrink:0;
    transition:background .14s ease, transform .14s cubic-bezier(0.34,1.56,0.64,1);
  }
  .home-app-btn:active {
    background:var(--row-active);
    transform:scale(0.96);
  }
  .home-app-icon {
    width:44px;
    height:44px;
    border-radius:13px;
    overflow:hidden;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }
  .home-app-img {
    width:32px;
    height:32px;
    object-fit:contain;
    display:block;
  }
  .home-app-name {
    font-size:9.5px;
    font-weight:500;
    color:var(--icon-soft);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    max-width:66px;
    text-align:center;
    line-height:1.2;
  }

  .upgrade-pill {
    flex:1;
    max-width:150px;
    height:34px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:5px;
    padding:0 14px;
    border-radius:17px;
    background:var(--upgrade-bg);
    border:1px solid var(--upgrade-border);
    cursor:pointer;
  }
  .upgrade-text {
    font-size:12.5px;
    font-weight:700;
    color:var(--upgrade-text);
  }

  .content {
    position:absolute;
    inset:0;
    z-index:10;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:flex-end;
  }
  .lottie-wrap {
    position:absolute;
    top:50%;
    left:50%;
    transform:translate(-50%, -50%);
    width:220px;
    height:220px;
    transition:opacity .35s ease, transform .35s ease;
  }
  .lottie-hidden {
    opacity:0;
    transform:translate(-50%,-50%) scale(0.85);
    pointer-events:none;
  }

  .bottom {
    position:fixed;
    bottom:0;
    left:0;
    right:0;
    z-index:20;
    padding-left:16px;
    padding-right:16px;
    padding-bottom:calc(env(safe-area-inset-bottom,0px) + 18px);
    opacity:0;
    transition:opacity .6s .3s ease;
  }
  .bottom.in { opacity:1; }

  .toggles-wrap {
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:8px;
    width:100%;
    padding-bottom:10px;
  }
  .toggles-row { display:flex; flex-direction:row; justify-content:center; gap:7px; }

  .suggestion-toggle {
    display:inline-flex;
    align-items:center;
    gap:7px;
    padding:7px 14px 7px 7px;
    border-radius:999px;
    border:1px solid var(--toggle-border);
    background:var(--toggle-bg);
    cursor:pointer;
    font-family:inherit;
    white-space:nowrap;
    box-shadow:0 2px 8px rgba(0,0,0,0.10);
    opacity:0;
    transform:scale(0.86) translateY(10px);
    transition:
      opacity .46s cubic-bezier(0.16,1,0.3,1),
      transform .46s cubic-bezier(0.16,1,0.3,1),
      background .18s ease,
      border-color .18s ease;
  }
  .toggles-in .suggestion-toggle {
    opacity:1;
    transform:scale(1) translateY(0);
  }
  .toggles-hidden .suggestion-toggle {
    opacity:0;
    transform:scale(0.92) translateY(6px);
    transition:
      opacity .22s cubic-bezier(0.4,0,1,1),
      transform .22s cubic-bezier(0.4,0,1,1);
    transition-delay:0ms !important;
  }
  .suggestion-toggle:active { transform:scale(0.95); }
  .toggle-active { background:var(--toggle-bg-act) !important; border-color:var(--toggle-border-act) !important; }
  .toggle-img { width:22px; height:22px; object-fit:contain; flex-shrink:0; border-radius:5px; }
  .toggle-label { font-size:13px; font-weight:600; color:var(--toggle-label); }

  .bottom-bar {
    border-radius:22px;
    background:var(--surface);
    border:0.5px solid var(--border-soft);
    box-shadow:0 6px 24px rgba(0,0,0,0.16);
    display:flex;
    flex-direction:column;
  }
  .chat-input {
    resize:none;
    outline:none;
    border:none;
    background:transparent;
    font-size:15px;
    line-height:1.5;
    padding:13px 18px 0;
    width:100%;
    font-family:inherit;
    color:var(--icon-strong);
    max-height:150px;
    overflow-y:auto;
    -webkit-user-select:text;
    user-select:text;
  }
  .chat-input::placeholder { color:var(--text-faint); }
  .bb-row { display:flex; align-items:center; height:52px; padding:0 6px; }
  .flex1 { flex:1; }
  .bb-btn {
    width:40px;
    height:40px;
    display:flex;
    align-items:center;
    justify-content:center;
    border-radius:50%;
    border:0.5px solid var(--border-faint);
    cursor:pointer;
    background:var(--btn-bg);
    flex-shrink:0;
    transition:background .20s ease, transform .20s cubic-bezier(0.34,1.56,0.64,1);
  }
  .bb-btn:active { background:var(--btn-bg-active); transform:scale(0.88); }
  .model-pill {
    height:40px;
    padding:0 14px;
    display:flex;
    align-items:center;
    gap:5px;
    border-radius:20px;
    border:0.5px solid var(--border-soft);
    cursor:pointer;
    background:var(--btn-bg);
    flex-shrink:0;
    transition:background .20s ease, transform .20s cubic-bezier(0.34,1.56,0.64,1);
  }
  .model-pill:active { background:var(--btn-bg-active); transform:scale(0.94); }
  .model-pill-label { font-size:13px; font-weight:600; color:var(--icon-strong); }

  .rec-card {
    position:relative;
    overflow:hidden;
    border-radius:999px;
    background:var(--surface);
    border:0.5px solid var(--border-soft);
    box-shadow:0 6px 24px rgba(0,0,0,0.16);
    height:64px;
    animation:recIn .28s cubic-bezier(0.2,0.9,0.3,1) both;
  }
  @keyframes recIn {
    from { opacity:0; transform:scale(0.92) translateY(10px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  .rec-canvas { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:0; }
  .rec-inner { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; height:100%; padding:0 10px; }
  .rec-btn {
    width:44px;
    height:44px;
    display:flex;
    align-items:center;
    justify-content:center;
    border-radius:50%;
    border:0.5px solid var(--border-faint);
    cursor:pointer;
    background:var(--btn-bg);
    flex-shrink:0;
    transition:background .18s ease, transform .18s cubic-bezier(0.34,1.56,0.64,1);
  }
  .rec-btn:active { background:var(--btn-bg-active); transform:scale(0.88); }
  .rec-send { background:var(--btn-bg-active); }
  .rec-center { display:flex; align-items:center; gap:8px; flex:1; justify-content:center; pointer-events:none; }
  .rec-dot { width:7px; height:7px; border-radius:50%; background:#FF3B30; flex-shrink:0; animation:recPulse 1.1s ease-in-out infinite; }
  @keyframes recPulse {
    0%,100% { opacity:1; transform:scale(1); }
    50% { opacity:.4; transform:scale(.75); }
  }
  .rec-timer { font-size:17px; font-weight:600; font-variant-numeric:tabular-nums; color:var(--icon-strong); letter-spacing:.06em; }

  .suggest-box {
    border-radius:18px;
    background:var(--surface-strong);
    border:0.5px solid var(--border-soft);
    box-shadow:0 8px 26px rgba(0,0,0,0.16);
    overflow:hidden;
    margin-bottom:8px;
    animation:suggestIn .22s cubic-bezier(0.2,0.9,0.3,1) both;
  }
  @keyframes suggestIn {
    from { opacity:0; transform:translateY(8px); }
    to { opacity:1; transform:translateY(0); }
  }
  .suggest-row {
    display:flex;
    align-items:center;
    gap:12px;
    width:100%;
    padding:11px 12px;
    background:transparent;
    border:none;
    cursor:pointer;
    font-family:inherit;
    text-align:left;
    transition:background .14s ease;
  }
  .suggest-row:active { background:var(--row-active); }
  .suggest-loading { cursor:default; }
  .suggest-search-ico { flex-shrink:0; }
  .suggest-text {
    flex:1;
    font-size:14px;
    font-weight:500;
    color:var(--icon-strong);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .suggest-text-faint { color:var(--text-faint); font-weight:400; }
  .suggest-fill {
    width:30px;
    height:30px;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    transition:background .14s ease, transform .14s cubic-bezier(0.34,1.56,0.64,1);
  }
  .suggest-fill:active { background:var(--btn-bg-active); transform:scale(0.86); }

  .legal-card {
    margin-top: 10px;
    border-radius: 22px;
    background: var(--surface-strong);
    border: 0.5px solid var(--border-soft);
    box-shadow: 0 6px 24px rgba(0,0,0,0.16);
    padding: 10px 16px;
  }
  .legal-row { display:flex; align-items:center; justify-content:center; gap:6px; }
  .legal-link {
    background:none;
    border:none;
    font-family:inherit;
    font-size:10.5px;
    font-weight:500;
    color:var(--text-faint);
    cursor:pointer;
    padding:2px 1px;
  }
  .legal-link:active { color:var(--icon-soft); }
  .legal-dot { font-size:10px; color:var(--text-faint); }

  .popup-overlay { position:fixed; inset:0; z-index:50; }
  .popup-box {
    position:fixed;
    z-index:51;
    border-radius:18px;
    background:var(--surface-strong);
    border:0.5px solid var(--border-soft);
    box-shadow:0 12px 36px rgba(0,0,0,0.24);
    overflow:hidden;
    transform-origin:bottom left;
    opacity:0;
    transform:scale(0.86) translateY(8px);
    transition:opacity .22s cubic-bezier(0.2,0.9,0.3,1), transform .22s cubic-bezier(0.2,0.9,0.3,1);
    pointer-events:none;
  }
  .popup-box.popup-in { opacity:1; transform:scale(1) translateY(0); pointer-events:auto; }
  .popup-content { transition:opacity .13s ease, transform .13s ease; }
  .popup-content.fading { opacity:0; transform:translateY(4px); pointer-events:none; }
  .popup-title {
    padding:12px 16px 8px;
    font-size:11px;
    font-weight:700;
    letter-spacing:.07em;
    text-transform:uppercase;
    color:var(--text-faint);
  }
  .popup-row {
    display:flex;
    align-items:center;
    gap:12px;
    width:100%;
    padding:12px 14px;
    background:transparent;
    border:none;
    cursor:pointer;
    font-family:inherit;
    text-align:left;
    transition:background .14s ease;
  }
  .popup-row:active { background:var(--row-active); }
  .popup-back { padding:9px 14px; }
  .popup-icon-wrap {
    width:32px;
    height:32px;
    border-radius:50%;
    background:var(--btn-bg);
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }
  .popup-label { font-size:15px; font-weight:500; color:var(--icon-strong); flex:1; }
  .popup-sep { height:0.5px; background:var(--border-faint); margin:0 14px; }
  .popup-active-dot { width:7px; height:7px; border-radius:50%; background:var(--icon-strong); flex-shrink:0; }
  .model-info { display:flex; flex-direction:column; flex:1; min-width:0; }
  .model-sub {
    font-size:11px;
    color:var(--icon-faint);
    margin-top:1px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .drawer-overlay {
    position:fixed;
    inset:0;
    z-index:70;
    background:transparent;
    transition:background .28s ease;
    will-change: background;
  }
  .drawer-overlay.drawer-overlay-in { background:var(--drawer-overlay-in); }

  .drawer {
    position:fixed;
    top:0;
    right:0;
    bottom:0;
    z-index:71;
    width:min(288px,82vw);
    background:var(--drawer-bg);
    border-left:0.5px solid var(--drawer-border);
    box-shadow:-12px 0 48px var(--drawer-shadow);
    display:flex;
    flex-direction:column;
    padding-top:max(env(safe-area-inset-top,0px),16px);
    overflow:hidden;
    transform:translate3d(100%,0,0);
    opacity:0.98;
    transition:transform .28s cubic-bezier(0.25,0.46,0.45,0.94), opacity .18s ease;
    will-change: transform, opacity;
    backface-visibility: hidden;
    contain: layout paint style;
  }
  .drawer.drawer-in {
    transform:translate3d(0,0,0);
    opacity:1;
  }
  .drawer-avatar-block {
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:10px;
    padding:18px 20px;
    flex-shrink:0;
  }
  .drawer-avatar {
    width:84px;
    height:84px;
    border-radius:50%;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:32px;
    font-weight:700;
    color:#fff;
  }
  .drawer-user-name {
    font-size:16px;
    font-weight:700;
    color:var(--drawer-text);
    text-align:center;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    max-width:100%;
  }
  .drawer-sep { height:0.5px; background:var(--drawer-sep); margin:0 14px; flex-shrink:0; }
  .drawer-nav {
    display:flex;
    flex-direction:column;
    padding:8px 6px;
    overflow-y:auto;
    overflow-x:hidden;
    -webkit-overflow-scrolling:touch;
    overscroll-behavior:contain;
    flex:1;
  }
  .drawer-item {
    display:flex;
    align-items:center;
    gap:16px;
    padding:13px 14px;
    border-radius:10px;
    border:none;
    background:transparent;
    cursor:pointer;
    font-family:inherit;
    text-align:left;
    transition:background .12s ease;
    width:100%;
  }
  .drawer-item:active { background:var(--drawer-row-active); }
  .drawer-item-label { font-size:15px; font-weight:400; color:var(--drawer-text); }
  .drawer-chevron { transition:transform .25s cubic-bezier(0.25,0.46,0.45,0.94); }
  .drawer-chevron-open { transform:rotate(90deg); }
  .theme-accordion { display:grid; grid-template-rows:0fr; transition:grid-template-rows .25s cubic-bezier(0.25,0.46,0.45,0.94); }
  .theme-accordion-open { grid-template-rows:1fr; }
  .theme-accordion-inner { overflow:hidden; min-height:0; }
  .theme-opt {
    display:flex;
    align-items:center;
    justify-content:space-between;
    width:100%;
    padding:11px 14px 11px 52px;
    background:transparent;
    border:none;
    cursor:pointer;
    font-family:inherit;
    text-align:left;
    border-radius:8px;
    transition:background .12s ease;
  }
  .theme-opt:active { background:var(--drawer-row-active); }
  .theme-opt-label { font-size:14px; color:var(--drawer-text-faint); flex:1; }

  .drawer-logout {
    display:flex;
    align-items:center;
    justify-content:center;
    gap:10px;
    margin:14px 14px 4px;
    padding:14px 16px;
    border-radius:999px;
    border:0.5px solid var(--border-soft);
    background:var(--logout-bg);
    cursor:pointer;
    font-family:inherit;
    flex-shrink:0;
    transition:background .18s ease, transform .18s cubic-bezier(0.34,1.56,0.64,1);
  }
  .drawer-logout:active { background:var(--logout-bg-active); transform:scale(0.97); }
  .drawer-logout-label {
    font-size:15px;
    font-weight:700;
    color:var(--logout-icon);
  }

  .pulse-tap {
    cursor:pointer;
    transition:transform .14s cubic-bezier(0.25,0.46,0.45,0.94), opacity .14s ease;
  }
  .pulse-tap:active { transform:scale(0.96); opacity:.80; }
  .icon-mask {
    display:block;
    mask-size:contain;
    -webkit-mask-size:contain;
    mask-repeat:no-repeat;
    -webkit-mask-repeat:no-repeat;
    mask-position:center;
    -webkit-mask-position:center;
    flex-shrink:0;
  }
</style>