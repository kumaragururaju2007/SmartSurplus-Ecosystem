const db = require('../database/databaseConnection');
const notificationService = require('../services/notificationService');

const getBiogasProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let plant = null;
    let documents = [];

    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM biogas_plants WHERE user_id = ?', [userId]);
      plant = rows[0];
      if (plant) {
        const [dRows] = await db.query('SELECT * FROM organization_documents WHERE organization_type = "BIOGAS" AND organization_id = ?', [plant.id]);
        documents = dRows;
      }
    } else {
      plant = (db.memoryStore.biogas_plants || []).find(p => Number(p.user_id) === Number(userId));
      if (plant) {
        documents = (db.memoryStore.organization_documents || []).filter(d => d.organization_type === 'BIOGAS' && Number(d.organization_id) === Number(plant.id));
      }
    }

    if (!plant) {
      return res.status(404).json({ success: false, message: 'Biogas Plant profile not found.' });
    }

    let userEmail = req.user.email || '';
    let userPhone = req.user.phone || '';
    if (db.isConnected) {
      const [uRows] = await db.query('SELECT email, phone FROM users WHERE id = ?', [userId]);
      if (uRows.length > 0) {
        userEmail = uRows[0].email;
        userPhone = uRows[0].phone;
      }
    } else {
      const u = (db.memoryStore.users || []).find(u => Number(u.id) === Number(userId));
      if (u) {
        userEmail = u.email;
        userPhone = u.phone;
      }
    }

    return res.json({ 
      success: true, 
      plant: {
        ...plant,
        email: userEmail,
        phone: userPhone,
        verificationStatus: plant.verification_status || (plant.is_verified ? 'VERIFIED' : 'PENDING'),
        isVerified: Boolean(plant.is_verified),
        documents
      } 
    });
  } catch (err) {
    next(err);
  }
};

const updateBiogasProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { 
      plant_name, plant_type, operator_name, plant_registration_number,
      gobardhan_registration_number, mnre_application_id, mnre_programme,
      state_implementing_agency, commissioning_certificate_number, commissioning_date,
      contact_person, designation, operating_status,
      feedstock_capacity_daily, processing_capacity, capacity_unit,
      biogas_production_capacity, cbg_production_capacity, power_generation_capacity,
      waste_processing_capacity, feedstock_types,
      address, city, state, pincode, latitude, longitude, is_available 
    } = req.body;

    let plantId = null;
    if (db.isConnected) {
      const [rows] = await db.query('SELECT id FROM biogas_plants WHERE user_id = ?', [userId]);
      if (rows.length > 0) plantId = rows[0].id;
    } else {
      const p = (db.memoryStore.biogas_plants || []).find(item => Number(item.user_id) === Number(userId));
      if (p) plantId = p.id;
    }

    if (!plantId) {
      return res.status(404).json({ success: false, message: 'Biogas Plant profile not found.' });
    }

    const latNum = (latitude !== null && latitude !== undefined && latitude !== '') ? parseFloat(latitude) : null;
    const lngNum = (longitude !== null && longitude !== undefined && longitude !== '') ? parseFloat(longitude) : null;

    if (latNum !== null && (isNaN(latNum) || latNum < -90 || latNum > 90)) {
      return res.status(400).json({ success: false, message: 'Valid latitude coordinates (-90 to 90) are required.' });
    }
    if (lngNum !== null && (isNaN(lngNum) || lngNum < -180 || lngNum > 180)) {
      return res.status(400).json({ success: false, message: 'Valid longitude coordinates (-180 to 180) are required.' });
    }

    const fTypes = Array.isArray(feedstock_types) ? feedstock_types.join(', ') : (feedstock_types || null);

    // Security Rule: Plant user cannot edit is_verified or verification_status (Only Admin can verify)
    if (db.isConnected) {
      await db.query(
        `UPDATE biogas_plants 
         SET plant_name = COALESCE(?, plant_name), 
             plant_type = COALESCE(?, plant_type),
             operator_name = COALESCE(?, operator_name),
             plant_registration_number = COALESCE(?, plant_registration_number),
             gobardhan_registration_number = COALESCE(?, gobardhan_registration_number),
             mnre_application_id = COALESCE(?, mnre_application_id),
             mnre_programme = COALESCE(?, mnre_programme),
             state_implementing_agency = COALESCE(?, state_implementing_agency),
             commissioning_certificate_number = COALESCE(?, commissioning_certificate_number),
             commissioning_date = COALESCE(?, commissioning_date),
             contact_person = COALESCE(?, contact_person),
             designation = COALESCE(?, designation),
             operating_status = COALESCE(?, operating_status),
             feedstock_capacity_daily = COALESCE(?, feedstock_capacity_daily),
             processing_capacity = COALESCE(?, processing_capacity), 
             capacity_unit = COALESCE(?, capacity_unit),
             biogas_production_capacity = COALESCE(?, biogas_production_capacity),
             cbg_production_capacity = COALESCE(?, cbg_production_capacity),
             power_generation_capacity = COALESCE(?, power_generation_capacity),
             waste_processing_capacity = COALESCE(?, waste_processing_capacity),
             feedstock_types = COALESCE(?, feedstock_types),
             address = COALESCE(?, address), 
             city = COALESCE(?, city),
             state = COALESCE(?, state),
             pincode = COALESCE(?, pincode),
             latitude = ?, 
             longitude = ?, 
             is_available = COALESCE(?, is_available) 
         WHERE id = ?`,
        [
          plant_name, plant_type, operator_name, plant_registration_number,
          gobardhan_registration_number, mnre_application_id, mnre_programme,
          state_implementing_agency, commissioning_certificate_number, commissioning_date,
          contact_person, designation, operating_status,
          feedstock_capacity_daily, processing_capacity, capacity_unit,
          biogas_production_capacity, cbg_production_capacity, power_generation_capacity,
          waste_processing_capacity, fTypes,
          address, city, state, pincode, latNum, lngNum, is_available, plantId
        ]
      );
    } else {
      const p = (db.memoryStore.biogas_plants || []).find(item => item.id === plantId);
      if (p) {
        if (plant_name !== undefined) p.plant_name = plant_name;
        if (plant_type !== undefined) p.plant_type = plant_type;
        if (operator_name !== undefined) p.operator_name = operator_name;
        if (plant_registration_number !== undefined) p.plant_registration_number = plant_registration_number;
        if (gobardhan_registration_number !== undefined) p.gobardhan_registration_number = gobardhan_registration_number;
        if (mnre_application_id !== undefined) p.mnre_application_id = mnre_application_id;
        if (mnre_programme !== undefined) p.mnre_programme = mnre_programme;
        if (state_implementing_agency !== undefined) p.state_implementing_agency = state_implementing_agency;
        if (commissioning_certificate_number !== undefined) p.commissioning_certificate_number = commissioning_certificate_number;
        if (commissioning_date !== undefined) p.commissioning_date = commissioning_date;
        if (contact_person !== undefined) p.contact_person = contact_person;
        if (designation !== undefined) p.designation = designation;
        if (operating_status !== undefined) p.operating_status = operating_status;
        if (feedstock_capacity_daily !== undefined) p.feedstock_capacity_daily = parseFloat(feedstock_capacity_daily);
        if (processing_capacity !== undefined) p.processing_capacity = parseFloat(processing_capacity);
        if (capacity_unit !== undefined) p.capacity_unit = capacity_unit;
        if (biogas_production_capacity !== undefined) p.biogas_production_capacity = biogas_production_capacity;
        if (cbg_production_capacity !== undefined) p.cbg_production_capacity = cbg_production_capacity;
        if (power_generation_capacity !== undefined) p.power_generation_capacity = power_generation_capacity;
        if (waste_processing_capacity !== undefined) p.waste_processing_capacity = waste_processing_capacity;
        if (feedstock_types !== undefined) p.feedstock_types = fTypes;
        if (address !== undefined) p.address = address;
        if (city !== undefined) p.city = city;
        if (state !== undefined) p.state = state;
        if (pincode !== undefined) p.pincode = pincode;
        p.latitude = latNum;
        p.longitude = lngNum;
        if (is_available !== undefined) p.is_available = is_available ? 1 : 0;
      }
    }

    return res.json({ success: true, message: 'Biogas Facility Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
};

const uploadBiogasDocument = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { document_type, document_name, file_url, file_size } = req.body;

    if (!document_type) {
      return res.status(400).json({ success: false, message: 'Document type is required.' });
    }

    let plantId = null;
    if (db.isConnected) {
      const [rows] = await db.query('SELECT id FROM biogas_plants WHERE user_id = ?', [userId]);
      if (rows.length > 0) plantId = rows[0].id;
    } else {
      const p = (db.memoryStore.biogas_plants || []).find(item => Number(item.user_id) === Number(userId));
      if (p) plantId = p.id;
    }

    if (!plantId) {
      return res.status(404).json({ success: false, message: 'Biogas Plant record not found.' });
    }

    const docName = document_name || `${document_type}.pdf`;

    if (db.isConnected) {
      await db.query(
        `INSERT INTO organization_documents (organization_type, organization_id, document_type, document_name, file_url, file_size, status)
         VALUES ('BIOGAS', ?, ?, ?, ?, ?, 'UPLOADED')`,
        [plantId, document_type, docName, file_url || null, file_size || null]
      );
    } else {
      db.memoryStore.organization_documents = db.memoryStore.organization_documents || [];
      db.memoryStore.organization_documents.push({
        id: db.memoryStore.organization_documents.length + 1,
        organization_type: 'BIOGAS',
        organization_id: plantId,
        document_type,
        document_name: docName,
        file_url: file_url || null,
        file_size: file_size || null,
        status: 'UPLOADED',
        created_at: new Date().toISOString()
      });
    }

    return res.status(201).json({ success: true, message: `${document_type} uploaded successfully and submitted for Admin verification.` });
  } catch (err) {
    next(err);
  }
};

const getBiogasRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let plantId = null;

    if (db.isConnected) {
      const [rows] = await db.query('SELECT id FROM biogas_plants WHERE user_id = ?', [userId]);
      if (rows.length > 0) plantId = rows[0].id;
    } else {
      const p = db.memoryStore.biogas_plants.find(item => item.user_id === Number(userId));
      if (p) plantId = p.id;
    }

    if (!plantId) {
      return res.json({ success: true, wasteRequests: [] });
    }

    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT d.*, 
                bm.id as match_id, 
                bm.match_status, 
                bm.distance, 
                donor.business_name as donor_name, 
                donor.address as donor_address,
                t.id as trip_id,
                t.trip_code,
                t.status as trip_status,
                t.vehicle_id,
                t.driver_id,
                v.vehicle_number,
                v.vehicle_type,
                dr.driver_name,
                dr.driver_phone,
                pc.code as pairing_code
         FROM biogas_matches bm 
         JOIN donations d ON bm.donation_id = d.id 
         JOIN donors donor ON d.donor_id = donor.id 
         LEFT JOIN trips t ON d.id = t.donation_id AND t.handler_type = 'BIOGAS'
         LEFT JOIN vehicles v ON t.vehicle_id = v.id
         LEFT JOIN drivers dr ON t.driver_id = dr.id
         LEFT JOIN pairing_codes pc ON t.id = pc.trip_id AND pc.status = 'ACTIVE'
         WHERE bm.biogas_plant_id = ? 
         ORDER BY bm.created_at DESC`,
        [plantId]
      );
      return res.json({ success: true, wasteRequests: rows });
    } else {
      const matches = (db.memoryStore.biogas_matches || []).filter(m => Number(m.biogas_plant_id) === Number(plantId));
      const requests = matches.map(m => {
        const d = (db.memoryStore.donations || []).find(don => Number(don.id) === Number(m.donation_id));
        const donor = (db.memoryStore.donors || []).find(don => Number(don.id) === Number(d?.donor_id));
        const trip = (db.memoryStore.trips || []).find(t => Number(t.donation_id) === Number(d?.id) && t.handler_type === 'BIOGAS');
        const vehicle = trip ? (db.memoryStore.vehicles || []).find(v => Number(v.id) === Number(trip.vehicle_id)) : null;
        const driver = trip ? (db.memoryStore.drivers || []).find(dr => Number(dr.id) === Number(trip.driver_id)) : null;
        const pc = trip ? (db.memoryStore.pairing_codes || []).find(c => Number(c.trip_id) === Number(trip.id) && c.status === 'ACTIVE') : null;

        return {
          ...d,
          match_id: m.id,
          match_status: m.match_status,
          distance: m.distance,
          donor_name: donor?.business_name || 'Food Donor',
          donor_address: donor?.address || d?.pickup_address,
          trip_id: trip?.id || null,
          trip_code: trip?.trip_code || null,
          trip_status: trip?.status || null,
          vehicle_id: vehicle?.id || null,
          vehicle_number: vehicle?.vehicle_number || null,
          driver_id: driver?.id || null,
          driver_name: driver?.driver_name || null,
          driver_phone: driver?.driver_phone || null,
          pairing_code: pc?.code || null
        };
      });
      return res.json({ success: true, wasteRequests: requests });
    }
  } catch (err) {
    next(err);
  }
};

const getBiogasRequestDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    let donation = null;
    let match = null;
    let trip = null;
    let pairingCode = null;

    if (db.isConnected) {
      const [dRows] = await db.query(
        `SELECT d.*, donor.business_name as donor_name, donor.address as donor_address 
         FROM donations d 
         JOIN donors donor ON d.donor_id = donor.id 
         WHERE d.id = ?`, 
        [id]
      );
      donation = dRows[0];
      const [mRows] = await db.query('SELECT * FROM biogas_matches WHERE donation_id = ? ORDER BY created_at DESC LIMIT 1', [id]);
      match = mRows[0];

      const [tRows] = await db.query(
        `SELECT t.*, v.vehicle_number, v.vehicle_type, dr.driver_name, dr.driver_phone 
         FROM trips t 
         LEFT JOIN vehicles v ON t.vehicle_id = v.id 
         LEFT JOIN drivers dr ON t.driver_id = dr.id 
         WHERE t.donation_id = ? AND t.handler_type = 'BIOGAS' 
         ORDER BY t.created_at DESC LIMIT 1`,
        [id]
      );
      trip = tRows[0] || null;

      if (trip) {
        const [pcRows] = await db.query("SELECT code FROM pairing_codes WHERE trip_id = ? AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1", [trip.id]);
        if (pcRows.length > 0) pairingCode = pcRows[0].code;
      }
    } else {
      donation = (db.memoryStore.donations || []).find(d => Number(d.id) === Number(id));
      match = (db.memoryStore.biogas_matches || []).find(m => Number(m.donation_id) === Number(id));
      trip = (db.memoryStore.trips || []).find(t => Number(t.donation_id) === Number(id) && t.handler_type === 'BIOGAS');
      if (trip) {
        const pc = (db.memoryStore.pairing_codes || []).find(c => Number(c.trip_id) === Number(trip.id) && c.status === 'ACTIVE');
        if (pc) pairingCode = pc.code;
      }
    }

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Waste request not found.' });
    }

    return res.json({
      success: true,
      donation,
      match,
      trip,
      pairingCode,
      redirectionReason: 'Food collection timer expired before successful redistribution.'
    });
  } catch (err) {
    next(err);
  }
};

const acceptBiogasRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    let plant = null;
    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM biogas_plants WHERE user_id = ?', [userId]);
      plant = rows[0];
    } else {
      plant = db.memoryStore.biogas_plants.find(p => p.user_id === Number(userId));
    }

    if (!plant) plant = { is_verified: 1, is_available: 1 };

    if (!plant.is_verified) {
      return res.status(403).json({ success: false, message: 'Unverified Biogas plants cannot accept food waste requests.' });
    }

    if (db.isConnected) {
      await db.query("UPDATE biogas_matches SET match_status = 'ACCEPTED', updated_at = NOW() WHERE donation_id = ?", [id]);
      await db.query("UPDATE donations SET status = 'ACCEPTED', updated_at = NOW() WHERE id = ?", [id]);
      try {
        await db.query(
          "INSERT INTO collections (donation_id, handler_type, handler_id, current_status) VALUES (?, 'BIOGAS', ?, 'ACCEPTED') ON DUPLICATE KEY UPDATE current_status = 'ACCEPTED', handler_type = 'BIOGAS', handler_id = ?",
          [id, plant.id || 1, plant.id || 1]
        );
      } catch (collErr) {
        console.warn('Notice: collections upsert check:', collErr.message);
      }
    } else {
      const m = (db.memoryStore.biogas_matches || []).find(item => Number(item.donation_id) === Number(id));
      if (m) m.match_status = 'ACCEPTED';
      const d = (db.memoryStore.donations || []).find(item => Number(item.id) === Number(id));
      if (d) d.status = 'ACCEPTED';
    }

    notificationService.createNotification({
      userId: 1,
      donationId: Number(id),
      type: 'SMS',
      title: 'Biogas Request Accepted',
      message: `Biogas plant has accepted food waste request #${id} for clean energy conversion.`
    }, req.app && typeof req.app.get === 'function' ? req.app.get('io') : null);

    return res.json({ success: true, message: 'Biogas waste request accepted successfully.' });
  } catch (err) {
    next(err);
  }
};

const rejectBiogasRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isConnected) {
      await db.query("UPDATE biogas_matches SET match_status = 'REJECTED', updated_at = NOW() WHERE donation_id = ?", [id]);
    } else {
      const m = (db.memoryStore.biogas_matches || []).find(item => Number(item.donation_id) === Number(id));
      if (m) m.match_status = 'REJECTED';
    }
    return res.json({ success: true, message: 'Biogas request rejected.' });
  } catch (err) {
    next(err);
  }
};

const startPickup = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isConnected) {
      await db.query("UPDATE biogas_matches SET match_status = 'PICKUP_STARTED', updated_at = NOW() WHERE donation_id = ?", [id]);
      await db.query("UPDATE donations SET status = 'PICKUP_STARTED', updated_at = NOW() WHERE id = ?", [id]);
    } else {
      const m = (db.memoryStore.biogas_matches || []).find(item => Number(item.donation_id) === Number(id));
      if (m) m.match_status = 'PICKUP_STARTED';
      const d = (db.memoryStore.donations || []).find(item => Number(item.id) === Number(id));
      if (d) d.status = 'PICKUP_STARTED';
    }
    return res.json({ success: true, message: 'Pickup started by Biogas transport.' });
  } catch (err) {
    next(err);
  }
};

const completeCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (db.isConnected) {
      await db.query("UPDATE biogas_matches SET match_status = 'COLLECTED', updated_at = NOW() WHERE donation_id = ?", [id]);
      await db.query("UPDATE donations SET status = 'COLLECTED', updated_at = NOW() WHERE id = ?", [id]);
    } else {
      const m = (db.memoryStore.biogas_matches || []).find(item => Number(item.donation_id) === Number(id));
      if (m) m.match_status = 'COLLECTED';
      const d = (db.memoryStore.donations || []).find(item => Number(item.id) === Number(id));
      if (d) d.status = 'COLLECTED';
    }
    return res.json({ success: true, message: 'Food waste collected and transported to Biogas digestion facility.' });
  } catch (err) {
    next(err);
  }
};

