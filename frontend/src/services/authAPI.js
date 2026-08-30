const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/auth`;
  }
  return '/api/auth';
};

const handleResponse = async (res) => {
  try {
    const data = await res.json();
    return data;
  } catch (err) {
    if (!res.ok) {
      return { 
        success: false, 
        message: `Server returned status ${res.status} (${res.statusText || 'Error'}). Make sure backend server is running on http://localhost:5000.` 
      };
    }
    return { success: false, message: 'Invalid response from server.' };
  }
};

export const loginUser = async (credentials) => {
  try {
    const res = await fetch(`${getApiBase()}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return await handleResponse(res);
  } catch (err) {
    return { success: false, message: 'Cannot connect to backend server. Please check if backend is running on http://localhost:5000.' };
  }
};

export const registerUser = async (userData) => {
  try {
    const res = await fetch(`${getApiBase()}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await handleResponse(res);
  } catch (err) {
    return { success: false, message: 'Cannot connect to backend server. Please check if backend is running on http://localhost:5000.' };
  }
};

export const resetPassword = async (resetData) => {
  try {
    const res = await fetch(`${getApiBase()}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetData)
    });
    return await handleResponse(res);
  } catch (err) {
    return { success: false, message: 'Cannot connect to backend server.' };
  }
};

export const getProfile = async (token) => {
  try {
    const res = await fetch(`${getApiBase()}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await handleResponse(res);
  } catch (err) {
    return { success: false, message: 'Cannot connect to backend server.' };
  }
};
