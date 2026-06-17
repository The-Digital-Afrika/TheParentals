import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const HEADER_CSS = `
  :root {
    --hdr-bg:       #3f3f3c;
    --hdr-bg-mob:   #343431;
    --hdr-accent:   #8fb8d8;
    --hdr-accent-dk:#557691;
    --hdr-accent-lt:#d9efff;
    --hdr-accent-solid:#ff8c42;
    --hdr-blue-glass:rgba(111,141,166,0.78);
    --hdr-h:        96px;
  }
  .sah-hdr, .sah-hdr *, .sah-hdr *::before, .sah-hdr *::after,
  .sah-hdr-mobile, .sah-hdr-mobile *, .sah-hdr-mobile *::before, .sah-hdr-mobile *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }
  .sah-hdr {
    position: sticky; top: 0; z-index: 1000;
    height: var(--hdr-h); background: var(--hdr-blue-glass);
    background-image: none;
    box-shadow: 0 12px 34px rgba(24,35,48,0.18);
    backdrop-filter: blur(18px) saturate(1.12);
    -webkit-backdrop-filter: blur(18px) saturate(1.12);
    font-family: 'DM Sans', sans-serif;
    color: #ffffff;
    overflow: hidden;
  }
  .sah-hdr::before {
    content: ''; position: absolute; inset: 0;
    background: transparent; pointer-events: none; z-index: 0;
  }
  .sah-hdr-inner {
    max-width: 1280px; margin: 0 auto; padding: 0 32px;
    height: 100%; display: flex; align-items: center; justify-content: space-between;
    gap: 16px; position: relative; z-index: 1;
  }
  /* Left - Back button + brand together */
  .sah-hdr-left {
    display: flex; flex-direction: column; align-items: flex-start; justify-content: center;
    flex-shrink: 0; min-width: 0; gap: 2px;
  }
  .sah-hdr-back {
    display: inline-flex; align-items: center; gap: 8px;
    background: none; border: none; color: rgba(255,255,255,0.90);
    font-size: 0.76rem; font-weight: 700; font-family: 'DM Sans', sans-serif;
    cursor: pointer; padding: 0; transition: color 0.15s;
    text-decoration: none; white-space: nowrap;
  }
  .sah-hdr-back i { font-size: 0.68rem; }
  .sah-hdr-back:hover { color: #fff; }
  /* Brand — lives in left section next to back button */
  .sah-hdr-brand {
    display: flex; align-items: center; gap: 12px;
    text-decoration: none; flex-shrink: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  .sah-hdr-logo {
    display: block; width: 210px; max-width: 28vw; height: 56px;
    object-fit: contain; object-position: left center;
    filter: drop-shadow(0 4px 10px rgba(24,35,48,0.22));
  }
  .sah-hdr-brand-text {
    display: flex; flex-direction: column; line-height: 1.15;
  }
  .sah-hdr-brand-name {
    font-family: 'Playfair Display', serif; font-weight: 800;
    font-size: 1.02rem; color: #fff; letter-spacing: 0.15px;
  }
  .sah-hdr-brand-tag {
    font-size: 0.66rem; color: rgba(255,255,255,0.70);
    font-weight: 500; letter-spacing: 0.45px;
  }
  /* Right - nav + CTAs + hamburger */
  .sah-hdr-right {
    display: flex; align-items: center; gap: 6px;
    flex-shrink: 0; justify-content: flex-end;
  }
  .sah-hdr-nav {
    display: flex; align-items: center; gap: 4px; margin-right: 12px;
  }
  .sah-hdr-nav a {
    padding: 8px 14px; border-radius: 6px;
    font-weight: 600; font-size: 0.9rem;
    color: rgba(255,255,255,0.88); text-decoration: none;
    transition: all 0.15s; white-space: nowrap;
  }
  .sah-hdr-nav a:hover {
    color: #fff; background: rgba(255,255,255,0.12);
  }
  .sah-hdr-ctas {
    display: flex; align-items: center; gap: 10px;
  }
  .sah-hdr-ghost {
    padding: 7px 16px; border-radius: 6px;
    border: 1.5px solid rgba(255,255,255,0.60);
    background: transparent; color: #fff; font-weight: 600; font-size: 0.85rem;
    cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif;
    text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
    white-space: nowrap;
  }
  .sah-hdr-ghost:hover {
    border-color: #fff; background: rgba(255,255,255,0.10);
  }
  .sah-hdr-solid {
    padding: 7px 18px; border-radius: 6px;
    background: #ff8c42; color: #fff;
    font-weight: 700; font-size: 0.86rem; border: none; cursor: pointer;
    transition: background 0.15s; font-family: 'DM Sans', sans-serif;
    text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
    white-space: nowrap;
  }
  .sah-hdr-solid:hover { filter: saturate(1.08) brightness(0.94); }
  /* Hamburger */
  .sah-hdr-ham {
    display: none; flex-direction: column; justify-content: center;
    gap: 5px; background: none; border: none; cursor: pointer;
    padding: 6px; flex-shrink: 0;
  }
  .sah-hdr-ham span {
    display: block; width: 22px; height: 2.2px;
    background: rgba(255,255,255,0.90); border-radius: 2px;
    transition: all 0.22s ease;
  }
  .sah-hdr-ham.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .sah-hdr-ham.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .sah-hdr-ham.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
  /* Mobile drawer */
  .sah-hdr-mobile {
    position: fixed; top: var(--hdr-h); left: 0; right: 0; z-index: 999;
    background: rgba(111,141,166,0.92); max-height: 0; overflow: hidden;
    background-image: none;
    backdrop-filter: blur(18px) saturate(1.12);
    -webkit-backdrop-filter: blur(18px) saturate(1.12);
    transition: max-height 0.28s ease, box-shadow 0.28s;
    display: flex; flex-direction: column;
  }
  .sah-hdr-mobile.open {
    max-height: 460px; box-shadow: 0 8px 28px rgba(0,0,0,0.30);
  }
  .sah-hdr-mobile a,
  .sah-hdr-mobile .mob-link {
    padding: 14px 24px; font-size: 0.96rem; font-weight: 600;
    color: rgba(255,255,255,0.88); text-decoration: none;
    border: none; background: none; text-align: left; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: background 0.15s;
    display: flex; align-items: center; gap: 12px; width: 100%;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .sah-hdr-mobile a:hover,
  .sah-hdr-mobile .mob-link:hover {
    background: rgba(255,255,255,0.09); color: #fff;
  }
  .sah-mob-cta-row {
    display: flex; gap: 10px; padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.12);
  }
  .sah-mob-cta-row a {
    flex: 1; padding: 10px 0; border-radius: 6px; font-size: 0.92rem;
    font-weight: 700; justify-content: center; border-bottom: none !important;
  }
  .sah-mob-ghost {
    border: 1.5px solid rgba(255,255,255,0.55) !important;
    background: transparent !important; color: #fff !important;
  }
  .sah-mob-solid {
    background: #ff8c42 !important; color: #fff !important;
    border: none !important;
  }
  .sah-mob-solid:hover { filter: saturate(1.08) brightness(0.94); }
  /* Responsive */
  @media (max-width: 960px) { .sah-hdr-nav { display: none; } }
  @media (max-width: 760px) {
    .sah-hdr-ctas { display: none; }
    .sah-hdr-ham { display: flex; }
    .sah-hdr-inner { gap: 12px; }
  }
  @media (max-width: 480px) {
    .sah-hdr-inner { padding: 0 16px; }
    .sah-hdr-logo { width: 140px; height: 92px; max-width: 42vw; }
  }

  @media(max-width:480px){
  .sah-hdr-inner { padding: 0 12px; gap: 8px; }
  .sah-hdr-logo { width: 132px; height: 88px; max-width: 40vw; }
  .sah-hdr-ctas { display: none; }
  .sah-hdr-ham { display: flex; }
}
`;

