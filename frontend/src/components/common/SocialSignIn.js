import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
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

export default function SocialSignIn({ onSuccess, onError }) {
  const googleButton = useRef(null);
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

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButton.current) return undefined;
    let active = true;
    loadScript('google-identity-services', 'https://accounts.google.com/gsi/client')
      .then(() => {
        if (!active || !window.google || !googleButton.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => complete({ provider: 'google', credential }),
        });
        googleButton.current.replaceChildren();
        window.google.accounts.id.renderButton(googleButton.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(340, googleButton.current.clientWidth || 340),
        });
      })
      .catch(error => onError?.(error.message));
    return () => { active = false; };
  }, []);

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

  if (!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID) return null;

  return (
    <div className="sah-social-auth">
      {GOOGLE_CLIENT_ID && <div className="sah-google-auth" ref={googleButton} aria-label="Continue with Google" />}
      {FACEBOOK_APP_ID && (
        <button type="button" className="sah-facebook-auth" onClick={continueWithFacebook} disabled={!!busy}>
          <i className="fab fa-facebook" />
          {busy === 'facebook' ? 'Connecting…' : 'Continue with Facebook'}
        </button>
      )}
      <div className="sah-social-divider"><span /> or <span /></div>
    </div>
  );
}
