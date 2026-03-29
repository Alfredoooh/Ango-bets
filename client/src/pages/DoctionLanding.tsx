import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// ── Official Doction App Icon — loaded from assets/icons/app_icon.svg ────────
const DoctionIcon = ({ size = 30, className = "" }: { size?: number; className?: string }) => (
  <img
    src="assets/icons/app_icon.svg"
    alt="Doction"
    width={size}
    height={size}
    className={className}
    style={{
      display: "block",
      flexShrink: 0,
      filter: "brightness(0)",   /* Notion-dark — força preto puro */
    }}
  />
);

// SVG Icons from assets/icons/svg/ — inline as <img> tags
const SvgIcon = ({ name, className = "", style = {} }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <img src={`/assets/icons/svg/${name}.svg`} className={className} style={{ display: "inline-block", ...style }} alt="" />
);

// Cloud-download SVG inline (from assets/icons/svg/download.svg path)
const CloudDownloadIcon = ({ size = 20, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <img src="/assets/icons/svg/download.svg" style={{ width: size, height: size, display: "inline-block", ...style }} alt="" />
);

export default function DoctionLanding() {
  const [, setLocation] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"signup" | "signin">("signup");
  const mainRef = useRef<HTMLDivElement>(null);

  const goToApp = () => setLocation("/home");
  const closeDrawer = () => setDrawerOpen(false);

  // ── Prevent body scroll when drawer or modal is open ──────────────────────
  useEffect(() => {
    const shouldLock = drawerOpen || modalOpen;
    if (shouldLock) {
      const y = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflowY = "scroll";
    } else {
      const y = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflowY = "";
      if (y) window.scrollTo(0, -parseInt(y || "0", 10));
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflowY = "";
    };
  }, [drawerOpen, modalOpen]);

  useEffect(() => {
    // Scroll reveal
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { (e.target as HTMLElement).classList.add("lp-in"); obs.unobserve(e.target); }
      }),
      { threshold: 0.07 }
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

  // smooth scroll helper — closes drawer then scrolls
  const scrollTo = (id: string) => {
    closeDrawer();
    // small timeout so drawer close doesn't fight scroll
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <>
      <style>{`
        /* ── TOKENS ── */
        :root {
          --bw-bg: #ffffff;
          --bw-bg2: #f8f8f8;
          --bw-bg3: #f0f0f0;
          --bw-ink: #0a0a0a;
          --bw-ink2: #1a1a1a;
          --bw-muted: #6b6b6b;
          --bw-border: #e0e0e0;
          --bw-border2: #c8c8c8;
          --bw-card: #ffffff;
          --bw-accent: #0a0a0a;
        }

        .lp-body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bw-bg);
          color: var(--bw-ink);
          overflow-x: hidden;
          line-height: 1.6;
        }

        .lp-body::after {
          content: '';
          position: fixed; inset: 0;
          pointer-events: none; z-index: 9999;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E");
        }

        .lp-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: .9rem;
          padding: 13px 26px; border-radius: 999px; border: none; cursor: pointer;
          text-decoration: none;
          transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, background .15s, border-color .15s;
          white-space: nowrap; -webkit-tap-highlight-color: transparent; letter-spacing: -.01em;
        }
        .lp-btn:active { transform: scale(.96) !important; }
        .lp-btn-primary { background: var(--bw-ink); color: #fff; box-shadow: 0 2px 0 rgba(0,0,0,.15); }
        .lp-btn-primary:hover { background: #222; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.22); }
        .lp-btn-outline { background: transparent; color: var(--bw-ink); border: 1.5px solid var(--bw-border2); }
        .lp-btn-outline:hover { border-color: var(--bw-ink); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
        .lp-btn-outline-inv { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,.25); }
        .lp-btn-outline-inv:hover { border-color: rgba(255,255,255,.8); transform: translateY(-2px); }

        /* ── NAV ── */
        .lp-nav {
          position: fixed; top: 0; inset-inline: 0; z-index: 600;
          background: rgba(255,255,255,.95); backdrop-filter: blur(20px) saturate(1.5);
          border-bottom: 1px solid var(--bw-border);
        }
        .lp-nav-inner {
          max-width: 1160px; margin: auto; padding: 0 24px;
          height: 62px; display: flex; align-items: center;
          justify-content: space-between; gap: 16px;
        }
        .lp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
        .lp-logo-text { font-family: 'Fraunces', serif; font-weight: 900; font-size: 1.22rem; color: var(--bw-ink); letter-spacing: -.04em; }
        .lp-nav-links { display: flex; align-items: center; gap: 30px; }
        .lp-nav-links a {
          font-size: .84rem; font-weight: 500; color: var(--bw-muted);
          text-decoration: none; transition: color .15s; letter-spacing: -.01em;
          cursor: pointer; background: none; border: none; font-family: inherit; padding: 0;
        }
        .lp-nav-links a:hover { color: var(--bw-ink); }
        .lp-nav-ctas { display: flex; align-items: center; gap: 8px; }
        .lp-hamburger {
          display: none; background: none; border: 1px solid var(--bw-border);
          cursor: pointer; padding: 7px; color: var(--bw-ink); line-height: 0;
          border-radius: 8px; transition: background .15s;
        }
        .lp-hamburger:hover { background: var(--bw-bg2); }

        /* ── DRAWER ── */
        .lp-drawer {
          display: none; position: fixed; inset: 62px 0 0 0; z-index: 590;
          background: var(--bw-bg); border-top: 1px solid var(--bw-border);
          flex-direction: column; padding: 20px; gap: 3px; overflow-y: auto;
          overscroll-behavior: contain;
        }
        .lp-drawer.open { display: flex; animation: lpDrawerIn .2s ease; }
        @keyframes lpDrawerIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        .lp-drawer-link {
          display: block; width: 100%; padding: 13px 16px; border-radius: 10px;
          font-size: .97rem; font-weight: 500; color: var(--bw-ink); text-decoration: none;
          background: none; border: none; text-align: left; cursor: pointer;
          transition: background .12s; font-family: inherit;
        }
        .lp-drawer-link:hover { background: var(--bw-bg2); }
        .lp-drawer-sep { height: 1px; background: var(--bw-border); margin: 10px 0; }
        .lp-drawer-ctas { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
        .lp-drawer-ctas .lp-btn { width: 100%; border-radius: 12px; }

        /* ── HERO ── */
        .lp-hero {
          min-height: 100svh; padding-top: 62px;
          display: flex; align-items: center; position: relative; overflow: hidden;
        }
        .lp-hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(var(--bw-border) 1px, transparent 1px), linear-gradient(90deg, var(--bw-border) 1px, transparent 1px);
          background-size: 56px 56px; opacity: .45;
          mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, black 10%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, black 10%, transparent 100%);
        }
        .lp-hero-inner { max-width: 1160px; margin: auto; padding: 72px 24px 88px; position: relative; z-index: 2; width: 100%; }
        .lp-hero-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--bw-bg2); border: 1px solid var(--bw-border);
          color: var(--bw-ink); border-radius: 999px;
          font-size: .69rem; font-weight: 700; letter-spacing: .07em;
          text-transform: uppercase; padding: 5px 14px 5px 8px;
        }
        .lp-badge-dot { width: 7px; height: 7px; background: var(--bw-ink); border-radius: 50%; animation: lpBlink 2s ease-in-out infinite; flex-shrink: 0; }
        @keyframes lpBlink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
        .lp-h1 { font-family: 'Fraunces', serif; font-weight: 900; font-size: clamp(3.2rem, 7.5vw, 7rem); line-height: .93; letter-spacing: -.05em; color: var(--bw-ink); margin-top: 24px; }
        .lp-h1 .it { font-style: italic; }
        .lp-sub { font-size: clamp(.88rem, 1.4vw, 1rem); color: var(--bw-muted); line-height: 1.7; max-width: 480px; margin-top: 22px; }
        .lp-actions { display: flex; align-items: center; gap: 12px; margin-top: 36px; flex-wrap: wrap; }
        .lp-note { font-size: .73rem; color: var(--bw-muted); margin-top: 18px; }

        .lp-mockup { border-radius: 16px; overflow: hidden; border: 1px solid var(--bw-border); box-shadow: 0 2px 0 rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.08), 0 40px 80px rgba(0,0,0,.1); background: #fff; }
        .lp-mockup-bar { background: var(--bw-bg2); border-bottom: 1px solid var(--bw-border); padding: 10px 14px; display: flex; align-items: center; gap: 6px; }
        .lp-mdot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .lp-mockup-body { padding: 24px 20px; }
        .lp-doc-line { height: 9px; background: var(--bw-bg3); border-radius: 4px; margin-bottom: 9px; }
        .lp-chip-float { position: absolute; background: #fff; border: 1px solid var(--bw-border); border-radius: 12px; padding: 9px 14px; font-size: .76rem; font-weight: 600; color: var(--bw-ink); box-shadow: 0 8px 28px rgba(0,0,0,.1); display: flex; align-items: center; gap: 9px; z-index: 3; pointer-events: none; }
        .lp-cf1 { top: 18%; right: 3%; animation: lpFloatY 5s ease-in-out infinite; }
        .lp-cf2 { top: 51%; right: 0%; animation: lpFloatY 5s 1.7s ease-in-out infinite; }
        .lp-cf3 { bottom: 13%; right: 13%; animation: lpFloatY 5s 3.2s ease-in-out infinite; }
        @keyframes lpFloatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        /* ── STATS ── */
        .lp-stats-band { background: var(--bw-ink); }
        .lp-stats-inner { max-width: 1160px; margin: auto; padding: 48px 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
        .lp-stat-num { font-family: 'Fraunces', serif; font-weight: 900; font-size: clamp(2rem, 3.5vw, 3rem); color: #fff; line-height: 1; }
        .lp-stat-label { font-size: .78rem; color: rgba(255,255,255,.5); margin-top: 6px; }

        /* ── MARQUEE ── */
        .lp-marquee-wrap { overflow: hidden; border-top: 1px solid var(--bw-border); border-bottom: 1px solid var(--bw-border); background: var(--bw-bg2); padding: 16px 0; }
        .lp-marquee-track { display: flex; gap: 44px; animation: lpMarquee 28s linear infinite; width: max-content; }
        .lp-marquee-item { font-family: 'Fraunces', serif; font-size: .95rem; font-weight: 600; color: var(--bw-ink); opacity: .18; white-space: nowrap; display: flex; align-items: center; gap: 14px; }
        .lp-marquee-sep { width: 4px; height: 4px; background: var(--bw-ink); border-radius: 50%; opacity: .4; }
        @keyframes lpMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── SECTIONS ── */
        .lp-section { max-width: 1160px; margin: auto; padding: 96px 24px; }
        .lp-sec-label { display: inline-flex; align-items: center; gap: 7px; font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--bw-muted); margin-bottom: 14px; }
        .lp-sec-title { font-family: 'Fraunces', serif; font-weight: 900; font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.06; letter-spacing: -.028em; color: var(--bw-ink); }
        .lp-sec-sub { color: var(--bw-muted); font-size: .9rem; line-height: 1.7; margin-top: 14px; max-width: 480px; }

        /* ── FEATURES ── */
        .lp-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 52px; }
        .lp-feat-card { background: var(--bw-card); border: 1px solid var(--bw-border); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; cursor: default; transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s, border-color .3s; }
        .lp-feat-card:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 60px rgba(0,0,0,.1); border-color: var(--bw-ink); }
        .lp-feat-icon { width: 48px; height: 48px; background: var(--bw-bg2); border: 1px solid var(--bw-border); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; transition: transform .3s cubic-bezier(.34,1.56,.64,1), background .2s; }
        .lp-feat-card:hover .lp-feat-icon { transform: scale(1.15) rotate(-6deg); background: var(--bw-ink); }
        .lp-feat-card:hover .lp-feat-icon img { filter: invert(1); }
        .lp-feat-title { font-family: 'Fraunces', serif; font-weight: 700; font-size: 1.05rem; color: var(--bw-ink); margin-bottom: 8px; }
        .lp-feat-desc { font-size: .81rem; line-height: 1.65; color: var(--bw-muted); }

        /* ── HOW IT WORKS ── */
        .lp-how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .lp-how-step { background: var(--bw-card); border: 1px solid var(--bw-border); border-radius: 20px; padding: 28px; display: flex; gap: 20px; align-items: flex-start; transition: transform .3s ease, box-shadow .3s, border-color .3s; }
        .lp-how-step:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,.08); border-color: var(--bw-ink); }
        .lp-step-num { font-family: 'Fraunces', serif; font-weight: 900; font-size: 2.8rem; color: var(--bw-bg3); line-height: 1; min-width: 52px; transition: color .25s; }
        .lp-how-step:hover .lp-step-num { color: var(--bw-ink); }

        /* ── TESTIMONIALS ── */
        .lp-testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 52px; }
        .lp-testi-card { background: var(--bw-bg2); border: 1px solid var(--bw-border); border-radius: 18px; padding: 26px; transition: transform .3s ease, box-shadow .3s; }
        .lp-testi-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,.08); }
        .lp-stars { color: var(--bw-ink); font-size: 13px; letter-spacing: 2px; margin-bottom: 13px; }
        .lp-testi-avatar { width: 36px; height: 36px; border-radius: 50%; font-size: .76rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--bw-ink); color: #fff; }

        /* ── PRICING ── */
        .lp-price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 940px; margin: 52px auto 0; }
        .lp-price-card { background: var(--bw-card); border: 1px solid var(--bw-border); border-radius: 22px; padding: 34px; transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s, border-color .3s; }
        .lp-price-card:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,.1); border-color: var(--bw-ink); }
        .lp-price-card.lp-feat-plan { background: var(--bw-ink); color: #fff; border-color: var(--bw-ink); }
        .lp-price-check { display: flex; align-items: flex-start; gap: 9px; font-size: .82rem; margin-bottom: 9px; line-height: 1.5; }

        /* ── CTA BOX ── */
        .lp-cta-box { background: var(--bw-ink); border-radius: 28px; padding: 88px 32px; text-align: center; position: relative; overflow: hidden; }

        /* ── SCROLL REVEAL ── */
        .lp-reveal { opacity: 0; transform: translateY(32px); transition: opacity .65s cubic-bezier(.25,.46,.45,.94), transform .65s cubic-bezier(.25,.46,.45,.94); }
        .lp-reveal.lp-in { opacity: 1; transform: none; }
        .lp-hs { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.25,.46,.45,.94), transform .7s cubic-bezier(.25,.46,.45,.94); }
        .lp-hs.lp-go { opacity: 1; transform: none; }
        .lp-hs:nth-child(2) { transition-delay: .1s; }
        .lp-hs:nth-child(3) { transition-delay: .2s; }
        .lp-hs:nth-child(4) { transition-delay: .3s; }

        /* ── FOOTER ── */
        .lp-footer { background: var(--bw-bg2); border-top: 1px solid var(--bw-border); }
        .lp-footer-inner { max-width: 1160px; margin: auto; padding: 64px 24px 40px; }
        .lp-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
        .lp-footer-link { display: block; font-size: .82rem; color: var(--bw-muted); text-decoration: none; margin-bottom: 10px; transition: color .15s; }
        .lp-footer-link:hover { color: var(--bw-ink); }

        /* ── MODAL DESKTOP ── */
        .lp-modal-bg {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(0,0,0,.4); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; pointer-events: none; transition: opacity .22s; padding: 16px;
        }
        .lp-modal-bg.open { opacity: 1; pointer-events: auto; }
        .lp-modal {
          background: #fff; border-radius: 22px; padding: 36px 32px 32px;
          width: 100%; max-width: 420px; position: relative;
          box-shadow: 0 8px 0 rgba(0,0,0,.06), 0 32px 80px rgba(0,0,0,.22);
          animation: modalIn .26s cubic-bezier(.34,1.56,.64,1) both;
          max-height: 90vh; overflow-y: auto;
        }
        @keyframes modalIn { from { opacity: 0; transform: scale(.9) translateY(16px); } to { opacity: 1; transform: none; } }
        .lp-modal-close {
          position: absolute; top: 16px; right: 16px; width: 32px; height: 32px;
          border-radius: 50%; border: 1px solid var(--bw-border); background: var(--bw-bg2);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: var(--bw-muted); transition: background .15s, color .15s;
          z-index: 2;
        }
        .lp-modal-close:hover { background: var(--bw-bg3); color: var(--bw-ink); }
        .lp-modal-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
        .lp-modal h2 { font-family: 'Fraunces', serif; font-weight: 900; font-size: 1.5rem; color: var(--bw-ink); margin-bottom: 4px; letter-spacing: -.03em; }
        .msub { font-size: .84rem; color: var(--bw-muted); margin-bottom: 22px; }
        .lp-btn-google { width: 100%; padding: 12px; border: 1.5px solid var(--bw-border); border-radius: 12px; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: .88rem; font-weight: 600; color: var(--bw-ink); transition: border-color .15s, box-shadow .15s; margin-bottom: 16px; }
        .lp-btn-google:hover { border-color: var(--bw-ink); box-shadow: 0 2px 12px rgba(0,0,0,.07); }
        .lp-divider-row { display: flex; align-items: center; gap: 12px; font-size: .75rem; color: var(--bw-muted); margin-bottom: 16px; }
        .lp-divider-row::before, .lp-divider-row::after { content: ''; flex: 1; height: 1px; background: var(--bw-border); }
        .lp-field-label { display: block; font-size: .76rem; font-weight: 600; color: var(--bw-ink); margin-bottom: 6px; }
        .lp-field-input { width: 100%; padding: 11px 14px; border: 1.5px solid var(--bw-border); border-radius: 10px; font-size: .88rem; color: var(--bw-ink); background: #fff; outline: none; transition: border-color .15s, box-shadow .15s; margin-bottom: 14px; font-family: inherit; box-sizing: border-box; }
        .lp-field-input:focus { border-color: var(--bw-ink); box-shadow: 0 0 0 3px rgba(0,0,0,.06); }
        .lp-modal-submit { width: 100%; border-radius: 12px; padding: 14px; font-size: .92rem; margin-top: 4px; }
        .lp-modal-switch { font-size: .8rem; color: var(--bw-muted); text-align: center; margin-top: 16px; }
        .lp-modal-switch a { color: var(--bw-ink); font-weight: 700; cursor: pointer; border-bottom: 1px solid currentColor; }

        /* ── MOBILE MODAL FULLSCREEN ── */
        @media (max-width: 600px) {
          .lp-modal-bg {
            padding: 0;
            align-items: flex-end;
          }
          .lp-modal {
            border-radius: 0;
            max-width: 100%;
            width: 100%;
            min-height: 100dvh;
            max-height: 100dvh;
            padding: 56px 24px 40px;
            animation: modalInMobile .3s cubic-bezier(.25,.46,.45,.94) both;
            display: flex;
            flex-direction: column;
          }
          @keyframes modalInMobile {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: none; }
          }
          .lp-modal-close {
            top: 16px; right: 18px;
            width: auto; height: auto;
            background: none !important;
            border: none !important;
            border-radius: 0;
            padding: 4px;
            color: var(--bw-muted);
          }
          .lp-modal-close svg { width: 22px; height: 22px; }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .lp-hero-layout { grid-template-columns: 1fr; }
          .lp-feat-grid, .lp-testi-grid { grid-template-columns: 1fr; }
          .lp-how-grid, .lp-price-grid { grid-template-columns: 1fr; }
          .lp-stats-inner { grid-template-columns: repeat(2, 1fr); }
          .lp-footer-grid { grid-template-columns: 1fr 1fr; }
          .lp-nav-links, .lp-nav-ctas .lp-btn-outline { display: none; }
          .lp-hamburger { display: flex; }
        }
        @media (max-width: 480px) {
          .lp-footer-grid { grid-template-columns: 1fr; }
          .lp-stats-inner { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="lp-body" ref={mainRef}>

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <a href="#" className="lp-logo">
              <DoctionIcon size={32} />
              <span className="lp-logo-text">Doction</span>
            </a>
            <div className="lp-nav-links">
              <a onClick={() => scrollTo("features")}>Funcionalidades</a>
              <a onClick={() => scrollTo("how")}>Como funciona</a>
              <a onClick={() => scrollTo("pricing")}>Preços</a>
              <a onClick={() => scrollTo("testimonials")}>Testemunhos</a>
            </div>
            <div className="lp-nav-ctas">
              <button onClick={() => { setModalType("signin"); setModalOpen(true); }} className="lp-btn lp-btn-outline" style={{ padding: "9px 20px", fontSize: ".84rem" }}>Entrar</button>
              <button onClick={() => { setModalType("signup"); setModalOpen(true); }} className="lp-btn lp-btn-primary" style={{ padding: "9px 20px", fontSize: ".84rem" }}>Criar conta</button>
            </div>
            <button className="lp-hamburger" onClick={() => setDrawerOpen(v => !v)}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </nav>

        {/* ── MOBILE DRAWER ── */}
        <div className={`lp-drawer${drawerOpen ? " open" : ""}`}>
          <button className="lp-drawer-link" onClick={() => scrollTo("features")}>Funcionalidades</button>
          <button className="lp-drawer-link" onClick={() => scrollTo("how")}>Como funciona</button>
          <button className="lp-drawer-link" onClick={() => scrollTo("pricing")}>Preços</button>
          <button className="lp-drawer-link" onClick={() => scrollTo("testimonials")}>Testemunhos</button>
          <div className="lp-drawer-sep" />
          <div className="lp-drawer-ctas">
            <button onClick={() => { setModalType("signin"); setModalOpen(true); closeDrawer(); }} className="lp-btn lp-btn-outline">Entrar</button>
            <button onClick={() => { setModalType("signup"); setModalOpen(true); closeDrawer(); }} className="lp-btn lp-btn-primary">Criar conta grátis</button>
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-grid" />
          <div className="lp-hero-inner">
            <div className="lp-hero-layout">
              <div>
                <div className="lp-badge lp-hs">
                  <span className="lp-badge-dot" />
                  Nova versão disponível
                </div>
                <h1 className="lp-h1 lp-hs">
                  Escreve.<br /><span className="it">Cria.</span><br />Partilha.
                </h1>
                <p className="lp-sub lp-hs">
                  A plataforma de documentação moderna com IA integrada. Escreve mais rápido, formata com inteligência, colabora em tempo real.
                </p>
                <div className="lp-actions lp-hs">
                  <button onClick={() => { setModalType("signup"); setModalOpen(true); }} className="lp-btn lp-btn-primary" style={{ padding: "14px 28px" }}>
                    <SvgIcon name="flash" style={{ width: 16, height: 16, filter: "invert(1)" }} />
                    Começar grátis
                  </button>
                  <button onClick={goToApp} className="lp-btn lp-btn-outline" style={{ padding: "14px 24px" }}>
                    <SvgIcon name="eye" style={{ width: 16, height: 16 }} />
                    Ver demonstração
                  </button>
                </div>
                <p className="lp-note lp-hs">✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Plano gratuito para sempre</p>
              </div>
              <div style={{ position: "relative" }}>
                <div className="lp-mockup lp-hs">
                  <div className="lp-mockup-bar">
                    <div className="lp-mdot" style={{ background: "#ff5f57" }} />
                    <div className="lp-mdot" style={{ background: "#febc2e" }} />
                    <div className="lp-mdot" style={{ background: "#28c840" }} />
                    <div style={{ flex: 1 }} />
                    <DoctionIcon size={18} />
                  </div>
                  <div className="lp-mockup-body">
                    <div className="lp-doc-line" style={{ width: "55%", height: 16, marginBottom: 18 }} />
                    {[100, 82, 91, 70, 85, 60, 78].map((w, i) => (
                      <div key={i} className="lp-doc-line" style={{ width: `${w}%` }} />
                    ))}
                    <div style={{ height: 16 }} />
                    {[95, 75, 88, 65].map((w, i) => (
                      <div key={i} className="lp-doc-line" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
                <div className="lp-chip-float lp-cf1">
                  <SvgIcon name="checkmark-circle" style={{ width: 16, height: 16 }} />
                  Guardado automaticamente
                </div>
                <div className="lp-chip-float lp-cf2">
                  <SvgIcon name="people" style={{ width: 16, height: 16 }} />
                  3 colaboradores
                </div>
                <div className="lp-chip-float lp-cf3">
                  <SvgIcon name="stats-chart" style={{ width: 16, height: 16 }} />
                  248 palavras
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="lp-stats-band">
          <div className="lp-stats-inner">
            {[
              { n: 12000, s: "+", l: "Documentos criados" },
              { n: 3400, s: "+", l: "Utilizadores ativos" },
              { n: 99, s: "%", l: "Satisfação garantida" },
              { n: 4, s: "x", l: "Mais rápido que Word" },
            ].map((st, i) => (
              <div key={i}>
                <div className="lp-stat-num" data-target={st.n} data-suffix={st.s}>0</div>
                <div className="lp-stat-label">{st.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MARQUEE ── */}
        <div className="lp-marquee-wrap">
          <div className="lp-marquee-track">
            {Array(2).fill(["Documentos", "Colaboração", "IA Integrada", "Exportação PDF", "Estilos", "Templates", "Partilha", "Offline"]).flat().map((t, i) => (
              <span key={i} className="lp-marquee-item">
                {t}
                <span className="lp-marquee-sep" />
              </span>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features">
          <div className="lp-section">
            <div className="lp-reveal">
              <span className="lp-sec-label">
                <span style={{ width: 18, height: 1, background: "currentColor", display: "inline-block" }} />
                Funcionalidades
              </span>
              <h2 className="lp-sec-title">Tudo o que precisas.<br />Nada do que não precisas.</h2>
              <p className="lp-sec-sub">Editor poderoso, IA integrada, colaboração em tempo real — tudo numa só plataforma limpa.</p>
            </div>
            <div className="lp-feat-grid lp-reveal">
              {[
                { icon: "create", title: "Editor Avançado", desc: "Formatação rica, atalhos de teclado, modo focado. Escreve sem distrações." },
                { icon: "sparkles", title: "IA Integrada", desc: "Sugestões inteligentes, autocomplete contextual e resumo automático de documentos." },
                { icon: "people", title: "Colaboração", desc: "Convida membros, edita em tempo real, vê quem está online e o que está a escrever." },
                { icon: "download", title: "Exportação Total", desc: "PDF, Word, TXT, Markdown. O teu documento, no formato que precisas, quando precisas." },
                { icon: "shield-checkmark", title: "Segurança Total", desc: "Dados encriptados, backup automático na nuvem, controlo de versões completo." },
                { icon: "phone-portrait", title: "Mobile First", desc: "Desenhado para funcionar perfeitamente em telemóvel, tablet e desktop." },
              ].map((f, i) => (
                <div key={i} className="lp-feat-card">
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

        {/* ── HOW IT WORKS ── */}
        <section id="how" style={{ background: "var(--bw-bg2)" }}>
          <div className="lp-section">
            <div className="lp-reveal" style={{ marginBottom: 52 }}>
              <span className="lp-sec-label">
                <span style={{ width: 18, height: 1, background: "currentColor", display: "inline-block" }} />
                Como funciona
              </span>
              <h2 className="lp-sec-title">Em 3 passos simples.</h2>
            </div>
            <div className="lp-how-grid lp-reveal">
              {[
                { n: "01", title: "Cria uma conta", desc: "Regista-te gratuitamente em menos de 30 segundos. Sem cartão de crédito necessário." },
                { n: "02", title: "Escreve e formata", desc: "Usa o editor rico com atalhos inteligentes, estilos e IA para escrever mais rápido." },
                { n: "03", title: "Exporta e partilha", desc: "Descarrega em PDF, Word ou partilha um link directo com quem quiseres." },
              ].map((s, i) => (
                <div key={i} className="lp-how-step">
                  <div className="lp-step-num">{s.n}</div>
                  <div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: ".83rem", color: "var(--bw-muted)", lineHeight: 1.65 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section id="testimonials">
          <div className="lp-section">
            <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 0 }}>
              <span className="lp-sec-label">
                <span style={{ width: 18, height: 1, background: "currentColor", display: "inline-block" }} />
                Testemunhos
              </span>
              <h2 className="lp-sec-title">O que dizem sobre nós.</h2>
            </div>
            <div className="lp-testi-grid lp-reveal">
              {[
                { name: "Ana M.", role: "Jornalista", text: "O Doction transformou a forma como escrevo artigos. A IA sugere parágrafos inteiros que eu só preciso de ajustar." },
                { name: "Pedro S.", role: "Estudante", text: "Finalmente um editor que funciona tão bem no telemóvel como no computador. Incrível para estudar." },
                { name: "Carla R.", role: "Gestora de Produto", text: "A colaboração em tempo real é perfeita. A minha equipa abandonou o Google Docs em menos de uma semana." },
              ].map((t, i) => (
                <div key={i} className="lp-testi-card">
                  <div className="lp-stars">★★★★★</div>
                  <p style={{ fontSize: ".85rem", lineHeight: 1.7, color: "var(--bw-ink2)", marginBottom: 18 }}>"{t.text}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="lp-testi-avatar">{t.name[0]}</div>
                    <div>
                      <div style={{ fontSize: ".82rem", fontWeight: 700 }}>{t.name}</div>
                      <div style={{ fontSize: ".74rem", color: "var(--bw-muted)" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={{ background: "var(--bw-bg2)" }}>
          <div className="lp-section" style={{ textAlign: "center" }}>
            <div className="lp-reveal">
              <span className="lp-sec-label">
                <span style={{ width: 18, height: 1, background: "currentColor", display: "inline-block" }} />
                Preços
              </span>
              <h2 className="lp-sec-title">Simples e transparente.</h2>
              <p className="lp-sec-sub" style={{ margin: "14px auto 0" }}>Começa grátis. Cresce quando precisares.</p>
            </div>
            <div className="lp-price-grid lp-reveal">
              {[
                { name: "Gratuito", price: "0€", period: "/mês", features: ["5 documentos", "Exportação PDF", "Editor completo", "1 GB de armazenamento"], featured: false },
                { name: "Pro", price: "6€", period: "/mês", features: ["Documentos ilimitados", "IA integrada", "Colaboração em tempo real", "20 GB armazenamento", "Suporte prioritário"], featured: true },
                { name: "Equipa", price: "14€", period: "/mês", features: ["Tudo do Pro", "Até 10 membros", "Painel de administração", "100 GB armazenamento", "SSO / SAML"], featured: false },
              ].map((p, i) => (
                <div key={i} className={`lp-price-card${p.featured ? " lp-feat-plan" : ""}`}>
                  <div style={{ fontSize: ".74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12, opacity: p.featured ? .6 : undefined, color: p.featured ? "#fff" : "var(--bw-muted)" }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "2.8rem", lineHeight: 1, color: p.featured ? "#fff" : "var(--bw-ink)" }}>{p.price}</span>
                    <span style={{ fontSize: ".8rem", color: p.featured ? "rgba(255,255,255,.5)" : "var(--bw-muted)" }}>{p.period}</span>
                  </div>
                  <div style={{ height: 1, background: p.featured ? "rgba(255,255,255,.12)" : "var(--bw-border)", margin: "20px 0" }} />
                  {p.features.map((f, fi) => (
                    <div key={fi} className="lp-price-check">
                      <span style={{ color: p.featured ? "rgba(255,255,255,.7)" : "var(--bw-ink)" }}>✓</span>
                      <span style={{ color: p.featured ? "rgba(255,255,255,.75)" : "var(--bw-muted)" }}>{f}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => { setModalType("signup"); setModalOpen(true); }}
                    className="lp-btn"
                    style={{
                      width: "100%", borderRadius: 12, marginTop: 24, padding: "13px",
                      background: p.featured ? "#fff" : "var(--bw-ink)",
                      color: p.featured ? "var(--bw-ink)" : "#fff",
                    }}
                  >
                    {p.price === "0€" ? "Começar grátis" : "Escolher plano"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section>
          <div className="lp-section" style={{ paddingTop: 72, paddingBottom: 72 }}>
            <div className="lp-cta-box lp-reveal">
              <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", filter: "blur(130px)", background: "#fff", opacity: .04, top: -120, right: -100, pointerEvents: "none" }} />
              <div style={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", filter: "blur(100px)", background: "#666", opacity: .08, bottom: -80, left: -80, pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                  <DoctionIcon size={56} />
                </div>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: "clamp(2rem,4.5vw,3.2rem)", color: "#fff", lineHeight: 1.06, marginBottom: 14, letterSpacing: "-.03em" }}>
                  Pronto para criar documentos<br /><em style={{ fontStyle: "italic", opacity: .65 }}>que impressionam?</em>
                </h2>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: ".88rem", marginBottom: 34 }}>
                  Começa em minutos. Plano gratuito sem cartão de crédito.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={goToApp} className="lp-btn" style={{ background: "#fff", color: "#0a0a0a", padding: "15px 32px", fontSize: ".95rem" }}>
                    <SvgIcon name="flash" style={{ width: 16, height: 16 }} />
                    Criar conta grátis
                  </button>
                  <button className="lp-btn lp-btn-outline-inv" style={{ padding: "15px 26px", fontSize: ".95rem" }}>
                    <SvgIcon name="cloud-upload" style={{ width: 16, height: 16, filter: "invert(1)" }} />
                    Ver demonstração
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-grid">
              <div>
                <a href="#" className="lp-logo" style={{ display: "inline-flex", marginBottom: 14 }}>
                  <DoctionIcon size={28} />
                  <span className="lp-logo-text">Doction</span>
                </a>
                <p style={{ fontSize: ".81rem", color: "var(--bw-muted)", lineHeight: 1.68, maxWidth: 220 }}>
                  Plataforma de criação e gestão de documentos com IA integrada.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
                  <a href="#" className="lp-footer-link" style={{ margin: 0 }}><SvgIcon name="logo-instagram" style={{ width: 19, height: 19, filter: "grayscale(1)" }} /></a>
                  <a href="#" className="lp-footer-link" style={{ margin: 0 }}><SvgIcon name="logo-linkedin" style={{ width: 19, height: 19, filter: "grayscale(1)" }} /></a>
                  <a href="#" className="lp-footer-link" style={{ margin: 0 }}><SvgIcon name="logo-twitter" style={{ width: 19, height: 19, filter: "grayscale(1)" }} /></a>
                </div>
              </div>
              <div>
                <p style={{ fontSize: ".74rem", fontWeight: 700, color: "var(--bw-ink)", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".06em" }}>Produto</p>
                <a onClick={() => scrollTo("features")} className="lp-footer-link" style={{ cursor: "pointer" }}>Funcionalidades</a>
                <a onClick={() => scrollTo("pricing")} className="lp-footer-link" style={{ cursor: "pointer" }}>Preços</a>
                <a href="#" className="lp-footer-link">Integrações</a>
                <a href="#" className="lp-footer-link">Roadmap</a>
              </div>
              <div>
                <p style={{ fontSize: ".74rem", fontWeight: 700, color: "var(--bw-ink)", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".06em" }}>Empresa</p>
                <a href="#" className="lp-footer-link">Sobre nós</a>
                <a href="#" className="lp-footer-link">Blog</a>
                <a href="#" className="lp-footer-link">Carreiras</a>
                <a href="#" className="lp-footer-link">Contacto</a>
              </div>
              <div>
                <p style={{ fontSize: ".74rem", fontWeight: 700, color: "var(--bw-ink)", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".06em" }}>Suporte</p>
                <a href="#" className="lp-footer-link">Ajuda</a>
                <a href="#" className="lp-footer-link">Documentação</a>
                <a href="#" className="lp-footer-link">Status</a>
                <a href="#" className="lp-footer-link">Privacidade</a>
              </div>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid var(--bw-border)", marginBottom: 22 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <p style={{ fontSize: ".75rem", color: "var(--bw-muted)" }}>© 2025 Doction. Todos os direitos reservados.</p>
              <p style={{ fontSize: ".75rem", color: "var(--bw-muted)" }}>Feito com ❤️ em Portugal</p>
            </div>
          </div>
        </footer>

        {/* ── MODAL ── */}
        <div className={`lp-modal-bg${modalOpen ? " open" : ""}`} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="lp-modal">
            {/* X button — Lucide X icon */}
            <button className="lp-modal-close" onClick={() => setModalOpen(false)} aria-label="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {modalType === "signup" ? (
              <>
                <div className="lp-modal-logo"><DoctionIcon size={28} /><span className="lp-logo-text" style={{ fontSize: "1.1rem" }}>Doction</span></div>
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
                <button onClick={goToApp} className="lp-btn lp-btn-primary lp-modal-submit">Criar conta grátis</button>
                <p className="lp-modal-switch">Já tens conta? <a onClick={() => setModalType("signin")}>Inicia sessão</a></p>
              </>
            ) : (
              <>
                <div className="lp-modal-logo"><DoctionIcon size={28} /><span className="lp-logo-text" style={{ fontSize: "1.1rem" }}>Doction</span></div>
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
                <p style={{ textAlign: "right", marginTop: -6, marginBottom: 16 }}>
                  <a href="#" style={{ fontSize: ".77rem", color: "var(--bw-ink)", textDecoration: "none", fontWeight: 600, borderBottom: "1px solid currentColor" }}>Esqueceste a palavra-passe?</a>
                </p>
                <button onClick={goToApp} className="lp-btn lp-btn-primary lp-modal-submit">Entrar na minha conta</button>
                <p className="lp-modal-switch">Ainda não tens conta? <a onClick={() => setModalType("signup")}>Regista-te grátis</a></p>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
