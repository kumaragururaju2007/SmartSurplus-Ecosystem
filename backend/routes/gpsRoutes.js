const express = require('express');
const router = express.Router();
const gpsController = require('../controllers/gpsController');
const { authenticateGpsDevice, sanitizeGpsPayload } = require('../middleware/gpsAuth');

// 1. Direct Physical Hardware Ingestion Webhook (called by SIM800L, 4G module, ESP32, Sinotrack)
router.post('/location', authenticateGpsDevice, sanitizeGpsPayload, gpsController.ingestLocation);
router.post('/telemetry', authenticateGpsDevice, sanitizeGpsPayload, gpsController.ingestLocation);

// 2. Query Endpoints for React Live Maps & Admin Dashboards
router.get('/latest/:deviceId', gpsController.getLatestLocation);
router.get('/history/:deviceId', gpsController.getLocationHistory);

// 3. Register or Link Physical Device
router.post('/register', gpsController.registerDevice);
router.post('/device', gpsController.registerDevice);

module.exports = router;
