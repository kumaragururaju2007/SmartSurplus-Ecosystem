const API_BASE = '/api/notifications';

export const getNotifications = async (token) => {
  const res = await fetch(API_BASE, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const markAsRead = async (id, token) => {
  const res = await fetch(`${API_BASE}/${id}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const markAllAsRead = async (token) => {
  const res = await fetch(`${API_BASE}/read-all`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const sendTestMobileNotification = async (token) => {
  const res = await fetch(`${API_BASE}/test-mobile`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    }
  });
  return res.json();
};
