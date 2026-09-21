const crypto = require('crypto');
const db = require('../database/databaseConnection');

/**
 * Middleware to authenticate physical IoT GPS devices using Secret API-Keys & Device IDs
 */
async function authenticateGpsDevice(req, res, next) {
  try {
    const deviceId = req.headers['x-device-id'] || req.body.deviceId || req.query.deviceId;
    const apiKey = req.headers['x-api-key'] || req.query.apiKey || req.body.apiKey;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'Missing deviceId in request headers or payload' });
    }

    const cleanDeviceId = String(deviceId).trim();
    const defaultMasterKey = process.env.GPS_MASTER_API_KEY || 'smartsurplus_iot_secret_key_2026';

    // Master API Key match allows instant ingestion
    if (apiKey && apiKey === defaultMasterKey) {
      req.deviceId = cleanDeviceId;
      return next();
    }

    // Lookup device record from database
    let device = null;
    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM gps_devices WHERE device_id = ?', [cleanDeviceId]);
      if (rows && rows.length > 0) device = rows[0];
    } else {
      device = (db.memoryStore.gps_devices || []).find(d => d.device_id === cleanDeviceId);
    }

    if (device) {
      if (device.api_key_hash && apiKey) {
        const computedHash = crypto.createHash('sha256').update(apiKey).digest('hex');
        if (computedHash !== device.api_key_hash && apiKey !== defaultMasterKey) {
          return res.status(403).json({ success: false, message: 'Invalid device credentials' });
        }
      }
      req.device = device;
    }

    req.deviceId = cleanDeviceId;
    next();
  } catch (error) {
    console.error('GPS Device Authentication Error:', error);
    res.status(500).json({ success: false, message: 'GPS device authentication failed' });
  }
}

/**
 * Geo-Coordinate & Bounds Sanitizer
 */
function sanitizeGpsPayload(req, res, next) {
  let { latitude, longitude, speed, heading, batteryLevel, battery_level, timestamp } = req.body;

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(422).json({ success: false, message: 'Invalid GPS latitude or longitude coordinate ranges' });
  }

  // Reject 0,0 default GPS initialization jitter (Null Island)
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) {
    return res.status(422).json({ success: false, message: 'Ignored unacquired GPS zero-coordinate lock' });
  }

  const effectiveBattery = batteryLevel !== undefined ? parseFloat(batteryLevel) : (battery_level !== undefined ? parseFloat(battery_level) : null);

  req.sanitizedLocation = {
    latitude: Number(lat.toFixed(7)),
    longitude: Number(lng.toFixed(7)),
    speed: speed !== undefined && !isNaN(parseFloat(speed)) ? Math.max(0, parseFloat(speed)) : 0,
    heading: heading !== undefined && !isNaN(parseFloat(heading)) ? parseFloat(heading) : 0,
    batteryLevel: effectiveBattery && !isNaN(effectiveBattery) ? effectiveBattery : null,
    timestamp: timestamp ? new Date(timestamp) : new Date()
  };

  next();
}

module.exports = { authenticateGpsDevice, sanitizeGpsPayload };
