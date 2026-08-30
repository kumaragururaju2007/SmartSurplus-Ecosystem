const express = require('express');
const router = express.Router();
const ngoController = require('../controllers/ngoController');
const { authenticateToken, allowRoles } = require('../middleware/authentication');

// 1. Dashboard & Profile
router.get('/dashboard', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getDashboardSummary);
router.get('/dashboard-summary', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getDashboardSummary);
router.get('/profile', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getNGOProfile);
router.put('/profile', authenticateToken, allowRoles('NGO'), ngoController.updateNGOProfile);
router.post('/documents', authenticateToken, allowRoles('NGO'), ngoController.uploadNGODocument);

// 2. Incoming Requests (Donor Offers Assigned to NGO)
router.get('/incoming-requests', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getIncomingRequests);
router.post('/donations/:id/accept', authenticateToken, allowRoles('NGO'), ngoController.acceptDonation);
router.put('/donations/:id/accept', authenticateToken, allowRoles('NGO'), ngoController.acceptDonation);
router.post('/incoming-donations/:id/accept', authenticateToken, allowRoles('NGO'), ngoController.acceptDonation);
router.put('/incoming-donations/:id/accept', authenticateToken, allowRoles('NGO'), ngoController.acceptDonation);

router.post('/donations/:id/reject', authenticateToken, allowRoles('NGO'), ngoController.rejectDonation);
router.put('/donations/:id/reject', authenticateToken, allowRoles('NGO'), ngoController.rejectDonation);
router.post('/incoming-donations/:id/reject', authenticateToken, allowRoles('NGO'), ngoController.rejectDonation);
router.put('/incoming-donations/:id/reject', authenticateToken, allowRoles('NGO'), ngoController.rejectDonation);

// 3. Matched & Incoming Donations
router.get('/matched-donations', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getMatchedDonations);
router.get('/incoming-donations', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getIncomingDonations);
router.put('/incoming-donations/:id/status', authenticateToken, allowRoles('NGO'), ngoController.updateIncomingStatus);

// 4. Beneficiaries, Impact, History, Reports, Notifications & Settings
router.get('/history', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getNGOHistory);
router.post('/donations/:id/confirm-receipt', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.confirmDonationReceiptAndImpact);
router.post('/donations/:id/receive', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.confirmDonationReceiptAndImpact);
router.put('/donations/:id/actual-people-served', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.updateActualPeopleServed);
router.put('/donations/:id/actual-count', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.updateActualPeopleServed);

router.get('/beneficiaries', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getBeneficiariesSummary);
router.get('/impact', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getNGOImpact);
router.get('/reports', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getNGOReports);

router.get('/notifications', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getNGONotifications);
router.put('/notifications/read-all', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.markAllNotificationsAsRead);
router.put('/notifications/all/read', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.markNotificationAsRead);
router.put('/notifications/:id/read', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.markNotificationAsRead);

router.get('/settings', authenticateToken, allowRoles('NGO', 'ADMIN'), ngoController.getNGOSettings);
router.put('/settings', authenticateToken, allowRoles('NGO'), ngoController.updateNGOSettings);

module.exports = router;
