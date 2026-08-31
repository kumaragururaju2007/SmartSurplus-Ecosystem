const db = require('../database/databaseConnection');
const matchingService = require('../services/matchingService');
const timerService = require('../services/timerService');

const CATEGORY_DEFAULT_HOURS = {
  'Cooked gravy-based food': 2,
  'Cooked dry food': 4,
  'Fresh-cut fruits/vegetables': 3,
  'Packaged/sealed food': 24,
  'Bakery items': 8
};

function calculateSafeUntil(foodCategory, prepTimeStr, customHours = null, clientSafeUntil = null) {
  const defaultHours = CATEGORY_DEFAULT_HOURS[foodCategory] || 4;
  let prepDate = new Date();
  if (prepTimeStr) {
    const parsed = new Date(prepTimeStr);
    if (!isNaN(parsed.getTime())) {
      prepDate = parsed;
    }
  }

  // If client passed a timezone-accurate ISO safe_until timestamp, validate and use it
  if (clientSafeUntil) {
    const clientDate = new Date(clientSafeUntil);
    if (!isNaN(clientDate.getTime())) {
      const maxAllowedMs = prepDate.getTime() + defaultHours * 3600 * 1000 + 120000; // 2 min grace for network transit
      if (clientDate.getTime() <= maxAllowedMs && clientDate.getTime() > prepDate.getTime()) {
        return clientDate;
      }
    }
  }
  
  // Rule: Donor can shorten safe collection window, but CANNOT extend beyond safety max
  let effectiveHours = defaultHours;
  if (customHours !== null && customHours !== undefined && !isNaN(customHours)) {
    const hoursNum = parseFloat(customHours);
    if (hoursNum > 0 && hoursNum <= defaultHours) {
      effectiveHours = hoursNum;
    }
  }

  const safeUntilDate = new Date(prepDate.getTime() + effectiveHours * 3600 * 1000);
  return safeUntilDate;
}

const createDonation = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      food_name,
      food_category,
      quantity,
      quantity_unit,
      description,
      preparation_time,
      safe_until,
      pickup_address,
      latitude,
      longitude,
      image_url,
      custom_safe_hours
    } = req.body;

    // 1. Validation
    if (!food_name || food_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Food name is required.' });
    }

    if (!food_category || !CATEGORY_DEFAULT_HOURS[food_category]) {
      return res.status(400).json({ success: false, message: 'Invalid food category.' });
    }

    const qtyNum = parseFloat(req.body.weight_kg || quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ success: false, message: 'Mandatory food weight in kilograms (kg) must be greater than zero.' });
    }

    if (!pickup_address || pickup_address.trim() === '') {
      return res.status(400).json({ success: false, message: 'Pickup location is required.' });
    }

    const latNum = parseFloat(latitude || 13.0067);
    const lngNum = parseFloat(longitude || 80.2206);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return res.status(400).json({ success: false, message: 'Latitude must be between -90 and 90.' });
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ success: false, message: 'Longitude must be between -180 and 180.' });
    }

    const prepTime = preparation_time ? new Date(preparation_time) : new Date();
    if (isNaN(prepTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Preparation time must be valid.' });
    }

    const safeUntil = calculateSafeUntil(food_category, prepTime, custom_safe_hours, safe_until);

    let donorId = null;
    if (db.isConnected) {
      const [donors] = await db.query('SELECT id FROM donors WHERE user_id = ?', [userId]);
      if (donors.length > 0) donorId = donors[0].id;
    } else {
      const donor = db.memoryStore.donors.find(d => d.user_id === Number(userId));
      if (donor) donorId = donor.id;
    }

    if (!donorId) {
      donorId = 1; // Fallback for dev testing
    }

    let newDonationId = Date.now();

    if (db.isConnected) {
      const [result] = await db.query(
        `INSERT INTO donations 
        (donor_id, food_name, food_category, quantity, quantity_unit, description, preparation_time, safe_until, pickup_address, latitude, longitude, image_url, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'POSTED')`,
        [
          donorId,
          food_name.trim(),
          food_category,
          qtyNum,
          quantity_unit || 'Meals',
          description || '',
          prepTime instanceof Date ? prepTime.toISOString() : (prepTime ? new Date(prepTime).toISOString() : new Date().toISOString()),
          safeUntil instanceof Date ? safeUntil.toISOString() : (safeUntil ? new Date(safeUntil).toISOString() : new Date().toISOString()),
          pickup_address.trim(),
          latNum,
          lngNum,
          image_url || null
        ]
      );
      newDonationId = result.insertId;
    } else {
      const newDonation = {
        id: newDonationId,
        donor_id: donorId,
        food_name: food_name.trim(),
        food_category,
        quantity: qtyNum,
        quantity_unit: quantity_unit || 'Meals',
        description: description || '',
        preparation_time: prepTime.toISOString(),
        safe_until: safeUntil.toISOString(),
        pickup_address: pickup_address.trim(),
        latitude: latNum,
        longitude: lngNum,
        image_url: image_url || null,
        status: 'POSTED',
        created_at: new Date().toISOString()
      };
      db.memoryStore.donations.push(newDonation);
    }

    // Automatically trigger AI / Smart Matching Engine to match & assign donation to appropriate NGO
    try {
      await matchingService.matchNGO(newDonationId);
    } catch (mErr) {
      console.warn('⚠️ Automated NGO matching notice:', mErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      donation: {
        id: newDonationId,
        food_name: food_name.trim(),
        food_category,
        quantity: qtyNum,
        quantity_unit: quantity_unit || 'Meals',
        safe_until: safeUntil,
        status: 'POSTED'
      }
    });
  } catch (err) {
    next(err);
  }
};

