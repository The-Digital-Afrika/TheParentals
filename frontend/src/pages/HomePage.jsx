// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";

const injectHead = () => {
  if (document.getElementById("sah-fonts")) return;
  const fonts = document.createElement("link");
  fonts.id = "sah-fonts"; fonts.rel = "stylesheet";
  fonts.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap";
  document.head.appendChild(fonts);
  const fa = document.createElement("link");
  fa.rel = "stylesheet";
  fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
  document.head.appendChild(fa);
};

const CSS = `
  :root {
    --accent:#6f8da6; --accent-dark:#557691; --accent-light:#d9efff;
    --accent-solid:#ff8c42;
    --red:#e62925; --red-dark:#b91c1c; --red-light:#ffd7d1;
    --dark:#333330; --mid:#55514b; --muted:#837b70;
    --grey:#9a958c; --grey-dark:#6a655d; --light-bg:#f6f2ec; --white:#fff;
    --border:rgba(0,0,0,0.08);
    --shadow-sm:0 1px 4px rgba(0,0,0,0.06);
    --shadow-md:0 4px 20px rgba(0,0,0,0.09);
    --shadow-lg:0 12px 48px rgba(0,0,0,0.12);
    --radius:8px; --radius-lg:12px; --header-h:96px;
  }
  .sah-wrap *,.sah-wrap *::before,.sah-wrap *::after{box-sizing:border-box;margin:0;padding:0;}
  .sah-wrap{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:300;background:var(--white);color:var(--dark);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
  .sah-wrap h1,.sah-wrap h2,.sah-wrap h3,.sah-wrap h4,.sah-wrap h5,.sah-wrap h6{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;}
  .sah-wrap a{color:inherit;text-decoration:none;}
  .sah-wrap button{cursor:pointer;font-family:inherit;}
  .sah-wrap img{display:block;max-width:100%;}
  .sah-container{max-width:1280px;margin:0 auto;padding:0 32px;}

  /* HEADER */
  .sah-header{position:sticky;top:0;z-index:1000;height:var(--header-h);background:rgba(111,141,166,0.78);background-image:none;box-shadow:0 12px 34px rgba(24,35,48,0.18);backdrop-filter:blur(18px) saturate(1.12);-webkit-backdrop-filter:blur(18px) saturate(1.12);overflow:hidden;}
  .sah-header::before{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.06);pointer-events:none;z-index:0;}
  .sah-nav-inner{height:100%;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;}
  .sah-brand{display:flex;align-items:center;gap:12px;background:transparent;border:0;border-radius:0;padding:0;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;}
  .sah-brand-logo{display:block;width:190px;max-width:28vw;height:52px;object-fit:contain;object-position:left center;filter:drop-shadow(0 4px 10px rgba(24,35,48,0.22));}
  .sah-brand-divider{width:2px;height:30px;background:rgba(255,211,106,0.55);border-radius:1px;}
  .sah-brand-text{display:flex;flex-direction:column;line-height:1.15;}
  .sah-brand-name{font-family:'Playfair Display',serif;font-weight:800;font-size:1rem;color:#fff;letter-spacing:0.2px;}
  .sah-brand-tag{font-size:0.66rem;color:rgba(255,255,255,0.75);font-weight:500;letter-spacing:0.5px;}
  .sah-nav-links{display:flex;align-items:center;gap:2px;}
  .sah-nav-links a{padding:8px 14px;border-radius:5px;font-weight:600;font-size:1rem;color:rgba(255,255,255,0.85);transition:all 0.15s;}
  .sah-nav-links a:hover{color:#fff;background:rgba(255,255,255,0.2);}
  .sah-nav-ctas{display:flex;align-items:center;gap:8px;}
  .sah-btn-ghost-nav{padding:7px 16px;border-radius:5px;border:1.5px solid rgba(255,255,255,0.6);background:transparent;color:#fff;font-weight:600;font-size:0.85rem;transition:all 0.15s;cursor:pointer;}
  .sah-btn-ghost-nav:hover{border-color:#fff;background:rgba(255,255,255,0.2);}
  .sah-btn-solid-nav{
    padding:7px 18px;border-radius:5px;background:var(--accent-solid);
    color:#fff !important;font-weight:700;font-size:0.85rem;border:none;
    transition:background 0.15s;box-shadow:none !important;
    display:inline-block;cursor:pointer;text-decoration:none;
  }
  .sah-btn-solid-nav:hover{filter:saturate(1.08) brightness(0.94);}

  /* User Profile Button in Header */
  .sah-user-profile-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 16px; border-radius: 6px;
    border: 1.5px solid rgba(255,255,255,0.55); background: transparent;
    color: #fff; font-weight: 600; font-size: 0.85rem;
    cursor: pointer; font-family: inherit; text-decoration: none;
    transition: all 0.15s;
  }
  .sah-user-profile-btn:hover {
    background: rgba(255,255,255,0.2); border-color: #fff;
  }
  .sah-user-profile-btn i { color: var(--accent-light); }

  .sah-logout-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 18px; border-radius: 6px; border: none;
    background: var(--accent-solid); color: #fff; font-weight: 700;
    font-size: 0.85rem; cursor: pointer; font-family: inherit;
    transition: background 0.15s;
  }
  .sah-logout-btn:hover { filter:saturate(1.08) brightness(0.94); }
  .sah-logout-btn i { color: rgba(255,255,255,0.9); }

  /* HERO */
  .sah-hero{position:relative;min-height:64vh;display:flex;align-items:center;overflow:hidden;background:#1e1e1e;}
  .sah-hero-bg{position:absolute;inset:0;z-index:0;
    background-image:url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&auto=format&fit=crop&q=80');
    background-size:cover;background-position:center 30%;}
  .sah-hero-bg::after{content:'';position:absolute;inset:0;background:rgba(24,35,48,0.68);}
  .sah-hero-inner{position:relative;z-index:2;padding:44px 0;width:100%;}
  .sah-hero-top{text-align:center;margin-bottom:24px;}
  .sah-hero-h1{font-family:'Playfair Display',Georgia,serif;font-size:clamp(2.2rem,4.7vw,3.8rem);font-weight:800;line-height:1.08;color:#fff;margin-bottom:18px;letter-spacing:-0.8px;}
  .sah-hero-h1 em{font-style:italic;color:rgba(255,255,255,0.9);}
  .sah-heading-carousel{min-height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:18px;}
  .sah-heading-carousel .sah-hero-h1{margin-bottom:0;animation:sahHeadingFade .5s ease both;}
  @keyframes sahHeadingFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

  /* SEARCH BAR */
  .sah-hero-search{display:flex;flex-direction:row;align-items:stretch;background:#fff;border-radius:var(--radius);overflow:hidden;max-width:780px;margin:0 auto;box-shadow:0 8px 40px rgba(0,0,0,0.4);width:100%;}
  .sah-hs-icon{display:flex;align-items:center;padding:0 14px;color:#aaa;font-size:0.9rem;flex-shrink:0;}
  .sah-hero-search input{flex:1;min-width:0;border:none;outline:none;padding:16px 6px;font-family:'DM Sans',sans-serif;font-size:0.95rem;color:var(--dark);background:transparent;-webkit-appearance:none;appearance:none;}
  .sah-hero-search input::placeholder{color:#bbb;}
  .sah-hs-sep{width:1px;background:var(--border);margin:10px 0;flex-shrink:0;}
  .sah-hero-search select{border:none;outline:none;padding:0 14px;background:transparent;font-family:'DM Sans',sans-serif;font-size:0.88rem;color:var(--muted);cursor:pointer;min-width:140px;flex-shrink:0;-webkit-appearance:none;-moz-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23aaa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px;}
  .sah-hs-btn{background:var(--accent-solid);color:#fff;border:none;padding:0 26px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:0.92rem;white-space:nowrap;transition:filter 0.15s;flex-shrink:0;cursor:pointer;}
  .sah-hs-btn:hover{filter:saturate(1.08) brightness(0.94);}
  .sah-hero-services{max-width:900px;margin:0 auto 24px;color:#fff;}
  .sah-hero-services-list{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;}
  .sah-hero-services-list button{border:1px solid rgba(255,255,255,.48);background:rgba(255,255,255,.1);color:#fff;border-radius:999px;padding:8px 15px;font-size:.84rem;font-weight:500;backdrop-filter:blur(6px);transition:.18s ease;}
  .sah-hero-services-list button:hover,.sah-hero-services-list button.active{background:#fff;color:var(--accent-dark);border-color:#fff;}
  .sah-hero-services-list button i{display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;margin-right:3px;border-radius:50%;background:color-mix(in srgb,var(--category-color) 18%,transparent);color:var(--category-color);font-size:.72rem;}
  .sah-cat-education{--category-color:#60a5fa;}
  .sah-cat-wellness{--category-color:#f472b6;}
  .sah-cat-activities{--category-color:#c084fc;}
  .sah-cat-healthcare{--category-color:#fb7185;}
  .sah-cat-shopping{--category-color:#fbbf24;}
  .sah-cat-family{--category-color:#4ade80;}
  .sah-hero-actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:22px;}
  .sah-hero-secondary-cta{display:inline-flex;align-items:center;gap:9px;padding:12px 26px;border:1.5px solid rgba(255,255,255,.72);border-radius:var(--radius);background:rgba(255,255,255,.08);color:#fff;font-weight:700;}

  /* HERO CTA AREA */
  .sah-hero-tagline{text-align:center;margin-top:22px;margin-bottom:36px;}
  @media(prefers-reduced-motion:reduce){.sah-heading-carousel .sah-hero-h1{animation:none}}

  /* BECOME PROVIDER BUTTON */
  .sah-become-btn{
    display:inline-flex;align-items:center;gap:10px;padding:13px 30px;
    background:var(--accent-solid);color:#fff !important;border:none;
    border-radius:var(--radius);font-weight:700;font-size:0.97rem;
    transition:background 0.15s,transform 0.15s;cursor:pointer;
    box-shadow:none;text-decoration:none;
  }
  .sah-become-btn:hover{filter:saturate(1.08) brightness(0.94);transform:translateY(-2px);}
  .sah-become-btn.active{background:var(--accent);box-shadow:none;}
  .sah-become-btn.active:hover{background:var(--accent-dark);transform:none;}
  .sah-become-btn .sah-chev{font-size:0.78rem;transition:transform 0.3s ease;}
  .sah-become-btn.active .sah-chev{transform:rotate(180deg);}

  /* PLANS ACCORDION */
  .sah-plans-section{padding:56px 0 62px;background:#fff;border-bottom:1px solid var(--border);}
  .sah-plans-heading{text-align:center;margin-bottom:28px;}
  .sah-plans-heading p{color:var(--muted);margin-top:6px;}
  .sah-hero-plans-wrap{display:grid;grid-template-rows:1fr;}
  .sah-hero-plans-wrap.open{grid-template-rows:1fr;}
  .sah-hero-plans-inner{overflow:hidden;}
  .sah-hero-plans-grid-outer{padding-top:24px;padding-bottom:8px;}
  .sah-hero-plans-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;max-width:850px;margin:0 auto;}

  /* PLAN CARDS */
  .sah-plan-item{border:1px solid var(--border);border-radius:var(--radius-lg);background:#fff;transition:border-color .2s,box-shadow .2s,transform .2s;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shadow-sm);}
  .sah-plan-item:hover{border-color:rgba(85,118,145,.65);box-shadow:var(--shadow-md);transform:translateY(-2px);}
  .sah-plan-item.highlight{border-color:var(--accent);background:#f8fbfd;box-shadow:0 0 0 1px var(--accent),var(--shadow-md);}
  .sah-plan-header{display:flex;align-items:flex-start;justify-content:space-between;padding:18px 18px 12px;}
  .sah-plan-info{flex:1;}
  .sah-plan-name{font-weight:700;font-size:1.05rem;color:var(--dark);}
  .sah-plan-desc{font-size:0.8rem;color:var(--muted);margin-top:3px;}
  .sah-plan-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;margin-left:10px;}
  .sah-plan-price{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:1.4rem;font-weight:700;color:var(--accent-dark);line-height:1;}
  .sah-plan-price small{font-size:0.66rem;color:var(--muted);font-weight:300;display:block;text-align:right;}
  .sah-plan-chevron{display:none;}
  .sah-plan-item.highlight .sah-plan-chevron{color:var(--accent);}
  .sah-plan-chevron.open{transform:rotate(180deg);}
  .sah-plan-details{display:grid;grid-template-rows:1fr;}
  .sah-plan-details.open{grid-template-rows:1fr;}
  .sah-plan-details-inner{overflow:hidden;padding:0 18px;transition:padding 0.32s ease;}
  .sah-plan-details-inner,.sah-plan-details.open .sah-plan-details-inner{padding:0 18px 18px;}
  .sah-plan-details-content{padding-top:12px;border-top:1px solid var(--border);}
  .sah-plan-features{list-style:none;display:flex;flex-direction:column;gap:6px;margin-bottom:14px;padding:0;}
  .sah-plan-features li{display:flex;align-items:center;gap:7px;font-size:0.84rem;color:var(--mid);}
  .sah-plan-features li.no{color:#aaa;}
  .sah-ico-yes{color:#4ade80;font-size:0.7rem;}
  .sah-ico-no{color:rgba(255,255,255,0.22);font-size:0.7rem;}
  .sah-plan-cta-link{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;background:var(--accent-solid);color:#fff !important;border:none;border-radius:var(--radius);font-size:0.82rem;font-weight:700;transition:filter 0.15s;cursor:pointer;text-decoration:none;}
  .sah-plan-cta-link:hover{filter:saturate(1.08) brightness(0.94);}
  .sah-signup-prompt{position:fixed;inset:0;z-index:2200;background:rgba(24,35,48,.5);display:flex;align-items:flex-end;justify-content:flex-end;padding:28px;}
  .sah-signup-prompt-card{position:relative;width:min(410px,100%);background:#fff;border-radius:14px;padding:28px;box-shadow:var(--shadow-lg);border:1px solid rgba(111,141,166,.22);}
  .sah-signup-prompt-card h2{font-size:1.45rem;color:var(--dark);margin-bottom:8px;}
  .sah-signup-prompt-card p{color:var(--muted);font-size:.92rem;margin-bottom:20px;}
  .sah-signup-prompt-close{position:absolute;right:12px;top:12px;width:34px;height:34px;border:0;border-radius:50%;background:#f3f4f6;color:#666;}
  .sah-signup-prompt-actions{display:flex;gap:10px;flex-wrap:wrap;}
  .sah-signup-prompt-actions button{flex:1;min-width:140px;padding:11px 16px;border-radius:7px;font-weight:700;}
  .sah-signup-prompt-primary{border:0;background:var(--accent-solid);color:#fff;}
  .sah-signup-prompt-secondary{border:1px solid var(--accent);background:#fff;color:var(--accent-dark);}

  /* FILTER BAR */
  .sah-filter-bar{background:var(--white);border-bottom:1px solid var(--border);}
  .sah-filter-bar-row{display:flex;align-items:center;gap:6px;padding:16px 0;overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .sah-filter-bar-row::-webkit-scrollbar{display:none;}
  .sah-filter-label{font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);white-space:nowrap;margin-right:6px;flex-shrink:0;}
  .sah-fpill{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:6px;border:1px solid var(--border);background:var(--white);color:var(--muted);font-size:1rem;font-weight:600;transition:all 0.15s;cursor:pointer;white-space:nowrap;flex-shrink:0;line-height:1.3;}
  .sah-fpill:hover{border-color:var(--accent);color:var(--accent);}
  .sah-fpill.active{background:var(--accent);color:#fff;border-color:var(--accent);}
  .sah-fpill i{font-size:0.95rem;}

  /* PROVIDERS */
  .sah-providers-section{padding:60px 0 76px;background:var(--light-bg);}
  .sah-sec-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;}
  .sah-sec-eyebrow{display:block;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;color:var(--accent);margin-bottom:5px;}
  .sah-sec-header h2{font-family:'Playfair Display',serif;font-size:clamp(1.5rem,3vw,2rem);font-weight:800;color:var(--dark);line-height:1.15;}
  .sah-sec-right{font-size:0.84rem;color:var(--muted);}
  .sah-link-btn{background:none;border:none;padding:0;color:var(--accent);font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:inherit;text-decoration:none;}
  .sah-link-btn:hover{text-decoration:underline;}
  .sah-provider-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
  .sah-provider-card{background:var(--white);border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border);box-shadow:var(--shadow-sm);transition:box-shadow 0.2s,transform 0.2s;display:flex;flex-direction:column;}
  .sah-provider-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);}
  .sah-provider-card.is-featured-slot{border-color:rgba(85,118,145,0.35);box-shadow:0 2px 12px rgba(85,118,145,0.12);}
  .sah-card-thumb{position:relative;height:165px;overflow:hidden;background:var(--accent-light);flex-shrink:0;}
  .sah-card-thumb img{width:100%;height:100%;object-fit:cover;transition:transform 0.35s;}
  .sah-provider-card:hover .sah-card-thumb img{transform:scale(1.04);}
  .sah-card-thumb-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.8rem;color:var(--accent);background:#eaf6ff;}
  .sah-card-badges{position:absolute;top:9px;left:9px;display:flex;gap:4px;}
  .sah-cbadge{padding:3px 9px;border-radius:3px;font-size:0.67rem;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;}
  .sah-cbadge-featured{background:var(--red);color:#fff;}
  .sah-cbadge-new{background:#0d7d6c;color:#fff;}
  .sah-cbadge-verified{background:#3a3a3a;color:#fff;}
  .sah-card-save{position:absolute;top:9px;right:9px;width:28px;height:28px;border-radius:4px;background:rgba(255,255,255,0.9);border:none;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.8rem;transition:color 0.15s;}
  .sah-card-save:hover{color:var(--accent);}
  .sah-card-provider-row{display:flex;align-items:center;gap:8px;padding:11px 13px 0;}
  .sah-pav{width:30px;height:30px;border-radius:50%;background:var(--accent-light);display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:0.8rem;flex-shrink:0;}
  .sah-pav-name{font-weight:700;font-size:0.77rem;color:var(--dark);line-height:1.2;}
  .sah-pav-tier{font-size:0.68rem;color:var(--muted);}
  .sah-card-body{padding:9px 13px 14px;flex:1;display:flex;flex-direction:column;}
  .sah-card-title{font-weight:700;font-size:0.87rem;color:var(--dark);margin-bottom:7px;line-height:1.35;}
  .sah-card-meta{display:flex;flex-direction:column;gap:3px;font-size:0.74rem;color:var(--muted);margin-bottom:8px;}
  .sah-card-meta span{display:flex;align-items:center;gap:4px;}
  .sah-card-meta i{color:var(--accent);font-size:0.68rem;width:12px;}
  .sah-card-rating{display:flex;align-items:center;gap:5px;font-size:0.76rem;margin-bottom:10px;}
  .sah-stars{color:#c97c10;font-size:0.76rem;letter-spacing:-0.5px;}
  .sah-rnum{font-weight:700;color:var(--dark);}
  .sah-rcnt{color:var(--muted);}
  .sah-card-foot{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:10px;border-top:1px solid var(--border);}
  .sah-from-label{font-size:0.65rem;color:var(--muted);line-height:1;}
  .sah-card-price{font-family:'Playfair Display',serif;font-size:1.08rem;font-weight:800;color:var(--accent);}
  .sah-card-cta{padding:6px 13px;background:var(--accent);color:#fff;border:none;border-radius:5px;font-size:0.77rem;font-weight:700;transition:background 0.15s;}
  .sah-card-cta:hover{background:var(--accent-dark);}
  .sah-grid-empty{grid-column:1/-1;text-align:center;padding:70px 20px;color:var(--muted);}
  .sah-grid-empty i{font-size:2.2rem;margin-bottom:12px;opacity:0.3;display:block;}
  .sah-grid-empty h3{font-family:'Playfair Display',serif;font-size:1.25rem;color:var(--dark);margin-bottom:7px;}

  /* SECTION LABEL DIVIDER */
  .sah-section-label{display:flex;align-items:center;gap:12px;margin:0 0 16px;font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:1.8px;color:var(--accent);}
  .sah-section-label::after{content:'';flex:1;height:1px;background:rgba(85,118,145,0.2);}

  /* HOW IT WORKS */
  .sah-how-section{padding:76px 0;background:var(--white);}
  .sah-how-header{margin-bottom:44px;}
  .sah-steps-grid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;}
  .sah-step{padding:38px 28px;border-right:1px solid var(--border);}
  .sah-step:last-child{border-right:none;}
  .sah-step-num{font-family:'Playfair Display',serif;font-size:3rem;font-weight:900;color:var(--accent);display:block;line-height:1;margin-bottom:14px;text-shadow:0 8px 20px rgba(85,118,145,0.14);}
  .sah-step h3{font-weight:700;font-size:0.97rem;color:var(--dark);margin-bottom:9px;}
  .sah-step p{font-size:0.85rem;color:var(--muted);line-height:1.65;}

  /* FOOTER */
  .sah-footer{background:rgba(111,141,166,0.9);color:rgba(255,255,255,0.92);padding:28px 0 14px;border-top:1px solid rgba(255,255,255,0.32);box-shadow:0 -14px 40px rgba(24,35,48,0.14);backdrop-filter:blur(18px) saturate(1.12);-webkit-backdrop-filter:blur(18px) saturate(1.12);}
  .sah-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:22px;margin-bottom:16px;}
  .sah-footer-brand-mark{display:inline-flex;align-items:center;margin-bottom:4px;text-decoration:none;}
  .sah-footer-brand-mark img{display:block;width:190px;max-width:42vw;height:auto;filter:drop-shadow(0 4px 10px rgba(24,35,48,0.18));}
  .sah-footer-logo{font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:800;color:#fff;display:block;margin-bottom:7px;}
  .sah-footer-brand p{font-size:0.85rem;line-height:1.5;max-width:260px;color:rgba(255,255,255,0.82);}
  .sah-footer-newsletter{margin-top:10px;max-width:280px;}
  .sah-footer-newsletter-row{display:flex;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);}
  .sah-footer-newsletter input{flex:1;padding:10px 13px;background:rgba(255,255,255,0.06);border:none;color:#fff;font-family:inherit;font-size:0.82rem;outline:none;}
  .sah-footer-newsletter button{padding:10px 14px;background:var(--accent-solid);color:#fff;border:none;font-weight:700;font-size:0.8rem;cursor:pointer;}
  .sah-nl-feedback{font-size:0.74rem;margin-top:6px;}
  .sah-nl-feedback.error{color:#f87171;}
  .sah-nl-feedback.success{color:#4ade80;}
  .sah-footer-col{padding-top:28px;}
  .sah-footer-col h4{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#fff;margin-bottom:9px;}
  .sah-footer-col ul{list-style:none;display:flex;flex-direction:column;gap:5px;padding:0;margin:0;}
  .sah-footer-col ul li a{color:rgba(255,255,255,0.82);text-decoration:none;font-size:0.875rem;transition:color 0.15s;}
  .sah-footer-col ul li a:hover{color:#fff;}
  .sah-footer-trust{display:flex;gap:14px;align-items:center;padding:9px 0;margin-bottom:8px;border-top:1px solid rgba(255,255,255,0.22);flex-wrap:wrap;}
  .sah-footer-trust-item{display:flex;align-items:center;gap:7px;font-size:0.78rem;color:rgba(255,255,255,0.82);}
  .sah-footer-trust-item i{color:var(--accent);font-size:0.82rem;}
  .sah-footer-bottom{border-top:1px solid rgba(255,255,255,0.22);padding-top:10px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;}
  .sah-footer-bottom p{font-size:0.8rem;color:rgba(255,255,255,0.82);}
  .sah-footer-bottom-links{display:flex;gap:20px;font-size:0.8rem;}
  .sah-footer-bottom-links a{color:rgba(255,255,255,0.82);text-decoration:none;transition:color 0.15s;}
  .sah-footer-bottom-links a:hover{color:#fff;}
  .sah-footer-socials{display:flex;gap:8px;}
  .sah-footer-soc{width:34px;height:34px;border-radius:5px;background:rgba(255,255,255,0.16);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.86);font-size:0.84rem;text-decoration:none;transition:all 0.15s;}
  .sah-footer-soc:hover{background:var(--accent-solid);color:#fff;}

  /* REGISTER MODAL */
  .sah-modal-overlay{position:fixed;inset:0;z-index:9000;background:rgba(8,0,4,0.75);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity 0.22s;}
  .sah-modal-overlay.open{opacity:1;pointer-events:all;}
  .sah-modal-box{background:var(--white);width:460px;max-width:93vw;border-radius:var(--radius-lg);box-shadow:0 28px 72px rgba(0,0,0,0.28);overflow:hidden;transform:translateY(14px);transition:transform 0.22s ease;}
  .sah-modal-overlay.open .sah-modal-box{transform:translateY(0);}
  .sah-modal-head{background:#6f8da6;padding:26px 28px 20px;position:relative;}
  .sah-modal-head h2{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:800;color:#fff;}
  .sah-modal-head p{font-size:0.86rem;color:rgba(255,255,255,0.65);margin-top:3px;}
  .sah-modal-close{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:4px;background:rgba(255,255,255,0.12);border:none;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.88rem;transition:background 0.15s;cursor:pointer;}
  .sah-modal-close:hover{background:rgba(255,255,255,0.22);}
  .sah-modal-body{padding:24px 28px 28px;}
  .sah-reg-options{display:flex;flex-direction:column;gap:10px;margin-bottom:14px;}
  .sah-reg-opt{display:flex;align-items:center;gap:12px;padding:13px 16px;border:1.5px solid var(--border);border-radius:var(--radius);text-decoration:none;color:var(--dark);transition:all 0.15s;background:#fafaf9;}
  .sah-reg-opt:hover{border-color:var(--accent);background:#f3f9ff;}
  .sah-reg-opt-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0;}
  .sah-reg-opt-icon.user{background:#ede9fe;color:#5b21b6;}
  .sah-reg-opt-icon.provider{background:#fef3c7;color:#92400e;}
  .sah-reg-opt-title{font-weight:700;font-size:0.9rem;margin-bottom:1px;}
  .sah-reg-opt-desc{font-size:0.75rem;color:var(--muted);}
  .sah-modal-switch{text-align:center;margin-top:12px;font-size:0.85rem;color:var(--muted);}
  .sah-modal-switch a{color:var(--accent);font-weight:600;}

  /* LOGIN REQUIRED MODAL */
  .sah-login-modal-icon{
    width:56px;height:56px;border-radius:50%;
    background:rgba(85,118,145,0.12);
    display:flex;align-items:center;justify-content:center;
    margin:0 auto 16px;
    font-size:1.4rem;color:var(--accent);
  }
  .sah-login-modal-title{
    font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:800;
    color:var(--dark);text-align:center;margin-bottom:8px;
  }
  .sah-login-modal-desc{
    font-size:0.88rem;color:var(--muted);text-align:center;
    line-height:1.6;margin-bottom:22px;
  }
  .sah-login-modal-actions{display:flex;flex-direction:column;gap:9px;}
  .sah-login-modal-primary{
    width:100%;padding:12px 20px;background:var(--accent-solid);color:#fff;
    border:none;border-radius:var(--radius);font-family:'DM Sans',sans-serif;
    font-weight:700;font-size:0.92rem;cursor:pointer;
    transition:background 0.15s;
  }
  .sah-login-modal-primary:hover{filter:saturate(1.08) brightness(0.94);}
  .sah-login-modal-secondary{
    width:100%;padding:11px 20px;background:transparent;color:var(--dark);
    border:1.5px solid var(--border);border-radius:var(--radius);font-family:'DM Sans',sans-serif;
    font-weight:600;font-size:0.88rem;cursor:pointer;
    transition:all 0.15s;
  }
  .sah-login-modal-secondary:hover{border-color:var(--accent);color:var(--accent);}
  .sah-login-modal-divider{
    display:flex;align-items:center;gap:10px;
    font-size:0.75rem;color:var(--grey);margin:4px 0;
  }
  .sah-login-modal-divider::before,.sah-login-modal-divider::after{
    content:'';flex:1;height:1px;background:var(--border);
  }

  /* TOAST */
  .sah-toast{position:fixed;bottom:22px;right:22px;background:var(--grey);color:#fff;padding:11px 18px;border-radius:var(--radius);font-size:0.88rem;font-weight:600;box-shadow:var(--shadow-lg);transform:translateY(60px);opacity:0;transition:all 0.26s;z-index:9999;display:flex;align-items:center;gap:8px;pointer-events:none;}
  .sah-toast.show{transform:translateY(0);opacity:1;}
  .sah-toast i{color:#4ade80;}

  /* RESPONSIVE */
  @media(max-width:1100px){
    .sah-provider-grid{grid-template-columns:repeat(2,1fr);}
    .sah-steps-grid{grid-template-columns:repeat(2,1fr);}
    .sah-step:nth-child(2){border-right:none;}
    .sah-step:nth-child(1),.sah-step:nth-child(2){border-bottom:1px solid var(--border);}
    .sah-hero-plans-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .sah-footer-grid{grid-template-columns:1fr 1fr;gap:20px;}
    .sah-footer-col{padding-top:0;}
  }
  @media(max-width:768px){
    .sah-nav-links{display:none;}
    .sah-brand-logo{width:170px;height:104px;max-width:38vw;}
    .sah-provider-grid{grid-template-columns:repeat(2,1fr);}
    .sah-steps-grid{grid-template-columns:1fr;}
    .sah-step{border-right:none!important;border-bottom:1px solid var(--border);}
    .sah-step:last-child{border-bottom:none;}
    .sah-fpill{font-size:0.95rem;padding:9px 18px;}
    .sah-hero-plans-grid{grid-template-columns:1fr;}
  }
    @media(max-width:768px){
  .sah-hero-search {
    flex-direction: column;
    border-radius: var(--radius);
  }
  .sah-hs-sep { display: none; }
  .sah-hero-search select {
    min-width: unset;
    width: 100%;
    border-top: 1px solid var(--border);
  }
  .sah-hs-btn {
    width: 100%;
    padding: 14px;
  }
  .sah-hero-plans-grid { grid-template-columns: 1fr; }
  .sah-nav-links { display: none; }
}

@media(max-width:480px){
  .sah-hero-h1 { font-size: clamp(1.8rem, 7vw, 2.5rem); }
  .sah-heading-carousel { min-height: 90px; }
  .sah-container { padding: 0 16px; }
  .sah-brand-logo { width:140px;height:92px;max-width:42vw; }
  .sah-provider-grid { grid-template-columns: 1fr; }
  .sah-become-btn { width: 100%; justify-content: center; }
}
  @media(max-width:480px){
    .sah-provider-grid{grid-template-columns:1fr;}
    .sah-container{padding:0 16px;}
    .sah-become-btn{padding:11px 20px;font-size:0.88rem;}
  }
  @media(max-width:640px){
    .sah-footer{padding:24px 0 14px;}
    .sah-footer-grid{grid-template-columns:1fr;gap:18px;}
    .sah-footer-col{padding-top:0;}
    .sah-footer-bottom{flex-direction:column;align-items:flex-start;gap:12px;}
    .sah-footer-bottom-links{flex-wrap:wrap;gap:12px;}
  }

  
`;

