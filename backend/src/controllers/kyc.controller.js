'use strict';
/**
 * kyc.controller.js
 * -----------------
 * Handles identity verification (KYC) for VeriTrade users.
 *
 * Routes:
 *   POST /api/kyc/initiate   - Submit KYC documents to start verification
 *   GET  /api/kyc/status     - Check the authenticated user's KYC status
 *   POST /api/kyc/webhook    - Handle asynchronous result from KYC provider
 *
 * Dual-mode: local JSON store when DATABASE_URL is not configured,
 * PostgreSQL otherwise.
 */

const db = require('../config/database');
const local = require('../config/local_store');
const { sendKycNotification } = require('../services/notification.service');

const useLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:pass');

// Shared HMAC webhook secret — set KYC_WEBHOOK_SECRET in .env
const KYC_WEBHOOK_SECRET = process.env.KYC_WEBHOOK_SECRET || '';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_ID_TYPES = ['GHANA_CARD', 'PASSPORT', 'VOTER_ID', 'DRIVERS_LICENCE'];

/**
 * Verify the KYC webhook HMAC signature (provider-agnostic).
 * Header: x-kyc-signature: sha256=<hex>
 */
function _verifyWebhookSignature(rawBody, signatureHeader) {
  if (!KYC_WEBHOOK_SECRET) return true; // Skip verification if secret not set (dev mode)
  if (!signatureHeader) return false;
  const crypto = require('crypto');
  const [, sig] = signatureHeader.split('=');
  const expected = crypto.createHmac('sha256', KYC_WEBHOOK_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sig || '', 'hex'));
  } catch {
    return false;
  }
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/kyc/initiate
 * Authenticated. Creates a new KYC verification record.
 * Body: { idType, idNumber, fullName, dateOfBirth, selfieUrl?, idDocumentUrl? }
 */
