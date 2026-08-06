import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function decodeUser(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(padded), character => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing your Google sign-in…');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const token = params.get('token');
      const user = decodeUser(params.get('user'));
      const requestedNext = params.get('next') || '/';
      const safeNext = ['/admin-dashboard', '/provider-dashboard', '/'].includes(requestedNext)
        ? requestedNext
        : '/';

      if (!token || !user?.id || !user?.email) throw new Error('Missing sign-in details.');

      const sessionUser = { ...user, token };
      localStorage.setItem('sah_user', JSON.stringify(sessionUser));
      localStorage.setItem('sah_current_user', JSON.stringify(sessionUser));
      localStorage.setItem('sah_token', token);
      window.dispatchEvent(new Event('sah-auth-change'));
      window.history.replaceState(null, '', '/auth/callback');
      navigate(safeNext, { replace: true });
    } catch (error) {
      console.error('Google callback error:', error);
      setMessage('Google sign-in could not be completed. Returning to login…');
      const timer = window.setTimeout(
        () => navigate('/login?oauthError=google_auth_failed', { replace: true }),
        1200
      );
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [navigate]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f2ec', color: '#333330', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{'@keyframes parentals-auth-spin{to{transform:rotate(360deg)}}'}</style>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ width: 44, height: 44, margin: '0 auto 14px', border: '4px solid #d9efff', borderTopColor: '#ff8c42', borderRadius: '50%', animation: 'parentals-auth-spin 1s linear infinite' }} />
        <strong>{message}</strong>
      </div>
    </main>
  );
}
