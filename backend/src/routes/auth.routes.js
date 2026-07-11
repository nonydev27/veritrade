const express = require('express');
const router = express.Router();
const { register, login, requestOtp, verifyOtpHandler } = require('../controllers/auth.controller');
const { validateRegister, validateLogin, validateRequestOtp, validateVerifyOtp } = require('../middleware/validation.middleware');

router.post('/register',     validateRegister,    register);
router.post('/login',        validateLogin,       login);
router.post('/request-otp',  validateRequestOtp,  requestOtp);
router.post('/verify-otp',   validateVerifyOtp,   verifyOtpHandler);

module.exports = router;
