const axios = require('axios');
const crypto = require('crypto');

const BASE = process.env.MOOLRE_URL || 'https://api.moolre.com/v1';
const KEY  = process.env.MOOLRE_API_KEY || '';

/**
 * Initiate a mobile money collection request via Moolre.
 * @param {Object} params
 * @param {string} params.phone      - Customer's phone number e.g. "0244000001"
 * @param {number} params.amount     - Amount in GHS
 * @param {string} params.reference  - Your transaction code (for reconciliation)
 * @param {string} params.narration  - Description shown to customer e.g. "Escrow: iPhone 15"
 * @param {string} params.network    - "MTN" | "VODAFONE" | "AIRTELTIGO"
 * @param {string} params.callbackUrl - Your webhook URL to receive payment confirmation
 */
async function initiateCollection({ phone, amount, reference, narration, network, callbackUrl }) {
  const payload = {
    phone,
    amount,
    currency: 'GHS',
    reference,
    narration,
    network,
    callback_url: callbackUrl,
  };
  const resp = await axios.post(`${BASE}/collections/initiate`, payload, {
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
  return resp.data;
}

/**
 * Check payment status by reference.
 */
async function checkStatus(reference) {
  const resp = await axios.get(`${BASE}/collections/status/${reference}`, {
    headers: { Authorization: `Bearer ${KEY}` },
    timeout: 10000,
  });
  return resp.data;
}

/**
 * Verify that an incoming webhook was signed by Moolre (HMAC-SHA256).
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.MOOLRE_WEBHOOK_SECRET || '';
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

module.exports = { initiateCollection, checkStatus, verifyWebhookSignature };
