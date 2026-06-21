const axios = require('axios');
const crypto = require('crypto');

async function collectPayment(data){
  const url = process.env.MOOLRE_URL || 'https://api.moolre.example/collect';
  const resp = await axios.post(url, data, { headers: { 'Authorization': `Bearer ${process.env.MOOLRE_API_KEY}` } }).catch(e => ({ data: { error: e.message } }));
  return resp.data;
}

function verifyWebhookSignature(rawBody, signature){
  const secret = process.env.MOOLRE_WEBHOOK_SECRET || '';
  if(!secret || !signature) return false;
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

module.exports = { collectPayment, verifyWebhookSignature };
