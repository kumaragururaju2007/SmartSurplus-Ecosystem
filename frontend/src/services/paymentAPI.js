const API_BASE = '/api/payment';

export const createCheckout = async (checkoutData, token) => {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(checkoutData)
  });
  return res.json();
};

export const verifyPayment = async (verifyData, token) => {
  const res = await fetch(`${API_BASE}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(verifyData)
  });
  return res.json();
};
