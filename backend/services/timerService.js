const db = require('../database/databaseConnection');
const notificationService = require('./notificationService');
const { calculateDistance } = require('./matchingService');

const CATEGORY_DEFAULT_HOURS = {
  'Cooked gravy-based food': 2,
  'Cooked dry food': 4,
  'Fresh-cut fruits/vegetables': 3,
  'Packaged/sealed food': 24,
  'Bakery items': 8
};

let timerInterval = null;
const warnedDonations = new Set(); // Prevent duplicate 30m warning alerts
const redirectedDonations = new Set(); // Prevent duplicate redirection executions

/**
 * Finds the nearest suitable verified Biogas Plant with sufficient capacity
 */
async function findNearestBiogasPlant(donorLat, donorLng, quantity) {
  let plantsList = [];

  if (db.isConnected) {
    const [rows] = await db.query('SELECT * FROM biogas_plants WHERE is_verified = TRUE AND is_available = TRUE');
    plantsList = rows;
  } else {
    plantsList = (db.memoryStore.biogas_plants || []).filter(p => p.is_verified && p.is_available);
  }

  if (plantsList.length === 0) {
    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM biogas_plants WHERE is_verified = TRUE');
      plantsList = rows;
    } else {
      plantsList = (db.memoryStore.biogas_plants || []).filter(p => p.is_verified);
    }
  }

  if (plantsList.length === 0) {
    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM biogas_plants');
      plantsList = rows;
    } else {
      plantsList = db.memoryStore.biogas_plants || [];
    }
  }

  if (plantsList.length === 0) {
    return null;
  }

  let suitablePlants = plantsList.filter(plant => {
    const cap = parseFloat(plant.processing_capacity || plant.feedstock_capacity_daily || 0);
    const hasValidCoords = !isNaN(parseFloat(plant.latitude)) && !isNaN(parseFloat(plant.longitude));
    return (cap >= parseFloat(quantity) || cap === 0) && hasValidCoords;
  });

  if (suitablePlants.length === 0) {
    suitablePlants = plantsList;
  }

  // Rank by Haversine distance
  suitablePlants.sort((a, b) => {
    const latA = parseFloat(a.latitude) || donorLat || 0;
    const lngA = parseFloat(a.longitude) || donorLng || 0;
    const latB = parseFloat(b.latitude) || donorLat || 0;
    const lngB = parseFloat(b.longitude) || donorLng || 0;
    const distA = calculateDistance(donorLat, donorLng, latA, lngA);
    const distB = calculateDistance(donorLat, donorLng, latB, lngB);
    return distA - distB;
  });

  const nearest = suitablePlants[0];
  const nLat = parseFloat(nearest.latitude) || donorLat || 0;
  const nLng = parseFloat(nearest.longitude) || donorLng || 0;
  const distanceKm = calculateDistance(donorLat, donorLng, nLat, nLng);

  return {
    plant: nearest,
    distanceKm
  };
}

/**
 * Expiration Handler: Transitions status to EXPIRED -> Redirects to Nearest Biogas Plant
 */
