const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authentication');

router.post('/checkout', authenticateToken, paymentController.createCheckout);
router.post('/verify', authenticateToken, paymentController.verifyPayment);

module.exports = router;
