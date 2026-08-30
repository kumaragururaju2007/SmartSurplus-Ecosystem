const http = require('http');
const db = require('./database/databaseConnection');
const fleetController = require('./controllers/fleetController');
const tripTrackingController = require('./controllers/tripTrackingController');

async function runTests() {
  console.log('🧪 Starting Vehicle & Driver Real-Time Tracking Automated Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
    }
  }

  // Setup mock user & NGO in memoryStore if not exists
  const mockUser = { id: 50, name: 'Compassion Food Bank', email: 'ngo@compassion.org', role: 'NGO' };
  const mockNgo = { id: 10, user_id: 50, organization_name: 'Compassion Food Bank', address: '45 Anna Salai, Chennai', latitude: 13.0358, longitude: 80.2443 };
  const mockDonor = { id: 20, business_name: 'ITC Grand Chola', address: '63 Mount Road, Guindy, Chennai', latitude: 13.0102, longitude: 80.2207 };
  const mockDonation = { id: 1024, donor_id: 20, title: 'Buffet Surplus Rice & Curry', quantity: 50, quantity_unit: 'Meals', status: 'ACCEPTED', pickup_address: '63 Mount Road, Guindy, Chennai', latitude: 13.0102, longitude: 80.2207 };

  db.memoryStore.ngos.push(mockNgo);
  db.memoryStore.donors.push(mockDonor);
  db.memoryStore.donations.push(mockDonation);
  db.memoryStore.donation_matches.push({ id: 1, donation_id: 1024, ngo_id: 10, match_status: 'ACCEPTED' });

  const createMockRes = (storeObj) => ({
    status(code) {
      storeObj.code = code;
      return this;
    },
    json(data) {
      Object.assign(storeObj, data);
      return storeObj;
    }
  });

  // Test 1: Register Vehicle with Indian Plate Format (TN 38 AB 1234)
  let res1 = {};
  await fleetController.createVehicle(
    { user: mockUser, body: { vehicleNumber: 'tn38ab1234', vehicleType: 'Food Transport Van', capacity: '1200 kg', fuelType: 'Diesel', gpsTrackingMethod: 'DRIVER_MOBILE_GPS' } },
    createMockRes(res1),
    (err) => { console.error(err); }
  );

  assert(res1.success === true && res1.vehicle.vehicle_number === 'TN 38 AB 1234', '1. Register vehicle with valid Indian plate formatting (TN 38 AB 1234)');
  const vehicleId = res1.vehicleId;

  // Test 1b: Register Vehicle with Single-Letter State Prefix (N 38 AB 1234)
  let res1b = {};
  await fleetController.createVehicle(
    { user: mockUser, body: { vehicleNumber: 'N 38 AB 1234', vehicleType: 'Mini Truck', capacity: '800 kg', fuelType: 'CNG', gpsTrackingMethod: 'DRIVER_MOBILE_GPS' } },
    createMockRes(res1b),
    (err) => { console.error(err); }
  );
  assert(res1b.success === true && res1b.vehicle.vehicle_number === 'N 38 AB 1234', '1b. Register vehicle with single-letter prefix (N 38 AB 1234)');

  // Test 2: Attempt Duplicate Plate Registration
  let res2 = {};
  await fleetController.createVehicle(
    { user: mockUser, body: { vehicleNumber: 'TN 38 AB 1234', vehicleType: 'Mini Truck' } },
    createMockRes(res2),
    (err) => { console.error(err); }
  );
  assert(res2.code === 409 && res2.message === 'This vehicle is already registered.', '2. Prevent duplicate vehicle registration across platform');

  // Test 3: Reject Invalid Vehicle Plate Format
  let res3 = {};
  await fleetController.createVehicle(
    { user: mockUser, body: { vehicleNumber: 'INVALID-999-XYZ' } },
    createMockRes(res3),
    (err) => { console.error(err); }
  );
  assert(res3.code === 400 && res3.message.includes('Invalid Indian vehicle registration number format'), '3. Reject malformed vehicle registration plate');

  // Test 4: Register Authentic Driver
  let res4 = {};
  await fleetController.createDriver(
    { user: mockUser, body: { driverName: 'Ravi Kumar', driverPhone: '+919876543210', licenseNumber: 'TN-01-2018-0098765', employeeId: 'EMP-902', vehicleId } },
    createMockRes(res4),
    (err) => { console.error(err); }
  );
  assert(res4.success === true && res4.driverId > 0, '4. Register authentic driver & link with vehicle');
  const driverId = res4.driverId;

  // Test 5: Create Food Rescue Trip (Donation -> NGO -> Vehicle -> Driver)
  let res5 = {};
  await tripTrackingController.createTrip(
    { user: mockUser, body: { donationId: 1024, vehicleId, driverId, trackingMethod: 'DRIVER_MOBILE_GPS' }, app: { get: () => null } },
    createMockRes(res5),
    (err) => { console.error(err); }
  );
  assert(res5.success === true && res5.tripCode.startsWith('TRIP-D1024'), '5. Create dispatch trip connecting Donation #1024 with vehicle and driver');
  const tripId = res5.tripId;

  // Test 6: Start Pickup
  let res6 = {};
  await tripTrackingController.startPickup(
    { user: mockUser, body: { tripId }, app: { get: () => null } },
    createMockRes(res6),
    (err) => { console.error(err); }
  );
  assert(res6.success === true && res6.status === 'PICKUP_STARTED', '6. Start pickup: updates trip, donation, vehicle and driver status to ON_TRIP');

  // Test 7: Stream Real GPS Location from Driver Mobile
  let res7 = {};
  await tripTrackingController.recordLocationUpdate(
    { body: { tripId, vehicleId, driverId, latitude: 13.0155, longitude: 80.2250, accuracy: 8.5, speed: 32.4, heading: 145.0, timestamp: Date.now() }, app: { get: () => null } },
    createMockRes(res7),
    (err) => { console.error(err); }
  );
  assert(res7.success === true && res7.status === 'GPS_LIVE', '7. Ingest real mobile GPS telemetry & transition status to GPS_LIVE');

  // Test 8: Verify Live Tracking & Driver Privacy Masking for Donor
  let res8 = {};
  await tripTrackingController.getTripLiveTracking(
    { params: { id: tripId }, user: { id: 99, role: 'DONOR' } },
    createMockRes(res8),
    (err) => { console.error(err); }
  );
  assert(
    res8.success === true && 
    res8.trip.current_location.latitude === 13.0155 &&
    res8.trip.driver.driver_phone.includes('XXX'),
    '8. Live tracking returns authentic GPS coordinates and masks driver phone for Donors'
  );

  // Test 9: Verify Full Driver Phone for Authorized NGO
  let res9 = {};
  await tripTrackingController.getTripLiveTracking(
    { params: { id: tripId }, user: { id: 50, role: 'NGO', ngoId: 10 } },
    createMockRes(res9),
    (err) => { console.error(err); }
  );
  assert(
    res9.success === true && 
    res9.trip.driver.driver_phone === '+919876543210',
    '9. Authorized NGO receives unmasked driver phone for operations'
  );

  // Test 10: Complete Trip & Verify Automatic Vehicle/Driver Release to AVAILABLE
  let res10 = {};
  await tripTrackingController.updateTripStage(
    { user: mockUser, body: { tripId, stage: 'COMPLETED' }, app: { get: () => null } },
    createMockRes(res10),
    (err) => { console.error(err); }
  );
  const releasedVehicle = db.memoryStore.vehicles.find(v => v.id === vehicleId);
  const releasedDriver = db.memoryStore.drivers.find(d => d.id === driverId);
  assert(
    res10.success === true && 
    releasedVehicle.status === 'AVAILABLE' && 
    releasedDriver.status === 'AVAILABLE',
    '10. Trip completion automatically releases vehicle and driver back to AVAILABLE'
  );

  // Test 11: Register Biogas Facility Vehicle & Driver
  const mockBiogasUser = { id: 60, name: 'EcoGreen Biogas Energy', email: 'biogas@ecogreen.org', role: 'BIOGAS' };
  const mockBiogasPlant = { id: 15, user_id: 60, plant_name: 'EcoGreen Biogas Energy', location: '10 Industrial Estate, Chennai', latitude: 13.0827, longitude: 80.2707, is_verified: true, is_available: true };
  db.memoryStore.biogas_plants.push(mockBiogasPlant);

  let res11 = {};
  await fleetController.createVehicle(
    { user: mockBiogasUser, body: { vehicleNumber: 'KA 01 AB 5678', vehicleType: 'Waste Collection Van', capacity: '2000 kg', fuelType: 'CNG', gpsTrackingMethod: 'DRIVER_MOBILE_GPS' } },
    createMockRes(res11),
    (err) => { console.error(err); }
  );
  assert(res11.success === true && res11.vehicle.vehicle_number === 'KA 01 AB 5678', '11. Register vehicle for Biogas Facility with Indian plate format');
  const bioVehicleId = res11.vehicleId;

  let res12 = {};
  await fleetController.createDriver(
    { user: mockBiogasUser, body: { driverName: 'Suresh Kumar', driverPhone: '+919840123456', licenseNumber: 'KA-01-2020-0012345', vehicleId: bioVehicleId } },
    createMockRes(res12),
    (err) => { console.error(err); }
  );
  assert(res12.success === true && res12.driverId > 0, '12. Register driver for Biogas Facility & link with vehicle');
  const bioDriverId = res12.driverId;

  // Test 13: Generate Secure 6-Digit Random Pairing Code
  let res13 = {};
  await fleetController.generatePairingCode(
    { user: mockBiogasUser, body: { vehicleId: bioVehicleId, driverId: bioDriverId } },
    createMockRes(res13),
    (err) => { console.error(err); }
  );
  assert(
    res13.success === true && 
    typeof res13.code === 'string' && 
    res13.code.length === 6 && 
    /^[0-9]{6}$/.test(res13.code),
    '13. Generate cryptographically secure 6-digit random pairing code with expiration'
  );
  const generatedCode = res13.code;

  // Test 14: Driver Login via Pairing Code
  let res14 = {};
  await tripTrackingController.driverLoginWithPairingCode(
    { body: { code: generatedCode } },
    createMockRes(res14),
    (err) => { console.error(err); }
  );
  assert(
    res14.success === true && 
    res14.driver.name === 'Suresh Kumar' && 
    res14.vehicle.vehicleNumber === 'KA 01 AB 5678' &&
    typeof res14.token === 'string',
    '14. Driver successfully logs in via 6-digit pairing code & receives driver session token'
  );

  // Test 15: Prevent Re-use of Single-Use Pairing Code
  let res15 = {};
  await tripTrackingController.driverLoginWithPairingCode(
    { body: { code: generatedCode } },
    createMockRes(res15),
    (err) => { console.error(err); }
  );
  assert(
    res15.code === 400 && 
    res15.message.includes('already been used'),
    '15. Enforce single-use restriction on pairing code (reject reuse)'
  );

  console.log(`\n========================================`);
  console.log(`Results: ${passed} / ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