const getMyDonations = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let donorId = null;

    // Check timer to ensure newly expired donations are instantly redirected
    try {
      await timerService.checkTimer(req.app && typeof req.app.get === 'function' ? req.app.get('io') : null);
    } catch (tErr) {
      console.warn('Timer check notice:', tErr.message);
    }

    if (db.isConnected) {
      const [donors] = await db.query('SELECT id FROM donors WHERE user_id = ?', [userId]);
      if (donors.length > 0) donorId = donors[0].id;
    } else {
      const donor = db.memoryStore.donors.find(d => d.user_id === Number(userId));
      if (donor) donorId = donor.id;
    }

    if (!donorId) {
      donorId = 1;
    }

    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT d.*, 
                COALESCE(d.people_served_actual, d.people_served_estimate) as people_served,
                CASE 
                  WHEN d.status IN ('REDIRECTED_TO_BIOGAS', 'EXPIRED') AND bp.plant_name IS NOT NULL THEN bp.plant_name
                  ELSE COALESCE(ngo.organization_name, bp.plant_name, 'Pending Assignment')
                END as recipient_name,
                CASE 
                  WHEN d.status IN ('REDIRECTED_TO_BIOGAS', 'EXPIRED') AND bp.address IS NOT NULL THEN bp.address
                  ELSE COALESCE(ngo.address, bp.address, '')
                END as recipient_address
         FROM donations d
         LEFT JOIN donation_matches m ON d.id = m.donation_id AND m.match_status != 'REJECTED'
         LEFT JOIN ngos ngo ON m.ngo_id = ngo.id
         LEFT JOIN biogas_matches bm ON d.id = bm.donation_id
         LEFT JOIN biogas_plants bp ON bm.biogas_plant_id = bp.id
         WHERE d.donor_id = ? 
         ORDER BY d.created_at DESC`,
        [donorId]
      );
      return res.json({ success: true, donations: rows });
    } else {
      const myDonations = (db.memoryStore.donations || [])
        .filter(d => Number(d.donor_id) === Number(donorId))
        .map(d => {
          const match = (db.memoryStore.donation_matches || []).find(m => Number(m.donation_id) === Number(d.id));
          const ngo = match ? (db.memoryStore.ngos || []).find(n => Number(n.id) === Number(match.ngo_id)) : null;
          const bm = (db.memoryStore.biogas_matches || []).find(b => Number(b.donation_id) === Number(d.id));
          const bp = bm ? (db.memoryStore.biogas_plants || []).find(p => Number(p.id) === Number(bm.biogas_plant_id)) : null;
          const isBiogasRedirect = ['REDIRECTED_TO_BIOGAS', 'EXPIRED'].includes(d.status) && bp;
          return {
            ...d,
            people_served: d.people_served_actual || d.people_served_estimate || null,
            recipient_name: isBiogasRedirect ? bp.plant_name : (ngo?.organization_name || bp?.plant_name || 'Matched NGO Shelter')
          };
        });
      return res.json({ success: true, donations: myDonations });
    }
  } catch (err) {
    next(err);
  }
};

const getDonationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    let donorId = null;
    if (db.isConnected) {
      const [donors] = await db.query('SELECT id FROM donors WHERE user_id = ?', [userId]);
      if (donors.length > 0) donorId = donors[0].id;
    } else {
      const d = (db.memoryStore.donors || []).find(donor => Number(donor.user_id) === Number(userId));
      if (d) donorId = d.id;
    }

    let donation = null;
    let match = null;

    // Handle generic / latest / active requests or fallback
    if (!id || id === 'latest' || id === 'active' || id === 'current' || id === 'my') {
      if (db.isConnected) {
        if (role === 'DONOR' && donorId) {
          const [rows] = await db.query(
            `SELECT d.*, donor.business_name as donor_name, donor.address as donor_address, donor.latitude as donor_lat, donor.longitude as donor_lng 
             FROM donations d 
             LEFT JOIN donors donor ON d.donor_id = donor.id 
             WHERE d.donor_id = ? ORDER BY d.id DESC, d.created_at DESC LIMIT 1`, 
            [donorId]
          );
          donation = rows[0];
        } else {
          const [rows] = await db.query(
            `SELECT d.*, donor.business_name as donor_name, donor.address as donor_address, donor.latitude as donor_lat, donor.longitude as donor_lng 
             FROM donations d 
             LEFT JOIN donors donor ON d.donor_id = donor.id 
             ORDER BY d.id DESC, d.created_at DESC LIMIT 1`
          );
          donation = rows[0];
        }
      } else {
        if (role === 'DONOR' && donorId) {
          const myDons = (db.memoryStore.donations || []).filter(d => Number(d.donor_id) === Number(donorId));
          donation = myDons[myDons.length - 1] || null;
        } else {
          const allDons = db.memoryStore.donations || [];
          donation = allDons[allDons.length - 1] || null;
        }
        if (donation) {
          const dObj = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(donation.donor_id));
          donation = {
            ...donation,
            donor_name: dObj?.business_name || 'Food Donor',
            donor_address: dObj?.address || donation.pickup_address,
            donor_lat: dObj?.latitude,
            donor_lng: dObj?.longitude
          };
        }
      }
    } else {
      // Specific ID lookup
      if (db.isConnected) {
        const [rows] = await db.query(
          `SELECT d.*, donor.business_name as donor_name, donor.address as donor_address, donor.latitude as donor_lat, donor.longitude as donor_lng 
           FROM donations d 
           LEFT JOIN donors donor ON d.donor_id = donor.id 
           WHERE d.id = ?`, 
          [id]
        );
        donation = rows[0];

        // If ID lookup failed for Donor, fallback to donor's latest donation
        if (!donation && role === 'DONOR' && donorId) {
          const [rowsFallback] = await db.query(
            `SELECT d.*, donor.business_name as donor_name, donor.address as donor_address, donor.latitude as donor_lat, donor.longitude as donor_lng 
             FROM donations d 
             LEFT JOIN donors donor ON d.donor_id = donor.id 
             WHERE d.donor_id = ? ORDER BY d.created_at DESC LIMIT 1`, 
            [donorId]
          );
          donation = rowsFallback[0];
        }
      } else {
        donation = (db.memoryStore.donations || []).find(d => String(d.id) === String(id) || Number(d.id) === Number(id));

        // If ID lookup failed for Donor, fallback to donor's latest donation
        if (!donation && role === 'DONOR' && donorId) {
          const myDons = (db.memoryStore.donations || []).filter(d => Number(d.donor_id) === Number(donorId));
          donation = myDons[myDons.length - 1] || null;
        }
        if (donation) {
          const dObj = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(donation.donor_id));
          donation = {
            ...donation,
            donor_name: dObj?.business_name || 'Food Donor',
            donor_address: dObj?.address || donation.pickup_address,
            donor_lat: dObj?.latitude,
            donor_lng: dObj?.longitude
          };
        }
      }
    }

    if (!donation) {
      return res.status(404).json({ success: false, message: 'No donations found to track.' });
    }

    // Populate Match and Destination details (NGO or Biogas Plant)
    if (db.isConnected) {
      const [matches] = await db.query(
        `SELECT m.*, ngo.organization_name, ngo.address as ngo_address, ngo.latitude as ngo_lat, ngo.longitude as ngo_lng 
         FROM donation_matches m 
         JOIN ngos ngo ON m.ngo_id = ngo.id 
         WHERE m.donation_id = ? ORDER BY m.match_score DESC LIMIT 1`,
        [donation.id]
      );
      match = matches[0] || null;

      // If no NGO match or if redirected to biogas, check biogas matches
      if (!match || ['EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(donation.status)) {
        const [bMatches] = await db.query(
          `SELECT bm.*, bp.plant_name, bp.plant_name as organization_name, bp.address as ngo_address, bp.latitude as ngo_lat, bp.longitude as ngo_lng, bp.contact_person, bp.phone as plant_phone
           FROM biogas_matches bm
           JOIN biogas_plants bp ON bm.biogas_plant_id = bp.id
           WHERE bm.donation_id = ? ORDER BY bm.created_at DESC LIMIT 1`,
          [donation.id]
        );
        if (bMatches.length > 0) {
          match = bMatches[0];
        }
      }
    } else {
      const m = (db.memoryStore.donation_matches || []).find(matchItem => Number(matchItem.donation_id) === Number(donation.id));
      if (m) {
        const ngo = (db.memoryStore.ngos || []).find(n => Number(n.id) === Number(m.ngo_id));
        match = {
          ...m,
          organization_name: ngo?.organization_name || 'Matched NGO Shelter',
          ngo_address: ngo?.address || '',
          ngo_lat: ngo?.latitude,
          ngo_lng: ngo?.longitude
        };
      }
      if (!match || ['EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(donation.status)) {
        const bm = (db.memoryStore.biogas_matches || []).find(bItem => Number(bItem.donation_id) === Number(donation.id));
        if (bm) {
          const bp = (db.memoryStore.biogas_plants || []).find(p => Number(p.id) === Number(bm.biogas_plant_id));
          match = {
            ...bm,
            plant_name: bp?.plant_name || 'Registered Biogas Facility',
            organization_name: bp?.plant_name || 'Registered Biogas Facility',
            ngo_address: bp?.address || '',
            ngo_lat: bp?.latitude,
            ngo_lng: bp?.longitude,
            contact_person: bp?.contact_person || '',
            plant_phone: bp?.phone || ''
          };
        }
      }
    }

    // Attach full Donor Trust Profile Details
    let donorDetails = null;
    if (db.isConnected) {
      const [dRows] = await db.query(
        `SELECT d.*, u.email, u.phone, u.name as user_name, u.is_verified as user_is_verified
         FROM donors d JOIN users u ON d.user_id = u.id WHERE d.id = ?`,
        [donation.donor_id]
      );
      if (dRows.length > 0) {
        const dr = dRows[0];
        const isOverallVer = Boolean(dr.is_verified || dr.user_is_verified);
        const isFssaiVer = Boolean(dr.is_fssai_verified);
        donorDetails = {
          id: dr.id,
          businessName: dr.business_name,
          contactPerson: dr.contact_person || dr.user_name || '',
          phone: dr.phone || '',
          email: dr.email || '',
          address: dr.address || donation.pickup_address || '',
          city: dr.city || '',
          state: dr.state || '',
          pincode: dr.pincode || '',
          businessType: dr.business_type || 'Hotel',
          fssaiNumber: dr.fssai_number || '',
          fssaiStatus: dr.fssai_status || (isFssaiVer ? 'VERIFIED' : (dr.fssai_number ? 'PENDING' : 'NOT_SUBMITTED')),
          isVerified: isOverallVer,
          isFssaiVerified: isFssaiVer,
          isBusinessVerified: Boolean(dr.is_business_verified || (isOverallVer && isFssaiVer)),
          isLocationVerified: Boolean(dr.is_location_verified || isOverallVer),
          isPhoneVerified: Boolean(dr.is_phone_verified || isOverallVer)
        };
      }
    } else {
      const dr = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(donation.donor_id));
      if (dr) {
        const u = (db.memoryStore.users || []).find(usr => Number(usr.id) === Number(dr.user_id)) || {};
        const isOverallVer = Boolean(dr.is_verified || u.is_verified);
        const isFssaiVer = Boolean(dr.is_fssai_verified);
        donorDetails = {
          id: dr.id,
          businessName: dr.business_name || 'Food Donor',
          contactPerson: dr.contact_person || u.name || '',
          phone: u.phone || dr.phone || '',
          email: u.email || dr.email || '',
          address: dr.address || donation.pickup_address || '',
          city: dr.city || '',
          state: dr.state || '',
          pincode: dr.pincode || '',
          businessType: dr.business_type || 'Hotel',
          fssaiNumber: dr.fssai_number || '',
          fssaiStatus: dr.fssai_status || (isFssaiVer ? 'VERIFIED' : (dr.fssai_number ? 'PENDING' : 'NOT_SUBMITTED')),
          isVerified: isOverallVer,
          isFssaiVerified: isFssaiVer,
          isBusinessVerified: Boolean(dr.is_business_verified || (isOverallVer && isFssaiVer)),
          isLocationVerified: Boolean(dr.is_location_verified || isOverallVer),
          isPhoneVerified: Boolean(dr.is_phone_verified || isOverallVer)
        };
      }
    }

    const serializedDonation = donation ? {
      ...donation,
      safe_until: donation.safe_until ? (donation.safe_until instanceof Date ? donation.safe_until.toISOString() : (String(donation.safe_until).endsWith('Z') ? String(donation.safe_until) : `${String(donation.safe_until).replace(' ', 'T')}Z`)) : donation.safe_until,
      preparation_time: donation.preparation_time ? (donation.preparation_time instanceof Date ? donation.preparation_time.toISOString() : (String(donation.preparation_time).endsWith('Z') ? String(donation.preparation_time) : `${String(donation.preparation_time).replace(' ', 'T')}Z`)) : donation.preparation_time
    } : null;

    return res.json({ success: true, donation: serializedDonation, match, donor: donorDetails });
  } catch (err) {
    next(err);
  }
};

const cancelDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    let donation = null;
    let donorId = null;

    if (db.isConnected) {
      const [donors] = await db.query('SELECT id FROM donors WHERE user_id = ?', [userId]);
      if (donors.length > 0) donorId = donors[0].id;

      const [rows] = await db.query('SELECT * FROM donations WHERE id = ?', [id]);
      donation = rows[0];
    } else {
      const donor = db.memoryStore.donors.find(d => d.user_id === Number(userId));
      if (donor) donorId = donor.id;
      donation = db.memoryStore.donations.find(d => Number(d.id) === Number(id));
    }

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (donorId && Number(donation.donor_id) !== Number(donorId)) {
      return res.status(403).json({ success: false, message: 'You cannot access this donation.' });
    }

    // Rule: Allow cancellation ONLY when status = 'POSTED'
    if (donation.status !== 'POSTED') {
      return res.status(400).json({
        success: false,
        message: 'Donation cannot be cancelled at this stage.'
      });
    }

    if (db.isConnected) {
      await db.query('UPDATE donations SET status = "CANCELLED" WHERE id = ?', [id]);
    } else {
      donation.status = 'CANCELLED';
    }

    return res.json({
      success: true,
      message: 'Donation cancelled successfully.'
    });
  } catch (err) {
    next(err);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let donorId = null;
    let donorName = req.user.name || 'Donor';

    if (db.isConnected) {
      const [users] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
      if (users.length > 0 && users[0].name) {
        donorName = users[0].name;
      }
      const [donors] = await db.query('SELECT id FROM donors WHERE user_id = ?', [userId]);
      if (donors.length > 0) {
        donorId = donors[0].id;
      }
    } else {
      const userObj = db.memoryStore.users.find(u => Number(u.id) === Number(userId));
      if (userObj && userObj.name) {
        donorName = userObj.name;
      }
      const donor = db.memoryStore.donors.find(d => Number(d.user_id) === Number(userId));
      if (donor) {
        donorId = donor.id;
      }
    }

    if (!donorId) {
      donorId = 1;
    }

    let allDonations = [];
    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT d.*, 
                COALESCE(d.people_served_actual, d.people_served_estimate) as people_served,
                COALESCE(ngo.organization_name, bp.plant_name, 'Pending Assignment') as recipient_name
         FROM donations d
         LEFT JOIN donation_matches m ON d.id = m.donation_id AND m.match_status != 'REJECTED'
         LEFT JOIN ngos ngo ON m.ngo_id = ngo.id
         LEFT JOIN biogas_matches bm ON d.id = bm.donation_id
         LEFT JOIN biogas_plants bp ON bm.biogas_plant_id = bp.id
         WHERE d.donor_id = ? 
         ORDER BY d.id DESC`,
        [donorId]
      );
      allDonations = rows;
    } else {
      allDonations = (db.memoryStore.donations || [])
        .filter(d => Number(d.donor_id) === Number(donorId))
        .map(d => {
          const match = (db.memoryStore.donation_matches || []).find(m => Number(m.donation_id) === Number(d.id));
          const ngo = match ? (db.memoryStore.ngos || []).find(n => Number(n.id) === Number(match.ngo_id)) : null;
          return {
            ...d,
            people_served: d.people_served_actual || d.people_served_estimate || null,
            recipient_name: ngo?.organization_name || 'Matched NGO Shelter'
          };
        });
    }

    const totalDonations = allDonations.length;
    const activeStatuses = ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_READY', 'PICKUP_STARTED', 'COLLECTED', 'IN_TRANSIT'];
    const activeList = allDonations.filter(d => activeStatuses.includes(d.status));
    const activeDonationsCount = activeList.length;
    const completedList = allDonations.filter(d => d.status === 'DELIVERED' || d.status === 'COMPLETED');
    const completedDonationsCount = completedList.length;

    let totalFoodKg = 0;
    let totalFoodReceivedKg = 0;
    let totalPeopleServed = 0;

    // Only count completed/confirmed donations for official impact statistics
    completedList.forEach(d => {
      const donQty = parseFloat(d.quantity) || 0;
      const recQty = (d.quantity_received !== null && d.quantity_received !== undefined) ? parseFloat(d.quantity_received) : donQty;
      
      const people = (d.people_served_actual !== null && d.people_served_actual !== undefined)
        ? parseInt(d.people_served_actual, 10)
        : (d.people_served_estimate !== null && d.people_served_estimate !== undefined)
          ? parseInt(d.people_served_estimate, 10)
          : Math.round(recQty * 2.5); // Fallback for pre-migration data

      totalFoodKg += donQty;
      totalFoodReceivedKg += recQty;
      totalPeopleServed += (people || 0);
    });

    const recentDonations = allDonations.slice(0, 5);
    const activeDonation = activeList.length > 0 ? activeList[0] : null;

    const foodDonatedKg = parseFloat(totalFoodKg.toFixed(1));
    const foodReceivedKg = parseFloat(totalFoodReceivedKg.toFixed(1));
    const peopleServed = totalPeopleServed;
    const co2SavedKg = parseFloat((totalFoodKg * 2.1).toFixed(1));
    const foodWasteReducedKg = foodDonatedKg;

    let donorTrustScore = 5.0;
    let donorTrustPoints = 100;
    let donorTotalReviews = 0;
    let donorTrustLevel = 'TOP_RATED';

    if (db.isConnected && donorId) {
      const [drRows] = await db.query('SELECT trust_score, trust_points, total_reviews_count, trust_level FROM donors WHERE id = ?', [donorId]);
      if (drRows.length) {
        donorTrustScore = parseFloat(drRows[0].trust_score || 5.0);
        donorTrustPoints = parseInt(drRows[0].trust_points || Math.round(donorTrustScore * 20), 10);
        donorTotalReviews = parseInt(drRows[0].total_reviews_count || 0, 10);
        donorTrustLevel = drRows[0].trust_level || 'TOP_RATED';
      }
    } else if (donorId) {
      const dObj = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(donorId));
      if (dObj) {
        donorTrustScore = parseFloat(dObj.trust_score || 5.0);
        donorTrustPoints = parseInt(dObj.trust_points || Math.round(donorTrustScore * 20), 10);
        donorTotalReviews = parseInt(dObj.total_reviews_count || 0, 10);
        donorTrustLevel = dObj.trust_level || 'TOP_RATED';
      }
    }

    return res.json({
      success: true,
      summary: {
        donorName,
        trustScore: donorTrustScore,
        trustPoints: donorTrustPoints,
        totalReviews: donorTotalReviews,
        trustLevel: donorTrustLevel,
        totalDonations,
        activeDonations: activeDonationsCount,
        completedDonations: completedDonationsCount,
        totalFoodDonated: foodDonatedKg,
        foodReceivedKg,
        peopleBenefited: peopleServed,
        recentDonations,
        activeDonation,
        impact: {
          foodDonatedKg,
          foodReceivedKg,
          peopleServed,
          peopleBenefited: peopleServed,
          co2SavedKg,
          foodWasteReducedKg
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const getDonorAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const timeRange = req.query.range || '30d'; // '7d', '30d', '90d', 'all'
    let donorId = null;

    if (db.isConnected) {
      const [donors] = await db.query('SELECT id FROM donors WHERE user_id = ?', [userId]);
      if (donors.length > 0) donorId = donors[0].id;
    } else {
      const donor = db.memoryStore.donors.find(d => Number(d.user_id) === Number(userId));
      if (donor) donorId = donor.id;
    }

    if (!donorId) {
      donorId = 1;
    }

    let daysCount = 30;
    if (timeRange === '7d') daysCount = 7;
    else if (timeRange === '30d') daysCount = 30;
    else if (timeRange === '90d') daysCount = 90;
    else if (timeRange === 'all') daysCount = 365;

    let donations = [];
    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT d.*, 
                COALESCE(d.people_served_actual, d.people_served_estimate, 0) as people_served,
                COALESCE(ngo.organization_name, bp.plant_name, 'Direct Dispatch') as recipient_name
         FROM donations d
         LEFT JOIN donation_matches m ON d.id = m.donation_id AND m.match_status != 'REJECTED'
         LEFT JOIN ngos ngo ON m.ngo_id = ngo.id
         LEFT JOIN biogas_matches bm ON d.id = bm.donation_id
         LEFT JOIN biogas_plants bp ON bm.biogas_plant_id = bp.id
         WHERE d.donor_id = ? 
         ORDER BY d.created_at ASC`,
        [donorId]
      );
      donations = rows;
    } else {
      donations = (db.memoryStore.donations || [])
        .filter(d => Number(d.donor_id) === Number(donorId))
        .map(d => ({
          ...d,
          people_served: d.people_served_actual || d.people_served_estimate || 0
        }));
    }

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - (daysCount - 1));
    startDate.setHours(0, 0, 0, 0);

    const filteredDonations = (timeRange === 'all')
      ? donations
      : donations.filter(d => new Date(d.created_at) >= startDate);

    // 1. Frequently Donated Foods aggregation
    const foodMap = {};
    filteredDonations.forEach(d => {
      const name = (d.food_name || 'Assorted Meals').trim();
      const cat = d.food_category || 'Cooked Food';
      const key = `${name.toLowerCase()}_${cat.toLowerCase()}`;
      const qty = parseFloat(d.quantity) || 0;
      const people = parseInt(d.people_served, 10) || Math.round(qty * 2.5);
      const isCompleted = d.status === 'COMPLETED' || d.status === 'DELIVERED';

      if (!foodMap[key]) {
        foodMap[key] = {
          food_name: name,
          food_category: cat,
          frequency: 0,
          total_kg: 0,
          completed_count: 0,
          people_served_total: 0,
          last_donated_at: d.created_at
        };
      }
      foodMap[key].frequency += 1;
      foodMap[key].total_kg += qty;
      if (isCompleted) {
        foodMap[key].completed_count += 1;
        foodMap[key].people_served_total += people;
      }
      if (new Date(d.created_at) > new Date(foodMap[key].last_donated_at)) {
        foodMap[key].last_donated_at = d.created_at;
      }
    });

    const frequentlyDonated = Object.values(foodMap)
      .map(item => ({
        ...item,
        total_kg: parseFloat(item.total_kg.toFixed(1)),
        avg_kg: parseFloat((item.total_kg / item.frequency).toFixed(1))
      }))
      .sort((a, b) => b.frequency - a.frequency || b.total_kg - a.total_kg);

    // 2. Day vs Amount of Food Donated Linear Graph
    const formatDateKey = (dateVal) => {
      const d = new Date(dateVal);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dayMap = {};
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateKey = formatDateKey(d);
      const dayLabel = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      dayMap[dateKey] = {
        date: dateKey,
        dayLabel,
        amount_donated_kg: 0,
        donations_count: 0,
        people_served: 0
      };
    }

    filteredDonations.forEach(d => {
      const dateKey = formatDateKey(d.created_at);
      const qty = parseFloat(d.quantity) || 0;
      const people = parseInt(d.people_served, 10) || Math.round(qty * 2.5);

      if (dayMap[dateKey]) {
        dayMap[dateKey].amount_donated_kg += qty;
        dayMap[dateKey].donations_count += 1;
        dayMap[dateKey].people_served += people;
      } else if (timeRange === 'all') {
        const dObj = new Date(d.created_at);
        dayMap[dateKey] = {
          date: dateKey,
          dayLabel: dObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          amount_donated_kg: qty,
          donations_count: 1,
          people_served: people
        };
      }
    });

    const dailyTrends = Object.values(dayMap).map(item => ({
      ...item,
      amount_donated_kg: parseFloat(item.amount_donated_kg.toFixed(1))
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Category Breakdown
    const catMap = {};
    let totalKg = 0;
    filteredDonations.forEach(d => {
      const cat = d.food_category || 'Other';
      const qty = parseFloat(d.quantity) || 0;
      totalKg += qty;
      if (!catMap[cat]) catMap[cat] = { category: cat, total_kg: 0, count: 0 };
      catMap[cat].total_kg += qty;
      catMap[cat].count += 1;
    });

    const categoryBreakdown = Object.values(catMap).map(c => ({
      ...c,
      total_kg: parseFloat(c.total_kg.toFixed(1)),
      percentage: totalKg > 0 ? Math.round((c.total_kg / totalKg) * 100) : 0
    })).sort((a, b) => b.total_kg - a.total_kg);

    // 4. Summary KPIs
    let peakDay = { date: 'N/A', amount_kg: 0 };
    dailyTrends.forEach(d => {
      if (d.amount_donated_kg > peakDay.amount_kg) {
        peakDay = { date: d.dayLabel, amount_kg: d.amount_donated_kg };
      }
    });

    const totalDonatedKg = parseFloat(totalKg.toFixed(1));
    const totalDonationsCount = filteredDonations.length;
    const completedCount = filteredDonations.filter(d => d.status === 'COMPLETED' || d.status === 'DELIVERED').length;
    const rescueRate = totalDonationsCount > 0 ? Math.round((completedCount / totalDonationsCount) * 100) : 0;
    const avgDonationKg = totalDonationsCount > 0 ? parseFloat((totalDonatedKg / totalDonationsCount).toFixed(1)) : 0;
    const totalPeopleBenefited = filteredDonations.reduce((sum, d) => sum + (parseInt(d.people_served, 10) || 0), 0);

    return res.json({
      success: true,
      analytics: {
        timeRange,
        summary: {
          totalDonatedKg,
          totalDonationsCount,
          completedCount,
          rescueRate,
          avgDonationKg,
          totalPeopleBenefited,
          co2SavedKg: parseFloat((totalDonatedKg * 2.1).toFixed(1)),
          peakDay
        },
        dailyTrends,
        frequentlyDonated,
        categoryBreakdown
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateDonationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, newStatus } = req.body;
    const targetStatus = status || newStatus;
    const userId = req.user.userId;
    const role = req.user.role;

    if (!targetStatus) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    let donation = null;
    let match = null;
    let biogasMatch = null;

    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM donations WHERE id = ?', [id]);
      donation = rows[0];
      if (donation) {
        const [mRows] = await db.query('SELECT * FROM donation_matches WHERE donation_id = ?', [id]);
        match = mRows[0];
        const [bmRows] = await db.query('SELECT * FROM biogas_matches WHERE donation_id = ?', [id]);
        biogasMatch = bmRows[0];
      }
    } else {
      donation = (db.memoryStore.donations || []).find(d => Number(d.id) === Number(id));
      match = (db.memoryStore.donation_matches || []).find(m => Number(m.donation_id) === Number(id));
      biogasMatch = (db.memoryStore.biogas_matches || []).find(m => Number(m.donation_id) === Number(id));
    }

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Role-based Transition Validation
    // 1. Acceptance -> ACCEPTED
    if (targetStatus === 'ACCEPTED') {
      if (role !== 'NGO' && role !== 'BIOGAS' && role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only an NGO, Biogas Plant, or Admin can accept this donation request.' });
      }
    }
    // 2. Dispatch vehicle -> PICKUP_STARTED
    else if (targetStatus === 'PICKUP_STARTED') {
      if (role !== 'NGO' && role !== 'BIOGAS' && role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only the assigned NGO, Biogas Plant, or Admin can initiate vehicle pickup.' });
      }
    }
    // 3. Confirm food/waste handover -> COLLECTED
    else if (targetStatus === 'COLLECTED' || targetStatus === 'IN_TRANSIT') {
      if (role !== 'DONOR' && role !== 'NGO' && role !== 'BIOGAS' && role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only the Donor, Transporter, or Admin can confirm collection.' });
      }
    }
    // 4. Delivered at Shelter or Biogas Digester -> DELIVERED / COMPLETED
    else if (targetStatus === 'DELIVERED' || targetStatus === 'COMPLETED') {
      if (role !== 'NGO' && role !== 'BIOGAS' && role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only the destination organization or Admin can confirm receipt.' });
      }
    }

    // Update database
    if (db.isConnected) {
      await db.query('UPDATE donations SET status = ? WHERE id = ?', [targetStatus, id]);
      if (targetStatus === 'DELIVERED' || targetStatus === 'COMPLETED') {
        await db.query("UPDATE donation_matches SET match_status = 'COMPLETED' WHERE donation_id = ?", [id]);
        await db.query("UPDATE biogas_matches SET match_status = 'COMPLETED' WHERE donation_id = ?", [id]);
        
        // Log biogas impact if completed by biogas
        if (biogasMatch || ['EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(donation.status)) {
          const qty = parseFloat(donation.quantity) || 10;
          const estimatedBiogas = (qty * 0.45).toFixed(2);
          try {
            await db.query(
              `INSERT INTO impact_records (donation_id, food_rescued_kg, meals_served, biogas_generated_m3, waste_diverted_kg, co2_saved_kg)
               VALUES (?, 0, 0, ?, ?, ?)
               ON CONFLICT (donation_id) DO UPDATE SET biogas_generated_m3 = EXCLUDED.biogas_generated_m3, waste_diverted_kg = EXCLUDED.waste_diverted_kg`,
              [id, estimatedBiogas, qty, (qty * 2.5).toFixed(2)]
            );
          } catch (impErr) {
            console.warn('Impact record note:', impErr.message);
          }
        }
      } else {
        await db.query("UPDATE donation_matches SET match_status = 'ACCEPTED' WHERE donation_id = ?", [id]);
        await db.query("UPDATE biogas_matches SET match_status = ? WHERE donation_id = ?", [targetStatus, id]);

        if (targetStatus === 'PICKUP_STARTED') {
          const crypto = require('crypto');
          const [tRows] = await db.query('SELECT * FROM trips WHERE donation_id = ? ORDER BY id DESC LIMIT 1', [id]);
          let targetTripId = null;
          let vehicleId = 1;
          let driverId = 1;
          if (tRows.length > 0) {
            targetTripId = tRows[0].id;
            vehicleId = tRows[0].vehicle_id || 1;
            driverId = tRows[0].driver_id || 1;
            await db.query("UPDATE trips SET status = 'PICKUP_STARTED', started_at = NOW() WHERE id = ?", [targetTripId]);
          } else {
            const ngoId = match ? match.ngo_id : 1;
            const [vRows] = await db.query('SELECT id FROM vehicles WHERE ngo_id = ? OR handler_type = \'NGO\' ORDER BY id ASC LIMIT 1', [ngoId]);
            if (vRows.length) vehicleId = vRows[0].id;
            const [drRows] = await db.query('SELECT id FROM drivers WHERE ngo_id = ? OR handler_type = \'NGO\' ORDER BY id ASC LIMIT 1', [ngoId]);
            if (drRows.length) driverId = drRows[0].id;

            const tripCode = `TRIP-D${id}-V${vehicleId}-${Date.now().toString().slice(-4)}`;
            const [insTrip] = await db.query(
              `INSERT INTO trips 
               (trip_code, donation_id, ngo_id, biogas_plant_id, handler_type, vehicle_id, driver_id, pickup_address, destination_address, tracking_method, status, started_at) 
               VALUES (?, ?, ?, ?, 'NGO', ?, ?, ?, 'NGO Shelter Hub', 'DRIVER_MOBILE_GPS', 'PICKUP_STARTED', NOW())`,
              [tripCode, id, ngoId, null, vehicleId, driverId, donation.pickup_address || 'Donor Location']
            );
            targetTripId = insTrip.insertId;
          }

          // Generate 6-digit random driver pairing code
          const [pcRows] = await db.query("SELECT code FROM pairing_codes WHERE trip_id = ? AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1", [targetTripId]);
          if (!pcRows.length) {
            const pairingCode = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
            await db.query("UPDATE pairing_codes SET status = 'EXPIRED' WHERE (vehicle_id = ? OR driver_id = ?) AND status = 'ACTIVE'", [vehicleId, driverId]);
            await db.query(
              "INSERT INTO pairing_codes (code, vehicle_id, driver_id, trip_id, handler_type, handler_id, expires_at, status) VALUES (?, ?, ?, ?, 'NGO', ?, ?, 'ACTIVE')",
              [pairingCode, vehicleId, driverId, targetTripId, match ? match.ngo_id : 1, expiresAt]
            );
          }
        }
      }
    } else {
      donation.status = targetStatus;
      if (match) {
        match.match_status = (targetStatus === 'DELIVERED' || targetStatus === 'COMPLETED') ? 'COMPLETED' : 'ACCEPTED';
      }
      if (biogasMatch) {
        biogasMatch.match_status = (targetStatus === 'DELIVERED' || targetStatus === 'COMPLETED') ? 'COMPLETED' : targetStatus;
      }
      if (targetStatus === 'PICKUP_STARTED') {
        const crypto = require('crypto');
        let trip = (db.memoryStore.trips || []).find(t => Number(t.donation_id) === Number(id));
        if (!trip) {
          const newTripId = (db.memoryStore.trips || []).length + 1;
          trip = {
            id: newTripId,
            trip_code: `TRIP-D${id}-V1-${Date.now().toString().slice(-4)}`,
            donation_id: Number(id),
            ngo_id: 1,
            vehicle_id: 1,
            driver_id: 1,
            handler_type: 'NGO',
            status: 'PICKUP_STARTED',
            tracking_method: 'DRIVER_MOBILE_GPS',
            started_at: new Date()
          };
          db.memoryStore.trips = db.memoryStore.trips || [];
          db.memoryStore.trips.push(trip);
        } else {
          trip.status = 'PICKUP_STARTED';
        }
        const activeCode = (db.memoryStore.pairing_codes || []).find(p => Number(p.trip_id) === Number(trip.id) && p.status === 'ACTIVE');
        if (!activeCode) {
          const pairingCode = crypto.randomInt(100000, 999999).toString();
          db.memoryStore.pairing_codes = db.memoryStore.pairing_codes || [];
          db.memoryStore.pairing_codes.push({
            id: db.memoryStore.pairing_codes.length + 1,
            code: pairingCode,
            vehicle_id: trip.vehicle_id,
            driver_id: trip.driver_id,
            trip_id: trip.id,
            handler_type: 'NGO',
            handler_id: 1,
            expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
            status: 'ACTIVE'
          });
        }
      }
    }

    // Find donor and NGO user IDs for real-time notifications
    let donorUserId = null;
    let ngoUserId = null;
    let orgName = 'NGO Shelter';

    if (db.isConnected) {
      const [dRows] = await db.query('SELECT user_id FROM donors WHERE id = ?', [donation.donor_id]);
      if (dRows.length > 0) donorUserId = dRows[0].user_id;

      if (match) {
        const [nRows] = await db.query('SELECT user_id, organization_name FROM ngos WHERE id = ?', [match.ngo_id]);
        if (nRows.length > 0) {
          ngoUserId = nRows[0].user_id;
          orgName = nRows[0].organization_name;
        }
      }
    } else {
      const donor = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(donation.donor_id));
      if (donor) donorUserId = donor.user_id;

      if (match) {
        const ngo = (db.memoryStore.ngos || []).find(n => Number(n.id) === Number(match.ngo_id));
        if (ngo) {
          ngoUserId = ngo.user_id;
          orgName = ngo.organization_name;
        }
      }
    }

    const io = req.app ? req.app.get('io') : null;
    const notificationService = require('../services/notificationService');

    // Trigger specific notifications & socket broadcasts per status:
    if (targetStatus === 'PICKUP_STARTED') {
      if (donorUserId) {
        await notificationService.createNotification({
          userId: donorUserId,
          donationId: Number(id),
          type: 'IN_APP',
          title: 'Vehicle Dispatched! 🚚',
          message: `${orgName} vehicle has started the pickup route. Driver is on the way!`,
          category: 'Tracking',
          priority: 'Urgent',
          actionRoute: `/tracking/${id}`,
          actionLabel: 'Track Vehicle'
        }, io);
      }
      if (io) {
        io.to(`donation_${id}`).emit('pickupStarted', { donationId: Number(id), status: 'PICKUP_STARTED' });
      }
    } else if (targetStatus === 'COLLECTED') {
      if (ngoUserId) {
        await notificationService.createNotification({
          userId: ngoUserId,
          donationId: Number(id),
          type: 'IN_APP',
          title: 'Food Collected! 🤝',
          message: `Donor confirmed food handover for "${donation.food_name}". Proceed to shelter for distribution.`,
          category: 'Tracking',
          priority: 'Important',
          actionRoute: `/tracking/${id}`,
          actionLabel: 'View Route'
        }, io);
      }
      if (io) {
        io.to(`donation_${id}`).emit('donationCollected', { donationId: Number(id), status: 'COLLECTED' });
      }
    } else if (targetStatus === 'DELIVERED' || targetStatus === 'COMPLETED') {
      if (donorUserId) {
        await notificationService.createNotification({
          userId: donorUserId,
          donationId: Number(id),
          type: 'IN_APP',
          title: 'Food Successfully Delivered! 🎉',
          message: `Your donation "${donation.food_name}" has been safely delivered to ${orgName} and is feeding those in need!`,
          category: 'Delivery',
          priority: 'Normal',
          actionRoute: `/tracking/${id}`,
          actionLabel: 'View Impact'
        }, io);
      }
      if (io) {
        io.to(`donation_${id}`).emit('donationDelivered', { donationId: Number(id), status: 'DELIVERED' });
      }
    }

    return res.json({
      success: true,
      message: `Donation status updated to ${targetStatus} successfully.`,
      status: targetStatus
    });
  } catch (err) {
    next(err);
  }
};

// 7. GET DONOR PROFILE (AUTHENTICATED DONOR)
const getDonorProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let donor = null;
    let user = null;

    if (db.isConnected) {
      const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      user = uRows[0] || null;

      const [dRows] = await db.query('SELECT * FROM donors WHERE user_id = ?', [userId]);
      donor = dRows[0] || null;

      if (!donor && user) {
        // Create initial donor profile record if not found
        const [ins] = await db.query(
          'INSERT INTO donors (user_id, business_name, contact_person, business_type, address, city, state, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, user.name || 'Food Donor', user.name || '', 'Hotel', '', '', '', Boolean(user.is_verified)]
        );
        const [createdRows] = await db.query('SELECT * FROM donors WHERE id = ?', [ins.insertId]);
        donor = createdRows[0];
      }
    } else {
      user = (db.memoryStore.users || []).find(u => Number(u.id) === Number(userId)) || null;
      donor = (db.memoryStore.donors || []).find(d => Number(d.user_id) === Number(userId)) || null;

      if (!donor && user) {
        donor = {
          id: db.memoryStore.donors.length + 1,
          user_id: userId,
          business_name: user.name || 'Food Donor',
          contact_person: user.name || '',
          business_type: 'Hotel',
          fssai_number: '',
          fssai_status: 'NOT_SUBMITTED',
          is_fssai_verified: 0,
          is_business_verified: 0,
          is_location_verified: 0,
          is_phone_verified: 0,
          is_verified: user.is_verified ? 1 : 0,
          address: '',
          city: '',
          state: '',
          pincode: '',
          created_at: new Date()
        };
        db.memoryStore.donors.push(donor);
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const isOverallVerified = Boolean(donor?.is_verified || user.is_verified);
    const isFssaiVer = Boolean(donor?.is_fssai_verified);
    const isBizVer = Boolean(donor?.is_business_verified || (isOverallVerified && isFssaiVer));
    const isLocVer = Boolean(donor?.is_location_verified || isOverallVerified);
    const isPhVer = Boolean(donor?.is_phone_verified || isOverallVerified);

    let fssaiStatus = donor?.fssai_status;
    if (!fssaiStatus || fssaiStatus === 'NOT_SUBMITTED') {
      fssaiStatus = isFssaiVer ? 'VERIFIED' : (donor?.fssai_number ? 'PENDING' : 'NOT_SUBMITTED');
    }

    const profile = {
      id: donor?.id || 1,
      userId: user.id,
      businessName: donor?.business_name || user.name || 'Food Donor',
      contactPerson: donor?.contact_person || user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      address: donor?.address || '',
      city: donor?.city || '',
      state: donor?.state || '',
      pincode: donor?.pincode || '',
      businessType: donor?.business_type || 'Hotel',
      fssaiNumber: donor?.fssai_number || '',
      fssaiStatus: fssaiStatus,
      isVerified: isOverallVerified,
      isFssaiVerified: isFssaiVer,
      isBusinessVerified: isBizVer,
      isLocationVerified: isLocVer,
      isPhoneVerified: isPhVer,
      latitude: donor?.latitude,
      longitude: donor?.longitude,
      createdAt: donor?.created_at || user.created_at
    };

    return res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

// 8. UPDATE DONOR PROFILE (AUTHENTICATED DONOR)
const updateDonorProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      businessName,
      contactPerson,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      businessType,
      fssaiNumber,
      latitude,
      longitude
    } = req.body;

    if (!businessName || businessName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Hotel / Donor name is required.' });
    }

    const parsedLat = (latitude !== null && latitude !== undefined && latitude !== '') ? parseFloat(latitude) : null;
    const parsedLng = (longitude !== null && longitude !== undefined && longitude !== '') ? parseFloat(longitude) : null;
    const cleanFssai = fssaiNumber ? String(fssaiNumber).trim() : '';

    let existingDonor = null;
    let existingUser = null;

    if (db.isConnected) {
      const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      existingUser = uRows[0];
      const [dRows] = await db.query('SELECT * FROM donors WHERE user_id = ?', [userId]);
      existingDonor = dRows[0];

      // Determine FSSAI verification status logic:
      // Submitting or updating FSSAI number must NOT auto-verify. It queues as 'PENDING' for Admin review.
      let newFssaiStatus = existingDonor?.fssai_status || 'NOT_SUBMITTED';
      let newFssaiVerified = existingDonor?.is_fssai_verified || 0;

      const oldFssai = existingDonor?.fssai_number ? String(existingDonor.fssai_number).trim() : '';

      if (cleanFssai) {
        if (cleanFssai !== oldFssai) {
          newFssaiStatus = 'PENDING';
          newFssaiVerified = 0;
        }
      } else {
        newFssaiStatus = 'NOT_SUBMITTED';
        newFssaiVerified = 0;
      }

      // Update users table
      if (phone || contactPerson) {
        await db.query('UPDATE users SET phone = COALESCE(?, phone), name = COALESCE(?, name) WHERE id = ?', [phone || null, contactPerson || businessName, userId]);
      }

      if (existingDonor) {
        await db.query(
          `UPDATE donors 
           SET business_name = ?,
               contact_person = ?,
               business_type = ?,
               fssai_number = ?,
               fssai_status = ?,
               is_fssai_verified = ?,
               address = ?,
               city = ?,
               state = ?,
               pincode = ?,
               latitude = COALESCE(?, latitude),
               longitude = COALESCE(?, longitude)
           WHERE id = ?`,
          [
            businessName,
            contactPerson || existingUser?.name || '',
            businessType || 'Hotel',
            cleanFssai || null,
            newFssaiStatus,
            newFssaiVerified,
            address || '',
            city || '',
            state || '',
            pincode || null,
            parsedLat,
            parsedLng,
            existingDonor.id
          ]
        );
      } else {
        await db.query(
          `INSERT INTO donors 
           (user_id, business_name, contact_person, business_type, fssai_number, fssai_status, is_fssai_verified, address, city, state, pincode, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            businessName,
            contactPerson || existingUser?.name || '',
            businessType || 'Hotel',
            cleanFssai || null,
            cleanFssai ? 'PENDING' : 'NOT_SUBMITTED',
            false,
            address || '',
            city || '',
            state || '',
            pincode || null,
            parsedLat,
            parsedLng
          ]
        );
      }
    } else {
      existingUser = (db.memoryStore.users || []).find(u => Number(u.id) === Number(userId));
      existingDonor = (db.memoryStore.donors || []).find(d => Number(d.user_id) === Number(userId));

      if (existingUser) {
        if (phone) existingUser.phone = phone;
        if (contactPerson) existingUser.name = contactPerson;
      }

      const oldFssai = existingDonor?.fssai_number ? String(existingDonor.fssai_number).trim() : '';

      let newFssaiStatus = existingDonor?.fssai_status || 'NOT_SUBMITTED';
      let newFssaiVerified = existingDonor?.is_fssai_verified || 0;

      if (cleanFssai) {
        if (cleanFssai !== oldFssai) {
          newFssaiStatus = 'PENDING';
          newFssaiVerified = 0;
        }
      } else {
        newFssaiStatus = 'NOT_SUBMITTED';
        newFssaiVerified = 0;
      }

      if (existingDonor) {
        existingDonor.business_name = businessName;
        existingDonor.contact_person = contactPerson || existingUser?.name || '';
        existingDonor.business_type = businessType || 'Hotel';
        existingDonor.fssai_number = cleanFssai;
        existingDonor.fssai_status = newFssaiStatus;
        existingDonor.is_fssai_verified = newFssaiVerified;
        existingDonor.address = address || '';
        existingDonor.city = city || '';
        existingDonor.state = state || '';
        existingDonor.pincode = pincode || '';
        if (parsedLat !== null) existingDonor.latitude = parsedLat;
        if (parsedLng !== null) existingDonor.longitude = parsedLng;
      } else {
        existingDonor = {
          id: db.memoryStore.donors.length + 1,
          user_id: userId,
          business_name: businessName,
          contact_person: contactPerson || existingUser?.name || '',
          business_type: businessType || 'Hotel',
          fssai_number: cleanFssai,
          fssai_status: cleanFssai ? 'PENDING' : 'NOT_SUBMITTED',
          is_fssai_verified: 0,
          is_business_verified: 0,
          is_location_verified: 0,
          is_phone_verified: 0,
          is_verified: 0,
          address: address || '',
          city: city || '',
          state: state || '',
          pincode: pincode || '',
          latitude: parsedLat,
          longitude: parsedLng,
          created_at: new Date()
        };
        db.memoryStore.donors.push(existingDonor);
      }
    }

    return res.json({
      success: true,
      message: 'Donor profile updated successfully. Submitted FSSAI credentials are queued for Admin verification.',
      fssaiStatus: cleanFssai ? 'PENDING' : 'NOT_SUBMITTED'
    });
  } catch (err) {
    next(err);
  }
};

