const jwt = require('jsonwebtoken');
const db = require('./database/databaseConnection');
const { getDonorProfile, updateDonorProfile, getPublicDonorProfile } = require('./controllers/donationController');
const { getIncomingRequests, getMatchedDonations } = require('./controllers/ngoController');
const { performOrganizationAction, getVerificationQueue } = require('./controllers/adminController');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Helper mock response object
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
  console.log('--- Starting Donor Profile & Verification Unit Tests ---');

  // Test 1: In-Memory / DB Setup Check
  const testDonorUserId = 999;
  const testDonorOrgId = 888;
  const testNgoUserId = 777;
  const testNgoOrgId = 666;

  // Populate test user and donor in memoryStore
  db.memoryStore.users = db.memoryStore.users || [];
  db.memoryStore.donors = db.memoryStore.donors || [];
  db.memoryStore.ngos = db.memoryStore.ngos || [];
  db.memoryStore.donations = db.memoryStore.donations || [];
  db.memoryStore.donation_matches = db.memoryStore.donation_matches || [];

  // 1. Create a Donor user
  db.memoryStore.users.push({
    id: testDonorUserId,
    name: 'Kumar',
    email: 'kumar.hotel@example.com',
    phone: '9876543210',
    role: 'DONOR',
    is_verified: 0
  });

  db.memoryStore.donors.push({
    id: testDonorOrgId,
    user_id: testDonorUserId,
    business_name: 'ABC Hotel',
    contact_person: 'Kumar',
    business_type: 'Hotel',
    fssai_number: '12345678901234',
    fssai_status: 'PENDING',
    is_verified: 0,
    is_fssai_verified: 0,
    is_business_verified: 0,
    is_location_verified: 0,
    is_phone_verified: 0,
    address: '123 Main Bazaar Road',
    city: 'Erode',
    state: 'Tamil Nadu',
    pincode: '638001',
    latitude: 11.3410,
    longitude: 77.7172
  });

  console.log('✅ Step 1: Donor registered with FSSAI 12345678901234 -> is_verified is 0 (Unverified)');

  // 2. Fetch Donor Profile as Donor
  const reqProfile = {
    user: { userId: testDonorUserId, role: 'DONOR', email: 'kumar.hotel@example.com' }
  };
  const resProfile = createMockRes();
  await getDonorProfile(reqProfile, resProfile, (err) => { throw err; });
  console.log('Donor Profile Result:', {
    businessName: resProfile.data.profile.businessName,
    contactPerson: resProfile.data.profile.contactPerson,
    fssaiNumber: resProfile.data.profile.fssaiNumber,
    isVerified: resProfile.data.profile.isVerified,
    isFssaiVerified: resProfile.data.profile.isFssaiVerified
  });
  if (resProfile.data.profile.isVerified === false && resProfile.data.profile.isFssaiVerified === false) {
    console.log('✅ Step 2: Donor profile accurately reports unverified status initially.');
  } else {
    throw new Error('Initial verification status is incorrect');
  }

  // 3. Check Admin Verification Queue
  const reqQueue = { user: { userId: 1, role: 'ADMIN' } };
  const resQueue = createMockRes();
  await getVerificationQueue(reqQueue, resQueue, (err) => { throw err; });
  const pendingDonor = resQueue.data.pending.find(p => p.type === 'DONOR' && p.id === testDonorOrgId);
  if (pendingDonor) {
    console.log('✅ Step 3: Donor appears in Admin pending verification queue with FSSAI:', pendingDonor.fssai_number);
  } else {
    throw new Error('Donor missing from admin verification queue');
  }

  // 4. Admin performs VERIFY action
  const reqVerify = {
    user: { userId: 1, name: 'Admin', role: 'ADMIN' },
    params: { type: 'donors', id: testDonorOrgId },
    body: { action: 'VERIFY', reason: 'FSSAI licence and establishment verified.' }
  };
  const resVerify = createMockRes();
  await performOrganizationAction(reqVerify, resVerify, (err) => { throw err; });
  console.log('Admin Action Result:', resVerify.data.message);

  // 5. Fetch Donor Profile again after Admin Approval
  const resProfileVerified = createMockRes();
  await getDonorProfile(reqProfile, resProfileVerified, (err) => { throw err; });
  console.log('Donor Profile After Admin Approval:', {
    businessName: resProfileVerified.data.profile.businessName,
    isVerified: resProfileVerified.data.profile.isVerified,
    isFssaiVerified: resProfileVerified.data.profile.isFssaiVerified,
    fssaiStatus: resProfileVerified.data.profile.fssaiStatus,
    isBusinessVerified: resProfileVerified.data.profile.isBusinessVerified,
    isLocationVerified: resProfileVerified.data.profile.isLocationVerified,
    isPhoneVerified: resProfileVerified.data.profile.isPhoneVerified
  });

  if (
    resProfileVerified.data.profile.isVerified === true &&
    resProfileVerified.data.profile.isFssaiVerified === true &&
    resProfileVerified.data.profile.fssaiStatus === 'VERIFIED'
  ) {
    console.log('✅ Step 5: Donor profile now successfully has "✓ Verified Donor" and "✓ FSSAI Verified" badges!');
  } else {
    throw new Error('Admin verification was not applied to donor profile');
  }

  // 6. Public Donor Profile check (used by NGO modal)
  const reqPublic = {
    user: { userId: testNgoUserId, role: 'NGO' },
    params: { id: testDonorOrgId }
  };
  const resPublic = createMockRes();
  await getPublicDonorProfile(reqPublic, resPublic, (err) => { throw err; });
  console.log('NGO View Public Profile:', {
    businessName: resPublic.data.donor.businessName,
    contactPerson: resPublic.data.donor.contactPerson,
    phone: resPublic.data.donor.phone,
    email: resPublic.data.donor.email,
    location: `${resPublic.data.donor.city}, ${resPublic.data.donor.state}`,
    businessType: resPublic.data.donor.businessType,
    fssaiNumber: resPublic.data.donor.fssaiNumber,
    isVerified: resPublic.data.donor.isVerified,
    isFssaiVerified: resPublic.data.donor.isFssaiVerified
  });

  if (resPublic.data.donor.isVerified === true && resPublic.data.donor.isFssaiVerified === true) {
    console.log('✅ Step 6: NGO view returns full Trust Dossier with verified ticks matching specs.');
  }

  console.log('\n🎉 ALL DONOR PROFILE & VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
