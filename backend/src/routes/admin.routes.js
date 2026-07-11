'use strict';
const express = require('express');
const router  = express.Router();
const adminOnly = require('../middleware/admin.middleware');
const {
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
} = require('../controllers/admin.controller');

// All admin routes require a valid JWT with role ADMIN
// ─── Disputes ─────────────────────────────────────────────────────────────────
router.get('/disputes',                   adminOnly, listDisputes);       // List open disputes
router.get('/disputes/:id',               adminOnly, getDisputeDetails);  // Single dispute detail
router.post('/disputes/:id/review',       adminOnly, reviewDispute);      // Mark under review
router.post('/disputes/:id/resolve',      adminOnly, resolveDispute);     // Generic resolve (REFUND | PAY_SELLER)
router.post('/disputes/:id/refund',       adminOnly, refundBuyer);        // Rule for buyer → REFUNDED
router.post('/disputes/:id/pay-seller',   adminOnly, paySeller);          // Rule for seller → COMPLETED + payout

// ─── KYC Management ───────────────────────────────────────────────────────────
router.get('/kyc',              adminOnly, listPendingKyc);    // List pending KYC submissions
router.post('/kyc/:id/approve', adminOnly, approveKyc);        // Approve a KYC record
router.post('/kyc/:id/reject',  adminOnly, rejectKyc);         // Reject a KYC record

// ─── Audit Log ────────────────────────────────────────────────────────────────
router.get('/audit-log', adminOnly, getAuditLog);              // View admin action history

module.exports = router;
