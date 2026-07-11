const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const local = require('../config/local_store');
const { generateOtp, verifyOtp, sendOtpSms } = require('../services/otp.service');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

async function register(req, res){
  try{
    const { name, phone, password, role } = req.body;
    if(!phone || !password) return res.status(400).json({ error: 'phone and password required' });
    const hashed = await bcrypt.hash(password, 10);
    if(useLocal){
      const exists = await local.findUserByPhone(phone);
      if(exists) return res.status(400).json({ error: 'phone already registered' });
      const user = await local.addUser({ name, phone, password_hash: hashed, role });
      const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return res.json({ user, token });
    }
    const exists = await db.query('SELECT id FROM users WHERE phone=$1', [phone]);
    if(exists.rows.length) return res.status(400).json({ error: 'phone already registered' });
    const result = await db.query(
      'INSERT INTO users(name, phone, password_hash, role, created_at) VALUES($1,$2,$3,$4,NOW()) RETURNING id, name, phone, role, created_at',
      [name, phone, hashed, role || 'BUYER']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ user, token });
  }catch(err){
    console.error(err.message || err);
    res.status(500).json({ error: 'server error' });
  }
}

async function login(req, res){
  try{
    const { phone, password } = req.body;
    if(!phone || !password) return res.status(400).json({ error: 'phone and password required' });
    if(useLocal){
      const user = await local.findUserByPhone(phone);
      if(!user) return res.status(400).json({ error: 'invalid credentials' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if(!ok) return res.status(400).json({ error: 'invalid credentials' });
      const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
    }
    const result = await db.query('SELECT id, name, phone, password_hash, role FROM users WHERE phone=$1', [phone]);
    const user = result.rows[0];
    if(!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if(!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
  }catch(err){
    console.error(err.message || err);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/auth/request-otp
 * Generate and send an OTP to the given phone number.
 * The phone must belong to a registered user.
 * In dev mode (no SMS_API_KEY), the OTP is returned in the response.
 * Body: { phone }
 */
async function requestOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    // Phone must belong to an existing user
    let user;
    if (useLocal) {
      user = await local.findUserByPhone(phone);
    } else {
      const r = await db.query('SELECT id, phone FROM users WHERE phone=$1', [phone]);
      user = r.rows[0];
    }
    if (!user) return res.status(404).json({ error: 'phone number not registered' });

    const otp = await generateOtp(phone);
    const smsResult = await sendOtpSms(phone, otp);

    // In dev mode include the OTP in the response so frontend/testing works without SMS
    if (smsResult.devMode) {
      return res.json({
        success: true,
        message: 'OTP generated (dev mode — no SMS sent)',
        otp: smsResult.otp, // Only present in dev
        expiresInMinutes: 10,
      });
    }

    res.json({ success: true, message: 'OTP sent via SMS', expiresInMinutes: 10 });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'failed to send OTP' });
  }
}

/**
 * POST /api/auth/verify-otp
 * Verify the OTP and return a JWT if correct.
 * Body: { phone, otp }
 */
async function verifyOtpHandler(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'phone and otp required' });

    const result = await verifyOtp(phone, otp);
    if (!result.valid) return res.status(400).json({ error: result.error });

    // OTP verified — fetch user and issue JWT
    let user;
    if (useLocal) {
      user = await local.findUserByPhone(phone);
    } else {
      const r = await db.query('SELECT id, name, phone, role FROM users WHERE phone=$1', [phone]);
      user = r.rows[0];
    }
    if (!user) return res.status(404).json({ error: 'user not found' });

    // Mark phone as verified
    if (useLocal) {
      await local.updateUserFields(user.id, { phone_verified: true });
    } else {
      await db.query('UPDATE users SET phone_verified=true WHERE id=$1', [user.id]);
    }

    const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({
      success: true,
      message: 'Phone verified',
      token,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = { register, login, requestOtp, verifyOtpHandler };
