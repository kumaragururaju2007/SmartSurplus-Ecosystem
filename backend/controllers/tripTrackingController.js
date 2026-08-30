const jwt = require('jsonwebtoken');
const db = require('../database/databaseConnection');
const notificationService = require('../services/notificationService');

// Phone Masking helper for privacy protection
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '+91 XXXXX XXXXX';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    const first2 = digits.slice(0, 2);
    const last2 = digits.slice(-2);
    return `+91 ${first2}XXX XX${last2}`;
  }
  return '+91 XXXXX XXXXX';
}

// Helper to resolve or auto-provision Handler record (NGO or BIOGAS) for authenticated user
async function resolveHandlerForUser(user) {
  if (!user) return null;
  const userId = user.userId || user.id;
  const role = (user.role || '').toUpperCase();

  if (role === 'BIOGAS') {
    if (db.isConnected) {
      let [rows] = await db.query('SELECT * FROM biogas_plants WHERE user_id = ?', [userId]);
      if (rows && rows.length > 0) return { handlerType: 'BIOGAS', handlerId: rows[0].id, organizationName: rows[0].plant_name || 'Biogas Facility', address: rows[0].address || 'Biogas Plant Hub', latitude: rows[0].latitude, longitude: rows[0].longitude };

      [rows] = await db.query('SELECT * FROM biogas_plants WHERE id = ?', [userId]);
      if (rows && rows.length > 0) return { handlerType: 'BIOGAS', handlerId: rows[0].id, organizationName: rows[0].plant_name || 'Biogas Facility', address: rows[0].address || 'Biogas Plant Hub', latitude: rows[0].latitude, longitude: rows[0].longitude };

      const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const u = (uRows && uRows[0]) || {};
      const plantName = u.name || 'Biogas Recovery Facility';
      const [ins] = await db.query(
        'INSERT INTO biogas_plants (user_id, plant_name, operator_name, address) VALUES (?, ?, ?, ?)',
        [userId, plantName, u.name || 'Plant Operator', u.address || 'Biogas Plant Hub']
      );
      return { handlerType: 'BIOGAS', handlerId: ins.insertId, organizationName: plantName, address: 'Biogas Plant Hub', latitude: null, longitude: null };
    } else {
      let plant = (db.memoryStore.biogas_plants || []).find(p => Number(p.user_id) === Number(userId) || Number(p.id) === Number(userId));
      if (plant) return { handlerType: 'BIOGAS', handlerId: plant.id, organizationName: plant.plant_name || 'Biogas Facility', address: plant.location || 'Biogas Plant Hub', latitude: plant.latitude || null, longitude: plant.longitude || null };

      const u = (db.memoryStore.users || []).find(usr => Number(usr.id) === Number(userId)) || {};
      const newId = (db.memoryStore.biogas_plants?.length || 0) + 1;
      const newPlant = {
        id: newId,
        user_id: Number(userId),
        plant_name: u.name || 'Biogas Recovery Facility',
        operator_name: u.name || 'Plant Operator',
        email: u.email || '',
        phone: u.phone || '',
        location: 'Biogas Plant Hub',
        latitude: null,
        longitude: null
      };
      db.memoryStore.biogas_plants = db.memoryStore.biogas_plants || [];
      db.memoryStore.biogas_plants.push(newPlant);
      return { handlerType: 'BIOGAS', handlerId: newId, organizationName: newPlant.plant_name, address: newPlant.location, latitude: null, longitude: null };
    }
  }

  // NGO resolution
  if (db.isConnected) {
    let [rows] = await db.query('SELECT * FROM ngos WHERE user_id = ?', [userId]);
    if (rows && rows.length > 0) return { handlerType: 'NGO', handlerId: rows[0].id, organizationName: rows[0].organization_name || 'Verified NGO', address: rows[0].address || 'NGO Shelter Hub', latitude: rows[0].latitude, longitude: rows[0].longitude };

    [rows] = await db.query('SELECT * FROM ngos WHERE id = ?', [userId]);
    if (rows && rows.length > 0) return { handlerType: 'NGO', handlerId: rows[0].id, organizationName: rows[0].organization_name || 'Verified NGO', address: rows[0].address || 'NGO Shelter Hub', latitude: rows[0].latitude, longitude: rows[0].longitude };

    [rows] = await db.query('SELECT * FROM ngos LIMIT 1');
    if (rows && rows.length > 0) return { handlerType: 'NGO', handlerId: rows[0].id, organizationName: rows[0].organization_name || 'Verified NGO', address: rows[0].address || 'NGO Shelter Hub', latitude: rows[0].latitude, longitude: rows[0].longitude };

    const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const u = (uRows && uRows[0]) || {};
    const orgName = u.name || 'Verified NGO Organization';
    try {
      const [ins] = await db.query(
        'INSERT INTO ngos (user_id, organization_name, contact_person, address, is_verified, official_email, official_phone) VALUES (?, ?, ?, ?, true, ?, ?)',
        [userId, orgName, u.name || 'NGO Manager', u.address || 'Chennai Central Distribution Hub', u.email || '', u.phone || '']
      );
      return { handlerType: 'NGO', handlerId: ins.insertId, organizationName: orgName, address: u.address || 'Chennai Central Distribution Hub', latitude: null, longitude: null };
    } catch (e) {
      return { handlerType: 'NGO', handlerId: 1, organizationName: orgName, address: 'Chennai Central Distribution Hub', latitude: null, longitude: null };
    }
  } else {
    let ngo = (db.memoryStore.ngos || []).find(n => Number(n.user_id) === Number(userId) || Number(n.id) === Number(userId));
    if (ngo) return { handlerType: 'NGO', handlerId: ngo.id, organizationName: ngo.organization_name || 'Verified NGO', address: ngo.address || 'NGO Shelter Hub', latitude: ngo.latitude || null, longitude: ngo.longitude || null };
    if ((db.memoryStore.ngos || []).length > 0) {
      const first = db.memoryStore.ngos[0];
      return { handlerType: 'NGO', handlerId: first.id, organizationName: first.organization_name, address: first.address, latitude: null, longitude: null };
    }

    const u = (db.memoryStore.users || []).find(usr => Number(usr.id) === Number(userId)) || {};
    const newId = (db.memoryStore.ngos?.length || 0) + 1;
    const newNgo = {
      id: newId,
      user_id: Number(userId),
      organization_name: u.name || 'Verified NGO Organization',
      contact_person: u.name || 'NGO Manager',
      official_email: u.email || '',
      official_phone: u.phone || '',
      address: 'NGO Shelter Hub',
      latitude: null,
      longitude: null
    };
    db.memoryStore.ngos = db.memoryStore.ngos || [];
    db.memoryStore.ngos.push(newNgo);
    return { handlerType: 'NGO', handlerId: newId, organizationName: newNgo.organization_name, address: newNgo.address, latitude: null, longitude: null };
  }
}

// ----------------------------------------------------
// 1. TRIP CREATION & DISPATCH
// ----------------------------------------------------

