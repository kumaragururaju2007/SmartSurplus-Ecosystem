const express = require('express');
const router = express.Router();
const biogasController = require('../controllers/biogasController');
const { authenticateToken, allowRoles } = require('../middleware/authentication');

router.get('/profile', authenticateToken, allowRoles('BIOGAS', 'ADMIN'), biogasController.getBiogasProfile);
router.put('/profile', authenticateToken, allowRoles('BIOGAS'), biogasController.updateBiogasProfile);
router.post('/documents', authenticateToken, allowRoles('BIOGAS'), biogasController.uploadBiogasDocument);

router.get('/requests', authenticateToken, allowRoles('BIOGAS', 'ADMIN'), biogasController.getBiogasRequests);
router.get('/requests/:id', authenticateToken, allowRoles('BIOGAS', 'ADMIN'), biogasController.getBiogasRequestDetails);

router.post('/donations/:id/accept', authenticateToken, allowRoles('BIOGAS'), biogasController.acceptBiogasRequest);
router.post('/donations/:id/reject', authenticateToken, allowRoles('BIOGAS'), biogasController.rejectBiogasRequest);
router.post('/donations/:id/start-pickup', authenticateToken, allowRoles('BIOGAS'), biogasController.startPickup);
router.post('/donations/:id/collect', authenticateToken, allowRoles('BIOGAS'), biogasController.completeCollection);
router.post('/donations/:id/complete', authenticateToken, allowRoles('BIOGAS'), biogasController.completeProcessing);

module.exports = router;
