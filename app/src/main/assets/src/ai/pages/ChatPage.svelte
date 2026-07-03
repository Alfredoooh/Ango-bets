<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { getThemeColors } from '$shared/theme.js';
  import { GeminiApiService, AuthApiService, CreditsApiService } from '$shared/api.js';
  import { showToast } from '$shared/utils.js';
  import { AVAILABLE_MODELS, AVAILABLE_LANGUAGES, ALL_APPS } from '$shared/plans.js';
  import Drawer       from '../components/Drawer.svelte';
  import ModalSheet   from '../components/ModalSheet.svelte';
  import SettingsPage from './SettingsPage.svelte';

  export let isDark = false;
  export let user   = null;

  const dispatch = createEventDispatcher();

  $: effectiveUser = user || (() => {
    try { return JSON.parse(localStorage.getItem('nexa_user') || 'null'); } catch(e) { return null; }
  })();

  $: c = getThemeColors(isDark);

  let currentModelId   = localStorage.getItem('nexa_model') || 'gemini-2.5-flash';
  let currentLanguage  = localStorage.getItem('nexa_language') || 'pt';
  let drawerOpen       = false;
  let activeApp        = localStorage.getItem('nexa_active_app') || 'ai';
  let conversations    = [];
  let showSettings     = false;

  const drawerMenuItems = [
    { icon: 'new_chat', label: 'Nova conversa', action: () => newChat() },
    { icon: 'folder', label: 'Projetos', action: () => showToast('Projetos em breve'), keepOpen: true },
    { icon: 'extras', label: 'Extras', action: () => { sheetMode = 'extras'; showSheet = true; } },
  ];

  let displayMessages  = [];
  let chatHistory      = [];
  let currentConvId    = '';
  let currentConvTitle = 'Nova conversa';
  let titleGenerated   = false;
  let isStreaming      = false;
  let isIncognito      = false;
  let pendingAttachments = [];
  let flashMode        = false;
  let thinkMoreMode    = false;
  let sheetsEnabled    = false;

  let inputText        = '';
  let textInputEl;
  let messagesEl;
  let chatRootEl;
  let showSheet        = false;
  let sheetMode        = '';
  let sheetConv        = null;
  let sheetUserMsg     = null;
  let sheetUserIdx     = -1;
  let renameValue      = '';
  let editMsgValue     = '';
  let showCenterDialog = false;
  let centerDialogMode = '';

  let mediaRecorder = null, audioChunks = [], isRecording = false;
  let waveOverlayCtx = null, waveOverlayAnalyser = null, waveOverlaySource = null;
  let waveOverlayStream = null, waveOverlayAnimFrame = null;
  let showRecOverlay = false;
  let recSeconds = 0;
  let recInterval = null;
  let recCanvasEl;
  let wavePhaseLocal = 0, waveSmoothAmpLocal = 6, waveSmoothBoostLocal = 0, waveSmoothScaleLocal = 1;

  // Apps popup
  let showAppsPopup = false;
  let appsPopupPos  = { top: 0, right: 0 };

  $: hasMessages = displayMessages.length > 0;
  $: greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; })();
  $: currentModelName = AVAILABLE_MODELS.find(m => m.id === currentModelId)?.name || 'Gemini 2.5 Flash';
  $: recTimerStr = (() => { const m=Math.floor(recSeconds/60),s=recSeconds%60; return `${m}:${s.toString().padStart(2,'0')}`; })();

  const DRAWER_APPS = ALL_APPS.filter(a => a.id !== 'home');

  onMount(() => {
  chatRootEl = document.querySelector('.chat-root');
  setupVH();
  setupKeyboard();
  setupWidgetSettings();
  setupBottomBarTouchLock();
  window.addEventListener('resize', setupVH);
  window.addEventListener('orientationchange', () => setTimeout(setupVH, 120));
  
  // Mensagem vinda da HomePage
  try {
    const pending = sessionStorage.getItem('nexa_pending_message');
    if (pending) {
      sessionStorage.removeItem('nexa_pending_message');
      setTimeout(() => sendMessage(pending), 300);
    }
  } catch (e) {}
});

  function setupVH() {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--vh', (h * 0.01) + 'px');
  }

  function setupKeyboard() {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    function getRoot() {
      if (!chatRootEl) chatRootEl = document.querySelector('.chat-root');
      return chatRootEl;
    }
    function applyViewport() {
      const root = getRoot();
      if (root) {
        root.style.top = '0px';
        root.style.left = '0px';
        root.style.right = '0px';
        root.style.bottom = 'auto';
        root.style.height = vv.height + 'px';
      }
      scrollToBottom();
    }
    vv.addEventListener('resize', applyViewport);
    vv.addEventListener('scroll', applyViewport);
    applyViewport();
  }

  function setupBottomBarTouchLock() {
    const bb = document.getElementById('bottomBar');
    if (!bb) return;
    bb.addEventListener('touchmove', (e) => {
      if (e.target !== textInputEl) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { passive: false });
  }

  function handleInputFocus() {
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
    setTimeout(() => { window.scrollTo(0, 0); scrollToBottom(); }, 50);
    setTimeout(() => { window.scrollTo(0, 0); scrollToBottom(); }, 300);
  }

  let widgetSettings = {};
  function setupWidgetSettings() {
    try { widgetSettings = JSON.parse(localStorage.getItem('ipc_widget_settings_v1') || '{}'); } catch (e) {}
  }
  function isWidgetEnabled(type) { return widgetSettings[type] !== false; }

  const ALL_WIDGETS = new Set(['widget_table','widget_code','widget_bar','widget_pie','widget_sheet','widget_market','widget_calendar','widget_timer','widget_mindmap','widget_graph','widget_map']);

  function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function escapeAttr(s) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function applyInline(text) {
    text = text.replace(/\*\*\*([^*\n]+)\*\*\*/g,'<strong><em>$1</em></strong>');
    text = text.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
    text = text.replace(/__([^_\n]+)__/g,'<strong>$1</strong>');
    text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,'<em>$1</em>');
    text = text.replace(/~~([^~\n]+)~~/g,'<del>$1</del>');
    text = text.replace(/`([^`\n]+)`/g,'<code class="inline-code">$1</code>');
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a class="md-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    text = text.replace(/(?<!["">])(https?:\/\/[^\s<>"']+)/g,'<a class="md-link" href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    text = text.replace(/==([^=\n]+)==/g,'<mark class="md-mark">$1</mark>');
    return text;
  }

  const GREEK_MAP = {alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',theta:'θ',lambda:'λ',mu:'μ',pi:'π',sigma:'σ',phi:'φ',psi:'ψ',omega:'ω',Alpha:'Α',Beta:'Β',Gamma:'Γ',Delta:'Δ',Pi:'Π',Sigma:'Σ',Omega:'Ω'};
  function renderMathToken(expr) {
    let o = String(expr).trim();
    o = o.replace(/\\sqrt\[(.+?)\]\{(.+?)\}/g,'<span class="math-root"><sup class="math-root-index">$1</sup><span class="math-radical">√</span><span class="math-radicand">$2</span></span>');
    o = o.replace(/\\sqrt\{(.+?)\}/g,'<span class="math-root"><span class="math-radical">√</span><span class="math-radicand">$1</span></span>');
    o = o.replace(/\\frac\{(.+?)\}\{(.+?)\}/g,'<span class="math-frac"><span class="math-frac-num">$1</span><span class="math-frac-den">$2</span></span>');
    o = o.replace(/\\([A-Za-z]+)/g,(_,n)=>GREEK_MAP[n]||({sum:'∑',int:'∫',infty:'∞',pm:'±',times:'×',leq:'≤',geq:'≥',neq:'≠',approx:'≈',to:'→',partial:'∂',forall:'∀',in:'∈',emptyset:'∅'}[n])||_);
    o = o.replace(/\^\{(.+?)\}/g,'<sup>$1</sup>');
    o = o.replace(/\^(-?[A-Za-z0-9]+)/g,'<sup>$1</sup>');
    o = o.replace(/_\{(.+?)\}/g,'<sub>$1</sub>');
    o = o.replace(/_(-?[A-Za-z0-9]+)/g,'<sub>$1</sub>');
    return o;
  }

  function tryParseTable(lines, i) {
    if (i+1 >= lines.length) return null;
    const h = lines[i], s = lines[i+1];
    if (!/^\s*\|?.+\|.+\|?\s*$/.test(h)) return null;
    if (!/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(s)) return null;
    const splitRow = l => l.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
    const headers = splitRow(h);
    const aligns = splitRow(s).map(c => { const l=c.startsWith(':'), r=c.endsWith(':'); return l&&r?'center':r?'right':l?'left':''; });
    let j = i+2; const rows = [];
    while (j < lines.length && /^\s*\|?.+\|.+\|?\s*$/.test(lines[j]) && lines[j].trim()) { rows.push(splitRow(lines[j])); j++; }
    return { headers, aligns, rows, nextIdx: j };
  }

  function buildTableHtml(t) {
    const as = i => t.aligns[i] ? `text-align:${t.aligns[i]};` : '';
    return `<div class="md-table-wrapper"><table class="md-table"><thead><tr>${t.headers.map((h,i)=>`<th style="${as(i)}">${applyInline(escapeHtml(h))}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r=>`<tr>${r.map((cell,i)=>`<td style="${as(i)}">${applyInline(escapeHtml(cell))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderMarkdown(rawText) {
    if (!rawText) return '';
    const codeBlocks = [], mathBlocks = [];
    let text = rawText.replace(/```([\w_]*?)[\r\n]+([\s\S]*?)```/g, (_, lang, code) => { const idx = codeBlocks.length; codeBlocks.push({lang: lang.trim(), code: code.replace(/\n$/, '')}); return `\u0000CB${idx}\u0000`; });
    text = text.replace(/\$\$([\s\S]+?)\$\$/g,(_,c)=>{ const idx=mathBlocks.length; mathBlocks.push({display:true,content:c}); return `\u0000MB${idx}\u0000`; });
    text = text.replace(/\$([^\$\n]+?)\$/g,(_,c)=>{ const idx=mathBlocks.length; mathBlocks.push({display:false,content:c}); return `\u0000MB${idx}\u0000`; });
    const lines = text.split('\n'); const parts = [];
    let listItems=[], ordItems=[], paraLines=[], bqLines=[], inBq=false;
    const flushPara = () => { if (paraLines.length) { const j=paraLines.join('\n'); if(j.trim()) parts.push(`<p class="md-para">${j}</p>`); paraLines=[]; } };
    const flushList = () => { if (listItems.length) { parts.push(`<ul class="md-list">${listItems.map(li=>`<li class="md-li">${li}</li>`).join('')}</ul>`); listItems=[]; } };
    const flushOrd  = () => { if (ordItems.length)  { parts.push(`<ol class="md-olist">${ordItems.map(li=>`<li class="md-li">${li}</li>`).join('')}</ol>`); ordItems=[]; } };
    const flushBq   = () => { if (bqLines.length) { parts.push(`<blockquote class="md-blockquote">${bqLines.join('<br>')}</blockquote>`); bqLines=[]; inBq=false; } };
    for (let i=0; i<lines.length; i++) {
      const raw=lines[i], esc=escapeHtml(raw);
      if (raw.trim()==='') { flushList();flushOrd();flushBq();flushPara(); continue; }
      if (raw.trim().startsWith('\u0000CB')) { flushList();flushOrd();flushBq();flushPara(); parts.push(raw.trim()); continue; }
      const tbl=tryParseTable(lines,i); if(tbl){flushList();flushOrd();flushBq();flushPara();parts.push(buildTableHtml(tbl));i=tbl.nextIdx-1;continue;}
      const h4=raw.match(/^####\s+(.+)/),h3=raw.match(/^###\s+(.+)/),h2=raw.match(/^##\s+(.+)/),h1=raw.match(/^#\s+(.+)/);
      if(h4||h3||h2||h1){flushList();flushOrd();flushBq();flushPara();if(h4)parts.push(`<h4 class="md-h4">${applyInline(escapeHtml(h4[1]))}</h4>`);else if(h3)parts.push(`<h3 class="md-h3">${applyInline(escapeHtml(h3[1]))}</h3>`);else if(h2)parts.push(`<h2 class="md-h2">${applyInline(escapeHtml(h2[1]))}</h2>`);else parts.push(`<h1 class="md-h1">${applyInline(escapeHtml(h1[1]))}</h1>`);continue;}
      if(/^(\*{3,}|-{3,}|_{3,})\s*$/.test(raw.trim())){flushList();flushOrd();flushBq();flushPara();parts.push('<hr class="md-hr">');continue;}
      const bq=raw.match(/^>\s*(.*)/); if(bq){flushList();flushOrd();flushPara();bqLines.push(applyInline(escapeHtml(bq[1])));inBq=true;continue;}
      if(inBq)flushBq();
      const li=raw.match(/^(\s*)[-*+]\s+(.+)/); if(li){flushOrd();flushPara();listItems.push(applyInline(escapeHtml(li[2])));continue;}
      const ol=raw.match(/^(\s*)\d+\.\s+(.+)/); if(ol){flushList();flushPara();ordItems.push(applyInline(escapeHtml(ol[2])));continue;}
      flushList();flushOrd();paraLines.push(applyInline(esc));
    }
    flushList();flushOrd();flushBq();flushPara();
    text = parts.join('');
    text = text.replace(/\u0000CB(\d+)\u0000/g,(_,idx)=>{
      const blk=codeBlocks[Number(idx)];
      if(ALL_WIDGETS.has(blk.lang)&&isWidgetEnabled(blk.lang)) {
        const wid = 'w_' + Math.random().toString(36).slice(2,9);
        setTimeout(() => {
          const el = document.getElementById(wid);
          if (el) buildNativeWidgetDOM(blk.lang, blk.code, el);
        }, 0);
        return `<div id="${wid}" class="widget-host"></div>`;
      }
      const safe=escapeHtml(blk.code);
      const hdr=blk.lang?`<div class="code-block-header"><span class="code-lang-label">${escapeHtml(blk.lang)}</span><button class="code-copy-btn pulse-tap" onclick="window._copyCodeBtn(this)"><span class="icon-mask" style="mask-image:url('/icons/svg/copy.svg');-webkit-mask-image:url('/icons/svg/copy.svg');width:13px;height:13px;background:currentColor;display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;"></span></button></div>`:'';
      return `<div class="code-block-wrapper">${hdr}<pre class="code-block"><code>${safe}</code></pre></div>`;
    });
    text = text.replace(/\u0000MB(\d+)\u0000/g,(_,idx)=>{const blk=mathBlocks[Number(idx)];const rendered=renderMathToken(blk.content);return blk.display?`<div class="math-display">${rendered}</div>`:`<span class="math-inline">${rendered}</span>`;});
    return text;
  }

  function _wIsDark() { return isDark; }
  function _ensureStyle(id, cssText) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id; s.textContent = cssText;
    document.head.appendChild(s);
  }
  function _escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function _copyText(text) {
    return navigator.clipboard?.writeText?.(text).catch(async () => {
      try {
        const ta = document.createElement('textarea'); ta.value = text;
        ta.setAttribute('readonly',''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0,ta.value.length);
        const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
      } catch { return false; }
    });
  }
  function _showToast(el, text) {
    el.textContent = text; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; el.style.pointerEvents = 'none';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(-4px)'; }, 1000);
  }

  function renderNativeTable(container, json) {
    const dark = _wIsDark();
    const borderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)';
    const bgColor = dark ? '#1b1b1b' : '#ffffff';
    const headerBg = dark ? '#232323' : '#f4f4f4';
    const textColor = dark ? '#f4f4f4' : '#222';
    const shadowColor = dark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)';
    const wrap = document.createElement('div');
    wrap.style.cssText = `width:min(100%,560px);border-radius:6px;background:${bgColor};overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;margin:6px auto;box-shadow:0 0 0 1px ${borderColor},0 6px 16px ${shadowColor};`;
    const table = document.createElement('table');
    table.style.cssText = `width:100%;min-width:520px;border-collapse:separate;border-spacing:0;table-layout:auto;background:${bgColor};`;
    const headers = json.headers || [];
    if (headers.length) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      headers.forEach((h, i) => {
        const th = document.createElement('th');
        let style = `border-bottom:1px solid ${dark?'rgba(255,255,255,0.14)':'rgba(0,0,0,0.16)'};border-right:1px solid ${borderColor};padding:10px 12px;text-align:left;font-size:16px;line-height:1.2;color:${textColor};background:${headerBg};font-weight:700;font-family:Georgia,"Times New Roman",serif;white-space:nowrap;`;
        if (i === headers.length-1) style += 'border-right:none;';
        th.style.cssText = style; th.textContent = h; tr.appendChild(th);
      });
      thead.appendChild(tr); table.appendChild(thead);
    }
    const tbody = document.createElement('tbody');
    (json.rows||[]).forEach((row, ri) => {
      const tr = document.createElement('tr');
      row.forEach((cell, i) => {
        const td = document.createElement('td');
        let style = `border-bottom:1px solid ${borderColor};border-right:1px solid ${borderColor};padding:10px 12px;text-align:${i>0?'center':'left'};font-size:16px;line-height:1.2;color:${textColor};background:${bgColor};font-family:Georgia,"Times New Roman",serif;white-space:nowrap;`;
        if (i === row.length-1) style += 'border-right:none;';
        if (ri === (json.rows||[]).length-1) style += 'border-bottom:none;';
        td.style.cssText = style; td.textContent = cell; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); wrap.appendChild(table); container.appendChild(wrap);
  }

  function renderNativeBarChart(container, json) {
    const dark = _wIsDark();
    const defaultColors = ['#6F5AF6','#e74c3c','#27ae60','#f39c12','#3b82f6','#10b981','#ec4899','#8b5cf6','#f59e0b','#2f80ed'];
    const data = (json.data||json.bars||[]).map((d,i) => ({
      label: d.label||'?', value: typeof d.value==='number'?d.value:parseFloat(d.value)||0,
      color: d.color||defaultColors[i%defaultColors.length], unit: d.unit||''
    }));
    const valueColor = dark?'#eee':'#333', labelColor = dark?'#aaa':'#666', legendColor = dark?'#ccc':'#444';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:min(100%,500px);display:flex;flex-direction:column;align-items:center;gap:14px;margin:6px auto;';
    const chartEl = document.createElement('div');
    chartEl.style.cssText = 'width:100%;display:flex;align-items:flex-end;gap:10px;height:220px;padding:20px 14px;border-radius:14px;background:transparent;';
    const max = data.length ? Math.max(...data.map(d=>d.value)) : 1;
    data.forEach((item,i) => {
      const pct = max>0?(item.value/max)*100:0;
      const itemEl = document.createElement('div');
      itemEl.style.cssText = 'flex:1;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;';
      itemEl.innerHTML = `<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:${valueColor};">${item.value}${item.unit}</div><div style="width:100%;height:150px;display:flex;align-items:flex-end;justify-content:center;"><div style="width:100%;max-width:48px;height:${pct}%;background:${item.color};border-radius:8px 8px 0 0;transform-origin:bottom;animation:barGrow 700ms ease-out ${i*70}ms both;box-shadow:0 4px 14px rgba(111,90,246,0.25);"></div></div><div style="margin-top:10px;font-size:11px;font-weight:500;color:${labelColor};text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${item.label}</div>`;
      chartEl.appendChild(itemEl);
    });
    const legendEl = document.createElement('div');
    legendEl.style.cssText = `display:flex;flex-wrap:wrap;gap:12px;justify-content:center;font-size:13px;font-weight:500;color:${legendColor};`;
    data.forEach(item => {
      const legItem = document.createElement('span');
      legItem.style.cssText = 'display:flex;align-items:center;gap:6px;';
      legItem.innerHTML = `<span style="width:12px;height:12px;border-radius:4px;background:${item.color};display:inline-block;"></span>${item.label} (${item.value})`;
      legendEl.appendChild(legItem);
    });
    _ensureStyle('barGrowStyle','@keyframes barGrow { from { transform:scaleY(0); } to { transform:scaleY(1); } }');
    wrap.appendChild(chartEl); wrap.appendChild(legendEl); container.appendChild(wrap);
  }

  function renderNativePieChart(container, json) {
    const defaultColors = ['#2f80ed','#e74c3c','#27ae60','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e','#c0392b','#2980b9'];
    const dark = _wIsDark();
    const legendColor = dark?'#eee':'#333';
    const rawData = json.data||json.slices||[];
    const data = rawData.map((d,i) => ({
      label: d.label||'?', value: typeof d.value==='number'?d.value:parseFloat(d.value)||0,
      color: d.color||defaultColors[i%defaultColors.length]
    }));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:min(100%,480px);display:flex;flex-direction:column;align-items:center;gap:16px;margin:6px auto;';
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 400 400');
    svg.style.cssText = 'width:100%;height:auto;background:transparent;';
    const g = document.createElementNS(ns,'g');
    g.setAttribute('transform','translate(200,200)');
    svg.appendChild(g);
    const total = data.reduce((s,d)=>s+d.value,0)||1;
    function describeArc(r,sa,ea) {
      const x1=r*Math.cos(sa),y1=r*Math.sin(sa),x2=r*Math.cos(ea),y2=r*Math.sin(ea);
      const large=ea-sa>Math.PI?1:0;
      return `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    }
    function animateSlice(path,sa,ea,dur) {
      const t0=performance.now();
      function frame(now) {
        const p=Math.min((now-t0)/dur,1),e=1-Math.pow(1-p,3),cur=sa+(ea-sa)*e;
        path.setAttribute('d',describeArc(140,sa,Math.max(sa+0.01,cur)));
        if(p<1) requestAnimationFrame(frame); else path.setAttribute('d',describeArc(140,sa,ea));
      }
      requestAnimationFrame(frame);
    }
    let sa=-Math.PI/2;
    const legendEl = document.createElement('div');
    legendEl.style.cssText = `display:flex;flex-wrap:wrap;gap:12px;justify-content:center;font-size:14px;font-weight:500;color:${legendColor};`;
    data.forEach(item => {
      const sliceAngle=(item.value/total)*2*Math.PI,ea=sa+sliceAngle;
      const path=document.createElementNS(ns,'path');
      path.setAttribute('fill',item.color); path.setAttribute('stroke','transparent');
      path.style.cssText='transition:transform 0.3s ease,opacity 0.3s ease;cursor:pointer;transform-origin:50% 50%;';
      path.onmouseenter=()=>{path.style.opacity='0.85';path.style.transform='scale(1.04)';};
      path.onmouseleave=()=>{path.style.opacity='1';path.style.transform='scale(1)';};
      g.appendChild(path);
      animateSlice(path,sa,ea,600+Math.random()*400);
      const mid=(sa+ea)/2,tr=85;
      const txt=document.createElementNS(ns,'text');
      txt.setAttribute('x',tr*Math.cos(mid)); txt.setAttribute('y',tr*Math.sin(mid));
      txt.setAttribute('text-anchor','middle'); txt.setAttribute('dominant-baseline','middle');
      txt.style.cssText='font-size:12px;font-weight:bold;fill:#fff;pointer-events:none;';
      txt.textContent=((item.value/total)*100).toFixed(1)+'%';
      g.appendChild(txt);
      const legItem=document.createElement('span');
      legItem.style.cssText='display:flex;align-items:center;gap:6px;';
      legItem.innerHTML=`<span style="width:12px;height:12px;border-radius:4px;background:${item.color};display:inline-block;"></span>${item.label} (${item.value})`;
      legendEl.appendChild(legItem);
      sa=ea;
    });
    wrap.appendChild(svg); wrap.appendChild(legendEl); container.appendChild(wrap);
  }

  function renderNativeSheet(container, json) {
    const dark = _wIsDark();
    const surface=dark?'#1a1a1a':'#fffef8', border=dark?'#333':'#d6d6d6', textClr=dark?'#e8e8e8':'#222';
    const lines=json.lines||[];
    const wrap=document.createElement('div');
    wrap.style.cssText=`position:relative;width:min(92vw,640px);height:min(70vh,320px);border:1px solid ${border};background:${surface};box-shadow:0 8px 22px rgba(0,0,0,0.10);overflow:hidden;margin:6px auto;cursor:pointer;transition:width 0.4s cubic-bezier(0.2,0.9,0.3,1),height 0.4s cubic-bezier(0.2,0.9,0.3,1),border-radius 0.4s ease,box-shadow 0.4s ease;`;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.style.cssText='display:block;width:100%;height:100%;touch-action:none;';
    const backBtn=document.createElement('button');
    backBtn.style.cssText=`position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;border:none;background:rgba(0,0,0,0.45);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;opacity:0;pointer-events:none;transition:opacity 0.25s ease;`;
    backBtn.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    wrap.appendChild(svg); wrap.appendChild(backBtn); container.appendChild(wrap);
    const cfg={leftPad:72,rightPad:20,topPad:34,gap:32,textLift:10,minFont:10,maxFont:18,titleMaxFont:20};
    const mc=document.createElement('canvas'); const ctx=mc.getContext('2d');
    let isExpanded=false,scrollY=0,maxScroll=0,contentGroup=null;
    function fitFont(text,maxW,minF,maxF,bold) {
      let lo=minF,hi=maxF,best=lo;
      while(lo<=hi){const mid=Math.floor((lo+hi)/2);ctx.font=(bold?'700 ':'')+mid+'px Arial';if(ctx.measureText(text).width<=maxW){best=mid;lo=mid+1;}else hi=mid-1;}
      return best;
    }
    function clampScroll(){if(scrollY<0)scrollY=0;if(scrollY>maxScroll)scrollY=maxScroll;}
    function applyScrollTransform(){if(contentGroup)contentGroup.setAttribute('transform',`translate(0,${-scrollY})`);}
    function render(){
      const w=wrap.clientWidth||640,h=wrap.clientHeight||320,maxTW=w-cfg.leftPad-cfg.rightPad;
      svg.innerHTML='';
      const bg=document.createElementNS('http://www.w3.org/2000/svg','rect');
      bg.setAttribute('width',w);bg.setAttribute('height',h);bg.setAttribute('fill',surface);svg.appendChild(bg);
      const n=lines.length,contentHeight=Math.max(h,cfg.topPad+n*cfg.gap+cfg.gap);
      maxScroll=Math.max(0,contentHeight-h);clampScroll();
      contentGroup=document.createElementNS('http://www.w3.org/2000/svg','g');svg.appendChild(contentGroup);
      for(let i=0;i<=Math.ceil(contentHeight/cfg.gap)+1;i++){
        const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
        const y=i*cfg.gap;
        ln.setAttribute('x1',0);ln.setAttribute('y1',y);ln.setAttribute('x2',w);ln.setAttribute('y2',y);
        ln.setAttribute('stroke','rgba(95,145,255,0.16)');ln.setAttribute('stroke-width','1');
        ln.setAttribute('shape-rendering','crispEdges');contentGroup.appendChild(ln);
      }
      const marginX=cfg.leftPad-16;
      const mg=document.createElementNS('http://www.w3.org/2000/svg','line');
      mg.setAttribute('x1',marginX);mg.setAttribute('y1',0);mg.setAttribute('x2',marginX);mg.setAttribute('y2',contentHeight);
      mg.setAttribute('stroke','rgba(255,90,90,0.20)');mg.setAttribute('stroke-width','1');
      mg.setAttribute('shape-rendering','crispEdges');contentGroup.appendChild(mg);
      lines.forEach((item,i)=>{
        const y=cfg.topPad+i*cfg.gap-cfg.textLift,isT=!!item.title;
        const sz=fitFont(item.text,maxTW,isT?12:cfg.minFont,isT?cfg.titleMaxFont:cfg.maxFont,isT);
        const t=document.createElementNS('http://www.w3.org/2000/svg','text');
        t.setAttribute('x',cfg.leftPad);t.setAttribute('y',y);t.setAttribute('font-size',sz);
        t.setAttribute('font-family','Arial,Helvetica,sans-serif');t.setAttribute('font-weight',isT?'700':'400');
        t.setAttribute('fill',textClr);t.setAttribute('dominant-baseline','alphabetic');t.textContent=item.text;
        contentGroup.appendChild(t);
      });
      applyScrollTransform();
    }
    function setExpanded(value){
      isExpanded=value;
      if(isExpanded){wrap.style.cssText=`position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;box-shadow:none;z-index:1000;background:${surface};overflow:hidden;cursor:default;`;backBtn.style.opacity='1';backBtn.style.pointerEvents='auto';}
      else{wrap.style.cssText=`position:relative;width:min(92vw,640px);height:min(70vh,320px);border:1px solid ${border};background:${surface};box-shadow:0 8px 22px rgba(0,0,0,0.10);overflow:hidden;margin:6px auto;cursor:pointer;transition:width 0.4s cubic-bezier(0.2,0.9,0.3,1),height 0.4s cubic-bezier(0.2,0.9,0.3,1),border-radius 0.4s ease,box-shadow 0.4s ease;`;backBtn.style.opacity='0';backBtn.style.pointerEvents='none';}
      setTimeout(render,50);
    }
    const ds={active:false,pointerId:null,startY:0,lastY:0,moved:false,justDragged:false};
    svg.addEventListener('pointerdown',e=>{ds.active=true;ds.pointerId=e.pointerId;ds.startY=e.clientY;ds.lastY=e.clientY;ds.moved=false;try{svg.setPointerCapture(e.pointerId);}catch{}});
    svg.addEventListener('pointermove',e=>{if(!ds.active||e.pointerId!==ds.pointerId)return;const dy=e.clientY-ds.lastY;ds.lastY=e.clientY;if(maxScroll>0){e.preventDefault();scrollY-=dy;clampScroll();applyScrollTransform();}if(!ds.moved&&Math.abs(e.clientY-ds.startY)>6)ds.moved=true;});
    svg.addEventListener('pointerup',e=>{if(!ds.active||e.pointerId!==ds.pointerId)return;ds.active=false;if(ds.moved)ds.justDragged=true;});
    svg.addEventListener('pointercancel',()=>{ds.active=false;});
    svg.addEventListener('wheel',e=>{if(maxScroll<=0)return;e.preventDefault();scrollY+=e.deltaY;clampScroll();applyScrollTransform();},{passive:false});
    wrap.addEventListener('click',()=>{if(ds.justDragged){ds.justDragged=false;return;}if(!isExpanded)setExpanded(true);});
    backBtn.addEventListener('click',e=>{e.stopPropagation();setExpanded(false);});
    window.addEventListener('resize',render);
    requestAnimationFrame(render);
  }

  function renderNativeCodeBlock(container, json) {
    const dark=_wIsDark();
    const widgetBg=dark?'#1b1b1b':'#ffffff',border=dark?'#2f2f2f':'#d7d7d7',textColor=dark?'#e8e8e8':'#222222';
    const lineNumClr=dark?'#7d7d7d':'#8a8a8a',headerText=dark?'#f2f2f2':'#2a2a2a';
    const copyColor=dark?'#b0b0b0':'#5a5a5a',copyHover=dark?'#f2f2f2':'#2a2a2a';
    const feedbackBg=dark?'rgba(245,245,245,0.92)':'rgba(20,20,20,0.92)',feedbackTxt=dark?'#1b1b1b':'#fff';
    const shadow=dark?'0 8px 24px rgba(0,0,0,0.18)':'0 8px 24px rgba(0,0,0,0.05)';
    const lang=(json.language||json.lang||'code').toLowerCase();
    const rawCode=String(json.code||json.content||json.text||'');
    const codeLines=rawCode.replace(/\r\n/g,'\n').split('\n');
    const langIconMap={html:{color:'E34F26',name:'html5'},css:{color:'1572B6',name:'css3'},js:{color:'F7DF1E',name:'javascript'},javascript:{color:'F7DF1E',name:'javascript'},ts:{color:'3178C6',name:'typescript'},typescript:{color:'3178C6',name:'typescript'},py:{color:'3776AB',name:'python'},python:{color:'3776AB',name:'python'},rb:{color:'CC342D',name:'ruby'},ruby:{color:'CC342D',name:'ruby'},go:{color:'00ADD8',name:'go'},rs:{color:'DEA584',name:'rust'},rust:{color:'DEA584',name:'rust'},java:{color:'007396',name:'openjdk'},swift:{color:'F05138',name:'swift'},php:{color:'777BB4',name:'php'},c:{color:'A8B9CC',name:'c'},cpp:{color:'00599C',name:'cplusplus'},json:{color:'000000',name:'json'},xml:{color:'005FAD',name:'xml'},sql:{color:'4169E1',name:'sqlite'}};
    const langInfo=langIconMap[lang]||null;
    const langLabel=(json.label||lang||'code').toString().toUpperCase();
    const iconUrl=langInfo?`https://cdn.simpleicons.org/${langInfo.name}/${langInfo.color}`:'';
    function wrapSpan(cls,v){return `<span class="${cls}">${v}</span>`;}
    function highlightHtml(line){
      let html=_escapeHtml(line);
      html=html.replace(/(&lt;!--[\s\S]*?--&gt;)/g,(_,m)=>wrapSpan('comment',m));
      html=html.replace(/(&lt;!DOCTYPE[\s\S]*?&gt;)/gi,(_,m)=>wrapSpan('keyword',m));
      html=html.replace(/(&lt;\/?)([A-Za-z][\w:-]*)([\s\S]*?)(\/?&gt;)/g,(_,open,tag,attrs,close)=>{
        let out=wrapSpan('punct',open)+wrapSpan('tag',tag);
        if(attrs&&attrs.trim()){let rest=attrs;rest=rest.replace(/([A-Za-z_:][\w:.-]*)(\s*=)/g,(_,name,eq)=>wrapSpan('attr',name)+wrapSpan('operator',eq));rest=rest.replace(/(&quot;.*?&quot;)/g,(_,s)=>wrapSpan('string',s));rest=rest.replace(/(&#39;.*?&#39;)/g,(_,s)=>wrapSpan('string',s));out+=rest;}
        out+=wrapSpan('punct',close);return out;
      });
      return html;
    }
    function highlightGeneric(line){
      let html=_escapeHtml(line);const stash=[];
      const hold=token=>{const key=`\u0000${stash.length}\u0000`;stash.push(token);return key;};
      html=html.replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/g,m=>hold(wrapSpan('string',m)));
      const commentRules=[];
      if(lang==='sql'){commentRules.push(/--.*/g);}
      else if(['py','python','rb','ruby'].includes(lang)){commentRules.push(/#.*/g);}
      else if(['js','javascript','ts','typescript','java','c','cpp','cplusplus','go','rs','rust','swift','php'].includes(lang)){commentRules.push(/\/\/.*/g);commentRules.push(/\/\*[\s\S]*?\*\//g);}
      else{commentRules.push(/\/\/.*/g);commentRules.push(/#.*/g);commentRules.push(/--.*/g);commentRules.push(/\/\*[\s\S]*?\*\//g);}
      for(const re of commentRules)html=html.replace(re,m=>hold(wrapSpan('comment',m)));
      const keywords=['function','const','let','var','return','if','else','for','while','do','switch','case','break','continue','class','extends','implements','import','export','from','async','await','new','this','try','catch','throw','finally','true','false','null','undefined','def','lambda','yield','raise','in','is','and','or','not','public','private','protected','static','final','void','int','float','double','string','bool','char','interface','package','select','insert','update','delete','create','table','values','into','where','join','left','right','inner','outer','group','order','by','limit','offset'];
      const kwPat=new RegExp(`\\b(${keywords.join('|')})\\b`,'gi');
      html=html.replace(kwPat,m=>wrapSpan('keyword',m));
      html=html.replace(/\b(\d+(?:\.\d+)?)\b/g,m=>wrapSpan('number',m));
      for(let i=0;i<stash.length;i++)html=html.replace(new RegExp(`\\u0000${i}\\u0000`,'g'),stash[i]);
      return html;
    }
    function highlightLine(line){return(lang==='html'||lang==='xml')?highlightHtml(line):highlightGeneric(line);}
    _ensureStyle('nativeCodeBlockStylesV3',`
      .native-code-widget .code-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
      .native-code-widget pre{margin:0;width:max-content;min-width:100%;}
      .native-code-widget code{display:block;font-family:Consolas,Monaco,"Courier New",monospace;font-size:14px;line-height:1.7;}
      .native-code-widget .code-line{display:grid;grid-template-columns:52px minmax(0,1fr);align-items:start;white-space:pre;}
      .native-code-widget .line-number{position:sticky;left:0;z-index:1;text-align:right;padding:0 12px 0 16px;user-select:none;font-variant-numeric:tabular-nums;}
      .native-code-widget .line-content{padding-right:16px;white-space:pre;overflow-wrap:normal;word-break:normal;}
      .native-code-widget .punct{color:inherit;}
      .native-code-widget.theme-dark .keyword{color:#ff7b72;font-weight:500;}
      .native-code-widget.theme-dark .string{color:#a5d6ff;}
      .native-code-widget.theme-dark .comment{color:#8b949e;font-style:italic;}
      .native-code-widget.theme-dark .number{color:#79c0ff;}
      .native-code-widget.theme-dark .tag{color:#7ee787;}
      .native-code-widget.theme-dark .attr{color:#d2a8ff;}
      .native-code-widget.theme-dark .operator{color:#c9d1d9;}
      .native-code-widget.theme-light .keyword{color:#b00020;font-weight:600;}
      .native-code-widget.theme-light .string{color:#005cc5;}
      .native-code-widget.theme-light .comment{color:#6a737d;font-style:italic;}
      .native-code-widget.theme-light .number{color:#0969da;}
      .native-code-widget.theme-light .tag{color:#0a7a2f;}
      .native-code-widget.theme-light .attr{color:#6f42c1;}
      .native-code-widget.theme-light .operator{color:#555;}
    `);
    const widgetEl=document.createElement('div');
    widgetEl.className=`native-code-widget ${dark?'theme-dark':'theme-light'}`;
    widgetEl.style.cssText=`width:min(100%,760px);background:${widgetBg};border:1.5px solid ${border};border-radius:16px;overflow:hidden;box-shadow:${shadow};margin:6px auto;position:relative;`;
    const header=document.createElement('div');
    header.style.cssText=`height:42px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 12px 0 14px;background:${widgetBg};position:relative;z-index:2;`;
    const titleWrap=document.createElement('div');
    titleWrap.style.cssText=`display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:${headerText};letter-spacing:0.2px;text-transform:uppercase;`;
    if(iconUrl){const img=document.createElement('img');img.src=iconUrl;img.alt='';img.style.cssText='width:16px;height:16px;display:block;';titleWrap.appendChild(img);}
    const titleSpan=document.createElement('span');titleSpan.textContent=langLabel;titleWrap.appendChild(titleSpan);
    const copyBtn=document.createElement('button');
    copyBtn.type='button';copyBtn.setAttribute('aria-label','Copiar código');
    copyBtn.style.cssText=`width:26px;height:26px;border:none;background:transparent;display:grid;place-items:center;cursor:pointer;padding:0;color:${copyColor};flex:0 0 auto;transition:color 0.2s ease,transform 0.2s ease;`;
    copyBtn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;display:block;"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    copyBtn.onmouseenter=()=>{copyBtn.style.color=copyHover;};copyBtn.onmouseleave=()=>{copyBtn.style.color=copyColor;};
    copyBtn.onmousedown=()=>{copyBtn.style.transform='scale(0.94)';};copyBtn.onmouseup=()=>{copyBtn.style.transform='scale(1)';};
    const feedback=document.createElement('div');
    feedback.style.cssText=`position:absolute;top:48px;right:14px;background:${feedbackBg};color:${feedbackTxt};font-size:12px;padding:6px 10px;border-radius:999px;opacity:0;transform:translateY(-4px);transition:0.2s ease;pointer-events:none;z-index:5;`;
    feedback.textContent='Copiado';
    copyBtn.addEventListener('click',async()=>{await _copyText(rawCode);_showToast(feedback,'Copiado');});
    header.appendChild(titleWrap);header.appendChild(copyBtn);
    const scrollDiv=document.createElement('div');
    scrollDiv.className='code-scroll';scrollDiv.style.cssText=`background:${widgetBg};`;
    const pre=document.createElement('pre');const code=document.createElement('code');
    code.style.cssText=`display:block;background:${widgetBg};color:${textColor};`;
    codeLines.forEach((line,index)=>{
      const row=document.createElement('div');row.className='code-line';
      const number=document.createElement('div');number.className='line-number';number.style.cssText=`color:${lineNumClr};background:${widgetBg};`;number.textContent=String(index+1);
      const content=document.createElement('div');content.className='line-content';content.style.color=textColor;content.innerHTML=highlightLine(line);
      row.appendChild(number);row.appendChild(content);code.appendChild(row);
    });
    pre.appendChild(code);scrollDiv.appendChild(pre);
    widgetEl.appendChild(header);widgetEl.appendChild(feedback);widgetEl.appendChild(scrollDiv);
    container.appendChild(widgetEl);
  }

  function renderNativeMarket(container, json) {
    const type=json.type||'forex',symbol=json.symbol||'USDEUR',name=json.name||symbol;
    const wrap=document.createElement('div');
    wrap.style.cssText='width:min(92vw,420px);background:#111318;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.22);margin:6px auto;';
    wrap.innerHTML=`<div id="mktStatus_${symbol}" style="text-align:center;padding:40px 16px;font-size:13px;color:#555;font-family:Arial,sans-serif;"><div style="width:20px;height:20px;border:2px solid #222;border-top-color:#6F5AF6;border-radius:50%;animation:mktSpin 0.7s linear infinite;margin:0 auto 10px;"></div>A carregar...</div><div id="mktBlock_${symbol}" style="display:none;"><div style="display:flex;align-items:center;justify-content:space-between;padding:20px 16px 8px;"><div style="display:flex;align-items:center;gap:12px;"><img id="mktLogo_${symbol}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;background:#1e2128;" src="" alt="" onerror="this.style.display='none';document.getElementById('mktFallback_${symbol}').style.display='flex';" /><div id="mktFallback_${symbol}" style="width:44px;height:44px;border-radius:50%;background:#1e2128;display:none;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;"></div><div><div id="mktName_${symbol}" style="font-size:15px;font-weight:700;color:#fff;font-family:Arial,sans-serif;"></div><div id="mktSym_${symbol}" style="font-size:12px;color:#555;margin-top:2px;font-family:Arial,sans-serif;"></div></div></div><div style="text-align:right;"><div id="mktPrice_${symbol}" style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;font-family:Arial,sans-serif;"></div><div id="mktChange_${symbol}" style="display:inline-flex;align-items:center;font-size:12px;font-weight:700;padding:3px 8px;border-radius:6px;margin-top:4px;font-family:Arial,sans-serif;"></div></div></div><div style="padding:8px 10px 4px;"><canvas id="mktCanvas_${symbol}" style="width:100%;height:150px;display:block;border-radius:12px;"></canvas></div><div style="display:flex;justify-content:center;gap:4px;padding:8px 16px 16px;">${['1D','1S','1M','3M','1A'].map((tf,i)=>`<button onclick="mktSetTf_${symbol}(this,'${tf}')" style="background:${i===0?'#1e2128':'none'};border:none;color:${i===0?'#fff':'#444'};font-size:12px;font-weight:700;padding:5px 12px;border-radius:8px;cursor:pointer;font-family:Arial,sans-serif;">${tf}</button>`).join('')}</div></div>`;
    _ensureStyle('mktSpinStyle','@keyframes mktSpin { to { transform:rotate(360deg); } }');
    container.appendChild(wrap);
    const TF={'1D':{days:1,points:96,vol:0.003},'1S':{days:7,points:168,vol:0.005},'1M':{days:30,points:120,vol:0.008},'3M':{days:90,points:90,vol:0.010},'1A':{days:365,points:120,vol:0.015}};
    function simHist(price,points,vol){const d=[];let p=price*(0.85+Math.random()*0.1);for(let i=0;i<points;i++){p+=(Math.random()-0.48)*price*vol;p=Math.max(p,price*0.5);d.push(p);}d.push(price);return d;}
    function drawChart(prices,isUp){
      const canvas=document.getElementById(`mktCanvas_${symbol}`);if(!canvas)return;
      const dpr=window.devicePixelRatio||1,W=canvas.parentElement.offsetWidth-20,H=150;
      canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';
      const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
      const min=Math.min(...prices),max=Math.max(...prices),range=max-min||1;
      const pad={t:10,b:10,l:4,r:4},w=W-pad.l-pad.r,h=H-pad.t-pad.b;
      const pts=prices.map((v,i)=>({x:pad.l+(i/(prices.length-1))*w,y:pad.t+(1-(v-min)/range)*h}));
      const color=isUp?'#22c55e':'#ef4444';
      const grad=ctx.createLinearGradient(0,pad.t,0,H-pad.b);
      grad.addColorStop(0,color+'55');grad.addColorStop(1,color+'00');
      ctx.clearRect(0,0,W,H);
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      for(let i=1;i<pts.length;i++){const cx=(pts[i-1].x+pts[i].x)/2;ctx.bezierCurveTo(cx,pts[i-1].y,cx,pts[i].y,pts[i].x,pts[i].y);}
      ctx.lineTo(pts[pts.length-1].x,H-pad.b);ctx.lineTo(pts[0].x,H-pad.b);ctx.closePath();
      ctx.fillStyle=grad;ctx.fill();
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      for(let i=1;i<pts.length;i++){const cx=(pts[i-1].x+pts[i].x)/2;ctx.bezierCurveTo(cx,pts[i-1].y,cx,pts[i].y,pts[i].x,pts[i].y);}
      ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.stroke();
      const last=pts[pts.length-1];ctx.beginPath();ctx.arc(last.x,last.y,4.5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#111318';ctx.lineWidth=2;ctx.stroke();
    }
    function formatPrice(p){if(type==='forex')return p.toFixed(4);if(p>=1000)return'$'+p.toLocaleString('en-US',{maximumFractionDigits:2});if(p>=1)return'$'+p.toFixed(2);return'$'+p.toFixed(6);}
    function showAsset(data){
      const isUp=data.change>=0;
      const logoEl=document.getElementById(`mktLogo_${symbol}`),fallbackEl=document.getElementById(`mktFallback_${symbol}`);
      if(data.logoUrl){logoEl.src=data.logoUrl;logoEl.style.display='block';fallbackEl.style.display='none';}
      else{logoEl.style.display='none';fallbackEl.style.display='flex';fallbackEl.textContent=(data.symbol||symbol).slice(0,2).toUpperCase();}
      document.getElementById(`mktName_${symbol}`).textContent=data.name;
      document.getElementById(`mktSym_${symbol}`).textContent=data.symbol+' · '+type.toUpperCase();
      document.getElementById(`mktPrice_${symbol}`).textContent=formatPrice(data.price);
      const chEl=document.getElementById(`mktChange_${symbol}`);
      chEl.textContent=(isUp?'▲ +':'▼ ')+Math.abs(data.change).toFixed(2)+'%';
      chEl.style.cssText=`display:inline-flex;align-items:center;font-size:12px;font-weight:700;padding:3px 8px;border-radius:6px;margin-top:4px;background:${isUp?'#0d2e1a':'#2e0d0d'};color:${isUp?'#22c55e':'#ef4444'};`;
      document.getElementById(`mktStatus_${symbol}`).style.display='none';
      document.getElementById(`mktBlock_${symbol}`).style.display='block';
      setTimeout(()=>drawChart(data.prices,isUp),50);
    }
    function showError(msg){const el=document.getElementById(`mktStatus_${symbol}`);el.innerHTML=`<div style="color:#ef4444;font-size:13px;font-family:Arial,sans-serif;">${msg}</div>`;}
    async function load(tf){
      document.getElementById(`mktStatus_${symbol}`).innerHTML='<div style="width:20px;height:20px;border:2px solid #222;border-top-color:#6F5AF6;border-radius:50%;animation:mktSpin 0.7s linear infinite;margin:0 auto 10px;"></div>A carregar...';
      document.getElementById(`mktStatus_${symbol}`).style.display='block';
      document.getElementById(`mktBlock_${symbol}`).style.display='none';
      try{
        let data;
        if(type==='forex'){
          const base=symbol.slice(0,3).toUpperCase(),quote=(symbol.slice(3,6).toUpperCase()||'USD');
          const res=await fetch(`https://open.er-api.com/v6/latest/${base}`);
          const d=await res.json();const price=d.rates?.[quote]||d.rates?.USD;
          const prices=simHist(price,TF[tf].points,0.002);
          data={price,change:((price-prices[0])/prices[0])*100,prices,name:`${base}/${quote}`,symbol:`${base}/${quote}`,logoUrl:''};
        }else if(type==='crypto'){
          const CRYPTO_IDS={BTC:'bitcoin',ETH:'ethereum',SOL:'solana',BNB:'binancecoin',XRP:'ripple',ADA:'cardano',DOGE:'dogecoin',AVAX:'avalanche-2'};
          const id=CRYPTO_IDS[symbol.toUpperCase()];
          const priceRes=await fetch(`https://api.coinbase.com/v2/prices/${symbol.toUpperCase()}-USD/spot`);
          const priceData=await priceRes.json();const price=parseFloat(priceData.data.amount);
          let prices;
          try{const hRes=await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${TF[tf].days}&precision=2`);const hData=await hRes.json();prices=(hData.prices||[]).map(p=>p[1]);if(!prices.length)throw new Error('No history');}
          catch{prices=simHist(price,TF[tf].points,TF[tf].vol);}
          data={price,change:((price-prices[0])/prices[0])*100,prices,name,symbol:symbol.toUpperCase(),logoUrl:''};
        }else{
          const price=100+Math.random()*50;const prices=simHist(price,TF[tf].points,TF[tf].vol);
          data={price,change:((price-prices[0])/prices[0])*100,prices,name,symbol,logoUrl:''};
        }
        showAsset(data);
      }catch(e){showError('Erro: '+e.message);}
    }
    window[`mktSetTf_${symbol}`]=(el,tf)=>{
      el.closest('div').querySelectorAll('button').forEach(b=>{b.style.background='none';b.style.color='#444';});
      el.style.background='#1e2128';el.style.color='#fff';load(tf);
    };
    load('1D');
  }

  function renderNativeCalendar(container, json) {
    const dark=_wIsDark();
    const eventsData={};
    (json.events||[]).forEach(ev=>{if(!eventsData[ev.date])eventsData[ev.date]=[];eventsData[ev.date].push({name:ev.name||ev.title||'',time:ev.time||'',color:ev.color||'#6F5AF6'});});
    const wrap=document.createElement('div');
    wrap.style.cssText=`width:min(92vw,420px);background:${dark?'#1b1b1b':'#ffffff'};border:1.5px solid ${dark?'#333':'#e0e0e0'};border-radius:24px;box-shadow:${dark?'0 10px 30px rgba(0,0,0,0.3)':'0 8px 24px rgba(0,0,0,0.06)'};padding:20px 18px;margin:6px auto;overflow:hidden;font-family:'Segoe UI',Roboto,system-ui,sans-serif;`;
    const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const today=new Date();today.setHours(0,0,0,0);
    let current=new Date(today.getFullYear(),today.getMonth(),1);
    const pad2=n=>String(n).padStart(2,'0');
    const dateKey=(y,m,d)=>`${y}-${pad2(m+1)}-${pad2(d)}`;
    let selectedDate=dateKey(today.getFullYear(),today.getMonth(),today.getDate());
    const todayBg=dark?'#2a2a40':'#ede9ff',todayTx=dark?'#a78bfa':'#6F5AF6';
    const selBg=dark?'#7c3aed':'#6F5AF6',selTx='#fff',hoverBg=dark?'#2a2a3a':'#f0eeff';
    const textClr=dark?'#eee':'#222',mutedClr=dark?'#888':'#999',evBg=dark?'#252535':'#f7f6ff';
    const dotColor=dark?'#a78bfa':'#6F5AF6',navBg=dark?'#2a2a2a':'#f5f5f5',bdrClr=dark?'#333':'#e0e0e0';
    wrap.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;"><button id="calPrev" style="background:${navBg};border:none;border-radius:12px;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;color:${textClr};">‹</button><div id="calTitle" style="font-size:18px;font-weight:700;color:${textClr};text-transform:capitalize;"></div><button id="calNext" style="background:${navBg};border:none;border-radius:12px;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;color:${textClr};">›</button></div><div style="display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:8px;">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>`<span style="text-align:center;font-size:11px;font-weight:600;color:${mutedClr};padding:4px 0;">${d}</span>`).join('')}</div><div id="calGrid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;"></div><div style="margin-top:16px;border-top:1px solid ${bdrClr};padding-top:14px;"><div style="font-size:12px;font-weight:700;color:${mutedClr};margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Eventos do dia</div><div id="calEvents"></div></div>`;
    container.appendChild(wrap);
    function renderGrid(){
      const y=current.getFullYear(),m=current.getMonth();
      wrap.querySelector('#calTitle').textContent=`${months[m]} ${y}`;
      const grid=wrap.querySelector('#calGrid');grid.innerHTML='';
      const firstDay=new Date(y,m,1).getDay(),daysInMonth=new Date(y,m+1,0).getDate(),daysInPrev=new Date(y,m,0).getDate();
      for(let i=firstDay-1;i>=0;i--)addDay(grid,daysInPrev-i,true,false,false,null);
      for(let d=1;d<=daysInMonth;d++){const key=dateKey(y,m,d);const date=new Date(y,m,d);addDay(grid,d,false,date.getTime()===today.getTime(),key===selectedDate,key);}
      const total=firstDay+daysInMonth,rem=total%7===0?0:7-total%7;
      for(let d=1;d<=rem;d++)addDay(grid,d,true,false,false,null);
      renderEvents();
    }
    function addDay(grid,num,otherMonth,isToday,isSelected,key){
      const el=document.createElement('div');
      el.style.cssText=`aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:14px;cursor:${otherMonth?'default':'pointer'};position:relative;transition:background 0.2s,color 0.2s,transform 0.2s;user-select:none;`;
      el.textContent=num;
      const hasEvent=key&&eventsData[key]?.length>0;
      if(otherMonth){el.style.color=mutedClr;el.style.opacity='0.4';}
      else if(isSelected){el.style.background=selBg;el.style.color=selTx;el.style.fontWeight='700';el.style.transform='scale(1.08)';}
      else if(isToday){el.style.background=todayBg;el.style.color=todayTx;el.style.fontWeight='700';}
      else{el.style.color=textClr;}
      if(hasEvent){const dot=document.createElement('span');dot.style.cssText=`position:absolute;bottom:3px;width:5px;height:5px;border-radius:50%;background:${isSelected?'#fff':dotColor};`;el.appendChild(dot);}
      if(!otherMonth&&key){
        el.onmouseenter=()=>{if(key!==selectedDate)el.style.background=hoverBg;};
        el.onmouseleave=()=>{if(key!==selectedDate)el.style.background=isToday?todayBg:'';};
        el.onclick=()=>{selectedDate=key;renderGrid();};
      }
      grid.appendChild(el);
    }
    function renderEvents(){
      const evEl=wrap.querySelector('#calEvents');const dayEvs=eventsData[selectedDate];
      if(!dayEvs||!dayEvs.length){evEl.innerHTML=`<div style="font-size:13px;color:${mutedClr};text-align:center;padding:12px 0;opacity:0.7;">Nenhum evento neste dia</div>`;return;}
      evEl.innerHTML=dayEvs.map(e=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:${evBg};margin-bottom:6px;"><div style="width:10px;height:10px;border-radius:50%;background:${e.color};flex-shrink:0;"></div><div style="flex:1;"><div style="font-size:14px;font-weight:600;color:${textClr};">${e.name}</div><div style="font-size:12px;color:${mutedClr};margin-top:2px;">${e.time}</div></div></div>`).join('');
    }
    wrap.querySelector('#calPrev').onclick=()=>{current.setMonth(current.getMonth()-1);renderGrid();};
    wrap.querySelector('#calNext').onclick=()=>{current.setMonth(current.getMonth()+1);renderGrid();};
    renderGrid();
  }

  function renderNativeTimer(container, json) {
    const dark=_wIsDark();
    const bg=dark?'#1b1b1b':'#ffffff',bdr=dark?'#2a2a2a':'#e5e5ea';
    const textClr=dark?'#f2f2f2':'#000',mutedClr=dark?'#939393':'#888',primary='#2F7BF6';
    let total=json.seconds||json.duration||60,remaining=total,running=false,interval=null;
    const wrap=document.createElement('div');
    wrap.style.cssText=`width:min(92vw,320px);background:${bg};border:1.5px solid ${bdr};border-radius:24px;padding:28px 20px;text-align:center;margin:6px auto;font-family:'Segoe UI',system-ui,sans-serif;`;
    const label=document.createElement('div');
    label.style.cssText=`font-size:13px;font-weight:600;color:${mutedClr};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;`;
    label.textContent=json.label||json.title||'Temporizador';
    const display=document.createElement('div');
    display.style.cssText=`font-size:48px;font-weight:700;color:${textClr};letter-spacing:-1px;margin-bottom:20px;font-variant-numeric:tabular-nums;`;
    const progressWrap=document.createElement('div');
    progressWrap.style.cssText=`height:4px;background:${bdr};border-radius:2px;margin-bottom:24px;overflow:hidden;`;
    const progressBar=document.createElement('div');
    progressBar.style.cssText=`height:100%;background:${primary};border-radius:2px;transition:width 0.5s linear;width:100%;`;
    progressWrap.appendChild(progressBar);
    const btnRow=document.createElement('div');
    btnRow.style.cssText='display:flex;gap:12px;justify-content:center;';
    const startBtn=document.createElement('button');
    startBtn.style.cssText=`padding:10px 28px;background:${primary};color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;`;
    startBtn.textContent='Iniciar';
    const resetBtn=document.createElement('button');
    resetBtn.style.cssText=`padding:10px 20px;background:${bdr};color:${textClr};border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;`;
    resetBtn.textContent='Reiniciar';
    function format(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;if(h>0)return`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;return`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
    function update(){display.textContent=format(remaining);progressBar.style.width=((remaining/total)*100)+'%';progressBar.style.background=remaining<=10?'#ef4444':primary;}
    startBtn.onclick=()=>{if(running){clearInterval(interval);running=false;startBtn.textContent='Continuar';}else{if(remaining<=0)return;running=true;startBtn.textContent='Pausar';interval=setInterval(()=>{remaining--;update();if(remaining<=0){clearInterval(interval);running=false;startBtn.textContent='Iniciar';}},1000);}};
    resetBtn.onclick=()=>{clearInterval(interval);running=false;remaining=total;startBtn.textContent='Iniciar';update();};
    btnRow.appendChild(startBtn);btnRow.appendChild(resetBtn);
    wrap.appendChild(label);wrap.appendChild(display);wrap.appendChild(progressWrap);wrap.appendChild(btnRow);
    container.appendChild(wrap);update();
  }

  function renderNativeMindMap(container, json) {
    const dark=_wIsDark();
    const cardBg=dark?'#1b1b1b':'#ffffff',linkClr=dark?'#666':'#bbb';
    const wrap=document.createElement('div');
    wrap.style.cssText=`position:relative;width:min(90vw,520px);height:min(85vh,520px);background:${cardBg};border-radius:24px;box-shadow:${dark?'0 10px 30px rgba(0,0,0,0.4)':'0 10px 30px rgba(0,0,0,0.08)'};overflow:hidden;margin:6px auto;cursor:pointer;transition:all 0.5s cubic-bezier(0.2,0.9,0.3,1);`;
    const svgNs='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNs,'svg');svg.style.cssText='width:100%;height:100%;display:block;';
    const mainG=document.createElementNS(svgNs,'g');svg.appendChild(mainG);wrap.appendChild(svg);
    const backBtn=document.createElement('button');
    backBtn.style.cssText=`position:absolute;top:14px;right:14px;width:38px;height:38px;background:rgba(0,0,0,0.45);color:#fff;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;opacity:0;pointer-events:none;transition:opacity 0.25s ease;`;
    backBtn.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    wrap.appendChild(backBtn);container.appendChild(wrap);
    const treeData=json.tree||json.data||{id:'root',label:json.title||'Root',color:'#2F7BF6',children:[]};
    let collapsedNodes={},panX=0,panY=0,scale=1,nodePositions={};
    const levelWidth=170,nodeH=40,vSpacing=nodeH+28;
    let isExpanded=false,touchMoved=false;
    function getSubH(node){if(collapsedNodes[node.id]||!node.children?.length)return vSpacing;return node.children.reduce((s,c)=>s+getSubH(c),0);}
    function layout(node,x,yStart){const pos={},h=getSubH(node),yCenter=yStart+h/2;pos[node.id]={x,y:yCenter};if(!collapsedNodes[node.id]&&node.children?.length){let curY=yStart;for(const c of node.children){Object.assign(pos,layout(c,x+levelWidth,curY));curY+=getSubH(c);}}return pos;}
    function applyTransform(){mainG.setAttribute('transform',`translate(${panX},${panY}) scale(${scale})`);}
    function fit(){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const id in nodePositions){const{x,y}=nodePositions[id];minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}const pad=150,tw=maxX-minX+pad*2,th=maxY-minY+pad*2;svg.setAttribute('viewBox',`${minX-pad} ${minY-pad} ${tw} ${th}`);panX=0;panY=0;scale=1;}
    function render(){
      nodePositions=layout(treeData,0,0);mainG.innerHTML='';
      function drawLinks(node){if(!collapsedNodes[node.id]&&node.children){node.children.forEach(child=>{const fr=nodePositions[node.id],to=nodePositions[child.id];if(fr&&to){const path=document.createElementNS(svgNs,'path');const dx=to.x-fr.x;path.setAttribute('d',`M${fr.x},${fr.y} C${fr.x+dx*0.5},${fr.y} ${to.x-dx*0.5},${to.y} ${to.x},${to.y}`);path.setAttribute('fill','none');path.setAttribute('stroke',linkClr);path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linecap','round');mainG.appendChild(path);}drawLinks(child);});}}
      function drawNodes(node){if(!nodePositions[node.id])return;const{x,y}=nodePositions[node.id];const g=document.createElementNS(svgNs,'g');g.setAttribute('transform',`translate(${x},${y})`);const textLen=(node.label||'').length*7+24,rW=Math.max(70,textLen);const rect=document.createElementNS(svgNs,'rect');rect.setAttribute('x',-rW/2);rect.setAttribute('y',-nodeH/2);rect.setAttribute('width',rW);rect.setAttribute('height',nodeH);rect.setAttribute('fill',node.color||'#2F7BF6');rect.setAttribute('rx','8');const text=document.createElementNS(svgNs,'text');text.setAttribute('text-anchor','middle');text.setAttribute('dominant-baseline','central');text.style.cssText='fill:#fff;font-size:12px;font-weight:600;pointer-events:none;';text.textContent=node.label;g.appendChild(rect);g.appendChild(text);g.style.cursor='pointer';g.onclick=(e)=>{e.stopPropagation();if(node.children?.length){collapsedNodes[node.id]=!collapsedNodes[node.id];render();fit();}};mainG.appendChild(g);if(!collapsedNodes[node.id]&&node.children)node.children.forEach(drawNodes);}
      drawLinks(treeData);drawNodes(treeData);applyTransform();
    }
    function setExpanded(value){
      isExpanded=value;
      if(isExpanded){wrap.style.cssText=`position:fixed;top:0;left:0;width:100vw;height:100vh;background:${cardBg};border-radius:0;z-index:1000;overflow:hidden;cursor:default;`;backBtn.style.opacity='1';backBtn.style.pointerEvents='auto';svg.style.touchAction='none';}
      else{wrap.style.cssText=`position:relative;width:min(90vw,520px);height:min(85vh,520px);background:${cardBg};border-radius:24px;box-shadow:${dark?'0 10px 30px rgba(0,0,0,0.4)':'0 10px 30px rgba(0,0,0,0.08)'};overflow:hidden;margin:6px auto;cursor:pointer;transition:all 0.5s cubic-bezier(0.2,0.9,0.3,1);`;backBtn.style.opacity='0';backBtn.style.pointerEvents='none';svg.style.touchAction='auto';}
      setTimeout(()=>{render();fit();},50);
    }
    let isPan=false,panStart={x:0,y:0},initPan={x:0,y:0},initPinch=0,initScale=1;
    svg.addEventListener('touchstart',e=>{if(!isExpanded)return;if(e.touches.length===1){isPan=true;touchMoved=false;panStart={x:e.touches[0].clientX,y:e.touches[0].clientY};initPan={x:panX,y:panY};}else if(e.touches.length===2){isPan=false;initPinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);initScale=scale;}e.preventDefault();},{passive:false});
    svg.addEventListener('touchmove',e=>{if(!isExpanded)return;if(e.touches.length===1&&isPan){const dx=e.touches[0].clientX-panStart.x,dy=e.touches[0].clientY-panStart.y;if(Math.abs(dx)>4||Math.abs(dy)>4)touchMoved=true;panX=initPan.x+dx;panY=initPan.y+dy;applyTransform();}else if(e.touches.length===2&&initPinch>0){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);scale=Math.max(0.15,Math.min(3,initScale*(d/initPinch)));applyTransform();}e.preventDefault();},{passive:false});
    svg.addEventListener('touchend',e=>{if(e.touches.length<2)initPinch=0;if(e.touches.length===0)isPan=false;});
    svg.addEventListener('wheel',e=>{if(!isExpanded)return;e.preventDefault();const f=e.deltaY<0?1.1:0.9;scale=Math.max(0.15,Math.min(3,scale*f));applyTransform();},{passive:false});
    let isMPan=false,mouseMoved=false;
    svg.addEventListener('mousedown',e=>{if(!isExpanded)return;if(e.target.closest('g'))return;isMPan=true;mouseMoved=false;panStart={x:e.clientX,y:e.clientY};initPan={x:panX,y:panY};e.preventDefault();});
    window.addEventListener('mousemove',e=>{if(!isExpanded||!isMPan)return;if(Math.abs(e.clientX-panStart.x)>4||Math.abs(e.clientY-panStart.y)>4)mouseMoved=true;panX=initPan.x+e.clientX-panStart.x;panY=initPan.y+e.clientY-panStart.y;applyTransform();});
    window.addEventListener('mouseup',()=>{isMPan=false;});
    backBtn.addEventListener('click',e=>{e.stopPropagation();setExpanded(false);});
    wrap.addEventListener('click',e=>{if(isExpanded)return;if(e.target.closest('g'))return;if(touchMoved||mouseMoved)return;setExpanded(true);});
    render();fit();
  }

  function renderNativeMathGraph(container, json) {
    const dark=_wIsDark();
    const gridClr=dark?'#2a2a2a':'#e0e0e0',axisClr=dark?'#ccc':'#555';
    const wrap=document.createElement('div');
    wrap.style.cssText='width:min(100%,960px);margin:6px auto;display:flex;flex-direction:column;align-items:center;position:relative;';
    const svgNs='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNs,'svg');
    svg.setAttribute('viewBox','0 0 960 540');
    svg.style.cssText='display:block;width:100%;height:auto;background:transparent;cursor:grab;';
    const defs=document.createElementNS(svgNs,'defs');
    const clip=document.createElementNS(svgNs,'clipPath');
    const clipId='graphClip_'+Date.now();
    clip.setAttribute('id',clipId);
    const clipRect=document.createElementNS(svgNs,'rect');
    clipRect.setAttribute('x','60');clipRect.setAttribute('y','40');clipRect.setAttribute('width','840');clipRect.setAttribute('height','440');
    clip.appendChild(clipRect);defs.appendChild(clip);svg.appendChild(defs);
    const gridG=document.createElementNS(svgNs,'g'),axisG=document.createElementNS(svgNs,'g'),tickG=document.createElementNS(svgNs,'g'),labelG=document.createElementNS(svgNs,'g'),dataG=document.createElementNS(svgNs,'g');
    dataG.setAttribute('clip-path',`url(#${clipId})`);
    [gridG,axisG,tickG,labelG,dataG].forEach(g=>svg.appendChild(g));
    wrap.appendChild(svg);container.appendChild(wrap);
    const plot={x:60,y:40,w:840,h:440};
    let xMin=json.xMin??-10,xMax=json.xMax??10,yMin=json.yMin??-5,yMax=json.yMax??5;
    const expr=json.expression||json.expr||'sin(x)';
    let compiledFn=null;
    function mapX(x){return plot.x+((x-xMin)/(xMax-xMin))*plot.w;}
    function mapY(y){return plot.y+plot.h-((y-yMin)/(yMax-yMin))*plot.h;}
    function svgEl(n,a={}){const e=document.createElementNS(svgNs,n);for(const[k,v]of Object.entries(a))e.setAttribute(k,String(v));return e;}
    function addText(g,x,y,text,cls,anchor='middle'){const t=svgEl('text',{x,y,class:cls,'text-anchor':anchor,'dominant-baseline':'middle'});t.textContent=text;t.style.cssText=`font-size:${cls==='axis-label'?'12px':'10px'};fill:${dark?'#999':'#888'};user-select:none;font-family:Arial,sans-serif;`;g.appendChild(t);}
    function autoY(){if(!compiledFn)return;let min=Infinity,max=-Infinity;for(let i=0;i<=400;i++){const x=xMin+(i/400)*(xMax-xMin);try{const y=compiledFn.evaluate({x});if(isFinite(y)){min=Math.min(min,y);max=Math.max(max,y);}}catch{}}if(min!==Infinity&&max!==-Infinity){const pad=Math.max(1,(max-min)*0.15);yMin=min-pad;yMax=max+pad;if(Math.abs(yMax-yMin)<1e-6){yMin-=1;yMax+=1;}}}
    function draw(){
      [gridG,axisG,tickG,labelG,dataG].forEach(g=>g.innerHTML='');
      const xZero=mapX(0),yZero=mapY(0),xRange=xMax-xMin||1,yRange=yMax-yMin||1;
      let xStep=Math.pow(10,Math.floor(Math.log10(Math.abs(xRange/6)||1)));
      if(xRange/xStep>12)xStep*=2;if(xRange/xStep<4)xStep/=2;
      let yStep=Math.pow(10,Math.floor(Math.log10(Math.abs(yRange/6)||1)));
      if(yRange/yStep>12)yStep*=2;if(yRange/yStep<4)yStep/=2;
      for(let x=Math.ceil(xMin/xStep)*xStep;x<=xMax;x+=xStep){const px=mapX(x);if(px<plot.x||px>plot.x+plot.w)continue;gridG.appendChild(svgEl('line',{x1:px,y1:plot.y,x2:px,y2:plot.y+plot.h,stroke:gridClr,'stroke-width':'0.8','shape-rendering':'crispEdges'}));tickG.appendChild(svgEl('line',{x1:px,y1:yZero-3,x2:px,y2:yZero+3,stroke:axisClr,'stroke-width':'1','shape-rendering':'crispEdges'}));if(Math.abs(x)>xStep/100)addText(labelG,px,yZero+14,parseFloat(x.toFixed(8)),'tick-label');}
      for(let y=Math.ceil(yMin/yStep)*yStep;y<=yMax;y+=yStep){const py=mapY(y);if(py<plot.y||py>plot.y+plot.h)continue;gridG.appendChild(svgEl('line',{x1:plot.x,y1:py,x2:plot.x+plot.w,y2:py,stroke:gridClr,'stroke-width':'0.8','shape-rendering':'crispEdges'}));tickG.appendChild(svgEl('line',{x1:xZero-3,y1:py,x2:xZero+3,y2:py,stroke:axisClr,'stroke-width':'1','shape-rendering':'crispEdges'}));if(Math.abs(y)>yStep/100)addText(labelG,xZero-14,py,parseFloat(y.toFixed(8)),'tick-label','end');}
      if(0>=xMin&&0<=xMax)axisG.appendChild(svgEl('line',{x1:plot.x,y1:yZero,x2:plot.x+plot.w,y2:yZero,stroke:axisClr,'stroke-width':'2','shape-rendering':'crispEdges'}));
      if(0>=yMin&&0<=yMax){axisG.appendChild(svgEl('line',{x1:xZero,y1:plot.y,x2:xZero,y2:plot.y+plot.h,stroke:axisClr,'stroke-width':'2','shape-rendering':'crispEdges'}));axisG.appendChild(svgEl('circle',{cx:xZero,cy:yZero,r:3.5,fill:axisClr}));}
      addText(labelG,plot.x+plot.w-10,yZero-14,'X','axis-label','end');addText(labelG,xZero+14,plot.y+12,'Y','axis-label','start');
      if(compiledFn){const pts=[];const dx=(xMax-xMin)/500;for(let i=0;i<=500;i++){const x=xMin+i*dx;try{const y=compiledFn.evaluate({x});if(isFinite(y)&&!isNaN(y))pts.push([mapX(x),mapY(y)]);}catch{}}if(pts.length>1){let d=`M ${pts[0][0]} ${pts[0][1]}`;for(let i=1;i<pts.length;i++)d+=` L ${pts[i][0]} ${pts[i][1]}`;dataG.appendChild(svgEl('path',{d,fill:'none',stroke:'#6cb6ff','stroke-width':'2.8','stroke-linecap':'round','stroke-linejoin':'round'}));const stepIdx=Math.max(1,Math.floor(pts.length/8));for(let i=0;i<pts.length;i+=stepIdx)dataG.appendChild(svgEl('circle',{cx:pts[i][0],cy:pts[i][1],r:3.5,fill:'#e74c3c',stroke:dark?'#121212':'#f4f4f4','stroke-width':'1.5'}));}}
    }
    if(window.math){try{compiledFn=math.compile(expr);autoY();}catch{}draw();}
    else{const script=document.createElement('script');script.src='https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js';script.onload=()=>{try{compiledFn=math.compile(expr);autoY();}catch{}draw();};document.head.appendChild(script);}
    let isPan=false,panSt={x:0,y:0},panSave={};
    svg.addEventListener('mousedown',e=>{isPan=true;panSt={x:e.clientX,y:e.clientY};panSave={xMin,xMax,yMin,yMax};svg.style.cursor='grabbing';e.preventDefault();});
    window.addEventListener('mousemove',e=>{if(!isPan)return;const rect=svg.getBoundingClientRect();const sx=(panSave.xMax-panSave.xMin)/plot.w*(svg.viewBox.baseVal.width/rect.width);const sy=(panSave.yMax-panSave.yMin)/plot.h*(svg.viewBox.baseVal.height/rect.height);xMin=panSave.xMin-(e.clientX-panSt.x)*sx;xMax=panSave.xMax-(e.clientX-panSt.x)*sx;yMin=panSave.yMin+(e.clientY-panSt.y)*sy;yMax=panSave.yMax+(e.clientY-panSt.y)*sy;draw();});
    window.addEventListener('mouseup',()=>{isPan=false;svg.style.cursor='grab';});
    svg.addEventListener('wheel',e=>{e.preventDefault();const f=e.deltaY<0?0.9:1.1;const cx=(xMin+xMax)/2,cy=(yMin+yMax)/2;const nXR=(xMax-xMin)*f,nYR=(yMax-yMin)*f;xMin=cx-nXR/2;xMax=cx+nXR/2;yMin=cy-nYR/2;yMax=cy+nYR/2;draw();},{passive:false});
  }

  function renderNativeMapPlaceholder(container, json) {
    const dark=_wIsDark();
    const cardBg=dark?'#1b1b1b':'#ffffff';
    const uid='map_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    const wrap=document.createElement('div');
    wrap.style.cssText=`position:relative;width:min(90vw,420px);height:min(90vw,420px);background:${cardBg};border-radius:30px;box-shadow:0 20px 40px rgba(0,0,0,0.1);overflow:hidden;margin:6px auto;cursor:pointer;transition:all 0.4s cubic-bezier(0.2,0.9,0.4,1);`;
    const mapDiv=document.createElement('div');mapDiv.id=uid;mapDiv.style.cssText='width:100%;height:100%;background:#c8d6e5;';
    const overlay=document.createElement('div');overlay.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;z-index:5;';
    const backBtn=document.createElement('button');
    backBtn.style.cssText=`position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);backdrop-filter:blur(10px);color:#333;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;opacity:0;pointer-events:none;transition:opacity 0.25s ease;box-shadow:0 2px 8px rgba(0,0,0,0.1);`;
    backBtn.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    wrap.appendChild(mapDiv);wrap.appendChild(overlay);wrap.appendChild(backBtn);container.appendChild(wrap);
    let isExpanded=false,mapInstance=null;
    const lng=json.lng??json.longitude??json.lon??0,lat=json.lat??json.latitude??0,zoom=json.zoom??12;
    function initMap(){
      if(mapInstance||!window.maplibregl)return;
      mapInstance=new maplibregl.Map({container:uid,style:'https://tiles.openfreemap.org/styles/liberty',center:[lng,lat],zoom,pitch:50,bearing:0,attributionControl:false,antialias:true});
      mapInstance.on('load',()=>{mapInstance.flyTo({center:[lng,lat],zoom:zoom+0.5,pitch:55,speed:0.6});if(json.marker!==false)new maplibregl.Marker({color:'#2F7BF6'}).setLngLat([lng,lat]).addTo(mapInstance);});
      if(!window._mapInstances)window._mapInstances={};window._mapInstances[uid]=mapInstance;
      _ensureStyle('mapLibreHideAttrib','.maplibregl-ctrl-logo,.maplibregl-ctrl-attrib,.maplibregl-ctrl-group{display:none!important;}');
    }
    function setExpanded(value){
      isExpanded=value;
      if(isExpanded){wrap.style.cssText=`position:fixed;top:0;left:0;width:100vw;height:100vh;background:${cardBg};border-radius:0;z-index:1000;overflow:hidden;cursor:default;`;backBtn.style.opacity='1';backBtn.style.pointerEvents='auto';overlay.style.display='none';if(mapInstance)mapInstance.resize();}
      else{wrap.style.cssText=`position:relative;width:min(90vw,420px);height:min(90vw,420px);background:${cardBg};border-radius:30px;box-shadow:0 20px 40px rgba(0,0,0,0.1);overflow:hidden;margin:6px auto;cursor:pointer;transition:all 0.4s cubic-bezier(0.2,0.9,0.4,1);`;backBtn.style.opacity='0';backBtn.style.pointerEvents='none';overlay.style.display='block';if(mapInstance)mapInstance.resize();}
      setTimeout(()=>{if(mapInstance)mapInstance.resize();},50);
    }
    wrap.addEventListener('click',()=>{if(!isExpanded)setExpanded(true);});
    backBtn.addEventListener('click',e=>{e.stopPropagation();setExpanded(false);});
    if(window.maplibregl){initMap();}
    else{
      const link=document.createElement('link');link.rel='stylesheet';link.href='https://unpkg.com/maplibre-gl@4.3.2/dist/maplibre-gl.css';document.head.appendChild(link);
      const script=document.createElement('script');script.src='https://unpkg.com/maplibre-gl@4.3.2/dist/maplibre-gl.js';script.onload=()=>initMap();document.head.appendChild(script);
    }
  }

  function buildNativeWidgetDOM(widgetType, rawJson, container) {
    try {
      const json = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
      switch(widgetType) {
        case 'widget_table':    renderNativeTable(container, json); break;
        case 'widget_bar':      renderNativeBarChart(container, json); break;
        case 'widget_pie':      renderNativePieChart(container, json); break;
        case 'widget_sheet':    renderNativeSheet(container, json); break;
        case 'widget_code':     renderNativeCodeBlock(container, json); break;
        case 'widget_market':   renderNativeMarket(container, json); break;
        case 'widget_calendar': renderNativeCalendar(container, json); break;
        case 'widget_timer':    renderNativeTimer(container, json); break;
        case 'widget_mindmap':  renderNativeMindMap(container, json); break;
        case 'widget_graph':    renderNativeMathGraph(container, json); break;
        case 'widget_map':      renderNativeMapPlaceholder(container, json); break;
        default: container.textContent = 'Widget desconhecido';
      }
    } catch(e) { container.textContent = 'Erro ao carregar widget'; console.error('Widget error:', e); }
  }

  if (typeof window !== 'undefined') {
    window._copyCodeBtn = (btn) => {
      const code = btn.closest('.code-block-wrapper')?.querySelector('code');
      if (code) navigator.clipboard.writeText(code.textContent).then(()=>showToast('Código copiado!')).catch(()=>{});
    };
  }

  async function sendMessage(text, attachmentsOverride, skipClear) {
    const trimmed = (text||'').trim();
    const atts = attachmentsOverride !== undefined ? attachmentsOverride : pendingAttachments.slice();
    if (!trimmed && atts.length === 0) return;
    if (isStreaming) return;
    const isFirst = chatHistory.length === 0;
    isStreaming = true;
    chatHistory = [...chatHistory, { role:'user', content:trimmed }];
    displayMessages = [...displayMessages, { role:'user', content:trimmed, attachments:atts }];
    if (!skipClear) { inputText = ''; autoResize(); }
    if (attachmentsOverride === undefined) pendingAttachments = [];
    scrollToBottom();
    const assistantIdx = displayMessages.length;
    displayMessages = [...displayMessages, { role:'assistant', content:'', isStreaming:true, isThinking:thinkMoreMode, thinkingContent:'' }];
    scrollToBottom();
    const think = thinkMoreMode;
    const systemPrompt = GeminiApiService.buildSystemPrompt(currentLanguage, sheetsEnabled);
    const token = effectiveUser?.token || '';
    try {
      const stream = GeminiApiService.streamChat({ messages: chatHistory, systemPrompt, token, think, language: currentLanguage });
      for await (const chunk of stream) {
        if (chunk.type === 'think') {
          displayMessages[assistantIdx] = { ...displayMessages[assistantIdx], thinkingContent: displayMessages[assistantIdx].thinkingContent + chunk.text };
          displayMessages = [...displayMessages];
        } else if (chunk.type === 'token') {
          displayMessages[assistantIdx] = { ...displayMessages[assistantIdx], isThinking:false, content: displayMessages[assistantIdx].content + chunk.text };
          displayMessages = [...displayMessages]; scrollToBottom();
        } else if (chunk.type === 'done') {
          const finalContent = chunk.fullText || displayMessages[assistantIdx].content;
          chatHistory = [...chatHistory, { role:'assistant', content:finalContent }];
          displayMessages[assistantIdx] = { ...displayMessages[assistantIdx], content:finalContent, isStreaming:false, isThinking:false };
          displayMessages = [...displayMessages];
        } else if (chunk.type === 'credits_exhausted') {
          displayMessages[assistantIdx] = { ...displayMessages[assistantIdx], content:'⚠️ Créditos esgotados. Adquire mais créditos nas Definições.', isStreaming:false, isThinking:false };
          displayMessages = [...displayMessages];
        } else if (chunk.type === 'error') {
          displayMessages[assistantIdx] = { ...displayMessages[assistantIdx], content: chunk.message, isStreaming:false, isThinking:false };
          displayMessages = [...displayMessages];
        }
      }
    } catch (e) {
      displayMessages[assistantIdx] = { ...displayMessages[assistantIdx], content:'Erro de rede: '+e.message, isStreaming:false, isThinking:false };
      displayMessages = [...displayMessages];
    }
    isStreaming = false; scrollToBottom();
    if (isFirst && !titleGenerated) {
      titleGenerated = true;
      currentConvTitle = await GeminiApiService.generateTitle(trimmed, token, currentLanguage);
    }
    if (!isIncognito) {
      if (!currentConvId) { const id = await AuthApiService.createConversation(token, currentConvTitle, chatHistory); if (id) currentConvId = id; }
      else { await AuthApiService.updateConversation(token, currentConvId, currentConvTitle, chatHistory); }
      if (effectiveUser) {
        const list = await AuthApiService.listConversations(token);
        conversations = list.map(cv => ({ id:cv.id, title:cv.title, messages:cv.messages||[], updatedAt:cv.updatedAt||Date.now(), pinned:cv.pinned||false }));
      }
    }
  }

  function autoResize() {
    if (!textInputEl) return;
    textInputEl.style.height = 'auto';
    textInputEl.style.height = Math.min(textInputEl.scrollHeight, 150) + 'px';
  }

  function scrollToBottom() {
    if (!messagesEl) return;
    requestAnimationFrame(() => { if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight; });
    setTimeout(() => { if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight; }, 100);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      const isMobile = window.matchMedia('(hover:none) and (pointer:coarse)').matches;
      if (!isMobile && !e.shiftKey) { e.preventDefault(); if ((inputText.trim() || pendingAttachments.length) && !isStreaming) sendMessage(inputText); }
    }
  }

  function handleDrawerOpen() {
    drawerOpen = true;
    if (effectiveUser && activeApp === 'ai') {
      AuthApiService.listConversations(effectiveUser.token).then(list => {
        conversations = list.map(cv => ({ id:cv.id, title:cv.title, messages:cv.messages||[], updatedAt:cv.updatedAt||Date.now(), pinned:cv.pinned||false }));
      });
    }
  }

  function openApp(id) {
    activeApp = id; localStorage.setItem('nexa_active_app', id);
    showAppsPopup = false;
    if (id !== 'ai') { dispatch('nav', { to: id, data: { user: effectiveUser } }); } else { showToast('IA ativa'); }
  }

  function openAppsPopup(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    appsPopupPos = {
      bottom: window.innerHeight - rect.top + 8,
      right:  window.innerWidth - rect.right + 10,
    };
    showAppsPopup = !showAppsPopup;
  }

  function handleOpenConv(e) {
    if (isStreaming || isIncognito) { showToast(isIncognito ? 'Não é possível sair da conversa privada' : ''); return; }
    const conv = e.detail.conv;
    currentConvId = conv.id; currentConvTitle = conv.title; titleGenerated = true;
    chatHistory = [...conv.messages];
    displayMessages = conv.messages.map(m => ({ role:m.role, content:m.content }));
  }

  function handleConvOptions(e) { sheetConv = e.detail.conv; sheetMode = 'convOptions'; showSheet = true; }

  function newChat() {
    if (isIncognito) { showToast('Termina a conversa privada para criar uma nova'); return; }
    displayMessages = []; chatHistory = []; currentConvId = ''; currentConvTitle = 'Nova conversa'; titleGenerated = false; pendingAttachments = [];
  }

  function startIncognito() {
    displayMessages = []; chatHistory = []; currentConvId = ''; currentConvTitle = 'Conversa privada';
    titleGenerated = true; pendingAttachments = []; isIncognito = true;
    showToast('Conversa privada ativada');
  }

  function regenerate() {
    if (isStreaming) return;
    const lastUserIdx = [...displayMessages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;
    const realIdx = displayMessages.length - 1 - lastUserIdx;
    const userMsg = displayMessages[realIdx];
    displayMessages = displayMessages.slice(0, realIdx);
    chatHistory = chatHistory.slice(0, realIdx);
    sendMessage(userMsg.content, userMsg.attachments || [], true);
  }

  function readFileAsDataUrl(file) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  }
  async function addAttachment(file, kind) {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      pendingAttachments = [...pendingAttachments, { kind, name:file.name, size:file.size, mime:file.type, dataUrl:kind==='image'?dataUrl:null, rawDataUrl:dataUrl }];
      showToast(kind==='image' ? `Imagem "${file.name}" anexada` : `Ficheiro "${file.name}" anexado`);
    } catch (e) { showToast('Não foi possível ler o ficheiro'); }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(()=>showToast('Copiado!')).catch(()=>{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);showToast('Copiado!');});
  }
  function shareText(text) {
    if (navigator.share) navigator.share({text}).catch(()=>{});
    else { copyText(text); showToast('Copiado para partilha!'); }
  }

  async function pinConv(conv) {
    const prev = conv.pinned; conv.pinned = !conv.pinned; conversations = [...conversations];
    try { await AuthApiService.pinConversation(effectiveUser?.token||'', conv.id, conv.pinned); }
    catch (e) { conv.pinned = prev; conversations = [...conversations]; showToast('Não foi possível atualizar'); }
    showSheet = false;
  }
  async function deleteConv(conv) {
    const prev = conversations.slice();
    conversations = conversations.filter(c => c.id !== conv.id);
    if (currentConvId === conv.id) newChat();
    showSheet = false;
    try { await AuthApiService.deleteConversation(effectiveUser?.token||'', conv.id); showToast('Conversa eliminada'); }
    catch (e) { conversations = prev; showToast('Não foi possível eliminar'); }
  }
  async function confirmRename() {
    const newTitle = renameValue.trim();
    if (!newTitle) { showToast('O título não pode estar vazio'); return; }
    const conv = sheetConv; const prev = conv.title;
    conv.title = newTitle; if (currentConvId === conv.id) currentConvTitle = newTitle;
    conversations = [...conversations]; showCenterDialog = false;
    try { await AuthApiService.updateConversation(effectiveUser?.token||'', conv.id, newTitle, conv.messages||chatHistory); showToast('Conversa renomeada'); }
    catch (e) { conv.title = prev; if (currentConvId === conv.id) currentConvTitle = prev; conversations=[...conversations]; showToast('Não foi possível renomear'); }
  }
  function confirmEditMsg() {
    const newText = editMsgValue.trim();
    if (!newText) { showToast('A mensagem não pode estar vazia'); return; }
    showCenterDialog = false;
    if (isStreaming) return;
    const atts = displayMessages[sheetUserIdx]?.attachments || [];
    displayMessages = displayMessages.slice(0, sheetUserIdx);
    chatHistory = chatHistory.slice(0, sheetUserIdx);
    setTimeout(() => sendMessage(newText, atts, true), 150);
  }
  function deleteUserMsg(idx) {
    let end = idx + 1;
    if (displayMessages[end]?.role === 'assistant') end++;
    displayMessages = [...displayMessages.slice(0, idx), ...displayMessages.slice(end)];
    chatHistory = [...chatHistory.slice(0, idx), ...chatHistory.slice(end)];
    showSheet = false; showToast('Mensagem eliminada');
  }
  function selectModel(id) { currentModelId = id; localStorage.setItem('nexa_model', id); showSheet = false; showToast(`Modelo: ${currentModelName}`); }

  async function startRecording() {
    if (isRecording) return;
    try {
      waveOverlayStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      waveOverlayCtx = new (window.AudioContext || window.webkitAudioContext)();
      waveOverlayAnalyser = waveOverlayCtx.createAnalyser();
      waveOverlayAnalyser.fftSize = 1024; waveOverlayAnalyser.smoothingTimeConstant = 0.25;
      waveOverlayAnalyser.minDecibels = -110; waveOverlayAnalyser.maxDecibels = -5;
      const gain = waveOverlayCtx.createGain(); gain.gain.value = 6;
      waveOverlaySource = waveOverlayCtx.createMediaStreamSource(waveOverlayStream);
      waveOverlaySource.connect(gain); gain.connect(waveOverlayAnalyser);
      audioChunks = [];
      mediaRecorder = new MediaRecorder(waveOverlayStream);
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.onstop = handleRecStop;
      mediaRecorder.start(); isRecording = true;
      recSeconds = 0; showRecOverlay = true;
      recInterval = setInterval(() => recSeconds++, 1000);
      startWaveAnim();
    } catch (err) { showToast('Sem acesso ao microfone'); }
  }
  function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false; clearInterval(recInterval);
    mediaRecorder.stop(); waveOverlayStream?.getTracks().forEach(t=>t.stop());
    stopWaveAnim(); showRecOverlay = false;
  }
  function cancelRecording() {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false; clearInterval(recInterval);
    mediaRecorder.onstop = null; mediaRecorder.stop();
    waveOverlayStream?.getTracks().forEach(t=>t.stop());
    audioChunks = []; stopWaveAnim(); showRecOverlay = false;
  }
  async function handleRecStop() {
    if (!audioChunks.length) return;
    const blob = new Blob(audioChunks, { type:'audio/webm' }); audioChunks = [];
    showToast('A transcrever…');
    try {
      const token = effectiveUser?.token || '';
      const form = new FormData(); form.append('file', blob, 'audio.webm'); form.append('language', currentLanguage||'pt');
      const res = await fetch(`https://ipc.alfredoooh.workers.dev/ai/transcribe`, { method:'POST', headers:{'Authorization':'Bearer '+token}, body:form });
      if (!res.ok) throw new Error('Erro na transcrição');
      const data = await res.json(); const text = (data.text||'').trim();
      if (text) { inputText = (inputText ? inputText + ' ' : '') + text; setTimeout(autoResize, 10); }
      else showToast('Nenhum texto reconhecido');
    } catch (err) { showToast('Erro ao transcrever áudio'); }
  }

  function startWaveAnim() {
    let freq = null;
    if (waveOverlayAnalyser) freq = new Uint8Array(waveOverlayAnalyser.frequencyBinCount);
    function frame() {
      if (!showRecOverlay) return;
      waveOverlayAnimFrame = requestAnimationFrame(frame);
      const canvas = recCanvasEl; if (!canvas) return;
      const ctx = canvas.getContext('2d'); const w=canvas.clientWidth, h=canvas.clientHeight;
      ctx.clearRect(0,0,w,h);
      let targetAmp=6, targetBoost=0, totalEnergy=0, bass=0;
      if (waveOverlayAnalyser && freq) {
        waveOverlayAnalyser.getByteFrequencyData(freq);
        const len=freq.length, be=Math.floor(len*.12), me=Math.floor(len*.5);
        const br=Math.pow([...freq].slice(0,be).reduce((a,b)=>a+b,0)/be/255,.4);
        const mr=Math.pow([...freq].slice(be,me).reduce((a,b)=>a+b,0)/(me-be)/255,.4);
        const tr=Math.pow([...freq].reduce((a,b)=>a+b,0)/len/255,.4);
        bass=br; totalEnergy=tr; targetAmp=5+br*80+mr*45+tr*30; targetBoost=br*75+mr*35+tr*20;
      } else { targetAmp=6+Math.sin(wavePhaseLocal*1.1)*1.5; targetBoost=1+Math.cos(wavePhaseLocal*.9)*.8; }
      const at=targetAmp>waveSmoothAmpLocal?.7:.06, db=targetBoost>waveSmoothBoostLocal?.7:.06;
      waveSmoothAmpLocal+=(targetAmp-waveSmoothAmpLocal)*at;
      waveSmoothBoostLocal+=(targetBoost-waveSmoothBoostLocal)*db;
      [[.55,.4,.30,.15,0],[.70,.6,.42,.30,1.1],[.85,.8,.54,.55,2.3],[.95,.9,.64,.80,3.7],[1,1,.72,1,5.2]].forEach(([am,bm,base,op,ph])=>{
        drawWaveLayer(ctx,w,h,waveSmoothAmpLocal*am,waveSmoothBoostLocal*bm,base,op,ph);
      });
      const loader=document.getElementById('recLoaderEl');
      if(loader){const ts=1+bass*.45+totalEnergy*.2; const a2=ts>waveSmoothScaleLocal?.7:.06; waveSmoothScaleLocal+=(ts-waveSmoothScaleLocal)*a2; loader.style.transform=`scale(${waveSmoothScaleLocal.toFixed(4)})`;}
      wavePhaseLocal+=.02;
    }
    frame();
  }
  function drawWaveLayer(ctx,w,h,amp,boost,baseYR,opacity,phOff) {
    const baseY=h*baseYR-boost*.5, pts=180, step=w/(pts-1), ys=[];
    for(let i=0;i<pts;i++){const t=i/(pts-1);ys.push(baseY+Math.sin(t*5.8+wavePhaseLocal+phOff)*amp+Math.sin(t*11.5+wavePhaseLocal*1.4+phOff)*(amp*.35)+Math.sin(t*3.2-wavePhaseLocal*.7+phOff)*(amp*.18)+Math.sin(t*22+wavePhaseLocal*2.5+phOff)*(boost*.18));}
    const topY=Math.min(...ys), grad=ctx.createLinearGradient(0,topY,0,h);
    grad.addColorStop(0,'rgba(66,165,245,0)'); grad.addColorStop(.45,`rgba(55,150,235,${.08*opacity})`); grad.addColorStop(.7,`rgba(40,130,220,${.22*opacity})`); grad.addColorStop(.88,`rgba(30,115,210,${.4*opacity})`); grad.addColorStop(1,`rgba(25,100,200,${.56*opacity})`);
    ctx.beginPath(); ctx.moveTo(0,h); ctx.lineTo(0,ys[0]);
    for(let i=1;i<pts;i++){const px=(i-1)*step,x=i*step,cx=(px+x)/2,cy=(ys[i-1]+ys[i])/2;ctx.quadraticCurveTo(px,ys[i-1],cx,cy);}
    ctx.lineTo(w,ys[pts-1]); ctx.lineTo(w,h); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  }
  function stopWaveAnim() {
    if(waveOverlayAnimFrame){cancelAnimationFrame(waveOverlayAnimFrame);waveOverlayAnimFrame=null;}
    if(waveOverlaySource){try{waveOverlaySource.disconnect();}catch(e){}waveOverlaySource=null;}
    if(waveOverlayCtx){try{waveOverlayCtx.close();}catch(e){}waveOverlayCtx=null;}
    waveOverlayAnalyser=null;
  }
</script>

<div class="chat-root" class:dark={isDark} style="background:{c.background};color:{c.textPrimary}">

  <div class="appbar-gradient" class:dark={isDark}></div>

  <div class="appbar">
    <button class="pulse-tap circ w10" style="color:{c.iconTint}" on:click={handleDrawerOpen}>
      <span class="icon-mask" style="mask-image:url('/icons/svg/menu.svg');-webkit-mask-image:url('/icons/svg/menu.svg');width:18px;height:18px;background:{c.iconTint}"></span>
    </button>
    <button class="model-btn pulse-tap" on:click={() => { sheetMode='modelPicker'; showSheet=true; }}>
      <span class="model-name" style="color:{c.textSecondary}">{currentModelName}</span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.textSecondary} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="flex1"></div>
    {#if isIncognito}
      <div class="incognito-pill" style="background:{isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'};color:{c.textPrimary};margin-right:4px">
        <span class="icon-mask" style="mask-image:url('/icons/svg/incognito.svg');-webkit-mask-image:url('/icons/svg/incognito.svg');width:14px;height:14px;background:{c.textPrimary}"></span>
        <span>Privada</span>
      </div>
    {/if}
    {#if !hasMessages && !isIncognito}
      <button class="pulse-tap circ w10 px2" style="color:{c.iconTint}" on:click={startIncognito}>
        <span class="icon-mask" style="mask-image:url('/icons/svg/incognito.svg');-webkit-mask-image:url('/icons/svg/incognito.svg');width:18px;height:18px;background:{c.iconTint}"></span>
      </button>
    {/if}
    {#if hasMessages}
      <button class="pulse-tap circ w10 px2" style="color:{c.iconTint}" on:click={newChat}>
        <span class="icon-mask" style="mask-image:url('/icons/svg/new_chat.svg');-webkit-mask-image:url('/icons/svg/new_chat.svg');width:17px;height:17px;background:{c.iconTint}"></span>
      </button>
      <button class="pulse-tap circ w10 px2" style="color:{c.iconTint}" on:click={() => {
        if (!currentConvId) { showToast('Esta conversa ainda não foi guardada'); return; }
        const conv = conversations.find(cv=>cv.id===currentConvId) || { id:currentConvId, title:currentConvTitle, messages:chatHistory, updatedAt:Date.now(), pinned:false };
        sheetConv = conv; sheetMode='convOptions'; showSheet=true;
      }}>
        <span class="icon-mask" style="mask-image:url('/icons/svg/more_vertical.svg');-webkit-mask-image:url('/icons/svg/more_vertical.svg');width:16px;height:16px;background:{c.iconTint}"></span>
      </button>
    {/if}
  </div>

  <Drawer
    {isDark} user={effectiveUser} open={drawerOpen}
    title="AI" subtitle="Conversas e ferramentas"
    menuItems={drawerMenuItems}
    {conversations} currentConvId={currentConvId}
    on:close={() => drawerOpen=false}
    on:openConv={handleOpenConv}
    on:convOptions={handleConvOptions}
    on:openSettings={() => { drawerOpen=false; showSettings=true; }}
  />

  <div class="messages-wrap" bind:this={messagesEl}>
    {#if !hasMessages}
      <div class="empty-state">
        <img src="/icons/png/logo.png" class="empty-logo" alt="Nexa" />
        <h1 class="greeting" style="color:{c.textPrimary};font-family:'TimesNewRoman',serif">{greeting}</h1>
        <p class="greeting-sub" style="color:{c.textSecondary}">Em que estás a pensar?</p>
      </div>
    {:else}
      <div class="messages-list">
        {#each displayMessages as msg, idx}
          {#if msg.role === 'user'}
            <div class="user-row">
              <div
                class="user-bubble pulse-tap"
                style="background:{c.userBubbleBg};color:{c.textPrimary}"
                on:pointerdown={() => {
                  let did=false;
                  const t=setTimeout(()=>{did=true; sheetUserMsg=msg; sheetUserIdx=idx; sheetMode='userMsgOptions'; showSheet=true;},480);
                  const up=()=>clearTimeout(t);
                  document.addEventListener('pointerup',up,{once:true});
                  document.addEventListener('pointercancel',up,{once:true});
                }}
              >
                {#if msg.attachments?.length}
                  <div class="att-wrap">
                    {#each msg.attachments as att}
                      {#if att.kind === 'image' && att.dataUrl}
                        <img src={att.dataUrl} class="att-img" alt="" />
                      {:else}
                        <div class="att-chip" style="background:{isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.05)'}">
                          <span class="icon-mask" style="mask-image:url('/icons/svg/upload.svg');-webkit-mask-image:url('/icons/svg/upload.svg');width:14px;height:14px;background:{c.textPrimary}"></span>
                          <span style="font-size:12px;color:{c.textPrimary};max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{att.name||'Ficheiro'}</span>
                        </div>
                      {/if}
                    {/each}
                  </div>
                {/if}
                {#if msg.content}
                  <p class="user-text">{msg.content}</p>
                {/if}
              </div>
            </div>
          {:else}
            <div class="assistant-row" style="color:{c.textPrimary}">
              {#if msg.isStreaming && msg.isThinking && !msg.content && !msg.thinkingContent}
                <div class="thinking-placeholder">
                  <div class="think-dot-wrap">
                    <div class="think-dot" style="background:{c.textSecondary};animation-delay:0s"></div>
                    <div class="think-dot" style="background:{c.textSecondary};animation-delay:.2s"></div>
                    <div class="think-dot" style="background:{c.textSecondary};animation-delay:.4s"></div>
                  </div>
                  <span style="font-size:14px;color:{c.textSecondary}">A processar…</span>
                </div>
              {:else}
                {#if msg.thinkingContent}
                  <div class="thinking-badge" style="border-bottom:1px dashed {c.divider};color:{c.textSecondary}">💭 {msg.thinkingContent}</div>
                {/if}
                <div
                  class="assistant-content"
                  class:cursor-blink={msg.isStreaming && msg.content}
                  style="font-size:15px;line-height:1.65;color:{isDark ? c.textPrimary : '#212730'}"
                >
                  {@html renderMarkdown(msg.content)}
                </div>
                {#if !msg.isStreaming && msg.content}
                  <div class="action-row">
                    {#each [['copy','Copiar',()=>copyText(msg.content)],['thumbs_up','Gosto',()=>{}],['thumbs_down','Não gosto',()=>{}],['share','Partilhar',()=>shareText(msg.content)],['regenerate','Regenerar',regenerate]] as [icon,title,fn]}
                      <button class="action-btn pulse-tap" title={title} style="color:{c.iconTintSecondary}" on:click={fn}>
                        <span class="icon-mask" style="mask-image:url('/icons/svg/{icon}.svg');-webkit-mask-image:url('/icons/svg/{icon}.svg');width:17px;height:17px;background:{c.iconTintSecondary}"></span>
                      </button>
                    {/each}
                  </div>
                {/if}
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <div class="bottom-bar" class:light={!isDark} class:dark={isDark} id="bottomBar">
    {#if pendingAttachments.length}
      <div class="att-preview">
        {#each pendingAttachments as att, i}
          <div class="att-preview-item">
            {#if att.kind === 'image' && att.dataUrl}
              <img src={att.dataUrl} class="att-preview-img" alt="" />
            {:else}
              <div class="att-preview-file" style="background:{isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}">
                <span class="icon-mask" style="mask-image:url('/icons/svg/upload.svg');-webkit-mask-image:url('/icons/svg/upload.svg');width:20px;height:20px;background:{c.textPrimary}"></span>
              </div>
            {/if}
            <button class="att-remove pulse-tap" on:click={() => { pendingAttachments.splice(i,1); pendingAttachments=[...pendingAttachments]; }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}
    <textarea
      class="chat-input" class:dark={isDark}
      placeholder="Escreve aqui..."
      rows="1"
      bind:value={inputText}
      bind:this={textInputEl}
      on:input={autoResize}
      on:keydown={handleKeyDown}
      on:focus={handleInputFocus}
    ></textarea>
    <div class="bb-row">
      <button class="add-btn pulse-tap" style="background:{c.addCircleBg};color:{c.iconTint}" on:click={() => { sheetMode='add'; showSheet=true; }}>
        <span class="icon-mask" style="mask-image:url('/icons/svg/add.svg');-webkit-mask-image:url('/icons/svg/add.svg');width:18px;height:18px;background:{c.iconTint}"></span>
      </button>
      <div class="flex1"></div>
      <button class="edit-btn pulse-tap" style="background:{c.tabPreviewPillBg};color:{c.textPrimary}" on:click={openAppsPopup}>
        <span class="icon-mask" style="mask-image:url('/icons/svg/preview_filled.svg');-webkit-mask-image:url('/icons/svg/preview_filled.svg');width:20px;height:20px;background:{c.textPrimary}"></span>
        <span class="edit-label">Apps</span>
      </button>
      <div style="width:8px"></div>
      {#if inputText.trim() || pendingAttachments.length}
        <button class="send-btn pulse-tap" style="background:{c.sendBtnColor}" on:click={() => { if(!isStreaming) sendMessage(inputText); }}>
          <span class="icon-mask" style="mask-image:url('/icons/svg/ic_send_arrow.svg');-webkit-mask-image:url('/icons/svg/ic_send_arrow.svg');width:15px;height:15px;background:{c.sendIconColor}"></span>
        </button>
      {:else}
        <button class="send-btn pulse-tap" style="background:{c.sendBtnColor}" on:click={startRecording}>
          <span class="icon-mask" style="mask-image:url('/icons/svg/record.svg');-webkit-mask-image:url('/icons/svg/record.svg');width:18px;height:18px;background:{c.sendIconColor}"></span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Apps popup — mesmo estilo do popup de tema do SettingsPage -->
  {#if showAppsPopup}
    <div class="apps-popup-overlay" on:click={() => showAppsPopup=false}></div>
    <div
      class="apps-popup-box"
      class:dark={isDark}
      style="bottom:{appsPopupPos.bottom}px;right:{appsPopupPos.right}px;"
    >
      {#each DRAWER_APPS as app, i}
        {#if i > 0}<div class="apps-popup-sep" class:dark={isDark}></div>{/if}
        <button type="button" class="apps-popup-row pulse-tap" class:dark={isDark} on:click={() => openApp(app.id)}>
          <img src={app.icon} alt={app.label} class="apps-popup-icon" />
          <span class="apps-popup-label" class:dark={isDark}>{app.label}</span>
          {#if app.id === activeApp}
            <span class="icon-mask" style="mask-image:url('/icons/svg/check.svg');-webkit-mask-image:url('/icons/svg/check.svg');width:16px;height:16px;background:#007AFF;display:block;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;mask-position:center;-webkit-mask-position:center;flex-shrink:0;"></span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  <ModalSheet {isDark} open={showSheet} on:close={() => showSheet=false}>
    {#if sheetMode === 'add'}
      {#each [['image','Enviar Imagem','image'],['upload','Enviar Ficheiro','file']] as [icon,label,kind], i}
        {#if i > 0}<div class="sheet-sep" style="background:{c.divider}"></div>{/if}
        <label class="sheet-row pulse-tap" style="cursor:pointer">
          <span class="icon-mask" style="mask-image:url('/icons/svg/{icon}.svg');-webkit-mask-image:url('/icons/svg/{icon}.svg');width:22px;height:22px;background:{c.iconTint}"></span>
          <span style="margin-left:14px;font-size:15px;font-weight:500;color:{c.textPrimary}">{label}</span>
          <input type="file" accept={kind==='image'?'image/*':'*/*'} style="display:none" on:change={async e=>{const f=e.target.files?.[0];if(f){showSheet=false;await addAttachment(f,kind);}}} />
        </label>
      {/each}
      <div class="sheet-sep" style="background:{c.divider}"></div>
      <div class="sheet-row pulse-tap" on:click={() => { showSheet=false; setTimeout(()=>{ sheetMode='extras'; showSheet=true; },180); }}>
        <span class="icon-mask" style="mask-image:url('/icons/svg/extras.svg');-webkit-mask-image:url('/icons/svg/extras.svg');width:22px;height:22px;background:{c.iconTint}"></span>
        <span style="margin-left:14px;font-size:15px;font-weight:500;color:{c.textPrimary}">Extras</span>
      </div>
      <div style="height:16px"></div>

    {:else if sheetMode === 'extras'}
      <div class="sheet-title" style="color:{c.textPrimary}">Extras</div>
      {#each [[flashMode,'Flash','flash','flash_filled',()=>{flashMode=!flashMode;if(flashMode)thinkMoreMode=false;showSheet=false;}],[thinkMoreMode,'Think More','brain','brain_filled',()=>{thinkMoreMode=!thinkMoreMode;if(thinkMoreMode)flashMode=false;showSheet=false;}],[sheetsEnabled,'Sheets','sheets','sheets_filled',()=>{sheetsEnabled=!sheetsEnabled;showSheet=false;}]] as [active,title,iconOff,iconOn,action],i}
        {#if i > 0}<div class="sheet-sep" style="margin-left:60px;background:{c.divider}"></div>{/if}
        <div class="sheet-row pulse-tap" style="background:{active?(isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.05)'):'transparent'}" on:click={action}>
          <span class="icon-mask" style="mask-image:url('/icons/svg/{active?iconOn:iconOff}.svg');-webkit-mask-image:url('/icons/svg/{active?iconOn:iconOff}.svg');width:17px;height:17px;background:{c.textPrimary}"></span>
          <span style="margin-left:14px;font-size:14px;font-weight:500;flex:1;color:{c.textPrimary}">{title}</span>
          {#if active}<div style="width:8px;height:8px;border-radius:50%;background:{c.textPrimary}"></div>{/if}
        </div>
      {/each}
      <div style="height:16px"></div>

    {:else if sheetMode === 'modelPicker'}
      <div class="sheet-title" style="color:{c.textPrimary}">Modelo de IA</div>
      {#each AVAILABLE_MODELS as model, i}
        {#if i > 0}<div class="sheet-sep" style="background:{isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)'}"></div>{/if}
        <div class="sheet-row pulse-tap" on:click={() => selectModel(model.id)}>
          <div style="flex:1;min-width:0">
            <div style="font-size:15px;font-weight:600;color:{model.id===currentModelId?c.primary:c.textPrimary}">{model.name}</div>
            <div style="font-size:12.5px;color:{c.textSecondary};margin-top:1px">{model.description}</div>
          </div>
          {#if model.id === currentModelId}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.primary} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {/if}
        </div>
      {/each}
      <div style="height:12px"></div>

    {:else if sheetMode === 'convOptions' && sheetConv}
      <div class="conv-opts-header">
        <div class="conv-opts-avatar" style="background:{isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}">
          <span class="icon-mask" style="mask-image:url('/icons/svg/new_chat.svg');-webkit-mask-image:url('/icons/svg/new_chat.svg');width:16px;height:16px;background:{c.textPrimary}"></span>
        </div>
        <div style="flex:1;min-width:0">
          <div class="conv-opts-title" style="color:{c.textPrimary}">{sheetConv.title}</div>
          <div style="font-size:12px;color:{c.textSecondary};margin-top:2px">{new Date(sheetConv.updatedAt).toLocaleDateString('pt-PT',{day:'2-digit',month:'long',year:'numeric'})}</div>
        </div>
      </div>
      <div class="conv-opts-card" style="background:{isDark?'#1C1C1E':'#F2F2F7'}">
        {#each [
          ['external','Abrir conversa',false,()=>{showSheet=false;setTimeout(()=>{currentConvId=sheetConv.id;currentConvTitle=sheetConv.title;titleGenerated=true;chatHistory=[...sheetConv.messages];displayMessages=sheetConv.messages.map(m=>({role:m.role,content:m.content}));},200);}],
          [sheetConv.pinned?'pin_filled':'pin',sheetConv.pinned?'Desafixar':'Fixar',false,()=>pinConv(sheetConv)],
          ['customise','Renomear',false,()=>{renameValue=sheetConv.title;showSheet=false;showCenterDialog=true;centerDialogMode='rename';}],
          ['share','Partilhar',false,()=>{showSheet=false;shareText(sheetConv.title);}],
          ['trash','Eliminar',true,()=>deleteConv(sheetConv)]
        ] as [icon,label,danger,action], i}
          {#if i > 0}<div style="height:1px;margin-left:60px;background:{c.divider}"></div>{/if}
          <div class="conv-opts-row pulse-tap" on:click={action}>
            <div class="conv-opts-icon" style="background:{isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}">
              <span class="icon-mask" style="mask-image:url('/icons/svg/{icon}.svg');-webkit-mask-image:url('/icons/svg/{icon}.svg');width:16px;height:16px;background:{danger?'#EF4444':c.textPrimary}"></span>
            </div>
            <span class="conv-opts-label" style="color:{danger?'#EF4444':c.textPrimary}">{label}</span>
          </div>
        {/each}
      </div>
      <div style="height:20px"></div>

    {:else if sheetMode === 'userMsgOptions' && sheetUserMsg}
      <div class="conv-opts-card" style="background:{isDark?'#1C1C1E':'#F2F2F7'};margin:4px 16px 20px">
        {#each [
          ['copy','Copiar',false,()=>{showSheet=false;copyText(sheetUserMsg.content);}],
          ['customise','Editar',false,()=>{editMsgValue=sheetUserMsg.content;showSheet=false;showCenterDialog=true;centerDialogMode='editMsg';}],
          ['trash','Eliminar mensagem',true,()=>deleteUserMsg(sheetUserIdx)]
        ] as [icon,label,danger,action], i}
          {#if i > 0}<div style="height:1px;margin-left:60px;background:{c.divider}"></div>{/if}
          <div class="conv-opts-row pulse-tap" on:click={action}>
            <div class="conv-opts-icon" style="background:{isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)'}">
              <span class="icon-mask" style="mask-image:url('/icons/svg/{icon}.svg');-webkit-mask-image:url('/icons/svg/{icon}.svg');width:16px;height:16px;background:{danger?'#EF4444':c.textPrimary}"></span>
            </div>
            <span class="conv-opts-label" style="color:{danger?'#EF4444':c.textPrimary}">{label}</span>
          </div>
        {/each}
      </div>
    {/if}
  </ModalSheet>

  {#if showCenterDialog}
    <div class="cd-overlay" on:click={() => showCenterDialog=false}></div>
    <div class="cd-box" style="background:{isDark?'#1C1C1E':'#FFFFFF'}">
      <div class="cd-title" style="color:{c.textPrimary}">{centerDialogMode==='rename'?'Renomear conversa':'Editar mensagem'}</div>
      {#if centerDialogMode === 'rename'}
        <input class="cd-input" style="color:{c.textPrimary};background:{isDark?'#2C2C2E':'#F2F2F7'};border-color:{c.divider}" maxlength="80" bind:value={renameValue}
          on:keydown={e=>{if(e.key==='Enter')confirmRename();if(e.key==='Escape')showCenterDialog=false;}} />
      {:else}
        <textarea class="cd-input cd-textarea" style="color:{c.textPrimary};background:{isDark?'#2C2C2E':'#F2F2F7'};border-color:{c.divider}" rows="4" bind:value={editMsgValue}></textarea>
      {/if}
      <div class="cd-actions">
        <button class="cd-btn cd-cancel" style="color:{c.textPrimary}" on:click={() => showCenterDialog=false}>Cancelar</button>
        <button class="cd-btn cd-confirm" style="background:{c.primary};color:#fff" on:click={centerDialogMode==='rename'?confirmRename:confirmEditMsg}>
          {centerDialogMode==='rename'?'Guardar':'Guardar e reenviar'}
        </button>
      </div>
    </div>
  {/if}

  {#if showRecOverlay}
    <div class="rec-overlay" class:dark={isDark}>
      <div class="rec-loader-wrap">
        <div class="rec-loader" id="recLoaderEl">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <defs>
              <mask id="recClipping">
                <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
              </mask>
            </defs>
          </svg>
          <div class="rec-loader-box"></div>
        </div>
      </div>
      <div class="rec-wave-wrap">
        <canvas bind:this={recCanvasEl} class="rec-wave-canvas"></canvas>
      </div>
      <div class="rec-top-bar">
        <button class="rec-top-btn pulse-tap" on:click={cancelRecording}>
          <span class="icon-mask" style="mask-image:url('/icons/svg/close.svg');-webkit-mask-image:url('/icons/svg/close.svg');width:20px;height:20px;background:{isDark ? '#F3F4F6' : '#111827'}"></span>
        </button>
        <span class="rec-timer">{recTimerStr}</span>
        <button class="rec-top-btn pulse-tap" on:click={stopRecording}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#F3F4F6' : '#111827'} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>
    </div>
  {/if}

  {#if showSettings}
    <SettingsPage {isDark} user={effectiveUser}
      on:close={() => showSettings=false}
      on:themeChange={(e) => dispatch('nav', { to:'chat', data:{ isDark: e.detail.isDark } })}
      on:logout={() => dispatch('nav', { to:'login', data:{ logout:true } })}
    />
  {/if}

</div>

<style>
  .chat-root { position:fixed; inset:0; display:flex; flex-direction:column; overflow:hidden; background:var(--bg-light); }
  .chat-root.dark { background:var(--bg-dark); }

  .appbar-gradient { position:absolute; top:0; left:0; right:0; height:90px; pointer-events:none; z-index:39; }
  .appbar-gradient:not(.dark) { background:linear-gradient(to bottom,rgba(249,250,251,1) 0%,rgba(249,250,251,.95) 45%,rgba(249,250,251,0) 100%); }
  .appbar-gradient.dark { background:linear-gradient(to bottom,rgba(15,15,15,1) 0%,rgba(15,15,15,.95) 45%,rgba(15,15,15,0) 100%); }

  .appbar { position:absolute; top:0; left:0; right:0; z-index:40; height:60px; display:flex; align-items:center; padding:0 8px; background:transparent; }
  .model-btn { display:flex; align-items:center; gap:4px; background:none; border:none; cursor:pointer; padding:6px 10px; border-radius:14px; margin-left:6px; }
  .model-name { font-size:14px; font-weight:600; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; letter-spacing:.01em; }
  .incognito-pill { display:flex; align-items:center; gap:6px; padding:5px 12px 5px 10px; border-radius:16px; font-size:12px; font-weight:600; }
  .flex1 { flex:1; }
  .w10 { width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:none; border:none; }
  .px2 { padding:0 8px; }
  .circ { border-radius:50%; overflow:hidden; }

  .messages-wrap { flex:1; overflow-y:auto; overflow-x:hidden; padding-top:68px; padding-bottom:170px; -webkit-overflow-scrolling:touch; scroll-behavior:smooth; overscroll-behavior:contain; }
  .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding-top:80px; min-height:100%; }
  .empty-logo { width:72px; height:72px; margin-bottom:16px; }
  .greeting { font-size:48px; font-weight:700; text-align:center; margin:0 0 8px; }
  .greeting-sub { font-size:16px; text-align:center; margin:0; }
  .messages-list { padding:0; }

  .user-row { padding:8px 16px; display:flex; justify-content:flex-end; }
  .user-bubble { max-width:82%; border-radius:20px; padding:12px 16px; cursor:pointer; }
  .att-wrap { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
  .att-img { width:84px; height:84px; object-fit:cover; border-radius:12px; }
  .att-chip { display:flex; align-items:center; gap:6px; padding:7px 10px; border-radius:10px; }
  .user-text { margin:0; font-size:14px; line-height:1.5; white-space:pre-wrap; -webkit-user-select:text; user-select:text; }

  .assistant-row { padding:12px 16px 4px; }
  .thinking-placeholder { display:flex; align-items:center; gap:10px; padding:4px 0 8px; }
  .think-dot-wrap { display:flex; gap:4px; }
  .think-dot { width:8px; height:8px; border-radius:50%; animation:dotPulse 1.2s ease-in-out infinite; }
  @keyframes dotPulse { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
  .thinking-badge { font-size:12px; font-style:italic; opacity:.6; margin-bottom:8px; padding-bottom:8px; -webkit-user-select:text; user-select:text; }
  .assistant-content { word-break:break-word; overflow-wrap:break-word; -webkit-user-select:text; user-select:text; }
  .assistant-content :global(.md-para) { margin:0 0 12px; line-height:1.7; font-size:15px; }
  .assistant-content :global(.md-para:last-child) { margin-bottom:0; }
  .assistant-content :global(.md-h1) { font-size:20px; font-weight:700; margin:16px 0 8px; line-height:1.3; }
  .assistant-content :global(.md-h2) { font-size:17px; font-weight:700; margin:14px 0 6px; line-height:1.3; }
  .assistant-content :global(.md-h3) { font-size:15px; font-weight:600; margin:12px 0 5px; line-height:1.3; }
  .assistant-content :global(.md-h1:first-child),.assistant-content :global(.md-h2:first-child),.assistant-content :global(.md-h3:first-child) { margin-top:0; }
  .assistant-content :global(.md-list) { margin:4px 0 12px; padding-left:22px; list-style:disc; }
  .assistant-content :global(.md-list li) { margin-bottom:6px; line-height:1.65; font-size:15px; }
  .assistant-content :global(.inline-code) { font-family:'Courier New',Courier,monospace; font-size:13px; padding:2px 6px; border-radius:5px; background:rgba(127,127,127,.15); }
  .assistant-content :global(.code-block-wrapper) { margin:8px 0 12px; border-radius:10px; overflow:hidden; border:1px solid rgba(127,127,127,.2); }
  .assistant-content :global(.code-block-header) { display:flex; align-items:center; justify-content:space-between; padding:6px 12px; background:rgba(127,127,127,.08); border-bottom:1px solid rgba(127,127,127,.12); }
  .assistant-content :global(.code-lang-label) { font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; opacity:.6; }
  .assistant-content :global(.code-copy-btn) { background:none; border:none; cursor:pointer; padding:4px; display:flex; align-items:center; justify-content:center; border-radius:6px; transition:background .15s; }
  .assistant-content :global(.code-copy-btn:hover) { background:rgba(127,127,127,.12); }
  .assistant-content :global(.code-block) { margin:0; padding:12px 14px; overflow-x:auto; font-family:'Courier New',Courier,monospace; font-size:13px; line-height:1.6; background:rgba(127,127,127,.06); white-space:pre; }
  .assistant-content :global(a.md-link) { color:#2F7BF6; text-decoration:underline; text-decoration-color:rgba(79,70,229,.4); }
  .assistant-content :global(.md-blockquote) { border-left:3px solid #2F7BF6; margin:8px 0 12px; padding:6px 14px; opacity:.85; font-style:italic; }
  .assistant-content :global(.md-table-wrapper) { overflow-x:auto; margin:8px 0 12px; }
  .assistant-content :global(.md-table) { border-collapse:collapse; min-width:100%; font-size:14px; }
  .assistant-content :global(.md-table th) { padding:8px 12px; font-weight:600; border-bottom:2px solid rgba(127,127,127,.2); text-align:left; }
  .assistant-content :global(.md-table td) { padding:7px 12px; border-bottom:1px solid rgba(127,127,127,.1); }
  .assistant-content :global(.math-frac) { display:inline-flex; flex-direction:column; align-items:center; vertical-align:middle; margin:0 2px; }
  .assistant-content :global(.math-frac-num) { border-bottom:1px solid currentColor; padding:0 2px; }
  .assistant-content :global(.math-frac-den) { padding:0 2px; }
  .assistant-content :global(.math-root) { display:inline-flex; align-items:center; }
  .assistant-content :global(.math-radical) { font-size:1.2em; }
  .assistant-content :global(.math-radicand) { border-top:1px solid currentColor; padding:0 2px; }
  .assistant-content :global(.math-display) { display:block; text-align:center; margin:12px 0; font-size:1.1em; overflow-x:auto; }
  .assistant-content :global(.math-inline) { display:inline; }
  .assistant-content :global(.widget-host) { display:block; min-height:4px; }

  .cursor-blink::after { content:'|'; animation:blink 1s step-end infinite; color:#2F7BF6; font-weight:300; }
  @keyframes blink { 50%{opacity:0} }

  .action-row { display:flex; align-items:center; gap:2px; margin-top:8px; padding-top:2px; }
  .action-btn { width:34px; height:34px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:transparent; border:none; cursor:pointer; padding:0; opacity:.65; flex-shrink:0; }
  .action-btn:hover { opacity:1; }

  .bottom-bar {
    position:absolute; bottom:0; left:16px; right:16px; z-index:50;
    margin-bottom:20px; border-radius:22px; display:flex; flex-direction:column;
    transition:background-color .3s ease, box-shadow .3s ease;
    user-select:none; overscroll-behavior:none;
  }
  .bottom-bar.light { background:#FFFFFF; box-shadow:0 4px 24px rgba(0,0,0,.08); }
  .bottom-bar.dark  { background:#1F1F1F; box-shadow:0 4px 24px rgba(0,0,0,.30); }
  .chat-input { resize:none; outline:none; border:none; background:transparent; font-size:15px; line-height:1.5; padding:12px 18px 0; width:100%; font-family:inherit; -webkit-user-select:text; user-select:text; max-height:150px; overflow-y:auto; }
  .chat-input:not(.dark) { color:#1F2937; }
  .chat-input.dark { color:#F3F4F6; }
  .chat-input:not(.dark)::placeholder { color:#9A9A9A; }
  .chat-input.dark::placeholder { color:#B6B6B6; }
  .att-preview { display:flex; gap:8px; padding:10px 14px 0; flex-wrap:wrap; }
  .att-preview-item { position:relative; flex-shrink:0; }
  .att-preview-img { width:56px; height:56px; object-fit:cover; border-radius:10px; }
  .att-preview-file { width:56px; height:56px; border-radius:10px; display:flex; align-items:center; justify-content:center; }
  .att-remove { position:absolute; top:-6px; right:-6px; width:20px; height:20px; border-radius:50%; background:#000; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; padding:0; }
  .bb-row { display:flex; align-items:center; height:52px; padding:0 10px; }
  .add-btn { width:40px; height:40px; margin-left:4px; display:flex; align-items:center; justify-content:center; border-radius:50%; border:none; cursor:pointer; }
  .edit-btn { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:20px; border:none; cursor:pointer; }
  .edit-label { font-size:14px; font-weight:700; }
  .send-btn { width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:50%; border:none; cursor:pointer; }

  /* Apps popup — mesmo estilo do popup de tema do SettingsPage */
  .apps-popup-overlay { position:fixed; inset:0; z-index:160; }
  .apps-popup-box {
    position:fixed; z-index:161;
    width:220px;
    border-radius:14px; overflow:hidden;
    background:#fff;
    box-shadow:0 8px 30px rgba(0,0,0,.16), 0 2px 8px rgba(0,0,0,.08);
    transform-origin:bottom right;
  }
  .apps-popup-box.dark { background:#2c2c2e; }
  .apps-popup-sep { height:.5px; background:rgba(0,0,0,.08); margin:0 14px; }
  .apps-popup-sep.dark { background:rgba(255,255,255,.08); }
  .apps-popup-row {
    width:100%; display:flex; align-items:center; gap:12px;
    padding:13px 16px; background:none; border:none;
    cursor:pointer; font-family:inherit;
    transition:background .1s;
  }
  .apps-popup-row:active { background:rgba(0,0,0,.04); }
  .apps-popup-row.dark:active { background:rgba(255,255,255,.05); }
  .apps-popup-icon { width:22px; height:22px; border-radius:6px; object-fit:cover; flex-shrink:0; }
  .apps-popup-label { flex:1; font-size:15px; font-weight:400; color:#000; text-align:left; }
  .apps-popup-label.dark { color:#fff; }

  .sheet-title { padding:4px 20px 12px; font-size:17px; font-weight:700; }
  .sheet-row { display:flex; align-items:center; padding:14px 20px; }
  .sheet-sep { height:1px; margin-left:56px; }

  .conv-opts-header { display:flex; align-items:center; gap:12px; padding:6px 20px 16px; }
  .conv-opts-avatar { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .conv-opts-title { font-size:15px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .conv-opts-card { margin:0 16px; border-radius:16px; overflow:hidden; }
  .conv-opts-row { display:flex; align-items:center; gap:13px; padding:13px 16px; cursor:pointer; }
  .conv-opts-icon { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .conv-opts-label { font-size:14.5px; font-weight:500; }

  .cd-overlay { position:fixed; inset:0; z-index:209; background:rgba(0,0,0,.08); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
  .cd-box { position:fixed; top:50%; left:50%; width:min(92vw,380px); transform:translate(-50%,-50%); z-index:210; border-radius:18px; padding:20px 20px 16px; box-shadow:0 12px 40px rgba(0,0,0,.28); }
  .cd-title { font-size:16px; font-weight:700; margin-bottom:14px; text-align:center; }
  .cd-input { width:100%; border:1px solid; border-radius:10px; padding:11px 13px; font-size:14.5px; outline:none; font-family:inherit; -webkit-user-select:text; user-select:text; }
  .cd-textarea { resize:vertical; }
  .cd-actions { display:flex; gap:10px; margin-top:18px; }
  .cd-btn { flex:1; border:none; border-radius:10px; padding:11px 0; font-size:14.5px; font-weight:600; cursor:pointer; font-family:inherit; }
  .cd-cancel { background:rgba(127,127,127,.14); }

  .rec-overlay { position:fixed; inset:0; z-index:300; background:var(--app-bg); display:flex; flex-direction:column; overflow:hidden; }
  .rec-overlay.dark { background:#0F0F0F; }
  .rec-top-bar { position:absolute; top:0; left:0; right:0; height:72px; display:flex; align-items:center; justify-content:space-between; padding:0 24px; z-index:10; }
  .rec-top-btn { width:46px; height:46px; border-radius:50%; border:none; background:rgba(0,0,0,.18); display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .rec-overlay.dark .rec-top-btn { background:rgba(255,255,255,.12); }
  .rec-timer { font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; color:#1F2937; letter-spacing:.04em; }
  .rec-overlay.dark .rec-timer { color:#F3F4F6; }
  .rec-loader-wrap { position:absolute; left:0; right:0; bottom:28vh; display:flex; justify-content:center; pointer-events:none; z-index:1; }
  .rec-loader { --color-one:#42a5f5;--color-two:#1565c0;--color-three:#42a5f580;--color-four:#1565c080;--color-five:#42a5f540;--time-animation:2s; position:relative; border-radius:50%; box-shadow:0 0 25px 0 var(--color-three),0 20px 50px 0 var(--color-four); animation:recColorize calc(var(--time-animation)*3) ease-in-out infinite; transition:transform .05s ease-out; }
  .rec-loader::before { content:""; position:absolute; top:0; left:0; width:100px; height:100px; border-radius:50%; border-top:solid 1px var(--color-one); border-bottom:solid 1px var(--color-two); background:linear-gradient(180deg,var(--color-five),var(--color-four)); box-shadow:inset 0 10px 10px 0 var(--color-three),inset 0 -10px 10px 0 var(--color-four); }
  .rec-loader-box { width:100px; height:100px; background:linear-gradient(180deg,var(--color-one) 30%,var(--color-two) 70%); mask:url(#recClipping); -webkit-mask:url(#recClipping); }
  @keyframes recColorize { 0%{filter:hue-rotate(0deg)} 20%{filter:hue-rotate(-10deg)} 40%{filter:hue-rotate(-20deg)} 60%{filter:hue-rotate(-30deg)} 80%{filter:hue-rotate(-15deg)} 100%{filter:hue-rotate(0deg)} }
  .rec-wave-wrap { position:absolute; left:0; right:0; bottom:0; height:48vh; min-height:240px; pointer-events:none; z-index:0; }
  .rec-wave-canvas { display:block; width:100%; height:100%; }

  @media (min-width:768px) {
    .bottom-bar { left:50%; right:auto; width:600px; transform:translateX(-50%); }
  }

  .pulse-tap { cursor:pointer; transition:transform .11s cubic-bezier(0.4,0,.2,1),opacity .11s cubic-bezier(0.4,0,.2,1); }
  .pulse-tap:active { transform:scale(0.97); opacity:.86; }
  .icon-mask { display:block; background-color:currentColor; mask-size:contain; -webkit-mask-size:contain; mask-repeat:no-repeat; -webkit-mask-repeat:no-repeat; mask-position:center; -webkit-mask-position:center; flex-shrink:0; }
</style>