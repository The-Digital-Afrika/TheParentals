import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { readSavedBusinesses, toggleSavedBusiness } from '../utils/savedBusinesses';
import ProviderCard from './ProviderCard';
import '../assets/css/marketplace.css';

export default function Directory({ onRequireLogin }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [params, setParams] = useSearchParams();
  const { user: sessionUser } = useAuth();
  const user = localStorage.getItem('sah_token') ? sessionUser : null;
  const [query, setQuery] = useState(params.get('q') || '');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saved, setSaved] = useState([]);
  useEffect(() => { setSaved(user ? readSavedBusinesses(user.id) : []); }, [user]);
  const input = useRef(null);
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  useEffect(() => { setQuery(q); setPage(1); }, [q, category]);
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    const search = new URLSearchParams({ q, category, ...JSON.parse(filterKey), page });
    apiRequest('GET', `/api/providers/search?${search}`).then(data => {
      if (current) setResult(data);
    }).catch(err => { if (current) { setError(err.message); setResult({ items: [], total: 0 }); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [q, category, page, filterKey, retry]);
  useEffect(() => {
    let current = true;
    if (query.trim().length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      apiRequest('GET', `/api/providers/search?${new URLSearchParams({ q: query, suggest: '1', category, ...filters })}`)
        .then(data => {
          if (!current) return;
          const values = data.items.flatMap(p => [
            { label: p.name, type: 'Business' },
            { label: p.primaryCategory, type: 'Category' },
            { label: p.city, type: 'Location' },
            ...(p.services || []).map(s => ({ label: s.title, type: 'Service' })),
          ]).filter(s => s.label);
          setSuggestions(values.filter((s, i) => values.findIndex(v => v.label === s.label) === i).slice(0, 8));
          setActive(-1);
        }).catch(() => { if (current) setSuggestions([]); });
    }, 300);
    return () => { current = false; clearTimeout(timer); };
  }, [query, category, filterKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = value => {
    setQuery(value); setParams({ q: value, ...(category ? { category } : {}) });
    setPage(1); setFocused(false);
  };
  const updateFilter = (key, value) => { setFilters(prev => ({ ...prev, [key]: value })); setPage(1); };
  return <section className="sah-providers-section" id="sah-providers" aria-label="Business directory">
    <div className="sah-container">
    <div className="sah-sec-header"><div><span className="sah-sec-eyebrow">Parent-Focused Listings</span><h2>{q || category ? 'Search Results' : 'Recently Added'}</h2></div>
      {result.items.length > 4 && <button className="sah-link-btn" onClick={() => setShowAll(value => !value)}>{showAll ? 'Show fewer' : `Show all ${result.total} listings ?`}</button>}
    </div>
    <details className="directory-refine"><summary>Refine search</summary><div className="marketplace directory-search-tools">
    <form className="marketplace-search" onSubmit={e => { e.preventDefault(); submit(active >= 0 && focused ? suggestions[active].label : query); }}>
      <label htmlFor="directory-query">Search businesses, services, subjects or places</label>
      <div className="marketplace-search-row"><input id="directory-query" ref={input} value={query} role="combobox" aria-autocomplete="list" aria-expanded={focused && suggestions.length > 0} aria-controls="directory-suggestions" aria-activedescendant={focused && active >= 0 ? `suggestion-${active}` : undefined}
        onChange={e => { setQuery(e.target.value); setFocused(true); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onKeyDown={e => { if (e.key === 'Escape') setFocused(false); if (['ArrowDown', 'ArrowUp'].includes(e.key) && suggestions.length) { e.preventDefault(); setFocused(true); setActive(n => (n + (e.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length); } }} placeholder="Try Maths tutoring in Sandton" /><button type="submit">Search</button></div>
      {focused && suggestions.length > 0 && <ul id="directory-suggestions" role="listbox" className="marketplace-suggestions">{suggestions.map((s, i) => <li key={s.label} id={`suggestion-${i}`} role="option" aria-selected={active === i} onMouseDown={e => { e.preventDefault(); submit(s.label); }}><span>{s.label}</span><small>{s.type}</small></li>)}</ul>}
    </form>
    <div className="marketplace-filters">
      <label>Category<input value={category} placeholder="Any category" onChange={e => { setParams({ q, category: e.target.value }); setPage(1); }} /></label>
      <label>Subcategory<input value={filters.subcategory || ''} onChange={e => updateFilter('subcategory', e.target.value)} placeholder="Any subcategory" /></label>
      <label>Province<select value={filters.province || ''} onChange={e => updateFilter('province', e.target.value)}><option value="">All provinces</option>{['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'].map(p => <option key={p}>{p}</option>)}</select></label>
      <label>City / suburb<input value={filters.city || ''} placeholder="Any city" onChange={e => updateFilter('city', e.target.value)} /></label>
      <label>Minimum rating<select value={filters.rating || ''} onChange={e => updateFilter('rating', e.target.value)}><option value="">Any rating</option>{[3,4,5].map(n => <option value={n} key={n}>{n}+ stars</option>)}</select></label>
      <label>Service type<select value={filters.serviceType || ''} onChange={e => updateFilter('serviceType', e.target.value)}><option value="">Any delivery</option>{['Online','In Person','Hybrid'].map(s => <option key={s}>{s}</option>)}</select></label>
      <button type="button" onClick={() => { setFilters({}); setParams({}); setPage(1); }}>Clear filters</button>
    </div>
    </div></details>
    <p role="status" aria-live="polite">{loading ? 'Searching businesses…' : `${result.total} businesses found`}</p>
    {error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Retry</button></p>}
    {!loading && !error && !result.items.length && <div className="marketplace-empty"><h3>No matching businesses yet</h3><p>Try a broader service, check the spelling, or remove a location or rating filter.</p></div>}
    <div className="sah-provider-grid" aria-busy={loading}>{!loading && (showAll ? result.items : result.items.slice(0, 4)).map(p => <ProviderCard key={p.id} p={p}
      isOwn={String(user?.role || '').toUpperCase() === 'PROVIDER' && !!user?.id && user.id === (p.userId || p.id)}
      saved={saved.some(item => item.id === p.id)}
      onView={id => { if (user) navigate(`/profile?id=${encodeURIComponent(id)}`); else onRequireLogin?.('Please log in or create a free account to view business profiles.'); }}
      onSave={business => { if (user?.role?.toUpperCase() === 'USER') setSaved(toggleSavedBusiness(user.id, business)); else if (!user) onRequireLogin?.('Please log in or create a free account to save businesses.'); }}
    />)}</div>
    {showAll && result.total > result.limit && <nav className="marketplace-pagination" aria-label="Results pages"><button disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page}</span><button disabled={loading || page * result.limit >= result.total} onClick={() => setPage(p => p + 1)}>Next</button></nav>}
    </div>
  </section>;
}
