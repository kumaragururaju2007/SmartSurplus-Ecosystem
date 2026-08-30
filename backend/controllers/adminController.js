const db = require('../database/databaseConnection');

// Helper to record audit log entries
const logAdminAction = async ({ adminId, adminName, action, targetType, targetId, targetName, reason, previousStatus, newStatus }) => {
  try {
    const timestamp = new Date();
    if (db.isConnected) {
      await db.query(
        `INSERT INTO audit_logs (admin_id, admin_name, action, target_type, target_id, target_name, reason, previous_status, new_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [adminId || null, adminName || 'System Admin', action, targetType, targetId || null, targetName || 'N/A', reason || 'Administrative action', previousStatus || 'N/A', newStatus || 'N/A', timestamp]
      );
    } else {
      if (!db.memoryStore.audit_logs) db.memoryStore.audit_logs = [];
      db.memoryStore.audit_logs.unshift({
        id: db.memoryStore.audit_logs.length + 1,
        admin_id: adminId || 1,
        admin_name: adminName || 'System Admin',
        action,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName || 'N/A',
        reason: reason || 'Administrative action',
        previous_status: previousStatus || 'N/A',
        new_status: newStatus || 'N/A',
        created_at: timestamp.toISOString()
      });
    }
  } catch (err) {
    console.error('Audit Log recording error:', err.message);
  }
};

// Coordinate validator
const isValidCoordinate = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90 &&
         !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};

// ==========================================
// 1. DASHBOARD OVERVIEW SUMMARY
// ==========================================
// ==========================================
// 1. DASHBOARD OVERVIEW SUMMARY
// ==========================================
const getDashboardSummary = async (req, res, next) => {
  try {
    let summary = {
      totalDonors: 0,
      totalNGOs: 0,
      totalBiogasPlants: 0,
      pendingVerifications: 0,
      verifiedOrganizations: 0,
      suspendedOrganizations: 0,
      rejectedOrganizations: 0,
      // Granular Verification Breakdowns
      pendingNGOs: 0,
      verifiedNGOs: 0,
      rejectedNGOs: 0,
      suspendedNGOs: 0,
      pendingBiogas: 0,
      verifiedBiogas: 0,
      rejectedBiogas: 0,
      suspendedBiogas: 0,
      pendingDonors: 0,
      verifiedDonors: 0,
      rejectedDonors: 0,
      suspendedDonors: 0,
      activeDonations: 0,
      activeMatches: 0,
      foodInTransit: 0,
      completedDeliveries: 0,
      totalFoodDonated: 0,
      totalFoodDelivered: 0,
      foodRedirectedToBiogas: 0,
      totalBeneficiariesReached: 0,
      recentActivity: []
    };

    if (db.isConnected) {
      const [uRows] = await db.query('SELECT role, is_verified, created_at FROM users');
      summary.totalDonors = uRows.filter(u => u.role === 'DONOR').length;
      summary.totalNGOs = uRows.filter(u => u.role === 'NGO').length;
      summary.totalBiogasPlants = uRows.filter(u => u.role === 'BIOGAS').length;

      const [dRows] = await db.query('SELECT id, is_verified, is_available, verification_status FROM donors');
      const [nRows] = await db.query('SELECT id, is_verified, is_available, verification_status FROM ngos');
      const [bRows] = await db.query('SELECT id, is_verified, is_available, verification_status FROM biogas_plants');

      // NGO status counts
      summary.verifiedNGOs = nRows.filter(n => n.is_verified && n.is_available).length;
      summary.suspendedNGOs = nRows.filter(n => !n.is_available).length;
      summary.rejectedNGOs = nRows.filter(n => !n.is_verified && !n.is_available && n.verification_status === 'REJECTED').length;
      summary.pendingNGOs = nRows.filter(n => !n.is_verified && n.is_available && n.verification_status !== 'REJECTED').length;

      // Biogas status counts
      summary.verifiedBiogas = bRows.filter(b => b.is_verified && b.is_available).length;
      summary.suspendedBiogas = bRows.filter(b => !b.is_available).length;
      summary.rejectedBiogas = bRows.filter(b => !b.is_verified && !b.is_available && b.verification_status === 'REJECTED').length;
      summary.pendingBiogas = bRows.filter(b => !b.is_verified && b.is_available && b.verification_status !== 'REJECTED').length;

      // Donor status counts
      summary.verifiedDonors = dRows.filter(d => d.is_verified && d.is_available).length;
      summary.suspendedDonors = dRows.filter(d => !d.is_available).length;
      summary.rejectedDonors = dRows.filter(d => !d.is_verified && !d.is_available && d.verification_status === 'REJECTED').length;
      summary.pendingDonors = dRows.filter(d => !d.is_verified && d.is_available && d.verification_status !== 'REJECTED').length;

      summary.pendingVerifications = summary.pendingNGOs + summary.pendingBiogas + summary.pendingDonors;
      summary.verifiedOrganizations = summary.verifiedNGOs + summary.verifiedBiogas + summary.verifiedDonors;
      summary.suspendedOrganizations = summary.suspendedNGOs + summary.suspendedBiogas + summary.suspendedDonors;
      summary.rejectedOrganizations = summary.rejectedNGOs + summary.rejectedBiogas + summary.rejectedDonors;

      const [donRows] = await db.query('SELECT id, quantity, status FROM donations');
      summary.activeDonations = donRows.filter(d => ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT'].includes(d.status)).length;
      summary.foodInTransit = donRows.filter(d => ['PICKUP_STARTED', 'IN_TRANSIT', 'COLLECTED'].includes(d.status)).length;
      summary.completedDeliveries = donRows.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status)).length;

      summary.totalFoodDonated = donRows.reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);
      summary.totalFoodDelivered = donRows.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status)).reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);
      summary.foodRedirectedToBiogas = donRows.filter(d => d.status === 'REDIRECTED_TO_BIOGAS').reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);

      const [mRows] = await db.query("SELECT id FROM donation_matches WHERE match_status IN ('OFFERED', 'ACCEPTED')");
      const [bmRows] = await db.query("SELECT id FROM biogas_matches WHERE match_status IN ('OFFERED', 'ACCEPTED')");
      summary.activeMatches = mRows.length + bmRows.length;

      const [distRows] = await db.query('SELECT SUM(beneficiaries_served) as total_served FROM distributions');
      summary.totalBeneficiariesReached = distRows[0]?.total_served ? parseInt(distRows[0].total_served, 10) : Math.round(summary.totalFoodDelivered * 2);

      const [logs] = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5');
      summary.recentActivity = logs;
    } else {
      const users = db.memoryStore.users || [];
      summary.totalDonors = users.filter(u => u.role === 'DONOR').length;
      summary.totalNGOs = users.filter(u => u.role === 'NGO').length;
      summary.totalBiogasPlants = users.filter(u => u.role === 'BIOGAS').length;

      const donors = db.memoryStore.donors || [];
      const ngos = db.memoryStore.ngos || [];
      const biogas = db.memoryStore.biogas_plants || [];

      summary.verifiedNGOs = ngos.filter(n => n.is_verified && (n.is_available !== 0 && n.is_available !== false)).length;
      summary.suspendedNGOs = ngos.filter(n => n.is_available === 0 || n.is_available === false).length;
      summary.rejectedNGOs = ngos.filter(n => !n.is_verified && (n.verification_status === 'REJECTED' || n.is_available === 0)).length;
      summary.pendingNGOs = ngos.filter(n => !n.is_verified && n.verification_status !== 'REJECTED' && (n.is_available !== 0 && n.is_available !== false)).length;

      summary.verifiedBiogas = biogas.filter(b => b.is_verified && (b.is_available !== 0 && b.is_available !== false)).length;
      summary.suspendedBiogas = biogas.filter(b => b.is_available === 0 || b.is_available === false).length;
      summary.rejectedBiogas = biogas.filter(b => !b.is_verified && (b.verification_status === 'REJECTED' || b.is_available === 0)).length;
      summary.pendingBiogas = biogas.filter(b => !b.is_verified && b.verification_status !== 'REJECTED' && (b.is_available !== 0 && b.is_available !== false)).length;

      summary.verifiedDonors = donors.filter(d => d.is_verified).length;
      summary.pendingDonors = donors.filter(d => !d.is_verified).length;

      summary.pendingVerifications = summary.pendingNGOs + summary.pendingBiogas + summary.pendingDonors;
      summary.verifiedOrganizations = summary.verifiedNGOs + summary.verifiedBiogas + summary.verifiedDonors;
      summary.suspendedOrganizations = summary.suspendedNGOs + summary.suspendedBiogas + summary.suspendedDonors;
      summary.rejectedOrganizations = summary.rejectedNGOs + summary.rejectedBiogas + summary.rejectedDonors;

      const donations = db.memoryStore.donations || [];
      summary.activeDonations = donations.filter(d => ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT'].includes(d.status)).length;
      summary.foodInTransit = donations.filter(d => ['PICKUP_STARTED', 'IN_TRANSIT', 'COLLECTED'].includes(d.status)).length;
      summary.completedDeliveries = donations.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status)).length;

      summary.totalFoodDonated = donations.reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);
      summary.totalFoodDelivered = donations.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status)).reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);
      summary.foodRedirectedToBiogas = donations.filter(d => d.status === 'REDIRECTED_TO_BIOGAS').reduce((acc, d) => acc + (parseFloat(d.quantity) || 0), 0);

      const dMatches = db.memoryStore.donation_matches || [];
      const bMatches = db.memoryStore.biogas_matches || [];
      summary.activeMatches = dMatches.filter(m => ['OFFERED', 'ACCEPTED'].includes(m.match_status)).length + bMatches.filter(m => ['OFFERED', 'ACCEPTED'].includes(m.match_status)).length;

      const distributions = db.memoryStore.distributions || [];
      summary.totalBeneficiariesReached = distributions.reduce((acc, dist) => acc + (parseInt(dist.beneficiaries_served, 10) || 0), 0) || Math.round(summary.totalFoodDelivered * 2);

      summary.recentActivity = (db.memoryStore.audit_logs || []).slice(0, 5);
    }

    return res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. ORGANIZATIONS MANAGEMENT
// ==========================================
const getOrganizations = async (req, res, next) => {
  try {
    const { type, search, status } = req.query; // type: 'donors' | 'ngos' | 'biogas'

    let donors = [];
    let ngos = [];
    let biogasPlants = [];

    if (db.isConnected) {
      if (!type || type === 'donors') {
        const [dRows] = await db.query(`
          SELECT d.id, d.user_id, d.business_name, d.contact_person, d.business_type, d.fssai_number, d.fssai_status,
                 COALESCE(d.is_fssai_verified, FALSE) as is_fssai_verified,
                 COALESCE(d.is_business_verified, FALSE) as is_business_verified,
                 COALESCE(d.is_location_verified, FALSE) as is_location_verified,
                 COALESCE(d.is_phone_verified, FALSE) as is_phone_verified,
                 d.address, d.city, d.state, d.pincode, d.latitude, d.longitude, d.created_at,
                 u.name, u.email, u.phone, COALESCE(d.is_verified, u.is_verified, FALSE) as is_verified,
                 (SELECT COUNT(*) FROM donations WHERE donor_id = d.id) as total_donations,
                 (SELECT COUNT(*) FROM donations WHERE donor_id = d.id AND status IN ('POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT')) as active_donations,
                 (SELECT COUNT(*) FROM donations WHERE donor_id = d.id AND status IN ('DELIVERED', 'COMPLETED')) as completed_donations,
                 (SELECT COUNT(*) FROM organization_documents WHERE organization_type = 'DONOR' AND organization_id = d.id) as documents_count,
                 (SELECT MAX(created_at) FROM donations WHERE donor_id = d.id) as last_activity
          FROM donors d
          JOIN users u ON d.user_id = u.id
          ORDER BY d.created_at DESC
        `);
        donors = dRows.map(r => ({
          ...r,
          account_status: r.is_verified ? 'ACTIVE' : 'PENDING'
        }));
      }

      if (!type || type === 'ngos') {
        const [nRows] = await db.query(`
          SELECT n.id, n.user_id, n.organization_name, n.ngo_type,
                 COALESCE(n.legal_registration_number, n.registration_number) as legal_registration_number,
                 n.registration_number, n.registration_authority, n.registration_date,
                 n.ngo_darpan_id, n.darpan_status, n.pan, n.tax_12a_12ab, n.tax_80g, n.fcra_number, n.fcra_status,
                 n.contact_person, n.designation, n.official_website, n.official_email, n.official_phone,
                 n.year_established, n.description, n.address, n.city, n.state, n.pincode,
                 n.latitude, n.longitude, n.food_capacity, n.max_distribution_capacity, n.meals_per_day,
                 n.service_areas, n.beneficiary_types, n.donation_categories_required,
                 n.operating_days, n.operating_hours, n.emergency_support,
                 COALESCE(n.verification_status, CASE WHEN n.is_verified THEN 'VERIFIED' ELSE 'PENDING' END) as verification_status,
                 n.verification_reason, n.verified_by, n.verified_at,
                 n.is_available, n.is_verified, n.response_rate, n.created_at,
                 u.name, u.email, u.phone,
                 (SELECT COUNT(*) FROM donation_matches WHERE ngo_id = n.id AND match_status = 'ACCEPTED') as donations_received,
                 (SELECT COUNT(*) FROM donation_matches WHERE ngo_id = n.id AND match_status = 'OFFERED') as active_matches,
                 (SELECT COUNT(*) FROM distributions WHERE ngo_id = n.id) as completed_distributions,
                 (SELECT COALESCE(SUM(beneficiaries_served), 0) FROM distributions WHERE ngo_id = n.id) as beneficiaries_served,
                 (SELECT COUNT(*) FROM organization_documents WHERE organization_type = 'NGO' AND organization_id = n.id) as documents_count,
                 n.created_at as last_activity
          FROM ngos n
          JOIN users u ON n.user_id = u.id
          ORDER BY n.created_at DESC
        `);
        ngos = nRows.map(r => ({
          ...r,
          account_status: !r.is_available ? 'SUSPENDED' : (r.is_verified ? 'ACTIVE' : 'PENDING')
        }));
      }

      if (!type || type === 'biogas') {
        const [bRows] = await db.query(`
          SELECT b.id, b.user_id, b.plant_name, b.plant_type, b.operator_name,
                 b.plant_registration_number, b.gobardhan_registration_number, b.gobardhan_status,
                 b.mnre_application_id, b.mnre_programme, b.state_implementing_agency,
                 b.commissioning_certificate_number, b.commissioning_date,
                 b.contact_person, b.designation, b.operating_status,
                 b.feedstock_capacity_daily, b.processing_capacity, b.capacity_unit,
                 b.biogas_production_capacity, b.cbg_production_capacity, b.power_generation_capacity,
                 b.waste_processing_capacity, b.feedstock_types,
                 b.address, b.city, b.state, b.pincode, b.latitude, b.longitude,
                 COALESCE(b.verification_status, CASE WHEN b.is_verified THEN 'VERIFIED' ELSE 'PENDING' END) as verification_status,
                 b.verification_reason, b.verified_by, b.verified_at,
                 b.is_available, b.is_verified, b.created_at,
                 u.name, u.email, u.phone,
                 (SELECT COUNT(*) FROM biogas_matches WHERE biogas_plant_id = b.id) as waste_received_count,
                 (SELECT COALESCE(SUM(d.quantity), 0) FROM biogas_matches bm JOIN donations d ON bm.donation_id = d.id WHERE bm.biogas_plant_id = b.id AND bm.match_status = 'COMPLETED') as waste_processed_kg,
                 (SELECT COUNT(*) FROM organization_documents WHERE organization_type = 'BIOGAS' AND organization_id = b.id) as documents_count,
                 b.created_at as last_activity
          FROM biogas_plants b
          JOIN users u ON b.user_id = u.id
          ORDER BY b.created_at DESC
        `);
        biogasPlants = bRows.map(r => ({
          ...r,
          account_status: !r.is_available ? 'SUSPENDED' : (r.is_verified ? 'ACTIVE' : 'PENDING'),
          energy_generated_kwh: (r.waste_processed_kg * 0.45).toFixed(2)
        }));
      }
    } else {
      const users = db.memoryStore.users || [];
      const donations = db.memoryStore.donations || [];
      const donationMatches = db.memoryStore.donation_matches || [];
      const distributions = db.memoryStore.distributions || [];
      const biogasMatches = db.memoryStore.biogas_matches || [];
      const docs = db.memoryStore.organization_documents || [];

      if (!type || type === 'donors') {
        donors = (db.memoryStore.donors || []).map(d => {
          const u = users.find(usr => usr.id === d.user_id) || {};
          const userDonations = donations.filter(don => don.donor_id === d.id);
          const isVer = Boolean(d.is_verified || u.is_verified);
          const isFssai = Boolean(d.is_fssai_verified);
          const entityDocs = docs.filter(doc => doc.organization_type === 'DONOR' && doc.organization_id === d.id);
          return {
            ...d,
            name: d.business_name || u.name || 'Food Donor',
            contact_person: d.contact_person || u.name || '',
            business_type: d.business_type || 'Restaurant',
            fssai_number: d.fssai_number || '',
            fssai_status: d.fssai_status || (isFssai ? 'VERIFIED' : 'PENDING'),
            is_fssai_verified: isFssai,
            is_business_verified: Boolean(d.is_business_verified || (isVer && isFssai)),
            is_location_verified: Boolean(d.is_location_verified || isVer),
            is_phone_verified: Boolean(d.is_phone_verified || isVer),
            city: d.city || null,
            state: d.state || null,
            pincode: d.pincode || null,
            email: u.email,
            phone: u.phone,
            is_verified: isVer ? 1 : 0,
            account_status: isVer ? 'ACTIVE' : 'PENDING',
            total_donations: userDonations.length,
            active_donations: userDonations.filter(don => ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT'].includes(don.status)).length,
            completed_donations: userDonations.filter(don => ['DELIVERED', 'COMPLETED'].includes(don.status)).length,
            documents_count: entityDocs.length,
            last_activity: userDonations[userDonations.length - 1]?.created_at || d.created_at || new Date().toISOString()
          };
        });
      }

      if (!type || type === 'ngos') {
        ngos = (db.memoryStore.ngos || []).map(n => {
          const u = users.find(usr => usr.id === n.user_id) || {};
          const matches = donationMatches.filter(m => m.ngo_id === n.id);
          const dists = distributions.filter(dist => dist.ngo_id === n.id);
          const entityDocs = docs.filter(doc => doc.organization_type === 'NGO' && doc.organization_id === n.id);
          const isVer = Boolean(n.is_verified);
          const isAvail = n.is_available !== 0 && n.is_available !== false;
          return {
            ...n,
            name: u.name || n.organization_name,
            email: u.email,
            phone: u.phone,
            verification_status: n.verification_status || (isVer ? 'VERIFIED' : 'PENDING'),
            account_status: !isAvail ? 'SUSPENDED' : (isVer ? 'ACTIVE' : 'PENDING'),
            donations_received: matches.filter(m => m.match_status === 'ACCEPTED').length,
            active_matches: matches.filter(m => m.match_status === 'OFFERED').length,
            completed_distributions: dists.length,
            beneficiaries_served: dists.reduce((sum, d) => sum + (parseInt(d.beneficiaries_served, 10) || 0), 0),
            documents_count: entityDocs.length,
            last_activity: n.created_at || new Date().toISOString()
          };
        });
      }

      if (!type || type === 'biogas') {
        biogasPlants = (db.memoryStore.biogas_plants || []).map(b => {
          const u = users.find(usr => usr.id === b.user_id) || {};
          const bMatches = biogasMatches.filter(m => m.biogas_plant_id === b.id);
          const wasteProcessed = bMatches.filter(m => m.match_status === 'COMPLETED').length * 40;
          const entityDocs = docs.filter(doc => doc.organization_type === 'BIOGAS' && doc.organization_id === b.id);
          const isVer = Boolean(b.is_verified);
          const isAvail = b.is_available !== 0 && b.is_available !== false;
          return {
            ...b,
            name: u.name || b.plant_name,
            email: u.email,
            phone: u.phone,
            verification_status: b.verification_status || (isVer ? 'VERIFIED' : 'PENDING'),
            account_status: !isAvail ? 'SUSPENDED' : (isVer ? 'ACTIVE' : 'PENDING'),
            waste_received_count: bMatches.length,
            waste_processed_kg: wasteProcessed,
            energy_generated_kwh: (wasteProcessed * 0.45).toFixed(2),
            documents_count: entityDocs.length,
            last_activity: b.created_at || new Date().toISOString()
          };
        });
      }
    }

    return res.json({
      success: true,
      donors,
      ngos,
      biogasPlants
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. ORGANIZATION DETAILS & PLATFORM ACTIVITY
// ==========================================
const getOrganizationDetails = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const entityId = Number(id);

    let details = null;
    let documents = [];
    let activityHistory = [];
    let auditLogs = [];

    if (db.isConnected) {
      if (type === 'donors') {
        const [dRows] = await db.query(`
          SELECT d.*, u.name, u.email, u.phone, u.is_verified, u.created_at as registration_date
          FROM donors d JOIN users u ON d.user_id = u.id WHERE d.id = ?
        `, [entityId]);
        details = dRows[0] || null;

        if (details) {
          const [donations] = await db.query(`
            SELECT d.*, m.match_status, ngo.organization_name as ngo_name
            FROM donations d
            LEFT JOIN donation_matches m ON d.id = m.donation_id
            LEFT JOIN ngos ngo ON m.ngo_id = ngo.id
            WHERE d.donor_id = ?
            ORDER BY d.created_at DESC
          `, [entityId]);
          activityHistory = donations;

          const [docRows] = await db.query('SELECT * FROM organization_documents WHERE organization_type = "DONOR" AND organization_id = ?', [entityId]);
          documents = docRows;
        }
      } else if (type === 'ngos') {
        const [nRows] = await db.query(`
          SELECT n.*, u.name, u.email, u.phone, u.is_verified, u.created_at as registration_date
          FROM ngos n JOIN users u ON n.user_id = u.id WHERE n.id = ?
        `, [entityId]);
        details = nRows[0] || null;

        if (details) {
          const [matches] = await db.query(`
            SELECT m.*, d.food_name, d.food_category, d.quantity, d.quantity_unit, d.pickup_address, d.status as donation_status,
                   donor.business_name as donor_name
            FROM donation_matches m
            JOIN donations d ON m.donation_id = d.id
            JOIN donors donor ON d.donor_id = donor.id
            WHERE m.ngo_id = ?
            ORDER BY m.created_at DESC
          `, [entityId]);
          activityHistory = matches;

          const [docRows] = await db.query('SELECT * FROM organization_documents WHERE organization_type = "NGO" AND organization_id = ?', [entityId]);
          documents = docRows;
        }
      } else if (type === 'biogas') {
        const [bRows] = await db.query(`
          SELECT b.*, u.name, u.email, u.phone, u.is_verified, u.created_at as registration_date
          FROM biogas_plants b JOIN users u ON b.user_id = u.id WHERE b.id = ?
        `, [entityId]);
        details = bRows[0] || null;

        if (details) {
          const [bMatches] = await db.query(`
            SELECT bm.*, d.food_name, d.quantity, d.quantity_unit, d.pickup_address, d.status as donation_status,
                   donor.business_name as donor_name
            FROM biogas_matches bm
            JOIN donations d ON bm.donation_id = d.id
            JOIN donors donor ON d.donor_id = donor.id
            WHERE bm.biogas_plant_id = ?
            ORDER BY bm.created_at DESC
          `, [entityId]);
          activityHistory = bMatches;

          const [docRows] = await db.query('SELECT * FROM organization_documents WHERE organization_type = "BIOGAS" AND organization_id = ?', [entityId]);
          documents = docRows;
        }
      }

      if (details) {
        const [logs] = await db.query(`
          SELECT * FROM audit_logs 
          WHERE target_type = ? AND target_id = ?
          ORDER BY created_at DESC
        `, [type.toUpperCase().slice(0, -1), entityId]);
        auditLogs = logs;
      }
    } else {
      const users = db.memoryStore.users || [];
      const allDocs = db.memoryStore.organization_documents || [];

      if (type === 'donors') {
        const d = (db.memoryStore.donors || []).find(dr => Number(dr.id) === entityId);
        if (d) {
          const u = users.find(usr => usr.id === d.user_id) || {};
          const isVer = Boolean(d.is_verified || u.is_verified);
          const isFssai = Boolean(d.is_fssai_verified);
          details = {
            ...d,
            name: d.business_name || u.name || 'Food Donor',
            contact_person: d.contact_person || u.name || '',
            business_type: d.business_type || 'Hotel',
            fssai_number: d.fssai_number || '',
            fssai_status: d.fssai_status || (isFssai ? 'VERIFIED' : 'PENDING'),
            is_fssai_verified: isFssai ? 1 : 0,
            is_business_verified: Boolean(d.is_business_verified || (isVer && isFssai)) ? 1 : 0,
            is_location_verified: Boolean(d.is_location_verified || isVer) ? 1 : 0,
            is_phone_verified: Boolean(d.is_phone_verified || isVer) ? 1 : 0,
            city: d.city || null,
            state: d.state || null,
            pincode: d.pincode || null,
            email: u.email,
            phone: u.phone,
            is_verified: isVer ? 1 : 0,
            verification_status: isVer ? 'VERIFIED' : 'PENDING',
            registration_date: d.created_at
          };
          activityHistory = (db.memoryStore.donations || []).filter(don => don.donor_id === entityId);
          documents = allDocs.filter(doc => doc.organization_type === 'DONOR' && Number(doc.organization_id) === entityId);
        }
      } else if (type === 'ngos') {
        const n = (db.memoryStore.ngos || []).find(ngo => Number(ngo.id) === entityId);
        if (n) {
          const u = users.find(usr => usr.id === n.user_id) || {};
          details = {
            ...n,
            name: u.name,
            email: u.email,
            phone: u.phone,
            verification_status: n.verification_status || (n.is_verified ? 'VERIFIED' : 'PENDING'),
            registration_date: n.created_at
          };
          activityHistory = (db.memoryStore.donation_matches || []).filter(m => m.ngo_id === entityId);
          documents = allDocs.filter(doc => doc.organization_type === 'NGO' && Number(doc.organization_id) === entityId);
        }
      } else if (type === 'biogas') {
        const b = (db.memoryStore.biogas_plants || []).find(bio => Number(bio.id) === entityId);
        if (b) {
          const u = users.find(usr => usr.id === b.user_id) || {};
          details = {
            ...b,
            name: u.name,
            email: u.email,
            phone: u.phone,
            verification_status: b.verification_status || (b.is_verified ? 'VERIFIED' : 'PENDING'),
            registration_date: b.created_at
          };
          activityHistory = (db.memoryStore.biogas_matches || []).filter(m => m.biogas_plant_id === entityId);
          documents = allDocs.filter(doc => doc.organization_type === 'BIOGAS' && Number(doc.organization_id) === entityId);
        }
      }

      auditLogs = (db.memoryStore.audit_logs || []).filter(l => l.target_id === entityId);
    }

    if (!details) {
      return res.status(404).json({ success: false, message: 'Organization details not found.' });
    }

    return res.json({
      success: true,
      details: {
        ...details,
        documents
      },
      activityHistory,
      auditLogs
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. ADMIN ACTIONS (VERIFY / REJECT / SUSPEND / REACTIVATE / REMOVE)
// ==========================================
const performOrganizationAction = async (req, res, next) => {
  try {
    const { type, id } = req.params; // 'donors' | 'ngos' | 'biogas'
    const { action, reason } = req.body; // 'VERIFY' | 'REJECT' | 'SUSPEND' | 'REACTIVATE' | 'REMOVE'
    const entityId = Number(id);
    const adminUser = req.user || { userId: 1, name: 'Platform System Administrator' };

    const validActions = ['VERIFY', 'REJECT', 'SUSPEND', 'REACTIVATE', 'REMOVE'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: `Invalid action: ${action}` });
    }

    if ((action === 'REJECT' || action === 'SUSPEND') && (!reason || !reason.trim())) {
      return res.status(400).json({ success: false, message: `A valid explanation/reason is required to ${action.toLowerCase()} an organization.` });
    }

    let targetName = 'Organization';
    let targetType = type === 'donors' ? 'DONOR' : type === 'ngos' ? 'NGO' : 'BIOGAS';
    let previousStatus = 'PENDING';

    const isVerifiedBool = action === 'VERIFY' || action === 'REACTIVATE';
    const isAvailableBool = action !== 'SUSPEND' && action !== 'REMOVE' && action !== 'REJECT';
    const newVerificationStatus = action === 'VERIFY' ? 'VERIFIED' : action === 'REJECT' ? 'REJECTED' : action === 'SUSPEND' ? 'SUSPENDED' : 'VERIFIED';
    const currentTimestamp = new Date();

    if (db.isConnected) {
      let tableName = type === 'donors' ? 'donors' : type === 'ngos' ? 'ngos' : 'biogas_plants';
      const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [entityId]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Entity not found.' });
      }
      const entity = rows[0];
      targetName = entity.organization_name || entity.plant_name || entity.business_name || 'Organization';
      previousStatus = entity.verification_status || (entity.is_verified ? 'VERIFIED' : 'PENDING');

      if (type === 'ngos') {
        await db.query(
          `UPDATE ngos 
           SET is_verified = ?, 
               is_available = ?, 
               verification_status = ?, 
               verification_reason = ?, 
               verified_by = ?, 
               verified_at = ? 
           WHERE id = ?`,
          [isVerifiedBool, isAvailableBool, newVerificationStatus, reason || null, adminUser.name || 'Platform Administrator', isVerifiedBool ? currentTimestamp : null, entityId]
        );
        await db.query('UPDATE users SET is_verified = ? WHERE id IN (SELECT user_id FROM ngos WHERE id = ?)', [isVerifiedBool, entityId]);
        if (action === 'VERIFY') {
          await db.query("UPDATE organization_documents SET status = 'VERIFIED', verified_by = ?, verified_at = ? WHERE organization_type = 'NGO' AND organization_id = ? AND status = 'UPLOADED'", [adminUser.name, currentTimestamp, entityId]);
        }
      } else if (type === 'biogas') {
        await db.query(
          `UPDATE biogas_plants 
           SET is_verified = ?, 
               is_available = ?, 
               verification_status = ?, 
               verification_reason = ?, 
               verified_by = ?, 
               verified_at = ? 
           WHERE id = ?`,
          [isVerifiedBool, isAvailableBool, newVerificationStatus, reason || null, adminUser.name || 'Platform Administrator', isVerifiedBool ? currentTimestamp : null, entityId]
        );
        await db.query('UPDATE users SET is_verified = ? WHERE id IN (SELECT user_id FROM biogas_plants WHERE id = ?)', [isVerifiedBool, entityId]);
        if (action === 'VERIFY') {
          await db.query("UPDATE organization_documents SET status = 'VERIFIED', verified_by = ?, verified_at = ? WHERE organization_type = 'BIOGAS' AND organization_id = ? AND status = 'UPLOADED'", [adminUser.name, currentTimestamp, entityId]);
        }
      } else if (type === 'donors') {
        const fssaiStatus = isVerifiedBool ? 'VERIFIED' : (action === 'REJECT' ? 'REJECTED' : 'PENDING');
        await db.query(
          `UPDATE donors 
           SET is_verified = ?, 
               is_fssai_verified = ?, 
               is_business_verified = ?, 
               is_location_verified = ?, 
               is_phone_verified = ?, 
               fssai_status = ? 
           WHERE id = ?`,
          [isVerifiedBool, isVerifiedBool, isVerifiedBool, isVerifiedBool, isVerifiedBool, fssaiStatus, entityId]
        );
        await db.query('UPDATE users SET is_verified = ? WHERE id IN (SELECT user_id FROM donors WHERE id = ?)', [isVerifiedBool, entityId]);
      }
    } else {
      let list = type === 'donors' ? db.memoryStore.donors : type === 'ngos' ? db.memoryStore.ngos : db.memoryStore.biogas_plants;
      const item = (list || []).find(el => Number(el.id) === entityId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Entity not found.' });
      }
      targetName = item.organization_name || item.plant_name || item.business_name || 'Organization';
      previousStatus = item.verification_status || (item.is_verified ? 'VERIFIED' : 'PENDING');
      item.is_verified = isVerifiedBool ? 1 : 0;
      item.is_available = isAvailableBool ? 1 : 0;
      item.verification_status = newVerificationStatus;
      item.verification_reason = reason || null;
      item.verified_by = adminUser.name || 'Platform Administrator';
      item.verified_at = isVerifiedBool ? currentTimestamp.toISOString() : null;

      if (type === 'donors') {
        item.is_fssai_verified = isVerifiedBool ? 1 : 0;
        item.is_business_verified = isVerifiedBool ? 1 : 0;
        item.is_location_verified = isVerifiedBool ? 1 : 0;
        item.is_phone_verified = isVerifiedBool ? 1 : 0;
        item.fssai_status = isVerifiedBool ? 'VERIFIED' : (action === 'REJECT' ? 'REJECTED' : 'PENDING');
      }
      const u = (db.memoryStore.users || []).find(usr => Number(usr.id) === Number(item.user_id));
      if (u) {
        u.is_verified = isVerifiedBool ? 1 : 0;
        u.isVerified = isVerifiedBool;
        u.verification_status = newVerificationStatus;
      }

      if (action === 'VERIFY') {
        (db.memoryStore.organization_documents || []).forEach(doc => {
          if (doc.organization_type === targetType && Number(doc.organization_id) === entityId && doc.status === 'UPLOADED') {
            doc.status = 'VERIFIED';
            doc.verified_by = adminUser.name;
            doc.verified_at = currentTimestamp.toISOString();
          }
        });
      }
    }

    // Record Immutable Audit Log
    await logAdminAction({
      adminId: adminUser.userId || 1,
      adminName: adminUser.name || 'Platform Administrator',
      action: `ORGANIZATION_${action}`,
      targetType,
      targetId: entityId,
      targetName,
      reason: reason || `Admin executed ${action} on ${targetName}`,
      previousStatus,
      newStatus: newVerificationStatus
    });

    return res.json({
      success: true,
      message: `${targetName} (${targetType}) has been successfully updated to status: ${newVerificationStatus}.`
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4b. ADMIN DOCUMENT ACTION (VERIFY / REJECT INDIVIDUAL DOCUMENT)
// ==========================================
const performDocumentAction = async (req, res, next) => {
  try {
    const { type, id, docId } = req.params;
    const { action, reason } = req.body; // 'VERIFY' | 'REJECT'
    const documentId = Number(docId);
    const adminUser = req.user || { userId: 1, name: 'Platform Administrator' };

    if (action !== 'VERIFY' && action !== 'REJECT') {
      return res.status(400).json({ success: false, message: 'Action must be VERIFY or REJECT.' });
    }

    if (action === 'REJECT' && (!reason || !reason.trim())) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required for document verification.' });
    }

    const currentTimestamp = new Date();

    if (db.isConnected) {
      await db.query(
        `UPDATE organization_documents 
         SET status = ?, rejection_reason = ?, verified_by = ?, verified_at = ? 
         WHERE id = ?`,
        [action === 'VERIFY' ? 'VERIFIED' : 'REJECTED', action === 'REJECT' ? reason : null, adminUser.name || 'Platform Administrator', currentTimestamp, documentId]
      );
    } else {
      const doc = (db.memoryStore.organization_documents || []).find(d => Number(d.id) === documentId);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document record not found.' });
      }
      doc.status = action === 'VERIFY' ? 'VERIFIED' : 'REJECTED';
      doc.rejection_reason = action === 'REJECT' ? reason : null;
      doc.verified_by = adminUser.name || 'Platform Administrator';
      doc.verified_at = currentTimestamp.toISOString();
    }

    await logAdminAction({
      adminId: adminUser.userId || 1,
      adminName: adminUser.name || 'Platform Administrator',
      action: `DOCUMENT_${action}`,
      targetType: type.toUpperCase().slice(0, -1),
      targetId: Number(id),
      targetName: `Document #${documentId}`,
      reason: reason || `Admin marked document #${documentId} as ${action}`,
      previousStatus: 'UNDER_REVIEW',
      newStatus: action === 'VERIFY' ? 'VERIFIED' : 'REJECTED'
    });

    return res.json({ success: true, message: `Document has been marked as ${action === 'VERIFY' ? 'VERIFIED ✓' : 'REJECTED'}.` });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 5. VERIFICATION CENTER
// ==========================================
const getVerificationQueue = async (req, res, next) => {
  try {
    const fetchAllOrgs = async () => {
      let list = [];
      if (db.isConnected) {
        const [nRows] = await db.query(`
          SELECT n.id, n.organization_name as name, 'NGO' as type,
                 COALESCE(n.legal_registration_number, n.registration_number) as registration_number,
                 n.legal_registration_number, n.registration_authority, n.registration_date,
                 n.ngo_darpan_id, n.darpan_status, n.pan, n.tax_12a_12ab, n.tax_80g, n.fcra_number, n.fcra_status,
                 n.contact_person, n.designation, n.address, n.city, n.state, n.pincode,
                 n.latitude, n.longitude, n.food_capacity, n.max_distribution_capacity,
                 n.service_areas, n.beneficiary_types, n.donation_categories_required,
                 n.description, n.is_verified, n.is_available,
                 COALESCE(n.verification_status, CASE WHEN n.is_verified THEN 'VERIFIED' ELSE 'PENDING' END) as verification_status,
                 n.verification_reason, n.verified_by, n.verified_at, n.created_at,
                 u.email, u.phone
          FROM ngos n JOIN users u ON n.user_id = u.id
        `);

        const [bRows] = await db.query(`
          SELECT b.id, b.plant_name as name, 'BIOGAS' as type,
                 COALESCE(b.gobardhan_registration_number, b.plant_registration_number, 'PENDING') as registration_number,
                 b.plant_type, b.operator_name, b.plant_registration_number,
                 b.gobardhan_registration_number, b.gobardhan_status, b.mnre_application_id,
                 b.mnre_programme, b.state_implementing_agency, b.commissioning_certificate_number, b.commissioning_date,
                 b.contact_person, b.designation, b.operating_status,
                 b.address, b.city, b.state, b.pincode, b.latitude, b.longitude,
                 b.processing_capacity as food_capacity, b.feedstock_capacity_daily, b.capacity_unit,
                 b.feedstock_types, COALESCE(b.description, b.feedstock_types, '') as description, b.is_verified, b.is_available,
                 COALESCE(b.verification_status, CASE WHEN b.is_verified THEN 'VERIFIED' ELSE 'PENDING' END) as verification_status,
                 b.verification_reason, b.verified_by, b.verified_at, b.created_at,
                 u.email, u.phone
          FROM biogas_plants b JOIN users u ON b.user_id = u.id
        `);

        const [dRows] = await db.query(`
          SELECT d.id, d.business_name as name, 'DONOR' as type, 
                 COALESCE(d.fssai_number, d.business_type, 'FSSAI-PENDING') as registration_number,
                 COALESCE(d.contact_person, u.name) as contact_person,
                 d.address, d.city, d.state, d.pincode, d.latitude, d.longitude, 0 as food_capacity,
                 d.business_type as service_areas,
                 CONCAT('Food Business: ', d.business_type, ' | FSSAI: ', COALESCE(d.fssai_number, 'Pending Verification'), ' | Status: ', COALESCE(d.fssai_status, 'PENDING')) as description,
                 COALESCE(d.is_verified, u.is_verified, FALSE) as is_verified,
                 TRUE as is_available,
                 CASE WHEN (d.is_verified = TRUE OR u.is_verified = TRUE) THEN 'VERIFIED' ELSE 'PENDING' END as verification_status,
                 d.created_at, u.email, u.phone,
                 d.fssai_number, d.fssai_status, d.business_type,
                 COALESCE(d.is_fssai_verified, FALSE) as is_fssai_verified,
                 COALESCE(d.is_business_verified, FALSE) as is_business_verified,
                 COALESCE(d.is_location_verified, FALSE) as is_location_verified,
                 COALESCE(d.is_phone_verified, FALSE) as is_phone_verified
          FROM donors d JOIN users u ON d.user_id = u.id
        `);

        // Fetch documents for all orgs
        const [allDocs] = await db.query('SELECT * FROM organization_documents');

        list = [...nRows, ...bRows, ...dRows].map(item => ({
          ...item,
          documents: allDocs.filter(d => d.organization_type === item.type && d.organization_id === item.id)
        }));
      } else {
        const users = db.memoryStore.users || [];
        const allDocs = db.memoryStore.organization_documents || [];

        const ngos = (db.memoryStore.ngos || []).map(n => {
          const u = users.find(usr => usr.id === n.user_id) || {};
          const isVer = Boolean(n.is_verified);
          const isAvail = n.is_available !== 0 && n.is_available !== false;
          return {
            ...n,
            id: n.id,
            name: n.organization_name,
            type: 'NGO',
            registration_number: n.legal_registration_number || n.registration_number,
            contact_person: n.contact_person || u.name,
            address: n.address,
            city: n.city,
            state: n.state,
            pincode: n.pincode,
            latitude: n.latitude,
            longitude: n.longitude,
            food_capacity: n.food_capacity,
            service_areas: n.service_areas,
            description: n.description,
            is_verified: isVer ? 1 : 0,
            is_available: isAvail ? 1 : 0,
            verification_status: n.verification_status || (isVer ? 'VERIFIED' : 'PENDING'),
            created_at: n.created_at,
            email: u.email,
            phone: u.phone,
            documents: allDocs.filter(d => d.organization_type === 'NGO' && Number(d.organization_id) === Number(n.id))
          };
        });

        const biogas = (db.memoryStore.biogas_plants || []).map(b => {
          const u = users.find(usr => usr.id === b.user_id) || {};
          const isVer = Boolean(b.is_verified);
          const isAvail = b.is_available !== 0 && b.is_available !== false;
          return {
            ...b,
            id: b.id,
            name: b.plant_name,
            type: 'BIOGAS',
            registration_number: b.gobardhan_registration_number || b.plant_registration_number || 'PENDING',
            contact_person: b.contact_person || u.name,
            address: b.address,
            city: b.city,
            state: b.state,
            pincode: b.pincode,
            latitude: b.latitude,
            longitude: b.longitude,
            food_capacity: b.processing_capacity,
            service_areas: b.plant_type || 'Biogas Energy',
            description: b.description || 'Biogas Facility',
            is_verified: isVer ? 1 : 0,
            is_available: isAvail ? 1 : 0,
            verification_status: b.verification_status || (isVer ? 'VERIFIED' : 'PENDING'),
            created_at: b.created_at,
            email: u.email,
            phone: u.phone,
            documents: allDocs.filter(d => d.organization_type === 'BIOGAS' && Number(d.organization_id) === Number(b.id))
          };
        });

        const donors = (db.memoryStore.donors || []).map(d => {
          const u = users.find(usr => usr.id === d.user_id) || {};
          const isVer = Boolean(d.is_verified || u.is_verified);
          const isFssai = Boolean(d.is_fssai_verified);
          return {
            id: d.id,
            name: d.business_name,
            type: 'DONOR',
            registration_number: d.fssai_number || d.business_type || 'FSSAI-PENDING',
            contact_person: d.contact_person || u.name,
            address: d.address,
            city: d.city,
            state: d.state,
            pincode: d.pincode,
            latitude: d.latitude,
            longitude: d.longitude,
            food_capacity: 0,
            service_areas: d.business_type || 'Hotel',
            description: `Food Business: ${d.business_type || 'Hotel'} | FSSAI: ${d.fssai_number || 'Pending Verification'} | Status: ${d.fssai_status || (isFssai ? 'VERIFIED' : 'PENDING')}`,
            is_verified: isVer ? 1 : 0,
            is_available: 1,
            verification_status: isVer ? 'VERIFIED' : 'PENDING',
            created_at: d.created_at,
            email: u.email,
            phone: u.phone,
            fssai_number: d.fssai_number,
            fssai_status: d.fssai_status || (isFssai ? 'VERIFIED' : 'PENDING'),
            business_type: d.business_type,
            is_fssai_verified: isFssai ? 1 : 0,
            is_business_verified: Boolean(d.is_business_verified || (isVer && isFssai)) ? 1 : 0,
            is_location_verified: Boolean(d.is_location_verified || isVer) ? 1 : 0,
            is_phone_verified: Boolean(d.is_phone_verified || isVer) ? 1 : 0,
            documents: allDocs.filter(doc => doc.organization_type === 'DONOR' && Number(doc.organization_id) === Number(d.id))
          };
        });

        list = [...ngos, ...biogas, ...donors];
      }
      return list;
    };

    const all = await fetchAllOrgs();
    const pending = all.filter(item => (!item.is_verified || item.verification_status === 'PENDING') && item.is_available && item.verification_status !== 'REJECTED' && item.verification_status !== 'SUSPENDED');
    const verified = all.filter(item => item.is_verified && item.is_available && item.verification_status !== 'REJECTED' && item.verification_status !== 'SUSPENDED');
    const suspended = all.filter(item => item.verification_status === 'SUSPENDED' || (!item.is_available && item.verification_status !== 'REJECTED'));
    const rejected = all.filter(item => item.verification_status === 'REJECTED');

    return res.json({
      success: true,
      pending,
      verified,
      suspended,
      rejected
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 6. DONATIONS MANAGEMENT & JOURNEY
// ==========================================
const getDonations = async (req, res, next) => {
  try {
    let donations = [];

    if (db.isConnected) {
      const [rows] = await db.query(`
        SELECT d.*, 
               donor.business_name as donor_name, donor.address as donor_address,
               m.match_status as ngo_match_status, ngo.organization_name as matched_ngo_name,
               bm.match_status as biogas_match_status, bio.plant_name as matched_biogas_name
        FROM donations d
        JOIN donors donor ON d.donor_id = donor.id
        LEFT JOIN donation_matches m ON d.id = m.donation_id AND m.match_status IN ('ACCEPTED', 'OFFERED')
        LEFT JOIN ngos ngo ON m.ngo_id = ngo.id
        LEFT JOIN biogas_matches bm ON d.id = bm.donation_id AND bm.match_status IN ('ACCEPTED', 'OFFERED', 'COMPLETED')
        LEFT JOIN biogas_plants bio ON bm.biogas_plant_id = bio.id
        ORDER BY d.created_at DESC
      `);
      donations = rows;
    } else {
      donations = (db.memoryStore.donations || []).map(d => {
        const donor = (db.memoryStore.donors || []).find(dr => dr.id === d.donor_id) || {};
        const ngoMatch = (db.memoryStore.donation_matches || []).find(m => m.donation_id === d.id && ['ACCEPTED', 'OFFERED'].includes(m.match_status));
        const ngo = ngoMatch ? (db.memoryStore.ngos || []).find(n => n.id === ngoMatch.ngo_id) : null;
        const bioMatch = (db.memoryStore.biogas_matches || []).find(m => m.donation_id === d.id);
        const bio = bioMatch ? (db.memoryStore.biogas_plants || []).find(b => b.id === bioMatch.biogas_plant_id) : null;

        return {
          ...d,
          donor_name: donor.business_name || 'Food Donor',
          donor_address: donor.address || d.pickup_address,
          ngo_match_status: ngoMatch?.match_status || null,
          matched_ngo_name: ngo?.organization_name || null,
          biogas_match_status: bioMatch?.match_status || null,
          matched_biogas_name: bio?.plant_name || null
        };
      });
    }

    return res.json({ success: true, donations });
  } catch (err) {
    next(err);
  }
};

const getDonationJourney = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donationId = Number(id);

    let journey = null;

    if (db.isConnected) {
      const [rows] = await db.query(`
        SELECT d.*,
               donor.business_name as donor_name, donor.address as donor_address, donor.latitude as donor_lat, donor.longitude as donor_lng,
               m.match_status as ngo_match_status, m.match_score as ngo_match_score, m.created_at as match_time,
               ngo.id as ngo_id, ngo.organization_name as ngo_name, ngo.address as ngo_address, ngo.latitude as ngo_lat, ngo.longitude as ngo_lng,
               bm.match_status as biogas_match_status, bm.created_at as biogas_match_time,
               bio.id as biogas_id, bio.plant_name as biogas_name, bio.address as biogas_address, bio.latitude as biogas_lat, bio.longitude as biogas_lng
        FROM donations d
        JOIN donors donor ON d.donor_id = donor.id
        LEFT JOIN donation_matches m ON d.id = m.donation_id AND m.match_status = 'ACCEPTED'
        LEFT JOIN ngos ngo ON m.ngo_id = ngo.id
        LEFT JOIN biogas_matches bm ON d.id = bm.donation_id AND bm.match_status = 'ACCEPTED'
        LEFT JOIN biogas_plants bio ON bm.biogas_plant_id = bio.id
        WHERE d.id = ?
      `, [donationId]);
      journey = rows[0] || null;
    } else {
      const d = (db.memoryStore.donations || []).find(don => Number(don.id) === donationId);
      if (d) {
        const donor = (db.memoryStore.donors || []).find(dr => dr.id === d.donor_id) || {};
        const match = (db.memoryStore.donation_matches || []).find(m => m.donation_id === donationId && m.match_status === 'ACCEPTED');
        const ngo = match ? (db.memoryStore.ngos || []).find(n => n.id === match.ngo_id) : null;
        const bMatch = (db.memoryStore.biogas_matches || []).find(m => m.donation_id === donationId && m.match_status === 'ACCEPTED');
        const bio = bMatch ? (db.memoryStore.biogas_plants || []).find(b => b.id === bMatch.biogas_plant_id) : null;

        journey = {
          ...d,
          donor_name: donor.business_name || 'Food Donor',
          donor_address: donor.address || d.pickup_address,
          donor_lat: donor.latitude || d.latitude,
          donor_lng: donor.longitude || d.longitude,
          ngo_match_status: match?.match_status || null,
          ngo_match_score: match?.match_score || null,
          match_time: match?.created_at || null,
          ngo_id: ngo?.id || null,
          ngo_name: ngo?.organization_name || null,
          ngo_address: ngo?.address || null,
          ngo_lat: ngo?.latitude || null,
          ngo_lng: ngo?.longitude || null,
          biogas_match_status: bMatch?.match_status || null,
          biogas_match_time: bMatch?.created_at || null,
          biogas_id: bio?.id || null,
          biogas_name: bio?.plant_name || null,
          biogas_address: bio?.address || null,
          biogas_lat: bio?.latitude || null,
          biogas_lng: bio?.longitude || null
        };
      }
    }

    if (!journey) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Determine confirmed destination
    const isBiogas = ['EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(journey.status) || journey.biogas_match_status === 'ACCEPTED';
    const isConfirmedMatch = isBiogas ? (journey.biogas_match_status === 'ACCEPTED') : (journey.ngo_match_status === 'ACCEPTED');

    return res.json({
      success: true,
      journey: {
        ...journey,
        isConfirmedMatch,
        destinationType: isBiogas ? 'BIOGAS' : 'NGO',
        destinationName: isBiogas ? journey.biogas_name : journey.ngo_name,
        destinationAddress: isBiogas ? journey.biogas_address : journey.ngo_address,
        // STRICT RULE: Return destination coordinates ONLY after confirmed match!
        destLat: isConfirmedMatch ? (isBiogas ? journey.biogas_lat : journey.ngo_lat) : null,
        destLng: isConfirmedMatch ? (isBiogas ? journey.biogas_lng : journey.ngo_lng) : null
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 7. LIVE TRACKING & PLATFORM MAP
// ==========================================
const getLiveTracking = async (req, res, next) => {
  try {
    let activeTransports = [];

    if (db.isConnected) {
      const [rows] = await db.query(`
        SELECT d.id as donation_id, d.food_name, d.food_category, d.quantity, d.quantity_unit, d.status, d.created_at,
               donor.business_name as donor_name, donor.address as donor_address, donor.latitude as donor_lat, donor.longitude as donor_lng,
               m.match_status as ngo_match_status, ngo.organization_name as ngo_name, ngo.latitude as ngo_lat, ngo.longitude as ngo_lng,
               bm.match_status as biogas_match_status, bio.plant_name as biogas_name, bio.latitude as biogas_lat, bio.longitude as biogas_lng
        FROM donations d
        JOIN donors donor ON d.donor_id = donor.id
        LEFT JOIN donation_matches m ON d.id = m.donation_id AND m.match_status = 'ACCEPTED'
        LEFT JOIN ngos ngo ON m.ngo_id = ngo.id
        LEFT JOIN biogas_matches bm ON d.id = bm.donation_id AND bm.match_status = 'ACCEPTED'
        LEFT JOIN biogas_plants bio ON bm.biogas_plant_id = bio.id
        WHERE d.status IN ('POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT', 'COLLECTED')
        ORDER BY d.created_at DESC
      `);
      activeTransports = rows;
    } else {
      const donations = db.memoryStore.donations || [];
      activeTransports = donations
        .filter(d => ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT', 'COLLECTED'].includes(d.status))
        .map(d => {
          const donor = (db.memoryStore.donors || []).find(dr => dr.id === d.donor_id) || {};
          const match = (db.memoryStore.donation_matches || []).find(m => m.donation_id === d.id && m.match_status === 'ACCEPTED');
          const ngo = match ? (db.memoryStore.ngos || []).find(n => n.id === match.ngo_id) : null;
          const bMatch = (db.memoryStore.biogas_matches || []).find(m => m.donation_id === d.id && m.match_status === 'ACCEPTED');
          const bio = bMatch ? (db.memoryStore.biogas_plants || []).find(b => b.id === bMatch.biogas_plant_id) : null;

          return {
            donation_id: d.id,
            food_name: d.food_name,
            food_category: d.food_category,
            quantity: d.quantity,
            quantity_unit: d.quantity_unit,
            status: d.status,
            created_at: d.created_at,
            donor_name: donor.business_name || 'Food Donor',
            donor_address: donor.address || d.pickup_address,
            donor_lat: donor.latitude || d.latitude,
            donor_lng: donor.longitude || d.longitude,
            ngo_match_status: match?.match_status || null,
            ngo_name: ngo?.organization_name || null,
            ngo_lat: ngo?.latitude || null,
            ngo_lng: ngo?.longitude || null,
            biogas_match_status: bMatch?.match_status || null,
            biogas_name: bio?.plant_name || null,
            biogas_lat: bio?.latitude || null,
            biogas_lng: bio?.longitude || null
          };
        });
    }

    // Format and enforce destination safety rules
    const formatted = activeTransports.map(item => {
      const isBiogas = ['EXPIRED', 'REDIRECTED_TO_BIOGAS'].includes(item.status) || item.biogas_match_status === 'ACCEPTED';
      const isConfirmedMatch = isBiogas ? (item.biogas_match_status === 'ACCEPTED') : (item.ngo_match_status === 'ACCEPTED');

      return {
        donationId: item.donation_id,
        foodName: item.food_name,
        foodCategory: item.food_category,
        quantity: `${item.quantity} ${item.quantity_unit || 'Meals'}`,
        status: item.status,
        createdAt: item.created_at,
        donorName: item.donor_name,
        donorAddress: item.donor_address,
        donorLat: item.donor_lat,
        donorLng: item.donor_lng,
        destinationType: isBiogas ? 'BIOGAS' : 'NGO',
        destinationName: isConfirmedMatch ? (isBiogas ? item.biogas_name : item.ngo_name) : null,
        // STRICT DESTINATION RULE: Do NOT expose destination coords before confirmed match!
        destLat: isConfirmedMatch ? (isBiogas ? item.biogas_lat : item.ngo_lat) : null,
        destLng: isConfirmedMatch ? (isBiogas ? item.biogas_lng : item.ngo_lng) : null,
        isConfirmedMatch
      };
    });

    return res.json({ success: true, activeTransports: formatted });
  } catch (err) {
    next(err);
  }
};

const getMapMarkers = async (req, res, next) => {
  try {
    let donors = [];
    let ngos = [];
    let biogasPlants = [];
    let activeDonations = [];

    if (db.isConnected) {
      const [dRows] = await db.query(`SELECT id, business_name as name, business_type, address, latitude as lat, longitude as lng FROM donors`);
      donors = dRows;

      const [nRows] = await db.query(`SELECT id, organization_name as name, food_capacity, address, latitude as lat, longitude as lng, is_verified FROM ngos WHERE is_available = TRUE`);
      ngos = nRows;

      const [bRows] = await db.query(`SELECT id, plant_name as name, processing_capacity, address, latitude as lat, longitude as lng, is_verified FROM biogas_plants WHERE is_available = TRUE`);
      biogasPlants = bRows;

      const [donRows] = await db.query(`SELECT id, food_name, food_category, quantity, quantity_unit, latitude as lat, longitude as lng, status FROM donations WHERE status IN ('POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT')`);
      activeDonations = donRows;
    } else {
      donors = (db.memoryStore.donors || []).map(d => ({ id: d.id, name: d.business_name, business_type: d.business_type, address: d.address, lat: d.latitude, lng: d.longitude }));
      ngos = (db.memoryStore.ngos || []).map(n => ({ id: n.id, name: n.organization_name, food_capacity: n.food_capacity, address: n.address, lat: n.latitude, lng: n.longitude, is_verified: n.is_verified }));
      biogasPlants = (db.memoryStore.biogas_plants || []).map(b => ({ id: b.id, name: b.plant_name, processing_capacity: b.processing_capacity, address: b.address, lat: b.latitude, lng: b.longitude, is_verified: b.is_verified }));
      activeDonations = (db.memoryStore.donations || []).filter(d => ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT'].includes(d.status)).map(d => ({ id: d.id, food_name: d.food_name, food_category: d.food_category, quantity: d.quantity, quantity_unit: d.quantity_unit, lat: d.latitude, lng: d.longitude, status: d.status }));
    }

    const formatMarker = (item, type) => {
      const hasValidLocation = isValidCoordinate(item.lat, item.lng);
      return {
        ...item,
        type,
        hasValidLocation,
        lat: hasValidLocation ? parseFloat(item.lat) : null,
        lng: hasValidLocation ? parseFloat(item.lng) : null
      };
    };

    return res.json({
      success: true,
      markers: {
        donors: donors.map(d => formatMarker(d, 'DONOR')),
        ngos: ngos.map(n => formatMarker(n, 'NGO')),
        biogasPlants: biogasPlants.map(b => formatMarker(b, 'BIOGAS')),
        activeDonations: activeDonations.map(don => formatMarker(don, 'DONATION'))
      }
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 8. ANALYTICS & ACTIVITIES
// ==========================================
const getAdminAnalytics = async (req, res, next) => {
  try {
    let analytics = {
      totalDonations: 0,
      activeDonations: 0,
      activeMatches: 0,
      foodInTransit: 0,
      completedDeliveries: 0,
      foodDeliveredKg: 0,
      foodRedirectedBiogasKg: 0,
      activeDonors: 0,
      activeNGOs: 0,
      activeBiogasPlants: 0,
      beneficiariesReached: 0,
      categoryDistribution: [],
      monthlyTrends: []
    };

    if (db.isConnected) {
      const [donations] = await db.query('SELECT food_category, quantity, status, created_at FROM donations');
      analytics.totalDonations = donations.length;
      analytics.activeDonations = donations.filter(d => ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT'].includes(d.status)).length;
      analytics.foodInTransit = donations.filter(d => ['PICKUP_STARTED', 'IN_TRANSIT', 'COLLECTED'].includes(d.status)).length;
      analytics.completedDeliveries = donations.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status)).length;
      analytics.foodDeliveredKg = donations.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status)).reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);
      analytics.foodRedirectedBiogasKg = donations.filter(d => d.status === 'REDIRECTED_TO_BIOGAS').reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);

      const [users] = await db.query('SELECT role, is_verified FROM users');
      analytics.activeDonors = users.filter(u => u.role === 'DONOR').length;
      analytics.activeNGOs = users.filter(u => u.role === 'NGO' && u.is_verified).length;
      analytics.activeBiogasPlants = users.filter(u => u.role === 'BIOGAS' && u.is_verified).length;

      const [catRows] = await db.query('SELECT food_category, COUNT(*) as count, SUM(quantity) as total_qty FROM donations GROUP BY food_category');
      analytics.categoryDistribution = catRows;

      const [distRows] = await db.query('SELECT SUM(beneficiaries_served) as total_served FROM distributions');
      analytics.beneficiariesReached = distRows[0]?.total_served ? parseInt(distRows[0].total_served, 10) : Math.round(analytics.foodDeliveredKg * 2);
    } else {
      const donations = db.memoryStore.donations || [];
      const users = db.memoryStore.users || [];
      const dists = db.memoryStore.distributions || [];

      analytics.totalDonations = donations.length;
      analytics.activeDonations = donations.filter(d => ['POSTED', 'MATCHED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT'].includes(d.status)).length;
      analytics.foodInTransit = donations.filter(d => ['PICKUP_STARTED', 'IN_TRANSIT', 'COLLECTED'].includes(d.status)).length;
      analytics.completedDeliveries = donations.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status)).length;
      analytics.foodDeliveredKg = donations.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status)).reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);
      analytics.foodRedirectedBiogasKg = donations.filter(d => d.status === 'REDIRECTED_TO_BIOGAS').reduce((sum, d) => sum + (parseFloat(d.quantity) || 0), 0);
      analytics.activeDonors = users.filter(u => u.role === 'DONOR').length;
      analytics.activeNGOs = users.filter(u => u.role === 'NGO' && u.is_verified).length;
      analytics.activeBiogasPlants = users.filter(u => u.role === 'BIOGAS' && u.is_verified).length;
      analytics.beneficiariesReached = dists.reduce((sum, d) => sum + (parseInt(d.beneficiaries_served, 10) || 0), 0) || Math.round(analytics.foodDeliveredKg * 2);

      const catMap = {};
      donations.forEach(d => {
        catMap[d.food_category] = (catMap[d.food_category] || 0) + 1;
      });
      analytics.categoryDistribution = Object.entries(catMap).map(([category, count]) => ({ food_category: category, count }));
    }

    return res.json({ success: true, analytics });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 9. REPORTS GENERATOR
// ==========================================
const getAdminReports = async (req, res, next) => {
  try {
    const { reportType, period } = req.query;

    let rows = [];
    let metadata = {
      reportType: reportType || 'Platform Activity Report',
      period: period || 'This Month',
      generatedAt: new Date().toISOString(),
      recordCount: 0
    };

    if (db.isConnected) {
      if (reportType === 'Donor Activity') {
        const [dRows] = await db.query(`
          SELECT d.business_name, d.business_type, u.email, u.phone,
                 COUNT(don.id) as total_listings,
                 COALESCE(SUM(don.quantity), 0) as total_quantity_donated,
                 d.created_at as registered_date
          FROM donors d
          JOIN users u ON d.user_id = u.id
          LEFT JOIN donations don ON d.id = don.donor_id
          GROUP BY d.id, u.id
          ORDER BY total_quantity_donated DESC
        `);
        rows = dRows;
      } else if (reportType === 'NGO Activity') {
        const [nRows] = await db.query(`
          SELECT n.organization_name, n.ngo_type, n.registration_number, u.email, u.phone,
                 COUNT(m.id) as donations_accepted,
                 COALESCE(SUM(dist.beneficiaries_served), 0) as beneficiaries_served,
                 n.response_rate, n.is_verified
          FROM ngos n
          JOIN users u ON n.user_id = u.id
          LEFT JOIN donation_matches m ON n.id = m.ngo_id AND m.match_status = 'ACCEPTED'
          LEFT JOIN distributions dist ON n.id = dist.ngo_id
          GROUP BY n.id, u.id
          ORDER BY donations_accepted DESC
        `);
        rows = nRows;
      } else if (reportType === 'Biogas Activity') {
        const [bRows] = await db.query(`
          SELECT b.plant_name, u.email, u.phone, b.processing_capacity,
                 COUNT(bm.id) as waste_batches_received,
                 COALESCE(SUM(d.quantity), 0) as total_waste_diverted_kg,
                 b.is_verified
          FROM biogas_plants b
          JOIN users u ON b.user_id = u.id
          LEFT JOIN biogas_matches bm ON b.id = bm.biogas_plant_id
          LEFT JOIN donations d ON bm.donation_id = d.id
          GROUP BY b.id, u.id
          ORDER BY total_waste_diverted_kg DESC
        `);
        rows = bRows;
      } else {
        // Default / Donation / Platform Activity
        const [donRows] = await db.query(`
          SELECT d.id, d.food_name, d.food_category, d.quantity, d.quantity_unit, d.status,
                 donor.business_name as donor_name, d.pickup_address, d.created_at
          FROM donations d
          JOIN donors donor ON d.donor_id = donor.id
          ORDER BY d.created_at DESC
        `);
        rows = donRows;
      }
    } else {
      const users = db.memoryStore.users || [];
      const donations = db.memoryStore.donations || [];
      const donors = db.memoryStore.donors || [];
      const ngos = db.memoryStore.ngos || [];
      const biogas = db.memoryStore.biogas_plants || [];

      if (reportType === 'Donor Activity') {
        rows = donors.map(d => {
          const u = users.find(usr => usr.id === d.user_id) || {};
          const userDonations = donations.filter(don => don.donor_id === d.id);
          return {
            business_name: d.business_name,
            business_type: d.business_type,
            email: u.email,
            phone: u.phone,
            total_listings: userDonations.length,
            total_quantity_donated: userDonations.reduce((sum, don) => sum + (parseFloat(don.quantity) || 0), 0),
            registered_date: d.created_at || new Date().toISOString()
          };
        });
      } else if (reportType === 'NGO Activity') {
        rows = ngos.map(n => {
          const u = users.find(usr => usr.id === n.user_id) || {};
          const matches = (db.memoryStore.donation_matches || []).filter(m => m.ngo_id === n.id && m.match_status === 'ACCEPTED');
          return {
            organization_name: n.organization_name,
            ngo_type: n.ngo_type,
            registration_number: n.registration_number,
            email: u.email,
            phone: u.phone,
            donations_accepted: matches.length,
            beneficiaries_served: matches.length * 40,
            response_rate: n.response_rate || 90.00,
            is_verified: n.is_verified ? 1 : 0
          };
        });
      } else if (reportType === 'Biogas Activity') {
        rows = biogas.map(b => {
          const u = users.find(usr => usr.id === b.user_id) || {};
          const bMatches = (db.memoryStore.biogas_matches || []).filter(m => m.biogas_plant_id === b.id);
          return {
            plant_name: b.plant_name,
            email: u.email,
            phone: u.phone,
            processing_capacity: b.processing_capacity,
            waste_batches_received: bMatches.length,
            total_waste_diverted_kg: bMatches.length * 40,
            is_verified: b.is_verified ? 1 : 0
          };
        });
      } else {
        rows = donations.map(d => {
          const donor = donors.find(dr => dr.id === d.donor_id) || {};
          return {
            id: d.id,
            food_name: d.food_name,
            food_category: d.food_category,
            quantity: d.quantity,
            quantity_unit: d.quantity_unit,
            status: d.status,
            donor_name: donor.business_name || 'Food Donor',
            pickup_address: d.pickup_address,
            created_at: d.created_at
          };
        });
      }
    }

    metadata.recordCount = rows.length;

    return res.json({
      success: true,
      metadata,
      rows
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 10. AUDIT LOGS
// ==========================================
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, targetType } = req.query;

    let logs = [];
    if (db.isConnected) {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];
      if (action) {
        query += ' AND action = ?';
        params.push(action);
      }
      if (targetType) {
        query += ' AND target_type = ?';
        params.push(targetType);
      }
      query += ' ORDER BY created_at DESC LIMIT 100';
      const [rows] = await db.query(query, params);
      logs = rows;
    } else {
      logs = db.memoryStore.audit_logs || [];
      if (action) logs = logs.filter(l => l.action === action);
      if (targetType) logs = logs.filter(l => l.target_type === targetType);
    }

    return res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 11. PLATFORM NOTIFICATION MANAGEMENT CENTER
// ==========================================
const getAdminNotifications = async (req, res, next) => {
  try {
    let notifications = [];
    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
      notifications = rows;
    } else {
      notifications = db.memoryStore.notifications || [];
    }

    return res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};

const getNotificationRecipients = async (req, res, next) => {
  try {
    let donors = [];
    let ngos = [];
    let biogasPlants = [];

    if (db.isConnected) {
      const [donorRows] = await db.query(`
        SELECT u.id as user_id, d.id as org_id, u.name, d.business_name, u.email, u.phone, 
               'DONOR' as role, u.is_verified, 
               CASE WHEN (d.is_available = TRUE OR d.is_available IS NULL) THEN 'Active' ELSE 'Suspended' END as status
        FROM users u
        JOIN donors d ON u.id = d.user_id
        WHERE u.role = 'DONOR'
        ORDER BY d.business_name ASC
      `);
      donors = donorRows;

      const [ngoRows] = await db.query(`
        SELECT u.id as user_id, n.id as org_id, u.name, n.organization_name, u.email, u.phone, 
               'NGO' as role, n.is_verified, 
               CASE WHEN (n.is_available = TRUE OR n.is_available IS NULL) THEN 'Active' ELSE 'Suspended' END as status
        FROM users u
        JOIN ngos n ON u.id = n.user_id
        WHERE u.role = 'NGO'
        ORDER BY n.organization_name ASC
      `);
      ngos = ngoRows;

      const [biogasRows] = await db.query(`
        SELECT u.id as user_id, b.id as org_id, u.name, b.plant_name, u.email, u.phone, 
               'BIOGAS' as role, b.is_verified, 
               CASE WHEN (b.is_available = TRUE OR b.is_available IS NULL) THEN 'Active' ELSE 'Suspended' END as status
        FROM users u
        JOIN biogas_plants b ON u.id = b.user_id
        WHERE u.role = 'BIOGAS'
        ORDER BY b.plant_name ASC
      `);
      biogasPlants = biogasRows;
    } else {
      const users = db.memoryStore.users || [];
      donors = (db.memoryStore.donors || []).map(d => {
        const u = users.find(usr => usr.id === d.user_id) || {};
        return {
          user_id: u.id,
          org_id: d.id,
          name: u.name || d.business_name,
          business_name: d.business_name,
          email: u.email,
          phone: u.phone,
          role: 'DONOR',
          is_verified: u.is_verified || 0,
          status: d.is_available ? 'Active' : 'Suspended'
        };
      });

      ngos = (db.memoryStore.ngos || []).map(n => {
        const u = users.find(usr => usr.id === n.user_id) || {};
        return {
          user_id: u.id,
          org_id: n.id,
          name: u.name || n.organization_name,
          organization_name: n.organization_name,
          email: u.email,
          phone: u.phone,
          role: 'NGO',
          is_verified: n.is_verified || 0,
          status: n.is_available ? 'Active' : 'Suspended'
        };
      });

      biogasPlants = (db.memoryStore.biogas_plants || []).map(b => {
        const u = users.find(usr => usr.id === b.user_id) || {};
        return {
          user_id: u.id,
          org_id: b.id,
          name: u.name || b.plant_name,
          plant_name: b.plant_name,
          email: u.email,
          phone: u.phone,
          role: 'BIOGAS',
          is_verified: b.is_verified || 0,
          status: b.is_available ? 'Active' : 'Suspended'
        };
      });
    }

    const counts = {
      totalDonors: donors.length,
      totalNGOs: ngos.length,
      totalBiogasPlants: biogasPlants.length,
      totalUsers: donors.length + ngos.length + biogasPlants.length
    };

    return res.json({
      success: true,
      donors,
      ngos,
      biogasPlants,
      counts
    });
  } catch (err) {
    next(err);
  }
};

const sendAdminNotification = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const {
      recipientType,
      recipientId,
      title,
      message,
      priority = 'Normal',
      category = 'General Announcement',
      actionRoute = null,
      actionLabel = null
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Notification title is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Notification message content is required.' });
    }
    if (!recipientType) {
      return res.status(400).json({ success: false, message: 'Recipient type is required.' });
    }

    // Determine target users from DB
    let targetUsers = [];
    let recipientDisplayName = '';

    if (db.isConnected) {
      if (recipientType === 'SPECIFIC_USER') {
        if (!recipientId) {
          return res.status(400).json({ success: false, message: 'Recipient ID must be specified for individual messages.' });
        }
        const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [recipientId]);
        if (rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Recipient user not found in database.' });
        }
        targetUsers = rows;
        recipientDisplayName = rows[0].name;
      } else if (recipientType === 'ALL_DONORS') {
        const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE role = "DONOR"');
        targetUsers = rows;
        recipientDisplayName = 'All Registered Donors';
      } else if (recipientType === 'ALL_NGOS') {
        const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE role = "NGO"');
        targetUsers = rows;
        recipientDisplayName = 'All Registered NGOs';
      } else if (recipientType === 'ALL_BIOGAS') {
        const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE role = "BIOGAS"');
        targetUsers = rows;
        recipientDisplayName = 'All Registered Biogas Plants';
      } else if (recipientType === 'ALL_USERS') {
        const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE role IN ("DONOR", "NGO", "BIOGAS")');
        targetUsers = rows;
        recipientDisplayName = 'All Platform Users';
      }
    } else {
      const users = db.memoryStore.users || [];
      if (recipientType === 'SPECIFIC_USER') {
        const u = users.find(usr => usr.id === Number(recipientId));
        if (!u) {
          return res.status(404).json({ success: false, message: 'Recipient user not found in database.' });
        }
        targetUsers = [u];
        recipientDisplayName = u.name;
      } else if (recipientType === 'ALL_DONORS') {
        targetUsers = users.filter(u => u.role === 'DONOR');
        recipientDisplayName = 'All Registered Donors';
      } else if (recipientType === 'ALL_NGOS') {
        targetUsers = users.filter(u => u.role === 'NGO');
        recipientDisplayName = 'All Registered NGOs';
      } else if (recipientType === 'ALL_BIOGAS') {
        targetUsers = users.filter(u => u.role === 'BIOGAS');
        recipientDisplayName = 'All Registered Biogas Plants';
      } else if (recipientType === 'ALL_USERS') {
        targetUsers = users.filter(u => ['DONOR', 'NGO', 'BIOGAS'].includes(u.role));
        recipientDisplayName = 'All Platform Users';
      }
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible recipients found in the database for the selected target group.'
      });
    }

    const broadcastId = Date.now();
    const createdAt = new Date().toISOString();
    const io = req.app.get('io');

    // Insert notification records for all target recipients
    if (db.isConnected) {
      for (const user of targetUsers) {
        await db.query(
          `INSERT INTO notifications 
           (user_id, type, title, message, category, priority, action_route, action_label, sender_id, is_read, created_at) 
           VALUES (?, 'IN_APP', ?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
          [user.id, title, message, category, priority, actionRoute, actionLabel, adminId]
        );
      }

      await db.query(
        `INSERT INTO admin_notifications 
         (id, sender_id, sender_name, recipient_type, recipient_id, recipient_name, recipient_count, title, message, category, priority, action_route, action_label, status, created_at) 
         VALUES (?, ?, 'Platform System Administrator', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SENT', NOW())`,
        [broadcastId, adminId, recipientType, recipientId || null, recipientDisplayName, targetUsers.length, title, message, category, priority, actionRoute, actionLabel]
      );
    } else {
      if (!db.memoryStore.notifications) db.memoryStore.notifications = [];
      if (!db.memoryStore.admin_notifications) db.memoryStore.admin_notifications = [];

      for (const user of targetUsers) {
        db.memoryStore.notifications.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          user_id: user.id,
          type: 'IN_APP',
          title,
          message,
          category,
          priority,
          action_route: actionRoute,
          action_label: actionLabel,
          sender_id: adminId,
          broadcast_id: broadcastId,
          is_read: 0,
          created_at: createdAt
        });
      }

      db.memoryStore.admin_notifications.push({
        id: broadcastId,
        sender_id: adminId,
        sender_name: 'Platform System Administrator',
        recipient_type: recipientType,
        recipient_id: recipientId || null,
        recipient_name: recipientDisplayName,
        recipient_count: targetUsers.length,
        title,
        message,
        category,
        priority,
        action_route: actionRoute,
        action_label: actionLabel,
        status: 'SENT',
        created_at: createdAt
      });
    }

    // Record immutable audit log
    await logAdminAction({
      adminId,
      adminName: 'Platform System Administrator',
      action: 'ADMIN_SEND_NOTIFICATION',
      targetType: 'SYSTEM',
      targetId: broadcastId,
      targetName: recipientDisplayName,
      reason: `Broadcasted [${priority}] ${category} notification to ${targetUsers.length} recipients.`,
      previousStatus: 'DRAFT',
      newStatus: 'SENT'
    });

    // Real-time socket broadcast to users
    if (io) {
      targetUsers.forEach(u => {
        io.to(`user_${u.id}`).emit('notificationCreated', {
          title,
          message,
          category,
          priority,
          createdAt
        });
      });
      io.emit('new_notification', {
        title,
        recipientType,
        count: targetUsers.length
      });
    }

    return res.status(201).json({
      success: true,
      message: `Notification successfully dispatched to ${targetUsers.length} recipient${targetUsers.length > 1 ? 's' : ''}.`,
      broadcastId,
      recipientCount: targetUsers.length
    });
  } catch (err) {
    next(err);
  }
};

const getAdminNotificationHistory = async (req, res, next) => {
  try {
    let history = [];

    if (db.isConnected) {
      const [rows] = await db.query(`
        SELECT an.*, 
               (SELECT COUNT(*) FROM notifications n WHERE n.title = an.title AND n.created_at >= an.created_at - INTERVAL 10 SECOND AND n.is_read = 1) as read_count,
               (SELECT COUNT(*) FROM notifications n WHERE n.title = an.title AND n.created_at >= an.created_at - INTERVAL 10 SECOND AND n.is_read = 0) as unread_count
        FROM admin_notifications an
        ORDER BY an.created_at DESC
      `);
      history = rows;
    } else {
      const adminNotifs = db.memoryStore.admin_notifications || [];
      const userNotifs = db.memoryStore.notifications || [];

      history = adminNotifs.map(an => {
        const matchingUserNotifs = userNotifs.filter(un => un.title === an.title);
        const readCount = matchingUserNotifs.filter(un => un.is_read).length;
        const unreadCount = matchingUserNotifs.filter(un => !un.is_read).length;

        return {
          ...an,
          read_count: readCount,
          unread_count: unreadCount
        };
      });
    }

    return res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
};

const getAdminNotificationDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    let detail = null;
    let recipientsList = [];

    if (db.isConnected) {
      const [rows] = await db.query('SELECT * FROM admin_notifications WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Notification record not found.' });
      }
      detail = rows[0];

      const [recipRows] = await db.query(`
        SELECT n.id, n.user_id, u.name, u.email, u.role, n.is_read, n.created_at 
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        WHERE n.title = ? AND n.created_at >= ? - INTERVAL 10 SECOND
      `, [detail.title, detail.created_at]);
      recipientsList = recipRows;
    } else {
      const an = (db.memoryStore.admin_notifications || []).find(item => Number(item.id) === Number(id));
      if (!an) {
        return res.status(404).json({ success: false, message: 'Notification record not found.' });
      }
      detail = an;

      const userNotifs = db.memoryStore.notifications || [];
      const users = db.memoryStore.users || [];

      recipientsList = userNotifs
        .filter(un => un.title === an.title)
        .map(un => {
          const u = users.find(usr => usr.id === un.user_id) || {};
          return {
            id: un.id,
            user_id: un.user_id,
            name: u.name || 'User',
            email: u.email || 'N/A',
            role: u.role || 'USER',
            is_read: un.is_read,
            created_at: un.created_at
          };
        });
    }

    const deliveredCount = recipientsList.length;
    const readCount = recipientsList.filter(r => r.is_read).length;
    const unreadCount = deliveredCount - readCount;

    return res.json({
      success: true,
      detail: {
        ...detail,
        delivered_count: deliveredCount,
        read_count: readCount,
        unread_count: unreadCount
      },
      recipients: recipientsList
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 12. USERS, SUBSCRIPTIONS & PAYMENTS
// ==========================================
const getUsers = async (req, res, next) => {
  try {
    let users = [];
    if (db.isConnected) {
      const [rows] = await db.query('SELECT id, name, email, phone, role, is_verified, created_at FROM users ORDER BY created_at DESC');
      users = rows;
    } else {
      users = (db.memoryStore.users || []).map(({ password, ...rest }) => rest);
    }
    return res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    let subscriptions = [];
    if (db.isConnected) {
      const [rows] = await db.query('SELECT s.*, u.name as user_name, u.email FROM subscriptions s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC');
      subscriptions = rows;
    } else {
      subscriptions = db.memoryStore.subscriptions || [];
    }
    return res.json({ success: true, subscriptions });
  } catch (err) {
    next(err);
  }
};

const getPayments = async (req, res, next) => {
  try {
    let payments = [];
    if (db.isConnected) {
      const [rows] = await db.query('SELECT p.*, u.name as user_name, u.email FROM payments p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC');
      payments = rows;
    } else {
      payments = db.memoryStore.payments || [];
    }
    return res.json({ success: true, payments });
  } catch (err) {
    next(err);
  }
};

const resetSystemData = async (req, res, next) => {
  try {
    if (db.isConnected) {
      await db.query(`
        TRUNCATE TABLE 
          gps_devices,
          trip_location_logs,
          trips,
          drivers,
          vehicles,
          admin_notifications,
          audit_logs,
          impact_records,
          payments,
          subscriptions,
          notifications,
          collections,
          biogas_matches,
          donation_matches,
          donations,
          organization_documents,
          distributions,
          ngo_requests,
          biogas_plants,
          ngos,
          donors
        RESTART IDENTITY CASCADE;

        DELETE FROM users WHERE role != 'ADMIN';
      `);
    } else {
      db.memoryStore.users = (db.memoryStore.users || []).filter(u => u.role === 'ADMIN');
      db.memoryStore.donors = [];
      db.memoryStore.ngos = [];
      db.memoryStore.ngo_requests = [];
      db.memoryStore.distributions = [];
      db.memoryStore.biogas_plants = [];
      db.memoryStore.donations = [];
      db.memoryStore.donation_matches = [];
      db.memoryStore.biogas_matches = [];
      db.memoryStore.collections = [];
      db.memoryStore.notifications = [];
      db.memoryStore.subscriptions = [];
      db.memoryStore.payments = [];
      db.memoryStore.impact_records = [];
      db.memoryStore.audit_logs = [];
      db.memoryStore.admin_notifications = [];
      db.memoryStore.donor_reviews = [];
    }

    return res.json({
      success: true,
      message: 'All registered Donors, NGOs, Biogas Plants, and Donations have been completely deleted from the database.'
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 15. GET DONOR COMPLAINTS & CONFIDENTIAL REVIEWS (ADMIN ONLY)
// ==========================================
const getDonorComplaintsAndReviews = async (req, res, next) => {
  try {
    let reviews = [];
    if (db.isConnected) {
      const [rows] = await db.query(
        `SELECT r.*, 
                COALESCE(d.business_name, d.organization_name, d.name, 'Hotel Donor') as donor_name, d.contact_person as donor_contact, d.address as donor_address,
                u.email as donor_email, u.phone as donor_phone,
                don.food_name, don.quantity, don.pickup_address as donation_pickup_address
         FROM donor_reviews r
         JOIN donors d ON r.donor_id = d.id
         LEFT JOIN users u ON d.user_id = u.id
         LEFT JOIN donations don ON r.donation_id = don.id
         ORDER BY r.created_at DESC`
      );
      reviews = rows || [];
    } else {
      reviews = (db.memoryStore.donor_reviews || []).map(r => {
        const d = (db.memoryStore.donors || []).find(donor => Number(donor.id) === Number(r.donor_id)) || {};
        const u = (db.memoryStore.users || []).find(user => Number(user.id) === Number(d.user_id)) || {};
        const don = (db.memoryStore.donations || []).find(donation => Number(donation.id) === Number(r.donation_id)) || {};
        return {
          ...r,
          donor_name: d.organization_name || d.name || 'Hotel Donor',
          donor_contact: d.contact_person || '',
          donor_address: d.address || '',
          donor_email: u.email || '',
          donor_phone: u.phone || '',
          food_name: don.food_name || 'Food Donation',
          quantity: don.quantity || 0,
          donation_pickup_address: don.pickup_address || ''
        };
      });
    }

    const complaintsOnly = reviews.filter(r => r.has_complaint || (r.complaint_text && r.complaint_text.trim().length > 0));

    return res.json({
      success: true,
      totalReviews: reviews.length,
      totalComplaints: complaintsOnly.length,
      pendingComplaints: complaintsOnly.filter(c => c.admin_status === 'NEW').length,
      reviews,
      complaints: complaintsOnly
    });
  } catch (err) {
    next(err);
  }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'REVIEWED', notes = '' } = req.body;
    const adminName = req.user?.name || 'Platform Administrator';

    if (db.isConnected) {
      await db.query(
        'UPDATE donor_reviews SET admin_status = ?, admin_notes = ? WHERE id = ?',
        [status, notes, id]
      );
      await db.query(
        `INSERT INTO audit_logs (admin_id, admin_name, action, target_type, target_id, target_name, reason, previous_status, new_status)
         VALUES (?, ?, 'DONOR_COMPLAINT_STATUS_UPDATE', 'DONOR_REVIEW', ?, 'Review #${id}', ?, 'NEW', ?)`,
        [req.user?.userId || 1, adminName, id, notes || `Admin updated complaint status to ${status}`, status]
      );
    } else {
      const review = (db.memoryStore.donor_reviews || []).find(r => Number(r.id) === Number(id));
      if (review) {
        review.admin_status = status;
        review.admin_notes = notes;
      }
    }

    return res.json({ success: true, message: `Complaint status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardSummary,
  getOrganizations,
  getOrganizationDetails,
  performOrganizationAction,
  performDocumentAction,
  getVerificationQueue,
  getDonations,
  getDonationJourney,
  getLiveTracking,
  getMapMarkers,
  getAdminAnalytics,
  getAdminReports,
  getAuditLogs,
  getAdminNotifications,
  getNotificationRecipients,
  sendAdminNotification,
  getAdminNotificationHistory,
  getAdminNotificationDetail,
  getUsers,
  getSubscriptions,
  getPayments,
  resetSystemData,
  getDonorComplaintsAndReviews,
  updateComplaintStatus
};

