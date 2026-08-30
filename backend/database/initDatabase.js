const { Pool, Client } = require('pg');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

async function initDatabase(poolInstance) {
  let tempClient = null;
  try {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'postgres';
    const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
    const port = parseInt(process.env.DB_PORT || '5432', 10);
    const dbName = process.env.DB_NAME || 'smart_surplus';
    const isSslRequired = process.env.DB_SSL === 'true' || 
      process.env.DB_SSL === true || 
      Boolean(process.env.DATABASE_URL) ||
      (host && (host.includes('supabase.co') || host.includes('pooler.supabase.com') || host.includes('render.com')));

    // 1. Ensure database exists by connecting to default 'postgres' database (skip if target is already 'postgres' or cloud host)
    if (!process.env.DATABASE_URL && dbName !== 'postgres' && !isSslRequired) {
      try {
        tempClient = new Client({
          host,
          user,
          password,
          port,
          database: 'postgres',
          ssl: isSslRequired ? { rejectUnauthorized: false } : false
        });
        await tempClient.connect();
        const checkRes = await tempClient.query(
          "SELECT 1 FROM pg_database WHERE datname = $1",
          [dbName]
        );
        if (checkRes.rowCount === 0) {
          await tempClient.query(`CREATE DATABASE "${dbName}" ENCODING 'UTF8'`);
          console.log(`✅ PostgreSQL database '${dbName}' created.`);
        }
        await tempClient.end();
        tempClient = null;
      } catch (dbCheckErr) {
        if (tempClient) {
          try { await tempClient.end(); } catch (e) {}
          tempClient = null;
        }
      }
    }

    // 2. Initialize target pool if not provided
    let pool = poolInstance;
    let localPoolCreated = false;
    if (!pool) {
      pool = new Pool(process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10
      } : {
        host,
        user,
        password,
        port,
        database: dbName,
        ssl: isSslRequired ? { rejectUnauthorized: false } : false,
        max: 10
      });
      localPoolCreated = true;
    }

    // 3. Read and execute table creation DDL if tables not yet created
    const tablesCheck = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users' LIMIT 1");
    if (tablesCheck.rowCount === 0) {
      const tablesSqlPath = path.resolve(__dirname, '../../database/createTables.sql');
      if (fs.existsSync(tablesSqlPath)) {
        const sqlContent = fs.readFileSync(tablesSqlPath, 'utf8');
        const cleanSql = sqlContent.replace(/--.*$/gm, '').trim();
        const statements = cleanSql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          try {
            await pool.query(statement);
          } catch (tableErr) {
            console.warn('Table DDL notice:', tableErr.message);
          }
        }
      }
    }

    // 4. Migrate and ensure columns for vehicles, drivers, trips & pairing_codes
    try {
      await pool.query(`
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

        -- Food Donation Impact & People Served tracking fields
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
            food_category VARCHAR(100) DEFAULT 'Cooked Food',
            quantity_distributed DECIMAL(10, 2) DEFAULT 0.00,
            beneficiaries_served INT DEFAULT 0,
            distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            distribution_location TEXT DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE distributions ADD COLUMN IF NOT EXISTS food_category VARCHAR(100) DEFAULT 'Cooked Food';
        ALTER TABLE distributions ADD COLUMN IF NOT EXISTS quantity_distributed DECIMAL(10, 2) DEFAULT 0.00;
        ALTER TABLE distributions ADD COLUMN IF NOT EXISTS beneficiaries_served INT DEFAULT 0;
        ALTER TABLE distributions ADD COLUMN IF NOT EXISTS distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE distributions ADD COLUMN IF NOT EXISTS distribution_location TEXT DEFAULT NULL;
        ALTER TABLE distributions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

        -- Donor Trust Score System & Confidential Reviews Table
        CREATE TABLE IF NOT EXISTS donor_reviews (
            id SERIAL PRIMARY KEY,
            donor_id INT NOT NULL,
            reviewer_type VARCHAR(20) NOT NULL DEFAULT 'NGO',
            reviewer_id INT NOT NULL,
            reviewer_name VARCHAR(150) DEFAULT NULL,
            donation_id INT DEFAULT NULL,
            rating_points DECIMAL(3, 1) NOT NULL DEFAULT 5.0,
            food_quality_score DECIMAL(3, 1) DEFAULT 5.0,
            packaging_score DECIMAL(3, 1) DEFAULT 5.0,
            timeliness_score DECIMAL(3, 1) DEFAULT 5.0,
            complaint_category VARCHAR(100) DEFAULT NULL,
            complaint_text TEXT DEFAULT NULL,
            has_complaint BOOLEAN DEFAULT FALSE,
            admin_status VARCHAR(50) DEFAULT 'NEW',
            admin_notes TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE donors ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5, 2) DEFAULT 5.00;
        ALTER TABLE donors ADD COLUMN IF NOT EXISTS trust_points DECIMAL(5, 2) DEFAULT 100.00;
        ALTER TABLE donors ADD COLUMN IF NOT EXISTS total_reviews_count INT DEFAULT 0;
        ALTER TABLE donors ADD COLUMN IF NOT EXISTS trust_level VARCHAR(50) DEFAULT 'TOP_RATED';
        ALTER TABLE donors ADD COLUMN IF NOT EXISTS business_name VARCHAR(150);
        ALTER TABLE donors ADD COLUMN IF NOT EXISTS organization_name VARCHAR(150);

        ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_name VARCHAR(100);
        ALTER TABLE drivers ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(30);
        ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(30);
      `);
    } catch (migErr) {
      console.warn('Fleet & Impact migration notice:', migErr.message);
    }

    // 5. Ensure Default System Admin Account exists
    try {
      const adminExists = await pool.query(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        ['admin@gmail.com']
      );
      if (adminExists.rowCount === 0) {
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
        console.log('✅ Default Platform Administrator created (admin@gmail.com)');
      }
    } catch (e) {
      console.warn('Admin seed notice:', e.message);
    }

    console.log(`✅ PostgreSQL Database '${dbName}' and tables verified successfully.`);
    if (localPoolCreated) {
      await pool.end();
    }
    return true;
  } catch (err) {
    if (tempClient) {
      try { await tempClient.end(); } catch (e) {}
    }
    console.warn('⚠️ Auto-initialization notice:', err.message);
    return false;
  }
}

if (require.main === module) {
  (async () => {
    try {
      const host = process.env.DB_HOST || 'localhost';
      const user = process.env.DB_USER || 'postgres';
      const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
      const port = parseInt(process.env.DB_PORT || '5432', 10);
      const dbName = process.env.DB_NAME || 'smart_surplus';

      console.log(`Attempting connection to PostgreSQL on ${host}:${port} as ${user}...`);
      await initDatabase();
      console.log('Database initialization complete.');
      process.exit(0);
    } catch (err) {
      console.error('Initialization failed:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = initDatabase;
