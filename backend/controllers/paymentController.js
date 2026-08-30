const paymentService = require('../services/paymentService');
const db = require('../database/databaseConnection');
const notificationService = require('../services/notificationService');

const createCheckout = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { amount, plan_name } = req.body;

    const payment = await paymentService.createPayment({
      userId,
      amount: parseFloat(amount || 499),
      currency: 'INR',
      planName: plan_name || 'PRO_MONTHLY'
    });

    return res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { paymentId, transactionId, status, plan_name } = req.body;

    const verification = await paymentService.verifyPayment({
      paymentId,
      transactionId,
      status: status || 'SUCCESS'
    });

    if (!verification.success) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    const plan = plan_name || 'PRO_MONTHLY';
    const isYearly = plan === 'PRO_YEARLY';
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (isYearly ? 365 : 30) * 24 * 3600 * 1000);

    // Activate Pro Subscription
    if (db.isConnected) {
      await db.query(
        'INSERT INTO subscriptions (user_id, plan_name, amount, status, start_date, end_date) VALUES (?, ?, ?, "ACTIVE", ?, ?) ON DUPLICATE KEY UPDATE plan_name = ?, status = "ACTIVE", start_date = ?, end_date = ?',
        [userId, plan, isYearly ? 4999 : 499, startDate, endDate, plan, startDate, endDate]
      );
    } else {
      let sub = db.memoryStore.subscriptions.find(s => Number(s.user_id) === Number(userId));
      if (sub) {
        sub.plan_name = plan;
        sub.status = 'ACTIVE';
        sub.start_date = startDate.toISOString();
        sub.end_date = endDate.toISOString();
      } else {
        db.memoryStore.subscriptions.push({
          id: db.memoryStore.subscriptions.length + 1,
          user_id: userId,
          plan_name: plan,
          amount: isYearly ? 4999 : 499,
          status: 'ACTIVE',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    // Trigger Notification
    notificationService.createNotification({
      userId,
      type: 'IN_APP',
      title: 'Subscription Activated 🎉',
      message: `Your ${plan.replace('_', ' ')} plan has been successfully activated via Stitch Payment!`
    }, req.app.get('io'));

    return res.json({
      success: true,
      message: 'Payment verified and Pro Subscription activated!',
      subscription: {
        plan_name: plan,
        status: 'ACTIVE',
        startDate,
        endDate
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCheckout,
  verifyPayment
};
