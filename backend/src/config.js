require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  appUrl: process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
  paymentMode: String(process.env.PAYMENT_MODE || 'mock').toLowerCase(),
  paystackCallbackUrl: process.env.PAYSTACK_CALLBACK_URL || '',
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  paystackPlusPlanCode: process.env.PAYSTACK_PLUS_PLAN_CODE || '',
  parentalPlusPrice: {
    plan: 'pro',
    name: 'Parental Plus+',
    amount: 14900,
    currency: 'ZAR',
    billing: 'monthly',
  },
};
