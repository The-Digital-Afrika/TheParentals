import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { readSavedBusinesses, toggleSavedBusiness } from '../utils/savedBusinesses';

export default function SavedBusinesses() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(() => readSavedBusinesses(user.id));
  useEffect(() => {
    const refresh = () => setSaved(readSavedBusinesses(user.id));
    window.addEventListener('parentals-saved-change', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('parentals-saved-change', refresh); window.removeEventListener('storage', refresh); };
  }, [user.id]);
  return <section className="cd-card" id="saved-businesses" style={{ padding: 24, marginBottom: 24 }}><h2>Saved Businesses</h2><p>Your saved list is stored on this device.</p>{saved.length ? <ul>{saved.map(p => <li key={p.id} style={{ margin: '16px 0' }}><Link to={`/profile?id=${encodeURIComponent(p.id)}`}>{p.name}</Link> · {p.location} <button onClick={() => toggleSavedBusiness(user.id, p)}>Remove</button></li>)}</ul> : <p>Find a business in the directory and select Save Business to keep it here.</p>}<Link to="/#sah-providers">Browse Directory →</Link></section>;
}
