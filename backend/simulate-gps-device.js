const http = require('http');

/**
 * SmartSurplus GPS IoT Hardware Simulator
 * Simulates a physical GPS tracking device transmitting real-time coordinates over GSM/4G LTE/Wi-Fi.
 */

const SERVER_HOST = 'localhost';
const SERVER_PORT = process.env.PORT || 5000;
const DEVICE_ID = process.argv[2] || 'TRUCK001';
const API_KEY = process.env.GPS_MASTER_API_KEY || 'smartsurplus_iot_secret_key_2026';

// Simulated realistic road trajectory (Coimbatore/Chennai region coordinates)
const ROAD_ROUTE = [
  { lat: 11.016844, lng: 76.955832, speed: 28, heading: 42, battery: 98.4 },
  { lat: 11.018520, lng: 76.957910, speed: 35, heading: 45, battery: 98.2 },
  { lat: 11.020940, lng: 76.961230, speed: 42, heading: 48, battery: 98.0 },
  { lat: 11.023410, lng: 76.965420, speed: 46, heading: 50, battery: 97.9 },
  { lat: 11.026850, lng: 76.970110, speed: 38, heading: 52, battery: 97.7 },
  { lat: 11.029410, lng: 76.974950, speed: 32, heading: 55, battery: 97.5 },
  { lat: 11.032100, lng: 76.979800, speed: 25, heading: 58, battery: 97.4 },
  { lat: 11.034500, lng: 76.984200, speed: 18, heading: 60, battery: 97.2 }
];

let stepIndex = 0;

function sendGpsPacket() {
  const point = ROAD_ROUTE[stepIndex];
  const postData = JSON.stringify({
    deviceId: DEVICE_ID,
    latitude: point.lat,
    longitude: point.lng,
    speed: point.speed,
    heading: point.heading,
    batteryLevel: point.battery,
    timestamp: new Date().toISOString()
  });

  const options = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: '/api/gps/location',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-Device-Id': DEVICE_ID,
      'X-API-Key': API_KEY
    }
  };

  const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => { responseBody += chunk; });
    res.on('end', () => {
      console.log(`[📡 IoT Device ${DEVICE_ID}] Ping #${stepIndex + 1}: Lat ${point.lat.toFixed(5)}, Lng ${point.lng.toFixed(5)}, Speed ${point.speed} km/h | Status: ${res.statusCode} (${responseBody.slice(0, 65)})`);
    });
  });

  req.on('error', (err) => {
    console.error(`⚠️ Failed to transmit packet for ${DEVICE_ID}:`, err.message);
  });

  req.write(postData);
  req.end();

  stepIndex = (stepIndex + 1) % ROAD_ROUTE.length;
}

console.log('====================================================');
console.log(`🛰️ Starting Physical GPS Tracker Simulation for '${DEVICE_ID}'`);
console.log(`📡 Transmitting live coordinate packets to http://${SERVER_HOST}:${SERVER_PORT}/api/gps/location every 3 seconds`);
console.log('====================================================');

// Send immediately, then every 3 seconds
sendGpsPacket();
const interval = setInterval(sendGpsPacket, 3000);

process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\n🛑 Simulation ended.');
  process.exit(0);
});
