// backend/src/index.js
const express = require('express');
const cors    = require('cors');
const { port } = require('./config');

const authRoutes         = require('./routes/authRoutes');
const providerRoutes     = require('./routes/providerRoutes');
const reviewRoutes       = require('./routes/reviewRoutes');
const featuredSlotRoutes = require('./routes/featuredSlotRoutes');
const statsRoutes        = require('./routes/statsRoutes');
const paymentRoutes      = require('./routes/paymentRoutes');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' })); // allow base64 profile photos

// ── Health check (used by Registration.js to detect if API is online) ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/providers',      providerRoutes);
app.use('/api/reviews',        reviewRoutes);
app.use('/api/featured-slots', featuredSlotRoutes);
app.use('/api/stats',          statsRoutes);
app.use('/api/payments',       paymentRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ success: false, error: 'Server error' });
});

const server = app.listen(port, () => {
  console.log(`\n✅  SA Homeschooling API running on http://localhost:${port}`);
  console.log(`\n   Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/users          (ADMIN)`);
  console.log(`   GET  /api/providers            (public)`);
  console.log(`   POST /api/providers            (public — registration)`);
  console.log(`   GET  /api/providers/:id        (public)`);
  console.log(`   PUT  /api/providers/:id        (ADMIN | PROVIDER)`);
  console.log(`   POST /api/providers/:id/approve (ADMIN)`);
  console.log(`   POST /api/providers/:id/reject  (ADMIN)`);
  console.log(`   GET  /api/stats                (ADMIN)`);
  console.log(`   GET  /api/reviews              (ADMIN)\n`);
  console.log(`   POST /api/payments/initialize  (PROVIDER)`);
  console.log(`   GET  /api/payments/verify/:ref (PROVIDER)`);
  console.log(`   POST /api/payments/webhook     (Paystack)\n`);
});

// Bound slow or abandoned connections so they cannot occupy resources forever.
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
server.keepAliveTimeout = 5_000;

async function shutdown(signal) {
  console.log(`[SERVER] ${signal} received; draining active requests.`);
  server.close(async () => {
    const prisma = require('./db');
    await prisma.$disconnect();
    process.exit(0);
  });

  // Do not hang indefinitely if a client never finishes its request.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server };
