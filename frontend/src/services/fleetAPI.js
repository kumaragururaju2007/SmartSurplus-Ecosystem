const API_BASE = '/api';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});

// 1. Vehicle Management API
export async function getVehicles(token) {
  const res = await fetch(`${API_BASE}/fleet/vehicles`, {
    headers: getHeaders(token)
  });
  return res.json();
}

export async function createVehicle(data, token) {
  const res = await fetch(`${API_BASE}/fleet/vehicles`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateVehicleStatus(id, data, token) {
  const res = await fetch(`${API_BASE}/fleet/vehicles/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteVehicle(id, token) {
  const res = await fetch(`${API_BASE}/fleet/vehicles/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  return res.json();
}

// 2. Driver Management API
export async function getDrivers(token) {
  const res = await fetch(`${API_BASE}/fleet/drivers`, {
    headers: getHeaders(token)
  });
  return res.json();
}

export async function createDriver(data, token) {
  const res = await fetch(`${API_BASE}/fleet/drivers`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function assignDriver(data, token) {
  const res = await fetch(`${API_BASE}/fleet/drivers/assign`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateDriver(id, data, token) {
  const res = await fetch(`${API_BASE}/fleet/drivers/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteDriver(id, token) {
  const res = await fetch(`${API_BASE}/fleet/drivers/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  return res.json();
}

// 3. Driver Mobile GPS Pairing Code Generation API
export async function generatePairingCode(data, token) {
  const res = await fetch(`${API_BASE}/fleet/pairing/generate`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

// 4. Driver Portal Pairing Code Authentication API (Public)
export async function driverLogin(data) {
  const res = await fetch(`${API_BASE}/tracking/driver/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// 5. Driver Current Assigned Trip API
export async function getDriverTrip(token) {
  const res = await fetch(`${API_BASE}/tracking/driver/trip`, {
    headers: getHeaders(token)
  });
  return res.json();
}

// 6. IoT Device Registration API
export async function registerGPSDevice(data, token) {
  const res = await fetch(`${API_BASE}/fleet/devices`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function pairDeviceWithVehicle(data, token) {
  const res = await fetch(`${API_BASE}/fleet/devices/pair`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

// 7. Trip Dispatch & Live GPS Tracking API
export async function createTrip(data, token) {
  const res = await fetch(`${API_BASE}/tracking/trips`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function startPickup(data, token) {
  const res = await fetch(`${API_BASE}/tracking/pickup/start`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function sendLocationUpdate(data, token) {
  const res = await fetch(`${API_BASE}/tracking/driver/location`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getTripLive(id, token) {
  const res = await fetch(`${API_BASE}/tracking/live/${id}`, {
    headers: getHeaders(token)
  });
  return res.json();
}

export async function getActiveTrips(token) {
  const res = await fetch(`${API_BASE}/tracking/trips/active`, {
    headers: getHeaders(token)
  });
  return res.json();
}

export async function getActiveFleetLocations(token) {
  const res = await fetch(`${API_BASE}/tracking/fleet/locations`, {
    headers: getHeaders(token)
  });
  return res.json();
}

export async function updateTripStage(data, token) {
  const res = await fetch(`${API_BASE}/tracking/trips/stage`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function signalDriverArrival(data, token) {
  const res = await fetch(`${API_BASE}/tracking/driver/signal-arrival`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function completeTrip(data, token) {
  const res = await fetch(`${API_BASE}/tracking/trip/complete`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ ...data, stage: 'COMPLETED' })
  });
  return res.json();
}
