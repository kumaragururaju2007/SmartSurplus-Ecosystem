const db = require('../backend/database/databaseConnection');

async function checkImpact() {
  if (db.isConnected) {
    const [donations] = await db.query('SELECT id, title, food_name, quantity, quantity_unit, status, food_category FROM donations');
    console.log('--- DONATIONS ---');
    console.log(donations);

    const [biogasMatches] = await db.query('SELECT * FROM biogas_matches');
    console.log('--- BIOGAS MATCHES ---');
    console.log(biogasMatches);

    const [donationMatches] = await db.query('SELECT * FROM donation_matches');
    console.log('--- DONATION MATCHES ---');
    console.log(donationMatches);

    const [impactRecords] = await db.query('SELECT * FROM impact_records');
    console.log('--- IMPACT RECORDS ---');
    console.log(impactRecords);
  } else {
    console.log('DB not connected');
  }
  process.exit(0);
}

checkImpact();
