import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Inject footer CSS once — exact match to HomePage ───────────────────── */
const FOOTER_CSS = `
  :root {
    --ft-accent: #c9621a;
    --ft-accent-dark: #a84e12;
  }

  .sah-footer {
    background: #0e0e0e;
    color: rgba(255,255,255,0.55);
    padding: 60px 0 32px;
    font-family: 'DM Sans', sans-serif;
  }
  .sah-footer *, .sah-footer *::before, .sah-footer *::after {
    box-sizing: border-box;
  }
  .sah-footer a { text-decoration: none; color: inherit; }
  .sah-footer button { cursor: pointer; font-family: inherit; }

  .sah-footer .sah-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px;
  }

  /* Grid */
  .sah-footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 48px;
    margin-bottom: 44px;
  }

  /* Brand column */
  .sah-footer-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem;
    font-weight: 800;
    color: #fff;
    display: block;
    margin-bottom: 12px;
  }
  .sah-footer-brand p {
    font-size: 0.85rem;
    line-height: 1.75;
    max-width: 260px;
    color: rgba(255,255,255,0.55);
  }

  /* Newsletter */
  .sah-footer-newsletter { margin-top: 20px; max-width: 280px; }
  .sah-footer-newsletter-row {
    display: flex;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .sah-footer-newsletter input {
    flex: 1;
    padding: 10px 13px;
    background: rgba(255,255,255,0.06);
    border: none;
    color: #fff;
    font-family: inherit;
    font-size: 0.82rem;
    outline: none;
  }
  .sah-footer-newsletter input::placeholder { color: rgba(255,255,255,0.35); }
  .sah-footer-newsletter button {
    padding: 10px 14px;
    background: var(--ft-accent);
    color: #fff;
    border: none;
    font-weight: 700;
    font-size: 0.8rem;
    transition: background 0.15s;
  }
  .sah-footer-newsletter button:hover { background: var(--ft-accent-dark); }
  .sah-nl-feedback {
    margin-top: 6px;
    font-size: 0.78rem;
    padding: 5px 0;
  }
  .sah-nl-feedback.success { color: #6ee7b7; }
  .sah-nl-feedback.error { color: #fca5a5; }

  /* Link columns */
  .sah-footer-col h4 {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.4);
    margin-bottom: 14px;
  }
  .sah-footer-col ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 0;
    margin: 0;
  }
  .sah-footer-col ul li a {
    color: rgba(255,255,255,0.55);
    font-size: 0.875rem;
    transition: color 0.15s;
  }
  .sah-footer-col ul li a:hover { color: #fff; }

  /* Trust strip */
  .sah-footer-trust {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 16px 0;
    margin-bottom: 20px;
    border-top: 1px solid rgba(255,255,255,0.07);
    flex-wrap: wrap;
  }
  .sah-footer-trust-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.78rem;
    color: rgba(255,255,255,0.45);
  }
  .sah-footer-trust-item i { color: var(--ft-accent); font-size: 0.82rem; }

  /* Bottom bar */
  .sah-footer-bottom {
    border-top: 1px solid rgba(255,255,255,0.07);
    padding-top: 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .sah-footer-bottom p { font-size: 0.8rem; color: rgba(255,255,255,0.35); }
  .sah-footer-bottom-links { display: flex; gap: 20px; font-size: 0.8rem; }
  .sah-footer-bottom-links a {
    color: rgba(255,255,255,0.4);
    transition: color 0.15s;
  }
  .sah-footer-bottom-links a:hover { color: #fff; }

  /* Socials */
  .sah-footer-socials { display: flex; gap: 8px; }
  .sah-footer-soc {
    width: 34px; height: 34px;
    border-radius: 5px;
    background: rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.45);
    font-size: 0.84rem;
    transition: all 0.15s;
  }
  .sah-footer-soc:hover { background: var(--ft-accent); color: #fff; }

  /* Responsive */
  @media (max-width: 1100px) {
    .sah-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  }
  @media (max-width: 640px) {
    .sah-footer { padding: 44px 0 24px; }
    .sah-footer .sah-container { padding: 0 20px; }
    .sah-footer-grid { grid-template-columns: 1fr; gap: 28px; }
    .sah-footer-bottom { flex-direction: column; align-items: flex-start; gap: 12px; }
    .sah-footer-bottom-links { flex-wrap: wrap; gap: 12px; }
    .sah-footer-trust { flex-direction: column; align-items: flex-start; gap: 10px; }
    .sah-footer-trust-item[style] { margin-left: 0 !important; }
  }
`;

function injectFooterCSS() {
  if (document.getElementById('sah-footer-css')) return;
  const style = document.createElement('style');
  style.id = 'sah-footer-css';
  style.textContent = FOOTER_CSS;
  document.head.appendChild(style);

  if (!document.getElementById('sah-fonts')) {
    const fonts = document.createElement('link');
    fonts.id = 'sah-fonts'; fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(fonts);
  }
  if (!document.getElementById('sah-fa')) {
    const fa = document.createElement('link');
    fa.id = 'sah-fa'; fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
    document.head.appendChild(fa);
  }
}

