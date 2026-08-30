const db = require('../database/databaseConnection');

async function createPayment({ userId, amount, currency = 'INR', planName }) {
  const isMock = process.env.PAYMENT_MODE === 'mock' || !process.env.STITCH_API_KEY;
  const transactionId = `STITCH-TXN-${Date.now()}`;

  console.log(`💳 Initiating ${isMock ? 'Development Mock' : 'Live'} Stitch Payment for ${planName} (${currency} ${amount})...`);

  let newPaymentId = Date.now();

  if (db.isConnected) {
    const [result] = await db.query(
      'INSERT INTO payments (user_id, amount, currency, payment_status, transaction_id, provider) VALUES (?, ?, ?, "PENDING", ?, "STITCH")',
      [userId, amount, currency, transactionId]
    );
    newPaymentId = result.insertId;
  } else {
    const newPayment = {
      id: newPaymentId,
      user_id: userId,
      amount,
      currency,
      payment_status: 'PENDING',
      transaction_id: transactionId,
      provider: 'STITCH',
      created_at: new Date().toISOString()
    };
    db.memoryStore.payments.push(newPayment);
  }

  if (isMock) {
    console.log(`[MOCK STITCH PAYMENT Gateway Initialized]\nTransaction ID: ${transactionId}\nPlan: ${planName}\nAmount: ${currency} ${amount}`);
  }

  return {
    paymentId: newPaymentId,
    transactionId,
    amount,
    currency,
    provider: 'STITCH',
    isMock
  };
}

async function verifyPayment({ paymentId, transactionId, status = 'SUCCESS' }) {
  console.log(`🔍 Verifying Stitch Payment status for Transaction #${transactionId || paymentId}...`);

  let payment = null;

  if (db.isConnected) {
    const [rows] = await db.query('SELECT * FROM payments WHERE id = ? OR transaction_id = ?', [paymentId, transactionId]);
    payment = rows[0];

    if (payment) {
      await db.query('UPDATE payments SET payment_status = ? WHERE id = ?', [status, payment.id]);
    }
  } else {
    payment = db.memoryStore.payments.find(p => Number(p.id) === Number(paymentId) || p.transaction_id === transactionId);
    if (payment) {
      payment.payment_status = status;
    }
  }

  if (!payment) {
    return { success: false, message: 'Payment record not found.' };
  }

  return {
    success: status === 'SUCCESS',
    payment
  };
}

module.exports = {
  createPayment,
  verifyPayment
};
