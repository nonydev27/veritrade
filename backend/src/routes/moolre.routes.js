const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { validateInitiatePay } = require('../middleware/validation.middleware');
const { initiatePay, status, webhook } = require('../controllers/moolre.controller');

router.post('/pay',              auth, validateInitiatePay, initiatePay);  // Buyer initiates MoMo payment
router.get('/status/:reference', auth,                      status);       // Check payment status
router.post('/webhook',                                     webhook);      // Moolre callback (no auth — uses HMAC)

module.exports = router;
