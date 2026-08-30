const express = require('express');
const router = express.Router();
const timerController = require('../controllers/timerController');
const { authenticateToken, allowRoles } = require('../middleware/authentication');

router.get('/status', authenticateToken, allowRoles('ADMIN', 'DONOR'), timerController.getTimerStatus);

module.exports = router;
