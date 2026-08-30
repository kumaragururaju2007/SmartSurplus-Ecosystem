const db = require('../database/databaseConnection');
const paymentService = require('../services/paymentService');

const PLANS = [
  {
    id: 'FREE',
    name: 'FREE',
    price: 0,
    currency: 'INR',
    period: 'Forever',
    features: [
      'Food Surplus Donation',
      'Basic Smart NGO Matching',
      'Basic OpenStreetMap Tracking',
      'Automatic Biogas Redirection',
      'Basic Impact Dashboard'
    ],
    recommended: false
  },
  {
    id: 'PRO_MONTHLY',
    name: 'PRO MONTHLY',
    price: 499,
    currency: 'INR',
    period: 'per month',
    features: [
      'Everything in FREE Plan',
      'Advanced CSR & ESG Analytics',
      'Printable ESG Impact Reports',
      'Multi-Branch Business Management',
      'Priority NGO Matching Engine',
      'Priority 24/7 Dedicated Support'
    ],
    recommended: false
  },
  {
    id: 'PRO_YEARLY',
    name: 'PRO YEARLY',
    price: 4999,
    currency: 'INR',
    period: 'per year',
    features: [
      'Everything in PRO Monthly',
      'Annual Corporate ESG Certification',
      'Yearly Billing Savings (Save ~16%)',
      'Custom Impact API Integration',
      'Dedicated ESG Account Manager',
      'Priority NGO Matching Engine'
    ],
    recommended: true
  }
];

const getPlans = (req, res) => {
  return res.json({ success: true, plans: PLANS });
};

const getCurrentSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let subscription = null;

    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
      subscription = rows[0];
    } else {
      subscription = db.memoryStore.subscriptions.find(s => Number(s.user_id) === Number(userId));
    }

    if (!subscription) {
      subscription = {
        plan_name: 'FREE',
        price: 0,
        status: 'ACTIVE',
        billing_cycle: 'NONE',
        start_date: new Date().toISOString(),
        end_date: null
      };
    }

    return res.json({ success: true, subscription });
  } catch (err) {
    next(err);
  }
};

const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { plan_name } = req.body;

    const selectedPlan = PLANS.find(p => p.id === plan_name);
    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: 'Invalid subscription plan selected.' });
    }

    if (selectedPlan.id === 'FREE') {
      if (db.isConnected) {
        await db.query('UPDATE subscriptions SET status = "CANCELLED" WHERE user_id = ?', [userId]);
        await db.query('INSERT INTO subscriptions (user_id, plan_name, amount, status) VALUES (?, "FREE", 0.00, "ACTIVE")', [userId]);
      } else {
        db.memoryStore.subscriptions = db.memoryStore.subscriptions.filter(s => Number(s.user_id) !== Number(userId));
        db.memoryStore.subscriptions.push({
          id: db.memoryStore.subscriptions.length + 1,
          user_id: userId,
          plan_name: 'FREE',
          amount: 0.00,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        });
      }
      return res.json({ success: true, message: 'Switched to FREE Plan.', plan: 'FREE' });
    }

    // Pro Monthly or Pro Yearly -> Initiates Payment via Stitch
    const payment = await paymentService.createPayment({
      userId,
      amount: selectedPlan.price,
      currency: 'INR',
      planName: selectedPlan.name
    });

    return res.json({
      success: true,
      message: 'Subscription payment checkout initiated',
      payment,
      plan: selectedPlan
    });
  } catch (err) {
    next(err);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (db.isConnected) {
      await db.query('UPDATE subscriptions SET status = "CANCELLED" WHERE user_id = ?', [userId]);
    } else {
      const s = db.memoryStore.subscriptions.find(item => Number(item.user_id) === Number(userId));
      if (s) s.status = 'CANCELLED';
    }
    return res.json({ success: true, message: 'Subscription cancelled. Reverted to FREE Plan.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  PLANS,
  getPlans,
  getCurrentSubscription,
  createSubscription,
  cancelSubscription
};
