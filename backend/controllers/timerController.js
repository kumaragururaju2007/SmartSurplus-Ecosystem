const timerService = require('../services/timerService');
const db = require('../database/databaseConnection');

const getTimerStatus = async (req, res, next) => {
  try {
    let activeDonations = [];
    if (db.isConnected) {
      const [rows] = await db.query(
        "SELECT id, food_name, food_category, status, safe_until FROM donations WHERE status IN ('POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED')"
      );
      activeDonations = rows;
    } else {
      activeDonations = db.memoryStore.donations.filter(d => 
        ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED'].includes(d.status)
      );
    }

    const now = Date.now();
    const timers = activeDonations.map(d => {
      const remainingMs = new Date(d.safe_until).getTime() - now;
      let state = 'ACTIVE';
      if (remainingMs <= 0) state = 'EXPIRED';
      else if (remainingMs < 30 * 60 * 1000) state = 'WARNING';

      return {
        donationId: d.id,
        foodName: d.food_name,
        category: d.food_category,
        status: d.status,
        safeUntil: d.safe_until,
        remainingMinutes: Math.round(remainingMs / 60000),
        timerState: state
      };
    });

    return res.json({
      success: true,
      message: 'Active Food Safety Timers retrieved',
      activeCount: timers.length,
      timers
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTimerStatus
};
