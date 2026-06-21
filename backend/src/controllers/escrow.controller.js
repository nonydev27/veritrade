const db = require('../config/database');
const local = require('../config/local_store');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

async function createEscrow(req, res) {
  try {
    const { item, amount, seller_phone } = req.body;
    if (!item || !amount || !seller_phone) return res.status(400).json({ error: 'missing fields' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const buyer_id = req.user?.id || null;
    if (useLocal) {
      const seller = await local.findUserByPhone(seller_phone);
      if (!seller) return res.status(404).json({ error: 'seller not found' });
      const tx = await local.addTransaction({ transaction_code: code, buyer_id, seller_id: seller.id, item_description: item, amount, status: 'PENDING' });
      return res.json({ transactionCode: code, transaction: tx });
    }
    const s = await db.query('SELECT id FROM users WHERE phone=$1', [seller_phone]);
    if (!s.rows.length) return res.status(404).json({ error: 'seller not found' });
    const result = await db.query(
      'INSERT INTO transactions(transaction_code, buyer_id, seller_id, item_description, amount, status, created_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) RETURNING *',
      [code, buyer_id, s.rows[0].id, item, amount, 'PENDING']
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

async function pay(req, res) {
  try {
    const { transactionCode } = req.body;
    if (useLocal) {
      const t = await local.findTransactionByCode(transactionCode);
      if (!t) return res.status(404).json({ error: 'not found' });
      if (t.status !== 'PENDING') return res.status(400).json({ error: 'invalid status' });
      const updated = await local.updateTransactionStatus(t.id, 'PAID');
      return res.json({ success: true, transaction: updated });
    }
    const tRes = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'not found' });
    if (t.status !== 'PENDING') return res.status(400).json({ error: 'invalid status' });
    await db.query('UPDATE transactions SET status=$1 WHERE id=$2', ['PAID', t.id]);
    await db.query('INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())', [t.id, t.amount, 'CREDIT', 'Buyer funded']);
    res.json({ success: true, transactionCode });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

async function confirm(req, res) {
  try {
    const { transactionCode } = req.body;
    if (useLocal) {
      const t = await local.findTransactionByCode(transactionCode);
      if (!t) return res.status(404).json({ error: 'not found' });
      if (t.status !== 'PAID') return res.status(400).json({ error: 'not paid yet' });
      const updated = await local.updateTransactionStatus(t.id, 'COMPLETED');
      return res.json({ success: true, transaction: updated });
    }
    const tRes = await db.query('SELECT * FROM transactions WHERE transaction_code=$1', [transactionCode]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'not found' });
    if (t.status !== 'PAID') return res.status(400).json({ error: 'not paid yet' });
    await db.query('UPDATE transactions SET status=$1 WHERE id=$2', ['COMPLETED', t.id]);
    await db.query('INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())', [t.id, -t.amount, 'DEBIT', 'Released to seller']);
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
      if (!['PAID', 'PENDING'].includes(t.status)) return res.status(400).json({ error: 'cannot dispute at this stage' });
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

module.exports = { createEscrow, listTransactions, pay, confirm, dispute, cancel };
