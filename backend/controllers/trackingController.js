const db = require('../database/databaseConnection');
const notificationService = require('../services/notificationService');

const updateStatus = async (req, res, next) => {
  try {
    const { donationId, status } = req.body;
    const allowedStatuses = [
      'POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 
      'COLLECTED', 'DELIVERED', 'EXPIRED', 'REDIRECTED_TO_BIOGAS', 'COMPLETED'
    ];

    if (!donationId || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid donationId or status value' });
    }

    const dId = Number(donationId);

    if (db.isConnected) {
      await db.query('UPDATE donations SET status = ? WHERE id = ?', [status, dId]);
      
      if (['COLLECTED', 'DELIVERED'].includes(status)) {
        const [dRows] = await db.query('SELECT quantity FROM donations WHERE id = ?', [dId]);
        const qty = dRows[0] ? parseFloat(dRows[0].quantity || 10) : 10;
        const srv = Math.round(qty * 2);

        await db.query(
          `INSERT INTO impact_records (donation_id, food_rescued_kg, meals_served, biogas_generated_m3, waste_diverted_kg, co2_saved_kg) 
           VALUES (?, ?, ?, 0, ?, ?) ON DUPLICATE KEY UPDATE food_rescued_kg = ?`,
          [dId, qty, srv, qty, (qty * 2.2).toFixed(2), qty]
        );
      }
    } else {
      const d = (db.memoryStore.donations || []).find(item => Number(item.id) === dId);
      if (d) d.status = status;

      if (['COLLECTED', 'DELIVERED'].includes(status)) {
        const qty = d ? parseFloat(d.quantity || 20) : 20;
        const srv = Math.round(qty * 2);
        (db.memoryStore.impact_records || []).push({
          impact_id: (db.memoryStore.impact_records || []).length + 1,
          donation_id: dId,
          food_rescued_kg: qty,
          meals_served: srv,
          biogas_generated_m3: 0,
          waste_diverted_kg: qty,
          co2_saved_kg: (qty * 2.2).toFixed(2)
        });
      }
    }

    // Broadcast live socket update if attached
    if (req.app.get('io')) {
      req.app.get('io').emit('tracking_updated', { donationId: dId, status });
    }

    notificationService.createNotification({
      userId: 1,
      type: 'TRACKING_UPDATE',
      title: `Status Updated: ${status}`,
      message: `Donation listing #${dId} collection status changed to ${status}.`
    }, req.app.get('io'));

    return res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    next(err);
  }
};

const getTrackingDetails = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const dId = Number(donationId);
    let result = null;

    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT d.*, 
                donor.business_name as donor_name, donor.address as donor_address, donor.latitude as donor_lat, donor.longitude as donor_lng,
                m.match_status,
                ngo.organization_name as ngo_name, ngo.address as ngo_address, ngo.latitude as ngo_lat, ngo.longitude as ngo_lng
         FROM donations d 
         JOIN donors donor ON d.donor_id = donor.id 
         LEFT JOIN donation_matches m ON d.id = m.donation_id AND m.match_status = 'ACCEPTED'
         LEFT JOIN ngos ngo ON m.ngo_id = ngo.id 
         WHERE d.id = ?`,
        [dId]
      );
      result = rows[0];
    } else {
      const donation = (db.memoryStore.donations || []).find(d => Number(d.id) === dId);
      if (donation) {
        const donor = (db.memoryStore.donors || []).find(dr => Number(dr.id) === Number(donation.donor_id)) || {};
        const match = (db.memoryStore.donation_matches || []).find(m => Number(m.donation_id) === dId && m.match_status === 'ACCEPTED');
        const ngo = match ? (db.memoryStore.ngos || []).find(n => Number(n.id) === Number(match.ngo_id)) : null;

        result = {
          ...donation,
          donor_name: donor.business_name || 'Surplus Donor',
          donor_address: donor.address || donation.pickup_address,
          donor_lat: donor.latitude || donation.latitude || 13.0067,
          donor_lng: donor.longitude || donation.longitude || 80.2206,
          match_status: match ? match.match_status : null,
          ngo_name: ngo ? ngo.organization_name : null,
          ngo_address: ngo ? ngo.address : null,
          ngo_lat: ngo ? ngo.latitude : null,
          ngo_lng: ngo ? ngo.longitude : null
        };
      }
    }

    if (!result) {
      return res.status(404).json({ success: false, message: 'Donation tracking details not found' });
    }

    return res.json({ success: true, tracking: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateStatus,
  getTrackingDetails
};