// 9. GET PUBLIC DONOR PROFILE (FOR NGO & PLATFORM TRUST CARDS)
const getPublicDonorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    let donor = null;
    let user = null;

    if (db.isConnected) {
      const [dRows] = await db.query(
        `SELECT d.*, u.name as user_name, u.email, u.phone, u.is_verified as user_is_verified
         FROM donors d 
         JOIN users u ON d.user_id = u.id 
         WHERE d.id = ? OR d.user_id = ?`,
        [id, id]
      );
      if (dRows.length > 0) {
        donor = dRows[0];
        user = {
          id: donor.user_id,
          name: donor.user_name,
          email: donor.email,
          phone: donor.phone,
          is_verified: donor.user_is_verified
        };
      }
    } else {
      donor = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(id) || Number(d.user_id) === Number(id));
      if (donor) {
        user = (db.memoryStore.users || []).find(u => Number(u.id) === Number(donor.user_id)) || {};
      }
    }

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor profile not found.' });
    }

    const isOverallVerified = Boolean(donor.is_verified || user?.is_verified);
    const isFssaiVer = Boolean(donor.is_fssai_verified);
    const isBizVer = Boolean(donor.is_business_verified || (isOverallVerified && isFssaiVer));
    const isLocVer = Boolean(donor.is_location_verified || isOverallVerified);
    const isPhVer = Boolean(donor.is_phone_verified || isOverallVerified);

    let fssaiStatus = donor.fssai_status;
    if (!fssaiStatus || fssaiStatus === 'NOT_SUBMITTED') {
      fssaiStatus = isFssaiVer ? 'VERIFIED' : (donor.fssai_number ? 'PENDING' : 'NOT_SUBMITTED');
    }

    return res.json({
      success: true,
      donor: {
        id: donor.id,
        businessName: donor.business_name || user?.name || 'Food Donor',
        contactPerson: donor.contact_person || user?.name || 'Authorized Person',
        phone: user?.phone || '',
        email: user?.email || '',
        address: donor.address || '',
        city: donor.city || '',
        state: donor.state || '',
        pincode: donor.pincode || '',
        businessType: donor.business_type || 'Hotel',
        fssaiNumber: donor.fssai_number || 'NOT PROVIDED',
        fssaiStatus: fssaiStatus,
        isVerified: isOverallVerified,
        isFssaiVerified: isFssaiVer,
        isBusinessVerified: isBizVer,
        isLocationVerified: isLocVer,
        isPhoneVerified: isPhVer,
        latitude: donor.latitude,
        longitude: donor.longitude
      }
    });
  } catch (err) {
    next(err);
  }
};

