const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authentication');

router.get('/', authenticateToken, notificationController.getNotifications);
router.post('/test-mobile', authenticateToken, notificationController.sendTestNotification);
router.put('/:id/read', authenticateToken, notificationController.markAsRead);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

module.exports = router;