const Footer = () => {
  const [nlEmail, setNlEmail] = useState('');
  const [nlMsg, setNlMsg] = useState({ text: '', type: '' });

  // Inject CSS on first render
  React.useEffect(() => { injectFooterCSS(); }, []);

  const handleNewsletter = () => {
    if (nlEmail && /\S+@\S+\.\S+/.test(nlEmail)) {
      setNlMsg({ text: 'Thanks for subscribing!', type: 'success' });
      setNlEmail('');
      setTimeout(() => setNlMsg({ text: '', type: '' }), 4000);
    } else {
      setNlMsg({ text: 'Please enter a valid email address.', type: 'error' });
    }
  };

  return (
    <footer className="sah-footer">
      <div className="sah-container">

        {/* ── Four-column grid ── */}
        <div className="sah-footer-grid">

          {/* Brand + newsletter */}
          <div className="sah-footer-brand">
            <Link to="/" className="sah-footer-logo">SA Homeschooling Directory</Link>
            <p>
              Connecting South African homeschooling families with verified tutors,
              therapists, curriculum providers and education specialists nationwide.
            </p>
            <div className="sah-footer-newsletter">
              <div className="sah-footer-newsletter-row">
                <input
                  type="email"
                  value={nlEmail}
                  onChange={e => setNlEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNewsletter()}
                  placeholder="Your email address…"
                  aria-label="Newsletter email"
                />
                <button type="button" onClick={handleNewsletter}>Subscribe</button>
              </div>
              {nlMsg.text && (
                <div className={`sah-nl-feedback ${nlMsg.type}`}>{nlMsg.text}</div>
              )}
            </div>
          </div>

          {/* For families */}
          <div className="sah-footer-col">
            <h4>For Families</h4>
            <ul>
              <li><a href="/#sah-providers">Find a Tutor</a></li>
              <li><a href="/#sah-providers">Browse Curriculum</a></li>
              <li><a href="/#sah-providers">Therapists</a></li>
              <li><a href="/#sah-providers">Online Schools</a></li>
            </ul>
          </div>

          {/* For providers */}
          <div className="sah-footer-col">
            <h4>For Providers</h4>
            <ul>
              <li><a href="/#sah-list">List a Service</a></li>
              <li><a href="/#sah-list">Pricing Plans</a></li>
              <li><Link to="/login">Provider Login</Link></li>
              <li><a href="/#sah-how">Verification Process</a></li>
            </ul>
          </div>

          {/* SA Homeschooling */}
          <div className="sah-footer-col">
            <h4>SA Homeschooling</h4>
            <ul>
              <li><a href="https://sahomeschooling.com" target="_blank" rel="noreferrer">Magazine</a></li>
              <li><Link to="/about">About the Directory</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li>
                <a href="https://sahomeschooling.com/privacy-policy-for-sa-homeschooling-beyond/" target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Trust strip + office ── */}
        <div className="sah-footer-trust">
          {[
            ['fa-shield-alt', 'All providers manually verified'],
            ['fa-lock',       'Secure & private enquiries'],
            ['fa-star',       '4.9 average provider rating'],
          ].map(([ic, txt]) => (
            <div key={txt} className="sah-footer-trust-item">
              <i className={`fas ${ic}`} /> {txt}
            </div>
          ))}
          <div className="sah-footer-trust-item" style={{ marginLeft: 'auto' }}>
            <i className="fas fa-map-marker-alt" />
            <span>
              <strong style={{ color: 'rgba(255,255,255,0.65)' }}>OUR OFFICE:</strong>{' '}
              Tshimologong Digital Precinct, 41 Juta Street, Braamfontein, Johannesburg, South Africa
            </span>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="sah-footer-bottom">
          <p>&copy; 2025 SA Homeschooling Directory. All rights reserved.</p>

          <div className="sah-footer-bottom-links">
            <a href="https://sahomeschooling.com/privacy-policy-for-sa-homeschooling-beyond/" target="_blank" rel="noreferrer">
              Privacy
            </a>
            {['Terms', 'Cookies', 'Sitemap'].map(l => (
              <Link key={l} to={`/${l.toLowerCase()}`}>{l}</Link>
            ))}
          </div>

          <div className="sah-footer-socials">
            {[
              ['fab fa-facebook-f',  'https://www.facebook.com/SAHomeschoolingMagazine'],
              ['fab fa-instagram',   'https://www.instagram.com/sahomeschoolingmag'],
              ['fab fa-linkedin-in', 'https://www.linkedin.com'],
              ['fab fa-x-twitter',   'https://x.com/SAH_andBeyond'],
            ].map(([ic, href]) => (
              <a key={ic} href={href} className="sah-footer-soc" target="_blank" rel="noreferrer">
                <i className={ic} />
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;