'use strict';
/**
 * notification.service.js
 * -----------------------
 * Persists in-app notifications and (optionally) delivers push/SMS alerts.
 *
 * Dual-mode: local JSON store when DATABASE_URL is not configured,
 * PostgreSQL otherwise — same pattern used throughout the backend.
 *
 * Public API:
 *   sendTransactionUpdate(userId, transactionId, event, details?)
 *   sendDisputeNotification(userId, disputeId, event, details?)
 *   sendKycNotification(userId, kycId, event, details?)
 *   getNotificationsForUser(userId, { unreadOnly, limit, offset })
 *   markAsRead(notificationId, userId)
 *   markAllAsRead(userId)
 */

const db = require('../config/database');
const local = require('../config/local_store');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

// ─── Event → human-readable copy ─────────────────────────────────────────────

const TRANSACTION_COPY = {
  CREATED:     { title: 'Escrow Created',          body: 'Your escrow transaction has been created and is awaiting a seller.' },
  ACCEPTED:    { title: 'Transaction Accepted',     body: 'The seller has accepted the transaction. Proceed to payment.' },
  REJECTED:    { title: 'Transaction Rejected',     body: 'The seller has rejected the transaction.' },
  PAID:        { title: 'Payment Received',         body: 'Payment has been received into escrow. The seller will ship the item.' },
  SHIPPED:     { title: 'Item Shipped',             body: 'The seller has marked the item as shipped. Please confirm delivery.' },
  CONFIRMED:   { title: 'Transaction Completed',    body: 'You have confirmed delivery. Funds have been released to the seller.' },
  DISPUTED:    { title: 'Dispute Opened',           body: 'A dispute has been raised on this transaction.' },
  CANCELLED:   { title: 'Transaction Cancelled',    body: 'The transaction has been cancelled.' },
  EXPIRED:     { title: 'Transaction Expired',      body: 'The transaction has expired without payment.' },
  REFUNDED:    { title: 'Refund Issued',            body: 'A refund has been issued to the buyer.' },
  COMPLETED:   { title: 'Transaction Completed',    body: 'Funds have been released to the seller. Transaction complete.' },
};

const DISPUTE_COPY = {
  OPENED:            { title: 'Dispute Opened',         body: 'A dispute has been opened on your transaction.' },
  UNDER_REVIEW:      { title: 'Dispute Under Review',   body: 'An admin is reviewing the dispute.' },
  RESOLVED_REFUND:   { title: 'Dispute Resolved',       body: 'The dispute was resolved in the buyer\'s favour. A refund will be issued.' },
  RESOLVED_PAY_SELLER: { title: 'Dispute Resolved',     body: 'The dispute was resolved in the seller\'s favour. Funds have been released.' },
};

const KYC_COPY = {
  INITIATED:   { title: 'KYC Submitted',        body: 'Your identity verification has been submitted and is under review.' },
  APPROVED:    { title: 'KYC Approved',          body: 'Your identity has been verified. You can now trade without limits.' },
  REJECTED:    { title: 'KYC Rejected',          body: 'Your identity verification was not successful. Please try again.' },
  IN_PROGRESS: { title: 'KYC In Progress',       body: 'Your identity verification is being processed.' },
};

// ─── Core notification write ──────────────────────────────────────────────────

/**
 * Persist a notification to the store.
 * @returns {Promise<Object>} The stored notification record.
 */
async function _store({ userId, type, title, body, referenceId, referenceType }) {
  if (useLocal) {
    return local.addNotification({ userId, type, title, body, referenceId, referenceType });
  }

  const r = await db.query(
    `INSERT INTO notifications
       (user_id, type, title, body, reference_id, reference_type, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [userId, type, title, body, referenceId || null, referenceType || null]
  );
  return r.rows[0];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Notify a user about a transaction state change.
 * @param {number} userId
 * @param {number} transactionId
 * @param {string} event  - key from TRANSACTION_COPY, e.g. 'PAID', 'SHIPPED'
 * @param {Object} [details] - optional overrides for { title, body }
 */
async function sendTransactionUpdate(userId, transactionId, event, details = {}) {
  const copy = TRANSACTION_COPY[event] || { title: 'Transaction Update', body: `Status changed to ${event}.` };
  return _store({
    userId,
    type: 'TRANSACTION_UPDATE',
    title: details.title || copy.title,
    body: details.body || copy.body,
    referenceId: transactionId,
    referenceType: 'TRANSACTION',
  });
}

/**
 * Notify a user about a dispute state change.
 * @param {number} userId
 * @param {number} disputeId
 * @param {string} event  - key from DISPUTE_COPY, e.g. 'UNDER_REVIEW'
 * @param {Object} [details] - optional overrides for { title, body }
 */
async function sendDisputeNotification(userId, disputeId, event, details = {}) {
  const copy = DISPUTE_COPY[event] || { title: 'Dispute Update', body: `Dispute status changed to ${event}.` };
  return _store({
    userId,
    type: 'DISPUTE_UPDATE',
    title: details.title || copy.title,
    body: details.body || copy.body,
    referenceId: disputeId,
    referenceType: 'DISPUTE',
  });
}

/**
 * Notify a user about a KYC status change.
 * @param {number} userId
 * @param {number} kycId
 * @param {string} event  - key from KYC_COPY, e.g. 'APPROVED'
 * @param {Object} [details] - optional overrides for { title, body }
 */
async function sendKycNotification(userId, kycId, event, details = {}) {
  const copy = KYC_COPY[event] || { title: 'KYC Update', body: `KYC status changed to ${event}.` };
  return _store({
    userId,
    type: 'KYC_UPDATE',
    title: details.title || copy.title,
    body: details.body || copy.body,
    referenceId: kycId,
    referenceType: 'KYC',
  });
}

/**
 * Retrieve notifications for a user, newest first.
 * @param {number} userId
 * @param {{ unreadOnly?: boolean, limit?: number, offset?: number }} opts
 */
async function getNotificationsForUser(userId, opts = {}) {
  const { unreadOnly = false, limit = 50, offset = 0 } = opts;

  if (useLocal) {
    return local.getNotificationsForUser(userId, { unreadOnly, limit, offset });
  }

  const params = [userId];
  const whereExtra = unreadOnly ? ' AND read_at IS NULL' : '';
  params.push(limit, offset);

  const r = await db.query(
    `SELECT * FROM notifications
     WHERE user_id = $1 ${whereExtra}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    params
  );
  return r.rows;
}

/**
 * Mark a single notification as read.
 * Checks user_id to prevent users reading each other's notifications.
 * @param {number} notificationId
 * @param {number} userId
 */
async function markAsRead(notificationId, userId) {
  if (useLocal) {
    return local.markNotificationRead(notificationId, userId);
  }
  const r = await db.query(
    `UPDATE notifications SET read_at = NOW()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL
     RETURNING *`,
    [notificationId, userId]
  );
  return r.rows[0] || null;
}

/**
 * Mark all of a user's notifications as read.
 * @param {number} userId
 */
async function markAllAsRead(userId) {
  if (useLocal) {
    return local.markAllNotificationsRead(userId);
  }
  const r = await db.query(
    `UPDATE notifications SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL
     RETURNING id`,
    [userId]
  );
  return { updated: r.rowCount };
}

module.exports = {
  sendTransactionUpdate,
  sendDisputeNotification,
  sendKycNotification,
  getNotificationsForUser,
  markAsRead,
  markAllAsRead,
};
