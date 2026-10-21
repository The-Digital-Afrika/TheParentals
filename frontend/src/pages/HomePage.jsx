// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { applyDirectoryStyles } from "../utils/directoryStyles";
import HowItWorks from "../components/HowItWorks";
import Directory from "../components/Directory";
import SocialSignIn from "../components/common/SocialSignIn";
import { subscribeToNewsletter, getPublishedPromotions } from "../utils/plusBenefits";
import { useAuth } from '../contexts/AuthContext';


function getValidSession() {
  try {
    const token = localStorage.getItem('sah_token');
    const raw   = localStorage.getItem('sah_current_user') || localStorage.getItem('sah_user');
    if (!raw || !token) return null;

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

function LoginRequiredModal({ open, onClose, onLogin, onRegister, message }) {
  if (!open) return null;
  return (
    <div
      className={`sah-modal-overlay${open ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="directory-login-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sah-modal-box">
        <div className="sah-modal-head" style={{ background:"#6f8da6" }}>
          <h2 id="directory-login-title">Login Required</h2>
          <p>You need an account to continue</p>
          <button className="sah-modal-close" onClick={onClose} aria-label="Close login prompt">
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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm]     = useState("");
  const [searchCat, setSearchCat]       = useState("");
  const [activeCat, setActiveCat]       = useState("all");
  const [regModal, setRegModal]         = useState(false);
  const [nlEmail, setNlEmail]           = useState("");
  const [nlMsg, setNlMsg]               = useState({ text:"", type:"" });
  const [toast, setToast]               = useState({ show:false, msg:"", err:false });
  const [currentUser, setCurrentUser]   = useState(() => getValidSession()); // restore session immediately on first render
  const [loginModal, setLoginModal]     = useState({ open:false, message:"" });
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [headingIndex, setHeadingIndex] = useState(0);
  const [headingPaused, setHeadingPaused] = useState(false);
  const [publishedPromotions, setPublishedPromotions] = useState(() => getPublishedPromotions());
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  useEffect(() => {
    applyDirectoryStyles();

    // ── Only restore a session if a valid token + user exist ──────────────
    const checkUser = () => {
      const user = getValidSession();
      setCurrentUser(user); // null if no valid session
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('sah-auth-change', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('sah-auth-change', checkUser);
    };
  }, []);

  useEffect(() => {
    const refreshPromotions = () => setPublishedPromotions(getPublishedPromotions());
    window.addEventListener('storage', refreshPromotions);
    window.addEventListener('sah-promotions-updated', refreshPromotions);
    return () => {
      window.removeEventListener('storage', refreshPromotions);
      window.removeEventListener('sah-promotions-updated', refreshPromotions);
    };
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { setRegModal(false); setLoginModal(m => ({ ...m, open:false })); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (!selectedPromotion) return undefined;
    const close = event => { if (event.key === 'Escape') setSelectedPromotion(null); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', close);
    };
  }, [selectedPromotion]);

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

  const handleSocialSuccess = (user) => {
    setCurrentUser(user);
    dismissSignupPrompt();
    showToast(`Welcome${user?.name ? `, ${user.name}` : ''}!`);
    navigate(user?.role === 'ADMIN' ? '/admin-dashboard' : user?.role === 'PROVIDER' ? '/provider-dashboard' : '/client-dashboard');
  };

  const showToast = useCallback((msg, err = false) => {
    setToast({ show:true, msg, err });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 3500);
  }, []);

  const handleSearch = () => {
    navigate('/?' + new URLSearchParams({ q: searchTerm, category: searchCat }) + '#sah-providers');
    document.getElementById('sah-providers')?.scrollIntoView({ behavior: 'smooth' });
  };
  const filterCat = cat => {
    setActiveCat(cat);
    navigate('/?' + new URLSearchParams({ category: cat === 'all' ? '' : cat }) + '#sah-providers');
  };

  const handleBecomeProvider = (e) => {
    if (e) e.preventDefault();
    navigate('/become-a-provider');
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
    subscribeToNewsletter(nlEmail, 'homepage');
    setNlEmail("");
  };

  const handleLogout = () => {
    logout();
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



  return (
    <div className="sah-wrap">

      {/* HEADER */}
      <header className="sah-header">
        <div className="sah-container sah-nav-inner">
          <Link to="/" className="sah-brand">
            <img className="sah-brand-logo" src="/parentals-logo-header.png" alt="Parentals" />
          </Link>
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
                  {getDashboardPath() !== '/provider-dashboard' && <button className="sah-hero-secondary-cta" onClick={() => navigate('/become-a-provider')}>
                    <i className="fas fa-store" /> Become a Service Provider
                  </button>}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Directory onRequireLogin={message => setLoginModal({ open: true, message })} />

      {publishedPromotions.length > 0 && (
        <section className="sah-promo-section" id="sah-promotions">
          <div className="sah-container">
            <div className="sah-promo-header"><div><span className="sah-sec-eyebrow">From our Plus+ providers</span><h2>Promotions &amp; Advice</h2></div><p>Helpful updates, offers and expert articles from services supporting families.</p></div>
            <div className="sah-promo-grid">
              {publishedPromotions.slice(0, 6).map(item => <article className="sah-promo-card" key={item.id} role="button" tabIndex="0" aria-label={`Open ${item.subject}`} onClick={() => setSelectedPromotion(item)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedPromotion(item); } }}>
                <span className="sah-promo-kind"><i className={`fas ${item.type === 'article' ? 'fa-newspaper' : 'fa-hashtag'}`} />{item.type === 'article' ? 'Native article' : 'Social post'}</span>
                <h3>{item.subject}</h3>
                {item.providerName && <div className="sah-promo-provider">By {item.providerName}</div>}
                <div className="sah-promo-copy">{item.body}</div>
                <span className="sah-promo-open"><i className="fas fa-arrow-up-right-from-square" />{item.type === 'article' ? 'Read full article' : 'View full post'}</span>
                <div className="sah-promo-date">Published {new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' })}</div>
              </article>)}
            </div>
          </div>
        </section>
      )}

      {selectedPromotion && <div className="sah-promo-modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedPromotion(null); }}>
        <section className="sah-promo-modal" role="dialog" aria-modal="true" aria-labelledby="sah-promo-modal-title">
          <div className="sah-promo-modal-head"><div><span className="sah-promo-kind"><i className={`fas ${selectedPromotion.type === 'article' ? 'fa-newspaper' : 'fa-hashtag'}`} />{selectedPromotion.type === 'article' ? 'Native article' : 'Social post'}</span><h2 id="sah-promo-modal-title">{selectedPromotion.subject}</h2></div><button className="sah-promo-modal-close" type="button" aria-label="Close promotion" onClick={() => setSelectedPromotion(null)}><i className="fas fa-times" /></button></div>
          <div className="sah-promo-modal-body"><div className="sah-promo-modal-byline">{selectedPromotion.providerName && <span className="sah-promo-modal-provider">By {selectedPromotion.providerName}</span>}<span>Published {new Date(selectedPromotion.publishedAt || selectedPromotion.createdAt).toLocaleDateString('en-ZA', { day:'numeric', month:'long', year:'numeric' })}</span></div><div className="sah-promo-modal-content">{selectedPromotion.body}</div></div>
        </section>
      </div>}

      {currentUser && <HowItWorks />}

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
            {currentUser && (
              <button type="button" onClick={handleLogout} className="sah-logout-btn">
                <i className="fas fa-right-from-bracket" /> Log Out
              </button>
            )}
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
            <SocialSignIn onSuccess={handleSocialSuccess} onError={message => showToast(message, true)} />
            <div className="sah-signup-prompt-actions">
              <button className="sah-signup-prompt-primary" onClick={() => { dismissSignupPrompt(); setRegModal(true); }}>
                Continue with Email
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