/* ─── DATA ──────────────────────────────────────────────────────────────── */
const SEED = [
  {
    id:"s1",name:"STEM Mastery Tutors",category:"education",location:"Johannesburg, Gauteng",
    delivery:"Online & In-person",
    image:"https://images.unsplash.com/photo-1522202176988-66273c2b033f?w=600&auto=format&fit=crop&q=75",
    priceFrom:"R280/hr",badge:"featured",rating:4.9,reviewCount:62,tier:"featured",
    registered:"2025-01-10T08:00:00Z",status:"approved",
    primaryCategory:"Education & Tutoring",city:"Johannesburg",province:"Gauteng",deliveryMode:"Online & In-person",
    bio:"Specialist STEM tutors for Grades 8–12.",tags:["Mathematics","Physical Sciences","Life Sciences","Grades 8–12"],
    ageGroups:["11–13","14–18"],startingPrice:"R280/hr",availabilityDays:["Mon","Tue","Wed","Thu","Fri"],
    phone:"+27 11 000 1111",contactEmail:"info@stemmastery.co.za",certifications:"SACE Registered",listingPlan:"featured",
    reviews:{average:4.9,count:62,items:[{reviewer:"Nomsa P.",rating:5,text:"My son went from 40% to 82% in Maths."}]}
  },
  {
    id:"s2",name:"Creative Minds Learning",category:"education",location:"Cape Town, Western Cape",
    delivery:"Online",
    image:"https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=75",
    priceFrom:"R4 200/term",badge:"verified",rating:5.0,reviewCount:34,tier:"pro",
    registered:"2025-01-12T09:00:00Z",status:"approved",
    primaryCategory:"Learning Resources",city:"Cape Town",province:"Western Cape",deliveryMode:"Online",
    bio:"Award-winning learning resources for growing families.",tags:["CAPS Aligned","Learning Kits","Gr R–12"],
    ageGroups:["5–7","8–10","11–13","14–18"],startingPrice:"R4 200/term",
    phone:"+27 21 000 2222",contactEmail:"hello@creativeminds.co.za",certifications:"Umalusi Accredited",listingPlan:"pro",
    reviews:{average:5.0,count:34,items:[{reviewer:"Riana V.",rating:5,text:"Best investment for our child's learning journey."}]}
  },
  {
    id:"s3",name:"EduTherapy SA",category:"wellness",location:"Durban, KwaZulu-Natal",
    delivery:"Hybrid",
    image:"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=75",
    priceFrom:"R650/session",badge:"featured",rating:4.8,reviewCount:47,tier:"featured",
    registered:"2025-01-14T10:00:00Z",status:"approved",
    primaryCategory:"Child Wellness & Therapy",city:"Durban",province:"KwaZulu-Natal",deliveryMode:"Hybrid",
    bio:"Educational therapists specialising in learning differences.",tags:["OT","ADHD","Dyslexia","Learning Support"],
    ageGroups:["5–7","8–10","11–13"],startingPrice:"R650/session",
    phone:"+27 31 000 3333",contactEmail:"bookings@edutherapy.co.za",certifications:"HPCSA Registered",listingPlan:"featured",
    reviews:{average:4.8,count:47,items:[{reviewer:"Lerato M.",rating:5,text:"Transformed our daughter's confidence."}]}
  },
  {
    id:"s4",name:"Future Leaders Academy",category:"activities",location:"Online — National",
    delivery:"Online",
    image:"https://images.unsplash.com/photo-1529390079861-591de3547d13?w=600&auto=format&fit=crop&q=75",
    priceFrom:"Custom quote",badge:"new",rating:4.7,reviewCount:18,tier:"pro",
    registered:"2025-01-16T11:00:00Z",status:"approved",
    primaryCategory:"Activities & Enrichment",city:"Online",province:"Gauteng",deliveryMode:"Online",
    bio:"Structured online clubs and enrichment programmes for children.",tags:["Online Clubs","Live Classes","National","Accredited"],
    ageGroups:["8–10","11–13","14–18"],startingPrice:"Contact for quote",
    phone:"+27 10 000 4444",contactEmail:"enrol@futureleaders.co.za",certifications:"Umalusi Registered",listingPlan:"pro",
    reviews:{average:4.7,count:18,items:[{reviewer:"Sipho K.",rating:5,text:"Our kids thrive in the structure."}]}
  },
  {
    id:"khan",name:"Khan Academy SA",category:"education",location:"Johannesburg, Gauteng",
    delivery:"Online",
    image:"https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&auto=format&fit=crop&q=75",
    priceFrom:"Free",badge:"featured",rating:4.9,reviewCount:156,tier:"featured",
    registered:"2025-01-01T00:00:00Z",status:"approved",
    primaryCategory:"Learning Resources",city:"Johannesburg",province:"Gauteng",deliveryMode:"Online",
    bio:"Free world-class education for anyone.",tags:["Mathematics","Science","Online Learning","Free"],
    ageGroups:["5–7","8–10","11–13","14–18"],startingPrice:"Free",
    phone:"+27 11 555 1234",contactEmail:"support@khanacademy.org.za",email:"contact@khanacademy.org.za",
    certifications:"Khan Academy Certified",listingPlan:"featured",
    reviews:{average:4.9,count:156,items:[{reviewer:"Sarah J.",rating:5,text:"Excellent resource for our family."}]}
  },
];

