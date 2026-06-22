const { initiateCollection, checkStatus, verifyWebhookSignature } = require('../services/moolre.service');
const local = require('../config/local_store');
const db = require('../config/database');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

/**
 * POST /api/moolre/pay
 * Initiates a Moolre mobile money collection for a transaction.
 * Body: { transactionCode, phone, network }
 */
async function initiatePay(req, res) {
  try {
    const { transactionCode, phone, network } = req.body;
    if (!transactionCode || !phone) return res.status(400).json({ error: 'transactionCode and phone required' });

    // Find the transaction
    let tx;
    if (useLocal) {
      tx = await local.findTransactionByCode(transactionCode);
    } else {
      const r = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
      tx = r.rows[0];
    }
    if (!tx) return res.status(404).json({ error: 'transaction not found' });
    if (tx.status !== 'PENDING') return res.status(400).json({ error: `cannot pay — status is ${tx.status}` });

    const callbackUrl = `${process.env.APP_BASE_URL || 'https://your-backend.railway.app'}/api/moolre/webhook`;

    const result = await initiateCollection({
      phone,
      amount: tx.amount,
      reference: tx.transaction_code,
      narration: `VeriTrade Escrow: ${tx.item_description}`,
      network: network || 'MTN',
      callbackUrl,
    });

    res.json({ success: true, moolre: result });
  } catch (err) {
    console.error('Moolre initiate error:', err.message);
    res.status(500).json({ error: 'payment initiation failed', detail: err.message });
  }
}

/**
 * GET /api/moolre/status/:reference
 * Check payment status by transaction code.
 */
async function status(req, res) {
  try {
    const result = await checkStatus(req.params.reference);
    res.json(result);
  } catch (err) {
    console.error('Moolre status error:', err.message);
    res.status(500).json({ error: 'status check failed' });
  }
}

/**
 * POST /api/moolre/webhook
 * Called by Moolre when a payment is confirmed.
 * Moolre signs the body with HMAC-SHA256 using your MOOLRE_WEBHOOK_SECRET.
 */
async function webhook(req, res) {
  try {
    const sig = req.headers['x-moolre-signature'];
    const verified = verifyWebhookSignature(req.rawBody || JSON.stringify(req.body), sig);
    if (!verified) {
      console.warn('Moolre webhook: invalid signature');
      return res.status(400).json({ error: 'invalid signature' });
    }

    const { reference, status: payStatus, amount } = req.body;
    if (!reference) return res.status(400).json({ error: 'missing reference' });

    // Only mark as PAID when Moolre confirms success
    if (payStatus === 'SUCCESS' || payStatus === 'PAID') {
      if (useLocal) {
        const t = await local.findTransactionByCode(reference);
        if (t && t.status === 'PENDING') await local.updateTransactionStatus(t.id, 'PAID');
      } else {
        const r = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [reference]);
        const t = r.rows[0];
        if (t && t.status === 'PENDING') {
          await db.query('UPDATE transactions SET status=$1 WHERE id=$2', ['PAID', t.id]);
          await db.query(
            'INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())',
            [t.id, amount || t.amount, 'CREDIT', 'Moolre MoMo payment confirmed']
          );
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Moolre webhook error:', err.message);
    res.status(500).json({ error: 'webhook processing failed' });
  }
}

module.exports = { initiatePay, status, webhook };