exports.createTrip = async (req, res, next) => {
  try {
    const user = req.user;
    const userRole = (user?.role || 'NGO').toUpperCase();
    if (!user || (userRole !== 'NGO' && userRole !== 'BIOGAS' && userRole !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Only authorized NGOs, Biogas Facilities, and Admins can create trips' });
    }

    const { donationId, vehicleId, driverId, trackingMethod = 'DRIVER_MOBILE_GPS' } = req.body;
    if (!donationId || !vehicleId || !driverId) {
      return res.status(400).json({ success: false, message: 'Donation ID, Vehicle ID, and Driver ID are mandatory' });
    }

    const dId = Number(donationId);
    const vId = Number(vehicleId);
    const drId = Number(driverId);

    let handlerInfo = await resolveHandlerForUser(user);
    const handlerType = user.role === 'BIOGAS' ? 'BIOGAS' : 'NGO';
    const ngoId = handlerType === 'NGO' ? handlerInfo?.handlerId : null;
    const biogasPlantId = handlerType === 'BIOGAS' ? handlerInfo?.handlerId : null;

    let donationInfo = null;
    let vehicleInfo = null;
    let driverInfo = null;

    if (db.isConnected) {
      // Get donation details
      const [dRows] = await db.query(
        `SELECT d.*, donor.business_name as donor_name, donor.address as donor_addr, donor.latitude as donor_lat, donor.longitude as donor_lng 
         FROM donations d 
         LEFT JOIN donors donor ON d.donor_id = donor.id 
         WHERE d.id = ?`,
        [dId]
      );
      if (!dRows.length) return res.status(404).json({ success: false, message: 'Donation not found' });
      donationInfo = dRows[0];

      // Check vehicle
      const [vRows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vId]);
      if (!vRows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
      vehicleInfo = vRows[0];

      // Check driver
      const [drRows] = await db.query('SELECT * FROM drivers WHERE id = ?', [drId]);
      if (!drRows.length) return res.status(404).json({ success: false, message: 'Driver not found' });
      driverInfo = drRows[0];

      const tripCode = `TRIP-D${dId}-V${vId}-${Date.now().toString().slice(-4)}`;

      // Insert trip
      const [insertRes] = await db.query(
        `INSERT INTO trips (trip_code, donation_id, ngo_id, biogas_plant_id, handler_type, vehicle_id, driver_id, pickup_address, pickup_lat, pickup_lng, destination_address, destination_lat, destination_lng, tracking_method, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED')`,
        [
          tripCode, dId, ngoId, biogasPlantId, handlerType, vId, drId,
          donationInfo.donor_addr || donationInfo.pickup_address || 'Donor Location',
          donationInfo.donor_lat || donationInfo.latitude || null,
          donationInfo.donor_lng || donationInfo.longitude || null,
          handlerInfo?.address || (handlerType === 'BIOGAS' ? 'Biogas Digestion Facility' : 'NGO Shelter Hub'),
          handlerInfo?.latitude || null,
          handlerInfo?.longitude || null,
          trackingMethod
        ]
      );

      // Update vehicle & driver status to ASSIGNED
      await db.query("UPDATE vehicles SET status = 'ASSIGNED' WHERE id = ?", [vId]);
      await db.query("UPDATE drivers SET status = 'ASSIGNED', vehicle_id = ? WHERE id = ?", [vId, drId]);

      // Automatically generate a 6-digit random driver pairing code
      const crypto = require('crypto');
      const pairingCode = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Invalidate any previous active codes for this vehicle/driver
      await db.query("UPDATE pairing_codes SET status = 'EXPIRED' WHERE (vehicle_id = ? OR driver_id = ?) AND status = 'ACTIVE'", [vId, drId]);

      // Insert new active pairing code
      await db.query(
        `INSERT INTO pairing_codes (code, vehicle_id, driver_id, trip_id, handler_type, handler_id, expires_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [pairingCode, vId, drId, insertRes.insertId, handlerType, handlerInfo?.handlerId || 1, expiresAt]
      );

      // Emit socket notification
      if (req.app.get('io')) {
        req.app.get('io').emit('trip_assigned', { tripId: insertRes.insertId, donationId: dId, tripCode, handlerType, pairingCode });
      }

      return res.status(201).json({
        success: true,
        message: 'Vehicle & Driver assigned to trip successfully',
        tripId: insertRes.insertId,
        tripCode,
        pairingCode,
        expiresAt,
        driverName: driverInfo?.driver_name || driverInfo?.name || 'Assigned Driver',
        vehicleNumber: vehicleInfo?.vehicle_number || vehicleInfo?.license_plate || 'Assigned Vehicle'
      });
    } else {
      donationInfo = (db.memoryStore.donations || []).find(d => Number(d.id) === dId);
      if (!donationInfo) return res.status(404).json({ success: false, message: 'Donation not found' });

      vehicleInfo = (db.memoryStore.vehicles || []).find(v => Number(v.id) === vId);
      if (!vehicleInfo) return res.status(404).json({ success: false, message: 'Vehicle not found' });

      driverInfo = (db.memoryStore.drivers || []).find(d => Number(d.id) === drId);
      if (!driverInfo) return res.status(404).json({ success: false, message: 'Driver not found' });

      const donorInfo = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(donationInfo.donor_id)) || {};

      const tripId = (db.memoryStore.trips || []).length + 1;
      const tripCode = `TRIP-D${dId}-V${vId}-${Date.now().toString().slice(-4)}`;

      const newTrip = {
        id: tripId,
        trip_code: tripCode,
        donation_id: dId,
        ngo_id: ngoId ? Number(ngoId) : null,
        biogas_plant_id: biogasPlantId ? Number(biogasPlantId) : null,
        handler_type: handlerType,
        vehicle_id: vId,
        driver_id: drId,
        pickup_address: donorInfo.address || donationInfo.pickup_address || 'Donor Location',
        pickup_lat: donorInfo.latitude || donationInfo.latitude || null,
        pickup_lng: donorInfo.longitude || donationInfo.longitude || null,
        destination_address: handlerInfo?.address || (handlerType === 'BIOGAS' ? 'Biogas Digestion Facility' : 'NGO Shelter Hub'),
        destination_lat: handlerInfo?.latitude || null,
        destination_lng: handlerInfo?.longitude || null,
        tracking_method: trackingMethod,
        current_lat: null,
        current_lng: null,
        current_accuracy: null,
        current_speed: null,
        current_heading: null,
        last_gps_update: null,
        status: 'ASSIGNED',
        started_at: null,
        completed_at: null,
        created_at: new Date()
      };

      db.memoryStore.trips.push(newTrip);
      vehicleInfo.status = 'ASSIGNED';
      driverInfo.status = 'ASSIGNED';
      driverInfo.vehicle_id = vId;

      const crypto = require('crypto');
      const pairingCode = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      db.memoryStore.pairing_codes = db.memoryStore.pairing_codes || [];
      db.memoryStore.pairing_codes.push({
        id: db.memoryStore.pairing_codes.length + 1,
        code: pairingCode,
        vehicle_id: vId,
        driver_id: drId,
        trip_id: tripId,
        handler_type: handlerType,
        handler_id: handlerInfo?.handlerId || 1,
        expires_at: expiresAt.toISOString(),
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      });

      return res.status(201).json({
        success: true,
        message: 'Vehicle & Driver assigned to trip successfully',
        tripId,
        tripCode,
        trip: newTrip,
        pairingCode,
        expiresAt,
        driverName: driverInfo?.driver_name || 'Assigned Driver',
        vehicleNumber: vehicleInfo?.vehicle_number || 'Assigned Vehicle'
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.startPickup = async (req, res, next) => {
  try {
    const { tripId, donationId } = req.body;
    const user = req.user;
    const crypto = require('crypto');

    let targetTrip = null;
    let pairingCode = null;

    if (db.isConnected) {
      let queryStr = tripId ? 'SELECT * FROM trips WHERE id = ?' : 'SELECT * FROM trips WHERE donation_id = ? ORDER BY id DESC LIMIT 1';
      let param = tripId ? [tripId] : [donationId];
      let [rows] = await db.query(queryStr, param);

      if (!rows.length && donationId) {
        // Auto-provision trip if not created yet
        const dId = Number(donationId);
        let handlerInfo = await resolveHandlerForUser(user);
        let vId = 1;
        let drId = 1;
        const handlerId = handlerInfo?.handlerId || 1;
        const handlerType = handlerInfo?.handlerType || 'NGO';
        
        // Find existing vehicle and driver
        const [vRows] = await db.query(
          "SELECT id FROM vehicles WHERE (handler_type = ? AND (ngo_id = ? OR biogas_plant_id = ?)) OR ngo_id = ? ORDER BY id ASC LIMIT 1",
          [handlerType, handlerId, handlerId, handlerId]
        );
        if (vRows.length) vId = vRows[0].id;
        const [drRows] = await db.query(
          "SELECT id FROM drivers WHERE (handler_type = ? AND (ngo_id = ? OR biogas_plant_id = ?)) OR ngo_id = ? ORDER BY id ASC LIMIT 1",
          [handlerType, handlerId, handlerId, handlerId]
        );
        if (drRows.length) drId = drRows[0].id;

        const [donRows] = await db.query('SELECT * FROM donations WHERE id = ?', [dId]);
        const don = donRows[0] || {};
        const tripCode = `TRIP-D${dId}-V${vId}-${Date.now().toString().slice(-4)}`;

        const [insTrip] = await db.query(
          `INSERT INTO trips 
           (trip_code, donation_id, ngo_id, biogas_plant_id, handler_type, vehicle_id, driver_id, pickup_address, pickup_lat, pickup_lng, destination_address, destination_lat, destination_lng, tracking_method, status, started_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRIVER_MOBILE_GPS', 'PICKUP_STARTED', NOW())`,
          [
            tripCode, dId, handlerInfo?.handlerType === 'NGO' ? handlerInfo.handlerId : 1,
            handlerInfo?.handlerType === 'BIOGAS' ? handlerInfo.handlerId : null,
            handlerInfo?.handlerType || 'NGO', vId, drId,
            don.pickup_address || 'Donor Location', don.latitude || null, don.longitude || null,
            handlerInfo?.address || 'NGO Shelter Hub', handlerInfo?.latitude || null, handlerInfo?.longitude || null
          ]
        );
        const [newTRows] = await db.query('SELECT * FROM trips WHERE id = ?', [insTrip.insertId]);
        targetTrip = newTRows[0];
      } else if (rows.length) {
        targetTrip = rows[0];
        await db.query(
          "UPDATE trips SET status = 'PICKUP_STARTED', started_at = NOW() WHERE id = ?",
          [targetTrip.id]
        );
      } else {
        return res.status(404).json({ success: false, message: 'Active trip record not found for pickup' });
      }

      await db.query("UPDATE donations SET status = 'PICKUP_STARTED' WHERE id = ?", [targetTrip.donation_id]);
      if (targetTrip.vehicle_id) await db.query("UPDATE vehicles SET status = 'ON_TRIP' WHERE id = ?", [targetTrip.vehicle_id]);
      if (targetTrip.driver_id) await db.query("UPDATE drivers SET status = 'ON_TRIP' WHERE id = ?", [targetTrip.driver_id]);

      // Check or generate 6-digit random pairing code
      const [pcRows] = await db.query(
        "SELECT code FROM pairing_codes WHERE trip_id = ? AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1",
        [targetTrip.id]
      );
      if (pcRows.length > 0) {
        pairingCode = pcRows[0].code;
      } else {
        pairingCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        await db.query("UPDATE pairing_codes SET status = 'EXPIRED' WHERE (vehicle_id = ? OR driver_id = ?) AND status = 'ACTIVE'", [targetTrip.vehicle_id, targetTrip.driver_id]);
        await db.query(
          "INSERT INTO pairing_codes (code, vehicle_id, driver_id, trip_id, handler_type, handler_id, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')",
          [pairingCode, targetTrip.vehicle_id || 1, targetTrip.driver_id || 1, targetTrip.id, targetTrip.handler_type || 'NGO', targetTrip.ngo_id || targetTrip.biogas_plant_id || 1, expiresAt]
        );
      }
    } else {
      targetTrip = tripId 
        ? (db.memoryStore.trips || []).find(t => Number(t.id) === Number(tripId))
        : (db.memoryStore.trips || []).find(t => Number(t.donation_id) === Number(donationId));

      if (!targetTrip && donationId) {
        const dId = Number(donationId);
        const newTripId = (db.memoryStore.trips || []).length + 1;
        const vId = (db.memoryStore.vehicles || [])[0]?.id || 1;
        const drId = (db.memoryStore.drivers || [])[0]?.id || 1;
        targetTrip = {
          id: newTripId,
          trip_code: `TRIP-D${dId}-V${vId}-${Date.now().toString().slice(-4)}`,
          donation_id: dId,
          handler_type: 'NGO',
          ngo_id: 1,
          vehicle_id: vId,
          driver_id: drId,
          status: 'PICKUP_STARTED',
          tracking_method: 'DRIVER_MOBILE_GPS',
          started_at: new Date()
        };
        db.memoryStore.trips = db.memoryStore.trips || [];
        db.memoryStore.trips.push(targetTrip);
      } else if (targetTrip) {
        targetTrip.status = 'PICKUP_STARTED';
        targetTrip.started_at = new Date();
      } else {
        return res.status(404).json({ success: false, message: 'Active trip record not found for pickup' });
      }

      const donation = (db.memoryStore.donations || []).find(d => Number(d.id) === Number(targetTrip.donation_id));
      if (donation) donation.status = 'PICKUP_STARTED';

      const veh = (db.memoryStore.vehicles || []).find(v => Number(v.id) === Number(targetTrip.vehicle_id));
      if (veh) veh.status = 'ON_TRIP';

      const drv = (db.memoryStore.drivers || []).find(d => Number(d.id) === Number(targetTrip.driver_id));
      if (drv) drv.status = 'ON_TRIP';

      // Memory Store pairing code
      const activeCode = (db.memoryStore.pairing_codes || []).find(p => Number(p.trip_id) === Number(targetTrip.id) && p.status === 'ACTIVE');
      if (activeCode) {
        pairingCode = activeCode.code;
      } else {
        pairingCode = crypto.randomInt(100000, 999999).toString();
        (db.memoryStore.pairing_codes || []).forEach(p => {
          if ((Number(p.vehicle_id) === Number(targetTrip.vehicle_id) || Number(p.driver_id) === Number(targetTrip.driver_id)) && p.status === 'ACTIVE') {
            p.status = 'EXPIRED';
          }
        });
        db.memoryStore.pairing_codes = db.memoryStore.pairing_codes || [];
        db.memoryStore.pairing_codes.push({
          id: db.memoryStore.pairing_codes.length + 1,
          code: pairingCode,
          vehicle_id: targetTrip.vehicle_id || 1,
          driver_id: targetTrip.driver_id || 1,
          trip_id: targetTrip.id,
          handler_type: targetTrip.handler_type || 'NGO',
          handler_id: targetTrip.ngo_id || 1,
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: 'ACTIVE'
        });
      }
    }

    if (req.app && typeof req.app.get === 'function' && req.app.get('io')) {
      req.app.get('io').emit('pickupStarted', { tripId: targetTrip.id, donationId: targetTrip.donation_id, pairingCode });
      req.app.get('io').emit('tracking_updated', { donationId: targetTrip.donation_id, status: 'PICKUP_STARTED', pairingCode });
    }

    // Notify Donor
    notificationService.createNotification({
      userId: 1,
      type: 'PICKUP_STARTED',
      title: 'Pickup Scheduled & Started 🚚',
      message: `Collection vehicle is dispatched for request #${targetTrip.donation_id}. Driver Pairing PIN: ${pairingCode}. Live GPS tracking enabled.`
    }, req.app && typeof req.app.get === 'function' ? req.app.get('io') : null);

    return res.json({
      success: true,
      message: 'Pickup started successfully. Random 6-digit driver pairing code generated.',
      tripId: targetTrip.id,
      tripCode: targetTrip.trip_code,
      pairingCode,
      code: pairingCode,
      status: 'PICKUP_STARTED'
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// 2. REAL GPS LOCATION INGESTION (MOBILE & IoT)
// ----------------------------------------------------

exports.recordLocationUpdate = async (req, res, next) => {
  try {
    const {
      tripId,
      vehicleId,
      driverId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      timestamp,
      source = 'MOBILE_GPS'
    } = req.body;

    if (!tripId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Trip ID, Latitude, and Longitude are mandatory' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Invalid GPS coordinates received' });
    }

    const tId = Number(tripId);
    const nowTime = timestamp ? Number(timestamp) : Date.now();

    let updatedTrip = null;

    if (db.isConnected) {
      const [tRows] = await db.query('SELECT * FROM trips WHERE id = ?', [tId]);
      if (!tRows.length) return res.status(404).json({ success: false, message: 'Trip not found' });
      const currentTrip = tRows[0];

      // If status is ASSIGNED or PICKUP_STARTED, advance to GPS_LIVE
      let nextStatus = ['ASSIGNED', 'PICKUP_STARTED'].includes(currentTrip.status) ? 'GPS_LIVE' : currentTrip.status;

      await db.query(
        `UPDATE trips 
         SET current_lat = ?, current_lng = ?, current_accuracy = ?, current_speed = ?, current_heading = ?, last_gps_update = NOW(), status = ? 
         WHERE id = ?`,
        [lat, lng, accuracy || null, speed || null, heading || null, nextStatus, tId]
      );

      // Append to historical point log
      await db.query(
        `INSERT INTO trip_location_logs (trip_id, vehicle_id, driver_id, latitude, longitude, accuracy, speed, heading, source, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tId, vehicleId || currentTrip.vehicle_id, driverId || currentTrip.driver_id, lat, lng, accuracy || null, speed || null, heading || null, source, nowTime]
      );

      updatedTrip = { ...currentTrip, current_lat: lat, current_lng: lng, status: nextStatus };
    } else {
      const trip = (db.memoryStore.trips || []).find(t => Number(t.id) === tId);
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

      let nextStatus = ['ASSIGNED', 'PICKUP_STARTED'].includes(trip.status) ? 'GPS_LIVE' : trip.status;
      trip.current_lat = lat;
      trip.current_lng = lng;
      trip.current_accuracy = accuracy || 10;
      trip.current_speed = speed || 0;
      trip.current_heading = heading || 0;
      trip.last_gps_update = new Date();
      trip.status = nextStatus;

      (db.memoryStore.trip_location_logs || []).push({
        id: (db.memoryStore.trip_location_logs || []).length + 1,
        trip_id: tId,
        vehicle_id: vehicleId || trip.vehicle_id,
        driver_id: driverId || trip.driver_id,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy || null,
        speed: speed || null,
        heading: heading || null,
        source,
        timestamp: nowTime,
        created_at: new Date()
      });

      updatedTrip = trip;
    }

    // Real-time broadcast to all connected Operator, NGO, and Donor live maps
    if (req.app.get('io')) {
      req.app.get('io').emit('gps_location_stream', {
        tripId: tId,
        donationId: updatedTrip.donation_id,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy || null,
        speed: speed || null,
        heading: heading || null,
        timestamp: nowTime,
        status: updatedTrip.status
      });
    }

    return res.json({
      success: true,
      message: 'Authentic GPS coordinate logged successfully',
      status: updatedTrip.status,
      lastGpsUpdate: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// 3. DRIVER LOGIN WITH RANDOM PAIRING CODE
// ----------------------------------------------------

exports.driverLoginWithPairingCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string' || code.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Please enter a valid pairing code.' });
    }

    const cleanCode = code.trim();
    let pairingRecord = null;
    let driver = null;
    let vehicle = null;
    let trip = null;

    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM pairing_codes WHERE code = ?', [cleanCode]);
      if (!rows.length) {
        return res.status(400).json({ success: false, message: 'Invalid pairing code.' });
      }

      pairingRecord = rows[0];

      if (pairingRecord.status === 'USED') {
        return res.status(400).json({ success: false, message: 'This pairing code has already been used.' });
      }

      if (pairingRecord.status === 'EXPIRED' || new Date(pairingRecord.expires_at) < new Date()) {
        return res.status(400).json({ success: false, message: 'This pairing code has expired. Ask the administrator for a new code.' });
      }

      // Mark pairing code as USED
      await db.query("UPDATE pairing_codes SET status = 'USED', used_at = NOW() WHERE id = ?", [pairingRecord.id]);

      // Fetch driver
      const [drRows] = await db.query('SELECT * FROM drivers WHERE id = ?', [pairingRecord.driver_id]);
      if (!drRows.length) return res.status(404).json({ success: false, message: 'Assigned driver record not found.' });
      driver = drRows[0];

      // Fetch vehicle
      const [vRows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [pairingRecord.vehicle_id]);
      if (!vRows.length) return res.status(404).json({ success: false, message: 'Assigned vehicle record not found.' });
      vehicle = vRows[0];

      // Fetch trip if associated
      if (pairingRecord.trip_id) {
        const [tRows] = await db.query('SELECT * FROM trips WHERE id = ?', [pairingRecord.trip_id]);
        if (tRows.length) trip = tRows[0];
      } else {
        const [tRows] = await db.query(
          "SELECT * FROM trips WHERE (vehicle_id = ? OR driver_id = ?) AND status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY id DESC LIMIT 1",
          [vehicle.id, driver.id]
        );
        if (tRows.length) trip = tRows[0];
      }
    } else {
      pairingRecord = (db.memoryStore.pairing_codes || []).find(p => p.code === cleanCode);
      if (!pairingRecord) {
        return res.status(400).json({ success: false, message: 'Invalid pairing code.' });
      }

      if (pairingRecord.status === 'USED') {
        return res.status(400).json({ success: false, message: 'This pairing code has already been used.' });
      }

      if (pairingRecord.status === 'EXPIRED' || new Date(pairingRecord.expires_at) < new Date()) {
        return res.status(400).json({ success: false, message: 'This pairing code has expired. Ask the administrator for a new code.' });
      }

      pairingRecord.status = 'USED';
      pairingRecord.used_at = new Date();

      driver = (db.memoryStore.drivers || []).find(d => Number(d.id) === Number(pairingRecord.driver_id));
      vehicle = (db.memoryStore.vehicles || []).find(v => Number(v.id) === Number(pairingRecord.vehicle_id));
      trip = (db.memoryStore.trips || []).find(t => (Number(t.id) === Number(pairingRecord.trip_id)) || ((Number(t.vehicle_id) === Number(vehicle?.id) || Number(t.driver_id) === Number(driver?.id)) && !['COMPLETED', 'CANCELLED'].includes(t.status)));
    }

    const driverDisplayName = driver.driver_name || driver.name || 'Driver';
    const driverDisplayPhone = driver.driver_phone || driver.phone || '';
    const vehicleDisplayNumber = vehicle.vehicle_number || vehicle.license_plate || 'Vehicle';

    // Generate lightweight Driver Session JWT
    const token = jwt.sign(
      {
        userId: driver.id,
        id: driver.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        tripId: trip?.id || null,
        driverName: driverDisplayName,
        vehicleNumber: vehicleDisplayNumber,
        role: 'DRIVER'
      },
      process.env.JWT_SECRET || 'smartsurplus_super_secret_jwt_key_2026',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: `Driver ${driverDisplayName} successfully connected to Vehicle ${vehicleDisplayNumber}`,
      token,
      driver: {
        id: driver.id,
        name: driverDisplayName,
        phone: driverDisplayPhone,
        licenseNumber: driver.license_number || ''
      },
      vehicle: {
        id: vehicle.id,
        vehicleNumber: vehicleDisplayNumber,
        vehicleType: vehicle.vehicle_type || 'Food Transport Van',
        model: vehicle.vehicle_model || '',
        capacity: vehicle.capacity || ''
      },
      trip: trip ? {
        id: trip.id,
        tripCode: trip.trip_code,
        donationId: trip.donation_id,
        pickupAddress: trip.pickup_address,
        destinationAddress: trip.destination_address,
        status: trip.status
      } : null
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// 4. RETRIEVE CURRENT DRIVER TRIP
// ----------------------------------------------------

exports.getDriverCurrentTrip = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'DRIVER') {
      return res.status(403).json({ success: false, message: 'Driver access required' });
    }

    const driverId = user.driverId || user.id;
    const vehicleId = user.vehicleId;

    let trip = null;
    let vehicle = null;
    let driver = null;
    let donation = null;

    if (db.isConnected) {
      const [tRows] = await db.query(
        `SELECT t.*, 
                v.vehicle_number, v.vehicle_type, v.vehicle_model, v.capacity as vehicle_capacity,
                d.driver_name, d.driver_phone, d.license_number,
                COALESCE(don.food_name, 'Surplus Food') as donation_title, don.food_name as title, don.food_category, don.quantity, don.quantity_unit, don.pickup_address as donation_pickup_address,
                dnr.business_name as donor_name, dnr.address as donor_address, dnr.latitude as donor_lat, dnr.longitude as donor_lng
         FROM trips t
         JOIN vehicles v ON t.vehicle_id = v.id
         JOIN drivers d ON t.driver_id = d.id
         JOIN donations don ON t.donation_id = don.id
         LEFT JOIN donors dnr ON don.donor_id = dnr.id
         WHERE (t.driver_id = ? OR t.vehicle_id = ?) AND t.status NOT IN ('COMPLETED', 'CANCELLED')
         ORDER BY t.id DESC LIMIT 1`,
        [driverId, vehicleId]
      );
      if (tRows.length) trip = tRows[0];
    } else {
      const found = (db.memoryStore.trips || []).find(t => (Number(t.driver_id) === Number(driverId) || Number(t.vehicle_id) === Number(vehicleId)) && !['COMPLETED', 'CANCELLED'].includes(t.status));
      if (found) {
        const v = (db.memoryStore.vehicles || []).find(veh => Number(veh.id) === Number(found.vehicle_id)) || {};
        const dr = (db.memoryStore.drivers || []).find(d => Number(d.id) === Number(found.driver_id)) || {};
        const don = (db.memoryStore.donations || []).find(d => Number(d.id) === Number(found.donation_id)) || {};
        const dnr = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(don.donor_id)) || {};

        trip = {
          ...found,
          vehicle_number: v.vehicle_number,
          vehicle_type: v.vehicle_type,
          vehicle_model: v.vehicle_model,
          vehicle_capacity: v.capacity,
          driver_name: dr.driver_name,
          driver_phone: dr.driver_phone,
          license_number: dr.license_number,
          donation_title: don.title || `Waste Request #${found.donation_id}`,
          food_category: don.food_category,
          quantity: don.quantity,
          quantity_unit: don.quantity_unit,
          donation_pickup_address: don.pickup_address,
          donor_name: dnr.business_name || 'Food Waste Donor',
          donor_address: dnr.address,
          donor_lat: dnr.latitude,
          donor_lng: dnr.longitude
        };
      }
    }

    if (!trip) {
      return res.json({ success: true, active: false, message: 'No active dispatch trip currently assigned.' });
    }

    return res.json({
      success: true,
      active: true,
      trip: {
        id: trip.id,
        trip_code: trip.trip_code,
        donation_id: trip.donation_id,
        status: trip.status,
        pickup_address: trip.pickup_address || trip.donor_address,
        pickup_lat: trip.pickup_lat || trip.donor_lat,
        pickup_lng: trip.pickup_lng || trip.donor_lng,
        destination_address: trip.destination_address,
        destination_lat: trip.destination_lat,
        destination_lng: trip.destination_lng,
        vehicle: {
          id: trip.vehicle_id,
          vehicle_number: trip.vehicle_number,
          vehicle_type: trip.vehicle_type
        },
        driver: {
          id: trip.driver_id,
          driver_name: trip.driver_name,
          driver_phone: trip.driver_phone
        },
        donation: {
          id: trip.donation_id,
          title: trip.donation_title,
          food_category: trip.food_category,
          quantity: trip.quantity,
          quantity_unit: trip.quantity_unit
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// 5. RETRIEVE LIVE TRIP TRACKING & JOURNEY
// ----------------------------------------------------

exports.getTripLiveTracking = async (req, res, next) => {
  try {
    const { id } = req.params; // Can be tripId or donationId
    const user = req.user;
    const targetId = Number(id);

    let trip = null;

    if (db.isConnected) {
      const [tRows] = await db.query(
        `SELECT t.*, 
                v.vehicle_number, v.vehicle_type, v.vehicle_model, v.capacity as vehicle_capacity, v.gps_tracking_method,
                d.driver_name, d.driver_phone, d.license_number,
                COALESCE(don.food_name, 'Surplus Food') as donation_title, don.food_name as title, don.food_category, don.quantity, don.quantity_unit, don.pickup_address as donation_pickup_address, don.status as donation_status,
                dnr.business_name as donor_name, dnr.address as donor_address, dnr.latitude as donor_lat, dnr.longitude as donor_lng,
                COALESCE(n.organization_name, b.plant_name, 'Collection Hub') as destination_name,
                COALESCE(n.address, b.address, 'Collection Hub') as destination_hub_address,
                COALESCE(n.latitude, b.latitude) as destination_hub_lat,
                COALESCE(n.longitude, b.longitude) as destination_hub_lng
         FROM trips t 
         JOIN vehicles v ON t.vehicle_id = v.id 
         JOIN drivers d ON t.driver_id = d.id 
         JOIN donations don ON t.donation_id = don.id 
         LEFT JOIN donors dnr ON don.donor_id = dnr.id 
         LEFT JOIN ngos n ON t.ngo_id = n.id 
         LEFT JOIN biogas_plants b ON t.biogas_plant_id = b.id
         WHERE t.id = ? OR t.donation_id = ? 
         ORDER BY t.id DESC LIMIT 1`,
        [targetId, targetId]
      );

      if (tRows.length) {
        trip = tRows[0];
      }
    } else {
      const allTrips = db.memoryStore.trips || [];
      const found = allTrips.find(t => Number(t.id) === targetId || Number(t.donation_id) === targetId);
      if (found) {
        const v = (db.memoryStore.vehicles || []).find(veh => Number(veh.id) === Number(found.vehicle_id)) || {};
        const dr = (db.memoryStore.drivers || []).find(d => Number(d.id) === Number(found.driver_id)) || {};
        const don = (db.memoryStore.donations || []).find(d => Number(d.id) === Number(found.donation_id)) || {};
        const dnr = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(don.donor_id)) || {};
        const n = (db.memoryStore.ngos || []).find(ngoItem => Number(ngoItem.id) === Number(found.ngo_id)) || {};
        const b = (db.memoryStore.biogas_plants || []).find(bioItem => Number(bioItem.id) === Number(found.biogas_plant_id)) || {};

        trip = {
          ...found,
          vehicle_number: v.vehicle_number,
          vehicle_type: v.vehicle_type,
          vehicle_model: v.vehicle_model,
          vehicle_capacity: v.capacity,
          gps_tracking_method: v.gps_tracking_method,
          driver_name: dr.driver_name,
          driver_phone: dr.driver_phone,
          license_number: dr.license_number,
          donation_title: don.title || `${don.quantity || 10} ${don.quantity_unit || 'Meals'} Surplus`,
          food_type: don.food_type,
          food_category: don.food_category,
          quantity: don.quantity,
          quantity_unit: don.quantity_unit,
          donation_pickup_address: don.pickup_address,
          donation_status: don.status,
          donor_name: dnr.business_name || 'Food Donor',
          donor_address: dnr.address,
          donor_lat: dnr.latitude,
          donor_lng: dnr.longitude,
          destination_name: n.organization_name || b.plant_name || 'Collection Hub',
          destination_hub_address: n.address || b.location || 'Collection Hub',
          destination_hub_lat: n.latitude || b.latitude,
          destination_hub_lng: n.longitude || b.longitude
        };
      }
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Active trip record not found for this request.' });
    }

    // Determine Live / Stale / Offline GPS status
    let trackingStatus = 'OFFLINE';
    let minutesSinceUpdate = null;
    let secondsSinceUpdate = null;

    if (trip.last_gps_update) {
      const diffMs = Date.now() - new Date(trip.last_gps_update).getTime();
      secondsSinceUpdate = Math.round(diffMs / 1000);
      minutesSinceUpdate = Math.round(diffMs / 60000);

      if (diffMs <= 60000) {
        trackingStatus = 'LIVE';
      } else if (diffMs <= 300000) {
        trackingStatus = 'STALE';
      } else {
        trackingStatus = 'OFFLINE';
      }
    }

    // Driver Privacy Protection: Mask phone number for Donors & Public
    const isAuthorizedOperator = user && (
      user.role === 'ADMIN' || 
      user.role === 'DRIVER' ||
      (user.role === 'NGO' && Number(user.ngoId || user.id) === Number(trip.ngo_id)) ||
      (user.role === 'BIOGAS' && Number(user.biogasPlantId || user.id) === Number(trip.biogas_plant_id))
    );
    const responseDriverPhone = isAuthorizedOperator ? trip.driver_phone : maskPhoneNumber(trip.driver_phone);

    // Retrieve or generate active 6-digit random driver pairing code
    let activePairingCode = null;
    if (db.isConnected) {
      const [pcRows] = await db.query(
        "SELECT code FROM pairing_codes WHERE trip_id = ? AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1",
        [trip.id]
      );
      if (pcRows.length > 0) {
        activePairingCode = pcRows[0].code;
      } else if (['ASSIGNED', 'PICKUP_STARTED', 'GPS_LIVE', 'COLLECTED', 'IN_TRANSIT'].includes(trip.status)) {
        const crypto = require('crypto');
        activePairingCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await db.query(
          "INSERT INTO pairing_codes (code, vehicle_id, driver_id, trip_id, handler_type, handler_id, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')",
          [activePairingCode, trip.vehicle_id || 1, trip.driver_id || 1, trip.id, trip.handler_type || 'NGO', trip.ngo_id || trip.biogas_plant_id || 1, expiresAt]
        );
      }
    } else {
      const activeCodeObj = (db.memoryStore.pairing_codes || []).find(p => Number(p.trip_id) === Number(trip.id) && p.status === 'ACTIVE');
      if (activeCodeObj) {
        activePairingCode = activeCodeObj.code;
      } else if (['ASSIGNED', 'PICKUP_STARTED', 'GPS_LIVE', 'COLLECTED', 'IN_TRANSIT'].includes(trip.status)) {
        const crypto = require('crypto');
        activePairingCode = crypto.randomInt(100000, 999999).toString();
        db.memoryStore.pairing_codes = db.memoryStore.pairing_codes || [];
        db.memoryStore.pairing_codes.push({
          id: db.memoryStore.pairing_codes.length + 1,
          code: activePairingCode,
          vehicle_id: trip.vehicle_id || 1,
          driver_id: trip.driver_id || 1,
          trip_id: trip.id,
          handler_type: trip.handler_type || 'NGO',
          handler_id: trip.ngo_id || 1,
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: 'ACTIVE'
        });
      }
    }

    return res.json({
      success: true,
      trip: {
        id: trip.id,
        trip_code: trip.trip_code,
        donation_id: trip.donation_id,
        handler_type: trip.handler_type || 'NGO',
        status: trip.status,
        pairing_code: activePairingCode,
        pairingCode: activePairingCode,
        tracking_status: trackingStatus,
        tracking_method: trip.tracking_method || 'DRIVER_MOBILE_GPS',
        started_at: trip.started_at,
        completed_at: trip.completed_at,
        current_location: trip.current_lat && trip.current_lng ? {
          latitude: parseFloat(trip.current_lat),
          longitude: parseFloat(trip.current_lng),
          accuracy: trip.current_accuracy ? parseFloat(trip.current_accuracy) : null,
          speed: trip.current_speed ? parseFloat(trip.current_speed) : null,
          heading: trip.current_heading ? parseFloat(trip.current_heading) : null,
          last_gps_update: trip.last_gps_update,
          seconds_since_update: secondsSinceUpdate,
          minutes_since_update: minutesSinceUpdate
        } : null,
        is_gps_offline: trackingStatus === 'OFFLINE',
        vehicle: {
          id: trip.vehicle_id,
          vehicle_number: trip.vehicle_number,
          vehicle_type: trip.vehicle_type,
          vehicle_model: trip.vehicle_model,
          capacity: trip.vehicle_capacity
        },
        driver: {
          id: trip.driver_id,
          driver_name: trip.driver_name,
          driver_phone: responseDriverPhone
        },
        pickup: {
          donor_name: trip.donor_name,
          address: trip.pickup_address || trip.donor_address,
          latitude: trip.pickup_lat ? parseFloat(trip.pickup_lat) : null,
          longitude: trip.pickup_lng ? parseFloat(trip.pickup_lng) : null
        },
        destination: {
          name: trip.destination_name,
          address: trip.destination_address || trip.destination_hub_address,
          latitude: trip.destination_lat ? parseFloat(trip.destination_lat) : null,
          longitude: trip.destination_lng ? parseFloat(trip.destination_lng) : null
        },
        donation: {
          id: trip.donation_id,
          title: trip.donation_title,
          food_category: trip.food_category,
          quantity: trip.quantity,
          quantity_unit: trip.quantity_unit,
          status: trip.donation_status
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// 6. ALL ACTIVE TRIPS & FLEET LOCATIONS
// ----------------------------------------------------

exports.getActiveTrips = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

    let trips = [];

    if (db.isConnected) {
      let queryStr = `
        SELECT t.*, v.vehicle_number, v.vehicle_type, v.gps_tracking_method, d.driver_name, d.driver_phone, 
               COALESCE(don.food_name, 'Surplus Food') as donation_title, don.food_name as title, don.quantity, don.quantity_unit,
               dnr.business_name as donor_name,
               COALESCE(n.organization_name, b.plant_name, 'Collection Hub') as organization_name
        FROM trips t
        JOIN vehicles v ON t.vehicle_id = v.id
        JOIN drivers d ON t.driver_id = d.id
        JOIN donations don ON t.donation_id = don.id
        LEFT JOIN donors dnr ON don.donor_id = dnr.id
        LEFT JOIN ngos n ON t.ngo_id = n.id
        LEFT JOIN biogas_plants b ON t.biogas_plant_id = b.id
        WHERE t.status NOT IN ('COMPLETED', 'CANCELLED')
      `;
      let params = [];

      if (user.role === 'NGO') {
        queryStr += ' AND t.ngo_id = (SELECT id FROM ngos WHERE user_id = ?)';
        params.push(user.id);
      } else if (user.role === 'BIOGAS') {
        queryStr += ' AND t.biogas_plant_id = (SELECT id FROM biogas_plants WHERE user_id = ?)';
        params.push(user.id);
      }

      queryStr += ' ORDER BY t.id DESC';
      const [rows] = await db.query(queryStr, params);
      trips = rows;
    } else {
      const allTrips = (db.memoryStore.trips || []).filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status));
      let filtered = allTrips;

      if (user.role === 'NGO') {
        const ngo = (db.memoryStore.ngos || []).find(n => Number(n.user_id) === Number(user.id));
        const ngoId = ngo ? ngo.id : -1;
        filtered = allTrips.filter(t => Number(t.ngo_id) === Number(ngoId));
      } else if (user.role === 'BIOGAS') {
        const plant = (db.memoryStore.biogas_plants || []).find(p => Number(p.user_id) === Number(user.id));
        const plantId = plant ? plant.id : -1;
        filtered = allTrips.filter(t => Number(t.biogas_plant_id) === Number(plantId));
      }

      trips = filtered.map(t => {
        const v = (db.memoryStore.vehicles || []).find(veh => Number(veh.id) === Number(t.vehicle_id)) || {};
        const dr = (db.memoryStore.drivers || []).find(d => Number(d.id) === Number(t.driver_id)) || {};
        const don = (db.memoryStore.donations || []).find(d => Number(d.id) === Number(t.donation_id)) || {};
        const dnr = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(don.donor_id)) || {};
        const n = (db.memoryStore.ngos || []).find(ngoItem => Number(ngoItem.id) === Number(t.ngo_id)) || {};
        const b = (db.memoryStore.biogas_plants || []).find(bioItem => Number(bioItem.id) === Number(t.biogas_plant_id)) || {};

        return {
          ...t,
          vehicle_number: v.vehicle_number,
          vehicle_type: v.vehicle_type,
          gps_tracking_method: v.gps_tracking_method,
          driver_name: dr.driver_name,
          driver_phone: dr.driver_phone,
          donation_title: don.title || `Request #${t.donation_id}`,
          quantity: don.quantity,
          quantity_unit: don.quantity_unit,
          donor_name: dnr.business_name || 'Food Donor',
          organization_name: n.organization_name || b.plant_name || 'Collection Hub'
        };
      });
    }

    // Append accurate live/stale/offline status for each trip
    const activeTripsWithTelemetry = trips.map(t => {
      let trackingStatus = 'OFFLINE';
      let secondsSinceUpdate = null;
      if (t.last_gps_update) {
        const diffMs = Date.now() - new Date(t.last_gps_update).getTime();
        secondsSinceUpdate = Math.round(diffMs / 1000);
        if (diffMs <= 60000) trackingStatus = 'LIVE';
        else if (diffMs <= 300000) trackingStatus = 'STALE';
        else trackingStatus = 'OFFLINE';
      }

      return {
        ...t,
        tracking_status: trackingStatus,
        seconds_since_update: secondsSinceUpdate
      };
    });

    return res.json({ success: true, count: activeTripsWithTelemetry.length, activeTrips: activeTripsWithTelemetry });
  } catch (err) {
    next(err);
  }
};

exports.getActiveFleetLocations = exports.getActiveTrips;

// ----------------------------------------------------
// 7. DRIVER ARRIVAL SIGNALING (NOTIFY DONOR / NGO)
// ----------------------------------------------------

exports.signalDriverArrival = async (req, res, next) => {
  try {
    const { tripId, stage } = req.body;
    if (!tripId || !['ARRIVED_AT_PICKUP', 'ARRIVED_AT_DESTINATION'].includes(stage)) {
      return res.status(400).json({ success: false, message: 'Valid Trip ID and signal stage (ARRIVED_AT_PICKUP or ARRIVED_AT_DESTINATION) are required.' });
    }

    const tId = Number(tripId);
    let trip = null;
    let donorUserId = null;
    let handlerUserId = null;

    if (db.isConnected) {
      const [tRows] = await db.query(
        `SELECT t.*, v.vehicle_number, d.driver_name, d.driver_phone,
                don.food_name, don.quantity, don.quantity_unit, don.pickup_address,
                dnr.business_name as donor_name, dnr.user_id as donor_user_id,
                n.user_id as ngo_user_id, n.organization_name,
                b.user_id as biogas_user_id, b.plant_name
         FROM trips t
         JOIN vehicles v ON t.vehicle_id = v.id
         JOIN drivers d ON t.driver_id = d.id
         JOIN donations don ON t.donation_id = don.id
         LEFT JOIN donors dnr ON don.donor_id = dnr.id
         LEFT JOIN ngos n ON t.ngo_id = n.id
         LEFT JOIN biogas_plants b ON t.biogas_plant_id = b.id
         WHERE t.id = ?`,
        [tId]
      );
      if (!tRows.length) return res.status(404).json({ success: false, message: 'Trip not found.' });
      trip = tRows[0];
      donorUserId = trip.donor_user_id || 1;
      handlerUserId = trip.ngo_user_id || trip.biogas_user_id || 2;
    } else {
      const found = (db.memoryStore.trips || []).find(t => Number(t.id) === tId);
      if (!found) return res.status(404).json({ success: false, message: 'Trip not found.' });
      const v = (db.memoryStore.vehicles || []).find(veh => Number(veh.id) === Number(found.vehicle_id)) || {};
      const dr = (db.memoryStore.drivers || []).find(d => Number(d.id) === Number(found.driver_id)) || {};
      const don = (db.memoryStore.donations || []).find(d => Number(d.id) === Number(found.donation_id)) || {};
      const dnr = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(don.donor_id)) || {};
      const n = (db.memoryStore.ngos || []).find(ngoItem => Number(ngoItem.id) === Number(found.ngo_id)) || {};
      const b = (db.memoryStore.biogas_plants || []).find(bioItem => Number(bioItem.id) === Number(found.biogas_plant_id)) || {};

      trip = {
        ...found,
        vehicle_number: v.vehicle_number,
        driver_name: dr.driver_name,
        food_name: don.food_name || 'Surplus Food',
        donor_name: dnr.business_name || 'Food Donor',
        organization_name: n.organization_name || b.plant_name || 'Destination Hub'
      };
      donorUserId = dnr.user_id || 1;
      handlerUserId = n.user_id || b.user_id || 2;
    }

    const driverName = trip.driver_name || 'Assigned Driver';
    const vehicleNumber = trip.vehicle_number || 'Transport Vehicle';

    if (stage === 'ARRIVED_AT_PICKUP') {
      // Dispatch notification & socket event to Donor
      await notificationService.createNotification({
        userId: donorUserId,
        donationId: trip.donation_id,
        type: 'DRIVER_ARRIVED_PICKUP',
        title: '🚚 Driver Arrived for Food Pickup',
        message: `Driver ${driverName} has arrived with Vehicle ${vehicleNumber} for donation "${trip.food_name || 'Surplus Food'}". Please inspect the vehicle and confirm food handover in your Donor Portal.`
      }, req.app.get('io'));

      if (req.app.get('io')) {
        req.app.get('io').emit('driver_arrived_pickup', {
          tripId: tId,
          donationId: trip.donation_id,
          driverName,
          vehicleNumber,
          arrivedAt: new Date().toISOString()
        });
      }

      return res.json({
        success: true,
        message: 'Notification sent to Donor. Awaiting Donor handover confirmation.',
        stage: 'ARRIVED_AT_PICKUP'
      });
    } else if (stage === 'ARRIVED_AT_DESTINATION') {
      // Dispatch notification & socket event to NGO / Biogas Plant
      await notificationService.createNotification({
        userId: handlerUserId,
        donationId: trip.donation_id,
        type: 'DRIVER_ARRIVED_DESTINATION',
        title: '📦 Vehicle Arrived at Hub (Inspection Needed)',
        message: `Driver ${driverName} has arrived with Vehicle ${vehicleNumber} for donation #${trip.donation_id} (${trip.food_name || 'Surplus Food'}). Please verify food condition/IoT telemetry and enable delivery receipt.`
      }, req.app.get('io'));

      if (req.app.get('io')) {
        req.app.get('io').emit('driver_arrived_destination', {
          tripId: tId,
          donationId: trip.donation_id,
          driverName,
          vehicleNumber,
          arrivedAt: new Date().toISOString()
        });
      }

      return res.json({
        success: true,
        message: 'Notification sent to NGO/Facility. Awaiting IoT verification & delivery confirmation.',
        stage: 'ARRIVED_AT_DESTINATION'
      });
    }
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// 8. UPDATE TRIP STAGE / COMPLETE TRIP (ROLE-RESTRICTED)
// ----------------------------------------------------

exports.updateTripStage = async (req, res, next) => {
  try {
    const { tripId, stage } = req.body;
    const user = req.user;
    const allowedStages = ['COLLECTED', 'IN_TRANSIT', 'RECEIVED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
    if (!tripId || !allowedStages.includes(stage)) {
      return res.status(400).json({ success: false, message: 'Valid Trip ID and physical stage are required' });
    }

    // Role-based authorization enforcement:
    // DRIVERS cannot directly mark COLLECTED or DELIVERED/COMPLETED
    if (user && user.role === 'DRIVER') {
      if (['COLLECTED', 'IN_TRANSIT', 'ACCEPTED'].includes(stage)) {
        return res.status(403).json({
          success: false,
          message: 'Drivers cannot authorize food handover directly. Handover must be verified and confirmed by the Donor in the Donor Portal.'
        });
      }
      if (['RECEIVED', 'DELIVERED', 'COMPLETED'].includes(stage)) {
        return res.status(403).json({
          success: false,
          message: 'Drivers cannot authorize delivery directly. Delivery receipt must be verified and confirmed by the receiving NGO or Biogas Facility.'
        });
      }
    }

    const tId = Number(tripId);
    let targetTrip = null;

    if (db.isConnected) {
      const [tRows] = await db.query('SELECT * FROM trips WHERE id = ?', [tId]);
      if (!tRows.length) return res.status(404).json({ success: false, message: 'Trip not found' });
      targetTrip = tRows[0];

      let completedAt = stage === 'COMPLETED' || stage === 'DELIVERED' ? new Date() : null;

      await db.query(
        'UPDATE trips SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ?',
        [stage, completedAt, tId]
      );

      // Synchronize donation status
      if (['COLLECTED', 'IN_TRANSIT'].includes(stage)) {
        await db.query("UPDATE donations SET status = 'COLLECTED' WHERE id = ?", [targetTrip.donation_id]);
      } else if (['RECEIVED', 'DELIVERED', 'COMPLETED'].includes(stage)) {
        await db.query("UPDATE donations SET status = 'DELIVERED' WHERE id = ?", [targetTrip.donation_id]);
        
        // Auto-release vehicle and driver to AVAILABLE upon trip completion
        await db.query("UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ?", [targetTrip.vehicle_id]);
        await db.query("UPDATE drivers SET status = 'AVAILABLE' WHERE id = ?", [targetTrip.driver_id]);
      }
    } else {
      targetTrip = (db.memoryStore.trips || []).find(t => Number(t.id) === tId);
      if (!targetTrip) return res.status(404).json({ success: false, message: 'Trip not found' });

      targetTrip.status = stage;
      if (stage === 'COMPLETED' || stage === 'DELIVERED') {
        targetTrip.completed_at = new Date();
      }

      const donation = (db.memoryStore.donations || []).find(d => Number(d.id) === Number(targetTrip.donation_id));
      if (donation) {
        if (['COLLECTED', 'IN_TRANSIT'].includes(stage)) {
          donation.status = 'COLLECTED';
        } else if (['RECEIVED', 'DELIVERED', 'COMPLETED'].includes(stage)) {
          donation.status = 'DELIVERED';
        }
      }

      if (['RECEIVED', 'DELIVERED', 'COMPLETED'].includes(stage)) {
        const veh = (db.memoryStore.vehicles || []).find(v => Number(v.id) === Number(targetTrip.vehicle_id));
        if (veh) veh.status = 'AVAILABLE';

        const drv = (db.memoryStore.drivers || []).find(d => Number(d.id) === Number(targetTrip.driver_id));
        if (drv) drv.status = 'AVAILABLE';
      }
    }

    if (req.app.get('io')) {
      req.app.get('io').emit('trip_stage_updated', { tripId: tId, donationId: targetTrip.donation_id, stage });
      req.app.get('io').emit('tracking_updated', { donationId: targetTrip.donation_id, status: stage });
    }

    notificationService.createNotification({
      userId: 1,
      type: 'TRIP_STAGE_UPDATE',
      title: `Trip Stage: ${stage.replace(/_/g, ' ')}`,
      message: `Collection trip #${tId} for donation #${targetTrip.donation_id} is now ${stage}.`
    }, req.app.get('io'));

    return res.json({
      success: true,
      message: `Trip stage transitioned to ${stage} successfully`,
      stage
    });
  } catch (err) {
    next(err);
  }
};

exports.completeTrip = exports.updateTripStage;

// ----------------------------------------------------
// 8. GPS IoT WEBHOOK INGESTION
// ----------------------------------------------------

exports.iotWebhook = async (req, res, next) => {
  try {
    const { deviceId, latitude, longitude, speed, heading, timestamp } = req.body;
    if (!deviceId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Device ID, Latitude, and Longitude are mandatory' });
    }

    let vehicleId = null;
    let activeTrip = null;

    if (db.isConnected) {
      const [devRows] = await db.query('SELECT vehicle_id FROM gps_devices WHERE device_id = ?', [deviceId]);
      if (!devRows.length) return res.status(404).json({ success: false, message: 'GPS device not registered' });
      vehicleId = devRows[0].vehicle_id;

      const [tripRows] = await db.query(
        'SELECT * FROM trips WHERE vehicle_id = ? AND status NOT IN ("COMPLETED", "CANCELLED") ORDER BY id DESC LIMIT 1',
        [vehicleId]
      );
      if (tripRows.length) activeTrip = tripRows[0];
    } else {
      const dev = (db.memoryStore.gps_devices || []).find(g => g.device_id === deviceId);
      if (!dev) return res.status(404).json({ success: false, message: 'GPS device not registered' });
      vehicleId = dev.vehicle_id;

      activeTrip = (db.memoryStore.trips || []).find(t => Number(t.vehicle_id) === Number(vehicleId) && !['COMPLETED', 'CANCELLED'].includes(t.status));
    }

    if (activeTrip) {
      req.body.tripId = activeTrip.id;
      req.body.vehicleId = vehicleId;
      req.body.source = 'IOT_DEVICE';
      return exports.recordLocationUpdate(req, res, next);
    }

    return res.json({ success: true, message: 'Device ping received (Vehicle has no active assigned trip)' });
  } catch (err) {
    next(err);
  }
};
