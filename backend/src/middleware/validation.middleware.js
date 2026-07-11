const { body, param, validationResult } = require('express-validator');

/**
 * Run after validation chains — collect errors and return 400 if any exist.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ─── AUTH ──────────────────────────────────────────────────────────────────

const validateRegister = [
  body('phone')
    .trim()
    .notEmpty().withMessage('phone is required')
    .matches(/^0[0-9]{9}$/).withMessage('phone must be a valid 10-digit Ghana number starting with 0'),
  body('password')
    .isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('name')
    .trim()
    .notEmpty().withMessage('name is required')
    .isLength({ max: 150 }).withMessage('name too long'),
  body('role')
    .optional()
    .isIn(['BUYER', 'SELLER']).withMessage('role must be BUYER or SELLER'),
  handleValidationErrors,
];

const validateLogin = [
  body('phone').trim().notEmpty().withMessage('phone is required'),
  body('password').notEmpty().withMessage('password is required'),
  handleValidationErrors,
];

const validateRequestOtp = [
  body('phone')
    .trim()
    .notEmpty().withMessage('phone is required')
    .matches(/^0[0-9]{9}$/).withMessage('phone must be a valid 10-digit Ghana number starting with 0'),
  handleValidationErrors,
];

const validateVerifyOtp = [
  body('phone').trim().notEmpty().withMessage('phone is required'),
  body('otp')
    .notEmpty().withMessage('otp is required')
    .isLength({ min: 6, max: 6 }).withMessage('otp must be 6 digits')
    .isNumeric().withMessage('otp must be numeric'),
  handleValidationErrors,
];

// ─── ESCROW ────────────────────────────────────────────────────────────────

const validateCreateEscrow = [
  body('item')
    .trim()
    .notEmpty().withMessage('item description is required')
    .isLength({ max: 255 }).withMessage('item description too long'),
  body('amount')
    .notEmpty().withMessage('amount is required')
    .isFloat({ gt: 0 }).withMessage('amount must be a positive number')
    .custom(val => {
      if (parseFloat(val) > 100000) throw new Error('amount cannot exceed GHS 100,000');
      return true;
    }),
  body('seller_phone')
    .trim()
    .notEmpty().withMessage('seller_phone is required')
    .matches(/^0[0-9]{9}$/).withMessage('seller_phone must be a valid 10-digit Ghana number'),
  handleValidationErrors,
];

const validateTransactionCode = [
  body('transactionCode')
    .trim()
    .notEmpty().withMessage('transactionCode is required')
    .isLength({ min: 6, max: 20 }).withMessage('invalid transactionCode'),
  handleValidationErrors,
];

const validateConfirm = [
  body('transactionCode').trim().notEmpty().withMessage('transactionCode is required'),
  body('deliveryPin')
    .notEmpty().withMessage('deliveryPin is required')
    .isLength({ min: 6, max: 6 }).withMessage('deliveryPin must be 6 digits')
    .isNumeric().withMessage('deliveryPin must be numeric'),
  handleValidationErrors,
];

const validateDispute = [
  body('transactionCode').trim().notEmpty().withMessage('transactionCode is required'),
  body('reason')
    .optional()
    .isLength({ max: 500 }).withMessage('reason too long'),
  handleValidationErrors,
];

// ─── MOOLRE ────────────────────────────────────────────────────────────────

const validateInitiatePay = [
  body('transactionCode').trim().notEmpty().withMessage('transactionCode is required'),
  body('phone')
    .trim()
    .notEmpty().withMessage('phone is required')
    .matches(/^0[0-9]{9}$/).withMessage('phone must be a valid 10-digit Ghana number'),
  body('network')
    .optional()
    .isIn(['MTN', 'VODAFONE', 'AIRTELTIGO']).withMessage('network must be MTN, VODAFONE, or AIRTELTIGO'),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateRequestOtp,
  validateVerifyOtp,
  validateCreateEscrow,
  validateTransactionCode,
  validateConfirm,
  validateDispute,
  validateInitiatePay,
};
