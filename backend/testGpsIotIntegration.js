const http = require('http');
const assert = require('assert');
const { server } = require('./server');

const TEST_PORT = 5055;
const MASTER_KEY = 'smartsurplus_iot_secret_key_2026';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runGpsIotTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHYSICAL GPS IoT INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  await new Promise((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`🚀 Test Server running on port ${TEST_PORT}\n`);
      resolve();
    });
  });

  try {
    // 1. Test Ingestion without Device ID (Should fail 400)
    console.log('1️⃣ Testing Ingestion without deviceId...');
    const res1 = await makeRequest('POST', '/api/gps/location', { latitude: 11.0168, longitude: 76.9558 }, { 'X-API-Key': MASTER_KEY });
    assert.strictEqual(res1.status, 400, 'Expected status 400 for missing deviceId');
    console.log('   ✅ Successfully rejected missing deviceId.\n');

    // 2. Test Ingestion with Invalid Coordinate Bounds (Should fail 422)
    console.log('2️⃣ Testing Ingestion with invalid coordinates (e.g. lat > 90)...');
    const res2 = await makeRequest('POST', '/api/gps/location', { deviceId: 'TRUCK001', latitude: 150.0, longitude: 76.9558 }, { 'X-API-Key': MASTER_KEY });
    assert.strictEqual(res2.status, 422, 'Expected status 422 for out-of-bounds coordinates');
    console.log('   ✅ Successfully rejected out-of-bounds coordinates.\n');

    // 3. Test Ingestion with Null Island (0, 0) GPS jitter (Should fail 422)
    console.log('3️⃣ Testing Ingestion with Null Island unacquired GPS lock (0.0, 0.0)...');
    const res3 = await makeRequest('POST', '/api/gps/location', { deviceId: 'TRUCK001', latitude: 0.0, longitude: 0.0 }, { 'X-API-Key': MASTER_KEY });
    assert.strictEqual(res3.status, 422, 'Expected status 422 for 0,0 unacquired GPS lock');
    console.log('   ✅ Successfully ignored unacquired GPS zero-lock.\n');

    // 4. Test Valid Coordinate Transmission from Physical IoT Tracker
    console.log('4️⃣ Testing Valid GPS Telemetry Ingestion from TRUCK001...');
    const validPacket = {
      deviceId: 'TRUCK001',
      latitude: 11.016844,
      longitude: 76.955832,
      speed: 34.5,
      heading: 48.0,
      batteryLevel: 98.2,
      timestamp: new Date().toISOString()
    };
    const res4 = await makeRequest('POST', '/api/gps/location', validPacket, { 'X-Device-Id': 'TRUCK001', 'X-API-Key': MASTER_KEY });
    assert.strictEqual(res4.status, 200, 'Expected status 200 for valid GPS ingestion');
    assert.strictEqual(res4.data.success, true, 'Expected success=true');
    console.log('   ✅ Successfully processed and stored GPS telemetry packet.\n');

    // 5. Test Secondary Coordinate Transmission to create history breadcrumbs
    console.log('5️⃣ Transmitting 2nd & 3rd Telemetry Packets for route history...');
    await makeRequest('POST', '/api/gps/location', { deviceId: 'TRUCK001', latitude: 11.0205, longitude: 76.9610, speed: 42.0, batteryLevel: 98.0 }, { 'X-API-Key': MASTER_KEY });
    await makeRequest('POST', '/api/gps/location', { deviceId: 'TRUCK001', latitude: 11.0250, longitude: 76.9670, speed: 38.0, batteryLevel: 97.8 }, { 'X-API-Key': MASTER_KEY });
    console.log('   ✅ Breadcrumbs sent.\n');

    // 6. Test GET /api/gps/latest/:deviceId
    console.log('6️⃣ Testing GET /api/gps/latest/TRUCK001...');
    const resLatest = await makeRequest('GET', '/api/gps/latest/TRUCK001');
    assert.strictEqual(resLatest.status, 200, 'Expected status 200 for latest location');
    assert.strictEqual(resLatest.data.success, true);
    assert.strictEqual(resLatest.data.deviceId, 'TRUCK001');
    assert.strictEqual(resLatest.data.status, 'ONLINE');
    console.log(`   ✅ Latest Location: Lat ${resLatest.data.latitude}, Lng ${resLatest.data.longitude}, Speed ${resLatest.data.speed} km/h, Status: ${resLatest.data.status}\n`);

    // 7. Test GET /api/gps/history/:deviceId
    console.log('7️⃣ Testing GET /api/gps/history/TRUCK001 for polyline rendering...');
    const resHistory = await makeRequest('GET', '/api/gps/history/TRUCK001');
    assert.strictEqual(resHistory.status, 200, 'Expected status 200 for location history');
    assert.strictEqual(resHistory.data.success, true);
    assert(resHistory.data.pointsCount >= 3, `Expected at least 3 historical points, got ${resHistory.data.pointsCount}`);
    console.log(`   ✅ Route History: ${resHistory.data.pointsCount} coordinates ready for Leaflet Polyline rendering.\n`);

    console.log('====================================================');
    console.log('🎉 ALL PHYSICAL GPS IoT INTEGRATION TESTS PASSED!');
    console.log('====================================================');
    setTimeout(() => {
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runGpsIotTests();
