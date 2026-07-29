// backend/src/routes/auth.js
// Handles register, login (including hard-coded admin), /me, and /logout
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const prisma  = require('../db');

const JWT_SECRET  = process.env.JWT_SECRET  || 'sah_secret_key_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';


const ADMIN_EMAIL    = (process.env.ADMIN_EMAIL    || 'admin@sahomeschooling.co.za').toLowerCase();
const ADMIN_PASSWORD =  process.env.ADMIN_PASSWORD || 'Admin2026!';
const ADMIN_NAME     =  process.env.ADMIN_NAME     || 'SA Homeschooling Admin';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.error?.message || 'Identity provider rejected the token.');
  return data;
}

async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google sign-in is not configured.');

  const profile = await fetchJson(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );
  if (profile.aud !== clientId || profile.email_verified !== 'true') {
    throw new Error('Google could not verify this email address.');
  }
  return { email: profile.email, name: profile.name, providerId: profile.sub };
}

async function verifyFacebookToken(accessToken) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) throw new Error('Facebook sign-in is not configured.');

  const debug = await fetchJson(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`
  );
  if (!debug.data?.is_valid || String(debug.data.app_id) !== String(appId)) {
    throw new Error('Facebook could not verify this sign-in.');
  }

  const profile = await fetchJson(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!profile.email) {
    throw new Error('Your Facebook account did not provide an email address. Please continue with email.');
  }
  return { email: profile.email, name: profile.name, providerId: profile.id };
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'PROVIDER', name, accountType } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const trimmedEmail = email.trim().toLowerCase();
    const requestedRole = String(role).toUpperCase();
    const safeRole = ['PROVIDER', 'USER'].includes(requestedRole) ? requestedRole : null;
    if (!safeRole)
      return res.status(400).json({ message: 'Invalid account role.' });

    // Block anyone from registering the admin email
    if (trimmedEmail === ADMIN_EMAIL)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await prisma.user.create({
      data: {
        email:       trimmedEmail,
        password:    hashed,
        role:        safeRole,
        name:        name        || null,
        accountType: accountType || 'Individual Provider',
      },
    });

    console.log(`[AUTH] REGISTER: ${trimmedEmail} (${user.role})`);

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name, accountType: user.accountType },
    });
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// POST /api/auth/social — verify a provider token, then sign in or create a parent account.
router.post('/social', async (req, res) => {
  try {
    const provider = String(req.body.provider || '').toLowerCase();
    const providerToken = req.body.credential || req.body.accessToken;
    if (!providerToken || !['google', 'facebook'].includes(provider)) {
      return res.status(400).json({ message: 'A supported social sign-in token is required.' });
    }

    const profile = provider === 'google'
      ? await verifyGoogleCredential(providerToken)
      : await verifyFacebookToken(providerToken);
    const email = String(profile.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'The social account did not provide an email address.' });
    if (email === ADMIN_EMAIL) return res.status(403).json({ message: 'This account cannot use social sign-in.' });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(randomPassword, 10),
          role: 'USER',
          name: profile.name || null,
          accountType: 'parent',
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          ...(!user.name && profile.name ? { name: profile.name } : {}),
        },
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return res.json({
      message: 'Social sign-in successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/social error:', error.message);
    return res.status(401).json({ message: error.message || 'Social sign-in failed.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const trimmedEmail = email.trim().toLowerCase();

    // ── Admin shortcut — checked BEFORE the database ─────────────────────────
    // The admin account lives only in environment variables / this file.
    // No database row is required. The JWT userId is set to the literal string
    // 'admin' so that /api/auth/me can identify it without a DB lookup.
    // ─────────────────────────────────────────────────────────────────────────
    if (trimmedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = signToken({ userId: 'admin', email: trimmedEmail, role: 'ADMIN' });
      console.log(`[AUTH] LOGIN (admin): ${trimmedEmail}`);
      return res.json({
        message: 'Login successful',
        token,
        user: { id: 'admin', email: trimmedEmail, role: 'ADMIN', name: ADMIN_NAME },
      });
    }

    // ── Normal DB-backed login ────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        providerProfile: {
          select: {
            listingPlan: true,
            requestedPlan: true,
            billingStatus: true,
            status: true,
            profilePhoto: true,
          },
        },
      },
    });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    console.log(`[AUTH] LOGIN: ${trimmedEmail} (${user.role})`);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        accountType: user.accountType,
        plan: user.providerProfile?.listingPlan,
        requestedPlan: user.providerProfile?.requestedPlan,
        billingStatus: user.providerProfile?.billingStatus,
        status: user.providerProfile?.status?.toLowerCase(),
        profilePhoto: user.providerProfile?.profilePhoto,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/auth/me  — verify token, return current user
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.slice(7);
    let decoded;
    try { decoded = jwt.verify(token, JWT_SECRET); }
    catch { return res.status(401).json({ message: 'Invalid or expired token' }); }

    // Admin virtual user — no DB row exists
    if (decoded.userId === 'admin') {
      return res.json({ id: 'admin', email: decoded.email, role: 'ADMIN', name: ADMIN_NAME });
    }

    const user = await prisma.user.findUnique({
      where:  { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        accountType: true,
        lastLogin: true,
        providerProfile: {
          select: {
            listingPlan: true,
            requestedPlan: true,
            billingStatus: true,
            status: true,
            profilePhoto: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      accountType: user.accountType,
      lastLogin: user.lastLogin,
      plan: user.providerProfile?.listingPlan,
      requestedPlan: user.providerProfile?.requestedPlan,
      billingStatus: user.providerProfile?.billingStatus,
      status: user.providerProfile?.status?.toLowerCase(),
      profilePhoto: user.providerProfile?.profilePhoto,
    });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/users - admin account list for the dashboard
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        accountType: true,
        createdAt: true,
        lastLogin: true,
        providerProfile: {
          select: {
            status: true,
            listingPlan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const adminEntry = {
      id: 'admin',
      email: ADMIN_EMAIL,
      role: 'ADMIN',
      name: ADMIN_NAME,
      accountType: 'admin',
      createdAt: null,
      lastLogin: null,
    };

    return res.json({
      success: true,
      data: [
        adminEntry,
        ...dbUsers.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          name: u.name,
          accountType: u.accountType,
          createdAt: u.createdAt,
          registered: u.createdAt,
          lastLogin: u.lastLogin,
          status: u.providerProfile?.status?.toLowerCase(),
          plan: u.providerProfile?.listingPlan,
        })),
      ],
    });
  } catch (error) {
    console.error('GET /api/auth/users error:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/auth/logout  — stateless JWT, just acknowledge
// ─────────────────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  console.log('[AUTH] LOGOUT received');
  return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
