const db = require('../database/databaseConnection');

/**
 * POST /api/gps/location & POST /api/gps/telemetry
 * Ingests live telemetry from physical IoT GPS trackers
 */
exports.ingestLocation = async (req, res, next) => {
  try {
    const deviceId = req.deviceId;
    const { latitude, longitude, speed, heading, batteryLevel, timestamp } = req.sanitizedLocation;

    let vehicleId = req.device?.vehicle_id || null;
    let activeTrip = null;

    if (db.isConnected) {
      // 1. Check if device exists or register it dynamically
      let [devRows] = await db.query('SELECT * FROM gps_devices WHERE device_id = ?', [deviceId]);
      if (!devRows.length) {
        try {
          const [insRes] = await db.query(
            'INSERT INTO gps_devices (device_id, device_name, status, last_ping, battery_level) VALUES (?, ?, ?, NOW(), ?)',
            [deviceId, `IoT Tracker ${deviceId}`, 'ACTIVE', batteryLevel]
          );
        } catch (e) {
          console.warn('GPS Device auto-registration notice:', e.message);
        }
      } else {
        vehicleId = devRows[0].vehicle_id;
        await db.query(
          'UPDATE gps_devices SET last_ping = NOW(), battery_level = COALESCE(?, battery_level), status = "ACTIVE" WHERE device_id = ?',
          [batteryLevel, deviceId]
        );
      }

      // 2. Find active trip associated with this vehicle or device
      if (vehicleId) {
        const [tripRows] = await db.query(
          `SELECT * FROM trips 
           WHERE vehicle_id = ? AND status NOT IN ('COMPLETED', 'CANCELLED', 'DELIVERED') 
           ORDER BY id DESC LIMIT 1`,
          [vehicleId]
        );
        if (tripRows.length) activeTrip = tripRows[0];
      }

      // If no vehicle attached directly, check if any active trip is tracking with this deviceId
      if (!activeTrip) {
        const [fallbackTrip] = await db.query(
          `SELECT t.* FROM trips t 
           JOIN vehicles v ON t.vehicle_id = v.id 
           LEFT JOIN gps_devices g ON g.vehicle_id = v.id 
           WHERE (g.device_id = ? OR t.tracking_method = 'VEHICLE_IOT_GPS') 
             AND t.status NOT IN ('COMPLETED', 'CANCELLED', 'DELIVERED') 
           ORDER BY t.id DESC LIMIT 1`,
          [deviceId]
        );
        if (fallbackTrip.length) activeTrip = fallbackTrip[0];
      }

      // 3. Log coordinate in trip_location_logs
      const tripId = activeTrip ? activeTrip.id : 0;
      const vId = activeTrip ? activeTrip.vehicle_id : (vehicleId || 0);
      const drId = activeTrip ? activeTrip.driver_id : 0;

      await db.query(
        `INSERT INTO trip_location_logs 
         (trip_id, vehicle_id, driver_id, latitude, longitude, speed, heading, source, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'IOT_DEVICE', ?)`,
        [tripId, vId, drId, latitude, longitude, speed, heading, timestamp.getTime()]
      );

      // 4. Update trip live state
      if (activeTrip) {
        const nextStatus = ['ASSIGNED', 'PICKUP_STARTED'].includes(activeTrip.status) ? 'GPS_LIVE' : activeTrip.status;
        await db.query(
          `UPDATE trips 
           SET current_lat = ?, current_lng = ?, current_speed = ?, current_heading = ?, last_gps_update = NOW(), status = ? 
           WHERE id = ?`,
          [latitude, longitude, speed, heading, nextStatus, activeTrip.id]
        );
        activeTrip.status = nextStatus;
      }
    } else {
      // Memory Store Fallback
      let dev = (db.memoryStore.gps_devices || []).find(d => d.device_id === deviceId);
      if (!dev) {
        dev = {
          id: (db.memoryStore.gps_devices || []).length + 1,
          device_id: deviceId,
          device_name: `IoT Tracker ${deviceId}`,
          status: 'ACTIVE',
          battery_level: batteryLevel,
          last_ping: new Date()
        };
        db.memoryStore.gps_devices = db.memoryStore.gps_devices || [];
        db.memoryStore.gps_devices.push(dev);
      } else {
        dev.last_ping = new Date();
        if (batteryLevel !== null) dev.battery_level = batteryLevel;
        dev.status = 'ACTIVE';
      }

      vehicleId = dev.vehicle_id;
      activeTrip = (db.memoryStore.trips || []).find(t => 
        (Number(t.vehicle_id) === Number(vehicleId) || t.tracking_method === 'VEHICLE_IOT_GPS') &&
        !['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(t.status)
      );

      const tripId = activeTrip ? activeTrip.id : 0;
      const vId = activeTrip ? activeTrip.vehicle_id : (vehicleId || 0);
      const drId = activeTrip ? activeTrip.driver_id : 0;

      db.memoryStore.trip_location_logs = db.memoryStore.trip_location_logs || [];
      db.memoryStore.trip_location_logs.push({
        id: db.memoryStore.trip_location_logs.length + 1,
        trip_id: tripId,
        vehicle_id: vId,
        driver_id: drId,
        latitude,
        longitude,
        speed,
        heading,
        source: 'IOT_DEVICE',
        timestamp: timestamp.getTime(),
        created_at: new Date()
      });

      if (activeTrip) {
        const nextStatus = ['ASSIGNED', 'PICKUP_STARTED'].includes(activeTrip.status) ? 'GPS_LIVE' : activeTrip.status;
        activeTrip.current_lat = latitude;
        activeTrip.current_lng = longitude;
        activeTrip.current_speed = speed;
        activeTrip.current_heading = heading;
        activeTrip.last_gps_update = new Date();
        activeTrip.status = nextStatus;
      }
    }

    // 5. Broadcast real-time Socket.IO stream
    const io = req.app ? req.app.get('io') : null;
    if (io) {
      const broadcastPacket = {
        deviceId,
        vehicleId: activeTrip ? activeTrip.vehicle_id : vehicleId,
        tripId: activeTrip ? activeTrip.id : null,
        donationId: activeTrip ? activeTrip.donation_id : null,
        latitude,
        longitude,
        speed,
        heading,
        batteryLevel,
        status: activeTrip ? activeTrip.status : 'GPS_LIVE',
        signalStatus: 'ONLINE',
        source: 'IOT_DEVICE',
        timestamp: timestamp.toISOString()
      };

      // Broadcast to universal listener
      io.emit('gps_location_stream', broadcastPacket);

      if (activeTrip) {
        io.emit('tracking_updated', {
          donationId: activeTrip.donation_id,
          tripId: activeTrip.id,
          status: activeTrip.status,
          currentLocation: {
            latitude,
            longitude,
            speed,
            heading,
            batteryLevel,
            last_gps_update: new Date().toISOString()
          }
        });
        io.to(`donation_${activeTrip.donation_id}`).emit('tracking_updated', broadcastPacket);
        io.to(`trip_${activeTrip.id}`).emit('trip_location_update', broadcastPacket);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Physical GPS coordinate packet processed & broadcasted',
      deviceId,
      tripId: activeTrip ? activeTrip.id : null,
      status: activeTrip ? activeTrip.status : 'ONLINE',
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GPS ingestion:', error);
    next(error);
  }
};

/**
 * GET /api/gps/latest/:deviceId
 * Returns latest telemetry and online/offline status
 */
exports.getLatestLocation = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    let latest = null;
    let deviceRecord = null;

    if (db.isConnected) {
      const [devRows] = await db.query('SELECT * FROM gps_devices WHERE device_id = ?', [deviceId]);
      if (devRows.length) deviceRecord = devRows[0];

      const [rows] = await db.query(
        `SELECT l.*, v.vehicle_number, v.vehicle_type, t.id as trip_id, t.status as trip_status, t.donation_id 
         FROM trip_location_logs l 
         LEFT JOIN vehicles v ON l.vehicle_id = v.id 
         LEFT JOIN trips t ON l.trip_id = t.id 
         WHERE l.source = 'IOT_DEVICE' 
           OR l.vehicle_id = (SELECT vehicle_id FROM gps_devices WHERE device_id = ? LIMIT 1) 
         ORDER BY l.id DESC LIMIT 1`,
        [deviceId]
      );
      if (rows.length) latest = rows[0];
    } else {
      deviceRecord = (db.memoryStore.gps_devices || []).find(d => d.device_id === deviceId);
      const logs = (db.memoryStore.trip_location_logs || []).filter(l => 
        l.source === 'IOT_DEVICE' || (deviceRecord && Number(l.vehicle_id) === Number(deviceRecord.vehicle_id))
      );
      if (logs.length) latest = logs[logs.length - 1];
    }

    if (!latest && !deviceRecord) {
      return res.status(404).json({ success: false, message: `No telemetry found for GPS device '${deviceId}'` });
    }

    const lastTime = latest ? (latest.created_at || new Date(latest.timestamp)) : (deviceRecord ? deviceRecord.last_ping : null);
    const diffMs = lastTime ? (Date.now() - new Date(lastTime).getTime()) : 999999;
    const isOnline = diffMs <= 120000; // Online if received within 2 minutes

    return res.json({
      success: true,
      deviceId,
      vehicleId: latest?.vehicle_id || deviceRecord?.vehicle_id || null,
      vehicleNumber: latest?.vehicle_number || null,
      latitude: latest ? parseFloat(latest.latitude) : 11.0168,
      longitude: latest ? parseFloat(latest.longitude) : 76.9558,
      speed: latest ? parseFloat(latest.speed || 0) : 0,
      heading: latest ? parseFloat(latest.heading || 0) : 0,
      batteryLevel: deviceRecord?.battery_level || null,
      status: isOnline ? 'ONLINE' : 'OFFLINE',
      lastUpdated: lastTime ? new Date(lastTime).toISOString() : null,
      secondsSinceUpdate: Math.round(diffMs / 1000)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/gps/history/:deviceId
 * Returns coordinate history for Leaflet polyline route rendering
 */
exports.getLocationHistory = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || 300, 10), 1000);

    let history = [];
    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT l.latitude, l.longitude, l.speed, l.heading, l.created_at, l.timestamp 
         FROM trip_location_logs l 
         LEFT JOIN gps_devices d ON l.vehicle_id = d.vehicle_id 
         WHERE d.device_id = ? OR l.source = 'IOT_DEVICE' 
         ORDER BY l.id ASC LIMIT ?`,
        [deviceId, limit]
      );
      history = rows.map(r => ({
        lat: parseFloat(r.latitude),
        lng: parseFloat(r.longitude),
        speed: parseFloat(r.speed || 0),
        heading: parseFloat(r.heading || 0),
        time: r.created_at || new Date(Number(r.timestamp)).toISOString()
      }));
    } else {
      const dev = (db.memoryStore.gps_devices || []).find(d => d.device_id === deviceId);
      history = (db.memoryStore.trip_location_logs || [])
        .filter(l => l.source === 'IOT_DEVICE' || (dev && Number(l.vehicle_id) === Number(dev.vehicle_id)))
        .slice(-limit)
        .map(r => ({
          lat: parseFloat(r.latitude),
          lng: parseFloat(r.longitude),
          speed: parseFloat(r.speed || 0),
          heading: parseFloat(r.heading || 0),
          time: r.created_at || new Date(Number(r.timestamp)).toISOString()
        }));
    }

    return res.json({
      success: true,
      deviceId,
      pointsCount: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/gps/register-device
 * Registers or links a physical GPS device to a vehicle
 */
exports.registerDevice = async (req, res, next) => {
  try {
    const { deviceId, vehicleId, deviceName, imei, serialNumber } = req.body;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required' });
    }

    const cleanDeviceId = String(deviceId).trim();

    if (db.isConnected) {
      const [existing] = await db.query('SELECT id FROM gps_devices WHERE device_id = ?', [cleanDeviceId]);
      if (existing.length) {
        await db.query(
          'UPDATE gps_devices SET vehicle_id = ?, device_name = COALESCE(?, device_name), imei = COALESCE(?, imei), serial_number = COALESCE(?, serial_number) WHERE device_id = ?',
          [vehicleId || null, deviceName, imei, serialNumber, cleanDeviceId]
        );
      } else {
        await db.query(
          'INSERT INTO gps_devices (device_id, vehicle_id, device_name, imei, serial_number, status) VALUES (?, ?, ?, ?, ?, "ACTIVE")',
          [cleanDeviceId, vehicleId || null, deviceName || `Tracker ${cleanDeviceId}`, imei || null, serialNumber || null]
        );
      }
    } else {
      let dev = (db.memoryStore.gps_devices || []).find(d => d.device_id === cleanDeviceId);
      if (dev) {
        if (vehicleId) dev.vehicle_id = Number(vehicleId);
        if (deviceName) dev.device_name = deviceName;
      } else {
        dev = {
          id: (db.memoryStore.gps_devices || []).length + 1,
          device_id: cleanDeviceId,
          vehicle_id: vehicleId ? Number(vehicleId) : null,
          device_name: deviceName || `Tracker ${cleanDeviceId}`,
          status: 'ACTIVE'
        };
        db.memoryStore.gps_devices = db.memoryStore.gps_devices || [];
        db.memoryStore.gps_devices.push(dev);
      }
    }

    return res.json({
      success: true,
      message: `Physical GPS device '${cleanDeviceId}' configured successfully`,
      deviceId: cleanDeviceId,
      vehicleId
    });
  } catch (error) {
    next(error);
  }
};
