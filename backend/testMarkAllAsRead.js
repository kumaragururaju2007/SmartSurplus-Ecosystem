const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Testing Notification Mark Read & Mark All as Read...\n');

  const uniqueId = Date.now();
  const ngoEmail = `ngo.test.${uniqueId}@gmail.com`;
  const donorEmail = `donor.test.${uniqueId}@gmail.com`;

  // 1. Authenticate NGO User
  const ngoRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Annam Foundation Lead',
      email: ngoEmail,
      phone: '9840998877',
      password: 'password123',
      role: 'NGO',
      organizationName: 'annam foundation',
      ngoType: 'Trust',
      legalRegistrationNumber: `NGO-TN-${uniqueId}`,
      registrationAuthority: 'Govt of Tamil Nadu',
      pan: 'AAATK1234N',
      contactPerson: 'Annam Lead',
      address: 'Tambaram, Chennai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      foodCapacity: 1000,
      mealsPerDay: 400,
      latitude: 12.9249,
      longitude: 80.1000
    })
  });
  const ngoAuth = await ngoRegRes.json();
  assert(ngoAuth.success === true && Boolean(ngoAuth.token), '1. Authenticated NGO User');
  const token = ngoAuth.token;

  // 2. Create donor and test donation to generate real notifications
  const donorRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Grand Bhavan',
      email: donorEmail,
      phone: '9840112233',
      password: 'password123',
      role: 'DONOR',
      businessName: 'Grand Bhavan Sweets',
      businessType: 'Restaurant',
      fssaiNumber: '12345678901234',
      contactPerson: 'Manager Bhavan',
      address: 'Anna Nagar, Chennai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.0850,
      longitude: 80.2100
    })
  });
  const donorAuth = await donorRegRes.json();
  assert(donorAuth.success === true && Boolean(donorAuth.token), '2. Authenticated Donor User');
  const donorToken = donorAuth.token;

  // Create donation to trigger notifications
  await fetch(`${BASE_URL}/donations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${donorToken}`
    },
    body: JSON.stringify({
      food_name: 'Hot Sambar Rice & Dosa',
      food_category: 'Cooked Food',
      quantity: 50,
      weight_kg: 50,
      description: 'Fresh lunch packs',
      pickup_address: 'Anna Nagar, Chennai',
      custom_safe_hours: 4
    })
  });

  // 3. Test GET /api/ngo/notifications
  const getNotifRes = await fetch(`${BASE_URL}/ngo/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const notifData = await getNotifRes.json();
  assert(notifData.success === true, '3. GET /api/ngo/notifications succeeded');
  console.log(`Current NGO notifications count: ${notifData.notifications?.length}`);

  // 4. Test PUT /api/ngo/notifications/all/read (Mark All as Read via NGO API)
  const markAllRes = await fetch(`${BASE_URL}/ngo/notifications/all/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  const markAllData = await markAllRes.json();
  assert(markAllData.success === true, '4. PUT /api/ngo/notifications/all/read succeeded without error');

  // 5. Test PUT /api/ngo/notifications/read-all
  const readAllRes = await fetch(`${BASE_URL}/ngo/notifications/read-all`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  const readAllData = await readAllRes.json();
  assert(readAllData.success === true, '5. PUT /api/ngo/notifications/read-all succeeded without error');

  // 6. Test PUT /api/notifications/read-all (General notification API)
  const genReadAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  const genReadAllData = await genReadAllRes.json();
  assert(genReadAllData.success === true, '6. PUT /api/notifications/read-all succeeded without error');

  // 7. Verify all notifications are now marked as read
  const verifyRes = await fetch(`${BASE_URL}/ngo/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const verifyData = await verifyRes.json();
  const unreadCount = (verifyData.notifications || []).filter(n => !n.is_read || n.is_read === 0 || n.is_read === '0' || n.is_read === false).length;
  assert(unreadCount === 0, `7. All notifications successfully marked as read (Unread count: ${unreadCount})`);

  console.log('\n======================================================');
  console.log('🎉 ALL MARK-ALL-AS-READ NOTIFICATION TESTS PASSED!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
