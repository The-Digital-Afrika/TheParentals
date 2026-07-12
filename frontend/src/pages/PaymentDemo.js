import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { api } from '../services/api';

const friendlyPaymentError = (error) => {
  const message = String(error?.message || '');
  if (/prisma|invocation|unknown argument|does not exist|database|column/i.test(message)) {
    return 'Demo payment could not be verified cleanly. Please return to the dashboard and try again.';
  }
  return message || 'Payment verification failed.';
};

const PaymentDemo = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get('reference') || '';
  const isDemo = params.get('demo') === '1';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying payment securely...');
  const [payment, setPayment] = useState(null);

  const syncLocalPlan = (verifiedPayment) => {
    try {
      const current = JSON.parse(localStorage.getItem('sah_current_user') || localStorage.getItem('sah_user') || 'null');
      if (current) {
        const updated = { ...current, plan: 'pro' };
        localStorage.setItem('sah_current_user', JSON.stringify(updated));
        localStorage.setItem('sah_user', JSON.stringify(updated));
      }

      const providers = JSON.parse(localStorage.getItem('sah_providers') || '[]');
      const userId = current?.id;
      const nextProviders = providers.map((provider) => (
        provider.id === userId || provider.userId === userId
          ? { ...provider, plan: 'pro', tier: 'pro', listingPlan: 'pro', billingStatus: 'active', requestedPlan: null }
          : provider
      ));
      localStorage.setItem('sah_providers', JSON.stringify(nextProviders));

      if (verifiedPayment?.reference) {
        const history = JSON.parse(localStorage.getItem('sah_payment_history') || '[]');
        localStorage.setItem('sah_payment_history', JSON.stringify([verifiedPayment, ...history.filter(item => item.reference !== verifiedPayment.reference)].slice(0, 25)));
      }
      window.dispatchEvent(new Event('sah-auth-change'));
    } catch {}
  };

  const verifyPayment = async () => {
    if (!reference) {
      setStatus('error');
      setMessage('Missing payment reference.');
      return;
    }

    setStatus('loading');
    setMessage('Verifying payment securely...');

    try {
      const token = localStorage.getItem('sah_token');
      if (!token || token.startsWith('local_')) {
        throw new Error('Please log in with your backend account before verifying payment.');
      }

      const result = await api.verifyPayment(reference, token);
      setPayment(result.payment || null);
      syncLocalPlan(result.payment);
      setStatus('success');
      setMessage(result.message || 'Payment verified. Parental Plus+ is active.');
    } catch (error) {
      const safePayment = error.data?.payment || null;
      setPayment(safePayment);
      if (safePayment?.status === 'PENDING') {
        setStatus('pending');
        setMessage('Your payment is still being confirmed. Please do not pay twice.');
      } else if (safePayment?.status === 'EXPIRED') {
        setStatus('expired');
        setMessage('This payment instruction has expired.');
      } else if (safePayment?.status === 'CANCELLED') {
        setStatus('cancelled');
        setMessage('The payment was cancelled.');
      } else {
        setStatus(error.status === 0 ? 'network' : 'error');
        setMessage(friendlyPaymentError(error));
      }
    }
  };

  useEffect(() => {
    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const isSuccess = status === 'success';
  const isPending = status === 'pending' || status === 'loading';
  const icon = isSuccess ? 'fa-check-circle' : isPending ? 'fa-spinner fa-spin' : 'fa-circle-exclamation';
  const color = isSuccess ? '#2e7d32' : isPending ? '#6f8da6' : '#856404';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f1ec', display: 'flex', flexDirection: 'column' }}>
      <Header userType="client" showBack={false} />
      <main style={{ flex: 1, width: '100%', maxWidth: 760, margin: '0 auto', padding: '56px 20px' }}>
        <section style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 8, boxShadow: '0 8px 28px rgba(0,0,0,.08)', overflow: 'hidden' }}>
          <div style={{ background: '#6f8da6', color: '#fff', padding: '22px 26px' }}>
            <div style={{ fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, opacity: .78 }}>
              {isDemo ? 'Paystack Test Callback' : 'Paystack Payment Callback'}
            </div>
            <h1 style={{ margin: '8px 0 0', fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.8rem' }}>
              Parental Plus+
            </h1>
          </div>
          <div style={{ padding: 26 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 14, background: '#faf9f7', borderRadius: 8 }}>
                <div style={{ fontSize: '.7rem', color: '#837b70', fontWeight: 800, textTransform: 'uppercase' }}>Amount</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1a1a1a' }}>R149/month</div>
              </div>
              <div style={{ padding: 14, background: '#faf9f7', borderRadius: 8 }}>
                <div style={{ fontSize: '.7rem', color: '#837b70', fontWeight: 800, textTransform: 'uppercase' }}>Reference</div>
                <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#1a1a1a', wordBreak: 'break-all' }}>{reference || '-'}</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '14px 0 18px' }}>
              <i className={`fas ${icon}`} style={{ fontSize: 38, color, marginBottom: 12 }} />
              <h2 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: '1.25rem' }}>
                {isSuccess ? 'Payment successful' : status === 'loading' ? 'Verifying payment' : status === 'pending' ? 'Payment pending' : 'Payment not completed'}
              </h2>
              <p style={{ color: '#55514b', lineHeight: 1.7, margin: '0 auto 18px', maxWidth: 520 }}>{message}</p>
            </div>

            {payment && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 14, background: '#faf9f7', borderRadius: 8, marginBottom: 18 }}>
                <div><strong>Status</strong><br />{payment.status}</div>
                <div><strong>Method</strong><br />{payment.paymentMethod || '-'}</div>
                <div><strong>Currency</strong><br />{payment.currency}</div>
                <div><strong>Verified</strong><br />{payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString() : '-'}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!isSuccess && (
                <button
                  type="button"
                  onClick={verifyPayment}
                  disabled={status === 'loading'}
                  style={{ border: 0, borderRadius: 8, background: '#ff8c42', color: '#fff', padding: '11px 18px', fontWeight: 900, cursor: status === 'loading' ? 'wait' : 'pointer', fontFamily: 'inherit' }}
                >
                  <i className={`fas ${status === 'loading' ? 'fa-spinner fa-spin' : 'fa-rotate'}`} style={{ marginRight: 8 }} />
                  {status === 'loading' ? 'Verifying...' : 'Check status'}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/provider-dashboard')}
                style={{ border: 0, borderRadius: 8, background: isSuccess ? '#ff8c42' : '#6f8da6', color: '#fff', padding: '11px 18px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Continue to dashboard
              </button>
              <Link to="/provider-dashboard" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#6f8da6', fontWeight: 900, padding: '11px 10px' }}>
                Back to dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentDemo;
