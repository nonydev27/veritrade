const db = require('../config/database');
const local = require('../config/local_store');
const bcrypt = require('bcrypt');
const { disbursePayout } = require('../services/moolre.service');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

// Timeouts (configurable via env vars)
const ACCEPT_WINDOW_MS  = parseInt(process.env.ACCEPT_WINDOW_MS  || String(48 * 60 * 60 * 1000)); // 48h for seller to accept
const FUNDING_WINDOW_MS = parseInt(process.env.FUNDING_WINDOW_MS || String(24 * 60 * 60 * 1000)); // 24h for buyer to fund after accept

async function createEscrow(req, res) {
  try {
    const { item, amount, seller_phone } = req.body;
    if (!item || !amount || !seller_phone) return res.status(400).json({ error: 'missing fields' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const buyer_id = req.user?.id || null;
    // Seller has 48h to accept before the transaction auto-expires
    const expires_at = new Date(Date.now() + ACCEPT_WINDOW_MS).toISOString();
    if (useLocal) {
      const seller = await local.findUserByPhone(seller_phone);
      if (!seller) return res.status(404).json({ error: 'seller not found' });
      const tx = await local.addTransaction({ transaction_code: code, buyer_id, seller_id: seller.id, item_description: item, amount, status: 'PENDING', expires_at });
      return res.json({ transactionCode: code, transaction: tx });
    }
    const s = await db.query('SELECT id FROM users WHERE phone=$1', [seller_phone]);
    if (!s.rows.length) return res.status(404).json({ error: 'seller not found' });
    const result = await db.query(
      'INSERT INTO transactions(transaction_code, buyer_id, seller_id, item_description, amount, status, expires_at, created_at) VALUES($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *',
      [code, buyer_id, s.rows[0].id, item, amount, 'PENDING', expires_at]
    );
    res.json({ transactionCode: code, transaction: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

async function listTransactions(req, res) {
  try {
    const user_id = req.user?.id || null;
    if (useLocal) {
      const txs = await local.listTransactionsForUser(user_id);
      return res.json({ transactions: txs });
    }
    const result = await db.query(
      'SELECT * FROM transactions WHERE buyer_id=$1 OR seller_id=$1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/escrow/accept
 * Seller accepts a PENDING transaction → status becomes ACCEPTED.
 * Only the seller linked to the transaction may call this.
 */
async function sellerAccept(req, res) {
  try {
    const { transactionCode } = req.body;
    if (!transactionCode) return res.status(400).json({ error: 'transactionCode required' });

    const callerId = req.user?.id;

    if (useLocal) {
      const t = await local.findTransactionByCode(transactionCode);
      if (!t) return res.status(404).json({ error: 'transaction not found' });
      if (t.status !== 'PENDING') return res.status(400).json({ error: `cannot accept — status is ${t.status}` });
      if (t.seller_id !== callerId) return res.status(403).json({ error: 'only the assigned seller can accept this transaction' });

      const updated = await local.updateTransactionFields(t.id, {
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
        // Reset expiry: buyer now has 24h to fund
        expires_at: new Date(Date.now() + FUNDING_WINDOW_MS).toISOString(),
      });
      return res.json({ success: true, transaction: updated });
    }

    const tRes = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'transaction not found' });
    if (t.status !== 'PENDING') return res.status(400).json({ error: `cannot accept — status is ${t.status}` });
    if (t.seller_id !== callerId) return res.status(403).json({ error: 'only the assigned seller can accept this transaction' });

    const result = await db.query(
      'UPDATE transactions SET status=$1, accepted_at=NOW(), expires_at=NOW()+$2::interval WHERE id=$3 RETURNING *',
      ['ACCEPTED', '24 hours', t.id]
    );
    res.json({ success: true, transaction: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/escrow/reject
 * Seller rejects a PENDING transaction → status becomes REJECTED.
 * Only the seller linked to the transaction may call this.
 */
async function sellerReject(req, res) {
  try {
    const { transactionCode, reason } = req.body;
    if (!transactionCode) return res.status(400).json({ error: 'transactionCode required' });

    const callerId = req.user?.id;

    if (useLocal) {
      const t = await local.findTransactionByCode(transactionCode);
      if (!t) return res.status(404).json({ error: 'transaction not found' });
      if (t.status !== 'PENDING') return res.status(400).json({ error: `cannot reject — status is ${t.status}` });
      if (t.seller_id !== callerId) return res.status(403).json({ error: 'only the assigned seller can reject this transaction' });

      const updated = await local.updateTransactionFields(t.id, {
        status: 'REJECTED',
        rejected_at: new Date().toISOString(),
        reject_reason: reason || null,
      });
      return res.json({ success: true, transaction: updated });
    }

    const tRes = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'transaction not found' });
    if (t.status !== 'PENDING') return res.status(400).json({ error: `cannot reject — status is ${t.status}` });
    if (t.seller_id !== callerId) return res.status(403).json({ error: 'only the assigned seller can reject this transaction' });

    const result = await db.query(
      `UPDATE transactions
         SET status=$1, accepted_at=NULL,
             notes=COALESCE(notes || ' | ', '') || 'Rejected: ' || $2
       WHERE id=$3 RETURNING *`,
      ['REJECTED', reason || 'No reason given', t.id]
    );
    res.json({ success: true, transaction: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/escrow/pay — BLOCKED (Zero-Trust enforcement)
 * Direct payment mutations are forbidden per the VeriTrade Security Directive.
 * All financial state transitions (ACCEPTED → FUNDED) MUST be triggered exclusively
 * by verified Moolre webhook callbacks (/api/moolre/webhook).
 * Clients must call POST /api/moolre/pay to initiate mobile money collection.
 */
async function pay(req, res) {
  return res.status(403).json({
    error: 'Direct payment not allowed',
    message: 'Use POST /api/moolre/pay to initiate mobile money payment. Status will update automatically when Moolre confirms.',
    endpoint: '/api/moolre/pay',
    requiredFields: ['transactionCode', 'phone', 'network'],
  });
}

/**
 * POST /api/escrow/ship
 * Seller marks item as shipped. Server generates a 6-digit delivery PIN,
 * stores it hashed on the transaction, and returns the plain PIN to the seller.
 * The seller shares this PIN with the buyer out-of-band (SMS, WhatsApp, etc.).
 * Status: FUNDED → SHIPPED
 */
async function ship(req, res) {
  try {
    const { transactionCode } = req.body;
    if (!transactionCode) return res.status(400).json({ error: 'transactionCode required' });

    const callerId = req.user?.id;
    // Generate a 6-digit numeric PIN
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const pinHash = await bcrypt.hash(pin, 10);

    if (useLocal) {
      const t = await local.findTransactionByCode(transactionCode);
      if (!t) return res.status(404).json({ error: 'transaction not found' });
      if (t.status !== 'FUNDED') return res.status(400).json({ error: `cannot ship — status is ${t.status} (expected FUNDED)` });
      if (t.seller_id !== callerId) return res.status(403).json({ error: 'only the assigned seller can mark this as shipped' });

      await local.updateTransactionFields(t.id, {
        status: 'SHIPPED',
        shipped_at: new Date().toISOString(),
        delivery_pin_hash: pinHash,
      });
      // Return plain PIN to seller — they must share this with the buyer
      return res.json({
        success: true,
        message: 'Item marked as shipped. Share the delivery PIN with the buyer.',
        deliveryPin: pin,
        transactionCode,
      });
    }

    const tRes = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'transaction not found' });
    if (t.status !== 'FUNDED') return res.status(400).json({ error: `cannot ship — status is ${t.status} (expected FUNDED)` });
    if (t.seller_id !== callerId) return res.status(403).json({ error: 'only the assigned seller can mark this as shipped' });

    await db.query(
      'UPDATE transactions SET status=$1, shipped_at=NOW(), delivery_pin_hash=$2 WHERE id=$3',
      ['SHIPPED', pinHash, t.id]
    );
    return res.json({
      success: true,
      message: 'Item marked as shipped. Share the delivery PIN with the buyer.',
      deliveryPin: pin,
      transactionCode,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/escrow/confirm
 * Buyer confirms delivery by submitting the delivery PIN.
 * PIN is verified against the bcrypt hash stored on the transaction.
 * On success: SHIPPED → COMPLETED, ledger DEBIT written, Moolre payout triggered.
 */
async function confirm(req, res) {
  try {
    const { transactionCode, deliveryPin } = req.body;
    if (!transactionCode) return res.status(400).json({ error: 'transactionCode required' });
    if (!deliveryPin) return res.status(400).json({ error: 'deliveryPin required — ask the seller for the PIN' });

    if (useLocal) {
      const t = await local.findTransactionByCode(transactionCode);
      if (!t) return res.status(404).json({ error: 'not found' });
      if (t.status !== 'SHIPPED') return res.status(400).json({ error: `cannot confirm — status is ${t.status} (expected SHIPPED)` });
      if (!t.delivery_pin_hash) return res.status(500).json({ error: 'delivery PIN not set — contact support' });

      const pinValid = await bcrypt.compare(String(deliveryPin), t.delivery_pin_hash);
      if (!pinValid) return res.status(400).json({ error: 'incorrect delivery PIN' });

      // Mark completed and write ledger DEBIT
      const updated = await local.updateTransactionFields(t.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        delivery_pin_hash: null,
      });
      await local.addLedgerEntry({
        transaction_id: t.id,
        amount: -t.amount,
        type: 'DEBIT',
        reference: 'Funds released to seller on buyer confirmation',
      });

      // Trigger Moolre payout to seller — non-blocking, failure is logged not fatal
      const seller = await local.findUserById(t.seller_id);
      if (seller) {
        disbursePayout({
          phone: seller.phone,
          amount: t.amount,
          reference: t.transaction_code,
          narration: `VeriTrade payout: ${t.item_description}`,
          network: seller.momo_network || 'MTN',
        }).then(async (result) => {
          console.log(`[Payout] Initiated for tx ${t.transaction_code} → seller ${seller.phone}:`, result?.status || 'sent');
          await local.addLedgerEntry({
            transaction_id: t.id,
            amount: t.amount,
            type: 'PAYOUT',
            reference: `Moolre payout initiated to seller ${seller.phone}`,
          });
        }).catch(async (err) => {
          console.error(`[Payout FAILED] tx ${t.transaction_code}:`, err.message);
          await local.addLedgerEntry({
            transaction_id: t.id,
            amount: t.amount,
            type: 'PAYOUT_FAILED',
            reference: `Payout failed — manual disbursement required. Error: ${err.message}`,
          });
        });
      }

      return res.json({ success: true, transaction: updated });
    }

    // PostgreSQL path
    const tRes = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'not found' });
    if (t.status !== 'SHIPPED') return res.status(400).json({ error: `cannot confirm — status is ${t.status} (expected SHIPPED)` });
    if (!t.delivery_pin_hash) return res.status(500).json({ error: 'delivery PIN not set — contact support' });

    const pinValid = await bcrypt.compare(String(deliveryPin), t.delivery_pin_hash);
    if (!pinValid) return res.status(400).json({ error: 'incorrect delivery PIN' });

    await db.query(
      'UPDATE transactions SET status=$1, completed_at=NOW(), delivery_pin_hash=NULL WHERE id=$2',
      ['COMPLETED', t.id]
    );
    await db.query(
      'INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())',
      [t.id, -t.amount, 'DEBIT', 'Funds released to seller on buyer confirmation']
    );

    // Trigger Moolre payout to seller
    const sellerRes = await db.query('SELECT phone FROM users WHERE id=$1', [t.seller_id]);
    const sellerPhone = sellerRes.rows[0]?.phone;
    if (sellerPhone) {
      disbursePayout({
        phone: sellerPhone,
        amount: t.amount,
        reference: t.transaction_code,
        narration: `VeriTrade payout: ${t.item_description}`,
        network: 'MTN',
      }).then(async (result) => {
        console.log(`[Payout] Initiated for tx ${t.transaction_code} → seller ${sellerPhone}:`, result?.status || 'sent');
        await db.query(
          'INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())',
          [t.id, t.amount, 'PAYOUT', `Moolre payout initiated to seller ${sellerPhone}`]
        );
      }).catch(async (err) => {
        console.error(`[Payout FAILED] tx ${t.transaction_code}:`, err.message);
        await db.query(
          'INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())',
          [t.id, t.amount, 'PAYOUT_FAILED', `Payout failed — manual disbursement required. Error: ${err.message}`]
        );
      });
    }

    res.json({ success: true, transactionCode });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

async function dispute(req, res) {
  try {
    const { transactionCode, reason } = req.body;
    if (!transactionCode) return res.status(400).json({ error: 'transactionCode required' });
    if (useLocal) {
      const t = await local.findTransactionByCode(transactionCode);
      if (!t) return res.status(404).json({ error: 'not found' });
      if (!['FUNDED', 'PENDING', 'ACCEPTED'].includes(t.status)) return res.status(400).json({ error: 'cannot dispute at this stage' });
      const updated = await local.updateTransactionStatus(t.id, 'DISPUTED');
      const d = await local.addDispute({ transaction_id: t.id, reason: reason || 'No reason provided' });
      return res.json({ success: true, dispute: d, transaction: updated });
    }
    const tRes = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'not found' });
    await db.query('UPDATE transactions SET status=$1 WHERE id=$2', ['DISPUTED', t.id]);
    const dRes = await db.query(
      'INSERT INTO disputes(transaction_id, reason, status, created_at) VALUES($1,$2,$3,NOW()) RETURNING *',
      [t.id, reason || 'No reason provided', 'OPEN']
    );
    res.json({ success: true, dispute: dRes.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

async function cancel(req, res) {
  try {
    const { transactionCode } = req.body;
    if (useLocal) {
      const t = await local.findTransactionByCode(transactionCode);
      if (!t) return res.status(404).json({ error: 'not found' });
      if (t.status !== 'PENDING') return res.status(400).json({ error: 'only PENDING transactions can be cancelled' });
      const updated = await local.updateTransactionStatus(t.id, 'CANCELLED');
      return res.json({ success: true, transaction: updated });
    }
    const tRes = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'not found' });
    if (t.status !== 'PENDING') return res.status(400).json({ error: 'only PENDING transactions can be cancelled' });
    await db.query('UPDATE transactions SET status=$1 WHERE id=$2', ['CANCELLED', t.id]);
    res.json({ success: true, transactionCode });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * Background job: check every minute for expired transactions and auto-refund/cancel them.
 * - PENDING expired → auto-cancel (seller never accepted)
 * - ACCEPTED expired → auto-refund (buyer never funded)
 * - FUNDED expired → escalate to dispute (item not confirmed after 7 days)
 */
async function processExpiredTransactions() {
  try {
    const now = new Date();
    if (useLocal) {
      // Check PENDING and ACCEPTED
      const candidates = await local.listTransactionsByStatuses(['PENDING', 'ACCEPTED']);
      for (const t of candidates) {
        if (!t.expires_at) continue;
        const expiresAt = new Date(t.expires_at);
        if (now < expiresAt) continue; // Not expired yet

        if (t.status === 'PENDING') {
          await local.updateTransactionFields(t.id, {
            status: 'CANCELLED',
            cancelled_at: now.toISOString(),
            cancel_reason: 'Auto-cancelled: seller did not accept within 48h',
          });
          console.log(`[Expiry] Auto-cancelled tx ${t.transaction_code} (PENDING → expired)`);
        } else if (t.status === 'ACCEPTED') {
          await local.updateTransactionFields(t.id, {
            status: 'REFUNDED',
            refunded_at: now.toISOString(),
            refund_reason: 'Auto-refunded: buyer did not fund within 24h of acceptance',
          });
          // No funds were ever collected, so no ledger DEBIT is needed here.
          // Log it for audit trail only.
          await local.addLedgerEntry({
            transaction_id: t.id,
            amount: 0,
            type: 'REFUND',
            reference: 'Auto-refunded: funding window expired (no funds collected)',
          });
          console.log(`[Expiry] Auto-refunded tx ${t.transaction_code} (ACCEPTED → expired)`);
        }
      }
    } else {
      // PostgreSQL path
      // Cancel PENDING that expired
      await db.query(
        `UPDATE transactions
         SET status='CANCELLED', notes=COALESCE(notes || ' | ', '') || 'Auto-cancelled: seller did not accept within 48h'
         WHERE status='PENDING' AND expires_at IS NOT NULL AND expires_at < NOW()`
      );
      // Refund ACCEPTED that expired
      await db.query(
        `UPDATE transactions
         SET status='REFUNDED', notes=COALESCE(notes || ' | ', '') || 'Auto-refunded: buyer did not fund within 24h of acceptance'
         WHERE status='ACCEPTED' AND expires_at IS NOT NULL AND expires_at < NOW()`
      );
    }
  } catch (err) {
    console.error('[Expiry job error]', err.message);
  }
}

function startExpiryJob() {
  // Run every 60 seconds
  const INTERVAL_MS = parseInt(process.env.EXPIRY_CHECK_INTERVAL_MS || '60000');
  setInterval(processExpiredTransactions, INTERVAL_MS);
  console.log(`[Expiry job] Started — checking every ${INTERVAL_MS / 1000}s`);
}

/**
 * GET /api/escrow/ledger/:code
 * Returns all ledger entries for a transaction (audit trail).
 */
async function getLedger(req, res) {
  try {
    const { code } = req.params;
    if (useLocal) {
      const t = await local.findTransactionByCode(code);
      if (!t) return res.status(404).json({ error: 'transaction not found' });
      const entries = await local.getLedgerForTransaction(t.id);
      return res.json({ transaction_code: code, ledger: entries });
    }
    const tRes = await db.query('SELECT id FROM transactions WHERE transaction_code=$1', [code]);
    if (!tRes.rows.length) return res.status(404).json({ error: 'transaction not found' });
    const lRes = await db.query(
      'SELECT * FROM ledger WHERE transaction_id=$1 ORDER BY created_at ASC',
      [tRes.rows[0].id]
    );
    res.json({ transaction_code: code, ledger: lRes.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = { createEscrow, listTransactions, sellerAccept, sellerReject, pay, ship, confirm, dispute, cancel, getLedger, startExpiryJob };
