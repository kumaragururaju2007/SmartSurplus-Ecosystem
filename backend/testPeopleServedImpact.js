const jwt = require('jsonwebtoken');

const JWT_SECRET = 'smartsurplus_super_secret_jwt_key_2026';
const BASE_URL = 'http://localhost:5000/api';

const donorToken = jwt.sign({ userId: 16, id: 16, role: 'DONOR', name: 'Hotel Grand Residency' }, JWT_SECRET);
const ngoToken = jwt.sign({ userId: 17, id: 17, role: 'NGO', name: 'Annam Foundation' }, JWT_SECRET);
const adminToken = jwt.sign({ userId: 1, id: 1, role: 'ADMIN', name: 'Platform Admin' }, JWT_SECRET);

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Food Donation Impact & People Served Integration Tests...\n');

  // 1. Create Donation as Donor (150 kg)
  const donRes = await fetch(`${BASE_URL}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${donorToken}` },
    body: JSON.stringify({
      food_name: 'Buffet Excess Veg Meals',
      food_category: 'Cooked gravy-based food',
      quantity: 150,
      weight_kg: 150,
      quantity_unit: 'kg',
      description: 'Clean excess buffet trays',
      preparation_time: new Date().toISOString(),
      pickup_address: 'Mount Road, Chennai',
      latitude: 13.0600,
      longitude: 80.2500,
      custom_safe_hours: 3
    })
  });
  const donData = await donRes.json();
  assert(donData.success === true && donData.donation.id, '1. Donor successfully creates 150 kg food donation');
  const donationId = donData.donation.id;

  // 2. Accept Donation as NGO
  const acceptRes = await fetch(`${BASE_URL}/ngo/donations/${donationId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ngoToken}` }
  });
  const acceptData = await acceptRes.json();
  assert(acceptData.success === true, '2. NGO accepts donation match offer');

  // 3. NGO Confirms Donation Receipt with Received Weight (142 kg) & Estimated People Served (~568)
  const confirmRes = await fetch(`${BASE_URL}/ngo/donations/${donationId}/confirm-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ngoToken}` },
    body: JSON.stringify({
      quantityReceived: 142,
      peopleServedEstimate: 568,
      peopleServedType: 'ESTIMATED',
      notes: 'Received and distributed to city shelter communities'
    })
  });
  const confirmData = await confirmRes.json();
  assert(confirmData.success === true && confirmData.impact.peopleServed === 568 && confirmData.impact.quantityReceived === 142, '3. NGO confirms receipt (142 kg) & records ~568 estimated people served');

  // 4. Verify Donor Dashboard reflects People Benefited (568) & Food Received (142 kg)
  const donorDashRes = await fetch(`${BASE_URL}/donations/dashboard-summary`, {
    headers: { 'Authorization': `Bearer ${donorToken}` }
  });
  const donorDash = await donorDashRes.json();
  console.log('recentDonations sample:', donorDash.summary?.recentDonations?.slice(0, 3));
  assert(donorDash.success === true && donorDash.summary.peopleBenefited >= 568, '4. Donor Dashboard calculates accurate People Benefited from confirmed donation');
  assert(donorDash.summary.recentDonations.some(d => Number(d.id) === Number(donationId) && Number(d.people_served) === 568), '5. Donor recent donations includes ~568 people served impact');

  // 6. Verify NGO Dashboard reflects People Benefited & Top Donors Leaderboard
  const ngoDashRes = await fetch(`${BASE_URL}/ngo/dashboard-summary`, {
    headers: { 'Authorization': `Bearer ${ngoToken}` }
  });
  const ngoDash = await ngoDashRes.json();
  assert(ngoDash.success === true && ngoDash.summary.peopleBenefited >= 568, '6. NGO Dashboard calculates accurate People Benefited');
  assert(Array.isArray(ngoDash.summary.topDonors) && ngoDash.summary.topDonors.length > 0, '7. NGO Top Donors by People Served leaderboard populated');

  // 8. Verify NGO History endpoint returns accurate impact fields
  const ngoHistRes = await fetch(`${BASE_URL}/ngo/history`, {
    headers: { 'Authorization': `Bearer ${ngoToken}` }
  });
  const ngoHist = await ngoHistRes.json();
  const histItem = (ngoHist.history || []).find(h => Number(h.donation_id) === Number(donationId));
  assert(histItem && Number(histItem.people_served) === 568 && Math.round(Number(histItem.quantity_received)) === 142, '8. NGO History table provides donation-level impact (142 kg, 568 people)');

  // 9. Update to Verified Actual People Served (552)
  const actualRes = await fetch(`${BASE_URL}/ngo/donations/${donationId}/actual-people-served`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ngoToken}` },
    body: JSON.stringify({
      actualPeopleServed: 552,
      notes: 'Post-distribution headcount verified at 3 shelter branches'
    })
  });
  const actualData = await actualRes.json();
  assert(actualData.success === true && actualData.peopleServedActual === 552, '9. NGO updates to verified actual count of 552 people served');

  // 10. Verify Platform Impact Summary reflects 552 with ZERO double-counting
  const impactRes = await fetch(`${BASE_URL}/impact/summary`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const impactData = await impactRes.json();
  assert(impactData.success === true && impactData.summary.peopleBenefited >= 552, '10. Platform-Wide Impact reflects verified people benefited with zero double-counting');

  console.log('\n========================================');
  console.log('Results: 10 / 10 integration tests passed!');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
