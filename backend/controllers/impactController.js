const db = require('../database/databaseConnection');

// Helper to fetch all tables relevant to impact calculation
async function getImpactData() {
  let donations = [];
  let biogasMatches = [];
  let donationMatches = [];
  let impactRecords = [];

  if (db.isConnected) {
    const [dRows] = await db.query('SELECT * FROM donations');
    donations = dRows || [];
    const [bmRows] = await db.query('SELECT * FROM biogas_matches');
    biogasMatches = bmRows || [];
    const [dmRows] = await db.query('SELECT * FROM donation_matches');
    donationMatches = dmRows || [];
    const [irRows] = await db.query('SELECT * FROM impact_records');
    impactRecords = irRows || [];
  } else {
    donations = db.memoryStore.donations || [];
    biogasMatches = db.memoryStore.biogas_matches || [];
    donationMatches = db.memoryStore.donation_matches || [];
    impactRecords = db.memoryStore.impact_records || [];
  }

  return { donations, biogasMatches, donationMatches, impactRecords };
}

const getImpactSummary = async (req, res, next) => {
  try {
    const role = req.user ? req.user.role : 'GUEST';
    const { donations, biogasMatches, donationMatches, impactRecords } = await getImpactData();

    let foodRescuedKg = 0;
    let mealsSupported = 0;
    let wasteDivertedKg = 0;
    let biogasGeneratedM3 = 0;
    let totalDonations = donations.length;
    let completedDonations = 0;
    let totalListedFoodKg = 0;

    donations.forEach(d => {
      const qty = parseFloat(d.quantity || 0);
      const unit = String(d.quantity_unit || 'Meals').toLowerCase().trim();
      let weightKg = (unit === 'kg' || unit === 'kgs' || unit === 'kilogram') ? qty : ((unit === 'boxes' || unit === 'box') ? qty * 2.0 : qty * 0.4);
      totalListedFoodKg += weightKg;

      const dId = Number(d.id);
      const bm = biogasMatches.find(m => Number(m.donation_id) === dId);
      const dm = donationMatches.find(m => Number(m.donation_id) === dId);
      const ir = impactRecords.find(r => Number(r.donation_id) === dId);

      // Check if this donation was routed to Biogas
      const isBiogas = Boolean(
        bm || 
        d.status === 'REDIRECTED_TO_BIOGAS' || 
        (ir && parseFloat(ir.waste_diverted_kg || 0) > 0 && parseFloat(ir.food_rescued_kg || 0) === 0) ||
        d.food_category === 'Spoiled' || 
        d.food_category === 'Waste'
      );

      if (isBiogas) {
        // Biogas completion status check
        const isBiogasCompleted = 
          ['COMPLETED', 'PROCESSED', 'DELIVERED', 'COLLECTED'].includes(d.status) || 
          ['COMPLETED', 'PROCESSED', 'COLLECTED'].includes(bm?.match_status) ||
          (ir && parseFloat(ir.waste_diverted_kg || 0) > 0);

        if (isBiogasCompleted) {
          const divertedWeight = ir && parseFloat(ir.waste_diverted_kg || 0) > 0 
            ? (unit === 'kg' || unit === 'kgs' ? parseFloat(ir.waste_diverted_kg) : weightKg)
            : weightKg;
          wasteDivertedKg += divertedWeight;
          completedDonations++;
        }
      } else {
        // Human NGO completion status check
        const isHumanCompleted = 
          ['DELIVERED', 'COMPLETED'].includes(d.status) || 
          ['DELIVERED', 'COMPLETED'].includes(dm?.match_status) ||
          (ir && parseFloat(ir.food_rescued_kg || 0) > 0);

        if (isHumanCompleted) {
          const rescuedWeight = (d.quantity_received !== null && d.quantity_received !== undefined)
            ? parseFloat(d.quantity_received)
            : (ir && parseFloat(ir.food_rescued_kg || 0) > 0 ? parseFloat(ir.food_rescued_kg) : weightKg);

          const people = (d.people_served_actual !== null && d.people_served_actual !== undefined)
            ? parseInt(d.people_served_actual, 10)
            : (d.people_served_estimate !== null && d.people_served_estimate !== undefined)
              ? parseInt(d.people_served_estimate, 10)
              : (ir && ir.meals_served ? parseInt(ir.meals_served, 10) : Math.round(rescuedWeight * 2.5));
          
          foodRescuedKg += rescuedWeight;
          mealsSupported += (people || 0);
          completedDonations++;
        }
      }
    });

    biogasGeneratedM3 = parseFloat((wasteDivertedKg * 0.45).toFixed(2));
    const co2SavedKg = parseFloat(((foodRescuedKg * 2.1) + (wasteDivertedKg * 2.1)).toFixed(2));

    let landfillDiversionRate = 0;
    if (totalListedFoodKg > 0) {
      landfillDiversionRate = parseFloat((((foodRescuedKg + wasteDivertedKg) / totalListedFoodKg) * 100).toFixed(1));
      landfillDiversionRate = Math.min(100, Math.max(0, landfillDiversionRate));
    }

    let impactScore = 0;
    if (totalDonations > 0) {
      impactScore = Math.min(100, Math.round((completedDonations * 10) + (foodRescuedKg * 0.5) + (wasteDivertedKg * 0.25)));
    }

    let scoreBadge = 'STANDARD';
    if (impactScore >= 80) scoreBadge = 'GOLD';
    else if (impactScore >= 50) scoreBadge = 'SILVER';
    else if (impactScore >= 20) scoreBadge = 'BRONZE';

    return res.json({
      success: true,
      summary: {
        totalDonations,
        completedDonations,
        foodRescuedKg: parseFloat(foodRescuedKg.toFixed(2)),
        mealsSupported,
        peopleBenefited: mealsSupported,
        peopleServed: mealsSupported,
        totalPeopleBenefited: mealsSupported,
        wasteDivertedKg: parseFloat(wasteDivertedKg.toFixed(2)),
        biogasGeneratedM3,
        co2SavedKg,
        landfillDiversionRate,
        impactScore,
        scoreBadge,
        role
      }
    });
  } catch (err) {
    next(err);
  }
};

