const { verifyWebhookSignature } = require('../services/moolre.service');
const db = require('../config/database');
const local = require('../config/local_store');

// Expects raw body signature header 'x-moolre-signature'
async function webhook(req, res){
  try{
    const sig = req.headers['x-moolre-signature'];
    const verified = verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), sig);
    if(!verified) return res.status(400).json({ error: 'invalid signature' });
    const payload = req.body;
    // Example payload handling: { transactionCode, status, amount }
    const { transactionCode, status } = payload;
    if(!transactionCode) return res.status(400).json({ error: 'missing transactionCode' });
    // Update transaction status accordingly (use local if DB not configured)
    if(!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass')){
      const t = await local.findTransactionByCode(transactionCode);
      if(!t) return res.status(404).json({ error: 'tx not found' });
      if(status === 'PAID') await local.updateTransactionStatus(t.id, 'PAID');
    }else{
      const tRes = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
      const t = tRes.rows[0];
      if(!t) return res.status(404).json({ error: 'tx not found' });
      if(status === 'PAID') await db.query('UPDATE transactions SET status=$1 WHERE id=$2', ['PAID', t.id]);
    }
    // respond 200 to webhook sender
    res.json({ ok: true });
  }catch(err){
    console.error(err.message || err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = { webhook };