async function initiateKyc(req, res) {
  try {
    const userId = req.user.id;
    const { idType, idNumber, fullName, dateOfBirth, selfieUrl, idDocumentUrl } = req.body;

    // Validation
    if (!idType || !VALID_ID_TYPES.includes(idType)) {
      return res.status(400).json({
        error: `idType is required. Must be one of: ${VALID_ID_TYPES.join(', ')}`,
      });
    }
    if (!idNumber) return res.status(400).json({ error: 'idNumber is required' });
    if (!fullName)  return res.status(400).json({ error: 'fullName is required' });
    if (!dateOfBirth) return res.status(400).json({ error: 'dateOfBirth is required (YYYY-MM-DD)' });

    if (useLocal) {
      // Block re-submission if already approved
      const existing = await local.findKycByUserId(userId);
      if (existing && existing.status === 'APPROVED') {
        return res.status(400).json({ error: 'KYC is already approved for this account' });
      }

      const record = await local.addKycVerification({
        userId,
        idType,
        idNumber,
        fullName,
        dateOfBirth,
        selfieUrl: selfieUrl || null,
        idDocumentUrl: idDocumentUrl || null,
      });

      // Notify user that KYC has been submitted
      await sendKycNotification(userId, record.id, 'INITIATED').catch(console.error);

      return res.status(201).json({
        success: true,
        message: 'KYC verification submitted. You will be notified once reviewed.',
        kyc: {
          id: record.id,
          status: record.status,
          submitted_at: record.created_at,
        },
      });
    }

    // PostgreSQL path
    // Block re-submission if already approved
    const existingRes = await db.query(
      `SELECT id, status FROM kyc_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (existingRes.rows[0]?.status === 'APPROVED') {
      return res.status(400).json({ error: 'KYC is already approved for this account' });
    }

    const r = await db.query(
      `INSERT INTO kyc_verifications
         (user_id, status, provider, id_type, id_number, full_name, date_of_birth,
          selfie_url, id_document_url, created_at, updated_at)
       VALUES ($1, 'PENDING', 'MANUAL', $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, status, created_at`,
      [userId, idType, idNumber, fullName, dateOfBirth, selfieUrl || null, idDocumentUrl || null]
    );
    const record = r.rows[0];

    await sendKycNotification(userId, record.id, 'INITIATED').catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'KYC verification submitted. You will be notified once reviewed.',
      kyc: {
        id: record.id,
        status: record.status,
        submitted_at: record.created_at,
      },
    });
  } catch (err) {
    console.error('[KYC initiate]', err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * GET /api/kyc/status
 * Authenticated. Returns the current user's KYC status.
 */
async function getKycStatus(req, res) {
  try {
    const userId = req.user.id;

    if (useLocal) {
      const record = await local.findKycByUserId(userId);
      if (!record) {
        return res.json({ kyc_status: 'NOT_SUBMITTED', kyc: null });
      }
      return res.json({
        kyc_status: record.status,
        kyc: {
          id: record.id,
          status: record.status,
          id_type: record.id_type,
          submitted_at: record.created_at,
          verified_at: record.verified_at || null,
          rejection_reason: record.rejection_reason || null,
        },
      });
    }

    // Get KYC record + user's kyc_status from users table
    const kycRes = await db.query(
      `SELECT k.id, k.status, k.id_type, k.created_at, k.verified_at, k.rejection_reason,
              u.kyc_status as account_kyc_status
       FROM kyc_verifications k
       JOIN users u ON u.id = k.user_id
       WHERE k.user_id = $1
       ORDER BY k.created_at DESC LIMIT 1`,
      [userId]
    );
    const record = kycRes.rows[0];
    if (!record) {
      return res.json({ kyc_status: 'NOT_SUBMITTED', kyc: null });
    }
    return res.json({
      kyc_status: record.account_kyc_status,
      kyc: {
        id: record.id,
        status: record.status,
        id_type: record.id_type,
        submitted_at: record.created_at,
        verified_at: record.verified_at || null,
        rejection_reason: record.rejection_reason || null,
      },
    });
  } catch (err) {
    console.error('[KYC status]', err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * POST /api/kyc/webhook
 * Public (HMAC-signed by provider). Receives async KYC result.
 *
 * Expected body:
 * {
 *   providerRef: string,   // provider job/reference ID
 *   userId: number,        // VeriTrade user id (or use providerRef to look up)
 *   result: 'APPROVED' | 'REJECTED',
 *   reason?: string        // rejection reason
 * }
 *
 * Header: x-kyc-signature: sha256=<hmac>
 */
async function kycWebhook(req, res) {
  try {
    // Signature check
    const sig = req.headers['x-kyc-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    if (!_verifyWebhookSignature(rawBody, sig)) {
      console.warn('[KYC webhook] Invalid signature');
      return res.status(401).json({ error: 'invalid signature' });
    }

    const { providerRef, userId, result, reason } = req.body;
    if (!userId || !result) {
      return res.status(400).json({ error: 'userId and result are required' });
    }
    if (!['APPROVED', 'REJECTED'].includes(result)) {
      return res.status(400).json({ error: 'result must be APPROVED or REJECTED' });
    }

    const uid = parseInt(userId);

    if (useLocal) {
      const record = await local.findKycByUserId(uid);
      if (!record) return res.status(404).json({ error: 'KYC record not found' });

      // Update KYC record
      const fields = {
        status: result,
        provider_ref: providerRef || null,
        rejection_reason: result === 'REJECTED' ? (reason || 'Verification failed') : null,
        verified_at: result === 'APPROVED' ? new Date().toISOString() : null,
      };
      await local.updateKycFields(record.id, fields);

      // Update user's kyc_status
      const newUserKycStatus = result === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
      await local.updateUserFields(uid, { kyc_status: newUserKycStatus });

      // Notify user
      await sendKycNotification(uid, record.id, result).catch(console.error);

      return res.json({ success: true, result });
    }

    // PostgreSQL path
    const kycRes = await db.query(
      `SELECT id FROM kyc_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [uid]
    );
    const record = kycRes.rows[0];
    if (!record) return res.status(404).json({ error: 'KYC record not found' });

    await db.query(
      `UPDATE kyc_verifications
       SET status = $1, provider_ref = $2, rejection_reason = $3,
           verified_at = $4, updated_at = NOW()
       WHERE id = $5`,
      [
        result,
        providerRef || null,
        result === 'REJECTED' ? (reason || 'Verification failed') : null,
        result === 'APPROVED' ? new Date() : null,
        record.id,
      ]
    );

    const newUserKycStatus = result === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
    await db.query(
      `UPDATE users SET kyc_status = $1 WHERE id = $2`,
      [newUserKycStatus, uid]
    );

    await sendKycNotification(uid, record.id, result).catch(console.error);

    res.json({ success: true, result });
  } catch (err) {
    console.error('[KYC webhook]', err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * GET /api/kyc/notifications
 * Authenticated. Returns the user's in-app notifications.
 * Query params: unreadOnly=true, limit=50, offset=0
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifService = require('../services/notification.service');
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const notifications = await notifService.getNotificationsForUser(userId, { unreadOnly, limit, offset });
    res.json({ notifications });
  } catch (err) {
    console.error('[getNotifications]', err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * PATCH /api/kyc/notifications/:id/read
 * Authenticated. Mark one notification as read.
 */
async function markNotificationRead(req, res) {
  try {
    const userId = req.user.id;
    const notifId = parseInt(req.params.id);
    const notifService = require('../services/notification.service');
    const n = await notifService.markAsRead(notifId, userId);
    if (!n) return res.status(404).json({ error: 'notification not found or already read' });
    res.json({ success: true, notification: n });
  } catch (err) {
    console.error('[markNotificationRead]', err.message);
    res.status(500).json({ error: 'server error' });
  }
}

/**
 * PATCH /api/kyc/notifications/read-all
 * Authenticated. Mark all notifications as read.
 */
async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user.id;
    const notifService = require('../services/notification.service');
    const result = await notifService.markAllAsRead(userId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[markAllNotificationsRead]', err.message);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = {
  initiateKyc,
  getKycStatus,
  kycWebhook,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
