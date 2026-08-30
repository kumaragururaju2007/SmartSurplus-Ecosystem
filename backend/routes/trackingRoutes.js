const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const tripTrackingController = require('../controllers/tripTrackingController');
const donationController = require('../controllers/donationController');
const { authenticateToken } = require('../middleware/authentication');

// Public Map Markers for Home and Tracking viewports
router.get('/map/markers', donationController.getPublicMapMarkers);
router.get('/public-map', donationController.getPublicMapMarkers);

// Driver Portal Pairing & Session Authentication (Public)
router.post('/driver/login', tripTrackingController.driverLoginWithPairingCode);

// Driver Authenticated Current Trip
router.get('/driver/trip', authenticateToken, tripTrackingController.getDriverCurrentTrip);

// Legacy status update & legacy details
router.post('/status', authenticateToken, trackingController.updateStatus);

// Real-Time Trip & GPS Ingestion Endpoints
router.post('/trips', authenticateToken, tripTrackingController.createTrip);
router.post('/pickup/start', authenticateToken, tripTrackingController.startPickup);
router.post('/location/update', authenticateToken, tripTrackingController.recordLocationUpdate);
router.post('/driver/location', authenticateToken, tripTrackingController.recordLocationUpdate);
router.post('/driver/signal-arrival', authenticateToken, tripTrackingController.signalDriverArrival);
router.post('/driver/notify-arrival', authenticateToken, tripTrackingController.signalDriverArrival);
router.post('/iot/telemetry', tripTrackingController.iotWebhook);
router.post('/trips/stage', authenticateToken, tripTrackingController.updateTripStage);
router.post('/trip/complete', authenticateToken, tripTrackingController.completeTrip);

// Active Trips List & Fleet Telemetry Locations
router.get('/trips/active', authenticateToken, tripTrackingController.getActiveTrips);
router.get('/fleet/locations', authenticateToken, tripTrackingController.getActiveFleetLocations);

// Real-Time Live Trip Details (by Trip ID or Donation ID)
router.get('/live/:id', authenticateToken, tripTrackingController.getTripLiveTracking);
router.get('/trip/:id', authenticateToken, tripTrackingController.getTripLiveTracking);

// Fallback legacy route
router.get('/:donationId', trackingController.getTrackingDetails);

module.exports = router;
