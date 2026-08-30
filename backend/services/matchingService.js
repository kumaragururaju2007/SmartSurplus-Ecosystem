const db = require('../database/databaseConnection');

// ==================================================
// SMART MATCHING ENGINE WEIGHT CONSTANTS
// ==================================================
const DISTANCE_WEIGHT = 0.25;
const CAPACITY_WEIGHT = 0.20;
const URGENCY_WEIGHT = 0.25;
const AVAILABILITY_WEIGHT = 0.15;
const RESPONSE_WEIGHT = 0.15;

/**
 * Haversine Distance Formula in Kilometers
 */
function calculateDistance(donorLat, donorLng, ngoLat, ngoLng) {
  const R = 6371; // Earth radius in km
  const dLat = (ngoLat - donorLat) * (Math.PI / 180);
  const dLon = (ngoLng - donorLng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(donorLat * (Math.PI / 180)) * Math.cos(ngoLat * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 100) / 100;
}

/**
 * Distance Score (0 to 100)
 */
function getDistanceScore(distanceKm) {
  if (distanceKm <= 2) return 100;
  if (distanceKm <= 5) return 80;
  if (distanceKm <= 10) return 60;
  if (distanceKm <= 20) return 40;
  if (distanceKm <= 30) return 20;
  return 0;
}

/**
 * Urgency Score based on safe_until remaining time (0 to 100)
 */
function getUrgencyScore(safeUntilStr) {
  const safeUntilDate = new Date(safeUntilStr);
  const remainingMinutes = (safeUntilDate.getTime() - Date.now()) / (1000 * 60);

  if (remainingMinutes < 30) return 100;
  if (remainingMinutes <= 60) return 80;
  if (remainingMinutes <= 120) return 60;
  return 40;
}

const path = require('path');
const { execFile } = require('child_process');

/**
 * Executes Python AI Matching Service ML Model script if available
 */
function runPythonAIService(donation, ngos) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'python_matching_service.py');
    const inputData = JSON.stringify({ donation, ngos });

    const pyProcess = execFile('py', [scriptPath], { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        console.warn('⚠️ Python AI service notice (falling back to JS engine):', error.message);
        return resolve(null);
      }
      try {
        const result = JSON.parse(stdout);
        if (result && result.success) {
          return resolve(result);
        }
      } catch (err) {
        console.warn('⚠️ Python AI output parsing notice:', err.message);
      }
      return resolve(null);
    });

    if (pyProcess.stdin) {
      pyProcess.stdin.write(inputData);
      pyProcess.stdin.end();
    }
  });
}

/**
 * Main Rule-Based AI / Smart Matching Engine Function
 */
