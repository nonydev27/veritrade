const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes   = require('./routes/auth.routes');
const escrowRoutes = require('./routes/escrow.routes');
const ussdRoutes   = require('./routes/ussd.routes');
const moolreRoutes = require('./routes/moolre.routes');
const adminRoutes  = require('./routes/admin.routes');
const kycRoutes    = require('./routes/kyc.routes');
const { startExpiryJob } = require('./controllers/escrow.controller');
const { seedDevUsers } = require('./config/seed-dev-users');

const app = express();

// ─── CORS Configuration ──────────────────────────────────────────────────
// Allow all origins for development (including ngrok tunnel)
const corsOptions = {
  origin: '*',  // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ─── Raw Body for Webhook Verification ──────────────────────────────────
app.use(express.json({ 
  verify: (req, _res, buf) => { 
    req.rawBody = buf.toString(); 
  } 
}));

// ─── Rate Limiting ──────────────────────────────────────────────────────
// Strict limiter for auth endpoints — prevents brute-force and OTP spam
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 10,                    // max 10 requests per window per IP
  message: { error: 'Too many requests — please wait 15 minutes before trying again' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test', // Allow unlimited in test env
});

// General limiter for all other API routes — prevents API abuse
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1-minute window
  max: 100,             // max 100 requests per minute per IP
  message: { error: 'Too many requests — slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

// ─── Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',   authLimiter, authRoutes);
app.use('/api/escrow', apiLimiter,  escrowRoutes);
app.use('/api/ussd',   ussdRoutes);
app.use('/api/moolre', moolreRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/kyc',    apiLimiter,  kycRoutes);

// ─── Health Check ──────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('VeriTrade API Running ✓'));

// ─── Start Server ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, async () => {
  console.log(`🚀 Server started on http://${HOST}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  await seedDevUsers();
  startExpiryJob();
});
