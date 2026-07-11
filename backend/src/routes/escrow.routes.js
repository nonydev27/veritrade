const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { validateCreateEscrow, validateTransactionCode, validateConfirm, validateDispute } = require('../middleware/validation.middleware');
const { createEscrow, listTransactions, sellerAccept, sellerReject, pay, ship, confirm, dispute, cancel, getLedger } = require('../controllers/escrow.controller');

router.post('/create',         auth, validateCreateEscrow,    createEscrow);
router.get('/list',            auth,                          listTransactions);
router.post('/accept',         auth, validateTransactionCode, sellerAccept);
router.post('/reject',         auth, validateTransactionCode, sellerReject);
router.post('/pay',                                           pay);          // Blocked — 403 always
router.post('/ship',           auth, validateTransactionCode, ship);
router.post('/confirm',        auth, validateConfirm,         confirm);
router.post('/dispute',        auth, validateDispute,         dispute);
router.post('/cancel',         auth, validateTransactionCode, cancel);
router.get('/ledger/:code',    auth,                          getLedger);

module.exports = router;
