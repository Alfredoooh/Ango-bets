import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// SVG Icons from assets/icons/svg/
const SvgIcon = ({ name, className = "", style = {} }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <img src={`/assets/icons/svg/${name}.svg`} className={className} style={{ display: "inline-block", ...style }} alt="" />
);

export default function DoctionLanding() {
  const [, setLocation] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"signup" | "signin">("signup");
  const revealRefs = useRef<HTMLElement[]>([]);
  const countRefs = useRef<HTMLElement[]>([]);

  const goToApp = () => setLocation("/home");

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add("lp-in"); obs.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => obs.observe(el));

    // Count-up
    const cobs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = +(el.dataset.target || 0);
        if (!target) return;
        let current = 0;
        const step = Math.ceil(target / 55);
        const iv = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = target >= 1000 ? (current / 1000).toFixed(1) + "k+" : current + (el.dataset.suffix || "");
          if (current >= target) clearInterval(iv);
        }, 22);
        cobs.unobserve(el);
      }),
      { threshold: 0.5 }
    );
    document.querySelectorAll("[data-target]").forEach((el) => cobs.observe(el));

    // Hero stagger
    document.querySelectorAll(".lp-hs").forEach((el) => (el as HTMLElement).classList.add("lp-go"));

    return () => { obs.disconnect(); cobs.disconnect(); };
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <style>{`
        :root{--ink:#0e0c09;--cream:#faf8f4;--warm:#f3ede3;--accent:#d4520a;--accent2:#e8732e;--accent-pale:#fdf1ea;--muted:#8a847b;--border:#e4ddd2}
        .lp-body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);overflow-x:hidden;line-height:1.6}
        .lp-body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")}
        .lp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'DM Sans',sans-serif;font-weight:500;font-size:.9rem;padding:13px 26px;border-radius:999px;border:none;cursor:pointer;text-decoration:none;transition:transform .2s,box-shadow .2s,background .2s,border-color .2s;white-space:nowrap;-webkit-tap-highlight-color:transparent}
        .lp-btn:active{transform:scale(.97)!important}
        .lp-btn-accent{background:var(--accent);color:#fff}
        .lp-btn-accent:hover{background:var(--accent2);box-shadow:0 8px 28px rgba(212,82,10,.3);transform:translateY(-2px)}
        .lp-btn-outline{background:transparent;color:var(--ink);border:1.5px solid var(--border)}
        .lp-btn-outline:hover{border-color:var(--ink);transform:translateY(-2px)}
        .lp-btn-outline-light{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.3)}
        .lp-btn-outline-light:hover{border-color:rgba(255,255,255,.8);transform:translateY(-2px)}
        .lp-nav{position:fixed;top:0;inset-inline:0;z-index:600;background:rgba(250,248,244,.93);backdrop-filter:blur(18px) saturate(1.4);border-bottom:1px solid var(--border)}
        .lp-nav-inner{max-width:1140px;margin:auto;padding:0 20px;height:60px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .lp-logo{display:flex;align-items:center;gap:9px;text-decoration:none;flex-shrink:0}
        .lp-logo-mark{width:30px;height:30px;background:var(--accent);border-radius:9px;display:flex;align-items:center;justify-content:center}
        .lp-logo-text{font-family:'Fraunces',serif;font-weight:900;font-size:1.2rem;color:var(--ink);letter-spacing:-.03em}
        .lp-nav-links{display:flex;align-items:center;gap:28px}
        .lp-nav-links a{font-size:.84rem;font-weight:500;color:var(--muted);text-decoration:none;transition:color .2s}
        .lp-nav-links a:hover{color:var(--ink)}
        .lp-nav-ctas{display:flex;align-items:center;gap:8px}
        .lp-hamburger{display:none;background:none;border:none;cursor:pointer;padding:6px;color:var(--ink);line-height:0}
        .lp-drawer{display:none;position:fixed;inset:60px 0 0 0;z-index:590;background:var(--cream);border-top:1px solid var(--border);flex-direction:column;padding:24px 20px;gap:4px;overflow-y:auto}
        .lp-drawer.open{display:flex;animation:lpDrawerIn .2s ease}
        @keyframes lpDrawerIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        .lp-drawer a,.lp-drawer .lp-drawer-link{display:block;width:100%;padding:13px 16px;border-radius:11px;font-size:.97rem;font-weight:500;color:var(--ink);text-decoration:none;background:none;border:none;text-align:left;cursor:pointer;transition:background .15s}
        .lp-drawer a:hover,.lp-drawer .lp-drawer-link:hover{background:var(--warm)}
        .lp-drawer-sep{height:1px;background:var(--border);margin:10px 0}
        .lp-drawer-ctas{display:flex;flex-direction:column;gap:10px;margin-top:8px}
        .lp-drawer-ctas .lp-btn{width:100%;border-radius:12px}
        .lp-hero{min-height:100svh;padding-top:60px;display:flex;align-items:center;position:relative;overflow:hidden}
        .lp-hero-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:60px 60px;opacity:.28;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%);-webkit-mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%)}
        .lp-hero-inner{max-width:1140px;margin:auto;padding:64px 20px 80px;position:relative;z-index:2;width:100%}
        .lp-hero-layout{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
        .lp-badge{display:inline-flex;align-items:center;gap:8px;background:var(--accent-pale);border:1px solid #f0c0a0;color:var(--accent);border-radius:999px;font-size:.68rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 14px 5px 8px}
        .lp-badge-dot{width:7px;height:7px;background:var(--accent);border-radius:50%;animation:lpBlink 1.8s ease-in-out infinite;flex-shrink:0}
        @keyframes lpBlink{0%,100%{opacity:1}50%{opacity:.3}}
        .lp-h1{font-family:'Fraunces',serif;font-weight:900;font-size:clamp(3rem,7vw,6.8rem);line-height:.96;letter-spacing:-.045em;color:var(--ink);margin-top:24px}
        .lp-h1 .it{font-style:italic;color:var(--accent)}
        .lp-sub{font-size:clamp(.88rem,1.4vw,1rem);color:var(--muted);line-height:1.68;max-width:480px;margin-top:20px}
        .lp-actions{display:flex;align-items:center;gap:12px;margin-top:36px;flex-wrap:wrap}
        .lp-note{font-size:.74rem;color:var(--muted);margin-top:16px}
        .lp-mockup{border-radius:16px;overflow:hidden;border:1px solid var(--border);box-shadow:0 40px 100px rgba(14,12,9,.13);background:#fff}
        .lp-mockup-bar{background:#f5f1ec;border-bottom:1px solid var(--border);padding:10px 14px;display:flex;align-items:center;gap:5px}
        .lp-mdot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
        .lp-mockup-body{padding:22px 18px}
        .lp-doc-line{height:9px;background:var(--border);border-radius:4px;margin-bottom:9px}
        .lp-chip-float{position:absolute;background:#fff;border:1px solid var(--border);border-radius:12px;padding:9px 14px;font-size:.76rem;font-weight:500;box-shadow:0 8px 28px rgba(14,12,9,.09);display:flex;align-items:center;gap:9px;z-index:3;pointer-events:none}
        .lp-cf1{top:20%;right:5%;animation:lpFloatY 5s ease-in-out infinite}
        .lp-cf2{top:53%;right:2%;animation:lpFloatY 5s 1.6s ease-in-out infinite}
        .lp-cf3{bottom:15%;right:14%;animation:lpFloatY 5s 3s ease-in-out infinite}
        @keyframes lpFloatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .lp-stats-band{background:var(--warm);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .lp-stats-inner{max-width:1140px;margin:auto;padding:44px 20px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center}
        .lp-stat-num{font-family:'Fraunces',serif;font-weight:900;font-size:clamp(1.9rem,3.5vw,3rem);color:var(--ink);line-height:1}
        .lp-stat-label{font-size:.78rem;color:var(--muted);margin-top:5px}
        .lp-marquee-wrap{overflow:hidden;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--warm);padding:18px 0}
        .lp-marquee-track{display:flex;gap:44px;animation:lpMarquee 26s linear infinite;width:max-content}
        .lp-marquee-item{font-family:'Fraunces',serif;font-size:1rem;font-weight:600;color:var(--ink);opacity:.2;white-space:nowrap;display:flex;align-items:center;gap:14px}
        .lp-marquee-sep{width:5px;height:5px;background:var(--accent);border-radius:50%;opacity:.5}
        @keyframes lpMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .lp-section{max-width:1140px;margin:auto;padding:88px 20px}
        .lp-sec-label{display:inline-flex;align-items:center;gap:7px;font-size:.68rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--accent);margin-bottom:12px}
        .lp-sec-title{font-family:'Fraunces',serif;font-weight:900;font-size:clamp(1.9rem,4vw,3.1rem);line-height:1.08;letter-spacing:-.025em;color:var(--ink)}
        .lp-sec-sub{color:var(--muted);font-size:.9rem;line-height:1.68;margin-top:12px;max-width:460px}
        .lp-feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
        .lp-feat-card{background:#fff;border:1px solid var(--border);border-radius:18px;padding:26px;position:relative;overflow:hidden;cursor:default;transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s}
        .lp-feat-card::before{content:'';position:absolute;inset:0;border-radius:18px;background:linear-gradient(135deg,var(--accent-pale),transparent 55%);opacity:0;transition:opacity .3s}
        .lp-feat-card:hover::before{opacity:1}
        .lp-feat-card:hover{transform:translateY(-6px) scale(1.01);box-shadow:0 20px 50px rgba(14,12,9,.09)}
        .lp-feat-icon{width:46px;height:46px;background:var(--accent-pale);border-radius:13px;display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:21px;margin-bottom:16px;position:relative;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
        .lp-feat-card:hover .lp-feat-icon{transform:scale(1.16) rotate(-5deg)}
        .lp-feat-title{font-family:'Fraunces',serif;font-weight:700;font-size:1rem;color:var(--ink);margin-bottom:7px;position:relative}
        .lp-feat-desc{font-size:.81rem;line-height:1.62;color:var(--muted);position:relative}
        .lp-how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .lp-how-step{background:#fff;border:1px solid var(--border);border-radius:18px;padding:26px;display:flex;gap:20px;align-items:flex-start;transition:transform .3s ease,box-shadow .3s}
        .lp-how-step:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(14,12,9,.08)}
        .lp-step-num{font-family:'Fraunces',serif;font-weight:900;font-size:2.4rem;color:var(--border);line-height:1;min-width:48px}
        .lp-testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
        .lp-testi-card{background:var(--warm);border:1px solid var(--border);border-radius:16px;padding:24px;transition:transform .3s ease,box-shadow .3s}
        .lp-testi-card:hover{transform:translateY(-4px);box-shadow:0 12px 36px rgba(14,12,9,.07)}
        .lp-stars{color:#f5a623;font-size:13px;letter-spacing:1px;margin-bottom:12px}
        .lp-testi-avatar{width:36px;height:36px;border-radius:50%;font-size:.76rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:900px;margin:48px auto 0}
        .lp-price-card{background:#fff;border:1px solid var(--border);border-radius:20px;padding:32px;transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s}
        .lp-price-card:hover{transform:translateY(-6px);box-shadow:0 20px 50px rgba(14,12,9,.1)}
        .lp-price-card.lp-feat-plan{background:var(--ink);color:var(--cream)}
        .lp-price-check{display:flex;align-items:flex-start;gap:9px;font-size:.82rem;margin-bottom:9px;line-height:1.4}
        .lp-cta-box{background:var(--ink);border-radius:24px;padding:80px 32px;text-align:center;position:relative;overflow:hidden}
        .lp-footer{border-top:1px solid var(--border)}
        .lp-footer-inner{max-width:1140px;margin:auto;padding:56px 20px}
        .lp-footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:36px;margin-bottom:44px}
        .lp-footer-link{font-size:.81rem;color:var(--muted);text-decoration:none;display:block;margin-bottom:9px;transition:color .2s}
        .lp-footer-link:hover{color:var(--ink)}
        .lp-reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.25,.46,.45,.94),transform .7s cubic-bezier(.25,.46,.45,.94)}
        .lp-reveal.lp-in{opacity:1;transform:none}
        .lp-d1{transition-delay:.07s}.lp-d2{transition-delay:.14s}.lp-d3{transition-delay:.21s}
        .lp-d4{transition-delay:.28s}.lp-d5{transition-delay:.35s}.lp-d6{transition-delay:.42s}
        .lp-hs{opacity:0;transform:translateY(24px)}
        .lp-hs.lp-go{animation:lpFadeUp .7s cubic-bezier(.25,.46,.45,.94) forwards}
        @keyframes lpFadeUp{to{opacity:1;transform:none}}
        .lp-modal-bg{display:none;position:fixed;inset:0;z-index:900;background:rgba(14,12,9,.5);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:20px}
        .lp-modal-bg.open{display:flex}
        .lp-modal{background:#fff;border-radius:20px;padding:36px 32px;width:100%;max-width:420px;position:relative;box-shadow:0 32px 80px rgba(14,12,9,.18)}
        .lp-modal-close{position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;color:var(--muted);font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;transition:background .15s}
        .lp-modal-close:hover{background:var(--warm)}
        .lp-modal-logo{display:flex;align-items:center;gap:9px;margin-bottom:20px}
        .lp-modal h2{font-family:'Fraunces',serif;font-weight:900;font-size:1.5rem;color:var(--ink);margin-bottom:6px}
        .lp-modal .msub{font-size:.84rem;color:var(--muted);margin-bottom:20px}
        .lp-btn-google{width:100%;padding:11px 16px;border:1.5px solid var(--border);border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font-family:'DM Sans',sans-serif;font-weight:500;font-size:.87rem;cursor:pointer;transition:border-color .2s,box-shadow .2s;margin-bottom:16px}
        .lp-btn-google:hover{border-color:#aaa;box-shadow:0 2px 12px rgba(0,0,0,.08)}
        .lp-divider-row{display:flex;align-items:center;gap:10px;font-size:.76rem;color:var(--muted);margin-bottom:16px}
        .lp-divider-row::before,.lp-divider-row::after{content:'';flex:1;height:1px;background:var(--border)}
        .lp-field-label{font-size:.78rem;font-weight:600;color:var(--ink);margin-bottom:5px;display:block}
        .lp-field-input{width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:.87rem;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s;margin-bottom:14px;background:#fff;color:var(--ink)}
        .lp-field-input:focus{border-color:var(--accent)}
        .lp-modal-submit{width:100%;padding:13px;border-radius:10px;font-size:.9rem;margin-top:4px;margin-bottom:14px;justify-content:center}
        .lp-modal-switch{font-size:.78rem;color:var(--muted);text-align:center}
        .lp-modal-switch a{color:var(--accent);cursor:pointer;text-decoration:none;font-weight:600}
        @media(max-width:900px){
          .lp-hero-layout{grid-template-columns:1fr}
          .lp-feat-grid,.lp-how-grid,.lp-testi-grid{grid-template-columns:1fr 1fr}
          .lp-price-grid{grid-template-columns:1fr}
          .lp-footer-grid{grid-template-columns:1fr 1fr}
          .lp-stats-inner{grid-template-columns:repeat(2,1fr)}
          .lp-nav-links,.lp-nav-ctas{display:none}
          .lp-hamburger{display:block}
          .lp-chip-float{display:none}
        }
        @media(max-width:580px){
          .lp-feat-grid,.lp-how-grid,.lp-testi-grid{grid-template-columns:1fr}
          .lp-footer-grid{grid-template-columns:1fr}
        }
      `}</style>

      <div className="lp-body">
        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <a href="#" className="lp-logo">
              <div className="lp-logo-mark">
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "white" }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 1.5L18.5 9H13zM8 11h8v1.5H8zm0 3h5v1.5H8zm0 3h8V18.5H8z" />
                </svg>
              </div>
              <span className="lp-logo-text">Doction</span>
            </a>
            <div className="lp-nav-links">
              <a href="#features">Funcionalidades</a>
              <a href="#how">Como funciona</a>
              <a href="#pricing">Preços</a>
            </div>
            <div className="lp-nav-ctas">
              <button onClick={() => { setModalType("signin"); setModalOpen(true); }} className="lp-btn lp-btn-outline" style={{ padding: "9px 18px", fontSize: ".83rem" }}>Entrar</button>
              <button onClick={goToApp} className="lp-btn lp-btn-accent" style={{ padding: "9px 20px", fontSize: ".83rem" }}>
                <SvgIcon name="flash" style={{ width: 14, height: 14 }} /> Começar grátis
              </button>
            </div>
            <button className="lp-hamburger" onClick={() => setDrawerOpen(!drawerOpen)} aria-label="Menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {drawerOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </button>
          </div>
        </nav>

        {/* MOBILE DRAWER */}
        <div className={`lp-drawer${drawerOpen ? " open" : ""}`}>
          <a href="#features" onClick={closeDrawer}>Funcionalidades</a>
          <a href="#how" onClick={closeDrawer}>Como funciona</a>
          <a href="#pricing" onClick={closeDrawer}>Preços</a>
          <div className="lp-drawer-sep" />
          <div className="lp-drawer-ctas">
            <button onClick={() => { closeDrawer(); setModalType("signin"); setModalOpen(true); }} className="lp-btn lp-btn-outline">Entrar</button>
            <button onClick={() => { closeDrawer(); goToApp(); }} className="lp-btn lp-btn-accent">
              <SvgIcon name="flash" style={{ width: 14, height: 14 }} /> Começar grátis
            </button>
          </div>
        </div>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-grid" />
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", filter: "blur(120px)", background: "var(--accent)", opacity: .07, top: -100, right: -100, pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", filter: "blur(100px)", background: "#7ab4f0", opacity: .06, bottom: 0, left: -80, pointerEvents: "none" }} />
          <div className="lp-hero-inner">
            <div className="lp-hero-layout">
              <div>
                <div className="lp-badge lp-hs" style={{ animationDelay: "0s" }}>
                  <span className="lp-badge-dot" /><span>Novo — IA integrada</span>
                </div>
                <h1 className="lp-h1 lp-hs" style={{ animationDelay: ".1s" }}>
                  Cria.<br /><span className="it">Converte.</span><br />Transforma.
                </h1>
                <p className="lp-sub lp-hs" style={{ animationDelay: ".2s" }}>
                  O editor de documentos profissional com IA que te ajuda a criar, formatar e exportar conteúdo impressionante — em segundos.
                </p>
                <div className="lp-actions lp-hs" style={{ animationDelay: ".3s" }}>
                  <button onClick={goToApp} className="lp-btn lp-btn-accent" style={{ padding: "14px 30px", fontSize: ".95rem" }}>
                    <SvgIcon name="flash" style={{ width: 16, height: 16 }} /> Começar agora — grátis
                  </button>
                  <a href="#features" className="lp-btn lp-btn-outline" style={{ padding: "14px 22px", fontSize: ".95rem" }}>Ver funcionalidades</a>
                </div>
                <p className="lp-note lp-hs" style={{ animationDelay: ".4s" }}>✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Plano gratuito para sempre &nbsp;·&nbsp; ✓ Exporta para PDF, DOCX, TXT</p>
              </div>
              <div style={{ position: "relative" }}>
                <div className="lp-mockup">
                  <div className="lp-mockup-bar">
                    <div className="lp-mdot" style={{ background: "#ff5f57" }} />
                    <div className="lp-mdot" style={{ background: "#febc2e" }} />
                    <div className="lp-mdot" style={{ background: "#28c840" }} />
                    <div style={{ flex: 1, height: 7, background: "var(--border)", borderRadius: 4, marginLeft: 10 }} />
                  </div>
                  <div className="lp-mockup-body">
                    <div className="lp-doc-line" style={{ width: "70%", height: 14 }} />
                    <div className="lp-doc-line" style={{ width: "100%", marginTop: 18 }} />
                    <div className="lp-doc-line" style={{ width: "95%" }} />
                    <div className="lp-doc-line" style={{ width: "88%" }} />
                    <div className="lp-doc-line" style={{ width: "60%" }} />
                    <div style={{ height: 16 }} />
                    <div className="lp-doc-line" style={{ width: "100%" }} />
                    <div className="lp-doc-line" style={{ width: "92%" }} />
                    <div className="lp-doc-line" style={{ width: "75%" }} />
                    <div style={{ height: 16 }} />
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      {["#fdf1ea", "#eaf4fd", "#edfaf0"].map((bg, i) => (
                        <div key={i} style={{ flex: 1, height: 60, background: bg, borderRadius: 10, border: "1px solid var(--border)" }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lp-chip-float lp-cf1">
                  <SvgIcon name="checkmark-circle" style={{ width: 17, height: 17, filter: "invert(42%) sepia(93%) saturate(476%) hue-rotate(330deg)" }} />
                  PDF exportado
                </div>
                <div className="lp-chip-float lp-cf2">
                  <SvgIcon name="sparkles" style={{ width: 17, height: 17, filter: "invert(42%) sepia(93%) saturate(476%) hue-rotate(330deg)" }} />
                  IA a formatar
                </div>
                <div className="lp-chip-float lp-cf3">
                  <SvgIcon name="cloud-done" style={{ width: 17, height: 17, filter: "invert(42%) sepia(93%) saturate(476%) hue-rotate(330deg)" }} />
                  Guardado
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="lp-stats-band">
          <div className="lp-stats-inner">
            {[
              { target: 12000, label: "Documentos criados" },
              { target: 3200, label: "Utilizadores activos" },
              { target: 98, label: "% satisfação", suffix: "%" },
              { target: 4, label: "Formatos de exportação", suffix: "+" },
            ].map((s, i) => (
              <div key={i}>
                <div className="lp-stat-num" data-target={s.target} data-suffix={s.suffix || ""}>{s.target >= 1000 ? (s.target / 1000).toFixed(1) + "k+" : s.target + (s.suffix || "")}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MARQUEE */}
        <div className="lp-marquee-wrap">
          <div className="lp-marquee-track">
            {["Editor Profissional", "Exportar PDF", "Colaboração", "IA Integrada", "Templates", "Formatação Avançada", "Tabelas", "Imagens", "Editor Profissional", "Exportar PDF", "Colaboração", "IA Integrada", "Templates", "Formatação Avançada", "Tabelas", "Imagens"].map((item, i) => (
              <span key={i} className="lp-marquee-item">
                {item}<span className="lp-marquee-sep" />
              </span>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section id="features">
          <div className="lp-section">
            <div className="lp-reveal">
              <p className="lp-sec-label"><SvgIcon name="star" style={{ width: 12, height: 12 }} /> Funcionalidades</p>
              <h2 className="lp-sec-title">Tudo o que precisas<br />num só lugar</h2>
              <p className="lp-sec-sub">De documentos simples a relatórios complexos — o Doction tem tudo o que precisas para criar conteúdo profissional.</p>
            </div>
            <div className="lp-feat-grid">
              {[
                { icon: "document-text", title: "Editor Rico", desc: "Edição profissional com formatação avançada, estilos, tabelas, imagens e muito mais." },
                { icon: "download", title: "Exportar PDF/DOCX", desc: "Exporta os teus documentos para PDF, Word ou texto simples com um clique." },
                { icon: "sparkles", title: "IA Integrada", desc: "Deixa a IA sugerir melhorias, corrigir gramática e gerar conteúdo automaticamente." },
                { icon: "color-palette", title: "Temas e Estilos", desc: "Personaliza cores, fontes e layouts para criar documentos com a tua identidade." },
                { icon: "cloud-upload", title: "Guardar na Nuvem", desc: "Os teus documentos estão sempre seguros e acessíveis em qualquer dispositivo." },
                { icon: "people", title: "Colaboração", desc: "Trabalha em equipa em tempo real com partilha fácil e controlo de versões." },
              ].map((f, i) => (
                <div key={i} className={`lp-feat-card lp-reveal lp-d${i + 1}`}>
                  <div className="lp-feat-icon">
                    <SvgIcon name={f.icon} style={{ width: 22, height: 22 }} />
                  </div>
                  <div className="lp-feat-title">{f.title}</div>
                  <div className="lp-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" style={{ background: "var(--warm)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div className="lp-section">
            <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
              <p className="lp-sec-label"><SvgIcon name="list" style={{ width: 12, height: 12 }} /> Como funciona</p>
              <h2 className="lp-sec-title">Três passos para<br />o documento perfeito</h2>
            </div>
            <div className="lp-how-grid">
              {[
                { n: "01", title: "Cria ou importa", desc: "Começa do zero ou importa um documento existente. O editor adapta-se ao teu conteúdo." },
                { n: "02", title: "Edita e formata", desc: "Usa as ferramentas profissionais para formatar, adicionar imagens, tabelas e muito mais." },
                { n: "03", title: "Exporta e partilha", desc: "Exporta para PDF, DOCX ou partilha diretamente com um link seguro." },
              ].map((s, i) => (
                <div key={i} className={`lp-how-step lp-reveal lp-d${i + 1}`}>
                  <div className="lp-step-num">{s.n}</div>
                  <div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: "var(--ink)", marginBottom: 7 }}>{s.title}</div>
                    <div style={{ fontSize: ".81rem", color: "var(--muted)", lineHeight: 1.62 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section>
          <div className="lp-section">
            <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 0 }}>
              <p className="lp-sec-label"><SvgIcon name="heart" style={{ width: 12, height: 12 }} /> Testemunhos</p>
              <h2 className="lp-sec-title">O que dizem os nossos<br />utilizadores</h2>
            </div>
            <div className="lp-testi-grid">
              {[
                { q: "O Doction transformou a forma como crio relatórios. Exportar para PDF ficou tão simples!", name: "Ana Ferreira", role: "Gestora de Projetos", color: "#fdf1ea", letter: "A" },
                { q: "Finalmente um editor que funciona bem no telemóvel. O zoom por gestos é perfeito!", name: "Carlos Mendes", role: "Consultor", color: "#eaf4fd", letter: "C" },
                { q: "A IA integrada poupa-me horas de trabalho. Altamente recomendado para qualquer profissional.", name: "Mariana Silva", role: "Escritora", color: "#edfaf0", letter: "M" },
              ].map((t, i) => (
                <div key={i} className={`lp-testi-card lp-reveal lp-d${i + 1}`}>
                  <div className="lp-stars">★★★★★</div>
                  <p style={{ fontSize: ".84rem", lineHeight: 1.65, color: "var(--ink)", marginBottom: 16 }}>"{t.q}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="lp-testi-avatar" style={{ background: t.color, color: "var(--accent)" }}>{t.letter}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".84rem" }}>{t.name}</div>
                      <div style={{ fontSize: ".74rem", color: "var(--muted)" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ background: "var(--warm)", borderTop: "1px solid var(--border)" }}>
          <div className="lp-section" style={{ textAlign: "center" }}>
            <div className="lp-reveal">
              <p className="lp-sec-label"><SvgIcon name="pricetag" style={{ width: 12, height: 12 }} /> Preços</p>
              <h2 className="lp-sec-title">Simples e transparente</h2>
              <p className="lp-sec-sub" style={{ margin: "12px auto 0" }}>Regista-te em segundos. Sem cartão de crédito. O plano gratuito já inclui as funcionalidades essenciais para começar.</p>
            </div>
            <div className="lp-price-grid">
              {[
                { name: "Gratuito", price: "€0", period: "/mês", desc: "Para começar", featured: false, items: ["5 documentos", "Exportar PDF", "Formatação básica", "1 GB de armazenamento"], cta: "Começar grátis", ctaAction: goToApp },
                { name: "Pro", price: "€9", period: "/mês", desc: "Para profissionais", featured: true, items: ["Documentos ilimitados", "Exportar PDF, DOCX, TXT", "IA integrada", "Colaboração em tempo real", "10 GB de armazenamento", "Suporte prioritário"], cta: "Assinar Pro", ctaAction: goToApp },
                { name: "Equipa", price: "€29", period: "/mês", desc: "Para empresas", featured: false, items: ["Tudo do Pro", "5 membros incluídos", "Utilizadores ilimitados", "SLA garantido", "API dedicada", "Suporte prioritário 24/7"], cta: "Falar com vendas", ctaAction: () => {} },
              ].map((plan, i) => (
                <div key={i} className={`lp-price-card lp-reveal lp-d${i + 1}${plan.featured ? " lp-feat-plan" : ""}`}>
                  <p style={{ fontSize: ".74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: plan.featured ? "rgba(255,255,255,.5)" : "var(--muted)", marginBottom: 6 }}>{plan.name}</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: "2.6rem", color: plan.featured ? "var(--cream)" : "var(--ink)", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: ".82rem", color: plan.featured ? "rgba(255,255,255,.5)" : "var(--muted)", paddingBottom: 6 }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: ".81rem", color: plan.featured ? "rgba(255,255,255,.6)" : "var(--muted)", marginBottom: 20 }}>{plan.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                    {plan.items.map((item, j) => (
                      <li key={j} className="lp-price-check">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z" fill="#52c97e" />
                        </svg>
                        <span style={{ color: plan.featured ? "rgba(255,255,255,.85)" : "var(--ink)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={plan.ctaAction} className={`lp-btn ${plan.featured ? "lp-btn-accent" : "lp-btn-outline"}`} style={{ width: "100%", borderRadius: 12, justifyContent: "center" }}>{plan.cta}</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section>
          <div className="lp-section" style={{ paddingTop: 72, paddingBottom: 72 }}>
            <div className="lp-cta-box lp-reveal">
              <div style={{ position: "absolute", width: 480, height: 480, borderRadius: "50%", filter: "blur(110px)", background: "var(--accent)", opacity: .13, top: -110, right: -90, pointerEvents: "none" }} />
              <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", filter: "blur(90px)", background: "#7ab4f0", opacity: .08, bottom: -70, left: -70, pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <SvgIcon name="document-text" style={{ width: 46, height: 46, filter: "invert(42%) sepia(93%) saturate(476%) hue-rotate(330deg)", display: "block", margin: "0 auto 20px" }} />
                <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: "clamp(1.9rem,4.5vw,3.1rem)", color: "var(--cream)", lineHeight: 1.08, marginBottom: 14, letterSpacing: "-.025em" }}>
                  Pronto para criar documentos<br /><em style={{ color: "var(--accent)", fontStyle: "italic" }}>que impressionam?</em>
                </h2>
                <p style={{ color: "#8a847b", fontSize: ".88rem", marginBottom: 32 }}>Começa em minutos. Plano gratuito sem cartão de crédito.</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={goToApp} className="lp-btn lp-btn-accent" style={{ padding: "14px 30px", fontSize: ".95rem" }}>
                    <SvgIcon name="flash" style={{ width: 16, height: 16 }} /> Criar conta grátis
                  </button>
                  <button className="lp-btn lp-btn-outline-light" style={{ padding: "14px 24px", fontSize: ".95rem" }}>
                    <SvgIcon name="eye" style={{ width: 16, height: 16 }} /> Ver demonstração
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-grid">
              <div>
                <a href="#" className="lp-logo" style={{ display: "inline-flex", marginBottom: 14 }}>
                  <div className="lp-logo-mark" style={{ width: 26, height: 26, borderRadius: 8 }}>
                    <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "white" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 1.5L18.5 9H13zM8 11h8v1.5H8zm0 3h5v1.5H8zm0 3h8V18.5H8z" /></svg>
                  </div>
                  <span className="lp-logo-text">Doction</span>
                </a>
                <p style={{ fontSize: ".81rem", color: "var(--muted)", lineHeight: 1.65, maxWidth: 220 }}>Plataforma de criação e gestão de documentos com IA integrada.</p>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
                  <a href="#" className="lp-footer-link" style={{ margin: 0 }}><SvgIcon name="logo-instagram" style={{ width: 19, height: 19 }} /></a>
                  <a href="#" className="lp-footer-link" style={{ margin: 0 }}><SvgIcon name="logo-linkedin" style={{ width: 19, height: 19 }} /></a>
                  <a href="#" className="lp-footer-link" style={{ margin: 0 }}><SvgIcon name="logo-twitter" style={{ width: 19, height: 19 }} /></a>
                </div>
              </div>
              <div>
                <p style={{ fontSize: ".76rem", fontWeight: 700, color: "var(--ink)", marginBottom: 13, textTransform: "uppercase", letterSpacing: ".05em" }}>Produto</p>
                <a href="#features" className="lp-footer-link">Funcionalidades</a>
                <a href="#pricing" className="lp-footer-link">Preços</a>
                <a href="#" className="lp-footer-link">Integrações</a>
                <a href="#" className="lp-footer-link">Roadmap</a>
              </div>
              <div>
                <p style={{ fontSize: ".76rem", fontWeight: 700, color: "var(--ink)", marginBottom: 13, textTransform: "uppercase", letterSpacing: ".05em" }}>Empresa</p>
                <a href="#" className="lp-footer-link">Sobre nós</a>
                <a href="#" className="lp-footer-link">Blog</a>
                <a href="#" className="lp-footer-link">Carreiras</a>
                <a href="#" className="lp-footer-link">Contacto</a>
              </div>
              <div>
                <p style={{ fontSize: ".76rem", fontWeight: 700, color: "var(--ink)", marginBottom: 13, textTransform: "uppercase", letterSpacing: ".05em" }}>Suporte</p>
                <a href="#" className="lp-footer-link">Ajuda</a>
                <a href="#" className="lp-footer-link">Documentação</a>
                <a href="#" className="lp-footer-link">Status</a>
                <a href="#" className="lp-footer-link">Privacidade</a>
              </div>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid var(--border)", marginBottom: 22 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <p style={{ fontSize: ".75rem", color: "var(--muted)" }}>© 2025 Doction. Todos os direitos reservados.</p>
              <p style={{ fontSize: ".75rem", color: "var(--muted)" }}>Feito com ❤️ em Portugal</p>
            </div>
          </div>
        </footer>

        {/* MODAL */}
        <div className={`lp-modal-bg${modalOpen ? " open" : ""}`} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="lp-modal">
            <button className="lp-modal-close" onClick={() => setModalOpen(false)}>
              <SvgIcon name="close" style={{ width: 22, height: 22 }} />
            </button>
            {modalType === "signup" ? (
              <>
                <div className="lp-modal-logo">
                  <div className="lp-logo-mark" style={{ width: 26, height: 26, borderRadius: 8 }}><svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "white" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 1.5L18.5 9H13zM8 11h8v1.5H8zm0 3h5v1.5H8zm0 3h8V18.5H8z" /></svg></div>
                  <span className="lp-logo-text" style={{ fontSize: "1.05rem" }}>Doction</span>
                </div>
                <h2>Cria a tua conta</h2>
                <p className="msub">Começa grátis. Sem cartão de crédito.</p>
                <button className="lp-btn-google">
                  <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continuar com Google
                </button>
                <div className="lp-divider-row">ou com e-mail</div>
                <label className="lp-field-label">Nome completo</label>
                <input type="text" className="lp-field-input" placeholder="O teu nome" />
                <label className="lp-field-label">E-mail</label>
                <input type="email" className="lp-field-input" placeholder="email@exemplo.com" />
                <label className="lp-field-label">Palavra-passe</label>
                <input type="password" className="lp-field-input" placeholder="Mínimo 8 caracteres" />
                <button onClick={goToApp} className="lp-btn lp-btn-accent lp-modal-submit">
                  <SvgIcon name="flash" style={{ width: 14, height: 14 }} /> Criar conta grátis
                </button>
                <p className="lp-modal-switch">Já tens conta? <a onClick={() => setModalType("signin")}>Inicia sessão</a></p>
              </>
            ) : (
              <>
                <div className="lp-modal-logo">
                  <div className="lp-logo-mark" style={{ width: 26, height: 26, borderRadius: 8 }}><svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "white" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 1.5L18.5 9H13zM8 11h8v1.5H8zm0 3h5v1.5H8zm0 3h8V18.5H8z" /></svg></div>
                  <span className="lp-logo-text" style={{ fontSize: "1.05rem" }}>Doction</span>
                </div>
                <h2>Bem-vindo de volta</h2>
                <p className="msub">Inicia sessão na tua conta.</p>
                <button className="lp-btn-google">
                  <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continuar com Google
                </button>
                <div className="lp-divider-row">ou com e-mail</div>
                <label className="lp-field-label">E-mail</label>
                <input type="email" className="lp-field-input" placeholder="email@exemplo.com" />
                <label className="lp-field-label">Palavra-passe</label>
                <input type="password" className="lp-field-input" placeholder="A tua palavra-passe" />
                <p style={{ textAlign: "right", marginTop: -6, marginBottom: 16 }}><a href="#" style={{ fontSize: ".77rem", color: "var(--accent)", textDecoration: "none" }}>Esqueceste a palavra-passe?</a></p>
                <button onClick={goToApp} className="lp-btn lp-btn-accent lp-modal-submit">Entrar na minha conta</button>
                <p className="lp-modal-switch">Ainda não tens conta? <a onClick={() => setModalType("signup")}>Regista-te grátis</a></p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
