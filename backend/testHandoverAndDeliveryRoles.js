const db = require('./database/databaseConnection');
const tripCtrl = require('./controllers/tripTrackingController');

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

async function runRoleSecurityTests() {
  console.log('🧪 Starting Driver Role Security & Handover/Delivery Verification Suite...');
  await db.ready;

  let passed = 0;
  let total = 0;

  function assert(name, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${extra}`);
    }
  }

  // 1. Test Driver Signaling Arrival at Pickup
  console.log('\n--- 1. Testing Driver Arrival Signal at Pickup ---');
  const reqSignal1 = {
    user: { id: 1, role: 'DRIVER', driverId: 1 },
    body: { tripId: 1, stage: 'ARRIVED_AT_PICKUP' },
    app: { get: () => ({ emit: () => {}, to: () => ({ emit: () => {} }) }) }
  };
  const resSignal1 = createMockRes();
  await tripCtrl.signalDriverArrival(reqSignal1, resSignal1, console.error);
  assert('Driver signal arrival at pickup succeeds', resSignal1.statusCode === 200 && resSignal1.data?.success === true);
  assert('Driver signal returns ARRIVED_AT_PICKUP stage', resSignal1.data?.stage === 'ARRIVED_AT_PICKUP');

  // 2. Test Driver Blocked from Authorizing COLLECTED Directly
  console.log('\n--- 2. Testing Driver Direct Handover Block ---');
  const reqDriverCollect = {
    user: { id: 1, role: 'DRIVER', driverId: 1 },
    body: { tripId: 1, stage: 'COLLECTED' },
    app: { get: () => ({ emit: () => {} }) }
  };
  const resDriverCollect = createMockRes();
  await tripCtrl.updateTripStage(reqDriverCollect, resDriverCollect, console.error);
  assert('Driver direct COLLECTED authorization is blocked with 403', resDriverCollect.statusCode === 403);
  assert('Error message instructs driver to await Donor handover', resDriverCollect.data?.message?.includes('Donor'));

  // 3. Test Donor Authorizing COLLECTED Handover
  console.log('\n--- 3. Testing Donor Handover Authorization ---');
  const reqDonorCollect = {
    user: { id: 1, role: 'DONOR', userId: 1 },
    body: { tripId: 1, stage: 'COLLECTED' },
    app: { get: () => ({ emit: () => {} }) }
  };
  const resDonorCollect = createMockRes();
  await tripCtrl.updateTripStage(reqDonorCollect, resDonorCollect, console.error);
  assert('Donor can successfully authorize food handover', resDonorCollect.statusCode === 200 && resDonorCollect.data?.success === true);

  // 4. Test Driver Signaling Arrival at Destination Hub
  console.log('\n--- 4. Testing Driver Arrival Signal at Destination Hub ---');
  const reqSignal2 = {
    user: { id: 1, role: 'DRIVER', driverId: 1 },
    body: { tripId: 1, stage: 'ARRIVED_AT_DESTINATION' },
    app: { get: () => ({ emit: () => {}, to: () => ({ emit: () => {} }) }) }
  };
  const resSignal2 = createMockRes();
  await tripCtrl.signalDriverArrival(reqSignal2, resSignal2, console.error);
  assert('Driver signal arrival at hub succeeds', resSignal2.statusCode === 200 && resSignal2.data?.success === true);
  assert('Driver signal returns ARRIVED_AT_DESTINATION stage', resSignal2.data?.stage === 'ARRIVED_AT_DESTINATION');

  // 5. Test Driver Blocked from Authorizing DELIVERED Directly
  console.log('\n--- 5. Testing Driver Direct Delivery Block ---');
  const reqDriverDeliver = {
    user: { id: 1, role: 'DRIVER', driverId: 1 },
    body: { tripId: 1, stage: 'DELIVERED' },
    app: { get: () => ({ emit: () => {} }) }
  };
  const resDriverDeliver = createMockRes();
  await tripCtrl.updateTripStage(reqDriverDeliver, resDriverDeliver, console.error);
  assert('Driver direct DELIVERED authorization is blocked with 403', resDriverDeliver.statusCode === 403);
  assert('Error message instructs driver to await NGO verification', resDriverDeliver.data?.message?.includes('NGO') || resDriverDeliver.data?.message?.includes('Facility'));

  // 6. Test NGO Authorizing DELIVERED (Food Received)
  console.log('\n--- 6. Testing NGO Delivery Receipt Authorization ---');
  const reqNgoDeliver = {
    user: { id: 2, role: 'NGO', userId: 2 },
    body: { tripId: 1, stage: 'DELIVERED' },
    app: { get: () => ({ emit: () => {} }) }
  };
  const resNgoDeliver = createMockRes();
  await tripCtrl.updateTripStage(reqNgoDeliver, resNgoDeliver, console.error);
  assert('NGO can successfully authorize delivery receipt', resNgoDeliver.statusCode === 200 && resNgoDeliver.data?.success === true);

  console.log('\n========================================');
  console.log(`Summary: ${passed}/${total} role security tests passed!`);
  console.log('========================================\n');

  process.exit(passed === total ? 0 : 1);
}

runRoleSecurityTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
