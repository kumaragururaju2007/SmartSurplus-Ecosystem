const express = require('express');
const router = express.Router();
const fleetController = require('../controllers/fleetController');
const { authenticateToken } = require('../middleware/authentication');

// Vehicle Management Routes
router.get('/vehicles', authenticateToken, fleetController.getVehicles);
router.post('/vehicles', authenticateToken, fleetController.createVehicle);
router.put('/vehicles/:id', authenticateToken, fleetController.updateVehicleStatus);
router.delete('/vehicles/:id', authenticateToken, fleetController.deleteVehicle);

// Driver Management Routes
router.get('/drivers', authenticateToken, fleetController.getDrivers);
router.post('/drivers', authenticateToken, fleetController.createDriver);
router.put('/drivers/:id', authenticateToken, fleetController.updateDriver);
router.delete('/drivers/:id', authenticateToken, fleetController.deleteDriver);
router.post('/drivers/assign', authenticateToken, fleetController.assignDriverToVehicle);

// Vehicle GPS / IoT Device Registration
router.post('/devices', authenticateToken, fleetController.registerGpsDevice || fleetController.registerGPSDevice);
router.post('/devices/pair', authenticateToken, fleetController.pairDeviceWithVehicle);

// Driver Mobile GPS Pairing
router.post('/pairing/generate', authenticateToken, fleetController.generatePairingCode);

module.exports = router;
