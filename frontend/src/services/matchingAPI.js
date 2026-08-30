const API_BASE = '/api/matching';

export const matchDonation = async (donationId, token) => {
  const res = await fetch(`${API_BASE}/${donationId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getMatchingResults = async (donationId, token) => {
  const res = await fetch(`${API_BASE}/${donationId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};
