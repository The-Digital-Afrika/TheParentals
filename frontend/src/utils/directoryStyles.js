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
  .sah-footer .sah-logout-btn { margin-left:auto; padding:8px 14px; border:1px solid rgba(255,255,255,.5); border-radius:7px; }

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
  .sah-signup-prompt{position:fixed;inset:0;z-index:2200;background:rgba(24,35,48,.48);display:flex;align-items:flex-start;justify-content:center;padding:118px 24px 24px;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);}
  .sah-signup-prompt-card{position:relative;isolation:isolate;width:min(540px,100%);overflow:hidden;background:linear-gradient(145deg,#fff 58%,#fff5ed 100%);border-radius:20px;padding:34px 36px 30px;box-shadow:0 24px 70px rgba(24,35,48,.28),0 8px 0 rgba(111,141,166,.2);border:1px solid rgba(111,141,166,.3);animation:sahPromptDrop .38s cubic-bezier(.2,.8,.2,1);}
  .sah-signup-prompt-card::before{content:'';position:absolute;z-index:-1;inset:0 0 auto;height:8px;background:linear-gradient(90deg,#6f8da6 0 38%,#ff8c42 38% 72%,#e62925 72%);}
  .sah-signup-prompt-card::after{content:'';position:absolute;z-index:-1;width:150px;height:150px;border-radius:50%;right:-72px;bottom:-82px;background:radial-gradient(circle,#ff8c42 0 24%,#e62925 25% 43%,#6f8da6 44% 63%,transparent 64%);opacity:.12;}
  .sah-signup-prompt-card h2{font-size:1.55rem;color:#333330;margin-bottom:8px;padding-right:36px;}
  .sah-signup-prompt-card h2::before{content:'✦';display:inline-grid;place-items:center;width:34px;height:34px;margin-right:10px;border-radius:10px;background:#6f8da6;color:#fff;font-size:1rem;vertical-align:2px;box-shadow:4px 4px 0 #ff8c42;}
  .sah-signup-prompt-card p{color:#6a655d;font-size:.94rem;margin-bottom:18px;padding-left:46px;}
  .sah-signup-prompt-close{position:absolute;right:14px;top:16px;width:36px;height:36px;border:1px solid rgba(111,141,166,.2);border-radius:50%;background:#eef5fa;color:#557691;transition:transform .15s,background .15s,color .15s;}
  .sah-signup-prompt-close:hover{transform:rotate(8deg) scale(1.05);background:#e62925;color:#fff;}
  .sah-signup-prompt-actions{display:flex;gap:10px;flex-wrap:wrap;}
  .sah-signup-prompt-actions button{flex:1;min-width:140px;padding:11px 16px;border-radius:7px;font-weight:700;}
  .sah-signup-prompt-primary{border:0;background:linear-gradient(135deg,#ff8c42,#ef6c27);color:#fff;box-shadow:0 7px 18px rgba(255,140,66,.27);}
  .sah-signup-prompt-primary:hover{background:linear-gradient(135deg,#ef6c27,#e62925);transform:translateY(-1px);}
  .sah-signup-prompt-secondary{border:1px solid #6f8da6;background:#fff;color:#557691;}
  .sah-signup-prompt-secondary:hover{background:#6f8da6;color:#fff;transform:translateY(-1px);}
  @keyframes sahPromptDrop{from{opacity:0;transform:translateY(-24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  @media(max-width:600px){.sah-signup-prompt{padding:92px 14px 20px}.sah-signup-prompt-card{padding:30px 22px 24px;border-radius:16px}.sah-signup-prompt-card p{padding-left:0}.sah-signup-prompt-card h2{font-size:1.32rem}.sah-signup-prompt-actions{flex-direction:column}.sah-signup-prompt-actions button{width:100%}}
  .sah-social-auth{width:100%;display:flex;flex-direction:column;gap:10px;margin:16px 0 4px;}
  .sah-google-auth{width:100%;min-height:40px;display:flex;justify-content:center;}
  .sah-google-auth>div{width:100%!important;}
  .sah-facebook-auth{width:100%;min-height:42px;border:1px solid #ccd0d5;border-radius:5px;background:#fff;color:#1c1e21;font-size:.9rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;}
  .sah-facebook-auth i{color:#1877f2;font-size:1.2rem;}
  .sah-facebook-auth:disabled{opacity:.65;cursor:wait;}
  .sah-social-divider{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.78rem;margin:2px 0;}
  .sah-social-divider span{height:1px;background:#e3e4e7;flex:1;}

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

  /* PLUS+ PUBLISHED CONTENT */
  .sah-promo-section{padding:70px 0;background:#f6f2ec;border-top:1px solid var(--border);}
  .sah-promo-header{max-width:680px;margin-bottom:28px;}
  .sah-promo-header h2{font-family:'Playfair Display',serif;font-size:clamp(1.5rem,3vw,2rem);color:var(--dark);margin:4px 0 0;}
  .sah-promo-header p{max-width:590px;color:var(--muted);font-family:'DM Sans','Segoe UI',sans-serif;font-size:.9rem;line-height:1.65;margin:9px 0 0;}
  .sah-promo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;}
  .sah-promo-card{position:relative;display:flex;flex-direction:column;overflow:hidden;padding:27px 20px 20px;border:1px solid rgba(111,141,166,.22);border-radius:14px;background:linear-gradient(145deg,#fff 0%,#fff 72%,#f7fbfe 100%);box-shadow:0 8px 24px rgba(42,58,72,.09);cursor:pointer;text-align:left;font-family:inherit;transition:transform .18s,box-shadow .18s,border-color .18s;}
  .sah-promo-card::before,.sah-promo-modal::before{content:'';position:absolute;top:0;left:0;right:0;height:7px;background:linear-gradient(90deg,#6f8da6 0 38%,#ff8c42 38% 72%,#e62925 72% 100%);}
  .sah-promo-card::after{content:'';position:absolute;right:-34px;bottom:-42px;width:110px;height:110px;border-radius:50%;background:rgba(111,141,166,.07);pointer-events:none;}
  .sah-promo-card:hover,.sah-promo-card:focus-visible{transform:translateY(-4px);box-shadow:0 15px 34px rgba(42,58,72,.16);border-color:#9bb5ca;outline:none;}
  .sah-promo-kind{display:inline-flex;align-items:center;gap:7px;width:fit-content;padding:5px 10px;border-radius:99px;background:#edf7ff;border:1px solid #b7d5ea;color:#557691;font-size:.66rem;font-weight:900;text-transform:uppercase;letter-spacing:.4px;}
  .sah-promo-kind i{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;border-radius:5px;background:#6f8da6;color:#fff;font-size:.58rem;}
  .sah-promo-card h3{margin:14px 0 7px;color:var(--dark);font-family:'Playfair Display',Georgia,serif;font-size:1.08rem;line-height:1.35;}
  .sah-promo-provider{color:#b76514;font-size:.7rem;font-weight:800;margin-bottom:9px;}
  .sah-promo-copy{color:var(--mid);font-size:.8rem;line-height:1.65;white-space:pre-wrap;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:5;overflow:hidden;}
  .sah-promo-date{margin-top:14px;padding-top:10px;border-top:1px solid var(--border);color:var(--grey);font-size:.67rem;}
  .sah-promo-open{display:inline-flex;align-items:center;gap:7px;width:fit-content;margin-top:15px;padding:7px 11px;border-radius:7px;background:#fff3e8;color:#b76514;font-size:.74rem;font-weight:900;transition:background .15s,color .15s;}
  .sah-promo-card:hover .sah-promo-open{background:#ff8c42;color:#fff;}
  .sah-promo-modal-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(24,35,48,.58);backdrop-filter:blur(4px);}
  .sah-promo-modal{position:relative;width:min(720px,100%);max-height:calc(100vh - 44px);display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.45);border-radius:16px;background:#fff;box-shadow:0 28px 80px rgba(24,35,48,.3);}
  .sah-promo-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:22px 24px;border-bottom:1px solid var(--border);background:#f8fcff;}
  .sah-promo-modal-head h2{margin:10px 0 0;font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.3rem,3vw,1.75rem);line-height:1.25;color:var(--dark);}
  .sah-promo-modal-close{width:34px;height:34px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #dbe8f1;border-radius:9px;background:#fff;color:var(--accent-dark);cursor:pointer;font-size:.9rem;}
  .sah-promo-modal-close:hover{background:#edf7ff;}
  .sah-promo-modal-body{padding:22px 24px;overflow-y:auto;}
  .sah-promo-modal-byline{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:17px;padding-bottom:13px;border-bottom:1px solid var(--border);color:var(--muted);font-size:.75rem;}
  .sah-promo-modal-provider{color:#b76514;font-weight:800;}
  .sah-promo-modal-content{color:var(--mid);font-family:'DM Sans','Segoe UI',sans-serif;font-size:.92rem;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;}
  @media(max-width:900px){.sah-promo-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
  @media(max-width:600px){.sah-promo-grid{grid-template-columns:1fr;}.sah-promo-modal-overlay{padding:12px}.sah-promo-modal-head,.sah-promo-modal-body{padding:18px;}}

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
export function applyDirectoryStyles() {
  injectHead();
  if (document.getElementById('sah-styles')) return;
  const style = document.createElement('style');
  style.id = 'sah-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}