const getMonthlyImpact = async (req, res, next) => {
  try {
    const { donations, biogasMatches, donationMatches, impactRecords } = await getImpactData();

    const monthMap = {};
    donations.forEach(d => {
      const dDate = new Date(d.created_at || Date.now());
      const mName = dDate.toLocaleString('default', { month: 'short' });
      if (!monthMap[mName]) {
        monthMap[mName] = { month: mName, foodRescued: 0, wasteDiverted: 0, biogasM3: 0 };
      }

      const qty = parseFloat(d.quantity || 0);
      const unit = String(d.quantity_unit || 'Meals').toLowerCase().trim();
      const weightKg = (unit === 'kg' || unit === 'kgs' || unit === 'kilogram') ? qty : ((unit === 'boxes' || unit === 'box') ? qty * 2.0 : qty * 0.4);

      const dId = Number(d.id);
      const bm = biogasMatches.find(m => Number(m.donation_id) === dId);
      const dm = donationMatches.find(m => Number(m.donation_id) === dId);
      const ir = impactRecords.find(r => Number(r.donation_id) === dId);

      const isBiogas = Boolean(
        bm || 
        d.status === 'REDIRECTED_TO_BIOGAS' || 
        (ir && parseFloat(ir.waste_diverted_kg || 0) > 0 && parseFloat(ir.food_rescued_kg || 0) === 0) ||
        d.food_category === 'Spoiled' || 
        d.food_category === 'Waste'
      );

      if (isBiogas) {
        const isBiogasCompleted = 
          ['COMPLETED', 'PROCESSED', 'DELIVERED', 'COLLECTED'].includes(d.status) || 
          ['COMPLETED', 'PROCESSED', 'COLLECTED'].includes(bm?.match_status) ||
          (ir && parseFloat(ir.waste_diverted_kg || 0) > 0);

        if (isBiogasCompleted) {
          monthMap[mName].wasteDiverted += weightKg;
          monthMap[mName].biogasM3 = parseFloat((monthMap[mName].wasteDiverted * 0.45).toFixed(2));
        }
      } else {
        const isHumanCompleted = 
          ['DELIVERED', 'COMPLETED'].includes(d.status) || 
          ['DELIVERED', 'COMPLETED'].includes(dm?.match_status) ||
          (ir && parseFloat(ir.food_rescued_kg || 0) > 0);

        if (isHumanCompleted) {
          monthMap[mName].foodRescued += weightKg;
        }
      }
    });

    const monthlyData = Object.values(monthMap);

    return res.json({ success: true, monthlyData });
  } catch (err) {
    next(err);
  }
};

