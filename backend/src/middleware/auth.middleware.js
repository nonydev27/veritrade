const jwt = require('jsonwebtoken');
const db = require('../config/database');
const local = require('../config/local_store');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

/**
 * Middleware: authenticate a valid JWT.
 * Sets req.user = { id, phone, ...tokenPayload }
 */
function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

/**
 * Middleware: authenticate JWT AND verify the user has role ADMIN.
 * Re-fetches the user from the store so revoked admins can't reuse old tokens.
 */
async function authenticateAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }

  try {
    let user;
    if (useLocal) {
      user = await local.findUserById(payload.id);
    } else {
      const r = await db.query('SELECT id, role FROM users WHERE id=$1', [payload.id]);
      user = r.rows[0];
    }
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'admin access required' });
    }
    req.user = { ...payload, role: user.role };
    next();
  } catch (err) {
    console.error('authenticateAdmin middleware error:', err.message);
    return res.status(500).json({ error: 'server error' });
  }
}

/**
 * Middleware: require that the authenticated user has passed KYC.
 * Must be used after authenticate().
 */
async function requireKyc(req, res, next) {
  try {
    let user;
    if (useLocal) {
      user = await local.findUserById(req.user.id);
    } else {
      const r = await db.query('SELECT id, kyc_status FROM users WHERE id=$1', [req.user.id]);
      user = r.rows[0];
    }
    if (!user) return res.status(401).json({ error: 'user not found' });
    if (user.kyc_status !== 'VERIFIED') {
      return res.status(403).json({
        error: 'KYC verification required',
        kyc_status: user.kyc_status || 'PENDING',
      });
    }
    next();
  } catch (err) {
    console.error('requireKyc middleware error:', err.message);
    return res.status(500).json({ error: 'server error' });
  }
}

module.exports = authenticate;
// Named exports for consumers that prefer explicit imports
module.exports.authenticate     = authenticate;
module.exports.authenticateAdmin = authenticateAdmin;
module.exports.requireKyc       = requireKyc;

