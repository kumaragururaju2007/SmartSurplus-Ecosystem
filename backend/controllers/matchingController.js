const matchingService = require('../services/matchingService');
const db = require('../database/databaseConnection');

const matchDonation = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    if (!donationId) {
      return res.status(400).json({ success: false, message: 'donationId is required.' });
    }

    // Ownership check for DONOR
    if (role === 'DONOR') {
      let donorId = null;
      let donation = null;

      if (db.isConnected) {
        const [donors] = await db.query('SELECT id FROM donors WHERE user_id = ?', [userId]);
        if (donors.length > 0) donorId = donors[0].id;
        const [rows] = await db.query('SELECT * FROM donations WHERE id = ?', [donationId]);
        donation = rows[0];
      } else {
        const d = db.memoryStore.donors.find(donor => donor.user_id === Number(userId));
        if (d) donorId = d.id;
        donation = db.memoryStore.donations.find(item => Number(item.id) === Number(donationId));
      }

      if (donation && donorId && Number(donation.donor_id) !== Number(donorId)) {
        return res.status(403).json({ success: false, message: 'You do not have permission to access this resource.' });
      }
    }

    const matchResult = await matchingService.matchNGO(donationId);
    return res.json(matchResult);
  } catch (err) {
    next(err);
  }
};

const getMatchingResults = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    let match = null;

    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT m.*, ngo.organization_name, ngo.address as ngo_address, ngo.latitude as ngo_lat, ngo.longitude as ngo_lng 
         FROM donation_matches m 
         JOIN ngos ngo ON m.ngo_id = ngo.id 
         WHERE m.donation_id = ? ORDER BY m.match_score DESC LIMIT 1`,
        [donationId]
      );
      match = rows[0];
    } else {
      match = db.memoryStore.donation_matches.find(m => Number(m.donation_id) === Number(donationId));
    }

    return res.json({ success: true, match });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  matchDonation,
  getMatchingResults
};
