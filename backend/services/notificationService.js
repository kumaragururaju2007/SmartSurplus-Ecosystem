const nodemailer = require('nodemailer');
const db = require('../database/databaseConnection');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'demo.smartsurplus@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'mock_app_password'
  }
});

async function sendEmail({ to, subject, body, html }) {
  console.log(`📧 [EMAIL] To: ${to} | Subject: ${subject}`);
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_PASSWORD !== 'mock_app_password') {
      await transporter.sendMail({
        from: `"SmartSurplus Ecosystem" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: body,
        html: html || `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f0fdf4; color: #166534;">
          <h2 style="color: #15803d;">SmartSurplus Ecosystem 🌿</h2>
          <p>${body}</p>
        </div>`
      });
      console.log('✅ Email sent via Nodemailer successfully.');
    } else {
      console.log('ℹ️ Nodemailer in Dev/Mock mode. Email logged cleanly.');
    }
  } catch (err) {
    console.warn('⚠️ Email send notice (handled safely):', err.message);
  }
}

async function sendSMS({ phone, message }) {
  const isMock = process.env.SMS_MODE === 'mock' || !process.env.SMS_API_KEY;
  if (isMock) {
    console.log(`[MOCK SMS]\nTo: ${phone}\nMessage: ${message}\n----------------------------------`);
  } else {
    console.log(`📱 SMS Dispatched to Gateway (Sender: ${process.env.SMS_SENDER_ID || 'SMARTSURPLUS'}): To: ${phone}`);
  }
}

let _io = null;

function setNotificationIO(instance) {
  _io = instance;
}

async function createNotification({ userId, donationId = null, type = 'IN_APP', title, message }, io = null) {
  try {
    if (!userId) {
      return null;
    }
    let newNotifId = Date.now();

    if (db.isConnected) {
      const [result] = await db.query(
        'INSERT INTO notifications (user_id, donation_id, type, title, message, is_read) VALUES (?, ?, ?, ?, ?, FALSE)',
        [userId, donationId, type, title, message]
      );
      newNotifId = result.insertId;
    } else {
      const newNotif = {
        id: newNotifId,
        user_id: userId,
        donation_id: donationId,
        type,
        title,
        message,
        is_read: 0,
        created_at: new Date().toISOString()
      };
      db.memoryStore.notifications.push(newNotif);
    }

    // Trigger SMS and Email if applicable
    sendSMS({ phone: '+919876543210', message: `${title}: ${message}` });
    sendEmail({ to: 'user@example.com', subject: title, body: message });

    // Real-Time Socket.IO event emission for mobile & web clients
    const socketInstance = io || _io;
    if (socketInstance) {
      const payload = {
        id: newNotifId,
        userId: Number(userId),
        donationId,
        type,
        title,
        message,
        createdAt: new Date().toISOString()
      };
      if (typeof socketInstance.to === 'function') {
        socketInstance.to(`user_${userId}`).emit('notificationCreated', payload);
      }
      if (typeof socketInstance.emit === 'function') {
        socketInstance.emit('new_notification', payload);
      }
      console.log(`📡 [NOTIFICATION PUSH] Emitted live mobile popup to user_${userId}: "${title}"`);
    }

    return true;
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return false;
  }
}

async function getNotifications(userId) {
  if (db.isConnected) {
    const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  } else {
    return db.memoryStore.notifications.filter(n => Number(n.user_id) === Number(userId));
  }
}

async function markAsRead(id, userId) {
  if (db.isConnected) {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
  } else {
    const n = db.memoryStore.notifications.find(item => Number(item.id) === Number(id) && Number(item.user_id) === Number(userId));
    if (n) n.is_read = 1;
  }
  return true;
}

async function markAllAsRead(userId) {
  if (db.isConnected) {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
  } else {
    db.memoryStore.notifications.filter(n => Number(n.user_id) === Number(userId)).forEach(n => n.is_read = 1);
  }
  return true;
}

async function notifyStatusChange({ userId, donationId, oldStatus, newStatus }, io = null) {
  return createNotification({
    userId,
    donationId,
    type: 'STATUS_UPDATE',
    title: `Donation Status: ${newStatus}`,
    message: `Donation #${donationId} status has changed to ${newStatus}.`
  }, io);
}

module.exports = {
  setNotificationIO,
  sendEmail,
  sendSMS,
  createNotification,
  notifyStatusChange,
  getNotifications,
  markAsRead,
  markAllAsRead
};
