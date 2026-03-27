import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// Official Doction icon — the D-block as inline SVG
const DoctionIcon = ({ size = 30, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Cube top face */}
    <path d="M50 8 L88 26 L50 44 L12 26 Z" fill="#1a1a1a" />
    {/* Cube left face */}
    <path d="M12 26 L50 44 L50 92 L12 74 Z" fill="#0a0a0a" />
    {/* Cube right face */}
    <path d="M50 44 L88 26 L88 74 L50 92 Z" fill="#2d2d2d" />
    {/* White square on front face */}
    <rect x="22" y="34" width="42" height="42" rx="4" fill="white" opacity="0.95" />
    {/* D letter */}
    <text x="28" y="67" fontFamily="Georgia, serif" fontWeight="900" fontSize="32" fill="#1a1a1a">D</text>
  </svg>
);

// SVG Icons from assets/icons/svg/
const SvgIcon = ({ name, className = "", style = {} }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <img src={`/assets/icons/svg/${name}.svg`} className={className} style={{ display: "inline-block", ...style }} alt="" />
);

export default function DoctionLanding() {
  const [, setLocation] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"signup" | "signin">("signup");

  const goToApp = () => setLocation("/home");
  const closeDrawer = () => setDrawerOpen(false);

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

        /* ── NOISE OVERLAY ── */
        .lp-body::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E");
        }

        /* ── BUTTONS ── */
        .lp-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: .9rem;
          padding: 13px 26px; border-radius: 999px; border: none; cursor: pointer;
          text-decoration: none;
          transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, background .15s, border-color .15s;
          white-space: nowrap; -webkit-tap-highlight-color: transparent; letter-spacing: -.01em;
        }
        .lp-btn:active { transform: scale(.96) !important; }

        .lp-btn-primary {
          background: var(--bw-ink); color: #fff;
          box-shadow: 0 2px 0 rgba(0,0,0,.15);
        }
        .lp-btn-primary:hover {
          background: #222;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,.22);
        }
        .lp-btn-outline {
          background: transparent; color: var(--bw-ink);
          border: 1.5px solid var(--bw-border2);
        }
        .lp-btn-outline:hover {
          border-color: var(--bw-ink); transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,.08);
        }
        .lp-btn-outline-inv {
          background: transparent; color: #fff;
          border: 1.5px solid rgba(255,255,255,.25);
        }
        .lp-btn-outline-inv:hover {
          border-color: rgba(255,255,255,.8); transform: translateY(-2px);
        }

        /* ── NAV ── */
        .lp-nav {
          position: fixed; top: 0; inset-inline: 0; z-index: 600;
          background: rgba(255,255,255,.92); backdrop-filter: blur(20px) saturate(1.5);
          border-bottom: 1px solid var(--bw-border);
        }
        .lp-nav-inner {
          max-width: 1160px; margin: auto; padding: 0 24px;
          height: 62px; display: flex; align-items: center;
          justify-content: space-between; gap: 16px;
        }
        .lp-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .lp-logo-text {
          font-family: 'Fraunces', serif; font-weight: 900;
          font-size: 1.22rem; color: var(--bw-ink); letter-spacing: -.04em;
        }
        .lp-nav-links { display: flex; align-items: center; gap: 30px; }
        .lp-nav-links a {
          font-size: .84rem; font-weight: 500; color: var(--bw-muted);
          text-decoration: none; transition: color .15s; letter-spacing: -.01em;
        }
        .lp-nav-links a:hover { color: var(--bw-ink); }
        .lp-nav-ctas { display: flex; align-items: center; gap: 8px; }
        .lp-hamburger {
          display: none; background: none; border: 1px solid var(--bw-border);
          cursor: pointer; padding: 7px; color: var(--bw-ink); line-height: 0;
          border-radius: 8px; transition: background .15s;
        }
        .lp-hamburger:hover { background: var(--bw-bg2); }

        /* ── MOBILE DRAWER ── */
        .lp-drawer {
          display: none; position: fixed; inset: 62px 0 0 0; z-index: 590;
          background: var(--bw-bg); border-top: 1px solid var(--bw-border);
          flex-direction: column; padding: 20px; gap: 3px; overflow-y: auto;
        }
        .lp-drawer.open { display: flex; animation: lpDrawerIn .2s ease; }
        @keyframes lpDrawerIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        .lp-drawer a, .lp-drawer-link {
          display: block; width: 100%; padding: 13px 16px; border-radius: 10px;
          font-size: .97rem; font-weight: 500; color: var(--bw-ink); text-decoration: none;
          background: none; border: none; text-align: left; cursor: pointer;
          transition: background .12s;
        }
        .lp-drawer a:hover, .lp-drawer-link:hover { background: var(--bw-bg2); }
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
          background-image:
            linear-gradient(var(--bw-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--bw-border) 1px, transparent 1px);
          background-size: 56px 56px; opacity: .45;
          mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, black 10%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, black 10%, transparent 100%);
        }
        .lp-hero-inner {
          max-width: 1160px; margin: auto; padding: 72px 24px 88px;
          position: relative; z-index: 2; width: 100%;
        }
        .lp-hero-layout {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
        }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--bw-bg2); border: 1px solid var(--bw-border);
          color: var(--bw-ink); border-radius: 999px;
          font-size: .69rem; font-weight: 700; letter-spacing: .07em;
          text-transform: uppercase; padding: 5px 14px 5px 8px;
        }
        .lp-badge-dot {
          width: 7px; height: 7px; background: var(--bw-ink);
          border-radius: 50%; animation: lpBlink 2s ease-in-out infinite; flex-shrink: 0;
        }
        @keyframes lpBlink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
        .lp-h1 {
          font-family: 'Fraunces', serif; font-weight: 900;
          font-size: clamp(3.2rem, 7.5vw, 7rem);
          line-height: .93; letter-spacing: -.05em; color: var(--bw-ink); margin-top: 24px;
        }
        .lp-h1 .it { font-style: italic; }
        .lp-sub {
          font-size: clamp(.88rem, 1.4vw, 1rem); color: var(--bw-muted);
          line-height: 1.7; max-width: 480px; margin-top: 22px;
        }
        .lp-actions {
          display: flex; align-items: center; gap: 12px;
          margin-top: 36px; flex-wrap: wrap;
        }
        .lp-note { font-size: .73rem; color: var(--bw-muted); margin-top: 18px; }

        /* ── MOCKUP ── */
        .lp-mockup {
          border-radius: 16px; overflow: hidden;
          border: 1px solid var(--bw-border);
          box-shadow: 0 2px 0 rgba(0,0,0,.04), 0 8px 32px rgba(0,0,0,.08), 0 40px 80px rgba(0,0,0,.1);
          background: #fff;
        }
        .lp-mockup-bar {
          background: var(--bw-bg2); border-bottom: 1px solid var(--bw-border);
          padding: 10px 14px; display: flex; align-items: center; gap: 6px;
        }
        .lp-mdot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .lp-mockup-body { padding: 24px 20px; }
        .lp-doc-line {
          height: 9px; background: var(--bw-bg3);
          border-radius: 4px; margin-bottom: 9px;
        }
        .lp-chip-float {
          position: absolute;
          background: #fff; border: 1px solid var(--bw-border);
          border-radius: 12px; padding: 9px 14px;
          font-size: .76rem; font-weight: 600; color: var(--bw-ink);
          box-shadow: 0 8px 28px rgba(0,0,0,.1);
          display: flex; align-items: center; gap: 9px;
          z-index: 3; pointer-events: none;
        }
        .lp-cf1 { top: 18%; right: 3%; animation: lpFloatY 5s ease-in-out infinite; }
        .lp-cf2 { top: 51%; right: 0%; animation: lpFloatY 5s 1.7s ease-in-out infinite; }
        .lp-cf3 { bottom: 13%; right: 13%; animation: lpFloatY 5s 3.2s ease-in-out infinite; }
        @keyframes lpFloatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        /* ── STATS BAND ── */
        .lp-stats-band { background: var(--bw-ink); }
        .lp-stats-inner {
          max-width: 1160px; margin: auto; padding: 48px 24px;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 20px; text-align: center;
        }
        .lp-stat-num {
          font-family: 'Fraunces', serif; font-weight: 900;
          font-size: clamp(2rem, 3.5vw, 3rem); color: #fff; line-height: 1;
        }
        .lp-stat-label { font-size: .78rem; color: rgba(255,255,255,.5); margin-top: 6px; }

        /* ── MARQUEE ── */
        .lp-marquee-wrap {
          overflow: hidden;
          border-top: 1px solid var(--bw-border);
          border-bottom: 1px solid var(--bw-border);
          background: var(--bw-bg2); padding: 16px 0;
        }
        .lp-marquee-track {
          display: flex; gap: 44px;
          animation: lpMarquee 28s linear infinite; width: max-content;
        }
        .lp-marquee-item {
          font-family: 'Fraunces', serif; font-size: .95rem; font-weight: 600;
          color: var(--bw-ink); opacity: .18; white-space: nowrap;
          display: flex; align-items: center; gap: 14px;
        }
        .lp-marquee-sep { width: 4px; height: 4px; background: var(--bw-ink); border-radius: 50%; opacity: .4; }
        @keyframes lpMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── SECTIONS ── */
        .lp-section { max-width: 1160px; margin: auto; padding: 96px 24px; }
        .lp-sec-label {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: .68rem; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; color: var(--bw-muted); margin-bottom: 14px;
        }
        .lp-sec-title {
          font-family: 'Fraunces', serif; font-weight: 900;
          font-size: clamp(2rem, 4vw, 3.2rem);
          line-height: 1.06; letter-spacing: -.028em; color: var(--bw-ink);
        }
        .lp-sec-sub { color: var(--bw-muted); font-size: .9rem; line-height: 1.7; margin-top: 14px; max-width: 480px; }

        /* ── FEATURE CARDS ── */
        .lp-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 52px; }
        .lp-feat-card {
          background: var(--bw-card); border: 1px solid var(--bw-border);
          border-radius: 20px; padding: 28px; position: relative; overflow: hidden;
          cursor: default; transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s, border-color .3s;
        }
        .lp-feat-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 20px 60px rgba(0,0,0,.1);
          border-color: var(--bw-ink);
        }
        .lp-feat-icon {
          width: 48px; height: 48px;
          background: var(--bw-bg2); border: 1px solid var(--bw-border);
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px; transition: transform .3s cubic-bezier(.34,1.56,.64,1), background .2s;
        }
        .lp-feat-card:hover .lp-feat-icon {
          transform: scale(1.15) rotate(-6deg);
          background: var(--bw-ink);
        }
        .lp-feat-card:hover .lp-feat-icon img { filter: invert(1); }
        .lp-feat-title { font-family: 'Fraunces', serif; font-weight: 700; font-size: 1.05rem; color: var(--bw-ink); margin-bottom: 8px; }
        .lp-feat-desc { font-size: .81rem; line-height: 1.65; color: var(--bw-muted); }

        /* ── HOW IT WORKS ── */
        .lp-how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .lp-how-step {
          background: var(--bw-card); border: 1px solid var(--bw-border);
          border-radius: 20px; padding: 28px; display: flex; gap: 20px;
          align-items: flex-start; transition: transform .3s ease, box-shadow .3s, border-color .3s;
        }
        .lp-how-step:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,.08); border-color: var(--bw-ink); }
        .lp-step-num {
          font-family: 'Fraunces', serif; font-weight: 900; font-size: 2.8rem;
          color: var(--bw-bg3); line-height: 1; min-width: 52px;
          transition: color .25s;
        }
        .lp-how-step:hover .lp-step-num { color: var(--bw-ink); }

        /* ── TESTIMONIALS ── */
        .lp-testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 52px; }
        .lp-testi-card {
          background: var(--bw-bg2); border: 1px solid var(--bw-border);
          border-radius: 18px; padding: 26px;
          transition: transform .3s ease, box-shadow .3s;
        }
        .lp-testi-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,.08); }
        .lp-stars { color: var(--bw-ink); font-size: 13px; letter-spacing: 2px; margin-bottom: 13px; }
        .lp-testi-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          font-size: .76rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          background: var(--bw-ink); color: #fff;
        }

        /* ── PRICING ── */
        .lp-price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 940px; margin: 52px auto 0; }
        .lp-price-card {
          background: var(--bw-card); border: 1px solid var(--bw-border);
          border-radius: 22px; padding: 34px;
          transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s, border-color .3s;
        }
        .lp-price-card:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,.1); border-color: var(--bw-ink); }
        .lp-price-card.lp-feat-plan { background: var(--bw-ink); color: #fff; border-color: var(--bw-ink); }
        .lp-price-check { display: flex; align-items: flex-start; gap: 9px; font-size: .82rem; margin-bottom: 9px; line-height: 1.5; }

        /* ── CTA BOX ── */
        .lp-cta-box {
          background: var(--bw-ink); border-radius: 28px;
          padding: 88px 32px; text-align: center; position: relative; overflow: hidden;
        }

        /* ── FOOTER ── */
        .lp-footer { border-top: 1px solid var(--bw-border); }
        .lp-footer-inner { max-width: 1160px; margin: auto; padding: 60px 24px; }
        .lp-footer-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 36px; margin-bottom: 48px; }
        .lp-footer-link { font-size: .81rem; color: var(--bw-muted); text-decoration: none; display: block; margin-bottom: 9px; transition: color .15s; }
        .lp-footer-link:hover { color: var(--bw-ink); }

        /* ── REVEALS ── */
        .lp-reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.25,.46,.45,.94), transform .7s cubic-bezier(.25,.46,.45,.94); }
        .lp-reveal.lp-in { opacity: 1; transform: none; }
        .lp-d1 { transition-delay: .06s; } .lp-d2 { transition-delay: .12s; }
        .lp-d3 { transition-delay: .18s; } .lp-d4 { transition-delay: .24s; }
        .lp-d5 { transition-delay: .30s; } .lp-d6 { transition-delay: .36s; }
        .lp-hs { opacity: 0; transform: translateY(22px); }
        .lp-hs.lp-go { animation: lpFadeUp .72s cubic-bezier(.25,.46,.45,.94) forwards; }
        @keyframes lpFadeUp { to { opacity: 1; transform: none; } }

        /* ── MODAL ── */
        .lp-modal-bg {
          display: none; position: fixed; inset: 0; z-index: 900;
          background: rgba(0,0,0,.55); backdrop-filter: blur(8px);
          align-items: center; justify-content: center; padding: 20px;
        }
        .lp-modal-bg.open { display: flex; }
        .lp-modal {
          background: #fff; border-radius: 22px; padding: 38px 32px;
          width: 100%; max-width: 420px; position: relative;
          box-shadow: 0 40px 100px rgba(0,0,0,.2);
          border: 1px solid var(--bw-border);
          animation: scaleInModal .25s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes scaleInModal { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
        .lp-modal-close {
          position: absolute; top: 16px; right: 16px;
          background: var(--bw-bg2); border: 1px solid var(--bw-border);
          cursor: pointer; color: var(--bw-muted); font-size: 18px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 50%; transition: background .15s, color .15s;
        }
        .lp-modal-close:hover { background: var(--bw-ink); color: #fff; }
        .lp-modal-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
        .lp-modal h2 { font-family: 'Fraunces', serif; font-weight: 900; font-size: 1.55rem; color: var(--bw-ink); margin-bottom: 6px; }
        .lp-modal .msub { font-size: .84rem; color: var(--bw-muted); margin-bottom: 22px; }
        .lp-btn-google {
          width: 100%; padding: 12px 16px; border: 1.5px solid var(--bw-border);
          border-radius: 11px; background: #fff; display: flex; align-items: center;
          justify-content: center; gap: 10px; font-family: 'DM Sans', sans-serif;
          font-weight: 500; font-size: .87rem; cursor: pointer;
          transition: border-color .15s, box-shadow .15s; margin-bottom: 16px;
        }
        .lp-btn-google:hover { border-color: var(--bw-ink); box-shadow: 0 2px 12px rgba(0,0,0,.08); }
        .lp-divider-row {
          display: flex; align-items: center; gap: 10px;
          font-size: .76rem; color: var(--bw-muted); margin-bottom: 16px;
        }
        .lp-divider-row::before, .lp-divider-row::after { content: ''; flex: 1; height: 1px; background: var(--bw-border); }
        .lp-field-label { font-size: .78rem; font-weight: 600; color: var(--bw-ink); margin-bottom: 5px; display: block; }
        .lp-field-input {
          width: 100%; padding: 11px 14px; border: 1.5px solid var(--bw-border);
          border-radius: 11px; font-size: .87rem; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color .15s; margin-bottom: 14px;
          background: #fff; color: var(--bw-ink);
        }
        .lp-field-input:focus { border-color: var(--bw-ink); }
        .lp-modal-submit { width: 100%; padding: 13px; border-radius: 11px; font-size: .9rem; margin-top: 4px; margin-bottom: 14px; justify-content: center; }
        .lp-modal-switch { font-size: .78rem; color: var(--bw-muted); text-align: center; }
        .lp-modal-switch a { color: var(--bw-ink); cursor: pointer; text-decoration: none; font-weight: 700; border-bottom: 1px solid currentColor; }

        /* ── DIVIDER ── */
        .lp-section-alt { background: var(--bw-bg2); border-top: 1px solid var(--bw-border); border-bottom: 1px solid var(--bw-border); }

        /* ── RESPONSIVE ── */
        @media(max-width: 960px) {
          .lp-hero-layout { grid-template-columns: 1fr; }
          .lp-feat-grid, .lp-how-grid, .lp-testi-grid { grid-template-columns: 1fr 1fr; }
          .lp-price-grid { grid-template-columns: 1fr; max-width: 480px; }
          .lp-footer-grid { grid-template-columns: 1fr 1fr; }
          .lp-stats-inner { grid-template-columns: repeat(2, 1fr); }
          .lp-nav-links, .lp-nav-ctas { display: none; }
          .lp-hamburger { display: block; }
          .lp-chip-float { display: none; }
        }
        @media(max-width: 600px) {
          .lp-feat-grid, .lp-how-grid, .lp-testi-grid { grid-template-columns: 1fr; }
          .lp-footer-grid { grid-template-columns: 1fr; }
          .lp-cta-box { padding: 52px 20px; }
        }
      `}</style>

      <div className="lp-body">

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <a href="#" className="lp-logo">
              <DoctionIcon size={32} />
              <span className="lp-logo-text">Doction</span>
            </a>
            <div className="lp-nav-links">
              <a href="#features">Funcionalidades</a>
              <a href="#how">Como funciona</a>
              <a href="#pricing">Preços</a>
            </div>
            <div className="lp-nav-ctas">
              <button
                onClick={() => { setModalType("signin"); setModalOpen(true); }}
                className="lp-btn lp-btn-outline"
                style={{ padding: "9px 18px", fontSize: ".83rem" }}
              >
                Entrar
              </button>
              <button onClick={goToApp} className="lp-btn lp-btn-primary" style={{ padding: "9px 20px", fontSize: ".83rem" }}>
                <SvgIcon name="flash" style={{ width: 14, height: 14, filter: "invert(1)" }} />
                Começar grátis
              </button>
            </div>
            <button className="lp-hamburger" onClick={() => setDrawerOpen(!drawerOpen)} aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                {drawerOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                  : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                }
              </svg>
            </button>
          </div>
        </nav>

        {/* ── DRAWER ── */}
        <div className={`lp-drawer${drawerOpen ? " open" : ""}`}>
          <a href="#features" onClick={closeDrawer}>Funcionalidades</a>
          <a href="#how" onClick={closeDrawer}>Como funciona</a>
          <a href="#pricing" onClick={closeDrawer}>Preços</a>
          <div className="lp-drawer-sep" />
          <div className="lp-drawer-ctas">
            <button onClick={() => { closeDrawer(); setModalType("signin"); setModalOpen(true); }} className="lp-btn lp-btn-outline">
              Entrar
            </button>
            <button onClick={() => { closeDrawer(); goToApp(); }} className="lp-btn lp-btn-primary">
              <SvgIcon name="flash" style={{ width: 14, height: 14, filter: "invert(1)" }} />
              Começar grátis
            </button>
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-grid" />
          <div className="lp-hero-inner">
            <div className="lp-hero-layout">
              <div>
                <div className="lp-badge lp-hs" style={{ animationDelay: "0s" }}>
                  <span className="lp-badge-dot" />
                  <span>Novo — IA integrada</span>
                </div>
                <h1 className="lp-h1 lp-hs" style={{ animationDelay: ".1s" }}>
                  Cria.<br /><span className="it">Converte.</span><br />Transforma.
                </h1>
                <p className="lp-sub lp-hs" style={{ animationDelay: ".2s" }}>
                  O editor de documentos profissional com IA que te ajuda a criar, formatar e exportar conteúdo impressionante — em segundos.
                </p>
                <div className="lp-actions lp-hs" style={{ animationDelay: ".3s" }}>
                  <button onClick={goToApp} className="lp-btn lp-btn-primary" style={{ padding: "15px 32px", fontSize: ".95rem" }}>
                    <SvgIcon name="flash" style={{ width: 16, height: 16, filter: "invert(1)" }} />
                    Começar agora — grátis
                  </button>
                  <a href="#features" className="lp-btn lp-btn-outline" style={{ padding: "15px 22px", fontSize: ".95rem" }}>
                    Ver funcionalidades
                  </a>
                </div>
                <p className="lp-note lp-hs" style={{ animationDelay: ".4s" }}>
                  ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Plano gratuito para sempre &nbsp;·&nbsp; ✓ Exporta para PDF, DOCX, TXT
                </p>
              </div>

              {/* Mockup */}
              <div style={{ position: "relative" }}>
                <div className="lp-mockup lp-hs" style={{ animationDelay: ".18s" }}>
                  <div className="lp-mockup-bar">
                    <div className="lp-mdot" style={{ background: "#ff5f57" }} />
                    <div className="lp-mdot" style={{ background: "#febc2e" }} />
                    <div className="lp-mdot" style={{ background: "#28c840" }} />
                    <div style={{ flex: 1, height: 7, background: "var(--bw-bg3)", borderRadius: 4, marginLeft: 10 }} />
                  </div>
                  {/* Toolbar sim */}
                  <div style={{ background: "var(--bw-bg2)", borderBottom: "1px solid var(--bw-border)", padding: "8px 14px", display: "flex", gap: 6, alignItems: "center" }}>
                    {["B", "I", "U", "|", "≡", "≡", "≡", "|", "🔗", "📷"].map((c, i) => (
                      <span key={i} style={{ fontSize: i === 3 || i === 7 ? 16 : ".72rem", color: "var(--bw-muted)", fontWeight: 700, opacity: c === "|" ? .3 : 1, padding: c === "|" ? 0 : "3px 6px", background: c === "B" ? "var(--bw-bg3)" : "none", borderRadius: 5 }}>{c}</span>
                    ))}
                  </div>
                  <div className="lp-mockup-body">
                    <div className="lp-doc-line" style={{ width: "65%", height: 15, background: "#1a1a1a", borderRadius: 4, marginBottom: 14 }} />
                    <div className="lp-doc-line" style={{ width: "100%" }} />
                    <div className="lp-doc-line" style={{ width: "96%" }} />
                    <div className="lp-doc-line" style={{ width: "89%" }} />
                    <div className="lp-doc-line" style={{ width: "62%" }} />
                    <div style={{ height: 18 }} />
                    <div className="lp-doc-line" style={{ width: "100%" }} />
                    <div className="lp-doc-line" style={{ width: "93%" }} />
                    <div className="lp-doc-line" style={{ width: "78%" }} />
                    <div style={{ height: 14 }} />
                    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                      {["var(--bw-bg2)", "var(--bw-bg3)", "var(--bw-bg2)"].map((bg, i) => (
                        <div key={i} style={{ flex: 1, height: 56, background: bg, borderRadius: 10, border: "1px solid var(--bw-border)" }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating chips */}
                <div className="lp-chip-float lp-cf1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z" fill="#1a1a1a" /></svg>
                  PDF exportado
                </div>
                <div className="lp-chip-float lp-cf2">
                  <SvgIcon name="sparkles" style={{ width: 16, height: 16, filter: "grayscale(1)" }} />
                  IA a formatar
                </div>
                <div className="lp-chip-float lp-cf3">
                  <SvgIcon name="cloud-done" style={{ width: 16, height: 16, filter: "grayscale(1)" }} />
                  Guardado
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAND ── */}
        <div className="lp-stats-band">
          <div className="lp-stats-inner">
            {[
              { target: 12000, label: "Documentos criados" },
              { target: 3200, label: "Utilizadores activos" },
              { target: 98, label: "% satisfação", suffix: "%" },
              { target: 4, label: "Formatos de exportação", suffix: "+" },
            ].map((s, i) => (
              <div key={i}>
                <div className="lp-stat-num" data-target={s.target} data-suffix={s.suffix || ""}>
                  {s.target >= 1000 ? (s.target / 1000).toFixed(1) + "k+" : s.target + (s.suffix || "")}
                </div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MARQUEE ── */}
        <div className="lp-marquee-wrap">
          <div className="lp-marquee-track">
            {["Editor Profissional", "Exportar PDF", "Colaboração", "IA Integrada", "Templates", "Formatação Avançada", "Tabelas", "Imagens",
              "Editor Profissional", "Exportar PDF", "Colaboração", "IA Integrada", "Templates", "Formatação Avançada", "Tabelas", "Imagens"].map((item, i) => (
              <span key={i} className="lp-marquee-item">
                {item}<span className="lp-marquee-sep" />
              </span>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features">
          <div className="lp-section">
            <div className="lp-reveal">
              <p className="lp-sec-label">
                <SvgIcon name="star" style={{ width: 12, height: 12, filter: "grayscale(1)" }} />
                Funcionalidades
              </p>
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
                    <SvgIcon name={f.icon} style={{ width: 22, height: 22, filter: "grayscale(1)" }} />
                  </div>
                  <div className="lp-feat-title">{f.title}</div>
                  <div className="lp-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" className="lp-section-alt">
          <div className="lp-section">
            <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 52 }}>
              <p className="lp-sec-label">
                <SvgIcon name="list" style={{ width: 12, height: 12, filter: "grayscale(1)" }} />
                Como funciona
              </p>
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
                    <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.05rem", color: "var(--bw-ink)", marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: ".81rem", color: "var(--bw-muted)", lineHeight: 1.65 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section>
          <div className="lp-section">
            <div className="lp-reveal" style={{ textAlign: "center", marginBottom: 0 }}>
              <p className="lp-sec-label">
                <SvgIcon name="heart" style={{ width: 12, height: 12, filter: "grayscale(1)" }} />
                Testemunhos
              </p>
              <h2 className="lp-sec-title">O que dizem os nossos<br />utilizadores</h2>
            </div>
            <div className="lp-testi-grid">
              {[
                { q: "O Doction transformou a forma como crio relatórios. Exportar para PDF ficou tão simples!", name: "Ana Ferreira", role: "Gestora de Projetos", letter: "A" },
                { q: "Finalmente um editor que funciona bem no telemóvel. O zoom por gestos é perfeito!", name: "Carlos Mendes", role: "Consultor", letter: "C" },
                { q: "A IA integrada poupa-me horas de trabalho. Altamente recomendado para qualquer profissional.", name: "Mariana Silva", role: "Escritora", letter: "M" },
              ].map((t, i) => (
                <div key={i} className={`lp-testi-card lp-reveal lp-d${i + 1}`}>
                  <div className="lp-stars">★★★★★</div>
                  <p style={{ fontSize: ".84rem", lineHeight: 1.68, color: "var(--bw-ink)", marginBottom: 18 }}>"{t.q}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="lp-testi-avatar">{t.letter}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".84rem" }}>{t.name}</div>
                      <div style={{ fontSize: ".74rem", color: "var(--bw-muted)" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="lp-section-alt">
          <div className="lp-section" style={{ textAlign: "center" }}>
            <div className="lp-reveal">
              <p className="lp-sec-label">
                <SvgIcon name="pricetag" style={{ width: 12, height: 12, filter: "grayscale(1)" }} />
                Preços
              </p>
              <h2 className="lp-sec-title">Simples e transparente</h2>
              <p className="lp-sec-sub" style={{ margin: "14px auto 0" }}>
                Regista-te em segundos. Sem cartão de crédito. O plano gratuito já inclui as funcionalidades essenciais para começar.
              </p>
            </div>
            <div className="lp-price-grid">
              {[
                { name: "Gratuito", price: "€0", period: "/mês", desc: "Para começar", featured: false, items: ["5 documentos", "Exportar PDF", "Formatação básica", "1 GB armazenamento"], cta: "Começar grátis", ctaAction: goToApp },
                { name: "Pro", price: "€9", period: "/mês", desc: "Para profissionais", featured: true, items: ["Documentos ilimitados", "PDF, DOCX, TXT", "IA integrada", "Colaboração em tempo real", "10 GB armazenamento", "Suporte prioritário"], cta: "Assinar Pro", ctaAction: goToApp },
                { name: "Equipa", price: "€29", period: "/mês", desc: "Para empresas", featured: false, items: ["Tudo do Pro", "5 membros incluídos", "Utilizadores ilimitados", "SLA garantido", "API dedicada", "Suporte 24/7"], cta: "Falar com vendas", ctaAction: () => { } },
              ].map((plan, i) => (
                <div key={i} className={`lp-price-card lp-reveal lp-d${i + 1}${plan.featured ? " lp-feat-plan" : ""}`}>
                  <p style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: plan.featured ? "rgba(255,255,255,.45)" : "var(--bw-muted)", marginBottom: 8 }}>{plan.name}</p>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: "2.8rem", color: plan.featured ? "#fff" : "var(--bw-ink)", lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: ".82rem", color: plan.featured ? "rgba(255,255,255,.4)" : "var(--bw-muted)", paddingBottom: 6 }}>{plan.period}</span>
                  </div>
                  <p style={{ fontSize: ".81rem", color: plan.featured ? "rgba(255,255,255,.55)" : "var(--bw-muted)", marginBottom: 22 }}>{plan.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 26px", textAlign: "left" }}>
                    {plan.items.map((item, j) => (
                      <li key={j} className="lp-price-check">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z" fill={plan.featured ? "rgba(255,255,255,.7)" : "var(--bw-ink)"} />
                        </svg>
                        <span style={{ color: plan.featured ? "rgba(255,255,255,.85)" : "var(--bw-ink)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={plan.ctaAction}
                    className={`lp-btn ${plan.featured ? "lp-btn-outline-inv" : "lp-btn-primary"}`}
                    style={{ width: "100%", borderRadius: 12, justifyContent: "center" }}
                  >
                    {plan.cta}
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
              {/* BG orbs */}
              <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", filter: "blur(130px)", background: "#fff", opacity: .04, top: -120, right: -100, pointerEvents: "none" }} />
              <div style={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", filter: "blur(100px)", background: "#666", opacity: .08, bottom: -80, left: -80, pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Official icon in CTA */}
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
                    <SvgIcon name="eye" style={{ width: 16, height: 16, filter: "invert(1)" }} />
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
                <a href="#features" className="lp-footer-link">Funcionalidades</a>
                <a href="#pricing" className="lp-footer-link">Preços</a>
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
            <button className="lp-modal-close" onClick={() => setModalOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {modalType === "signup" ? (
              <>
                <div className="lp-modal-logo">
                  <DoctionIcon size={28} />
                  <span className="lp-logo-text" style={{ fontSize: "1.1rem" }}>Doction</span>
                </div>
                <h2>Cria a tua conta</h2>
                <p className="msub">Começa grátis. Sem cartão de crédito.</p>
                <button className="lp-btn-google">
                  <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Continuar com Google
                </button>
                <div className="lp-divider-row">ou com e-mail</div>
                <label className="lp-field-label">Nome completo</label>
                <input type="text" className="lp-field-input" placeholder="O teu nome" />
                <label className="lp-field-label">E-mail</label>
                <input type="email" className="lp-field-input" placeholder="email@exemplo.com" />
                <label className="lp-field-label">Palavra-passe</label>
                <input type="password" className="lp-field-input" placeholder="Mínimo 8 caracteres" />
                <button onClick={goToApp} className="lp-btn lp-btn-primary lp-modal-submit">
                  Criar conta grátis
                </button>
                <p className="lp-modal-switch">Já tens conta? <a onClick={() => setModalType("signin")}>Inicia sessão</a></p>
              </>
            ) : (
              <>
                <div className="lp-modal-logo">
                  <DoctionIcon size={28} />
                  <span className="lp-logo-text" style={{ fontSize: "1.1rem" }}>Doction</span>
                </div>
                <h2>Bem-vindo de volta</h2>
                <p className="msub">Inicia sessão na tua conta.</p>
                <button className="lp-btn-google">
                  <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
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
                <button onClick={goToApp} className="lp-btn lp-btn-primary lp-modal-submit">
                  Entrar na minha conta
                </button>
                <p className="lp-modal-switch">Ainda não tens conta? <a onClick={() => setModalType("signup")}>Regista-te grátis</a></p>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
