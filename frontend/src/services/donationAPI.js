const API_BASE = '/api/donations';

export const createDonation = async (donationData, token) => {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(donationData)
  });
  return res.json();
};

export const getMyDonations = async (token) => {
  const res = await fetch(`${API_BASE}/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getDashboardSummary = async (token) => {
  const res = await fetch(`${API_BASE}/dashboard-summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getDonationById = async (id, token) => {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
};

export const cancelDonation = async (id, token) => {
  const res = await fetch(`${API_BASE}/${id}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const updateDonationStatus = async (id, status, token) => {
  const res = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  return res.json();
};

export const getDonorProfile = async (token) => {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const updateDonorProfile = async (profileData, token) => {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  return res.json();
};

export const getPublicDonorProfile = async (id, token) => {
  const res = await fetch(`${API_BASE}/public-profile/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
};

export const getDonorAnalytics = async (range = '30d', token) => {
  const res = await fetch(`${API_BASE}/donor-analytics?range=${range}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const rateDonor = async (donationId, ratingData, token) => {
  const res = await fetch(`${API_BASE}/${donationId}/rate-donor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(ratingData)
  });
  return res.json();
};

export const getDonorTrustScore = async (donorId = null, token = null) => {
  const url = donorId ? `${API_BASE}/${donorId}/trust-score` : `${API_BASE}/trust-score`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
};
