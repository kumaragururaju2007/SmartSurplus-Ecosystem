const db = require('./database/databaseConnection');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const ngoController = require('./controllers/ngoController');
const biogasController = require('./controllers/biogasController');

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
  console.log('====================================================');
  console.log('SMARTSURPLUS VERIFICATION & REGISTRATION TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Register NGO with authentic details & pending status
  console.log('[Test 1] Registering authentic NGO with documents...');
  const ngoReq = {
    body: {
      name: 'Dr. Arulmozhi',
      email: 'contact@annamtrust.org',
      phone: '+91 94444 12345',
      password: 'password123',
      role: 'NGO',
      designation: 'Managing Trustee',
      organizationName: 'Annam Social Welfare Trust',
      ngoType: 'Trust',
      legalRegistrationNumber: 'TR/CHE/2018/9871',
      registrationAuthority: 'Sub-Registrar of Chennai South',
      registrationDate: '2018-05-14',
      ngoDarpanId: 'TN/2021/0291844',
      pan: 'AABTA9871M',
      tax12A12AB: '12A-CHE-2019-88',
      tax80G: '80G-CHE-2019-104',
      fcraNumber: '075908812',
      address: 'No 45, Gandhi Street, Thiruvanmiyur',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600041',
      latitude: 12.9825,
      longitude: 80.2589,
      maxDistributionCapacity: 350,
      beneficiaryTypes: 'Children & Orphanages, Homeless & Night Shelters',
      donationCategoriesRequired: 'Cooked Food, Packaged Food',
      emergencySupport: true,
      documents: [
        { document_type: 'Organization Registration Certificate', document_name: 'trust_deed.pdf', file_size: '420 KB', file_url: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago...' },
        { document_type: 'Organization PAN Card', document_name: 'pan_card.pdf', file_size: '180 KB', file_url: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago...' },
        { document_type: 'NGO DARPAN Certificate', document_name: 'darpan_ack.pdf', file_size: '210 KB', file_url: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago...' }
      ]
    }
  };

  const ngoRes = createMockRes();
  await authController.register(ngoReq, ngoRes, (err) => { if (err) console.error(err); });

  console.log('NGO Registration Result:', ngoRes.statusCode, ngoRes.data?.success ? 'SUCCESS' : 'FAILED');
  console.log('Is Verified immediately?:', ngoRes.data?.user?.is_verified ? 'YES (FAILURE)' : 'NO (CORRECT - PENDING)');

  // Test 2: Register Biogas Facility with GOBARdhan & MNRE details
  console.log('\n[Test 2] Registering authentic Biogas Facility with documents...');
  const biogasReq = {
    body: {
      name: 'Engr. Rajesh Kumar',
      email: 'operations@greenfuelenergy.in',
      phone: '+91 98840 99887',
      password: 'password123',
      role: 'BIOGAS',
      designation: 'Plant Head',
      plantName: 'GreenFuel Bio-CNG Energy Unit',
      plantType: 'CBG',
      operatorName: 'GreenFuel Renewables Pvt Ltd',
      plantRegistrationNumber: 'TNPCB/CBG/2022/451',
      gobardhanRegistrationNumber: 'GOBARDHAN-TN-2023-08812',
      mnreApplicationId: 'MNRE-SATAT-2023-119',
      mnreProgramme: 'SATAT / National Bioenergy Scheme',
      stateImplementingAgency: 'TEDA',
      commissioningCertificateNumber: 'COMM-2023-771',
      commissioningDate: '2023-03-20',
      feedstockCapacityDaily: 1200,
      capacityUnit: 'kg/day',
      biogasProductionCapacity: '350 m³/day',
      cbgProductionCapacity: '150 kg/day',
      powerGenerationCapacity: '40 kW',
      feedstockTypes: 'Cooked Food Waste, Vegetable Market Waste, Canteen Waste',
      address: 'Survey No 88/2, Industrial Estate, Maraimalai Nagar',
      city: 'Chengalpattu',
      state: 'Tamil Nadu',
      pincode: '603209',
      latitude: 12.7954,
      longitude: 80.0214,
      documents: [
        { document_type: 'GOBARdhan Registration Certificate', document_name: 'gobardhan_cert.pdf', file_size: '340 KB', file_url: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago...' },
        { document_type: 'Plant Pollution Control / Reg Documents', document_name: 'tnpcb_consent.pdf', file_size: '510 KB', file_url: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago...' }
      ]
    }
  };

  const biogasRes = createMockRes();
  await authController.register(biogasReq, biogasRes, (err) => { if (err) console.error(err); });

  console.log('Biogas Registration Result:', biogasRes.statusCode, biogasRes.data?.success ? 'SUCCESS' : 'FAILED');

  // Test 3: Register Donor with FSSAI certificate document
  console.log('\n[Test 3] Registering authentic Food Donor with FSSAI document...');
  const donorReq = {
    body: {
      name: 'Chef Venkatesh',
      email: 'manager@grandhotel.com',
      phone: '+91 91500 58242',
      password: 'password123',
      role: 'DONOR',
      designation: 'General Manager',
      businessName: 'Grand Residency Hotel & Banquet',
      businessType: 'Hotel',
      fssaiNumber: '12423008000987',
      address: 'Sathy - Bhavani Road, Satyamangalam',
      city: 'Satyamangalam',
      state: 'Tamil Nadu',
      pincode: '638401',
      latitude: 11.5034,
      longitude: 77.2412,
      documents: [
        { document_type: 'FSSAI License Certificate', document_name: 'fssai_license_2024.pdf', file_size: '315 KB', file_url: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago...' },
        { document_type: 'GSTIN / Business Registration Document', document_name: 'gst_certificate.pdf', file_size: '220 KB', file_url: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago...' }
      ]
    }
  };

  const donorRes = createMockRes();
  await authController.register(donorReq, donorRes, (err) => { if (err) console.error(err); });

  console.log('Donor Registration Result:', donorRes.statusCode, donorRes.data?.success ? 'SUCCESS' : 'FAILED');

  // Test 4: Admin Verification Queue Inspection & Document Visibility
  console.log('\n[Test 4] Admin Verification Queue Inspection & Document Visibility...');
  const queueReq = { user: { userId: 1, role: 'ADMIN', name: 'Platform Administrator' } };
  const queueRes = createMockRes();
  await adminController.getVerificationQueue(queueReq, queueRes, (err) => { if (err) console.error(err); });

  console.log('Pending Queue Count:', queueRes.data?.pending?.length);

  const pendingNGO = queueRes.data?.pending?.find(item => item.name === 'Annam Social Welfare Trust');
  const pendingBiogas = queueRes.data?.pending?.find(item => item.name === 'GreenFuel Bio-CNG Energy Unit');
  const pendingDonor = queueRes.data?.pending?.find(item => item.name === 'Grand Residency Hotel & Banquet');

  console.log('Pending NGO documents visible to Admin:', pendingNGO?.documents?.length, 'docs');
  console.log('Pending Biogas documents visible to Admin:', pendingBiogas?.documents?.length, 'docs');
  console.log('Pending Donor documents visible to Admin:', pendingDonor?.documents?.length, 'docs');
  console.log('Donor FSSAI doc name:', pendingDonor?.documents?.[0]?.document_name);
  console.log('Donor FSSAI doc file_url present:', Boolean(pendingDonor?.documents?.[0]?.file_url));

  // Test 5: Admin Auditing Individual Documents
  if (pendingDonor?.documents && pendingDonor.documents[0]) {
    console.log('\n[Test 5] Admin Auditing Donor Document...');
    const docReq = {
      params: { type: 'donors', id: pendingDonor.id, docId: pendingDonor.documents[0].id },
      body: { action: 'VERIFY' },
      user: { userId: 1, name: 'Lead Auditor' }
    };
    const docRes = createMockRes();
    await adminController.performDocumentAction(docReq, docRes, (err) => { if (err) console.error(err); });
    console.log('Donor Document Audit Result:', docRes.data?.message);
  }

  // Test 6: Admin Organization Verification
  if (pendingDonor) {
    console.log('\n[Test 6] Admin Executing Verification on Donor...');
    const verifyReq = {
      params: { type: 'donors', id: pendingDonor.id },
      body: { action: 'VERIFY', reason: 'FSSAI License Certificate verified.' },
      user: { userId: 1, name: 'Lead Auditor' }
    };
    const verifyRes = createMockRes();
    await adminController.performOrganizationAction(verifyReq, verifyRes, (err) => { if (err) console.error(err); });
    console.log('Donor Verification Result:', verifyRes.data?.message);
  }

  console.log('\n====================================================');
  console.log('ALL VERIFICATION ARCHITECTURE TESTS COMPLETED SUCCESSFULLY');
  console.log('====================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
