import { useState } from 'react';
import { api, getGoogleAuthUrl } from '../../services/api';

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';

const loadScript = (id, src) => new Promise((resolve, reject) => {
  const existing = document.getElementById(id);
  if (existing) {
    if (existing.dataset.loaded === 'true') resolve();
    else existing.addEventListener('load', resolve, { once: true });
    return;
  }
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.defer = true;
  script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
  script.onerror = () => reject(new Error('Could not load the social sign-in service.'));
  document.head.appendChild(script);
});

const saveSession = (data) => {
  const user = { ...data.user, token: data.token };
  localStorage.setItem('sah_user', JSON.stringify(user));
  localStorage.setItem('sah_current_user', JSON.stringify(user));
  localStorage.setItem('sah_token', data.token);
  window.dispatchEvent(new Event('sah-auth-change'));
  return user;
};

export default function SocialSignIn({ onSuccess, onError, googleRole = 'USER' }) {
  const [busy, setBusy] = useState('');

  const complete = async (payload) => {
    try {
      setBusy(payload.provider);
      const data = await api.socialAuth(payload);
      onSuccess?.(saveSession(data));
    } catch (error) {
      onError?.(error.message || 'Social sign-in failed.');
    } finally {
      setBusy('');
    }
  };

  const continueWithFacebook = async () => {
    try {
      setBusy('facebook');
      await loadScript('facebook-jssdk', 'https://connect.facebook.net/en_US/sdk.js');
      window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v23.0' });
      window.FB.login((response) => {
        if (!response.authResponse?.accessToken) {
          setBusy('');
          onError?.('Facebook sign-in was cancelled.');
          return;
        }
        complete({ provider: 'facebook', accessToken: response.authResponse.accessToken });
      }, { scope: 'public_profile,email' });
    } catch (error) {
      setBusy('');
      onError?.(error.message || 'Could not start Facebook sign-in.');
    }
  };

  return (
    <div className="sah-social-auth" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, margin: '0 0 16px' }}>
      <button
        type="button"
        className="sah-google-auth"
        onClick={() => window.location.assign(getGoogleAuthUrl(googleRole))}
        style={{
          width: '100%', minHeight: 44, border: '1px solid #ccd0d5', borderRadius: 7,
          background: '#fff', color: '#333330', fontWeight: 700, display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        <span aria-hidden="true" style={{ color: '#4285f4', fontSize: 18, fontWeight: 800 }}>G</span>
        Continue with Google
      </button>
      {FACEBOOK_APP_ID && (
        <button type="button" className="sah-facebook-auth" onClick={continueWithFacebook} disabled={!!busy}>
          <i className="fab fa-facebook" />
          {busy === 'facebook' ? 'Connecting…' : 'Continue with Facebook'}
        </button>
      )}
      <div className="sah-social-divider" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#837b70', fontSize: '.78rem' }}>
        <span style={{ height: 1, background: '#e3e4e7', flex: 1 }} /> or <span style={{ height: 1, background: '#e3e4e7', flex: 1 }} />
      </div>
    </div>
  );
}
