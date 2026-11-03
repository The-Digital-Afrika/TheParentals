import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import './BusinessSearch.css';

export default function BusinessSearch() {
  const navigate = useNavigate();
  const root = useRef(null);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const dismiss = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);

  useEffect(() => {
    if (!open) return;
    let current = true;
    setLoading(true); setError(false); setActive(-1); setSuggestions([]);
    const timer = setTimeout(() => {
      apiRequest('GET', `/api/providers/search?${new URLSearchParams({ catalogue: '1', q: query })}`)
        .then(data => { if (current) setSuggestions(data.suggestions || []); })
        .catch(() => { if (current) setError(true); })
        .finally(() => { if (current) setLoading(false); });
    }, 200);
    return () => { current = false; clearTimeout(timer); };
  }, [query, open, retry]);

  const search = suggestion => {
    const match = suggestion || suggestions.find(item => item.label.toLowerCase() === query.trim().toLowerCase())
      || (query.trim() ? suggestions[0] : null);
    const value = match?.label || query.trim();
    setQuery(value); setOpen(false);
    navigate('/?' + new URLSearchParams({ category: value, ...(city.trim() ? { city: city.trim() } : {}) }) + '#sah-providers');
    document.getElementById('sah-providers')?.scrollIntoView({ behavior: 'smooth' });
  };

  return <div className="business-search" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <form className="business-search-bar" role="search" onSubmit={event => { event.preventDefault(); search(open && active >= 0 ? suggestions[active] : null); }}>
      <label className="business-search-query"><i className="fas fa-search" aria-hidden="true" />
        <input aria-label="Search categories" placeholder="Try category" value={query}
          role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="business-search-options"
          aria-activedescendant={open && active >= 0 ? `business-option-${active}` : undefined}
          onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={event => {
            if (event.key === 'Escape') { setOpen(false); setActive(-1); }
            if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
              event.preventDefault(); setOpen(true);
              if (suggestions.length) setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length);
            }
          }} />
      </label>
      <label className="business-search-location"><i className="fas fa-map-marker-alt" aria-hidden="true" />
        <input aria-label="City or suburb" placeholder="City or suburb" value={city} onFocus={() => setOpen(false)} onChange={event => setCity(event.target.value)} />
      </label>
      <button className="business-search-submit" type="submit">Search <i className="fas fa-arrow-right" aria-hidden="true" /></button>
    </form>
    {open && <div className="business-search-dropdown">
      <div className="business-search-intro">{query ? 'Matching categories' : 'Explore categories'}</div>
      <div role="status" className="business-search-status">{loading ? 'Finding categories…' : error ? 'Categories are unavailable. Please try again.' : !suggestions.length ? 'No matching categories. Try another category.' : ''}</div>
      {error && <button className="business-search-retry" type="button" onClick={() => setRetry(value => value + 1)}>Retry suggestions</button>}
      <ul id="business-search-options" role="listbox" aria-label="Suggested categories">
        {suggestions.map((item, index) => <li key={`${item.type}-${item.label}`} id={`business-option-${index}`} role="option" aria-selected={active === index}
          className={active === index ? 'active' : ''} onMouseEnter={() => setActive(index)}
          onMouseDown={event => event.preventDefault()} onClick={() => search(item)}>
          <span className="business-search-option-icon"><i className={`fas ${item.icon || 'fa-th-large'}`} aria-hidden="true" /></span>
          <span className="business-search-option-label">{item.label}<small>{item.detail || 'Explore matching listings'}</small></span><span className="business-search-type">{item.count ? `${item.count} listed` : 'No listings yet'}</span>
        </li>)}
      </ul>
      <button className="business-search-all" type="button" onClick={() => search(null)}>{query ? 'View businesses in this category' : 'Browse all categories'} <i className="fas fa-arrow-right" aria-hidden="true" /></button>
    </div>}
  </div>;
}
