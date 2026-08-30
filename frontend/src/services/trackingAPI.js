const API_BASE = '/api/tracking';

export const updateTrackingStatus = async (donationId, status, token) => {
  const res = await fetch(`${API_BASE}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ donationId, status })
  });
  return res.json();
};

export const getTrackingDetails = async (donationId) => {
  const res = await fetch(`${API_BASE}/${donationId}`);
  return res.json();
};
