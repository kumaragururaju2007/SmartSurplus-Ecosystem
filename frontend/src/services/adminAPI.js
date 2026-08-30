const API_BASE = '/api/admin';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
});

// 1. Dashboard Overview
export const getAdminSummary = async (token) => {
  const res = await fetch(`${API_BASE}/summary`, {
    headers: authHeaders(token)
  });
  return res.json();
};

// 2. Organizations Management
export const getOrganizations = async (type = '', token) => {
  const url = type ? `${API_BASE}/organizations?type=${type}` : `${API_BASE}/organizations`;
  const res = await fetch(url, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const getOrganizationDetails = async (type, id, token) => {
  const res = await fetch(`${API_BASE}/organizations/${type}/${id}`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const performOrganizationAction = async (type, id, action, reason = '', token) => {
  const res = await fetch(`${API_BASE}/organizations/${type}/${id}/action`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ action, reason })
  });
  return res.json();
};

export const performDocumentAction = async (type, id, docId, action, reason = '', token) => {
  const res = await fetch(`${API_BASE}/organizations/${type}/${id}/documents/${docId}/action`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ action, reason })
  });
  return res.json();
};

// Legacy Aliases
export const verifyNGO = async (id, token) => performOrganizationAction('ngos', id, 'VERIFY', 'Admin verification approval', token);
export const rejectNGO = async (id, token, reason = 'Verification criteria not met') => performOrganizationAction('ngos', id, 'REJECT', reason, token);
export const verifyBiogas = async (id, token) => performOrganizationAction('biogas', id, 'VERIFY', 'Admin verification approval', token);
export const rejectBiogas = async (id, token, reason = 'Facility validation not confirmed') => performOrganizationAction('biogas', id, 'REJECT', reason, token);

// 3. Verification Center
export const getVerificationQueue = async (token) => {
  const res = await fetch(`${API_BASE}/verification`, {
    headers: authHeaders(token)
  });
  return res.json();
};

// 4. Donations & Journey Tracking
export const getAdminDonations = async (token) => {
  const res = await fetch(`${API_BASE}/donations`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const getDonationJourney = async (id, token) => {
  const res = await fetch(`${API_BASE}/donations/${id}/journey`, {
    headers: authHeaders(token)
  });
  return res.json();
};

// 5. Live Tracking & Platform Map
export const getLiveTracking = async (token) => {
  const res = await fetch(`${API_BASE}/tracking/live`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const getMapMarkers = async (token) => {
  const res = await fetch(`${API_BASE}/map/markers`, {
    headers: authHeaders(token)
  });
  return res.json();
};

// 6. Analytics & Reports
export const getAdminAnalytics = async (token) => {
  const res = await fetch(`${API_BASE}/analytics`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const getAdminReports = async (reportType = '', period = 'This Month', token) => {
  const params = new URLSearchParams();
  if (reportType) params.append('reportType', reportType);
  if (period) params.append('period', period);
  const res = await fetch(`${API_BASE}/reports?${params.toString()}`, {
    headers: authHeaders(token)
  });
  return res.json();
};

// 7. Audit Logs & System Notifications
export const getAuditLogs = async (action = '', targetType = '', token) => {
  const params = new URLSearchParams();
  if (action) params.append('action', action);
  if (targetType) params.append('targetType', targetType);
  const res = await fetch(`${API_BASE}/audit-logs?${params.toString()}`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const getAdminNotifications = async (token) => {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const getNotificationRecipients = async (token) => {
  const res = await fetch(`${API_BASE}/notifications/recipients`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const sendAdminNotification = async (payload, token) => {
  const res = await fetch(`${API_BASE}/notifications/send`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const getAdminNotificationHistory = async (token) => {
  const res = await fetch(`${API_BASE}/notifications/history`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const getAdminNotificationDetail = async (id, token) => {
  const res = await fetch(`${API_BASE}/notifications/history/${id}`, {
    headers: authHeaders(token)
  });
  return res.json();
};

// 8. Users & Subscriptions
export const getAdminUsers = async (token) => {
  const res = await fetch(`${API_BASE}/users`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const getSubscriptions = async (token) => {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const getPayments = async (token) => {
  const res = await fetch(`${API_BASE}/payments`, {
    headers: authHeaders(token)
  });
  return res.json();
};

// 9. Donor Complaints & Confidential Feedback
export const getDonorComplaints = async (token) => {
  const res = await fetch(`${API_BASE}/complaints`, {
    headers: authHeaders(token)
  });
  return res.json();
};

export const updateComplaintStatus = async (complaintId, payload, token) => {
  const res = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
  return res.json();
};
