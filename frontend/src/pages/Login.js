// frontend/src/pages/Login.js
// CHANGE: Normal users (role !== 'admin' && role !== 'provider'/'PROVIDER'/'client') 
//         are redirected to '/' (homepage) after login, not to any profile page.
//         Provider/client roles still go to /client-dashboard.
//         Admin still goes to /admin-dashboard.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const injectHead = () => {
  if (document.getElementById('sah-login-fonts')) return;
  const fonts = document.createElement('link');
  fonts.id = 'sah-login-fonts';
  fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap';
  document.head.appendChild(fonts);
  const fa = document.createElement('link');
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
  document.head.appendChild(fa);
};

const CSS = `
  :root {
    --accent: #c9621a; --accent-dark: #a84e12; --accent-light: #f0dcc8;
    --dark: #3a3a3a; --mid: #555; --muted: #888;
    --card-gray: #d6d0c8; --card-white: #ede9e3;
    --border: rgba(0,0,0,0.10); --header-h: 68px;
    --shadow-md: 0 4px 20px rgba(0,0,0,0.10);
    --radius: 8px; --radius-lg: 12px;
  }
  .sah-login-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
  .sah-login-wrap { font-family: 'DM Sans', sans-serif; background: var(--card-white); min-height: 100vh; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; }
  .sah-lhdr { position: sticky; top: 0; z-index: 100; height: var(--header-h); background: #5a5a5a; box-shadow: 0 2px 12px rgba(0,0,0,0.22); display: flex; align-items: center; flex-shrink: 0; }
  .sah-lhdr-inner { max-width: 1280px; margin: 0 auto; padding: 0 32px; width: 100%; display: flex; align-items: center; justify-content: space-between; }
  .sah-lhdr-left { display: flex; align-items: center; gap: 0; }
  .sah-lhdr-back { display: inline-flex; align-items: center; gap: 8px; background: none; border: none; color: rgba(255,255,255,0.88); font-size: 0.88rem; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; padding: 6px 0; text-decoration: none; white-space: nowrap; }
  .sah-lhdr-back:hover { color: #fff; }
  .sah-lhdr-div { width: 1px; height: 28px; background: rgba(255,255,255,0.28); margin: 0 16px; }
  .sah-lhdr-brand { text-decoration: none; }
  .sah-lhdr-brand-name { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 1.02rem; color: #fff; display: block; }
  .sah-lhdr-brand-tag { font-size: 0.66rem; color: rgba(255,255,255,0.68); font-weight: 500; letter-spacing: 0.45px; display: block; }
  .sah-lhdr-right { display: flex; align-items: center; gap: 10px; }
  .sah-lhdr-solid { padding: 7px 18px; border-radius: 6px; background: var(--accent); color: #fff; font-weight: 700; font-size: 0.86rem; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; transition: background 0.15s; }
  .sah-lhdr-solid:hover { background: var(--accent-dark); }
  .sah-login-main { flex: 1; display: flex; align-items: stretch; overflow: hidden; }
  .sah-login-left { flex: 0 0 48%; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; min-width: 0; }
  .sah-login-left-bg { position: absolute; inset: 0; z-index: 0; background-image: url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&q=80'); background-size: cover; background-position: center 30%; }
  .sah-login-left-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(160deg, rgba(10,10,10,0.55) 0%, rgba(30,20,10,0.82) 100%); }
  .sah-login-left-content { position: relative; z-index: 2; padding: 40px 36px; }
  .sah-login-left-title { font-family: 'Playfair Display', serif; font-size: clamp(1.7rem, 2.6vw, 2.6rem); font-weight: 900; color: #fff; line-height: 1.08; margin-bottom: 16px; }
  .sah-login-left-title em { font-style: italic; color: var(--accent-light); }
  .sah-login-left-desc { font-size: 0.88rem; color: rgba(255,255,255,0.75); line-height: 1.7; max-width: 340px; margin-bottom: 28px; }
  .sah-login-left-perks { display: flex; flex-direction: column; gap: 10px; }
  .sah-login-left-perk { display: flex; align-items: center; gap: 11px; font-size: 0.84rem; font-weight: 600; color: rgba(255,255,255,0.88); }
  .sah-login-left-perk i { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--accent-light); flex-shrink: 0; }
  .sah-login-right { flex: 1; min-width: 0; background: var(--card-white); display: flex; flex-direction: column; justify-content: center; padding: 32px 48px; overflow-y: auto; }
  .sah-login-heading { font-family: 'Playfair Display', serif; font-size: 1.9rem; font-weight: 800; color: var(--dark); margin-bottom: 3px; line-height: 1.15; }
  .sah-login-sub { color: var(--muted); font-size: 0.88rem; margin-bottom: 18px; }
  .sah-login-alert { display: none; padding: 11px 16px; border-radius: 8px; font-weight: 600; font-size: 0.86rem; margin-bottom: 16px; border: 1px solid transparent; }
  .sah-login-alert.error { background: #fee9e9; color: #a00c2c; border-color: #f5b3b3; }
  .sah-login-alert.success { background: #e6f7ec; color: #0d7d6c; border-color: #a3e0b5; }
  .sah-login-alert.info { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
  .sah-login-alert.show { display: flex; align-items: center; gap: 8px; }
  .sah-login-card { background: var(--card-gray); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); overflow: hidden; }
  .sah-login-card-head { background: #5a5a5a; padding: 18px 24px 14px; }
  .sah-login-card-head h3 { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; }
  .sah-login-card-head p { font-size: 0.78rem; color: rgba(255,255,255,0.65); margin-top: 2px; }
  .sah-login-card-body { padding: 18px 22px 16px; }
  .sah-lfield { margin-bottom: 11px; }
  .sah-lfield label { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.6px; color: var(--mid); margin-bottom: 5px; }
  .sah-lfield label i { color: var(--accent); font-size: 0.72rem; }
  .sah-lfield label span { color: var(--accent); font-size: 1rem; }
  .sah-lfield input { width: 100%; padding: 10px 13px; border: 1.5px solid rgba(0,0,0,0.12); border-radius: var(--radius); background: var(--card-white); font-family: 'DM Sans', sans-serif; font-size: 0.91rem; color: var(--dark); outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
  .sah-lfield input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(201,98,26,0.15); }
  .sah-lfield input.error { border-color: #dc2626; background: #fff8f8; }
  .sah-field-err { margin-top: 4px; font-size: 0.73rem; color: #dc2626; display: flex; align-items: center; gap: 4px; }
  .sah-pw-wrap { position: relative; }
  .sah-pw-wrap input { padding-right: 42px; }
  .sah-pw-toggle { position: absolute; right: 0; top: 0; bottom: 0; width: 42px; background: none; border: none; cursor: pointer; color: var(--muted); font-size: 0.85rem; display: flex; align-items: center; justify-content: center; transition: color 0.15s; }
  .sah-pw-toggle:hover { color: var(--accent); }
  .sah-login-extras { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .sah-remember { display: flex; align-items: center; gap: 7px; font-size: 0.82rem; color: var(--mid); cursor: pointer; user-select: none; }
  .sah-remember input { accent-color: var(--accent); width: 14px; height: 14px; }
  .sah-forgot { background: none; border: none; color: var(--accent); font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 0; text-decoration: underline; }
  .sah-forgot:hover { color: var(--accent-dark); }
  .sah-login-submit-wrap { display: flex; flex-direction: column; gap: 8px; }
  .sah-login-btn { width: 100%; padding: 12px; background: var(--accent); color: #fff; border: none; border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px; transition: background 0.15s, transform 0.15s; }
  .sah-login-btn:hover:not(:disabled) { background: var(--accent-dark); transform: translateY(-1px); }
  .sah-login-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
  .sah-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .sah-secure-note { text-align: center; font-size: 0.73rem; color: var(--muted); display: flex; align-items: center; justify-content: center; gap: 5px; }
  .sah-secure-note i { color: #10b981; }
  .sah-login-divider { text-align: center; margin: 14px 0 10px; font-size: 0.78rem; color: var(--muted); position: relative; }
  .sah-login-divider::before, .sah-login-divider::after { content: ''; position: absolute; top: 50%; width: 40%; height: 1px; background: rgba(0,0,0,0.10); }
  .sah-login-divider::before { left: 0; }
  .sah-login-divider::after { right: 0; }
  .sah-login-prompt { text-align: center; font-size: 0.86rem; color: var(--mid); margin-bottom: 10px; }
  .sah-login-prompt a { color: var(--accent); font-weight: 600; text-decoration: none; }
  .sah-login-prompt a:hover { text-decoration: underline; }

  /* ── Forgot Password Modal ── */
  .sah-fp-overlay {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .sah-fp-modal {
    background: var(--card-white); border-radius: var(--radius-lg);
    box-shadow: 0 24px 64px rgba(0,0,0,0.3);
    width: 440px; max-width: 100%;
    overflow: hidden; animation: fp-in 0.22s ease;
  }
  @keyframes fp-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .sah-fp-head {
    background: #5a5a5a; padding: 22px 26px 18px;
    position: relative;
  }
  .sah-fp-head h3 { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 9px; }
  .sah-fp-head p { font-size: 0.78rem; color: rgba(255,255,255,0.65); margin-top: 3px; }
  .sah-fp-close {
    position: absolute; top: 14px; right: 14px;
    width: 28px; height: 28px; border-radius: 4px;
    background: rgba(255,255,255,0.12); border: none; color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 0.85rem; transition: background 0.15s;
  }
  .sah-fp-close:hover { background: rgba(255,255,255,0.24); }
  .sah-fp-body { padding: 22px 26px 24px; }
  .sah-fp-steps { display: flex; gap: 6px; margin-bottom: 20px; }
  .sah-fp-step-dot { flex: 1; height: 3px; border-radius: 2px; transition: background 0.3s; }
  .sah-fp-step-dot.active { background: var(--accent); }
  .sah-fp-step-dot.done   { background: #10b981; }
  .sah-fp-step-dot.inactive { background: rgba(0,0,0,0.10); }
  .sah-fp-step-label { font-size: 0.72rem; color: var(--muted); font-weight: 600; text-align: center; margin-bottom: 16px; }
  .sah-fp-desc { font-size: 0.86rem; color: var(--mid); margin-bottom: 16px; line-height: 1.65; }
  .sah-fp-field { margin-bottom: 14px; }
  .sah-fp-field label { display: block; font-weight: 700; font-size: 0.73rem; text-transform: uppercase; letter-spacing: 0.6px; color: var(--mid); margin-bottom: 5px; }
  .sah-fp-field input {
    width: 100%; padding: 10px 13px;
    border: 1.5px solid rgba(0,0,0,0.12); border-radius: var(--radius);
    background: #fff; font-family: 'DM Sans', sans-serif; font-size: 0.91rem;
    color: var(--dark); outline: none; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .sah-fp-field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(201,98,26,0.15); }
  .sah-fp-field input.error { border-color: #dc2626; background: #fff8f8; }
  .sah-fp-error { font-size: 0.74rem; color: #dc2626; display: flex; align-items: center; gap: 4px; margin-top: 4px; }
  .sah-fp-code-row { display: flex; gap: 8px; justify-content: center; margin: 8px 0 16px; }
  .sah-fp-code-box {
    width: 48px; height: 56px; text-align: center;
    border: 2px solid rgba(0,0,0,0.12); border-radius: 8px;
    font-size: 1.4rem; font-weight: 800; font-family: 'DM Sans', sans-serif;
    color: var(--dark); background: #fff; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .sah-fp-code-box:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(201,98,26,0.15); }
  .sah-fp-resend { text-align: center; font-size: 0.78rem; color: var(--muted); margin-bottom: 14px; }
  .sah-fp-resend button { background: none; border: none; color: var(--accent); font-weight: 600; cursor: pointer; font-family: inherit; font-size: inherit; padding: 0; }
  .sah-fp-resend button:disabled { opacity: 0.5; cursor: not-allowed; }
  .sah-fp-btn {
    width: 100%; padding: 12px; background: var(--accent); color: #fff;
    border: none; border-radius: var(--radius); font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s; margin-top: 4px;
  }
  .sah-fp-btn:hover:not(:disabled) { background: var(--accent-dark); }
  .sah-fp-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  .sah-fp-success-icon { text-align: center; font-size: 3rem; color: #10b981; margin-bottom: 16px; }
  .sah-fp-success-text { text-align: center; font-size: 0.88rem; color: var(--mid); line-height: 1.65; }
  .sah-fp-pw-wrap { position: relative; }
  .sah-fp-pw-wrap input { padding-right: 42px; }
  .sah-fp-pw-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--muted); cursor: pointer; font-size: 0.88rem; padding: 4px; }
  .sah-fp-pw-eye:hover { color: var(--accent); }
  .sah-fp-info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; font-size: 0.82rem; color: #0369a1; display: flex; align-items: flex-start; gap: 8px; line-height: 1.6; }
  .sah-fp-info-box i { flex-shrink: 0; margin-top: 1px; }

  @media (max-width: 768px) { .sah-login-left { display: none; } .sah-login-right { padding: 24px 20px; } }

  @media(max-width:480px){
  .sah-login-right { padding: 20px 16px; }
  .sah-login-card-body { padding: 14px; }
  .sah-login-heading { font-size: 1.5rem; }
}
`;

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const simulateSendResetEmail = (email) => {
  const code = generateCode();
  const expiry = Date.now() + 15 * 60 * 1000;
  localStorage.setItem('sah_reset_code', JSON.stringify({ email: email.toLowerCase(), code, expiry }));
  console.log(`[DEV] Password reset code for ${email}: ${code}`);
  return code;
};

