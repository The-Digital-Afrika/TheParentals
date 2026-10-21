import { useState } from 'react';

const CAT_ICON = {
  education:"fa-book-open", wellness:"fa-heart-pulse", activities:"fa-palette",
  healthcare:"fa-briefcase-medical", shopping:"fa-bag-shopping", family:"fa-people-roof",
  tutor:"fa-chalkboard-teacher", therapist:"fa-heart", curriculum:"fa-book-open",
  school:"fa-school", consultant:"fa-user-tie", extracurricular:"fa-palette"
};

export default function ProviderCard({ p, onView, onSave, saved, isOwn = false }) {
  const [imgErr, setImgErr] = useState(false);
  const ic = CAT_ICON[p.category] || "fa-star";
  const tier = p.listingPlan || p.tier || "free";
  const isPaid = tier === "pro" || tier === "featured";
  const rawDescription = p.bio || p.description || "";
  const shortDescription = rawDescription.split(/\s+/).filter(Boolean).slice(0, 24).join(" ");
  return (
    <article className={`sah-provider-card${p._inFeaturedSlot ? " is-featured-slot" : ""}`} data-cat={p.category} onClick={() => onView(p.id)} style={{ cursor: 'pointer' }}>
      <div className="sah-card-thumb">
        {p.image && !imgErr
          ? <img src={p.image} alt={p.name} loading="lazy" onError={() => setImgErr(true)} />
          : <div className="sah-card-thumb-fallback"><i className={`fas ${ic}`} /></div>
        }
        {isOwn && <div className="sah-card-badges"><span className="sah-cbadge sah-cbadge-verified">Your Business</span></div>}
        <button className="sah-card-save" aria-label={saved ? "Remove saved business" : "Save business"} aria-pressed={saved} onClick={e => { e.stopPropagation(); onSave(p); }}><i className={saved ? "fas fa-heart" : "far fa-heart"} /></button>
      </div>
      <div className="sah-card-provider-row">
        <div className="sah-pav"><i className={`fas ${ic}`} /></div>
        <div>
          <div className="sah-pav-name">{p.name}</div>
          <div className="sah-pav-tier">{p.category || 'Service Provider'}</div>
        </div>
      </div>
      <div className="sah-card-body">
        <div className="sah-card-title">{p.name}</div>
        <div className="sah-card-meta">
          <span><i className="fas fa-map-marker-alt" />{p.location}</span>
          <span><i className="fas fa-laptop" />{p.deliveryMode}</span>
        </div>
        {!isPaid && shortDescription && (
          <p style={{ fontSize:"0.78rem", color:"var(--muted)", lineHeight:1.5, marginBottom:10 }}>
            {shortDescription}{shortDescription.length < rawDescription.length ? "..." : ""}
          </p>
        )}
        {isPaid && p.rating && (
          <div className="sah-card-rating">
            <span className="sah-stars">{'\u2605'.repeat(Math.round(p.rating))}</span>
            <span className="sah-rnum">{p.rating.toFixed(1)}</span>
            <span className="sah-rcnt">({p.reviewCount})</span>
          </div>
        )}
        <div className="sah-card-foot">
          <div>
            <div className="sah-from-label">{isPaid ? "Starting from" : "Contact"}</div>
            <div className="sah-card-price">{isPaid ? (p.startingPrice || "Contact") : "Via Parental's"}</div>
          </div>
          <button className="sah-card-cta" onClick={e => { e.stopPropagation(); onView(p.id); }}>{isOwn ? 'View My Profile' : 'View Profile'}</button>
        </div>
      </div>
    </article>
  );
}

