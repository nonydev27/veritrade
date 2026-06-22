const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { initiatePay, status, webhook } = require('../controllers/moolre.controller');

router.post('/pay', auth, initiatePay);          // buyer initiates MoMo payment
router.get('/status/:reference', auth, status);   // check payment status
router.post('/webhook', webhook);                  // Moolre callback (no auth — uses HMAC)

module.exports = router;