async function handleExpiredDonation(donation, io = null) {
  if (redirectedDonations.has(donation.id)) return;
  redirectedDonations.add(donation.id);

  console.log(`⏰ Donation #${donation.id} ("${donation.food_name}") expired without collection. Initiating Biogas Redirection...`);

  // Update status to EXPIRED first
  if (db.isConnected) {
    await db.query("UPDATE donations SET status = 'EXPIRED' WHERE id = ?", [donation.id]);
  } else {
    donation.status = 'EXPIRED';
  }

  const donorLat = (!isNaN(parseFloat(donation.latitude))) ? parseFloat(donation.latitude) : 0;
  const donorLng = (!isNaN(parseFloat(donation.longitude))) ? parseFloat(donation.longitude) : 0;
  const quantity = parseFloat(donation.quantity || 0);

  const nearestResult = await findNearestBiogasPlant(donorLat, donorLng, quantity);

  if (!nearestResult) {
    console.warn(`⚠️ No suitable biogas plant is currently available for expired donation #${donation.id}. Status remains EXPIRED.`);
    return;
  }

  const { plant, distanceKm } = nearestResult;

  // Insert or update biogas_matches record & set status REDIRECTED_TO_BIOGAS
  if (db.isConnected) {
    const [existingRows] = await db.query('SELECT id FROM biogas_matches WHERE donation_id = ?', [donation.id]);
    if (existingRows.length > 0) {
      await db.query(
        "UPDATE biogas_matches SET biogas_plant_id = ?, distance = ?, match_score = 90.00, match_status = 'OFFERED', updated_at = NOW() WHERE id = ?",
        [plant.id, distanceKm, existingRows[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO biogas_matches (donation_id, biogas_plant_id, distance, match_score, match_status) VALUES (?, ?, ?, 90.00, 'OFFERED')",
        [donation.id, plant.id, distanceKm]
      );
    }
    await db.query("UPDATE donations SET status = 'REDIRECTED_TO_BIOGAS', updated_at = NOW() WHERE id = ?", [donation.id]);
    await db.query("UPDATE donation_matches SET match_status = 'EXPIRED', updated_at = NOW() WHERE donation_id = ? AND match_status IN ('OFFERED', 'PENDING')", [donation.id]);
  } else {
    db.memoryStore.biogas_matches = db.memoryStore.biogas_matches || [];
    const existing = db.memoryStore.biogas_matches.find(m => Number(m.donation_id) === Number(donation.id));
    if (existing) {
      existing.biogas_plant_id = plant.id;
      existing.distance = distanceKm;
      existing.match_status = 'OFFERED';
    } else {
      db.memoryStore.biogas_matches.push({
        id: db.memoryStore.biogas_matches.length + 1,
        donation_id: donation.id,
        biogas_plant_id: plant.id,
        distance: distanceKm,
        match_score: 90.00,
        match_status: 'OFFERED',
        created_at: new Date().toISOString()
      });
    }
    donation.status = 'REDIRECTED_TO_BIOGAS';
    (db.memoryStore.donation_matches || []).forEach(m => {
      if (Number(m.donation_id) === Number(donation.id) && ['OFFERED', 'PENDING'].includes(m.match_status)) {
        m.match_status = 'EXPIRED';
      }
    });
  }

  // Resolve donor user ID for notification
  let donorUserId = null;
  if (db.isConnected) {
    const [dRows] = await db.query('SELECT user_id FROM donors WHERE id = ?', [donation.donor_id]);
    if (dRows.length > 0) donorUserId = dRows[0].user_id;
  } else {
    const dObj = (db.memoryStore.donors || []).find(d => Number(d.id) === Number(donation.donor_id));
    if (dObj) donorUserId = dObj.user_id;
  }

  // Trigger Notifications (Part 10)
  if (donorUserId) {
    await notificationService.createNotification({
      userId: donorUserId,
      donationId: donation.id,
      type: 'IN_APP',
      title: 'Food Redirected to Biogas',
      message: `Food donation #${donation.id} has been redirected to ${plant.plant_name} because the safe collection window expired.`
    }, io);
  }

  if (plant && plant.user_id) {
    await notificationService.createNotification({
      userId: plant.user_id,
      donationId: donation.id,
      type: 'IN_APP',
      title: 'New Food Waste Request ⚡',
      message: `Food donation #${donation.id} (${donation.quantity} ${donation.quantity_unit || 'Kg'}) has been redirected to your biogas facility.`
    }, io);
  }

  // Emit Socket.IO Events (Part 9)
  if (io) {
    if (typeof io.to === 'function') {
      io.to(`donation_${donation.id}`).emit('donationExpired', { donationId: donation.id });
      io.to(`donation_${donation.id}`).emit('biogasRedirected', { donationId: donation.id, plantName: plant.plant_name });
    }
    if (typeof io.emit === 'function') {
      io.emit('donation_status_updated', { donationId: donation.id, status: 'REDIRECTED_TO_BIOGAS' });
      io.emit('biogas_dashboard_update', { donationId: donation.id, plantId: plant.id });
    }
  }
}

function parseSafeUntilMs(safeUntil) {
  if (!safeUntil) return null;
  if (safeUntil instanceof Date) return isNaN(safeUntil.getTime()) ? null : safeUntil.getTime();
  if (typeof safeUntil === 'number') return isNaN(safeUntil) ? null : safeUntil;
  if (typeof safeUntil === 'string') {
    const trimmed = safeUntil.trim();
    if (!trimmed) return null;
    const formatted = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
    const ms = new Date(formatted).getTime();
    if (!isNaN(ms)) return ms;
  }
  return null;
}

/**
 * Checks all active food donations for 30-min warning & expiration
 */
async function checkTimer(io = null) {
  try {
    let activeDonations = [];

    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT * FROM donations WHERE status IN ('POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'EXPIRED')`
      );
      activeDonations = rows;
    } else {
      activeDonations = (db.memoryStore.donations || []).filter(d => 
        ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'EXPIRED'].includes(d.status)
      );
    }

    const now = Date.now();

    for (const donation of activeDonations) {
      const safeUntilMs = parseSafeUntilMs(donation.safe_until);
      const isPastSafeUntil = safeUntilMs !== null && safeUntilMs <= now;
      const isExpiredStatus = donation.status === 'EXPIRED';

      if (isPastSafeUntil || isExpiredStatus) {
        await handleExpiredDonation(donation, io);
      } else if (safeUntilMs !== null) {
        const remainingMs = safeUntilMs - now;
        if (remainingMs > 0 && remainingMs < 30 * 60 * 1000 && !warnedDonations.has(donation.id)) {
          warnedDonations.add(donation.id);
          const minsLeft = Math.max(1, Math.round(remainingMs / 60000));
          console.log(`⚠️ Timer Warning: Donation #${donation.id} has ${minsLeft} mins remaining.`);
          await notificationService.createNotification({
            userId: donation.donor_id,
            donationId: donation.id,
            type: 'SMS',
            title: 'Food Timer Warning',
            message: `SmartSurplus Alert: Your food donation #${donation.id} has ${minsLeft} minutes remaining for safe collection.`
          }, io);
        }
      }
    }
  } catch (err) {
    console.error('Error in checkTimer monitor:', err.message);
  }
}

function startTimer(io = null) {
  if (!timerInterval) {
    console.log('⏱️ Food Safety Timer Service initialized (Checking active listings every 30s)');
    timerInterval = setInterval(() => checkTimer(io), 30000);
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

module.exports = {
  CATEGORY_DEFAULT_HOURS,
  findNearestBiogasPlant,
  handleExpiredDonation,
  checkTimer,
  startTimer,
  stopTimer
};
