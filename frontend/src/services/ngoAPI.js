const API_BASE = '/api/ngo';

export const getNGOProfile = async (token) => {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const updateNGOProfile = async (profileData, token) => {
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

export const uploadNGODocument = async (docData, token) => {
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

export const getDashboardSummary = async (token) => {
  const res = await fetch(`${API_BASE}/dashboard-summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// Incoming Requests (Donor Offers Assigned to NGO)
export const getIncomingRequests = async (token) => {
  const res = await fetch(`${API_BASE}/incoming-requests`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const acceptDonation = async (id, token) => {
  const res = await fetch(`${API_BASE}/donations/${id}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const rejectDonation = async (id, token) => {
  const res = await fetch(`${API_BASE}/donations/${id}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// Matched & Incoming Pipeline API
export const getMatchedDonations = async (token) => {
  const res = await fetch(`${API_BASE}/matched-donations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const getIncomingDonations = async (token) => {
  const res = await fetch(`${API_BASE}/incoming-donations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const updateIncomingStatus = async (id, newStatus, token) => {
  const res = await fetch(`${API_BASE}/incoming-donations/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ newStatus })
  });
  return res.json();
};

// Beneficiaries API
export const getBeneficiariesSummary = async (token) => {
  const res = await fetch(`${API_BASE}/beneficiaries`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// Impact & Analytics API
export const getNGOImpact = async (token) => {
  const res = await fetch(`${API_BASE}/impact`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// Reports API
export const getNGOReports = async (reportType, dateFilter, token) => {
  const params = new URLSearchParams();
  if (reportType) params.append('reportType', reportType);
  if (dateFilter) params.append('dateFilter', dateFilter);

  const res = await fetch(`${API_BASE}/reports?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// Notifications API
export const getNGONotifications = async (token) => {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const markNotificationAsRead = async (id, token) => {
  if (id === 'all' || id === 'read-all') {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const markAllNotificationsAsRead = async (token) => {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

// Settings API
export const getNGOSettings = async (token) => {
  const res = await fetch(`${API_BASE}/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const updateNGOSettings = async (settingsData, token) => {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settingsData)
  });
  return res.json();
};

// Donation Receipt & Impact Tracking API
export const confirmDonationReceipt = async (donationId, receiptData, token) => {
  const res = await fetch(`${API_BASE}/donations/${donationId}/confirm-receipt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(receiptData)
  });
  return res.json();
};

export const updateActualPeopleServed = async (donationId, updateData, token) => {
  const res = await fetch(`${API_BASE}/donations/${donationId}/actual-people-served`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  return res.json();
};

export const getNGOHistory = async (token) => {
  const res = await fetch(`${API_BASE}/history`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};
