const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'smartsurplus_super_secret_jwt_key_2026';
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
  console.log('🧪 Starting Donor Analytics & Trends Integration Tests...\n');

  const donorToken = jwt.sign(
    { userId: 2, id: 2, role: 'DONOR', name: 'Hotel Grand Residency' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 1. Create a few test donations for this donor across different food names
  const testFoods = [
    { name: 'Buffet Excess Veg Biryani', cat: 'Cooked dry food', qty: 45 },
    { name: 'Buffet Excess Veg Biryani', cat: 'Cooked dry food', qty: 50 },
    { name: 'Paneer Butter Masala', cat: 'Cooked gravy-based food', qty: 30 },
    { name: 'Fresh Fruit Salad Trays', cat: 'Fresh-cut fruits/vegetables', qty: 25 }
  ];

  for (const f of testFoods) {
    const res = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${donorToken}`
      },
      body: JSON.stringify({
        food_name: f.name,
        food_category: f.cat,
        quantity: f.qty,
        weight_kg: f.qty,
        quantity_unit: 'kg',
        description: 'Quality tested food donation',
        preparation_time: new Date().toISOString(),
        pickup_address: 'Mount Road, Chennai',
        latitude: 13.0600,
        longitude: 80.2500,
        custom_safe_hours: 3
      })
    });
    const data = await res.json();
    assert(data.success === true, `Created test donation for ${f.name} (${f.qty} kg)`);
  }

  // 2. Fetch Donor Analytics for 30d
  const analyticsRes = await fetch(`${BASE_URL}/donations/donor-analytics?range=30d`, {
    headers: {
      'Authorization': `Bearer ${donorToken}`
    }
  });
  const analyticsData = await analyticsRes.json();
  assert(analyticsData.success === true, '1. GET /api/donations/donor-analytics returns success');
  assert(analyticsData.analytics && analyticsData.analytics.summary, '2. Analytics summary object present');

  const { summary, dailyTrends, frequentlyDonated, categoryBreakdown } = analyticsData.analytics;

  assert(summary.totalDonatedKg >= 150, `3. Total donated weight >= 150kg (Actual: ${summary.totalDonatedKg} kg)`);
  assert(Array.isArray(dailyTrends) && dailyTrends.length === 30, `4. Daily trends has continuous 30-day linear timeline (Length: ${dailyTrends.length})`);
  
  const todayEntry = dailyTrends[dailyTrends.length - 1];
  assert(todayEntry.amount_donated_kg >= 150, `5. Today linear data point captures today donations (${todayEntry.amount_donated_kg} kg)`);

  assert(Array.isArray(frequentlyDonated) && frequentlyDonated.length >= 3, `6. Frequently donated foods grouped properly (Count: ${frequentlyDonated.length})`);
  const biryaniEntry = frequentlyDonated.find(f => f.food_name === 'Buffet Excess Veg Biryani');
  assert(biryaniEntry && biryaniEntry.frequency >= 2, `7. Veg Biryani entry present with frequency >= 2 (Actual: ${biryaniEntry?.frequency})`);

  assert(Array.isArray(categoryBreakdown) && categoryBreakdown.length >= 2, `8. Category distribution breakdown populated (Count: ${categoryBreakdown.length})`);

  console.log('\n========================================');
  console.log('Results: All 8 analytics assertions passed!');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
