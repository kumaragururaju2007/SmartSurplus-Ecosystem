const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, allowRoles } = require('../middleware/authentication');

// All Admin routes require authentication and ADMIN role
router.use(authenticateToken, allowRoles('ADMIN'));

// 1. Dashboard Overview & Summary
router.get('/summary', adminController.getDashboardSummary);
router.get('/dashboard/summary', adminController.getDashboardSummary);
router.get('/dashboard-summary', adminController.getDashboardSummary);

// 2. Organizations Management & Profile Details
router.get('/organizations', adminController.getOrganizations);
router.get('/organizations/:type/:id', adminController.getOrganizationDetails);
router.post('/organizations/:type/:id/action', adminController.performOrganizationAction);
router.post('/organizations/:type/:id/documents/:docId/action', adminController.performDocumentAction);
router.put('/organizations/:type/:id/documents/:docId/action', adminController.performDocumentAction);
router.put('/organizations/:type/:id/verify', (req, res, next) => {
  req.body.action = 'VERIFY';
  adminController.performOrganizationAction(req, res, next);
});
router.put('/organizations/:type/:id/reject', (req, res, next) => {
  req.body.action = 'REJECT';
  adminController.performOrganizationAction(req, res, next);
});

// Legacy aliases for backward compatibility
router.put('/ngos/:id/verify', (req, res, next) => {
  req.params.type = 'ngos';
  req.body.action = 'VERIFY';
  adminController.performOrganizationAction(req, res, next);
});
router.put('/ngos/:id/reject', (req, res, next) => {
  req.params.type = 'ngos';
  req.body.action = 'REJECT';
  adminController.performOrganizationAction(req, res, next);
});
router.put('/biogas/:id/verify', (req, res, next) => {
  req.params.type = 'biogas';
  req.body.action = 'VERIFY';
  adminController.performOrganizationAction(req, res, next);
});
router.put('/biogas/:id/reject', (req, res, next) => {
  req.params.type = 'biogas';
  req.body.action = 'REJECT';
  adminController.performOrganizationAction(req, res, next);
});

// 3. Verification Queue
router.get('/verification', adminController.getVerificationQueue);

// 4. Donations & Journey
router.get('/donations', adminController.getDonations);
router.get('/donations/:id/journey', adminController.getDonationJourney);

// 5. Live Tracking & Platform Maps
router.get('/tracking/live', adminController.getLiveTracking);
router.get('/live-tracking', adminController.getLiveTracking);
router.get('/map/markers', adminController.getMapMarkers);

// 6. Analytics & Reports
router.get('/analytics', adminController.getAdminAnalytics);
router.get('/reports', adminController.getAdminReports);

// 7. Audit Logs & System Notifications Management
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/notifications', adminController.getAdminNotifications);
router.get('/notifications/recipients', adminController.getNotificationRecipients);
router.post('/notifications/send', adminController.sendAdminNotification);
router.get('/notifications/history', adminController.getAdminNotificationHistory);
router.get('/notifications/history/:id', adminController.getAdminNotificationDetail);

// 8. User, Subscription & Payment Administration
router.get('/users', adminController.getUsers);
router.get('/subscriptions', adminController.getSubscriptions);
router.get('/payments', adminController.getPayments);

// 9. Donor Complaints & Confidential Quality Feedback
router.get('/complaints', adminController.getDonorComplaintsAndReviews);
router.get('/donor-reviews', adminController.getDonorComplaintsAndReviews);
router.put('/complaints/:id/status', adminController.updateComplaintStatus);

// 10. System Reset & Maintenance
router.post('/system/reset-data', adminController.resetSystemData);

module.exports = router;

