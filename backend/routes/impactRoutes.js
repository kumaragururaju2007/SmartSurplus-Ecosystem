const express = require('express');
const router = express.Router();
const impactController = require('../controllers/impactController');
const { authenticateToken } = require('../middleware/authentication');

router.get('/summary', impactController.getImpactSummary);
router.get('/monthly', impactController.getMonthlyImpact);
router.get('/report', authenticateToken, impactController.getImpactReport);

module.exports = router;
