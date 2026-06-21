const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { createEscrow, listTransactions, pay, confirm, dispute, cancel } = require('../controllers/escrow.controller');

router.post('/create', auth, createEscrow);
router.get('/list', auth, listTransactions);
router.post('/pay', pay);
router.post('/confirm', auth, confirm);
router.post('/dispute', auth, dispute);
router.post('/cancel', auth, cancel);

module.exports = router;
