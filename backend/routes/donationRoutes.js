const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { authenticateToken, allowRoles } = require('../middleware/authentication');

router.post('/', authenticateToken, allowRoles('DONOR', 'ADMIN'), donationController.createDonation);
router.get('/map/markers', donationController.getPublicMapMarkers);
router.get('/public-map', donationController.getPublicMapMarkers);
router.get('/profile', authenticateToken, donationController.getDonorProfile);
router.put('/profile', authenticateToken, allowRoles('DONOR', 'ADMIN'), donationController.updateDonorProfile);
router.get('/public-profile/:id', authenticateToken, donationController.getPublicDonorProfile);
router.get('/my', authenticateToken, allowRoles('DONOR', 'ADMIN'), donationController.getMyDonations);
router.get('/my-donations', authenticateToken, allowRoles('DONOR', 'ADMIN'), donationController.getMyDonations);
router.get('/dashboard-summary', authenticateToken, allowRoles('DONOR', 'ADMIN'), donationController.getDashboardSummary);
router.get('/analytics', authenticateToken, allowRoles('DONOR', 'ADMIN'), donationController.getDonorAnalytics);
router.get('/donor-analytics', authenticateToken, allowRoles('DONOR', 'ADMIN'), donationController.getDonorAnalytics);
router.post('/:id/rate-donor', authenticateToken, allowRoles('NGO', 'BIOGAS', 'ADMIN'), donationController.rateDonor);
router.post('/rate-donor', authenticateToken, allowRoles('NGO', 'BIOGAS', 'ADMIN'), donationController.rateDonor);
router.get('/trust-score', authenticateToken, donationController.getDonorTrustScore);
router.get('/:id/trust-score', donationController.getDonorTrustScore);
router.get('/:id', authenticateToken, donationController.getDonationById);
router.put('/:id/status', authenticateToken, donationController.updateDonationStatus);
router.put('/:id/cancel', authenticateToken, allowRoles('DONOR'), donationController.cancelDonation);

module.exports = router;
