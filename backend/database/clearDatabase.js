const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

async function clearDatabase() {
  console.log('Clearing PostgreSQL database tables...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'smart_surplus',
    port: parseInt(process.env.DB_PORT || '5432', 10)
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server.');

    const sql = `
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
    `;

    await client.query(sql);
    console.log('✓ Successfully deleted all donors, NGOs, biogas plants, donations, and matches from PostgreSQL database.');
    
    // Check if Admin exists, if not insert Admin
    const adminRows = await client.query("SELECT * FROM users WHERE role = 'ADMIN'");
    if (adminRows.rowCount === 0) {
      await client.query(`
        INSERT INTO users (name, email, phone, password, role, is_verified) 
        VALUES ('Platform System Administrator', 'admin@gmail.com', '+919876543299', '$2a$10$c7IbIp7DBrya4r1k6LddpOPGdpiMcbExt3hh4Mue.7o22nrzUni/u', 'ADMIN', true)
      `);
      console.log('✓ Re-seeded Platform Administrator user in PostgreSQL.');
    } else {
      console.log('✓ Platform Administrator account preserved.');
    }

    await client.end();
  } catch (err) {
    console.log('PostgreSQL connection notice / in-memory mode active:', err.message);
    try { await client.end(); } catch (e) {}
  }
}

if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase;
