const jwt = require('jsonwebtoken');
const local = require('../config/local_store');
const db = require('../config/database');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

/**
 * Middleware: authenticate JWT AND verify the user has role ADMIN.
 * We re-fetch the user from the store to ensure the role hasn't been revoked
 * since the token was issued.
 */
async function adminOnly(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }

  // Re-fetch role from store so a revoked/downgraded admin can't reuse an old token
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
    console.error('adminOnly middleware error:', err.message);
    return res.status(500).json({ error: 'server error' });
  }
}

module.exports = adminOnly;
