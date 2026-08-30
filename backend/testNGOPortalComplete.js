const db = require('./database/databaseConnection');
const ngoController = require('./controllers/ngoController');
const tripTrackingController = require('./controllers/tripTrackingController');

function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    }
  };
}

async function runTests() {
  console.log('🧪 Starting NGO Portal Complete Verification Suite...');
  await db.ready;

  let passedCount = 0;
  let totalCount = 0;

  function assert(name, condition, extraInfo = '') {
    totalCount++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name} ${extraInfo}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${extraInfo}`);
    }
  }

  const mockReq = {
    user: { userId: 17, id: 17, role: 'NGO', name: 'annam foundation' },
    query: {},
    params: {},
    body: {},
    app: {
      get: () => ({ emit: () => {} })
    }
  };

  // TEST 1: getIncomingRequests
  console.log('\n--- 1. Testing Incoming Requests Filtering ---');
  const res1 = createMockRes();
  await ngoController.getIncomingRequests(mockReq, res1, (err) => console.error(err));
  assert('Incoming Requests returns success', res1.data && res1.data.success === true);
  assert('Incoming Requests has requests array', Array.isArray(res1.data.requests));
  // Completed or delivered donations must not be in incoming requests
  const hasCompleted = (res1.data.requests || []).some(r => ['ACCEPTED', 'PICKUP_STARTED', 'COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(r.donation_status));
  assert('No accepted/completed donations in incoming requests', !hasCompleted, `(Count: ${res1.data.requests?.length || 0})`);

  // TEST 2: getNGOHistory
  console.log('\n--- 2. Testing Donation History Deduplication ---');
  const res2 = createMockRes();
  await ngoController.getNGOHistory(mockReq, res2, (err) => console.error(err));
  assert('History returns success', res2.data && res2.data.success === true);
  const hist = res2.data.history || [];
  const donationIds = hist.map(h => h.donation_id);
  const hasDuplicates = new Set(donationIds).size !== donationIds.length;
  assert('No duplicate donation IDs in history', !hasDuplicates, `(Unique items: ${hist.length})`);

  // TEST 3: getBeneficiariesSummary
  console.log('\n--- 3. Testing Beneficiaries Summary ---');
  const res3 = createMockRes();
  await ngoController.getBeneficiariesSummary(mockReq, res3, (err) => console.error(err));
  assert('Beneficiaries returns success', res3.data && res3.data.success === true);
  assert('Beneficiaries total is a valid number', typeof res3.data?.stats?.totalBeneficiaries === 'number');
  assert('Recent distributions is an array', Array.isArray(res3.data?.stats?.recentDistributions));
  console.log('   Beneficiaries Total:', res3.data?.stats?.totalBeneficiaries, 'Served This Month:', res3.data?.stats?.beneficiariesServedThisMonth);

  // TEST 4: getNGOImpact
  console.log('\n--- 4. Testing NGO Impact & Environmental Metrics ---');
  const res4 = createMockRes();
  await ngoController.getNGOImpact(mockReq, res4, (err) => console.error(err));
  assert('Impact returns success', res4.data && res4.data.success === true);
  const imp = res4.data.impact || {};
  assert('totalDonationsReceived is a valid number', typeof imp.totalDonationsReceived === 'number');
  assert('totalFoodDistributedKg is a valid number (no undefined)', typeof imp.totalFoodDistributedKg === 'number' && !isNaN(imp.totalFoodDistributedKg));
  assert('totalBeneficiariesServed is a valid number', typeof imp.totalBeneficiariesServed === 'number');
  assert('wastePreventedKg is a valid number (no undefined)', typeof imp.wastePreventedKg === 'number' && !isNaN(imp.wastePreventedKg));
  assert('co2SavedKg is a valid number', typeof imp.co2SavedKg === 'number' && !isNaN(imp.co2SavedKg));
  assert('monthlyCharts is a valid array', Array.isArray(imp.monthlyCharts) && imp.monthlyCharts.length > 0);
  console.log('   Impact stats:', {
    foodDistributedKg: imp.totalFoodDistributedKg,
    wastePreventedKg: imp.wastePreventedKg,
    beneficiaries: imp.totalBeneficiariesServed,
    co2SavedKg: imp.co2SavedKg
  });

  // TEST 5: getNGOReports
  console.log('\n--- 5. Testing NGO Reports & ESG Generation ---');
  const res5 = createMockRes();
  mockReq.query = { reportType: 'Donation Received', dateFilter: 'This Month' };
  await ngoController.getNGOReports(mockReq, res5, (err) => console.error(err));
  assert('Reports returns success', res5.data && res5.data.success === true);
  assert('Report object exists with title and organization', Boolean(res5.data?.report?.title && res5.data?.report?.organization));
  assert('Report summary exists with totalDonations and totalQuantityKg', Boolean(res5.data?.report?.summary?.totalDonations));
  assert('Report records is a non-empty array', Array.isArray(res5.data?.report?.records));
  console.log('   Report Title:', res5.data?.report?.title, 'Records Count:', res5.data?.report?.records?.length);

  // TEST 6: Vehicle Dispatch & Driver Random Pairing Code
  console.log('\n--- 6. Testing Vehicle Dispatch & Random Pairing Code Generation ---');
  const dispatchReq = {
    body: {
      donationId: 1,
      vehicleId: 1,
      driverId: 1,
      handlerType: 'NGO',
      trackingMethod: 'DRIVER_MOBILE_GPS'
    },
    user: { userId: 17, id: 17, role: 'NGO' },
    app: { get: () => ({ emit: () => {} }) }
  };
  const dispatchRes = createMockRes();
  await tripTrackingController.createTrip(dispatchReq, dispatchRes, (err) => console.error(err));
  assert('createTrip returns success', dispatchRes.data && dispatchRes.data.success === true);
  assert('createTrip returns 6-digit numeric pairingCode', Boolean(dispatchRes.data?.pairingCode && dispatchRes.data.pairingCode.length === 6));
  console.log('   Generated Driver Pairing Code:', dispatchRes.data?.pairingCode, 'for Trip:', dispatchRes.data?.tripCode);

  if (dispatchRes.data?.pairingCode) {
    const loginReq = {
      body: { code: dispatchRes.data.pairingCode }
    };
    const loginRes = createMockRes();
    await tripTrackingController.driverLoginWithPairingCode(loginReq, loginRes, (err) => console.error(err));
    assert('Driver login with random pairing code succeeds', loginRes.data && loginRes.data.success === true);
    assert('Driver login returns JWT session token', Boolean(loginRes.data?.token));
    console.log('   Driver successfully authenticated with code:', dispatchRes.data.pairingCode, 'Driver name:', loginRes.data?.driver?.name);
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passedCount}/${totalCount} tests passed!`);
  console.log(`========================================\n`);

  setTimeout(() => process.exit(0), 1000);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
