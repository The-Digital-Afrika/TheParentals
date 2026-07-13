const crypto = require('crypto');
const express = require('express');
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  appUrl,
  frontendUrl,
  parentalPlusPrice,
  paymentMode,
  paystackCallbackUrl,
  paystackPlusPlanCode,
  paystackSecretKey,
} = require('../config');

const router = express.Router();
const prisma = new PrismaClient();
const mockPayments = new Map();

const PAYMENT_STATUSES = {
  INITIALIZED: 'INITIALIZED',
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  REVERSED: 'REVERSED',
};

const METHOD_CHANNELS = {
  card: ['card'],
  bank: ['bank_transfer'],
  eft: ['eft'],
};

const PLANS = {
  pro: parentalPlusPrice,
};

const isPaystackConfigured = () => /^sk_(test|live)_/.test(paystackSecretKey || '');
const isMockMode = () => paymentMode === 'mock' || !isPaystackConfigured();
const isLiveMode = () => paymentMode === 'live';
const jsonResponse = (res, status, body) => res.status(status).json(body);

function makeReference(userId, plan, prefix = 'par') {
  const stamp = Date.now().toString(36);
  const shortUser = String(userId || 'user').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  return `${prefix}_${plan}_${shortUser}_${stamp}_${crypto.randomBytes(4).toString('hex')}`;
}