const CAT_ICON = {
  education:"fa-book-open", wellness:"fa-heart-pulse", activities:"fa-palette",
  healthcare:"fa-briefcase-medical", shopping:"fa-bag-shopping", family:"fa-people-roof",
  tutor:"fa-chalkboard-teacher", therapist:"fa-heart", curriculum:"fa-book-open",
  school:"fa-school", consultant:"fa-user-tie", extracurricular:"fa-palette"
};
const TIER_LBL = { featured:"Parental Plus+", pro:"Parental Plus+", free:"Free Listing" };

const PLANS = [
  {
    id:"community", name:"Community Member", desc:"Basic visibility for parent-focused providers", price:"R0", highlight:false,
    features:[
      {text:"Basic profile listing",yes:true},
      {text:"Appears in search results",yes:true},
      {text:"Contact via Parental's form",yes:true},
      {text:"No pricing or website links",yes:false},
      {text:"Direct contact details",yes:false},
    ],
    cta:"Get Started for Free", planParam:"Free Listing - basic profile"
  },
  {
    id:"trusted", name:"Parental Plus+", desc:"Discounted to R149/month for the first 12 months", price:"R149", highlight:true,
    features:[
      {text:"Full provider profile",yes:true},
      {text:"Direct phone, email, WhatsApp & website",yes:true},
      {text:"Pricing, availability and reviews",yes:true},
      {text:"Priority placement in results",yes:true},
      {text:"Up to 3 services listed",yes:true},
      {text:"Monthly newsletter inclusion",yes:true},
      {text:"1 Facebook & Instagram post",yes:true},
      {text:"1 native article: 800 words + image",yes:true},
    ],
    cta:"Start Parental Plus+", planParam:"Parental Plus+ – R149/month introductory offer"
  },
];

