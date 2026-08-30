const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'smart_surplus',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: (process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('supabase')) ? { rejectUnauthorized: false } : false
});

async function clearFakeData() {
  console.log('🧹 Purging fake and automated test data from database...\n');

  try {
    // 1. Identify fake test users (emails with test or generated timestamps)
    const fakeUsers = await pool.query(
      "SELECT id, email, name FROM users WHERE email LIKE '%test%' OR email NOT IN ('admin@gmail.com', 'donor@gmail.com', 'ngo@gmail.com', 'biogas@gmail.com')"
    );
    console.log(`Found ${fakeUsers.rowCount} fake/test users to purge.`);
    const fakeUserIds = fakeUsers.rows.map(u => u.id);

    // 2. Identify fake donations (created by automated scripts on Mount Road / Chennai)
    const fakeDonations = await pool.query(
      "SELECT id, food_name, pickup_address FROM donations WHERE pickup_address LIKE '%Mount Road%' OR donor_id NOT IN (SELECT id FROM donors WHERE user_id IN (SELECT id FROM users WHERE email = 'donor@gmail.com'))"
    );
    console.log(`Found ${fakeDonations.rowCount} fake test donations to purge.`);
    const fakeDonationIds = fakeDonations.rows.map(d => d.id);

    // 3. Delete notifications referencing fake donations or fake users
    if (fakeDonationIds.length > 0) {
      for (const donId of fakeDonationIds) {
        await pool.query(
          "DELETE FROM notifications WHERE message LIKE $1 OR title LIKE $1",
          [`%#${donId}%`]
        );
      }
    }
    if (fakeUserIds.length > 0) {
      await pool.query(
        "DELETE FROM notifications WHERE user_id = ANY($1::int[])",
        [fakeUserIds]
      );
    }

    // 4. Delete fake trip records and location logs
    if (fakeDonationIds.length > 0) {
      const tripsToDel = await pool.query(
        "SELECT id FROM trips WHERE donation_id = ANY($1::int[])",
        [fakeDonationIds]
      );
      const tripIds = tripsToDel.rows.map(t => t.id);
      if (tripIds.length > 0) {
        await pool.query("DELETE FROM trip_location_logs WHERE trip_id = ANY($1::int[])", [tripIds]);
        await pool.query("DELETE FROM pairing_codes WHERE trip_id = ANY($1::int[])", [tripIds]);
        await pool.query("DELETE FROM trips WHERE id = ANY($1::int[])", [tripIds]);
      }
    }

    // 5. Delete fake distributions & impact records
    if (fakeDonationIds.length > 0) {
      await pool.query("DELETE FROM distributions WHERE donation_id = ANY($1::int[])", [fakeDonationIds]);
      await pool.query("DELETE FROM impact_records WHERE donation_id = ANY($1::int[])", [fakeDonationIds]);
    }

    // 6. Delete fake matches
    if (fakeDonationIds.length > 0) {
      await pool.query("DELETE FROM biogas_matches WHERE donation_id = ANY($1::int[])", [fakeDonationIds]);
      await pool.query("DELETE FROM donation_matches WHERE donation_id = ANY($1::int[])", [fakeDonationIds]);
    }

    // 7. Delete fake donations
    if (fakeDonationIds.length > 0) {
      await pool.query("DELETE FROM donations WHERE id = ANY($1::int[])", [fakeDonationIds]);
    }

    // 8. Delete fake organizations & documents
    await pool.query("DELETE FROM ngos WHERE user_id = 1 OR user_id = ANY($1::int[]) OR id > 1", [fakeUserIds.length > 0 ? fakeUserIds : [-1]]);
    await pool.query("DELETE FROM donors WHERE user_id = ANY($1::int[]) OR id > 1", [fakeUserIds.length > 0 ? fakeUserIds : [-1]]);
    await pool.query("DELETE FROM organization_documents WHERE (organization_type = 'NGO' AND organization_id != 1) OR (organization_type = 'DONOR' AND organization_id != 1) OR (organization_type = 'BIOGAS' AND organization_id != 1)");

    // 9. Delete fake users
    if (fakeUserIds.length > 0) {
      await pool.query("DELETE FROM users WHERE id = ANY($1::int[])", [fakeUserIds]);
    }

    // 10. Ensure Platform Administrator exists
    const adminCheck = await pool.query("SELECT id, email FROM users WHERE email = 'admin@gmail.com'");
    if (adminCheck.rowCount === 0) {
      await pool.query(
        `INSERT INTO users (name, email, phone, password, role, is_verified) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'Platform System Administrator',
          'admin@gmail.com',
          '+919876543299',
          '$2a$10$c7IbIp7DBrya4r1k6LddpOPGdpiMcbExt3hh4Mue.7o22nrzUni/u',
          'ADMIN',
          true
        ]
      );
    }

    console.log('✅ Purge complete! Database now contains ONLY registered platform accounts and authentic user data.');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  clearFakeData();
}

module.exports = clearFakeData;
