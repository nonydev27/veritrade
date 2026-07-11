'use strict';
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {
  initiateKyc,
  getKycStatus,
  kycWebhook,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/kyc.controller');

// ─── KYC ──────────────────────────────────────────────────────────────────────
router.post('/initiate',    auth, initiateKyc);    // Start KYC verification
router.get('/status',       auth, getKycStatus);   // Check KYC status
router.post('/webhook',          kycWebhook);      // Provider callback (no JWT, HMAC-signed)

// ─── Notifications (co-located here for DRY routing) ─────────────────────────
router.get('/notifications',              auth, getNotifications);           // List notifications
router.patch('/notifications/read-all',   auth, markAllNotificationsRead);   // Mark all as read
router.patch('/notifications/:id/read',   auth, markNotificationRead);       // Mark one as read

module.exports = router;