/* ─── GET ALL PROVIDERS ──────────────────────────────────────────────────── */
function resolveProviderPhoto(p) {
  const direct = p.profilePhoto || p.photo || p.image || null;
  if (direct) return direct;

  try {
    const key = p.userId || p.id;
    return key ? localStorage.getItem(`sah_photo_${key}`) : null;
  } catch {
    return null;
  }
}

function getAll() {
  try {
    const stored = JSON.parse(localStorage.getItem("sah_providers") || "[]");
    const allRaw = [...stored.map(normalizeProvider), ...SEED.map(normalizeProvider)].filter(p => (p.status || "approved") === "approved");
    const seen = new Set();
    const all = allRaw.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
    const marked = all.map(p => ({ ...p, _inFeaturedSlot: false }));
    return marked.sort((a, b) => {
      if (a._inFeaturedSlot && !b._inFeaturedSlot) return -1;
      if (!a._inFeaturedSlot && b._inFeaturedSlot)  return 1;
      const tierOrder = { featured:0, pro:1, free:2 };
      const td = (tierOrder[a.tier] ?? 2) - (tierOrder[b.tier] ?? 2);
      if (td !== 0) return td;
      return new Date(b.registered) - new Date(a.registered);
    });
  } catch { return SEED; }
}

function normalizeProvider(p) {
  const tier = p.tier || p.plan || p.listingPlan || "free";
  const photo = resolveProviderPhoto(p);
  return {
    ...p,
    id: p.userId || p.id,
    userId: p.userId || p.id,
    name: p.name || p.fullName || "",
    email: p.email || p.user?.email || p.inquiryEmail || "",
    contactEmail: p.contactEmail || p.inquiryEmail || p.user?.email || "",
    status: String(p.status || "pending").toLowerCase(),
    tier,
    plan: tier,
    listingPlan: tier,
    category: p.category || p.primaryCategory || "provider",
    primaryCategory: p.primaryCategory || p.category || "",
    location: p.location || [p.city, p.province].filter(Boolean).join(", "),
    delivery: p.delivery || p.deliveryMode || "",
    image: photo,
    photo,
    profilePhoto: photo,
    priceFrom: p.priceFrom || p.startingPrice || "Contact",
    tags: p.tags || (p.subjects ? String(p.subjects).split(",").map(s => s.trim()).filter(Boolean) : []),
    registered: p.registered || p.createdAt || "",
    badge: p.badge || (tier === "featured" ? "featured" : tier === "pro" ? "verified" : null),
  };
}

