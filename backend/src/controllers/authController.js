// backend/src/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const { jwtSecret }    = require('../config');
const { sendError }    = require('../utils');

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
//  Hardcoded admin credentials
//  Email:    admin@sahomeschooling.co.za
//  Password: admin@123
// ─────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@sahomeschooling.co.za';
const ADMIN_PASSWORD = 'admin@123';

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/register
//  Creates a User row.
//  For PROVIDER registrations the Registration.js form sends
//  a second request to POST /api/providers — so we do NOT
//  try to create the providerProfile here.  That keeps the
//  two concerns cleanly separated and avoids schema mismatches.
// ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { email, password, name, role = 'PROVIDER', accountType } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required.');
  }

  try {
    // Block anyone trying to register with the hardcoded admin address
    if (email.toLowerCase().trim() === ADMIN_EMAIL) {
      return sendError(res, 409, 'This email address is reserved.');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) return sendError(res, 409, 'An account with this email already exists.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email:       email.toLowerCase().trim(),
        password:    hashedPassword,
        name:        name || null,
        role,                                          // 'PROVIDER' | 'USER'
        accountType: accountType || (role === 'USER' ? 'parent' : 'provider'),
        lastLogin:   new Date(),
      },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '1d' });

    console.log(`[AUTH] REGISTER | ${user.email} | ${user.role}`);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id:          user.id,
          email:       user.email,
          role:        user.role,
          name:        user.name,
          accountType: user.accountType,
        },
      },
      // Keep legacy shape so Registration.js can read userData.user.id
      user: {
        id:          user.id,
        email:       user.email,
        role:        user.role,
        name:        user.name,
        accountType: user.accountType,
      },
      message: 'Account created successfully.',
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err);
    sendError(res, 500, 'Registration failed. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login
//  Checks hardcoded admin first, then database users.
// ─────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required.');
  }

  try {
    // ── Hardcoded admin login ──
    if (email.toLowerCase().trim() === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return sendError(res, 401, 'Invalid credentials.');
      }

      const token = jwt.sign(
        { id: 'admin_hardcoded', role: 'ADMIN' },
        jwtSecret,
        { expiresIn: '1d' }
      );

      console.log(`[AUTH] LOGIN | ${ADMIN_EMAIL} | ADMIN (hardcoded)`);

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id:          'admin_hardcoded',
            email:       ADMIN_EMAIL,
            role:        'ADMIN',
            name:        'Administrator',
            accountType: 'admin',
          },
        },
        user: {
          id:          'admin_hardcoded',
          email:       ADMIN_EMAIL,
          role:        'ADMIN',
          name:        'Administrator',
          accountType: 'admin',
        },
      });
    }

    // ── Regular database user login ──
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) return sendError(res, 401, 'Invalid credentials.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendError(res, 401, 'Invalid credentials.');

    // Update lastLogin timestamp
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLogin: new Date() },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '1d' });

    console.log(`[AUTH] LOGIN | ${user.email} | ${user.role}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id:          user.id,
          email:       user.email,
          role:        user.role,
          name:        user.name,
          accountType: user.accountType,
        },
      },
      user: {
        id:          user.id,
        email:       user.email,
        role:        user.role,
        name:        user.name,
        accountType: user.accountType,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    sendError(res, 500, 'Login failed. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/auth/users
//  Returns all database users for the admin dashboard.
//  The hardcoded admin is injected at the top of the list.
// ─────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const dbUsers = await prisma.user.findMany({
      select: {
        id:          true,
        email:       true,
        role:        true,
        name:        true,
        accountType: true,
        createdAt:   true,
        lastLogin:   true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Prepend the hardcoded admin so it always shows in the dashboard
    const adminEntry = {
      id:          'admin_hardcoded',
      email:       ADMIN_EMAIL,
      role:        'ADMIN',
      name:        'Administrator',
      accountType: 'admin',
      createdAt:   null,
      lastLogin:   null,
    };

    res.json({ success: true, data: [adminEntry, ...dbUsers] });
  } catch (err) {
    console.error('[AUTH] getUsers error:', err);
    sendError(res, 500, 'Failed to fetch users.');
  }
};

module.exports = { register, login, getUsers };