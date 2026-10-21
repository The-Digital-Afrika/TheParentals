export default function HowItWorks() {
  return (
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
  );
}