const getPublicMapMarkers = async (req, res, next) => {
  try {
    let donors = [];
    let ngos = [];
    let biogasPlants = [];
    let activeDonations = [];

    if (db.isConnected) {
      const [dRows] = await db.query(
        `SELECT id, business_name as name, business_type, address, city, latitude as lat, longitude as lng, is_verified 
         FROM donors 
         WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
      );
      donors = dRows;

      const [nRows] = await db.query(
        `SELECT id, organization_name as name, ngo_type, food_capacity, address, city, latitude as lat, longitude as lng, is_verified 
         FROM ngos 
         WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
      );
      ngos = nRows;

      const [bRows] = await db.query(
        `SELECT id, plant_name as name, plant_type, processing_capacity, address, city, latitude as lat, longitude as lng, is_verified 
         FROM biogas_plants 
         WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
      );
      biogasPlants = bRows;

      const [donRows] = await db.query(
        `SELECT id, food_name, food_category, quantity, quantity_unit, latitude as lat, longitude as lng, status, pickup_address 
         FROM donations 
         WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND status IN ('POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT')`
      );
      activeDonations = donRows;
    } else {
      donors = (db.memoryStore.donors || []).map(d => ({
        id: d.id,
        name: d.business_name,
        business_type: d.business_type,
        address: d.address,
        city: d.city,
        lat: d.latitude,
        lng: d.longitude,
        is_verified: d.is_verified
      }));
      ngos = (db.memoryStore.ngos || []).map(n => ({
        id: n.id,
        name: n.organization_name,
        ngo_type: n.ngo_type,
        food_capacity: n.food_capacity,
        address: n.address,
        city: n.city,
        lat: n.latitude,
        lng: n.longitude,
        is_verified: n.is_verified
      }));
      biogasPlants = (db.memoryStore.biogas_plants || []).map(b => ({
        id: b.id,
        name: b.plant_name,
        plant_type: b.plant_type,
        processing_capacity: b.processing_capacity,
        address: b.address,
        city: b.city,
        lat: b.latitude,
        lng: b.longitude,
        is_verified: b.is_verified
      }));
      activeDonations = (db.memoryStore.donations || [])
        .filter(d => ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT'].includes(d.status))
        .map(d => ({
          id: d.id,
          food_name: d.food_name,
          food_category: d.food_category,
          quantity: d.quantity,
          quantity_unit: d.quantity_unit,
          lat: d.latitude,
          lng: d.longitude,
          status: d.status,
          pickup_address: d.pickup_address
        }));
    }

    const formatMarker = (item, type) => {
      const lat = parseFloat(item.lat || item.latitude);
      const lng = parseFloat(item.lng || item.longitude);
      const hasValid = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      return {
        ...item,
        type,
        lat: hasValid ? lat : null,
        lng: hasValid ? lng : null,
        hasValidLocation: hasValid
      };
    };

    return res.json({
      success: true,
      markers: {
        donors: donors.map(d => formatMarker(d, 'DONOR')),
        ngos: ngos.map(n => formatMarker(n, 'NGO')),
        biogasPlants: biogasPlants.map(b => formatMarker(b, 'BIOGAS')),
        activeDonations: activeDonations.map(don => formatMarker(don, 'DONATION'))
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 12. RATE DONOR / TRUST SCORE RATING (NGO & BIOGAS)
// ==========================================
const rateDonor = async (req, res, next) => {
  try {
    const user = req.user;
    const donationId = Number(req.params.id || req.body.donation_id);
    const {
      rating_points = 5.0,
      food_quality_score,
      packaging_score,
      timeliness_score,
      complaint_category = null,
      complaint_text = null
    } = req.body;

    const points = Math.min(5, Math.max(1, parseFloat(rating_points) || 5.0));
    const qualityScore = food_quality_score ? Math.min(5, Math.max(1, parseFloat(food_quality_score))) : points;
    const packagingScore = packaging_score ? Math.min(5, Math.max(1, parseFloat(packaging_score))) : points;
    const timelinessScore = timeliness_score ? Math.min(5, Math.max(1, parseFloat(timeliness_score))) : points;

    let donation = null;
    let donor = null;
    let reviewerName = user.name || (user.role === 'BIOGAS' ? 'Biogas Clean Energy Plant' : 'Shelter Partner NGO');
    let reviewerId = user.id;

    if (db.isConnected) {
      const [dRows] = await db.query('SELECT * FROM donations WHERE id = ?', [donationId]);
      if (!dRows.length) return res.status(404).json({ success: false, message: 'Donation record not found' });
      donation = dRows[0];

      const [donorRows] = await db.query('SELECT * FROM donors WHERE id = ?', [donation.donor_id]);
      if (!donorRows.length) return res.status(404).json({ success: false, message: 'Donor record not found' });
      donor = donorRows[0];

      // Check reviewer organization name
      if (user.role === 'NGO') {
        const [nRows] = await db.query('SELECT id, organization_name FROM ngos WHERE user_id = ?', [user.userId]);
        if (nRows.length) {
          reviewerId = nRows[0].id;
          reviewerName = nRows[0].organization_name || reviewerName;
        }
      } else if (user.role === 'BIOGAS') {
        const [bRows] = await db.query('SELECT id, plant_name FROM biogas_plants WHERE user_id = ?', [user.userId]);
        if (bRows.length) {
          reviewerId = bRows[0].id;
          reviewerName = bRows[0].plant_name || reviewerName;
        }
      }

      const hasComplaint = Boolean((complaint_text && complaint_text.trim().length > 0) || points <= 2.5);

      // Insert review record
      await db.query(
        `INSERT INTO donor_reviews 
         (donor_id, reviewer_type, reviewer_id, reviewer_name, donation_id, rating_points, food_quality_score, packaging_score, timeliness_score, complaint_category, complaint_text, has_complaint, admin_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')`,
        [
          donor.id,
          user.role || 'NGO',
          reviewerId,
          reviewerName,
          donationId,
          points,
          qualityScore,
          packagingScore,
          timelinessScore,
          complaint_category || (hasComplaint ? 'General Operational Feedback' : null),
          complaint_text ? complaint_text.trim() : null,
          hasComplaint
        ]
      );

      // Recalculate average trust score and trust points for donor
      const [allReviews] = await db.query('SELECT rating_points FROM donor_reviews WHERE donor_id = ?', [donor.id]);
      const totalReviews = allReviews.length;
      const sumPoints = allReviews.reduce((acc, r) => acc + parseFloat(r.rating_points || 5), 0);
      const avgScore = totalReviews > 0 ? parseFloat((sumPoints / totalReviews).toFixed(2)) : 5.00;
      const trustPoints = Math.round(avgScore * 20);

      let trustLevel = 'TOP_RATED';
      if (avgScore >= 4.5) trustLevel = 'TOP_RATED';
      else if (avgScore >= 3.8) trustLevel = 'GOOD_STANDING';
      else if (avgScore >= 3.0) trustLevel = 'STANDARD';
      else trustLevel = 'UNDER_REVIEW';

      await db.query(
        'UPDATE donors SET trust_score = ?, trust_points = ?, total_reviews_count = ?, trust_level = ? WHERE id = ?',
        [avgScore, trustPoints, totalReviews, trustLevel, donor.id]
      );

      // If complaint or low rating, route confidential alert to Admin Portal
      if (hasComplaint) {
        const adminMsg = `[CONFIDENTIAL COMPLAINT] ${reviewerName} (${user.role}) rated ${points}/5 stars on Donation #${donationId} (${donation.food_name || 'Food'}): "${complaint_text ? complaint_text.trim() : 'Low trust rating submitted without comment.'}"`;
        
        // Broadcast to Admin Notifications
        await db.query(
          `INSERT INTO admin_notifications 
           (sender_id, sender_name, recipient_type, recipient_name, title, message, category, priority, status) 
           VALUES (?, ?, 'ADMIN', 'Platform Administrator', ?, ?, 'Donor Trust Complaint', 'High', 'SENT')`,
          [
            user.userId,
            reviewerName,
            `🚨 Donor Quality Complaint: ${donor.organization_name || donor.name || 'Hotel'}`,
            adminMsg
          ]
        );

        // Record in audit log
        await db.query(
          `INSERT INTO audit_logs 
           (admin_name, action, target_type, target_id, target_name, reason, previous_status, new_status) 
           VALUES (?, 'DONOR_COMPLAINT_FILED', 'DONOR', ?, ?, ?, 'NORMAL', 'COMPLAINT_PENDING')`,
          [
            reviewerName,
            donor.id,
            donor.organization_name || donor.name || 'Hotel',
            complaint_text ? complaint_text.trim() : `Low rating ${points}/5 received from ${reviewerName}`
          ]
        );

        // Generic notification for admin
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, is_read) 
           VALUES (1, 'ADMIN_ALERT', ?, ?, false)`,
          [
            `🚨 Donor Complaint: ${donor.organization_name || donor.name || 'Hotel'} (Donation #${donationId})`,
            adminMsg
          ]
        );
      }

      return res.json({
        success: true,
        message: 'Trust score rating saved! Any complaints have been routed confidentially to Platform Administration.',
        trustScore: avgScore,
        trustPoints,
        totalReviews,
        trustLevel
      });
    } else {
      donation = (db.memoryStore.donations || []).find(d => Number(d.id) === donationId);
      if (!donation) return res.status(404).json({ success: false, message: 'Donation record not found' });

      donor = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(donation.donor_id));
      if (!donor) return res.status(404).json({ success: false, message: 'Donor record not found' });

      const hasComplaint = Boolean((complaint_text && complaint_text.trim().length > 0) || points <= 2.5);

      db.memoryStore.donor_reviews = db.memoryStore.donor_reviews || [];
      db.memoryStore.donor_reviews.push({
        id: db.memoryStore.donor_reviews.length + 1,
        donor_id: donor.id,
        reviewer_type: user.role || 'NGO',
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        donation_id: donationId,
        rating_points: points,
        food_quality_score: qualityScore,
        packaging_score: packagingScore,
        timeliness_score: timelinessScore,
        complaint_category: complaint_category || null,
        complaint_text: complaint_text ? complaint_text.trim() : null,
        has_complaint: hasComplaint,
        admin_status: 'NEW',
        created_at: new Date().toISOString()
      });

      const donorReviews = db.memoryStore.donor_reviews.filter(r => Number(r.donor_id) === Number(donor.id));
      const totalReviews = donorReviews.length;
      const sumPoints = donorReviews.reduce((acc, r) => acc + parseFloat(r.rating_points || 5), 0);
      const avgScore = parseFloat((sumPoints / totalReviews).toFixed(2));
      const trustPoints = Math.round(avgScore * 20);

      donor.trust_score = avgScore;
      donor.trust_points = trustPoints;
      donor.total_reviews_count = totalReviews;
      donor.trust_level = avgScore >= 4.5 ? 'TOP_RATED' : (avgScore >= 3.8 ? 'GOOD_STANDING' : 'STANDARD');

      return res.json({
        success: true,
        message: 'Trust score rating saved! Any complaints have been routed confidentially to Platform Administration.',
        trustScore: avgScore,
        trustPoints,
        totalReviews,
        trustLevel: donor.trust_level
      });
    }
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 13. GET DONOR TRUST SCORE (DONOR / PUBLIC VIEW)
// (CONFIDENTIAL: Complaints & comments are NEVER returned to donor)
// ==========================================
const getDonorTrustScore = async (req, res, next) => {
  try {
    let donorId = req.params.id ? Number(req.params.id) : null;
    const userId = req.user ? req.user.userId : null;

    if (!donorId && userId) {
      if (db.isConnected) {
        const [dRows] = await db.query('SELECT id FROM donors WHERE user_id = ?', [userId]);
        if (dRows.length) donorId = dRows[0].id;
      } else {
        const d = (db.memoryStore.donors || []).find(dn => Number(dn.user_id) === Number(userId));
        if (d) donorId = d.id;
      }
    }

    if (!donorId) donorId = 1;

    let donor = null;
    let reviews = [];

    if (db.isConnected) {
      const [dRows] = await db.query('SELECT id, user_id, COALESCE(business_name, organization_name, name, \'Hotel\') as business_name, contact_person, trust_score, trust_points, total_reviews_count, trust_level FROM donors WHERE id = ?', [donorId]);
      donor = dRows[0] || {};
      const [rRows] = await db.query('SELECT rating_points, food_quality_score, packaging_score, timeliness_score FROM donor_reviews WHERE donor_id = ?', [donorId]);
      reviews = rRows || [];
    } else {
      donor = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(donorId)) || {};
      reviews = (db.memoryStore.donor_reviews || []).filter(r => Number(r.donor_id) === Number(donorId));
    }

    const totalReviews = reviews.length;
    const sumTotal = reviews.reduce((acc, r) => acc + parseFloat(r.rating_points || 5), 0);
    const sumQuality = reviews.reduce((acc, r) => acc + parseFloat(r.food_quality_score || 5), 0);
    const sumPackaging = reviews.reduce((acc, r) => acc + parseFloat(r.packaging_score || 5), 0);
    const sumTimeliness = reviews.reduce((acc, r) => acc + parseFloat(r.timeliness_score || 5), 0);

    const trustScore = totalReviews > 0 ? parseFloat((sumTotal / totalReviews).toFixed(1)) : 5.0;
    const trustPoints = Math.round(trustScore * 20);

    return res.json({
      success: true,
      trustScore,
      trustPoints,
      totalReviews,
      trustLevel: donor.trust_level || (trustScore >= 4.5 ? 'TOP_RATED' : 'GOOD_STANDING'),
      breakdown: {
        foodQuality: totalReviews > 0 ? parseFloat((sumQuality / totalReviews).toFixed(1)) : 5.0,
        packaging: totalReviews > 0 ? parseFloat((sumPackaging / totalReviews).toFixed(1)) : 5.0,
        timeliness: totalReviews > 0 ? parseFloat((sumTimeliness / totalReviews).toFixed(1)) : 5.0
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDonation,
  getMyDonations,
  getDonationById,
  cancelDonation,
  getDashboardSummary,
  getDonorAnalytics,
  updateDonationStatus,
  getDonorProfile,
  updateDonorProfile,
  getPublicDonorProfile,
  getPublicMapMarkers,
  rateDonor,
  getDonorTrustScore,
  CATEGORY_DEFAULT_HOURS,
  calculateSafeUntil
};