const getImpactReport = async (req, res, next) => {
  try {
    const { donations, biogasMatches, donationMatches, impactRecords } = await getImpactData();

    let foodRescuedKg = 0;
    let mealsSupported = 0;
    let wasteDivertedKg = 0;
    let completedCount = 0;
    let totalListedFoodKg = 0;

    donations.forEach(d => {
      const qty = parseFloat(d.quantity || 0);
      const unit = String(d.quantity_unit || 'Meals').toLowerCase().trim();
      let weightKg = (unit === 'kg' || unit === 'kgs' || unit === 'kilogram') ? qty : ((unit === 'boxes' || unit === 'box') ? qty * 2.0 : qty * 0.4);
      totalListedFoodKg += weightKg;

      const dId = Number(d.id);
      const bm = biogasMatches.find(m => Number(m.donation_id) === dId);
      const dm = donationMatches.find(m => Number(m.donation_id) === dId);
      const ir = impactRecords.find(r => Number(r.donation_id) === dId);

      const isBiogas = Boolean(
        bm || 
        d.status === 'REDIRECTED_TO_BIOGAS' || 
        (ir && parseFloat(ir.waste_diverted_kg || 0) > 0 && parseFloat(ir.food_rescued_kg || 0) === 0) ||
        d.food_category === 'Spoiled' || 
        d.food_category === 'Waste'
      );

      if (isBiogas) {
        const isBiogasCompleted = 
          ['COMPLETED', 'PROCESSED', 'DELIVERED', 'COLLECTED'].includes(d.status) || 
          ['COMPLETED', 'PROCESSED', 'COLLECTED'].includes(bm?.match_status) ||
          (ir && parseFloat(ir.waste_diverted_kg || 0) > 0);

        if (isBiogasCompleted) {
          const divertedWeight = ir && parseFloat(ir.waste_diverted_kg || 0) > 0 
            ? (unit === 'kg' || unit === 'kgs' ? parseFloat(ir.waste_diverted_kg) : weightKg)
            : weightKg;
          wasteDivertedKg += divertedWeight;
          completedCount++;
        }
      } else {
        const isHumanCompleted = 
          ['DELIVERED', 'COMPLETED'].includes(d.status) || 
          ['DELIVERED', 'COMPLETED'].includes(dm?.match_status) ||
          (ir && parseFloat(ir.food_rescued_kg || 0) > 0);

        if (isHumanCompleted) {
          const rescuedWeight = ir && parseFloat(ir.food_rescued_kg || 0) > 0 
            ? (unit === 'kg' || unit === 'kgs' ? parseFloat(ir.food_rescued_kg) : weightKg)
            : weightKg;
          const meals = (unit === 'kg' || unit === 'kgs' || unit === 'kilogram') 
            ? Math.round(qty * 2.5) 
            : ((unit === 'boxes' || unit === 'box') ? Math.round(qty * 5) : Math.round(qty));
          
          foodRescuedKg += rescuedWeight;
          mealsSupported += meals;
          completedCount++;
        }
      }
    });

    const cleanBiogasGeneratedM3 = parseFloat((wasteDivertedKg * 0.45).toFixed(2));
    const co2EmissionsPreventedKg = parseFloat(((foodRescuedKg * 2.1) + (wasteDivertedKg * 2.1)).toFixed(2));
    const landfillDivertedPercent = totalListedFoodKg > 0 
      ? `${(((foodRescuedKg + wasteDivertedKg) / totalListedFoodKg) * 100).toFixed(1)}%` 
      : '0.0%';
      
    const impactScoreNum = donations.length > 0 
      ? Math.min(100, Math.round((completedCount * 10) + (foodRescuedKg * 0.5) + (wasteDivertedKg * 0.25))) 
      : 0;

    return res.json({
      success: true,
      report: {
        title: 'SmartSurplus Annual Corporate Sustainability & ESG Impact Summary',
        generatedAt: new Date().toISOString(),
        reportingPeriod: '2026 YTD',
        metrics: {
          foodRedistributedKg: parseFloat(foodRescuedKg.toFixed(2)),
          mealsProvided: mealsSupported,
          organicWasteDivertedKg: parseFloat(wasteDivertedKg.toFixed(2)),
          cleanBiogasGeneratedM3,
          co2EmissionsPreventedKg,
          landfillDivertedPercent
        },
        impactScore: `${impactScoreNum} / 100`
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getImpactSummary,
  getMonthlyImpact,
  getImpactReport
};