// ── ForgotPassword Modal ──────────────────────────────────────────────────────
const ForgotPasswordModal = ({ onClose }) => {
  const [fpStep, setFpStep]             = useState(1);
  const [fpEmail, setFpEmail]           = useState('');
  const [fpCode, setFpCode]             = useState(['', '', '', '', '', '']);
  const [fpNewPw, setFpNewPw]           = useState('');
  const [fpConfirmPw, setFpConfirmPw]   = useState('');
  const [fpError, setFpError]           = useState('');
  const [fpLoading, setFpLoading]       = useState(false);
  const [showNewPw, setShowNewPw]       = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [resendTimer, setResendTimer]   = useState(0);
  const [sentCode, setSentCode]         = useState('');

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleEmailSubmit = async () => {
    setFpError('');
    if (!fpEmail.trim() || fpEmail.trim().indexOf('@') < 1) {
      setFpError('Please enter a valid email address.');
      return;
    }
    setFpLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const code = simulateSendResetEmail(fpEmail.trim());
    setSentCode(code);
    setResendTimer(60);
    setFpLoading(false);
    setFpStep(2);
  };

  const handleCodeInput = (idx, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const newCode = [...fpCode];
    newCode[idx] = val;
    setFpCode(newCode);
    setFpError('');
    if (val && idx < 5) {
      document.getElementById(`fp-code-${idx + 1}`)?.focus();
    }
  };

  const handleCodeKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !fpCode[idx] && idx > 0) {
      document.getElementById(`fp-code-${idx - 1}`)?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...fpCode];
    pasted.split('').forEach((c, i) => { newCode[i] = c; });
    setFpCode(newCode);
    if (pasted.length > 0) {
      document.getElementById(`fp-code-${Math.min(pasted.length - 1, 5)}`)?.focus();
    }
  };

  const handleCodeVerify = async () => {
    setFpError('');
    const enteredCode = fpCode.join('');
    if (enteredCode.length < 6) { setFpError('Please enter the full 6-digit code.'); return; }
    setFpLoading(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      const stored = JSON.parse(localStorage.getItem('sah_reset_code') || 'null');
      if (!stored || stored.email !== fpEmail.trim().toLowerCase()) {
        setFpError('Invalid or expired code. Please request a new one.'); setFpLoading(false); return;
      }
      if (Date.now() > stored.expiry) {
        setFpError('This code has expired. Please request a new one.'); setFpLoading(false); return;
      }
      if (stored.code !== enteredCode) {
        setFpError('Incorrect code. Please check your email and try again.'); setFpLoading(false); return;
      }
    } catch {
      setFpError('Verification failed. Please try again.'); setFpLoading(false); return;
    }
    setFpLoading(false);
    setFpStep(3);
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setFpLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const code = simulateSendResetEmail(fpEmail.trim());
    setSentCode(code);
    setResendTimer(60);
    setFpCode(['', '', '', '', '', '']);
    setFpError('');
    setFpLoading(false);
  };

  const handlePasswordReset = async () => {
    setFpError('');
    if (!fpNewPw || fpNewPw.length < 8) { setFpError('Password must be at least 8 characters long.'); return; }
    if (fpNewPw !== fpConfirmPw) { setFpError('Passwords do not match.'); return; }
    setFpLoading(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      const email = fpEmail.trim().toLowerCase();
      const users = JSON.parse(localStorage.getItem('sah_users') || '[]');
      const uIdx = users.findIndex(u => (u.email || '').toLowerCase() === email);
      if (uIdx !== -1) { users[uIdx].password = fpNewPw; localStorage.setItem('sah_users', JSON.stringify(users)); }
      const providers = JSON.parse(localStorage.getItem('sah_providers') || '[]');
      const pIdx = providers.findIndex(p => (p.email || '').toLowerCase() === email);
      if (pIdx !== -1) { providers[pIdx].password = fpNewPw; localStorage.setItem('sah_providers', JSON.stringify(providers)); }
      localStorage.removeItem('sah_reset_code');
    } catch (err) { console.warn('Password update error:', err); }
    setFpLoading(false);
    setFpStep(4);
  };

  const stepLabels = ['Enter Email', 'Verify Code', 'New Password', 'Done'];
  const dotStatus = (i) => {
    if (i + 1 < fpStep) return 'done';
    if (i + 1 === fpStep) return 'active';
    return 'inactive';
  };

  return (
    <div className="sah-fp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sah-fp-modal">
        <div className="sah-fp-head">
          <h3><i className="fas fa-key" />{fpStep === 4 ? 'Password Reset' : 'Reset Your Password'}</h3>
          <p>
            {fpStep === 1 && 'Enter your email to receive a verification code.'}
            {fpStep === 2 && 'Enter the 6-digit code sent to your email.'}
            {fpStep === 3 && 'Choose a strong new password for your account.'}
            {fpStep === 4 && 'Your password has been updated successfully.'}
          </p>
          <button className="sah-fp-close" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <div className="sah-fp-body">
          {fpStep < 4 && (
            <>
              <div className="sah-fp-steps">
                {stepLabels.slice(0, 3).map((_, i) => (
                  <div key={i} className={`sah-fp-step-dot ${dotStatus(i)}`} />
                ))}
              </div>
              <div className="sah-fp-step-label">Step {fpStep} of 3: {stepLabels[fpStep - 1]}</div>
            </>
          )}
          {fpStep === 1 && (
            <>
              <p className="sah-fp-desc">We'll send a 6-digit verification code to your email address. The code expires in 15 minutes.</p>
              <div className="sah-fp-field">
                <label><i className="fas fa-envelope" style={{ color: 'var(--accent)', marginRight: 5 }} /> Email Address</label>
                <input type="email" value={fpEmail} onChange={e => { setFpEmail(e.target.value); setFpError(''); }}
                  placeholder="your@email.com" className={fpError ? 'error' : ''}
                  onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()} autoFocus />
                {fpError && <div className="sah-fp-error"><i className="fas fa-exclamation-circle" /> {fpError}</div>}
              </div>
              <button className="sah-fp-btn" onClick={handleEmailSubmit} disabled={fpLoading}>
                {fpLoading ? <><span className="sah-spinner" /> Sending…</> : <><i className="fas fa-paper-plane" /> Send Verification Code</>}
              </button>
            </>
          )}
          {fpStep === 2 && (
            <>
              <div className="sah-fp-info-box">
                <i className="fas fa-info-circle" />
                <span>
                  A 6-digit code was sent to <strong>{fpEmail}</strong>. Check your inbox (and spam folder).
                  {process.env.NODE_ENV === 'development' && sentCode && (
                    <span style={{ display: 'block', marginTop: 6, fontWeight: 700, color: '#0369a1' }}>
                      [Dev] Your code: <code style={{ background: '#dbeafe', padding: '1px 6px', borderRadius: 4 }}>{sentCode}</code>
                    </span>
                  )}
                </span>
              </div>
              <div className="sah-fp-code-row" onPaste={handleCodePaste}>
                {fpCode.map((digit, idx) => (
                  <input key={idx} id={`fp-code-${idx}`} type="text" inputMode="numeric" maxLength={1}
                    value={digit} className="sah-fp-code-box"
                    onChange={e => handleCodeInput(idx, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(idx, e)} autoFocus={idx === 0} />
                ))}
              </div>
              {fpError && <div className="sah-fp-error" style={{ justifyContent: 'center', marginBottom: 8 }}><i className="fas fa-exclamation-circle" /> {fpError}</div>}
              <div className="sah-fp-resend">
                {resendTimer > 0 ? <>Resend code in <strong>{resendTimer}s</strong></> : <>Didn't get the code? <button onClick={handleResendCode} disabled={fpLoading}>Resend now</button></>}
              </div>
              <button className="sah-fp-btn" onClick={handleCodeVerify} disabled={fpLoading || fpCode.join('').length < 6}>
                {fpLoading ? <><span className="sah-spinner" /> Verifying…</> : <><i className="fas fa-check-circle" /> Verify Code</>}
              </button>
            </>
          )}
          {fpStep === 3 && (
            <>
              <p className="sah-fp-desc">Choose a new password for <strong>{fpEmail}</strong>. Make it at least 8 characters long.</p>
              <div className="sah-fp-field">
                <label><i className="fas fa-lock" style={{ color: 'var(--accent)', marginRight: 5 }} /> New Password</label>
                <div className="sah-fp-pw-wrap">
                  <input type={showNewPw ? 'text' : 'password'} value={fpNewPw}
                    onChange={e => { setFpNewPw(e.target.value); setFpError(''); }}
                    placeholder="Min. 8 characters" className={fpError && !fpNewPw ? 'error' : ''} autoFocus />
                  <button type="button" className="sah-fp-pw-eye" onClick={() => setShowNewPw(s => !s)}>
                    <i className={`far fa-eye${showNewPw ? '-slash' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="sah-fp-field">
                <label><i className="fas fa-lock" style={{ color: 'var(--accent)', marginRight: 5 }} /> Confirm Password</label>
                <div className="sah-fp-pw-wrap">
                  <input type={showConfirmPw ? 'text' : 'password'} value={fpConfirmPw}
                    onChange={e => { setFpConfirmPw(e.target.value); setFpError(''); }}
                    placeholder="Repeat your new password" className={fpError && fpNewPw !== fpConfirmPw ? 'error' : ''}
                    onKeyDown={e => e.key === 'Enter' && handlePasswordReset()} />
                  <button type="button" className="sah-fp-pw-eye" onClick={() => setShowConfirmPw(s => !s)}>
                    <i className={`far fa-eye${showConfirmPw ? '-slash' : ''}`} />
                  </button>
                </div>
              </div>
              {fpError && <div className="sah-fp-error"><i className="fas fa-exclamation-circle" /> {fpError}</div>}
              <button className="sah-fp-btn" onClick={handlePasswordReset} disabled={fpLoading} style={{ marginTop: 12 }}>
                {fpLoading ? <><span className="sah-spinner" /> Updating…</> : <><i className="fas fa-shield-alt" /> Reset Password</>}
              </button>
            </>
          )}
          {fpStep === 4 && (
            <>
              <div className="sah-fp-success-icon"><i className="fas fa-check-circle" /></div>
              <p className="sah-fp-success-text">Your password has been successfully reset. You can now log in with your new password.</p>
              <button className="sah-fp-btn" onClick={onClose} style={{ marginTop: 20 }}>
                <i className="fas fa-sign-in-alt" /> Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Determine redirect after login ──────────────────────────────────────────
// Rules:
//   admin            → /admin-dashboard
//   PROVIDER/provider/client (provider accounts) → /client-dashboard
//   USER/user or any unrecognised role → / (homepage)
const getRedirectPath = (userData) => {
  const role = (userData?.role || '').toLowerCase();
  if (role === 'admin') return '/admin-dashboard';
  if (['provider', 'client', 'provideraccount'].includes(role)) return '/client-dashboard';
  if (userData?.accountType === 'provider') return '/client-dashboard';
  // Normal users (role === 'user', 'USER', or anything else) go home
  return '/';
};

// ── Main Login Component ──────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [remember,     setRemember]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert,        setAlert]        = useState({ msg: '', type: '' });
  const [errors,       setErrors]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [showForgot,   setShowForgot]   = useState(false);

  useEffect(() => {
    injectHead();
    if (!document.getElementById('sah-login-styles')) {
      const s = document.createElement('style');
      s.id = 'sah-login-styles'; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (email.trim().indexOf('@') < 1) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ msg: '', type: '' });
    if (!validate()) return;

    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    try {
      

      // ── Use AuthContext login ──
      const result = await login(trimmedEmail, password);

      if (result && result.success) {
        const userData = result.user;
        setAlert({ msg: result.message || 'Login successful! Redirecting...', type: 'success' });
        showNotification?.(result.message || 'Welcome back!', 'success');

        // ── Smart redirect based on role ──
        const redirectPath = getRedirectPath(userData);
        setTimeout(() => navigate(redirectPath), 1000);
      } else {
        setAlert({
          msg: result?.error || 'Invalid email or password. Please try again.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setAlert({ msg: 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sah-login-wrap">

      <header className="sah-lhdr">
        <div className="sah-lhdr-inner">
          <div className="sah-lhdr-left">
            <button className="sah-lhdr-back" onClick={() => navigate('/')}>
              <i className="fas fa-arrow-left" /> Back to Directory
            </button>
            <div className="sah-lhdr-div" />
            <Link to="/" className="sah-lhdr-brand">
              <span className="sah-lhdr-brand-name">SA Homeschooling</span>
              <span className="sah-lhdr-brand-tag">Education Services Directory</span>
            </Link>
          </div>
          <div className="sah-lhdr-right">
            <Link to="/register" className="sah-lhdr-solid">Register</Link>
          </div>
        </div>
      </header>

      <main className="sah-login-main">
        <div className="sah-login-left">
          <div className="sah-login-left-bg" />
          <div className="sah-login-left-content">
            <h2 className="sah-login-left-title">
              South Africa's<br /><em>Homeschooling</em><br />Directory
            </h2>
            <p className="sah-login-left-desc">
              Connect with verified tutors, therapists, curriculum providers and education specialists nationwide.
            </p>
            <div className="sah-login-left-perks">
              {[
                ['fa-shield-alt', 'All providers manually verified'],
                ['fa-lock',       'Secure & private enquiries'],
                ['fa-star',       '4.9 average provider rating'],
                ['fa-map-marker-alt', 'Nationwide coverage across all 9 provinces'],
              ].map(([icon, text]) => (
                <div key={text} className="sah-login-left-perk">
                  <i className={`fas ${icon}`} />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sah-login-right">
          <h1 className="sah-login-heading">Welcome Back</h1>
          <p className="sah-login-sub">Sign in to your SA Homeschooling Directory account</p>

          {alert.msg && (
            <div className={`sah-login-alert show ${alert.type}`}>
              <i className={`fas ${alert.type === 'success' ? 'fa-circle-check' : alert.type === 'info' ? 'fa-circle-info' : 'fa-circle-exclamation'}`} />
              {' '}{alert.msg}
            </div>
          )}

          <div className="sah-login-card">
            <div className="sah-login-card-head">
              <h3><i className="fas fa-lock" /> Sign in with your credentials</h3>
              <p>Access your provider dashboard and manage your listings</p>
            </div>

            <div className="sah-login-card-body">
              <form onSubmit={handleSubmit} noValidate autoComplete="off">
                <div className="sah-lfield">
                  <label><i className="fas fa-envelope" /> Email Address <span>*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                    placeholder="johndoe@gmail.com"
                    className={errors.email ? 'error' : ''}
                    autoComplete="off"
                    autoFocus
                  />
                  {errors.email && <div className="sah-field-err"><i className="fas fa-circle-exclamation" /> {errors.email}</div>}
                </div>

                <div className="sah-lfield">
                  <label><i className="fas fa-lock" /> Password <span>*</span></label>
                  <div className="sah-pw-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                      placeholder="************"
                      className={errors.password ? 'error' : ''}
                      autoComplete="new-password"
                    />
                    <button type="button" className="sah-pw-toggle" onClick={() => setShowPassword(s => !s)}>
                      <i className={`far fa-eye${showPassword ? '-slash' : ''}`} />
                    </button>
                  </div>
                  {errors.password && <div className="sah-field-err"><i className="fas fa-circle-exclamation" /> {errors.password}</div>}
                </div>

                <div className="sah-login-extras">
                  <label className="sah-remember">
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                    Remember me
                  </label>
                  <button type="button" className="sah-forgot" onClick={() => setShowForgot(true)}>
                    Forgot password?
                  </button>
                </div>

                <div className="sah-login-submit-wrap">
                  <button type="submit" className="sah-login-btn" disabled={loading}>
                    {loading ? <span className="sah-spinner" /> : <i className="fas fa-arrow-right-to-bracket" />}
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                  <div className="sah-secure-note">
                    <i className="fas fa-shield-heart" /> Secure · Encrypted · Verified educators
                  </div>
                </div>
              </form>

              <div className="sah-login-divider">or</div>

              <p className="sah-login-prompt">
                New to the community? <Link to="/register">Create a free account</Link> — it's free
              </p>
            </div>
          </div>
        </div>
      </main>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
};

export default Login;