// ── Validate that a stored session is legitimate ───────────────────────────
// Accepts sessions set by either Registration/Login page (sah_token) or
// the AuthContext login (sah_user) so the user stays logged in on the
// homepage regardless of which login path was used.
function getValidSession() {
  try {
    const token = localStorage.getItem('sah_token');
    const raw   = localStorage.getItem('sah_current_user') || localStorage.getItem('sah_user');
    if (!raw) return null;

    const user = JSON.parse(raw);
    if (!user || !user.id) return null;

    // Admin users must have a matching token
    if (user.role === 'admin') {
      if (!token || token !== `admin_${user.id}`) {
        localStorage.removeItem('sah_current_user');
        localStorage.removeItem('sah_token');
        localStorage.removeItem('sah_user');
        return null;
      }
    }

    return user;
  } catch {
    return null;
  }
}

function starsStr(r) { return "★".repeat(Math.floor(r)) + (r % 1 >= 0.5 ? "½" : ""); }

/* ─── SUB-COMPONENTS ─────────────────────────────────────────────────────── */

function Badge({ badge }) {
  if (!badge) return null;
  if (badge === "featured") return <span className="sah-cbadge sah-cbadge-featured">Featured</span>;
  if (badge === "new")      return <span className="sah-cbadge sah-cbadge-new">New</span>;
  if (badge === "verified") return <span className="sah-cbadge sah-cbadge-verified">Verified</span>;
  return null;
}

