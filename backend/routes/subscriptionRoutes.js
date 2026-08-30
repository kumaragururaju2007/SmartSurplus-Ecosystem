const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/authentication');

router.get('/plans', subscriptionController.getPlans);
router.get('/current', authenticateToken, subscriptionController.getCurrentSubscription);
router.post('/create', authenticateToken, subscriptionController.createSubscription);
router.post('/cancel', authenticateToken, subscriptionController.cancelSubscription);

module.exports = router;