const completeProcessing = async (req, res, next) => {
  try {
    const { id } = req.params;
    let quantity = 15.0;

    if (db.isConnected) {
      await db.query("UPDATE biogas_matches SET match_status = 'COMPLETED', updated_at = NOW() WHERE donation_id = ?", [id]);
      await db.query("UPDATE donations SET status = 'COMPLETED', updated_at = NOW() WHERE id = ?", [id]);

      const [dRows] = await db.query('SELECT quantity FROM donations WHERE id = ?', [id]);
      if (dRows.length > 0) quantity = parseFloat(dRows[0].quantity) || 15.0;

      const estimatedBiogas = (quantity * 0.45).toFixed(2);
      try {
        await db.query(
          `INSERT INTO impact_records (donation_id, food_rescued_kg, meals_served, biogas_generated_m3, waste_diverted_kg, co2_saved_kg) 
           VALUES (?, 0, 0, ?, ?, ?) 
           ON CONFLICT (donation_id) DO UPDATE SET biogas_generated_m3 = EXCLUDED.biogas_generated_m3, waste_diverted_kg = EXCLUDED.waste_diverted_kg`,
          [id, estimatedBiogas, quantity, (quantity * 2.5).toFixed(2)]
        );
      } catch (impErr) {
        console.warn('Biogas impact record warning:', impErr.message);
      }
    } else {
      const m = (db.memoryStore.biogas_matches || []).find(item => Number(item.donation_id) === Number(id));
      if (m) m.match_status = 'COMPLETED';
      const d = (db.memoryStore.donations || []).find(don => Number(don.id) === Number(id));
      if (d) {
        d.status = 'COMPLETED';
        quantity = parseFloat(d.quantity) || 15.0;
      }

      const estimatedBiogas = (quantity * 0.45).toFixed(2);
      db.memoryStore.impact_records = db.memoryStore.impact_records || [];
      db.memoryStore.impact_records.push({
        id: db.memoryStore.impact_records.length + 1,
        donation_id: Number(id),
        food_rescued_kg: 0,
        meals_served: 0,
        biogas_generated_m3: estimatedBiogas,
        waste_diverted_kg: quantity,
        co2_saved_kg: (quantity * 2.5).toFixed(2)
      });
    }

    notificationService.createNotification({
      userId: 1,
      donationId: Number(id),
      type: 'IN_APP',
      title: 'Biogas Processing Completed 🌱⚡',
      message: `Food waste listing #${id} was converted into ${ (quantity * 0.45).toFixed(2) } m³ clean biogas fuel!`
    }, req.app.get('io'));

    return res.json({
      success: true,
      message: 'Biogas conversion & processing completed successfully.',
      estimatedBiogasM3: (quantity * 0.45).toFixed(2)
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBiogasProfile,
  updateBiogasProfile,
  getBiogasRequests,
  getBiogasRequestDetails,
  acceptBiogasRequest,
  rejectBiogasRequest,
  startPickup,
  completeCollection,
  completeProcessing,
  uploadBiogasDocument
};