function ProviderCard({ p, onView }) {
  const [imgErr, setImgErr] = useState(false);
  const ic = CAT_ICON[p.category] || "fa-star";
  const isPaid = p.tier === "pro" || p.tier === "featured";
  const rawDescription = p.bio || p.description || "";
  const shortDescription = rawDescription.split(/\s+/).filter(Boolean).slice(0, 24).join(" ");
  return (
    <article className={`sah-provider-card${p._inFeaturedSlot ? " is-featured-slot" : ""}`} data-cat={p.category} onClick={() => onView(p.id)} style={{ cursor: 'pointer' }}>
      <div className="sah-card-thumb">
        {p.image && !imgErr
          ? <img src={p.image} alt={p.name} loading="lazy" onError={() => setImgErr(true)} />
          : <div className="sah-card-thumb-fallback"><i className={`fas ${ic}`} /></div>
        }
        <div className="sah-card-badges">
          <Badge badge={p.badge} />
        </div>
        <button className="sah-card-save" onClick={e => e.stopPropagation()}><i className="far fa-heart" /></button>
      </div>
      <div className="sah-card-provider-row">
        <div className="sah-pav"><i className={`fas ${ic}`} /></div>
        <div>
          <div className="sah-pav-name">{p.name}</div>
          <div className="sah-pav-tier">{TIER_LBL[p.tier] || "Free Listing"}</div>
        </div>
      </div>
      <div className="sah-card-body">
        <div className="sah-card-title">{p.name}</div>
        <div className="sah-card-meta">
          <span><i className="fas fa-map-marker-alt" />{p.location}</span>
          <span><i className="fas fa-laptop" />{p.delivery}</span>
        </div>
        {!isPaid && shortDescription && (
          <p style={{ fontSize:"0.78rem", color:"var(--muted)", lineHeight:1.5, marginBottom:10 }}>
            {shortDescription}{shortDescription.length < rawDescription.length ? "..." : ""}
          </p>
        )}
        {isPaid && p.rating && (
          <div className="sah-card-rating">
            <span className="sah-stars">{starsStr(p.rating)}</span>
            <span className="sah-rnum">{p.rating.toFixed(1)}</span>
            <span className="sah-rcnt">({p.reviewCount})</span>
          </div>
        )}
        <div className="sah-card-foot">
          <div>
            <div className="sah-from-label">{isPaid ? "Starting from" : "Contact"}</div>
            <div className="sah-card-price">{isPaid ? (p.priceFrom || "Contact") : "Via Parental's"}</div>
          </div>
          <button className="sah-card-cta" onClick={() => onView(p.id)}>View Profile</button>
        </div>
      </div>
    </article>
  );
}