function injectCSS() {
  if (document.getElementById('sah-hdr-css')) return;
  const el = document.createElement('style');
  el.id = 'sah-hdr-css';
  el.textContent = HEADER_CSS;
  document.head.appendChild(el);

  if (!document.getElementById('sah-fonts')) {
    const f = document.createElement('link');
    f.id = 'sah-fonts'; f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(f);
  }
  if (!document.getElementById('sah-fa')) {
    const fa = document.createElement('link');
    fa.id = 'sah-fa'; fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
    document.head.appendChild(fa);
  }
}

const Header = ({ userType = 'guest', backLabel = 'Back to Directory', showBack = true } = {}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { injectCSS(); }, []);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    try { localStorage.removeItem('sah_current_user'); } catch {}
    showNotification('Logged out successfully', 'success');
    setMobileOpen(false);
    navigate('/');
  };

  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('sah_current_user')); } catch {}

  const isLoggedIn = !!user || !!currentUser;
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'admin';
  const isHomepage = location.pathname === '/';
  const isAdminDashboard = location.pathname === '/admin-dashboard' || userType === 'admin';
  const showBackButton = showBack && !isHomepage && !isAdminDashboard;
  const closeMob = () => setMobileOpen(false);

  // Where to send the logged-in user when they click their name
  const dashboardPath = isAdmin ? '/admin-dashboard' : '/client-dashboard';
  const displayName = currentUser?.name ? currentUser.name.split(' ')[0] : (user?.name ? user.name.split(' ')[0] : 'Account');

  return (
    <>
      <header className="sah-hdr">
        <div className="sah-hdr-inner">

          {/* LEFT: Back button + Brand side by side */}
          <div className="sah-hdr-left">
            <Link to="/" className="sah-hdr-brand">
              <img className="sah-hdr-logo" src="/parentals-logo-header.png" alt="Parentals" />
            </Link>
            {showBackButton && (
              <button className="sah-hdr-back" onClick={() => navigate('/')}>
                <i className="fas fa-arrow-left" />
                <span>{backLabel}</span>
              </button>
            )}
          </div>

          {/* RIGHT: Nav + CTAs + Hamburger */}
          <div className="sah-hdr-right">
            {isHomepage && (
              <nav className="sah-hdr-nav" aria-label="Main navigation">
                <a href="/#sah-providers">Find Services</a>
                <a href="/#sah-how">How It Works</a>
                <a href="/#sah-list">View Packages</a>
                <a href="https://sahomeschooling.com" target="_blank" rel="noreferrer">
                  Magazine <i className="fas fa-arrow-up-right-from-square" style={{ fontSize: '0.58rem' }} />
                </a>
                {isLoggedIn && isAdmin && <Link to="/admin-dashboard">Admin</Link>}
                {isLoggedIn && !isAdmin && <Link to="/client-dashboard">Dashboard</Link>}
              </nav>
            )}

            <div className="sah-hdr-ctas">
              {isLoggedIn ? (
                <>
                  {/* FIX: clicking the name now goes to dashboard, not /login */}
                  <Link to={dashboardPath} className="sah-hdr-ghost">
                    <i className="fas fa-user-circle" />
                    {displayName}
                  </Link>
                  <button className="sah-hdr-solid" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt" /> Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="sah-hdr-ghost">Log In</Link>
                  <Link to="/register" className="sah-hdr-solid">Register</Link>
                </>
              )}
            </div>

            <button
              className={`sah-hdr-ham${mobileOpen ? ' open' : ''}`}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <nav className={`sah-hdr-mobile${mobileOpen ? ' open' : ''}`} aria-label="Mobile navigation">
        <Link to="/" onClick={closeMob}><i className="fas fa-home" /> Home</Link>
        <a href="/#sah-providers" onClick={closeMob}><i className="fas fa-search" /> Find Services</a>
        <a href="/#sah-how" onClick={closeMob}><i className="fas fa-info-circle" /> How It Works</a>
        <a href="/#sah-list" onClick={closeMob}><i className="fas fa-layer-group" /> View Packages</a>
        <a href="https://sahomeschooling.com" target="_blank" rel="noreferrer" onClick={closeMob}>
          <i className="fas fa-newspaper" /> Magazine
        </a>
        {isLoggedIn && isAdmin && (
          <Link to="/admin-dashboard" onClick={closeMob}><i className="fas fa-shield-halved" /> Admin</Link>
        )}
        {isLoggedIn && !isAdmin && (
          <Link to="/client-dashboard" onClick={closeMob}><i className="fas fa-user-circle" /> Dashboard</Link>
        )}
        {isLoggedIn ? (
          <button className="mob-link" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /> Log Out
          </button>
        ) : (
          <div className="sah-mob-cta-row">
            <Link to="/login" className="sah-mob-ghost" onClick={closeMob}>Log In</Link>
            <Link to="/register" className="sah-mob-solid" onClick={closeMob}>Register</Link>
          </div>
        )}
      </nav>
    </>
  );
};

export default Header;