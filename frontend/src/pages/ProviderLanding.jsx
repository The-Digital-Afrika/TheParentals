import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import HowItWorks from '../components/HowItWorks';
import { PLANS } from '../utils/listingPlans';
import { applyDirectoryStyles } from '../utils/directoryStyles';
import '../assets/css/providerLanding.css';

export default function ProviderLanding() {
  useEffect(() => { applyDirectoryStyles(); }, []);
  return <><Header /><main className="sah-wrap provider-page">
    <section className="sah-plans-section">
      <div className="sah-container">
        <div className="provider-intro">
          <span className="sah-sec-eyebrow">Grow With Parentals</span>
          <h1>Connect your business with South African families</h1>
          <p>Choose your listing plan, complete your profile, and manage your services in your dedicated provider dashboard.</p>
        </div>
        <div className="sah-plans-heading"><h2>Choose your plan</h2><p>Choose the listing that fits your business. You can change plans later.</p></div>
        <div className="sah-hero-plans-grid">
          {PLANS.map(plan => <article key={plan.id} className={`sah-plan-item${plan.highlight ? ' highlight' : ''}`}>
            <div className="sah-plan-header">
              <div className="sah-plan-info"><h3 className="sah-plan-name">{plan.name}</h3><p className="sah-plan-desc">{plan.desc}</p></div>
              <div className="sah-plan-right"><div className="sah-plan-price">{plan.price}<small>{plan.id === 'trusted' ? '/ month' : 'Free listing'}</small></div></div>
            </div>
            <div className="sah-plan-details open"><div className="sah-plan-details-inner"><div className="sah-plan-details-content">
              <ul className="sah-plan-features">{plan.features.map(feature => <li key={feature.text} className={feature.yes ? '' : 'no'}><i aria-hidden="true" className={`fas ${feature.yes ? 'fa-check sah-ico-yes' : 'fa-times sah-ico-no'}`} /><span>{!feature.yes && <span className="provider-sr-only">Not included: </span>}{feature.text}</span></li>)}</ul>
              <Link className="sah-plan-cta-link" to={`/register/provider?step=1&plan=${encodeURIComponent(plan.planParam)}`}>{plan.cta}</Link>
            </div></div></div>
          </article>)}
        </div>
        <p className="provider-approval-note">Listings appear in the directory once approved and eligible. Paid plans activate after payment verification.</p>
      </div>
    </section>
    <HowItWorks />
  </main><Footer /></>;
}
