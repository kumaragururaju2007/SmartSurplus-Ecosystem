const crypto = require('crypto');
const db = require('../database/databaseConnection');

// Format Indian Vehicle Registration Number standard & flexible plate parser
function validateAndFormatVehicleNumber(vNum) {
  if (!vNum || typeof vNum !== 'string') return null;
  const raw = vNum.trim().toUpperCase();
  const cleaned = raw.replace(/[^A-Z0-9]/g, '');
  if (cleaned.length < 4 || cleaned.length > 13) return null;

  // Must contain both letters and digits for valid vehicle registration
  if (!/[A-Z]/.test(cleaned) || !/[0-9]/.test(cleaned)) return null;

  // 1. Standard Indian State plate: 1-3 letters state, 1-3 digits RTO, optional 0-3 letters series, 1-4 digits number (e.g. KA 101 567, TN 38 AB 1234, N 38 AB 1234)
  const stdMatch = cleaned.match(/^([A-Z]{1,3})([0-9]{1,3})([A-Z]{0,3})([0-9]{1,4})$/);
  if (stdMatch) {
    const state = stdMatch[1];
    const rto = stdMatch[2].length === 1 ? `0${stdMatch[2]}` : stdMatch[2];
    const series = stdMatch[3] ? ` ${stdMatch[3]}` : '';
    const num = stdMatch[4];
    return `${state} ${rto}${series} ${num}`;
  }

  // 2. Bharat (BH) Series: YY BH 4digits 2letters (e.g. 22 BH 1234 AA)
  const bhMatch = cleaned.match(/^([0-9]{2})(BH)([0-9]{4})([A-Z]{1,2})$/);
  if (bhMatch) {
    return `${bhMatch[1]} ${bhMatch[2]} ${bhMatch[3]} ${bhMatch[4]}`;
  }

  // 3. Vintage / Direct Plate format: 1-3 letters, 1-5 digits (e.g. TN 1234)
  const altMatch = cleaned.match(/^([A-Z]{1,3})([0-9]{1,5})$/);
  if (altMatch) {
    return `${altMatch[1]} ${altMatch[2]}`;
  }

  return null;
}

// Validate Indian Phone Number
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.replace(/[^0-9+]/g, '');
  return clean.length >= 10 && clean.length <= 15;
}