async function matchNGO(donationId) {
  try {
    let donation = null;
    let ngosList = [];

    if (db.isConnected) {
      const [dRows] = await db.query('SELECT * FROM donations WHERE id = ?', [donationId]);
      if (dRows.length === 0) return { success: false, message: 'Donation not found.' };
      donation = dRows[0];

      const [nRows] = await db.query('SELECT * FROM ngos');
      ngosList = nRows;
    } else {
      donation = db.memoryStore.donations.find(d => Number(d.id) === Number(donationId));
      if (!donation) return { success: false, message: 'Donation not found.' };
      ngosList = db.memoryStore.ngos;
    }

    const donorLat = (!isNaN(parseFloat(donation.latitude))) ? parseFloat(donation.latitude) : 0;
    const donorLng = (!isNaN(parseFloat(donation.longitude))) ? parseFloat(donation.longitude) : 0;
    const donationQty = parseFloat(donation.quantity || 0);

    // 1. Suitability & Verification Eligibility Filter (Part 24: Only Verified + Active NGOs)
    let candidateNGOs = ngosList.filter(ngo => {
      const isVerified = ngo.is_verified === 1 || ngo.is_verified === true || ngo.verification_status === 'VERIFIED';
      const isAvailable = ngo.is_available !== 0 && ngo.is_available !== false;
      const capacity = parseFloat(ngo.food_capacity || 0);
      const hasValidCoords = !isNaN(parseFloat(ngo.latitude)) && !isNaN(parseFloat(ngo.longitude));

      return isVerified && isAvailable && (capacity === 0 || capacity >= donationQty) && hasValidCoords;
    });

    if (candidateNGOs.length === 0) {
      // Fallback only to verified & active registered NGOs
      candidateNGOs = ngosList.filter(ngo => {
        const isVerified = ngo.is_verified === 1 || ngo.is_verified === true || ngo.verification_status === 'VERIFIED';
        const isAvailable = ngo.is_available !== 0 && ngo.is_available !== false;
        return isVerified && isAvailable;
      });
    }

    if (candidateNGOs.length === 0) {
      return {
        success: false,
        message: 'No verified and available NGO is currently eligible for matching.',
        donationId: donation.id,
        donationStatus: donation.status
      };
    }

    // Attempt Python AI Microservice / ML Model
    const pythonResult = await runPythonAIService(donation, candidateNGOs);
    let bestMatch = null;
    let scoredNGOs = [];

    if (pythonResult && pythonResult.match) {
      bestMatch = {
        ngo: pythonResult.match.bestNGO,
        totalScore: pythonResult.match.score,
        distanceKm: pythonResult.match.distance,
        breakdown: {
          capacityScore: pythonResult.match.capacityScore,
          urgencyScore: pythonResult.match.urgencyScore,
          availabilityScore: pythonResult.match.availabilityScore,
          responseScore: pythonResult.match.responseScore
        },
        explanation: pythonResult.match.explanation
      };
      scoredNGOs = pythonResult.allCandidates || [];
    } else {
      // Fallback JS Scoring Engine
      scoredNGOs = candidateNGOs.map(ngo => {
        const ngoLat = (!isNaN(parseFloat(ngo.latitude))) ? parseFloat(ngo.latitude) : donorLat;
        const ngoLng = (!isNaN(parseFloat(ngo.longitude))) ? parseFloat(ngo.longitude) : donorLng;
        const distanceKm = (ngoLat && ngoLng && donorLat && donorLng) ? calculateDistance(donorLat, donorLng, ngoLat, ngoLng) : 1.0;

        const distanceScore = getDistanceScore(distanceKm);
        const capacityVal = parseFloat(ngo.food_capacity || 0);
        const capacityRatio = (capacityVal > 0 && donationQty > 0) ? (capacityVal / donationQty) : 1;
        const capacityScore = Math.min(100, Math.round(capacityRatio >= 1 ? 100 : capacityRatio * 80));
        const urgencyScore = getUrgencyScore(donation.safe_until);
        const availabilityScore = (ngo.is_available !== 0 && ngo.is_available !== false) ? 100 : 50;
        const responseScore = ngo.response_rate ? parseFloat(ngo.response_rate) : 90;

        const totalScore = Math.round(
          (distanceScore * DISTANCE_WEIGHT) +
          (capacityScore * CAPACITY_WEIGHT) +
          (urgencyScore * URGENCY_WEIGHT) +
          (availabilityScore * AVAILABILITY_WEIGHT) +
          (responseScore * RESPONSE_WEIGHT)
        );

        const explanation = [
          `✓ ${distanceKm} km distance away`,
          `✓ Food capacity suitable (${capacityVal || 'Flexible'} ${donation.quantity_unit || 'Meals'})`,
          `✓ Currently available & active shelter`,
          `✓ Verified response record (${responseScore}%)`,
          urgencyScore >= 80 ? `⚡ High food urgency handled` : `✓ Safe window clear`
        ];

        return {
          ngo,
          totalScore,
          distanceKm,
          breakdown: {
            distanceScore,
            capacityScore,
            urgencyScore,
            availabilityScore,
            responseScore
          },
          explanation
        };
      });

      scoredNGOs.sort((a, b) => b.totalScore - a.totalScore);
      bestMatch = scoredNGOs[0];
    }

    // If donation is already accepted or in active progress, preserve status and do not re-offer
    if (['ACCEPTED', 'PICKUP_STARTED', 'COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(donation.status)) {
      return {
        success: true,
        message: 'Donation has already been accepted or progressed.',
        donationId: donation.id,
        donationStatus: donation.status
      };
    }

    // 4. Save Match Record & Keep Donation Status POSTED until NGO accepts offer
    if (db.isConnected) {
      const [existingMatches] = await db.query(
        'SELECT id, match_status FROM donation_matches WHERE donation_id = ? AND ngo_id = ?',
        [donation.id, bestMatch.ngo.id]
      );
      if (existingMatches.length === 0) {
        await db.query(
          'INSERT INTO donation_matches (donation_id, ngo_id, match_score, match_status) VALUES (?, ?, ?, \'OFFERED\')',
          [donation.id, bestMatch.ngo.id, bestMatch.totalScore]
        );
      } else if (existingMatches[0].match_status === 'OFFERED' || existingMatches[0].match_status === 'PENDING') {
        await db.query(
          'UPDATE donation_matches SET match_score = ?, match_status = \'OFFERED\', updated_at = NOW() WHERE donation_id = ? AND ngo_id = ? AND match_status IN (\'OFFERED\', \'PENDING\')',
          [bestMatch.totalScore, donation.id, bestMatch.ngo.id]
        );
      }
      if (donation.status === 'POSTED') {
        await db.query('UPDATE donations SET status = \'POSTED\' WHERE id = ?', [donation.id]);
      }
    } else {
      const existingMatch = (db.memoryStore.donation_matches || []).find(m => Number(m.donation_id) === Number(donation.id) && Number(m.ngo_id) === Number(bestMatch.ngo.id));
      if (!existingMatch) {
        db.memoryStore.donation_matches.push({
          id: db.memoryStore.donation_matches.length + 1,
          donation_id: donation.id,
          ngo_id: bestMatch.ngo.id,
          match_score: bestMatch.totalScore,
          match_status: 'OFFERED',
          created_at: new Date().toISOString()
        });
      } else if (existingMatch.match_status === 'OFFERED' || existingMatch.match_status === 'PENDING') {
        existingMatch.match_score = bestMatch.totalScore;
        existingMatch.match_status = 'OFFERED';
      }
      if (donation.status === 'POSTED') donation.status = 'POSTED';
    }

    // 5. Dispatch Real Notification to Matched NGO User
    const notificationService = require('./notificationService');
    if (bestMatch.ngo && bestMatch.ngo.user_id) {
      try {
        await notificationService.createNotification({
          userId: bestMatch.ngo.user_id,
          donationId: donation.id,
          type: 'IN_APP',
          title: 'New Food Surplus Match Request 🍲',
          message: `A new food donation "${donation.food_name}" (${donation.quantity} ${donation.quantity_unit || 'Meals'}) has been matched with your NGO.`,
          category: 'Matching',
          priority: 'Urgent',
          actionRoute: '/ngo/incoming-requests',
          actionLabel: 'View Request'
        });
      } catch (nErr) {
        console.warn('⚠️ Notification creation notice:', nErr.message);
      }
    }

    return {
      success: true,
      engine: pythonResult ? 'Python AI Matching Service' : 'Node.js Smart Engine',
      message: 'Best NGO matched successfully',
      match: {
        donationId: donation.id,
        bestNGO: bestMatch.ngo,
        score: bestMatch.totalScore,
        distance: bestMatch.distanceKm,
        capacityScore: bestMatch.breakdown ? bestMatch.breakdown.capacityScore : 100,
        urgencyScore: bestMatch.breakdown ? bestMatch.breakdown.urgencyScore : 80,
        availabilityScore: bestMatch.breakdown ? bestMatch.breakdown.availabilityScore : 100,
        responseScore: bestMatch.breakdown ? bestMatch.breakdown.responseScore : 90,
        explanation: bestMatch.explanation
      },
      allCandidates: Array.isArray(scoredNGOs) ? scoredNGOs.map(item => ({
        id: item.ngo ? item.ngo.id : item.id,
        name: item.ngo ? item.ngo.organization_name : item.name,
        score: item.totalScore !== undefined ? item.totalScore : item.score,
        distanceKm: item.distanceKm
      })) : []
    };
  } catch (error) {
    console.error('Error in matchingService:', error.message);
    throw error;
  }
}

/**
 * Helper to match any unassigned POSTED donations when a new NGO registers or updates
 */
async function matchPendingDonations() {
  try {
    let postedDonations = [];
    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT id FROM donations 
         WHERE status = 'POSTED' 
           AND id NOT IN (SELECT donation_id FROM donation_matches WHERE match_status IN ('ACCEPTED', 'PICKUP_STARTED', 'COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'))`
      );
      postedDonations = rows;
    } else {
      const claimedDonationIds = (db.memoryStore.donation_matches || [])
        .filter(m => ['ACCEPTED', 'PICKUP_STARTED', 'COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(m.match_status))
        .map(m => Number(m.donation_id));
      postedDonations = (db.memoryStore.donations || []).filter(d => d.status === 'POSTED' && !claimedDonationIds.includes(Number(d.id)));
    }

    for (const don of postedDonations) {
      try {
        await matchNGO(don.id);
      } catch (err) {
        console.warn('Pending donation matching note:', err.message);
      }
    }
  } catch (error) {
    console.error('Error in matchPendingDonations:', error.message);
  }
}

module.exports = {
  DISTANCE_WEIGHT,
  CAPACITY_WEIGHT,
  URGENCY_WEIGHT,
  AVAILABILITY_WEIGHT,
  RESPONSE_WEIGHT,
  calculateDistance,
  getDistanceScore,
  getUrgencyScore,
  matchNGO,
  matchPendingDonations
};
