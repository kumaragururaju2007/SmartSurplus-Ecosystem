const API_BASE = '/api/biogas';

export const getBiogasProfile = async (token) => {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const updateBiogasProfile = async (profileData, token) => {
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

export const uploadBiogasDocument = async (docData, token) => {
  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(docData)
  });
  return res.json();
};

export const getBiogasRequests = async (token) => {
  const res = await fetch(`${API_BASE}/requests`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getBiogasRequestDetails = async (id, token) => {
  const res = await fetch(`${API_BASE}/requests/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const acceptBiogasRequest = async (id, token) => {
  const res = await fetch(`${API_BASE}/donations/${id}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const rejectBiogasRequest = async (id, token) => {
  const res = await fetch(`${API_BASE}/donations/${id}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const startPickup = async (id, token) => {
  const res = await fetch(`${API_BASE}/donations/${id}/start-pickup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const completeCollection = async (id, token) => {
  const res = await fetch(`${API_BASE}/donations/${id}/collect`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const completeProcessing = async (id, token) => {
  const res = await fetch(`${API_BASE}/donations/${id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};
