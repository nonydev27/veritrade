const db = require('../config/database');
const local = require('../config/local_store');
const { disbursePayout } = require('../services/moolre.service');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

/**
 * GET /api/admin/disputes
 * List all open disputes for the admin dashboard.
 */
async function listDisputes(req, res) {
  try {
    if (useLocal) {
      const disputes = await local.listDisputesByStatus(['OPEN', 'UNDER_REVIEW']);
      return res.json({ disputes });
    }
    const r = await db.query(
      `SELECT d.*, t.transaction_code, t.amount, t.item_description
       FROM disputes d
       JOIN transactions t ON t.id = d.transaction_id
       WHERE d.status IN ('OPEN','UNDER_REVIEW')
       ORDER BY d.created_at DESC`
    );
    res.json({ disputes: r.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/admin/disputes/:id/review
 * Mark a dispute as UNDER_REVIEW and optionally add a note.
 * Body: { note }
 */
async function reviewDispute(req, res) {
  try {
    const disputeId = parseInt(req.params.id);
    const { note } = req.body;

    if (useLocal) {
      const d = await local.updateDisputeFields(disputeId, {
        status: 'UNDER_REVIEW',
        admin_note: note || 'Under review',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id,
      });
      if (!d) return res.status(404).json({ error: 'dispute not found' });
      return res.json({ success: true, dispute: d });
    }

    const r = await db.query(
      `UPDATE disputes SET status='UNDER_REVIEW', admin_note=$1, reviewed_at=NOW()
       WHERE id=$2 RETURNING *`,
      [note || 'Under review', disputeId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'dispute not found' });
    res.json({ success: true, dispute: r.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/admin/disputes/:id/refund
 * Admin rules in buyer's favour.
 * - Dispute → RESOLVED_REFUND
 * - Transaction → REFUNDED
 * - Ledger DEBIT written (offsetting the original CREDIT)
 * Body: { note }
 */
async function refundBuyer(req, res) {
  try {
    const disputeId = parseInt(req.params.id);
    const { note } = req.body;
    const adminNote = note || 'Admin ruling: refund issued to buyer';

    if (useLocal) {
      const dispute = await local.findDisputeById(disputeId);
      if (!dispute) return res.status(404).json({ error: 'dispute not found' });
      if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
        return res.status(400).json({ error: `dispute is already ${dispute.status}` });
      }

      const t = await local.findTransactionById(dispute.transaction_id);
      if (!t) return res.status(404).json({ error: 'transaction not found' });

      // Update dispute
      await local.updateDisputeFields(disputeId, {
        status: 'RESOLVED_REFUND',
        admin_note: adminNote,
        resolved_at: new Date().toISOString(),
        resolved_by: req.user.id,
      });

      // Update transaction
      await local.updateTransactionFields(t.id, {
        status: 'REFUNDED',
        refunded_at: new Date().toISOString(),
      });

      // Ledger: offsetting DEBIT (funds returned to buyer, not paid to seller)
      await local.addLedgerEntry({
        transaction_id: t.id,
        amount: -t.amount,
        type: 'REFUND',
        reference: `Admin refund to buyer. Note: ${adminNote}`,
      });

      return res.json({ success: true, resolution: 'REFUND', dispute: { id: disputeId, status: 'RESOLVED_REFUND' }, transaction: { status: 'REFUNDED' } });
    }

    // PostgreSQL path
    const dRes = await db.query('SELECT * FROM disputes WHERE id=$1', [disputeId]);
    const dispute = dRes.rows[0];
    if (!dispute) return res.status(404).json({ error: 'dispute not found' });
    if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
      return res.status(400).json({ error: `dispute is already ${dispute.status}` });
    }

    const tRes = await db.query('SELECT * FROM transactions WHERE id=$1', [dispute.transaction_id]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'transaction not found' });

    await db.query(
      `UPDATE disputes SET status='RESOLVED_REFUND', admin_note=$1, resolved_at=NOW() WHERE id=$2`,
      [adminNote, disputeId]
    );
    await db.query(
      `UPDATE transactions SET status='REFUNDED', refunded_at=NOW() WHERE id=$1`,
      [t.id]
    );
    await db.query(
      `INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())`,
      [t.id, -t.amount, 'REFUND', `Admin refund to buyer. Note: ${adminNote}`]
    );

    res.json({ success: true, resolution: 'REFUND', dispute: { id: disputeId, status: 'RESOLVED_REFUND' }, transaction: { status: 'REFUNDED' } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/admin/disputes/:id/pay-seller
 * Admin rules in seller's favour.
 * - Dispute → RESOLVED_PAY_SELLER
 * - Transaction → COMPLETED
 * - Ledger DEBIT written + Moolre payout triggered to seller
 * Body: { note }
 */
async function paySeller(req, res) {
  try {
    const disputeId = parseInt(req.params.id);
    const { note } = req.body;
    const adminNote = note || 'Admin ruling: funds released to seller';

    if (useLocal) {
      const dispute = await local.findDisputeById(disputeId);
      if (!dispute) return res.status(404).json({ error: 'dispute not found' });
      if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
        return res.status(400).json({ error: `dispute is already ${dispute.status}` });
      }

      const t = await local.findTransactionById(dispute.transaction_id);
      if (!t) return res.status(404).json({ error: 'transaction not found' });

      // Update dispute
      await local.updateDisputeFields(disputeId, {
        status: 'RESOLVED_PAY_SELLER',
        admin_note: adminNote,
        resolved_at: new Date().toISOString(),
        resolved_by: req.user.id,
      });

      // Update transaction
      await local.updateTransactionFields(t.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      });

      // Ledger DEBIT
      await local.addLedgerEntry({
        transaction_id: t.id,
        amount: -t.amount,
        type: 'DEBIT',
        reference: `Admin ruling: funds released to seller. Note: ${adminNote}`,
      });

      // Trigger payout to seller — same non-blocking pattern as confirm()
      const seller = await local.findUserById(t.seller_id);
      if (seller) {
        disbursePayout({
          phone: seller.phone,
          amount: t.amount,
          reference: `ADMIN-${t.transaction_code}`,
          narration: `VeriTrade admin payout: ${t.item_description}`,
          network: seller.momo_network || 'MTN',
        }).then(async () => {
          await local.addLedgerEntry({
            transaction_id: t.id,
            amount: t.amount,
            type: 'PAYOUT',
            reference: `Admin-initiated payout to seller ${seller.phone}`,
          });
        }).catch(async (err) => {
          console.error(`[Admin Payout FAILED] tx ${t.transaction_code}:`, err.message);
          await local.addLedgerEntry({
            transaction_id: t.id,
            amount: t.amount,
            type: 'PAYOUT_FAILED',
            reference: `Admin payout failed — manual retry required. Error: ${err.message}`,
          });
        });
      }

      return res.json({ success: true, resolution: 'PAY_SELLER', dispute: { id: disputeId, status: 'RESOLVED_PAY_SELLER' }, transaction: { status: 'COMPLETED' } });
    }

    // PostgreSQL path
    const dRes = await db.query('SELECT * FROM disputes WHERE id=$1', [disputeId]);
    const dispute = dRes.rows[0];
    if (!dispute) return res.status(404).json({ error: 'dispute not found' });
    if (!['OPEN', 'UNDER_REVIEW'].includes(dispute.status)) {
      return res.status(400).json({ error: `dispute is already ${dispute.status}` });
    }

    const tRes = await db.query('SELECT * FROM transactions WHERE id=$1', [dispute.transaction_id]);
    const t = tRes.rows[0];
    if (!t) return res.status(404).json({ error: 'transaction not found' });

    await db.query(
      `UPDATE disputes SET status='RESOLVED_PAY_SELLER', admin_note=$1, resolved_at=NOW() WHERE id=$2`,
      [adminNote, disputeId]
    );
    await db.query(
      `UPDATE transactions SET status='COMPLETED', completed_at=NOW() WHERE id=$1`,
      [t.id]
    );
    await db.query(
      `INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())`,
      [t.id, -t.amount, 'DEBIT', `Admin ruling: funds released to seller. Note: ${adminNote}`]
    );

    const sellerRes = await db.query('SELECT phone FROM users WHERE id=$1', [t.seller_id]);
    const sellerPhone = sellerRes.rows[0]?.phone;
    if (sellerPhone) {
      disbursePayout({
        phone: sellerPhone,
        amount: t.amount,
        reference: `ADMIN-${t.transaction_code}`,
        narration: `VeriTrade admin payout: ${t.item_description}`,
        network: 'MTN',
      }).then(async () => {
        await db.query(
          `INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())`,
          [t.id, t.amount, 'PAYOUT', `Admin-initiated payout to seller ${sellerPhone}`]
        );
      }).catch(async (err) => {
        console.error(`[Admin Payout FAILED] tx ${t.transaction_code}:`, err.message);
        await db.query(
          `INSERT INTO ledger(transaction_id, amount, type, reference, created_at) VALUES($1,$2,$3,$4,NOW())`,
          [t.id, t.amount, 'PAYOUT_FAILED', `Admin payout failed — manual retry required. Error: ${err.message}`]
        );
      });
    }

    res.json({ success: true, resolution: 'PAY_SELLER', dispute: { id: disputeId, status: 'RESOLVED_PAY_SELLER' }, transaction: { status: 'COMPLETED' } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * GET /api/admin/disputes/:id
 * Get full details for a single dispute, including the linked transaction.
 */
async function getDisputeDetails(req, res) {
  try {
    const disputeId = parseInt(req.params.id);

    if (useLocal) {
      const dispute = await local.findDisputeById(disputeId);
      if (!dispute) return res.status(404).json({ error: 'dispute not found' });
      const transaction = await local.findTransactionById(dispute.transaction_id);
      return res.json({ dispute, transaction: transaction || null });
    }

    const r = await db.query(
      `SELECT d.*, t.transaction_code, t.amount, t.item_description,
              t.status AS transaction_status, t.buyer_id, t.seller_id,
              t.created_at AS transaction_created_at
       FROM disputes d
       LEFT JOIN transactions t ON t.id = d.transaction_id
       WHERE d.id = $1`,
      [disputeId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'dispute not found' });
    res.json({ dispute: r.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/admin/disputes/:id/resolve
 * Generic resolve endpoint — delegates to refundBuyer or paySeller based on body.
 * Body: { resolution: 'REFUND' | 'PAY_SELLER', note? }
 */
async function resolveDispute(req, res) {
  const { resolution } = req.body;
  if (resolution === 'REFUND') return refundBuyer(req, res);
  if (resolution === 'PAY_SELLER') return paySeller(req, res);
  return res.status(400).json({ error: 'resolution must be REFUND or PAY_SELLER' });
}

/**
 * GET /api/admin/audit-log
 * Returns the admin action audit log (newest first).
 * Query: limit=100, offset=0
 */
async function getAuditLog(req, res) {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    if (useLocal) {
      const log = await local.listAuditLog({ limit, offset });
      return res.json({ log });
    }

    const r = await db.query(
      `SELECT a.*, u.name AS admin_name, u.phone AS admin_phone
       FROM admin_audit_log a
       LEFT JOIN users u ON u.id = a.admin_id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ log: r.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * GET /api/admin/kyc
 * List all pending KYC verifications for admin review.
 */
async function listPendingKyc(req, res) {
  try {
    if (useLocal) {
      const { findKycByUserId: _, ...rest } = local; // suppress lint
      // Read all kyc records and filter pending
      const KYC_FILE = require('path').join(__dirname, '..', '..', 'local_data', 'kyc_verifications.json');
      const fs = require('fs').promises;
      let records = [];
      try { records = JSON.parse(await fs.readFile(KYC_FILE, 'utf8')); } catch { records = []; }
      const pending = records.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
      return res.json({ kyc_verifications: pending });
    }

    const r = await db.query(
      `SELECT k.*, u.name, u.phone, u.email
       FROM kyc_verifications k
       JOIN users u ON u.id = k.user_id
       WHERE k.status IN ('PENDING','IN_PROGRESS')
       ORDER BY k.created_at ASC`
    );
    res.json({ kyc_verifications: r.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/admin/kyc/:id/approve
 * Approve a KYC submission and update the user's kyc_status to VERIFIED.
 */
async function approveKyc(req, res) {
  try {
    const kycId  = parseInt(req.params.id);
    const { note } = req.body;

    if (useLocal) {
      const record = await local.findKycById(kycId);
      if (!record) return res.status(404).json({ error: 'KYC record not found' });
      await local.updateKycFields(kycId, {
        status: 'APPROVED',
        verified_at: new Date().toISOString(),
        rejection_reason: null,
      });
      await local.updateUserFields(record.user_id, { kyc_status: 'VERIFIED' });
      await local.addAuditLogEntry({
        adminId: req.user.id, action: 'KYC_APPROVE',
        targetType: 'KYC', targetId: kycId, note: note || null,
      });
      const { sendKycNotification } = require('../services/notification.service');
      await sendKycNotification(record.user_id, kycId, 'APPROVED').catch(console.error);
      return res.json({ success: true, kyc_id: kycId, status: 'APPROVED' });
    }

    const kycRes = await db.query('SELECT * FROM kyc_verifications WHERE id=$1', [kycId]);
    const record = kycRes.rows[0];
    if (!record) return res.status(404).json({ error: 'KYC record not found' });

    await db.query(
      `UPDATE kyc_verifications SET status='APPROVED', verified_at=NOW(), updated_at=NOW() WHERE id=$1`,
      [kycId]
    );
    await db.query(`UPDATE users SET kyc_status='VERIFIED' WHERE id=$1`, [record.user_id]);
    await db.query(
      `INSERT INTO admin_audit_log(admin_id,action,target_type,target_id,note,created_at)
       VALUES($1,'KYC_APPROVE','KYC',$2,$3,NOW())`,
      [req.user.id, kycId, note || null]
    );
    const { sendKycNotification } = require('../services/notification.service');
    await sendKycNotification(record.user_id, kycId, 'APPROVED').catch(console.error);
    res.json({ success: true, kyc_id: kycId, status: 'APPROVED' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/admin/kyc/:id/reject
 * Reject a KYC submission.
 * Body: { reason }
 */
async function rejectKyc(req, res) {
  try {
    const kycId = parseInt(req.params.id);
    const { reason, note } = req.body;
    if (!reason) return res.status(400).json({ error: 'reason is required' });

    if (useLocal) {
      const record = await local.findKycById(kycId);
      if (!record) return res.status(404).json({ error: 'KYC record not found' });
      await local.updateKycFields(kycId, {
        status: 'REJECTED',
        rejection_reason: reason,
        verified_at: null,
      });
      await local.updateUserFields(record.user_id, { kyc_status: 'REJECTED' });
      await local.addAuditLogEntry({
        adminId: req.user.id, action: 'KYC_REJECT',
        targetType: 'KYC', targetId: kycId, note: note || reason,
      });
      const { sendKycNotification } = require('../services/notification.service');
      await sendKycNotification(record.user_id, kycId, 'REJECTED').catch(console.error);
      return res.json({ success: true, kyc_id: kycId, status: 'REJECTED' });
    }

    const kycRes = await db.query('SELECT * FROM kyc_verifications WHERE id=$1', [kycId]);
    const record = kycRes.rows[0];
    if (!record) return res.status(404).json({ error: 'KYC record not found' });

    await db.query(
      `UPDATE kyc_verifications
       SET status='REJECTED', rejection_reason=$1, updated_at=NOW() WHERE id=$2`,
      [reason, kycId]
    );
    await db.query(`UPDATE users SET kyc_status='REJECTED' WHERE id=$1`, [record.user_id]);
    await db.query(
      `INSERT INTO admin_audit_log(admin_id,action,target_type,target_id,note,created_at)
       VALUES($1,'KYC_REJECT','KYC',$2,$3,NOW())`,
      [req.user.id, kycId, note || reason]
    );
    const { sendKycNotification } = require('../services/notification.service');
    await sendKycNotification(record.user_id, kycId, 'REJECTED').catch(console.error);
    res.json({ success: true, kyc_id: kycId, status: 'REJECTED' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}
/**
 * POST /api/admin/kyc/:id/reject
 * Reject a KYC submission.
 * Body: { reason, note? }
 */
async function rejectKyc(req, res) {
  try {
    const kycId = parseInt(req.params.id);
    const { reason, note } = req.body;
    if (!reason) return res.status(400).json({ error: 'reason is required' });

    if (useLocal) {
      const record = await local.findKycById(kycId);
      if (!record) return res.status(404).json({ error: 'KYC record not found' });
      await local.updateKycFields(kycId, {
        status: 'REJECTED',
        rejection_reason: reason,
        verified_at: null,
      });
      await local.updateUserFields(record.user_id, { kyc_status: 'REJECTED' });
      await local.addAuditLogEntry({
        adminId: req.user.id,
        action: 'KYC_REJECT',
        targetType: 'KYC',
        targetId: kycId,
        note: note || reason,
      });
      const { sendKycNotification } = require('../services/notification.service');
      await sendKycNotification(record.user_id, kycId, 'REJECTED').catch(console.error);
      return res.json({ success: true, kyc_id: kycId, status: 'REJECTED' });
    }

    // PostgreSQL path
    const kycRes = await db.query('SELECT * FROM kyc_verifications WHERE id=$1', [kycId]);
    const record = kycRes.rows[0];
    if (!record) return res.status(404).json({ error: 'KYC record not found' });

    await db.query(
      `UPDATE kyc_verifications SET status='REJECTED', rejection_reason=$1, updated_at=NOW() WHERE id=$2`,
      [reason, kycId]
    );
    await db.query(`UPDATE users SET kyc_status='REJECTED' WHERE id=$1`, [record.user_id]);
    await db.query(
      `INSERT INTO admin_audit_log(admin_id,action,target_type,target_id,note,created_at)
       VALUES($1,'KYC_REJECT','KYC',$2,$3,NOW())`,
      [req.user.id, kycId, note || reason]
    );
    const { sendKycNotification } = require('../services/notification.service');
    await sendKycNotification(record.user_id, kycId, 'REJECTED').catch(console.error);
    res.json({ success: true, kyc_id: kycId, status: 'REJECTED' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = {
  listDisputes,
  getDisputeDetails,
  reviewDispute,
  resolveDispute,
  refundBuyer,
  paySeller,
  getAuditLog,
  listPendingKyc,
  approveKyc,
  rejectKyc,
};
