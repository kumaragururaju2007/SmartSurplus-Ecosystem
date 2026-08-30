const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');
const { authenticateToken, allowRoles } = require('../middleware/authentication');

router.post('/:donationId', authenticateToken, allowRoles('DONOR', 'ADMIN'), matchingController.matchDonation);
router.get('/:donationId', authenticateToken, matchingController.getMatchingResults);

module.exports = router;
