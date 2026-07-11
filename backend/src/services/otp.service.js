const bcrypt = require('bcrypt');
const axios = require('axios');

// In-memory OTP store: phone → { hash, expiresAt, attempts }
// For production this should be Redis. For now it's a Map that lives in process memory.
const otpStore = new Map();

const OTP_TTL_MS      = parseInt(process.env.OTP_TTL_MS      || String(10 * 60 * 1000)); // 10 minutes
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS || '5');

/**
 * Generate a 6-digit OTP, hash it, and store it for the given phone number.
 * Returns the plain OTP — caller decides whether to log it (dev) or send via SMS (prod).
 */
async function generateOtp(phone) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const hash = await bcrypt.hash(otp, 10);
  otpStore.set(phone, {
    hash,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  return otp;
}

/**
 * Verify a submitted OTP against the stored hash.
 * Returns { valid: true } on success or { valid: false, error: string } on failure.
 */
async function verifyOtp(phone, submittedOtp) {
  const record = otpStore.get(phone);

  if (!record) return { valid: false, error: 'No OTP requested for this number' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, error: 'OTP has expired — request a new one' };
  }
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(phone);
    return { valid: false, error: 'Too many incorrect attempts — request a new OTP' };
  }

  const match = await bcrypt.compare(String(submittedOtp), record.hash);
  if (!match) {
    record.attempts += 1;
    return { valid: false, error: `Incorrect OTP (${MAX_OTP_ATTEMPTS - record.attempts} attempts remaining)` };
  }

  // Valid — consume the OTP (one-time use)
  otpStore.delete(phone);
  return { valid: true };
}

/**
 * Send OTP via SMS.
 * In dev mode (no SMS_API_KEY) the OTP is NOT sent and the function returns the plain
 * OTP so the caller can include it in the response for testing.
 * In production, swap the body of this function for your SMS provider (Twilio, Hubtel, etc.)
 */
async function sendOtpSms(phone, otp) {
  const apiKey = process.env.SMS_API_KEY || '';
  const devMode = !apiKey;

  if (devMode) {
    console.log(`[OTP DEV] ${phone} → ${otp}`);
    return { sent: false, devMode: true, otp }; // Return OTP in dev for testing
  }

  // Production: Hubtel SMS (Ghana)
  const senderId = process.env.SMS_SENDER_ID || 'VeriTrade';
  const clientId = process.env.HUBTEL_CLIENT_ID || '';
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET || '';

  try {
    const resp = await axios.get('https://smsc.hubtel.com/v1/messages/send', {
      params: {
        clientsecret: clientSecret,
        clientid: clientId,
        from: senderId,
        to: phone,
        content: `Your VeriTrade verification code is ${otp}. Expires in 10 minutes. Do not share this code.`,
      },
      timeout: 10000,
    });
    return { sent: true, devMode: false, response: resp.data };
  } catch (err) {
    console.error('[OTP SMS error]', err.message);
    throw new Error('Failed to send OTP SMS');
  }
}

module.exports = { generateOtp, verifyOtp, sendOtpSms };
