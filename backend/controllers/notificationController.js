const notificationService = require('../services/notificationService');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const notifications = await notificationService.getNotifications(userId);
    return res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await notificationService.markAsRead(id, userId);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await notificationService.markAllAsRead(userId);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

const sendTestNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const role = user.role || 'USER';
    let title = 'Surplus Platform Notification 🌿';
    let message = 'Your account received a real-time system update.';

    if (role === 'NGO') {
      title = '🍲 New Surplus Food Match Available!';
      message = 'A donor near you just listed 25 kg of fresh meals. Tap to review proximity route and claim.';
    } else if (role === 'DONOR') {
      title = '🚚 NGO Accepted Your Donation!';
      message = 'City Food Relief Shelter accepted your donation listing. Collection team is on the way.';
    } else if (role === 'BIOGAS') {
      title = '⚡ Biogas Redirection Triggered!';
      message = 'Uncollected surplus food (35 kg) is redirected to your biogas plant for clean energy conversion.';
    } else {
      title = '🔔 SmartSurplus Real-Time Alert';
      message = 'Mobile push and real-time popup alerts are active on your device.';
    }

    await notificationService.createNotification({
      userId: user.userId,
      type: 'IN_APP',
      title,
      message
    });

    return res.json({ success: true, message: 'Test mobile notification dispatched!' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendTestNotification
};