function safePayment(payment) {
  if (!payment) return null;
  const metadata = payment.metadata || {};
  const rawResponse = payment.rawResponse || {};
  const instructions = metadata.instructions || null;
  return {
    id: payment.id,
    reference: payment.reference,
    internalReference: metadata.internalReference || payment.reference,
    providerReference: metadata.providerReference || payment.reference,
    plan: payment.plan,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    paymentMethod: metadata.paymentMethod || payment.channel,
    provider: metadata.providerName || payment.channel || 'paystack',
    authorizationUrl: payment.authorizationUrl,
    instructions,
    paidAt: payment.paidAt,
    verifiedAt: metadata.verifiedAt || payment.paidAt,
    expiresAt: metadata.expiresAt || instructions?.expiresAt || null,
    failureReason: metadata.failureReason || rawResponse.failureReason || null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

function makeMockPayment(data) {
  const now = new Date();
  return {
    id: data.reference,
    reference: data.reference,
    userId: data.userId,
    providerId: data.providerId,
    plan: data.plan,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    channel: data.channel,
    authorizationUrl: data.authorizationUrl,
    accessCode: data.accessCode,
    paidAt: data.paidAt || null,
    metadata: data.metadata || {},
    rawResponse: data.rawResponse || { demo: true },
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

async function activateMockPaidPlan(payment, paystackData = {}) {
  const paidAt = paystackData.paid_at ? new Date(paystackData.paid_at) : new Date();

  await prisma.providerProfile.update({
    where: { userId: payment.userId },
    data: {
      listingPlan: payment.plan,
      requestedPlan: null,
      billingStatus: 'active',
      paystackCustomerCode: paystackData.customer?.customer_code || `CUS_demo_${payment.userId.slice(0, 8)}`,
      paystackSubscriptionCode: paystackData.subscription?.subscription_code || `SUB_demo_${payment.reference.slice(-8)}`,
      paystackEmailToken: paystackData.subscription?.email_token || `email_${payment.reference.slice(-8)}`,
      subscriptionStartedAt: paidAt,
    },
  });

  const updated = makeMockPayment({
    ...payment,
    status: PAYMENT_STATUSES.SUCCESS,
    paidAt,
    metadata: {
      ...(payment.metadata || {}),
      verifiedAt: new Date().toISOString(),
      failureReason: null,
    },
    rawResponse: paystackData || payment.rawResponse,
    updatedAt: new Date(),
  });
  mockPayments.set(payment.reference, updated);
  return updated;
}

function markMockPayment(payment, status, data = {}) {
  const updated = makeMockPayment({
    ...payment,
    status,
    metadata: {
      ...(payment.metadata || {}),
      failureReason: data.failureReason ?? payment.metadata?.failureReason ?? null,
      ...(status === PAYMENT_STATUSES.SUCCESS ? { verifiedAt: new Date().toISOString() } : {}),
    },
    rawResponse: data.rawResponse ?? payment.rawResponse,
    updatedAt: new Date(),
  });
  mockPayments.set(payment.reference, updated);
  return updated;
}

function paymentCreateData(data) {
  const allowed = [
    'reference',
    'userId',
    'providerId',
    'plan',
    'amount',
    'currency',
    'status',
    'channel',
    'authorizationUrl',
    'accessCode',
    'paystackId',
    'customerCode',
    'subscriptionCode',
    'emailToken',
    'paidAt',
    'metadata',
    'rawResponse',
  ];

  return allowed.reduce((clean, key) => {
    if (data[key] !== undefined) clean[key] = data[key];
    return clean;
  }, {});
}

function getCallbackUrl(req, reference) {
  const requestedReturnUrl = String(req.body?.returnUrl || '').trim();
  const configured = paystackCallbackUrl || '';
  const fallbackBase = (frontendUrl || appUrl || 'http://localhost:5173').replace(/\/$/, '');
  const base = /^https?:\/\//i.test(requestedReturnUrl)
    ? requestedReturnUrl.replace(/\/$/, '')
    : /^https?:\/\//i.test(configured)
      ? configured.replace(/\/$/, '')
      : `${fallbackBase}/dashboard`;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}reference=${encodeURIComponent(reference)}`;
}

function paystackRequest(method, path, payload = null) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : null;
    const req = https.request({
      hostname: 'api.paystack.co',
      path,
      method,
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
      },
    }, (response) => {
      let raw = '';
      response.on('data', (chunk) => { raw += chunk; });
      response.on('end', () => {
        try {
          const data = raw ? JSON.parse(raw) : {};
          if (response.statusCode >= 400 || data.status === false) {
            const err = new Error(data.message || `Paystack request failed (${response.statusCode})`);
            err.data = data;
            err.statusCode = response.statusCode;
            reject(err);
            return;
          }
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getProviderForUser(userId) {
  return prisma.providerProfile.findUnique({
    where: { userId },
    include: { user: { select: { email: true, name: true } } },
  });
}

function getMockInstructions(reference, amount) {
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
  return {
    bankName: 'Paystack Test Bank',
    accountName: 'The Parentals Demo Collections',
    accountNumber: '0001234567',
    amount,
    currency: 'ZAR',
    reference,
    expiresAt: expiresAt.toISOString(),
  };
}

function getMockOutcome(req, method) {
  const requested = String(req.body?.demoOutcome || req.query?.demoOutcome || '').toUpperCase();
  if ([PAYMENT_STATUSES.SUCCESS, PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.FAILED, PAYMENT_STATUSES.CANCELLED, PAYMENT_STATUSES.EXPIRED].includes(requested)) {
    return requested;
  }
  return method === 'bank' ? PAYMENT_STATUSES.PENDING : PAYMENT_STATUSES.SUCCESS;
}

function mapPaystackStatus(status) {
  if (status === 'success') return PAYMENT_STATUSES.SUCCESS;
  if (status === 'failed') return PAYMENT_STATUSES.FAILED;
  if (status === 'abandoned') return PAYMENT_STATUSES.CANCELLED;
  if (status === 'reversed') return PAYMENT_STATUSES.REVERSED;
  return PAYMENT_STATUSES.PENDING;
}

async function activatePaidPlan(payment, paystackData = {}) {
  if (payment.status === PAYMENT_STATUSES.SUCCESS) return payment;

  const customerCode = paystackData.customer?.customer_code || payment.customerCode || null;
  const subscriptionCode = paystackData.subscription?.subscription_code || payment.subscriptionCode || null;
  const emailToken = paystackData.subscription?.email_token || payment.emailToken || null;
  const paidAt = paystackData.paid_at ? new Date(paystackData.paid_at) : new Date();

  return prisma.$transaction(async (tx) => {
    const latest = await tx.paymentTransaction.findUnique({ where: { reference: payment.reference } });
    if (latest?.status === PAYMENT_STATUSES.SUCCESS) return latest;

    const updatedPayment = await tx.paymentTransaction.update({
      where: { reference: payment.reference },
      data: {
        status: PAYMENT_STATUSES.SUCCESS,
        paystackId: paystackData.id ? String(paystackData.id) : payment.paystackId,
        customerCode,
        subscriptionCode,
        emailToken,
        paidAt,
        metadata: {
          ...(payment.metadata || {}),
          verifiedAt: new Date().toISOString(),
          failureReason: null,
        },
        rawResponse: paystackData || payment.rawResponse,
      },
    });

    await tx.providerProfile.update({
      where: { userId: payment.userId },
      data: {
        listingPlan: payment.plan,
        requestedPlan: null,
        billingStatus: 'active',
        paystackCustomerCode: customerCode,
        paystackSubscriptionCode: subscriptionCode,
        paystackEmailToken: emailToken,
        subscriptionStartedAt: paidAt,
      },
    });

    return updatedPayment;
  });
}

async function markPayment(payment, status, data = {}) {
  return prisma.paymentTransaction.update({
    where: { reference: payment.reference },
    data: {
      status,
      metadata: {
        ...(payment.metadata || {}),
        failureReason: data.failureReason ?? payment.metadata?.failureReason ?? null,
        ...(status === PAYMENT_STATUSES.SUCCESS ? { verifiedAt: new Date().toISOString() } : {}),
      },
      rawResponse: data.rawResponse ?? payment.rawResponse,
    },
  });
}

function assertPaystackVerification({ data, payment, plan, userEmail }) {
  if (data.status !== 'success') {
    throw Object.assign(new Error(`Payment is ${data.status || 'not successful'}`), { paymentStatus: mapPaystackStatus(data.status) });
  }
  const providerReference = payment.metadata?.providerReference || payment.reference;
  if (data.reference !== providerReference && data.reference !== payment.reference) {
    throw new Error('Payment reference mismatch');
  }
  if (Number(data.amount) !== plan.amount || data.currency !== plan.currency) {
    throw new Error('Payment amount or currency mismatch');
  }
  const paystackEmail = String(data.customer?.email || '').toLowerCase();
  const metadataUserId = data.metadata?.userId || data.metadata?.user_id;
  if (metadataUserId && metadataUserId !== payment.userId) {
    throw new Error('Payment user metadata mismatch');
  }
  if (paystackEmail && userEmail && paystackEmail !== String(userEmail).toLowerCase()) {
    throw new Error('Payment customer email mismatch');
  }
}

router.post('/initialize', authMiddleware(['PROVIDER']), async (req, res) => {
  try {
    const planKey = String(req.body?.plan || '').toLowerCase();
    const method = String(req.body?.method || req.body?.channel || '').toLowerCase();
    const plan = PLANS[planKey];
    if (!plan) return jsonResponse(res, 400, { success: false, message: 'Unsupported payment plan' });
    if (!METHOD_CHANNELS[method]) return jsonResponse(res, 400, { success: false, message: 'Please choose card, bank transfer, or EFT' });

    const provider = await getProviderForUser(req.user.id);
    if (!provider) return jsonResponse(res, 404, { success: false, message: 'Provider profile not found' });

    const internalReference = makeReference(req.user.id, planKey, 'par');
    const reference = internalReference;
    const callbackUrl = getCallbackUrl(req, reference);
    const demoOutcome = getMockOutcome(req, method);
    const expiresAt = method === 'bank' ? new Date(Date.now() + 20 * 60 * 1000).toISOString() : null;
    const metadata = {
      userId: req.user.id,
      providerId: provider.id,
      plan: planKey,
      product: plan.name,
      paymentMethod: method,
      internalReference,
      providerReference: reference,
      providerName: isMockMode() ? 'paystack-mock' : 'paystack',
      expiresAt,
      demoOutcome: isMockMode() ? demoOutcome : undefined,
    };

    await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: { requestedPlan: planKey, billingStatus: 'pending' },
    });

    const basePayment = {
      reference,
      userId: req.user.id,
      providerId: provider.id,
      plan: planKey,
      amount: plan.amount,
      currency: plan.currency,
      status: method === 'bank' ? PAYMENT_STATUSES.PENDING : PAYMENT_STATUSES.INITIALIZED,
      channel: METHOD_CHANNELS[method][0],
      metadata,
    };

    if (isMockMode()) {
      const instructions = method === 'bank' ? getMockInstructions(reference, plan.amount) : null;
      const payment = makeMockPayment({
        ...basePayment,
        channel: method === 'bank' ? 'demo-bank-transfer' : `demo-${method}`,
        authorizationUrl: `${callbackUrl}&demo=1&demoOutcome=${encodeURIComponent(demoOutcome)}`,
        accessCode: `demo_${reference}`,
        metadata: { ...basePayment.metadata, instructions, providerName: 'paystack-mock' },
        rawResponse: { demo: true, demoOutcome },
      });
      mockPayments.set(reference, payment);

      return res.json({
        success: true,
        mode: 'mock',
        testMode: true,
        message: 'Mock Paystack test transaction created. No real charge will be made.',
        payment: safePayment(payment),
        authorizationUrl: payment.authorizationUrl,
        reference: payment.reference,
      });
    }

    if (isLiveMode() && !paystackSecretKey.startsWith('sk_live_')) {
      return jsonResponse(res, 400, { success: false, message: 'Live payment mode requires a Paystack live secret key.' });
    }

    const payload = {
      email: provider.user?.email || provider.inquiryEmail,
      amount: plan.amount,
      currency: plan.currency,
      reference,
      callback_url: callbackUrl,
      channels: METHOD_CHANNELS[method],
      metadata,
      ...(paystackPlusPlanCode && method === 'card' ? { plan: paystackPlusPlanCode } : {}),
    };

    const paystack = await paystackRequest('POST', '/transaction/initialize', payload);
    const data = paystack.data || {};
    const payment = await prisma.paymentTransaction.create({
      data: paymentCreateData({
        ...basePayment,
        metadata: { ...basePayment.metadata, providerReference: data.reference || reference },
        authorizationUrl: data.authorization_url,
        accessCode: data.access_code,
        rawResponse: paystack,
      }),
    });

    return res.json({
      success: true,
      mode: paymentMode || 'test',
      testMode: !isLiveMode(),
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      reference: payment.reference,
      payment: safePayment(payment),
    });
  } catch (error) {
    console.error('POST /api/payments/initialize error:', error);
    return jsonResponse(res, 500, { success: false, message: error.message || 'Payment initialization failed' });
  }
});

router.get('/verify/:reference', authMiddleware(['PROVIDER']), async (req, res) => {
  try {
    let payment = isMockMode() ? mockPayments.get(req.params.reference) : null;
    if (!payment && !isMockMode()) payment = await prisma.paymentTransaction.findUnique({ where: { reference: req.params.reference } });
    if (!payment || payment.userId !== req.user.id) {
      return jsonResponse(res, 404, { success: false, message: 'Payment reference not found' });
    }

    const plan = PLANS[payment.plan];
    if (!plan) return jsonResponse(res, 400, { success: false, message: 'Unsupported payment plan' });
    if (payment.status === PAYMENT_STATUSES.SUCCESS) {
      return res.json({ success: true, payment: safePayment(payment), message: 'Payment already verified' });
    }

    const paymentExpiresAt = payment.metadata?.expiresAt || payment.metadata?.instructions?.expiresAt;
    if (paymentExpiresAt && new Date(paymentExpiresAt).getTime() < Date.now()) {
      const expired = await markPayment(payment, PAYMENT_STATUSES.EXPIRED, { failureReason: 'Payment instructions expired' });
      return jsonResponse(res, 402, { success: false, payment: safePayment(expired), message: 'Payment expired' });
    }

    if (payment.metadata?.providerName === 'paystack-mock' || String(payment.channel || '').startsWith('demo-')) {
      const outcome = String(payment.metadata?.demoOutcome || req.query.demoOutcome || '').toUpperCase() || PAYMENT_STATUSES.SUCCESS;
      if (outcome === PAYMENT_STATUSES.SUCCESS) {
        const updated = await activateMockPaidPlan(payment, {
          id: `demo_${payment.reference}`,
          reference: payment.reference,
          amount: payment.amount,
          currency: payment.currency,
          paid_at: new Date().toISOString(),
          channel: payment.channel,
          customer: { email: req.user.email, customer_code: `CUS_demo_${payment.userId.slice(0, 8)}` },
          subscription: { subscription_code: `SUB_demo_${payment.reference.slice(-8)}`, email_token: `email_${payment.reference.slice(-8)}` },
        });
        return res.json({ success: true, demo: true, payment: safePayment(updated), message: 'Demo payment verified and Parental Plus+ activated' });
      }
      const status = [PAYMENT_STATUSES.FAILED, PAYMENT_STATUSES.CANCELLED, PAYMENT_STATUSES.EXPIRED].includes(outcome)
        ? outcome
        : PAYMENT_STATUSES.PENDING;
      const updated = markMockPayment(payment, status, { failureReason: status === PAYMENT_STATUSES.PENDING ? null : `Demo ${status.toLowerCase()} outcome` });
      return jsonResponse(res, status === PAYMENT_STATUSES.PENDING ? 202 : 402, {
        success: false,
        demo: true,
        payment: safePayment(updated),
        message: status === PAYMENT_STATUSES.PENDING ? 'Payment is still pending' : safePayment(updated).failureReason,
      });
    }

    const paystackReference = payment.metadata?.providerReference || payment.reference;
    const paystack = await paystackRequest('GET', `/transaction/verify/${encodeURIComponent(paystackReference)}`);
    const data = paystack.data || {};
    try {
      assertPaystackVerification({ data, payment, plan, userEmail: req.user.email });
    } catch (verifyError) {
      const status = verifyError.paymentStatus || PAYMENT_STATUSES.FAILED;
      const updated = await markPayment(payment, status, { failureReason: verifyError.message, rawResponse: paystack });
      return jsonResponse(res, status === PAYMENT_STATUSES.PENDING ? 202 : 402, { success: false, payment: safePayment(updated), message: verifyError.message });
    }

    const updated = await activatePaidPlan(payment, data);
    return res.json({ success: true, demo: false, payment: safePayment(updated), message: 'Payment verified and Parental Plus+ activated' });
  } catch (error) {
    console.error('GET /api/payments/verify/:reference error:', error);
    return jsonResponse(res, 500, { success: false, message: error.message || 'Payment verification failed' });
  }
});

router.get('/:reference/status', authMiddleware(['PROVIDER']), async (req, res) => {
  try {
    let payment = isMockMode() ? mockPayments.get(req.params.reference) : null;
    if (!payment && !isMockMode()) payment = await prisma.paymentTransaction.findUnique({ where: { reference: req.params.reference } });
    if (!payment || payment.userId !== req.user.id) {
      return jsonResponse(res, 404, { success: false, message: 'Payment reference not found' });
    }
    return res.json({ success: true, payment: safePayment(payment) });
  } catch (error) {
    console.error('GET /api/payments/:reference/status error:', error);
    return jsonResponse(res, 500, { success: false, message: 'Could not load payment status' });
  }
});

router.post('/mock/:reference/outcome', authMiddleware(['PROVIDER']), async (req, res) => {
  try {
    if (!isMockMode()) return jsonResponse(res, 403, { success: false, message: 'Mock outcomes are only available in mock mode' });
    const status = String(req.body?.status || '').toUpperCase();
    if (![PAYMENT_STATUSES.SUCCESS, PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.FAILED, PAYMENT_STATUSES.CANCELLED, PAYMENT_STATUSES.EXPIRED].includes(status)) {
      return jsonResponse(res, 400, { success: false, message: 'Unsupported mock status' });
    }
    let payment = mockPayments.get(req.params.reference);
    if (!payment && !isMockMode()) payment = await prisma.paymentTransaction.findUnique({ where: { reference: req.params.reference } });
    if (!payment || payment.userId !== req.user.id) return jsonResponse(res, 404, { success: false, message: 'Payment reference not found' });
    const updated = markMockPayment(payment, status === PAYMENT_STATUSES.SUCCESS ? PAYMENT_STATUSES.PROCESSING : status, {
      failureReason: [PAYMENT_STATUSES.FAILED, PAYMENT_STATUSES.CANCELLED, PAYMENT_STATUSES.EXPIRED].includes(status) ? `Demo ${status.toLowerCase()} outcome` : null,
    });
    updated.metadata = { ...(updated.metadata || {}), demoOutcome: status };
    mockPayments.set(updated.reference, updated);
    return res.json({ success: true, payment: safePayment(updated) });
  } catch (error) {
    console.error('POST /api/payments/mock/:reference/outcome error:', error);
    return jsonResponse(res, 500, { success: false, message: 'Could not update mock outcome' });
  }
});

router.post('/cancel', authMiddleware(['PROVIDER']), async (req, res) => {
  try {
    const provider = await getProviderForUser(req.user.id);
    if (!provider) return jsonResponse(res, 404, { success: false, message: 'Provider profile not found' });

    if (provider.paystackSubscriptionCode && provider.paystackEmailToken && isPaystackConfigured()) {
      await paystackRequest('POST', '/subscription/disable', {
        code: provider.paystackSubscriptionCode,
        token: provider.paystackEmailToken,
      });
    }

    const updated = await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: {
        listingPlan: 'free',
        requestedPlan: null,
        billingStatus: 'cancelled',
        paystackSubscriptionCode: null,
        paystackEmailToken: null,
        nextBillingAt: null,
      },
    });

    return res.json({ success: true, profile: updated, message: 'Plan changed to Community Member' });
  } catch (error) {
    console.error('POST /api/payments/cancel error:', error);
    return jsonResponse(res, 500, { success: false, message: error.message || 'Could not cancel subscription' });
  }
});

router.get('/history', authMiddleware(['PROVIDER']), async (req, res) => {
  try {
    const payments = await prisma.paymentTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
    return res.json({ success: true, payments: payments.map(safePayment) });
  } catch (error) {
    console.error('GET /api/payments/history error:', error);
    return jsonResponse(res, 500, { success: false, message: 'Could not load payment history' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const signature = req.headers['x-paystack-signature'];
    const expected = crypto.createHmac('sha512', paystackSecretKey).update(rawBody).digest('hex');

    if (!signature || signature !== expected) {
      return jsonResponse(res, 401, { success: false, message: 'Invalid Paystack signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const data = event.data || {};
    const reference = data.reference;

    if (event.event === 'charge.success' && reference) {
      const payment = await prisma.paymentTransaction.findFirst({ where: { reference } });
      const plan = payment ? PLANS[payment.plan] : null;
      if (payment && plan) {
        try {
          assertPaystackVerification({ data, payment, plan, userEmail: data.customer?.email });
          await activatePaidPlan(payment, data);
        } catch (error) {
          await markPayment(payment, PAYMENT_STATUSES.FAILED, { failureReason: error.message, rawResponse: event });
        }
      }
    }

    if (['charge.failed', 'transfer.failed'].includes(event.event) && reference) {
      await prisma.paymentTransaction.updateMany({
        where: { reference },
        data: {
          status: PAYMENT_STATUSES.FAILED,
          metadata: { failureReason: data.gateway_response || data.message || 'Payment failed' },
          rawResponse: event,
        },
      });
    }

    if (['charge.reversed', 'transfer.reversed'].includes(event.event) && reference) {
      await prisma.paymentTransaction.updateMany({
        where: { reference },
        data: { status: PAYMENT_STATUSES.REVERSED, metadata: { failureReason: 'Payment was reversed' }, rawResponse: event },
      });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('POST /api/payments/webhook error:', error);
    return jsonResponse(res, 500, { success: false, message: 'Webhook processing failed' });
  }
});

module.exports = router;