// Helper to resolve or auto-provision Handler record (NGO or BIOGAS) for authenticated user
async function resolveHandlerForUser(user) {
  if (!user) return null;
  const userId = user.userId || user.id;
  const role = (user.role || '').toUpperCase();

  if (role === 'BIOGAS') {
    if (db.isConnected) {
      let [rows] = await db.query('SELECT * FROM biogas_plants WHERE user_id = ?', [userId]);
      if (rows && rows.length > 0) return { handlerType: 'BIOGAS', handlerId: rows[0].id, organizationName: rows[0].plant_name || 'Biogas Facility' };

      [rows] = await db.query('SELECT * FROM biogas_plants WHERE id = ?', [userId]);
      if (rows && rows.length > 0) return { handlerType: 'BIOGAS', handlerId: rows[0].id, organizationName: rows[0].plant_name || 'Biogas Facility' };

      const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const u = (uRows && uRows[0]) || {};
      const plantName = u.name || 'Biogas Recovery Facility';
      const [ins] = await db.query(
        'INSERT INTO biogas_plants (user_id, plant_name, operator_name, address) VALUES (?, ?, ?, ?)',
        [userId, plantName, u.name || 'Plant Operator', u.address || 'Biogas Facility Hub']
      );
      return { handlerType: 'BIOGAS', handlerId: ins.insertId, organizationName: plantName };
    } else {
      let plant = (db.memoryStore.biogas_plants || []).find(p => Number(p.user_id) === Number(userId) || Number(p.id) === Number(userId));
      if (plant) return { handlerType: 'BIOGAS', handlerId: plant.id, organizationName: plant.plant_name || 'Biogas Facility' };

      const u = (db.memoryStore.users || []).find(usr => Number(usr.id) === Number(userId)) || {};
      const newId = (db.memoryStore.biogas_plants?.length || 0) + 1;
      const newPlant = {
        id: newId,
        user_id: Number(userId),
        plant_name: u.name || 'Biogas Recovery Facility',
        operator_name: u.name || 'Plant Operator',
        email: u.email || '',
        phone: u.phone || ''
      };
      db.memoryStore.biogas_plants = db.memoryStore.biogas_plants || [];
      db.memoryStore.biogas_plants.push(newPlant);
      return { handlerType: 'BIOGAS', handlerId: newId, organizationName: newPlant.plant_name };
    }
  }

  // Default / NGO handler resolution
  if (db.isConnected) {
    let [rows] = await db.query('SELECT * FROM ngos WHERE user_id = ?', [userId]);
    if (rows && rows.length > 0) return { handlerType: 'NGO', handlerId: rows[0].id, organizationName: rows[0].organization_name || 'Verified NGO' };

    [rows] = await db.query('SELECT * FROM ngos WHERE id = ?', [userId]);
    if (rows && rows.length > 0) return { handlerType: 'NGO', handlerId: rows[0].id, organizationName: rows[0].organization_name || 'Verified NGO' };

    const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const u = (uRows && uRows[0]) || {};
    const orgName = u.name || 'Verified NGO Organization';
    const [ins] = await db.query(
      'INSERT INTO ngos (user_id, organization_name, contact_person, address, is_verified, official_email, official_phone) VALUES (?, ?, ?, ?, true, ?, ?)',
      [userId, orgName, u.name || 'NGO Manager', u.address || 'Chennai Central Distribution Hub', u.email || '', u.phone || '']
    );
    return { handlerType: 'NGO', handlerId: ins.insertId, organizationName: orgName };
  } else {
    let ngo = (db.memoryStore.ngos || []).find(n => Number(n.user_id) === Number(userId) || Number(n.id) === Number(userId));
    if (ngo) return { handlerType: 'NGO', handlerId: ngo.id, organizationName: ngo.organization_name || 'Verified NGO' };

    const u = (db.memoryStore.users || []).find(usr => Number(usr.id) === Number(userId)) || {};
    const newId = (db.memoryStore.ngos?.length || 0) + 1;
    const newNgo = {
      id: newId,
      user_id: Number(userId),
      organization_name: u.name || 'Verified NGO Organization',
      contact_person: u.name || 'NGO Manager',
      official_email: u.email || '',
      official_phone: u.phone || ''
    };
    db.memoryStore.ngos = db.memoryStore.ngos || [];
    db.memoryStore.ngos.push(newNgo);
    return { handlerType: 'NGO', handlerId: newId, organizationName: newNgo.organization_name };
  }
}

// ----------------------------------------------------
// 1. VEHICLE MANAGEMENT CONTROLLERS
// ----------------------------------------------------