function PlanCard({ plan, openId, onToggle, allOpen, onCtaClick }) {
  const isOpen = true;
  return (
    <div className={`sah-plan-item${plan.highlight ? " highlight" : ""}`}>
      <div className="sah-plan-header">
        <div className="sah-plan-info">
          <div className="sah-plan-name">{plan.name}</div>
          <div className="sah-plan-desc">{plan.desc}</div>
        </div>
        <div className="sah-plan-right">
          <div className="sah-plan-price">{plan.price}<small>/ month</small></div>
          <i className={`fas fa-chevron-down sah-plan-chevron${isOpen ? " open" : ""}`} />
        </div>
      </div>
      <div className={`sah-plan-details${isOpen ? " open" : ""}`}>
        <div className="sah-plan-details-inner">
          <div className="sah-plan-details-content">
            <ul className="sah-plan-features">
              {plan.features.map((f, i) => (
                <li key={i} className={f.yes ? "" : "no"}>
                  {f.yes
                    ? <i className="fas fa-check sah-ico-yes" />
                    : <i className="fas fa-times sah-ico-no" />
                  }
                  {f.text}
                </li>
              ))}
            </ul>
            <button
              className="sah-plan-cta-link"
              onClick={e => { e.stopPropagation(); onCtaClick(plan.planParam); }}
            >
              {plan.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginRequiredModal({ open, onClose, onLogin, onRegister, message }) {
  return (
    <div
      className={`sah-modal-overlay${open ? " open" : ""}`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sah-modal-box">
        <div className="sah-modal-head" style={{ background:"#6f8da6" }}>
          <h2>Login Required</h2>
          <p>You need an account to continue</p>
          <button className="sah-modal-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="sah-modal-body">
          <div style={{ paddingTop:"8px" }}>
            <div className="sah-login-modal-icon">
              <i className="fas fa-lock" />
            </div>
            <div className="sah-login-modal-title">
              {message || "Please log in to continue"}
            </div>
            <div className="sah-login-modal-desc">
              Sign in to your existing account, or create a free account to get started.
            </div>
            <div className="sah-login-modal-actions">
              <button className="sah-login-modal-primary" onClick={onLogin}>
                <i className="fas fa-right-to-bracket" style={{ marginRight:"8px" }} />
                Log In to My Account
              </button>
              <div className="sah-login-modal-divider">or</div>
              <button className="sah-login-modal-secondary" onClick={onRegister}>
                <i className="fas fa-user-plus" style={{ marginRight:"8px" }} />
                Create a Free Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HERO_HEADLINES = [
  'Find Parenting Services',
  'Parenting Starts Here',
  'Raising Families Together',
  'Support Every Step',
  'Helping Parents Thrive',
  'Discover Trusted Care',
  'Your Parenting Partner',
  'Everything Families Need',
  'Find Help. Build Confidence.',
  'Parenting Made Simpler',
];

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm]     = useState("");
  const [searchCat, setSearchCat]       = useState("");
  const [activeCat, setActiveCat]       = useState("all");
  const [providers, setProviders]       = useState([]);
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [openPlanId, setOpenPlanId]     = useState(null);
  const [allPlansOpen, setAllPlansOpen] = useState(false);
  const [plansVisible, setPlansVisible] = useState(false);
  const [regModal, setRegModal]         = useState(false);
  const [nlEmail, setNlEmail]           = useState("");
  const [nlMsg, setNlMsg]               = useState({ text:"", type:"" });
  const [toast, setToast]               = useState({ show:false, msg:"", err:false });
  const [currentUser, setCurrentUser]   = useState(() => getValidSession()); // restore session immediately on first render
  const [loginModal, setLoginModal]     = useState({ open:false, message:"" });
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [headingIndex, setHeadingIndex] = useState(0);
  const [headingPaused, setHeadingPaused] = useState(false);

  useEffect(() => {
    injectHead();
    if (!document.getElementById("sah-styles")) {
      const s = document.createElement("style");
      s.id = "sah-styles"; s.textContent = CSS;
      document.head.appendChild(s);
    }

    // ── Only restore a session if a valid token + user exist ──────────────
    const checkUser = () => {
      const user = getValidSession();
      setCurrentUser(user); // null if no valid session
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { setRegModal(false); setLoginModal(m => ({ ...m, open:false })); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (currentUser || sessionStorage.getItem('sah_signup_prompt_dismissed') === '1') return undefined;
    const timer = window.setTimeout(() => setShowSignupPrompt(true), 3 * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [currentUser]);

  useEffect(() => {
    if (headingPaused) return undefined;
    const timer = window.setInterval(
      () => setHeadingIndex(index => (index + 1) % HERO_HEADLINES.length),
      4000
    );
    return () => window.clearInterval(timer);
  }, [headingPaused]);

  const dismissSignupPrompt = () => {
    sessionStorage.setItem('sah_signup_prompt_dismissed', '1');
    setShowSignupPrompt(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadProviders = async () => {
      const localProviders = getAll();
      setProviders(localProviders);

      try {
        const rows = await api.getProviders();
        const localById = new Map(localProviders.map(p => [p.userId || p.id, p]));
        const live = (Array.isArray(rows) ? rows : rows?.data || [])
          .map(row => {
            const id = row.userId || row.id;
            const local = localById.get(id);
            return normalizeProvider({
              ...local,
              ...row,
              profilePhoto: row.profilePhoto || row.photo || row.image || local?.profilePhoto || local?.photo || local?.image || null,
              photo: row.photo || row.profilePhoto || row.image || local?.photo || local?.profilePhoto || local?.image || null,
              image: row.image || row.profilePhoto || row.photo || local?.image || local?.profilePhoto || local?.photo || null,
            });
          })
          .filter(p => p.status === "approved");

        if (!cancelled && live.length) {
          localStorage.setItem("sah_providers", JSON.stringify(live));
          setProviders(getAll());
        }
      } catch (error) {
        console.warn("Provider API load failed, using local data:", error.message);
      }
    };

    loadProviders();
    return () => { cancelled = true; };
  }, []);

  const showToast = useCallback((msg, err = false) => {
    setToast({ show:true, msg, err });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 3500);
  }, []);

  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    let list = getAll();
    if (searchCat) list = list.filter(p => p.category === searchCat);
    if (term) list = list.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.location || "").toLowerCase().includes(term) ||
      (p.tags || []).some(t => t.toLowerCase().includes(term))
    );
    setProviders(list);
    setShowAllProviders(false);
    document.getElementById("sah-providers")?.scrollIntoView({ behavior:"smooth" });
  };

  const filterCat = (cat) => {
    setActiveCat(cat);
    setShowAllProviders(false);
    let list = getAll();
    if (cat !== "all") list = list.filter(p => p.category === cat);
    setProviders(list);
  };

  const togglePlan = (id) => {
    setAllPlansOpen(false);
    setOpenPlanId(prev => prev === id ? null : id);
  };

  const handleBecomeProvider = (e) => {
    if (e) e.preventDefault();
    const next = !plansVisible;
    setPlansVisible(next);
    if (next) {
      setAllPlansOpen(true);
      setTimeout(() => {
        document.getElementById("sah-plans-anchor")?.scrollIntoView({ behavior:"smooth", block:"center" });
      }, 80);
    }
  };

  const handlePlanCtaClick = (planParam) => {
    navigate(`/register/provider?step=1&plan=${encodeURIComponent(planParam)}`);
  };

  const viewProfile = (id) => {
    if (!currentUser) {
      setLoginModal({
        open: true,
        message: "Please log in to view provider profiles.",
      });
      return;
    }
    navigate("/profile?id=" + id);
  };

  const handleLoginModalLogin = () => {
    setLoginModal(m => ({ ...m, open:false }));
    navigate('/login');
  };

  const handleLoginModalRegister = () => {
    setLoginModal(m => ({ ...m, open:false }));
    setRegModal(true);
  };

  const handleNewsletter = () => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nlEmail.trim());
    if (!nlEmail.trim() || !valid) {
      setNlMsg({ text:"Please enter a valid email address.", type:"error" });
      return;
    }
    setNlMsg({ text:"You're subscribed — thank you!", type:"success" });
    setNlEmail("");
  };

  const handleLogout = () => {
    localStorage.removeItem('sah_current_user');
    localStorage.removeItem('sah_token');
    localStorage.removeItem('sah_user');
    setCurrentUser(null);
    showToast("Logged out successfully");
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!currentUser) return '/login';
    const role = String(currentUser.role || '').toLowerCase();
    const accountType = String(currentUser.accountType || '').toLowerCase();
    const isProvider = ['provider', 'client', 'provideraccount'].includes(role) || accountType.includes('provider');
    return role === 'admin' ? '/admin-dashboard' : (isProvider ? '/provider-dashboard' : '/client-dashboard');
  };

  const FILTER_PILLS = [
    { cat:"all",        label:"All Services" },
    { cat:"education",  label:"Education",   icon:"fa-book-open" },
    { cat:"wellness",   label:"Wellness",    icon:"fa-heart-pulse" },
    { cat:"activities", label:"Activities",  icon:"fa-palette" },
    { cat:"healthcare", label:"Healthcare",  icon:"fa-briefcase-medical" },
    { cat:"shopping",   label:"Shops",       icon:"fa-bag-shopping" },
    { cat:"family",     label:"Family Life", icon:"fa-people-roof" },
  ];

  const displayedProviders = showAllProviders ? providers : providers.slice(0, 4);

  return (
    <div className="sah-wrap">

      {/* HEADER */}
      <header className="sah-header">
        <div className="sah-container sah-nav-inner">
          <Link to="/" className="sah-brand">
            <img className="sah-brand-logo" src="/parentals-logo-header.png" alt="Parentals" />
          </Link>
          <nav className="sah-nav-links">
            <a href="#sah-providers">Find Services</a>
            <a href="#sah-how">How It Works</a>
            <a href="#sah-plans-anchor" onClick={handleBecomeProvider}>List Your Business</a>
            <a href="https://sahomeschooling.com" target="_blank" rel="noreferrer">
              Magazine <i className="fas fa-arrow-up-right-from-square" style={{ fontSize:"0.65rem" }} />
            </a>
          </nav>
          <div className="sah-nav-ctas">
            {currentUser ? (
              <>
                <Link to={getDashboardPath()} className="sah-user-profile-btn">
                  <i className="fas fa-user-circle" />
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.name
                      ? currentUser.name.split(' ')[0]
                      : (currentUser.email ? currentUser.email.split('@')[0] : 'My Account')}
                  </span>
                </Link>
                <button onClick={handleLogout} className="sah-logout-btn">
                  <i className="fas fa-right-from-bracket" /> Log Out
                </button>
              </>
            ) : (
              <>
                <button className="sah-btn-ghost-nav" onClick={() => navigate('/login')}>Log In</button>
                <button className="sah-btn-solid-nav" onClick={() => setRegModal(true)}>Register</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="sah-hero">
        <div className="sah-hero-bg" />
        <div className="sah-container">
          <div className="sah-hero-inner">
            <div className="sah-hero-top">
              <div
                className="sah-heading-carousel"
                onMouseEnter={() => setHeadingPaused(true)}
                onMouseLeave={() => setHeadingPaused(false)}
                aria-live="polite"
              >
                <h1 className="sah-hero-h1" key={headingIndex}>
                  {HERO_HEADLINES[headingIndex]}
                </h1>
              </div>

              <div className="sah-hero-services" aria-label="Browse services">
                <div className="sah-hero-services-list">
                  {FILTER_PILLS.map(pill => (
                    <button key={pill.cat} className={`${pill.icon ? `sah-cat-${pill.cat}` : ''}${activeCat === pill.cat ? ' active' : ''}`}
                      onClick={() => {
                        filterCat(pill.cat);
                        document.getElementById('sah-providers')?.scrollIntoView({ behavior:'smooth' });
                      }}>
                      {pill.icon && <i className={`fas ${pill.icon}`} />} {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEARCH BAR */}
              <div className="sah-hero-search">
                <div className="sah-hs-icon"><i className="fas fa-search" /></div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Search products, services, providers or locations..."
                />
                <div className="sah-hs-sep" />
                <select value={searchCat} onChange={e => setSearchCat(e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="education">Education</option>
                  <option value="wellness">Wellness</option>
                  <option value="activities">Activities</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="shopping">Shops</option>
                  <option value="family">Family Life</option>
                </select>
                <button className="sah-hs-btn" onClick={handleSearch}>Search</button>
              </div>

              {/* HERO ACTIONS */}
              <div className="sah-hero-tagline">
                <div className="sah-hero-actions">
                  <button className="sah-become-btn" onClick={handleSearch}>
                    <i className="fas fa-magnifying-glass" /> Find a Service
                  </button>
                  <button className="sah-hero-secondary-cta" onClick={() => navigate('/register/provider')}>
                    <i className="fas fa-store" /> List Your Business
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="sah-plans-section" id="sah-plans-anchor">
        <div className="sah-container">
          <div className="sah-plans-heading">
            <h2>List your services on Parentals</h2>
            <p>Choose the listing that fits your business. You can change plans later.</p>
          </div>
          <div className="sah-hero-plans-grid">
            {PLANS.map(plan => (
              <PlanCard key={plan.id} plan={plan} openId={openPlanId} onToggle={togglePlan}
                allOpen={allPlansOpen} onCtaClick={handlePlanCtaClick} />
            ))}
          </div>
        </div>
      </section>

      {/* PROVIDERS */}
      <section className="sah-providers-section" id="sah-providers">
        <div className="sah-container">
          <div className="sah-sec-header">
            <div>
              <span className="sah-sec-eyebrow">Parent-Focused Listings</span>
              <h2>Recently Added</h2>
            </div>
            <div className="sah-sec-right">
              {providers.length > 4 && !showAllProviders && (
                <button className="sah-link-btn" onClick={() => setShowAllProviders(true)}>
                  Show all {providers.length} listings →
                </button>
              )}
              {showAllProviders && providers.length > 4 && (
                <button className="sah-link-btn" onClick={() => setShowAllProviders(false)}>
                  ← Show fewer
                </button>
              )}
            </div>
          </div>
          <div className="sah-provider-grid">
            {providers.length === 0 ? (
              <div className="sah-grid-empty">
                <i className="fas fa-search" />
                <h3>No listings found</h3>
                <p>Be the first to list — it's free.</p>
                <Link
                  to="/register/provider"
                  className="sah-become-btn"
                  style={{ fontSize:"0.88rem", marginTop:"12px", textDecoration:"none" }}
                >
                  <i className="fas fa-plus" /> Add Your Listing
                </Link>
              </div>
            ) : (
              displayedProviders.map(p => <ProviderCard key={p.id} p={p} onView={viewProfile} />)
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sah-how-section" id="sah-how">
        <div className="sah-container">
          <div className="sah-how-header">
            <span className="sah-sec-eyebrow">How It Works</span>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.5rem,3vw,2rem)", fontWeight:800, color:"var(--dark)" }}>
              Get Listed in Four Simple Steps
            </h2>
          </div>
          <div className="sah-steps-grid">
            {[
              { n:"01", t:"Create Your Listing",  d:"Add your logo, description, services, location, contact preferences and social media links." },
              { n:"02", t:"Get Reviewed",         d:"Our team checks each listing with parents in mind, keeping the directory relevant and trustworthy." },
              { n:"03", t:"Appear in Search",     d:"Parents searching for products, services or support can discover and contact you directly." },
              { n:"04", t:"Grow With Plus+",      d:"Upgrade for visible contact details, newsletter exposure, social promotion and a native article." },
            ].map(s => (
              <div key={s.n} className="sah-step">
                <span className="sah-step-num">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="sah-footer">
        <div className="sah-container">
          <div className="sah-footer-grid">
            <div className="sah-footer-brand">
              <Link to="/" className="sah-footer-brand-mark" aria-label="Parentals home">
                <img src="/parentals-footer-logo.png" alt="Parentals" />
              </Link>
              <span className="sah-footer-logo">Parental's</span>
              <p>A parent-first directory helping families discover trusted services, products and professionals for every stage of childhood.</p>
              <div className="sah-footer-newsletter">
                <div className="sah-footer-newsletter-row">
                  <input
                    type="email"
                    value={nlEmail}
                    onChange={e => setNlEmail(e.target.value)}
                    placeholder="Your email address…"
                  />
                  <button type="button" onClick={handleNewsletter}>Subscribe</button>
                </div>
                {nlMsg.text && <div className={`sah-nl-feedback ${nlMsg.type}`}>{nlMsg.text}</div>}
              </div>
            </div>
            <div className="sah-footer-col"><h4>For Families</h4><ul>
              <li><a href="#sah-providers">Education</a></li>
              <li><a href="#sah-providers">Wellness</a></li>
              <li><a href="#sah-providers">Activities</a></li>
              <li><a href="#sah-providers">Family Shops</a></li>
            </ul></div>
            <div className="sah-footer-col"><h4>For Providers</h4><ul>
              <li><a href="#sah-plans-anchor" onClick={handleBecomeProvider}>Create a Listing</a></li>
              <li><a href="#sah-plans-anchor" onClick={handleBecomeProvider}>Parental Plus+</a></li>
              <li><Link to="/login">Provider Login</Link></li>
              <li><a href="#sah-how">Verification Process</a></li>
            </ul></div>
            <div className="sah-footer-col"><h4>Parental's</h4><ul>
              <li><a href="https://sahomeschooling.com" target="_blank" rel="noreferrer">Magazine</a></li>
              <li><Link to="/about">About Parental's</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><a href="https://sahomeschooling.com/privacy-policy-for-sa-homeschooling-beyond/" target="_blank" rel="noreferrer">Privacy Policy</a></li>
            </ul></div>
          </div>
          <div className="sah-footer-trust">
            {[
              ["fa-shield-alt","Listings reviewed with parents in mind"],
              ["fa-lock","Secure & private enquiries"],
              ["fa-star","Curated, relevant results"],
            ].map(([ic, txt]) => (
              <div key={txt} className="sah-footer-trust-item">
                <i className={`fas ${ic}`} /> {txt}
              </div>
            ))}
            <div className="sah-footer-trust-item" style={{ marginLeft:"auto" }}>
              <i className="fas fa-map-marker-alt" />
              <span>
                <strong style={{ color:"rgba(255,255,255,0.65)" }}>OUR OFFICE:</strong>{" "}
                Tshimologong Digital Precinct, 41 Juta Street, Braamfontein, Johannesburg, South Africa
              </span>
            </div>
          </div>
          <div className="sah-footer-bottom">
            <p>&copy; 2025 Parental's. All rights reserved.</p>
            <div className="sah-footer-bottom-links">
              <a href="https://sahomeschooling.com/privacy-policy-for-sa-homeschooling-beyond/" target="_blank" rel="noreferrer">Privacy</a>
              {["Terms","Cookies","Sitemap"].map(l => <Link key={l} to={`/${l.toLowerCase()}`}>{l}</Link>)}
            </div>
            <div className="sah-footer-socials">
              {[
                ["fab fa-facebook-f",  "https://www.facebook.com/SAHomeschoolingMagazine"],
                ["fab fa-instagram",   "https://www.instagram.com/sahomeschoolingmag"],
                ["fab fa-linkedin-in", "https://www.linkedin.com"],
                ["fab fa-x-twitter",  "https://x.com/SAH_andBeyond"],
              ].map(([ic, href]) => (
                <a key={ic} href={href} className="sah-footer-soc" target="_blank" rel="noreferrer">
                  <i className={ic} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* REGISTER CHOOSER MODAL */}
      <div
        className={`sah-modal-overlay${regModal ? " open" : ""}`}
        onClick={e => { if (e.target === e.currentTarget) setRegModal(false); }}
      >
        <div className="sah-modal-box">
          <div className="sah-modal-head">
            <h2>Create an Account</h2>
            <p>Choose how you'd like to join</p>
            <button className="sah-modal-close" onClick={() => setRegModal(false)}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div className="sah-modal-body">
            <div className="sah-reg-options">
              <Link to="/register/user" className="sah-reg-opt" onClick={() => setRegModal(false)}>
                <div className="sah-reg-opt-icon user"><i className="fas fa-user" /></div>
                <div>
                  <div className="sah-reg-opt-title">I'm a User / Customer</div>
                  <div className="sah-reg-opt-desc">Browse, search and save parent-focused listings</div>
                </div>
                <i className="fas fa-chevron-right" style={{ marginLeft:"auto", color:"#ccc", fontSize:"0.8rem" }} />
              </Link>
              <Link to="/register/provider" className="sah-reg-opt" onClick={() => setRegModal(false)}>
                <div className="sah-reg-opt-icon provider"><i className="fas fa-store" /></div>
                <div>
                  <div className="sah-reg-opt-title">I'm a Business or Provider</div>
                  <div className="sah-reg-opt-desc">Create a listing for your product, service or professional support</div>
                </div>
                <i className="fas fa-chevron-right" style={{ marginLeft:"auto", color:"#ccc", fontSize:"0.8rem" }} />
              </Link>
            </div>
            <div className="sah-modal-switch">
              Already have an account?{" "}
              <a href="#login" onClick={e => { e.preventDefault(); setRegModal(false); navigate('/login'); }}>
                Log in
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* LOGIN REQUIRED MODAL */}
      <LoginRequiredModal
        open={loginModal.open}
        message={loginModal.message}
        onClose={() => setLoginModal(m => ({ ...m, open:false }))}
        onLogin={handleLoginModalLogin}
        onRegister={handleLoginModalRegister}
      />

      {showSignupPrompt && !currentUser && (
        <div className="sah-signup-prompt" role="dialog" aria-modal="true" aria-labelledby="signup-prompt-title">
          <div className="sah-signup-prompt-card">
            <button className="sah-signup-prompt-close" aria-label="Dismiss sign-up prompt" onClick={dismissSignupPrompt}>
              <i className="fas fa-times" />
            </button>
            <h2 id="signup-prompt-title">Make Parentals yours</h2>
            <p>Create a free account to explore trusted parenting services and connect with providers.</p>
            <div className="sah-signup-prompt-actions">
              <button className="sah-signup-prompt-primary" onClick={() => { dismissSignupPrompt(); setRegModal(true); }}>
                Create Free Account
              </button>
              <button className="sah-signup-prompt-secondary" onClick={() => { dismissSignupPrompt(); navigate('/login'); }}>
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div
        className={`sah-toast${toast.show ? " show" : ""}`}
        style={{ background: toast.err ? "#b91c1c" : "var(--grey)" }}
      >
        <i className="fas fa-check-circle" />
        <span>{toast.msg}</span>
      </div>

    </div>
  );
}
