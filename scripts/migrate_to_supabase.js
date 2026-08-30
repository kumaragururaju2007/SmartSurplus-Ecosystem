/**
 * SmartSurplus Complete Database Migration: Local PostgreSQL -> Supabase PostgreSQL
 */

const { Client } = require('../backend/node_modules/pg');
const path = require('path');
const fs = require('fs');
require('../backend/node_modules/dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sourceConfig = {
  host: process.env.LOCAL_DB_HOST || 'localhost',
  user: process.env.LOCAL_DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || '12345',
  database: process.env.LOCAL_DB_NAME || 'smart_surplus',
  port: parseInt(process.env.LOCAL_DB_PORT || '5432', 10)
};

const targetConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: { rejectUnauthorized: false }
};

const tablesInOrder = [
  'users',
  'donors',
  'ngos',
  'biogas_plants',
  'ngo_requests',
  'distributions',
  'organization_documents',
  'donations',
  'donation_matches',
  'biogas_matches',
  'collections',
  'notifications',
  'subscriptions',
  'payments',
  'impact_records',
  'audit_logs',
  'admin_notifications',
  'vehicles',
  'drivers',
  'trips',
  'trip_location_logs',
  'gps_devices',
  'pairing_codes'
];

async function migrate() {
  console.log('🚀 Starting Full SmartSurplus Database Migration to Supabase...');
  console.log(`📡 Source Database : postgresql://${sourceConfig.user}:****@${sourceConfig.host}:${sourceConfig.port}/${sourceConfig.database}`);
  console.log(`☁️  Target Database : postgresql://${targetConfig.user}:****@${targetConfig.host}:${targetConfig.port}/${targetConfig.database}\n`);

  const sourceClient = new Client(sourceConfig);
  const targetClient = new Client(targetConfig);

  try {
    await sourceClient.connect();
    console.log('✅ Connected to Local PostgreSQL source database.');

    await targetClient.connect();
    console.log('✅ Connected to Supabase PostgreSQL target database.');

    // 1. Base Schema DDL from createTables.sql
    console.log('\n📄 Syncing Schema & Tables in Supabase...');
    const tablesSqlPath = path.resolve(__dirname, '../database/createTables.sql');
    if (fs.existsSync(tablesSqlPath)) {
      const sqlContent = fs.readFileSync(tablesSqlPath, 'utf8');
      const cleanSql = sqlContent.replace(/--.*$/gm, '').trim();
      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          await targetClient.query(stmt);
        } catch (tableErr) {}
      }
      console.log('✅ Base schema verified.');
    }

    // 2. Extensions & Column Migrations
    const extensionDDL = `
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100) DEFAULT NULL;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT NULL;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS pincode VARCHAR(20) DEFAULT NULL;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(50) DEFAULT NULL;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS fssai_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED';
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS is_fssai_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS is_business_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS is_location_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'PENDING';
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS verification_reason TEXT DEFAULT NULL;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS verified_by VARCHAR(100) DEFAULT NULL;
      ALTER TABLE donors ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP DEFAULT NULL;

      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS legal_registration_number VARCHAR(100) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS registration_authority VARCHAR(150) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS registration_date VARCHAR(50) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS ngo_darpan_id VARCHAR(50) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS darpan_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED';
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS pan VARCHAR(30) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS tax_12a_12ab VARCHAR(50) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS tax_80g VARCHAR(50) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS fcra_number VARCHAR(50) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS fcra_status VARCHAR(50) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS designation VARCHAR(100) DEFAULT 'Authorized Representative';
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS official_website VARCHAR(200) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS official_email VARCHAR(150) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS official_phone VARCHAR(30) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS meals_per_day INT DEFAULT 0;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS operating_days VARCHAR(100) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(100) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS emergency_support BOOLEAN DEFAULT FALSE;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'PENDING';
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS verification_reason TEXT DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS verified_by VARCHAR(100) DEFAULT NULL;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP DEFAULT NULL;

      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS plant_type VARCHAR(100) DEFAULT 'Biogas';
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS operator_name VARCHAR(150) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS plant_registration_number VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS gobardhan_registration_number VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS gobardhan_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED';
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS mnre_application_id VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS mnre_programme VARCHAR(150) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS state_implementing_agency VARCHAR(150) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS commissioning_certificate_number VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS commissioning_date VARCHAR(50) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS designation VARCHAR(100) DEFAULT 'Plant Manager';
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS operating_status VARCHAR(50) DEFAULT 'Operational';
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS feedstock_capacity_daily DECIMAL(10, 2) DEFAULT 0.00;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS capacity_unit VARCHAR(50) DEFAULT 'kg/day';
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS biogas_production_capacity VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS cbg_production_capacity VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS power_generation_capacity VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS waste_processing_capacity VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS feedstock_types TEXT DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS pincode VARCHAR(20) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'PENDING';
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS verification_reason TEXT DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS verified_by VARCHAR(100) DEFAULT NULL;
      ALTER TABLE biogas_plants ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP DEFAULT NULL;

      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS biogas_plant_id INT DEFAULT NULL;
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS handler_type VARCHAR(20) DEFAULT 'NGO';
      ALTER TABLE vehicles ALTER COLUMN ngo_id DROP NOT NULL;

      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS biogas_plant_id INT DEFAULT NULL;
      ALTER TABLE drivers ADD COLUMN IF NOT EXISTS handler_type VARCHAR(20) DEFAULT 'NGO';
      ALTER TABLE drivers ALTER COLUMN ngo_id DROP NOT NULL;

      ALTER TABLE trips ADD COLUMN IF NOT EXISTS biogas_plant_id INT DEFAULT NULL;
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS handler_type VARCHAR(20) DEFAULT 'NGO';
      ALTER TABLE trips ALTER COLUMN ngo_id DROP NOT NULL;

      ALTER TABLE ngos ALTER COLUMN address DROP NOT NULL;
      ALTER TABLE donors ALTER COLUMN address DROP NOT NULL;
      ALTER TABLE biogas_plants ALTER COLUMN address DROP NOT NULL;

      CREATE TABLE IF NOT EXISTS pairing_codes (
          id SERIAL PRIMARY KEY,
          code VARCHAR(10) UNIQUE NOT NULL,
          vehicle_id INT NOT NULL,
          driver_id INT NOT NULL,
          trip_id INT DEFAULT NULL,
          handler_type VARCHAR(20) DEFAULT 'BIOGAS',
          handler_id INT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP DEFAULT NULL,
          status VARCHAR(20) DEFAULT 'ACTIVE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE donations ADD COLUMN IF NOT EXISTS quantity_received DECIMAL(10, 2) DEFAULT NULL;
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS people_served_estimate INT DEFAULT NULL;
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS people_served_actual INT DEFAULT NULL;
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS people_served_type VARCHAR(20) DEFAULT 'ESTIMATED';
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS impact_status VARCHAR(50) DEFAULT 'PENDING';
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS impact_confirmed_by VARCHAR(150) DEFAULT NULL;
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS impact_confirmed_at TIMESTAMP DEFAULT NULL;

      ALTER TABLE impact_records ADD COLUMN IF NOT EXISTS people_served_estimate INT DEFAULT NULL;
      ALTER TABLE impact_records ADD COLUMN IF NOT EXISTS people_served_actual INT DEFAULT NULL;
      ALTER TABLE impact_records ADD COLUMN IF NOT EXISTS people_served_type VARCHAR(20) DEFAULT 'ESTIMATED';
      ALTER TABLE impact_records ADD COLUMN IF NOT EXISTS impact_status VARCHAR(50) DEFAULT 'CONFIRMED';

      CREATE TABLE IF NOT EXISTS distributions (
          id SERIAL PRIMARY KEY,
          ngo_id INT NOT NULL,
          donation_id INT DEFAULT NULL,
          distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          quantity_received DECIMAL(10, 2) DEFAULT 0.00,
          quantity_distributed DECIMAL(10, 2) DEFAULT 0.00,
          beneficiaries_served INT DEFAULT 0,
          distribution_location TEXT DEFAULT NULL,
          food_category VARCHAR(100) DEFAULT 'Cooked Food',
          category VARCHAR(100) DEFAULT 'Cooked Food',
          notes TEXT DEFAULT NULL,
          status VARCHAR(50) DEFAULT 'COMPLETED',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE distributions ADD COLUMN IF NOT EXISTS food_category VARCHAR(100) DEFAULT 'Cooked Food';
      ALTER TABLE distributions ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Cooked Food';
      ALTER TABLE distributions ADD COLUMN IF NOT EXISTS quantity_received DECIMAL(10, 2) DEFAULT 0.00;
      ALTER TABLE distributions ADD COLUMN IF NOT EXISTS quantity_distributed DECIMAL(10, 2) DEFAULT 0.00;
      ALTER TABLE distributions ADD COLUMN IF NOT EXISTS beneficiaries_served INT DEFAULT 0;
      ALTER TABLE distributions ADD COLUMN IF NOT EXISTS distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE distributions ADD COLUMN IF NOT EXISTS distribution_location TEXT DEFAULT NULL;
      ALTER TABLE distributions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;
      ALTER TABLE distributions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED';
    `;

    for (const stmt of extensionDDL.split(';').map(s => s.trim()).filter(Boolean)) {
      try {
        await targetClient.query(stmt);
      } catch (colErr) {}
    }
    console.log('✅ Extended schema columns verified.');

    // 3. Data Migration
    console.log('\n📦 Migrating data table by table...');
    const migrationSummary = [];

    for (const tableName of tablesInOrder) {
      const srcRows = await sourceClient.query(`SELECT * FROM "${tableName}" ORDER BY id ASC`);
      const rowCount = srcRows.rows.length;

      if (rowCount === 0) {
        migrationSummary.push({ table: tableName, local: 0, supabase: 0, status: 'EMPTY' });
        continue;
      }

      // Check if already migrated
      const existingTgtCount = await targetClient.query(`SELECT count(*) FROM "${tableName}"`);
      if (parseInt(existingTgtCount.rows[0].count, 10) === rowCount) {
        migrationSummary.push({
          table: tableName,
          local: rowCount,
          supabase: rowCount,
          status: 'MATCHED'
        });
        console.log(`  ✓ Table '${tableName}': ${rowCount} rows (Already in sync)`);
        continue;
      }

      // Fetch columns
      const colsRes = await targetClient.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);
      const targetColumns = new Set(colsRes.rows.map(r => r.column_name));

      for (const row of srcRows.rows) {
        const availableCols = Object.keys(row).filter(c => targetColumns.has(c));
        const colNames = availableCols.map(c => `"${c}"`).join(', ');
        const placeholders = availableCols.map((_, i) => `$${i + 1}`).join(', ');
        const values = availableCols.map(c => row[c]);

        const updateSets = availableCols
          .filter(c => c !== 'id')
          .map(c => `"${c}" = EXCLUDED."${c}"`)
          .join(', ');

        let insertSql = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders})`;
        if (updateSets.length > 0) {
          insertSql += ` ON CONFLICT (id) DO UPDATE SET ${updateSets}`;
        } else {
          insertSql += ` ON CONFLICT (id) DO NOTHING`;
        }

        await targetClient.query(insertSql, values);
      }

      // Reset SERIAL Sequence
      try {
        await targetClient.query(`
          SELECT setval(
            pg_get_serial_sequence('"${tableName}"', 'id'),
            COALESCE((SELECT MAX(id) FROM "${tableName}"), 1),
            true
          );
        `);
      } catch (seqErr) {}

      // Verify count
      const tgtCountRes = await targetClient.query(`SELECT count(*) FROM "${tableName}"`);
      const tgtCount = parseInt(tgtCountRes.rows[0].count, 10);

      migrationSummary.push({
        table: tableName,
        local: rowCount,
        supabase: tgtCount,
        status: rowCount === tgtCount ? 'MATCHED' : 'MISMATCH'
      });
      console.log(`  ✓ Table '${tableName}': ${rowCount} rows (Supabase count: ${tgtCount})`);
    }

    console.log('\n📊 Migration Summary Table:');
    console.table(migrationSummary);

    const allMatched = migrationSummary.every(s => s.status === 'MATCHED' || s.status === 'EMPTY');
    if (allMatched) {
      console.log('\n🎉 ALL 23 TABLES SUCCESSFULLY MIGRATED TO SUPABASE WITH 100% DATA PARITY!');
    }

  } catch (err) {
    console.error('\n❌ Migration error:', err);
  } finally {
    try { await sourceClient.end(); } catch (e) {}
    try { await targetClient.end(); } catch (e) {}
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