exports.getVehicles = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

    let handlerInfo = null;
    if (user.role === 'NGO' || user.role === 'BIOGAS') {
      handlerInfo = await resolveHandlerForUser(user);
      if (!handlerInfo) return res.status(404).json({ success: false, message: 'Organization record not found' });
    }

    let vehicles = [];
    if (db.isConnected) {
      let queryStr = '';
      let params = [];

      if (user.role === 'ADMIN') {
        queryStr = `SELECT v.*, 
                           COALESCE(n.organization_name, b.plant_name, 'Platform Fleet') as organization_name, 
                           d.id as driver_id, d.driver_name, d.driver_phone, 
                           g.device_id, g.status as gps_device_status 
                    FROM vehicles v 
                    LEFT JOIN ngos n ON v.ngo_id = n.id 
                    LEFT JOIN biogas_plants b ON v.biogas_plant_id = b.id
                    LEFT JOIN drivers d ON v.id = d.vehicle_id 
                    LEFT JOIN gps_devices g ON v.id = g.vehicle_id 
                    ORDER BY v.created_at DESC`;
      } else if (user.role === 'BIOGAS') {
        queryStr = `SELECT v.*, 
                           b.plant_name as organization_name,
                           d.id as driver_id, d.driver_name, d.driver_phone, 
                           g.device_id, g.status as gps_device_status 
                    FROM vehicles v 
                    LEFT JOIN biogas_plants b ON v.biogas_plant_id = b.id
                    LEFT JOIN drivers d ON v.id = d.vehicle_id 
                    LEFT JOIN gps_devices g ON v.id = g.vehicle_id 
                    WHERE v.biogas_plant_id = ? OR (v.ngo_id IS NULL AND v.handler_type = 'BIOGAS')
                    ORDER BY v.created_at DESC`;
        params = [handlerInfo.handlerId];
      } else {
        queryStr = `SELECT v.*, 
                           n.organization_name as organization_name,
                           d.id as driver_id, d.driver_name, d.driver_phone, 
                           g.device_id, g.status as gps_device_status 
                    FROM vehicles v 
                    LEFT JOIN ngos n ON v.ngo_id = n.id 
                    LEFT JOIN drivers d ON v.id = d.vehicle_id 
                    LEFT JOIN gps_devices g ON v.id = g.vehicle_id 
                    WHERE v.ngo_id = ? 
                    ORDER BY v.created_at DESC`;
        params = [handlerInfo.handlerId];
      }

      const [rows] = await db.query(queryStr, params);
      vehicles = rows;
    } else {
      const allVehicles = db.memoryStore.vehicles || [];
      const filtered = user.role === 'ADMIN' 
        ? allVehicles 
        : (user.role === 'BIOGAS'
            ? allVehicles.filter(v => Number(v.biogas_plant_id) === Number(handlerInfo.handlerId) || (v.handler_type === 'BIOGAS' && Number(v.handler_id) === Number(handlerInfo.handlerId)))
            : allVehicles.filter(v => Number(v.ngo_id) === Number(handlerInfo.handlerId) || (v.handler_type === 'NGO' && Number(v.handler_id) === Number(handlerInfo.handlerId))));

      vehicles = filtered.map(v => {
        const driver = (db.memoryStore.drivers || []).find(d => Number(d.vehicle_id) === Number(v.id));
        const gps = (db.memoryStore.gps_devices || []).find(g => Number(g.vehicle_id) === Number(v.id));
        return {
          ...v,
          organization_name: handlerInfo?.organizationName || 'Fleet Operator',
          driver_id: driver ? driver.id : null,
          driver_name: driver ? driver.driver_name : null,
          driver_phone: driver ? driver.driver_phone : null,
          device_id: gps ? gps.device_id : null,
          gps_device_status: gps ? gps.status : 'NOT_CONFIGURED'
        };
      });
    }

    return res.json({ success: true, count: vehicles.length, vehicles });
  } catch (err) {
    next(err);
  }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'NGO' && user.role !== 'BIOGAS' && user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Only authorized NGOs, Biogas Facilities, and Admins can register vehicles' });
    }

    let {
      vehicleNumber,
      vehicleType = 'Food Transport Van',
      vehicleModel,
      capacity = '500 kg',
      fuelType = 'Diesel',
      gpsTrackingMethod = 'DRIVER_MOBILE_GPS',
      status = 'AVAILABLE',
      targetNgoId,
      targetBiogasId
    } = req.body;

    const formattedNumber = validateAndFormatVehicleNumber(vehicleNumber);
    if (!formattedNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Indian vehicle registration number format. Example: TN 38 AB 1234' 
      });
    }

    const allowedTypes = ['Food Transport Van', 'Refrigerated Vehicle', 'Mini Truck', 'Truck', 'Waste Collection Van', 'Other'];
    if (!allowedTypes.includes(vehicleType)) {
      vehicleType = 'Food Transport Van';
    }

    let handlerInfo = await resolveHandlerForUser(user);
    let ngoId = user.role === 'NGO' ? handlerInfo?.handlerId : targetNgoId || null;
    let biogasPlantId = user.role === 'BIOGAS' ? handlerInfo?.handlerId : targetBiogasId || null;
    let handlerType = user.role === 'BIOGAS' ? 'BIOGAS' : 'NGO';

    // Check vehicle number uniqueness across platform
    if (db.isConnected) {
      const [existing] = await db.query('SELECT id FROM vehicles WHERE vehicle_number = ?', [formattedNumber]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'This vehicle is already registered.' });
      }

      const [insertRes] = await db.query(
        `INSERT INTO vehicles (ngo_id, biogas_plant_id, handler_type, vehicle_number, vehicle_type, vehicle_model, capacity, fuel_type, gps_tracking_method, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ngoId, biogasPlantId, handlerType, formattedNumber, vehicleType, vehicleModel || null, capacity, fuelType, gpsTrackingMethod, status]
      );

      return res.status(201).json({
        success: true,
        message: `Vehicle ${formattedNumber} registered successfully.`,
        vehicleId: insertRes.insertId,
        vehicle: {
          id: insertRes.insertId,
          ngo_id: ngoId,
          biogas_plant_id: biogasPlantId,
          handler_type: handlerType,
          vehicle_number: formattedNumber,
          vehicle_type: vehicleType,
          vehicle_model: vehicleModel,
          capacity,
          fuel_type: fuelType,
          gps_tracking_method: gpsTrackingMethod,
          status
        }
      });
    } else {
      const existing = (db.memoryStore.vehicles || []).find(v => v.vehicle_number.toUpperCase() === formattedNumber.toUpperCase());
      if (existing) {
        return res.status(409).json({ success: false, message: 'This vehicle is already registered.' });
      }

      const newId = (db.memoryStore.vehicles || []).length + 1;
      const newVehicle = {
        id: newId,
        ngo_id: ngoId ? Number(ngoId) : null,
        biogas_plant_id: biogasPlantId ? Number(biogasPlantId) : null,
        handler_type: handlerType,
        vehicle_number: formattedNumber,
        vehicle_type: vehicleType,
        vehicle_model: vehicleModel || '',
        capacity: capacity || '',
        fuel_type: fuelType,
        gps_tracking_method: gpsTrackingMethod,
        status: status || 'AVAILABLE',
        created_at: new Date()
      };

      db.memoryStore.vehicles.push(newVehicle);

      return res.status(201).json({
        success: true,
        message: `Vehicle ${formattedNumber} registered successfully.`,
        vehicleId: newId,
        vehicle: newVehicle
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.updateVehicleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, gpsTrackingMethod } = req.body;

    const allowedStatuses = ['AVAILABLE', 'ASSIGNED', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE', 'OFFLINE'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle status value' });
    }

    if (db.isConnected) {
      await db.query(
        'UPDATE vehicles SET status = COALESCE(?, status), gps_tracking_method = COALESCE(?, gps_tracking_method) WHERE id = ?',
        [status || null, gpsTrackingMethod || null, id]
      );
    } else {
      const v = (db.memoryStore.vehicles || []).find(item => Number(item.id) === Number(id));
      if (!v) return res.status(404).json({ success: false, message: 'Vehicle not found' });
      if (status) v.status = status;
      if (gpsTrackingMethod) v.gps_tracking_method = gpsTrackingMethod;
    }

    return res.json({ success: true, message: 'Vehicle updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (db.isConnected) {
      const [vRows] = await db.query('SELECT status FROM vehicles WHERE id = ?', [id]);
      if (!vRows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
      if (vRows[0].status === 'ON_TRIP') {
        return res.status(400).json({ success: false, message: 'Cannot delete a vehicle currently on an active trip' });
      }
      await db.query('DELETE FROM vehicles WHERE id = ?', [id]);
    } else {
      const idx = (db.memoryStore.vehicles || []).findIndex(v => Number(v.id) === Number(id));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Vehicle not found' });
      if (db.memoryStore.vehicles[idx].status === 'ON_TRIP') {
        return res.status(400).json({ success: false, message: 'Cannot delete a vehicle currently on an active trip' });
      }
      db.memoryStore.vehicles.splice(idx, 1);
    }

    return res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// 2. DRIVER MANAGEMENT CONTROLLERS
// ----------------------------------------------------

exports.getDrivers = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });

    let handlerInfo = null;
    if (user.role === 'NGO' || user.role === 'BIOGAS') {
      handlerInfo = await resolveHandlerForUser(user);
      if (!handlerInfo) return res.status(404).json({ success: false, message: 'Organization record not found' });
    }

    let drivers = [];
    if (db.isConnected) {
      let queryStr = '';
      let params = [];

      if (user.role === 'ADMIN') {
        queryStr = `SELECT d.*, 
                           COALESCE(n.organization_name, b.plant_name, 'Platform Operator') as organization_name, 
                           v.vehicle_number, v.vehicle_type 
                    FROM drivers d 
                    LEFT JOIN ngos n ON d.ngo_id = n.id 
                    LEFT JOIN biogas_plants b ON d.biogas_plant_id = b.id
                    LEFT JOIN vehicles v ON d.vehicle_id = v.id 
                    ORDER BY d.created_at DESC`;
      } else if (user.role === 'BIOGAS') {
        queryStr = `SELECT d.*, v.vehicle_number, v.vehicle_type 
                    FROM drivers d 
                    LEFT JOIN vehicles v ON d.vehicle_id = v.id 
                    WHERE d.biogas_plant_id = ? OR (d.ngo_id IS NULL AND d.handler_type = 'BIOGAS')
                    ORDER BY d.created_at DESC`;
        params = [handlerInfo.handlerId];
      } else {
        queryStr = `SELECT d.*, v.vehicle_number, v.vehicle_type 
                    FROM drivers d 
                    LEFT JOIN vehicles v ON d.vehicle_id = v.id 
                    WHERE d.ngo_id = ? 
                    ORDER BY d.created_at DESC`;
        params = [handlerInfo.handlerId];
      }

      const [rows] = await db.query(queryStr, params);
      drivers = rows;
    } else {
      const allDrivers = db.memoryStore.drivers || [];
      const filtered = user.role === 'ADMIN' 
        ? allDrivers 
        : (user.role === 'BIOGAS'
            ? allDrivers.filter(d => Number(d.biogas_plant_id) === Number(handlerInfo.handlerId) || (d.handler_type === 'BIOGAS' && Number(d.handler_id) === Number(handlerInfo.handlerId)))
            : allDrivers.filter(d => Number(d.ngo_id) === Number(handlerInfo.handlerId) || (d.handler_type === 'NGO' && Number(d.handler_id) === Number(handlerInfo.handlerId))));

      drivers = filtered.map(d => {
        const vehicle = (db.memoryStore.vehicles || []).find(v => Number(v.id) === Number(d.vehicle_id));
        return {
          ...d,
          organization_name: handlerInfo?.organizationName || 'Fleet Operator',
          vehicle_number: vehicle ? vehicle.vehicle_number : null,
          vehicle_type: vehicle ? vehicle.vehicle_type : null
        };
      });
    }

    return res.json({ success: true, count: drivers.length, drivers });
  } catch (err) {
    next(err);
  }
};

exports.createDriver = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'NGO' && user.role !== 'BIOGAS' && user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Only authorized NGOs, Biogas Facilities, and Admins can register drivers' });
    }

    const {
      driverName,
      driverPhone,
      licenseNumber,
      employeeId,
      emergencyContact,
      vehicleId,
      status = 'AVAILABLE',
      targetNgoId,
      targetBiogasId
    } = req.body;

    if (!driverName || driverName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Valid Driver Name is required' });
    }

    if (!validatePhone(driverPhone)) {
      return res.status(400).json({ success: false, message: 'Valid Driver Mobile Number is required' });
    }

    let handlerInfo = await resolveHandlerForUser(user);
    let ngoId = user.role === 'NGO' ? handlerInfo?.handlerId : targetNgoId || null;
    let biogasPlantId = user.role === 'BIOGAS' ? handlerInfo?.handlerId : targetBiogasId || null;
    let handlerType = user.role === 'BIOGAS' ? 'BIOGAS' : 'NGO';

    if (db.isConnected) {
      const [insertRes] = await db.query(
        `INSERT INTO drivers (ngo_id, biogas_plant_id, handler_type, vehicle_id, driver_name, driver_phone, license_number, employee_id, emergency_contact, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ngoId, biogasPlantId, handlerType, vehicleId || null, driverName.trim(), driverPhone.trim(), licenseNumber || null, employeeId || null, emergencyContact || null, status]
      );

      if (vehicleId) {
        await db.query('UPDATE vehicles SET status = "ASSIGNED" WHERE id = ? AND status = "AVAILABLE"', [vehicleId]);
      }

      return res.status(201).json({
        success: true,
        message: `Driver ${driverName} registered successfully`,
        driverId: insertRes.insertId
      });
    } else {
      const newId = (db.memoryStore.drivers || []).length + 1;
      const newDriver = {
        id: newId,
        ngo_id: ngoId ? Number(ngoId) : null,
        biogas_plant_id: biogasPlantId ? Number(biogasPlantId) : null,
        handler_type: handlerType,
        vehicle_id: vehicleId ? Number(vehicleId) : null,
        driver_name: driverName.trim(),
        driver_phone: driverPhone.trim(),
        license_number: licenseNumber || '',
        employee_id: employeeId || '',
        emergency_contact: emergencyContact || '',
        status: status || 'AVAILABLE',
        created_at: new Date()
      };

      db.memoryStore.drivers.push(newDriver);

      if (vehicleId) {
        const veh = (db.memoryStore.vehicles || []).find(v => Number(v.id) === Number(vehicleId));
        if (veh && veh.status === 'AVAILABLE') veh.status = 'ASSIGNED';
      }

      return res.status(201).json({
        success: true,
        message: `Driver ${driverName} registered successfully`,
        driverId: newId,
        driver: newDriver
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.assignDriverToVehicle = async (req, res, next) => {
  try {
    const { driverId, vehicleId } = req.body;
    if (!driverId) return res.status(400).json({ success: false, message: 'Driver ID is required' });

    if (db.isConnected) {
      await db.query('UPDATE drivers SET vehicle_id = ? WHERE id = ?', [vehicleId || null, driverId]);
      if (vehicleId) {
        await db.query('UPDATE vehicles SET status = "ASSIGNED" WHERE id = ? AND status = "AVAILABLE"', [vehicleId]);
      }
    } else {
      const driver = (db.memoryStore.drivers || []).find(d => Number(d.id) === Number(driverId));
      if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
      driver.vehicle_id = vehicleId ? Number(vehicleId) : null;

      if (vehicleId) {
        const veh = (db.memoryStore.vehicles || []).find(v => Number(v.id) === Number(vehicleId));
        if (veh && veh.status === 'AVAILABLE') veh.status = 'ASSIGNED';
      }
    }

    return res.json({ success: true, message: 'Driver vehicle assignment updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { driverName, driverPhone, licenseNumber, employeeId, emergencyContact, status } = req.body;

    if (db.isConnected) {
      await db.query(
        `UPDATE drivers SET 
           driver_name = COALESCE(?, driver_name),
           driver_phone = COALESCE(?, driver_phone),
           license_number = COALESCE(?, license_number),
           employee_id = COALESCE(?, employee_id),
           emergency_contact = COALESCE(?, emergency_contact),
           status = COALESCE(?, status)
         WHERE id = ?`,
        [driverName || null, driverPhone || null, licenseNumber || null, employeeId || null, emergencyContact || null, status || null, id]
      );
    } else {
      const driver = (db.memoryStore.drivers || []).find(d => Number(d.id) === Number(id));
      if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
      if (driverName) driver.driver_name = driverName;
      if (driverPhone) driver.driver_phone = driverPhone;
      if (licenseNumber) driver.license_number = licenseNumber;
      if (employeeId) driver.employee_id = employeeId;
      if (emergencyContact) driver.emergency_contact = emergencyContact;
      if (status) driver.status = status;
    }

    return res.json({ success: true, message: 'Driver updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (db.isConnected) {
      const [dRows] = await db.query('SELECT status FROM drivers WHERE id = ?', [id]);
      if (!dRows.length) return res.status(404).json({ success: false, message: 'Driver not found' });
      if (dRows[0].status === 'ON_TRIP') {
        return res.status(400).json({ success: false, message: 'Cannot delete a driver currently on an active trip' });
      }
      await db.query('DELETE FROM drivers WHERE id = ?', [id]);
    } else {
      const idx = (db.memoryStore.drivers || []).findIndex(d => Number(d.id) === Number(id));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Driver not found' });
      if (db.memoryStore.drivers[idx].status === 'ON_TRIP') {
        return res.status(400).json({ success: false, message: 'Cannot delete a driver currently on an active trip' });
      }
      db.memoryStore.drivers.splice(idx, 1);
    }

    return res.json({ success: true, message: 'Driver deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// 3. RANDOM PAIRING CODE GENERATION CONTROLLER
// ----------------------------------------------------

exports.generatePairingCode = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'NGO' && user.role !== 'BIOGAS' && user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Only authorized operators can generate driver pairing codes' });
    }

    const { vehicleId, driverId, tripId } = req.body;
    if (!vehicleId || !driverId) {
      return res.status(400).json({ success: false, message: 'Vehicle ID and Driver ID are required to generate pairing code' });
    }

    const vId = Number(vehicleId);
    const drId = Number(driverId);
    const tId = tripId ? Number(tripId) : null;

    // Secure cryptographically random 6-digit numeric pairing code (e.g. 583214)
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    let handlerInfo = await resolveHandlerForUser(user);
    const handlerType = user.role === 'BIOGAS' ? 'BIOGAS' : 'NGO';
    const handlerId = handlerInfo?.handlerId || 1;

    let vehicle = null;
    let driver = null;

    if (db.isConnected) {
      // Invalidate existing active codes for this vehicle/driver
      await db.query('UPDATE pairing_codes SET status = "EXPIRED" WHERE (vehicle_id = ? OR driver_id = ?) AND status = "ACTIVE"', [vId, drId]);

      const [ins] = await db.query(
        `INSERT INTO pairing_codes (code, vehicle_id, driver_id, trip_id, handler_type, handler_id, expires_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [code, vId, drId, tId, handlerType, handlerId, expiresAt]
      );

      const [vRows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vId]);
      vehicle = vRows[0] || null;

      const [drRows] = await db.query('SELECT * FROM drivers WHERE id = ?', [drId]);
      driver = drRows[0] || null;

      return res.status(201).json({
        success: true,
        message: 'Driver pairing code generated successfully',
        pairingId: ins.insertId,
        code,
        expiresAt: expiresAt.toISOString(),
        expiresInMinutes: 15,
        vehicleNumber: vehicle?.vehicle_number || '',
        driverName: driver?.driver_name || '',
        driverPhone: driver?.driver_phone || ''
      });
    } else {
      (db.memoryStore.pairing_codes || []).forEach(p => {
        if ((Number(p.vehicle_id) === vId || Number(p.driver_id) === drId) && p.status === 'ACTIVE') {
          p.status = 'EXPIRED';
        }
      });

      const newId = (db.memoryStore.pairing_codes || []).length + 1;
      const pairingRecord = {
        id: newId,
        code,
        vehicle_id: vId,
        driver_id: drId,
        trip_id: tId,
        handler_type: handlerType,
        handler_id: handlerId,
        expires_at: expiresAt,
        used_at: null,
        status: 'ACTIVE',
        created_at: new Date()
      };

      db.memoryStore.pairing_codes = db.memoryStore.pairing_codes || [];
      db.memoryStore.pairing_codes.push(pairingRecord);

      vehicle = (db.memoryStore.vehicles || []).find(v => Number(v.id) === vId);
      driver = (db.memoryStore.drivers || []).find(d => Number(d.id) === drId);

      return res.status(201).json({
        success: true,
        message: 'Driver pairing code generated successfully',
        pairingId: newId,
        code,
        expiresAt: expiresAt.toISOString(),
        expiresInMinutes: 15,
        vehicleNumber: vehicle?.vehicle_number || '',
        driverName: driver?.driver_name || '',
        driverPhone: driver?.driver_phone || ''
      });
    }
  } catch (err) {
    next(err);
  }
};

// ----------------------------------------------------
// 4. IOT GPS HARDWARE PAIRING CONTROLLERS
// ----------------------------------------------------

exports.registerGpsDevice = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'NGO' && user.role !== 'BIOGAS' && user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { deviceId, deviceSerial, imeiNumber, provider, vehicleId } = req.body;
    if (!deviceId || !deviceId.trim()) {
      return res.status(400).json({ success: false, message: 'GPS Device Hardware ID is required' });
    }

    let handlerInfo = await resolveHandlerForUser(user);
    let ngoId = user.role === 'NGO' ? handlerInfo?.handlerId : null;

    if (db.isConnected) {
      const [existing] = await db.query('SELECT id FROM gps_devices WHERE device_id = ?', [deviceId.trim()]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'This GPS Device ID is already registered' });
      }

      const [ins] = await db.query(
        `INSERT INTO gps_devices (ngo_id, vehicle_id, device_id, serial_number, imei, provider, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [ngoId, vehicleId || null, deviceId.trim(), deviceSerial || null, imeiNumber || null, provider || 'SmartSurplus IoT']
      );

      if (vehicleId) {
        await db.query('UPDATE vehicles SET gps_tracking_method = "VEHICLE_IOT_GPS" WHERE id = ?', [vehicleId]);
      }

      return res.status(201).json({
        success: true,
        message: 'GPS Device paired & registered successfully',
        id: ins.insertId
      });
    } else {
      const existing = (db.memoryStore.gps_devices || []).find(g => g.device_id === deviceId.trim());
      if (existing) {
        return res.status(409).json({ success: false, message: 'This GPS Device ID is already registered' });
      }

      const newId = (db.memoryStore.gps_devices || []).length + 1;
      const newDevice = {
        id: newId,
        ngo_id: ngoId ? Number(ngoId) : null,
        vehicle_id: vehicleId ? Number(vehicleId) : null,
        device_id: deviceId.trim(),
        serial_number: deviceSerial || '',
        imei: imeiNumber || '',
        provider: provider || 'SmartSurplus IoT',
        status: 'ACTIVE'
      };

      db.memoryStore.gps_devices.push(newDevice);

      if (vehicleId) {
        const v = (db.memoryStore.vehicles || []).find(veh => Number(veh.id) === Number(vehicleId));
        if (v) v.gps_tracking_method = 'VEHICLE_IOT_GPS';
      }

      return res.status(201).json({
        success: true,
        message: 'GPS Device paired & registered successfully',
        id: newId,
        device: newDevice
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.pairDeviceWithVehicle = async (req, res, next) => {
  try {
    const { deviceId, vehicleId } = req.body;
    if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID is required' });

    if (db.isConnected) {
      await db.query('UPDATE gps_devices SET vehicle_id = ? WHERE device_id = ?', [vehicleId || null, deviceId]);
      if (vehicleId) {
        await db.query('UPDATE vehicles SET gps_tracking_method = "VEHICLE_IOT_GPS" WHERE id = ?', [vehicleId]);
      }
    } else {
      const device = (db.memoryStore.gps_devices || []).find(g => g.device_id === deviceId);
      if (!device) return res.status(404).json({ success: false, message: 'GPS Device not found' });
      device.vehicle_id = vehicleId ? Number(vehicleId) : null;

      if (vehicleId) {
        const v = (db.memoryStore.vehicles || []).find(veh => Number(veh.id) === Number(vehicleId));
        if (v) v.gps_tracking_method = 'VEHICLE_IOT_GPS';
      }
    }

    return res.json({ success: true, message: 'IoT GPS device successfully paired with vehicle' });
  } catch (err) {
    next(err);
  }
};

// Aliases for compatibility
exports.registerGPSDevice = exports.registerGpsDevice;
