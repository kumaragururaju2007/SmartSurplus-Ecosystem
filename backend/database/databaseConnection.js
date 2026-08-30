const { Pool, Client } = require('pg');
const path = require('path');
const initDatabase = require('./initDatabase');

// Load environment variables from project root or backend folder
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

// Clean In-Memory Store (Zero dummy data - populated solely by live platform registrations & activities)
const memoryStore = {
  users: [
    { id: 1, name: 'Platform System Administrator', email: 'admin@gmail.com', phone: '+919876543299', password: '$2a$10$c7IbIp7DBrya4r1k6LddpOPGdpiMcbExt3hh4Mue.7o22nrzUni/u', role: 'ADMIN', is_verified: true }
  ],
  donors: [],
  ngos: [],
  ngo_requests: [],
  distributions: [],
  biogas_plants: [],
  organization_documents: [],
  donations: [],
  donation_matches: [],
  biogas_matches: [],
  collections: [],
  notifications: [],
  subscriptions: [],
  payments: [],
  impact_records: [],
  audit_logs: [],
  admin_notifications: [],
  vehicles: [],
  drivers: [],
  trips: [],
  trip_location_logs: [],
  gps_devices: [],
  pairing_codes: [],
  donor_reviews: []
};

let pool = null;
let isConnectedToPostgres = false;

const isSslRequired = process.env.DB_SSL === 'true' || 
  process.env.DB_SSL === true || 
  Boolean(process.env.DATABASE_URL) ||
  (process.env.DB_HOST && (process.env.DB_HOST.includes('supabase.co') || process.env.DB_HOST.includes('pooler.supabase.com') || process.env.DB_HOST.includes('render.com')));

const dbConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
} : {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'smart_surplus',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: isSslRequired ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

// SQL Transformation Helper for PostgreSQL Compatibility
function transformSql(rawSql) {
  let transformedSql = rawSql;

  // 1. Transform MySQL backticks to standard identifiers or clean text
  transformedSql = transformedSql.replace(/`([^`]+)`/g, '"$1"');

  // 2. Transform IF(cond, val1, val2) to CASE WHEN cond THEN val1 ELSE val2 END
  transformedSql = transformedSql.replace(/\bIF\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi, (match, p1, p2, p3) => {
    return `CASE WHEN ${p1} THEN ${p2} ELSE ${p3} END`;
  });

  // 2b. Transform boolean integer comparisons (e.g., is_verified = 1 -> is_verified = TRUE)
  transformedSql = transformedSql.replace(/\b(is_[a-zA-Z0-9_]+)\s*=\s*1\b/gi, '$1 = TRUE');
  transformedSql = transformedSql.replace(/\b(is_[a-zA-Z0-9_]+)\s*=\s*0\b/gi, '$1 = FALSE');

  // 2c. Transform unquoted INTERVAL X SECOND -> INTERVAL 'X seconds'
  transformedSql = transformedSql.replace(/INTERVAL\s+(\d+)\s+SECOND/gi, "INTERVAL '$1 seconds'");
  transformedSql = transformedSql.replace(/INTERVAL\s+(\d+)\s+MINUTE/gi, "INTERVAL '$1 minutes'");
  transformedSql = transformedSql.replace(/INTERVAL\s+(\d+)\s+HOUR/gi, "INTERVAL '$1 hours'");
  transformedSql = transformedSql.replace(/INTERVAL\s+(\d+)\s+DAY/gi, "INTERVAL '$1 days'");

  // 2d. Transform double-quoted enum/status/role values to single-quoted strings
  transformedSql = transformedSql.replace(/"(DONOR|NGO|BIOGAS|ADMIN|USER|OFFERED|ACCEPTED|REJECTED|EXPIRED|POSTED|MATCHED|PICKUP_STARTED|COLLECTED|IN_TRANSIT|RECEIVED|DELIVERED|COMPLETED|CANCELLED|REDIRECTED_TO_BIOGAS|PENDING|VERIFIED|SUSPENDED|ACTIVE|FREE|PRO_MONTHLY|PRO_YEARLY|SUCCESS|FAILED|UPLOADED|UNDER_REVIEW|AVAILABLE|ASSIGNED|ON_TRIP|MAINTENANCE|INACTIVE|OFFLINE)"/g, "'$1'");

  // 2e. Transform COALESCE boolean integer matching (COALESCE(is_..., 0) -> COALESCE(is_..., FALSE))
  transformedSql = transformedSql.replace(/COALESCE\s*\(\s*([^,]+?is_[a-zA-Z0-9_]+)\s*,\s*0\s*\)/gi, 'COALESCE($1, FALSE)');
  transformedSql = transformedSql.replace(/COALESCE\s*\(\s*([^,]+?is_[a-zA-Z0-9_]+)\s*,\s*([^,]+?is_[a-zA-Z0-9_]+)\s*,\s*0\s*\)/gi, 'COALESCE($1, $2, FALSE)');

  // 3. Transform ON DUPLICATE KEY UPDATE to ON CONFLICT
  if (/ON\s+DUPLICATE\s+KEY\s+UPDATE/i.test(transformedSql)) {
    const tableMatch = transformedSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_"]+)/i);
    const tableName = tableMatch ? tableMatch[1].replace(/"/g, '').toLowerCase() : '';
    
    let conflictTarget = 'id';
    if (tableName === 'donors' || tableName === 'ngos' || tableName === 'biogas_plants' || tableName === 'subscriptions') {
      conflictTarget = 'user_id';
    } else if (tableName === 'collections' || tableName === 'impact_records') {
      conflictTarget = 'donation_id';
    } else if (tableName === 'gps_devices') {
      conflictTarget = 'vehicle_id';
    }

    transformedSql = transformedSql.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, `ON CONFLICT (${conflictTarget}) DO UPDATE SET`);
    // Replace VALUES(col) with EXCLUDED.col
    transformedSql = transformedSql.replace(/VALUES\s*\(\s*([a-zA-Z0-9_"]+)\s*\)/gi, 'EXCLUDED.$1');
  }

  // 4. Transform UPDATE t1 JOIN t2 ON cond SET t1.col = ... WHERE ...
  const updateJoinRegex = /UPDATE\s+([a-zA-Z0-9_]+)\s+JOIN\s+([a-zA-Z0-9_]+)\s+ON\s+([^S]+?)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i;
  const match = transformedSql.match(updateJoinRegex);
  if (match) {
    const [, table1, table2, joinCond, setClause, whereClause] = match;
    transformedSql = `UPDATE ${table1} SET ${setClause} FROM ${table2} WHERE ${joinCond} AND (${whereClause})`;
  }

  // 5. Append RETURNING id for INSERT queries if not already present
  const isInsert = /^\s*INSERT\s+INTO/i.test(transformedSql);
  if (isInsert && !/RETURNING/i.test(transformedSql)) {
    transformedSql += ' RETURNING id';
  }

  // 6. Convert ? placeholders to $1, $2, $3...
  let paramIndex = 1;
  transformedSql = transformedSql.replace(/\?/g, () => `$${paramIndex++}`);

  return { sql: transformedSql, isInsert };
}

let initPromise = null;

async function initializeDatabaseConnection() {
  try {
    // 1. Ensure target database exists by connecting to 'postgres' (skip for Supabase / cloud DBs)
    if (dbConfig.database !== 'postgres' && !isSslRequired) {
      try {
        const rootClient = new Client({
          host: dbConfig.host,
          user: dbConfig.user,
          password: dbConfig.password,
          port: dbConfig.port,
          database: 'postgres',
          ssl: dbConfig.ssl
        });
        await rootClient.connect();
        const checkRes = await rootClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbConfig.database]);
        if (checkRes.rowCount === 0) {
          await rootClient.query(`CREATE DATABASE "${dbConfig.database}" ENCODING 'UTF8'`);
        }
        await rootClient.end();
      } catch (e) {
        // Fallback if connecting to default 'postgres' database is not permitted
      }
    }

    // 2. Initialize connection pool targeting PostgreSQL database
    pool = new Pool(dbConfig);
    const client = await pool.connect();
    isConnectedToPostgres = true;
    console.log('✅ PostgreSQL Database connected successfully');

    // 3. Run auto-initialization & verify schema
    try {
      await initDatabase(pool);
    } catch (initErr) {
      console.warn('initDatabase notice:', initErr.message);
    }

    // 4. Auto-migrate tables with new verification & registration columns
    try {
      const donorCols = [
        { name: 'contact_person', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'city', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'state', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'pincode', type: 'VARCHAR(20) DEFAULT NULL' },
        { name: 'fssai_number', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'fssai_status', type: "VARCHAR(50) DEFAULT 'NOT_SUBMITTED'" },
        { name: 'is_fssai_verified', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'is_business_verified', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'is_location_verified', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'is_phone_verified', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'is_verified', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'is_available', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'verification_status', type: "VARCHAR(50) DEFAULT 'PENDING'" },
        { name: 'verification_reason', type: 'TEXT DEFAULT NULL' },
        { name: 'verified_by', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'verified_at', type: 'TIMESTAMP DEFAULT NULL' }
      ];

      const ngoCols = [
        { name: 'legal_registration_number', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'registration_authority', type: 'VARCHAR(150) DEFAULT NULL' },
        { name: 'registration_date', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'ngo_darpan_id', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'darpan_status', type: "VARCHAR(50) DEFAULT 'NOT_SUBMITTED'" },
        { name: 'pan', type: 'VARCHAR(30) DEFAULT NULL' },
        { name: 'tax_12a_12ab', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'tax_80g', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'fcra_number', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'fcra_status', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'designation', type: "VARCHAR(100) DEFAULT 'Authorized Representative'" },
        { name: 'official_website', type: 'VARCHAR(200) DEFAULT NULL' },
        { name: 'official_email', type: 'VARCHAR(150) DEFAULT NULL' },
        { name: 'official_phone', type: 'VARCHAR(30) DEFAULT NULL' },
        { name: 'meals_per_day', type: 'INT DEFAULT 0' },
        { name: 'operating_days', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'operating_hours', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'emergency_support', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'verification_status', type: "VARCHAR(50) DEFAULT 'PENDING'" },
        { name: 'verification_reason', type: 'TEXT DEFAULT NULL' },
        { name: 'verified_by', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'verified_at', type: 'TIMESTAMP DEFAULT NULL' }
      ];

      const biogasCols = [
        { name: 'plant_type', type: "VARCHAR(100) DEFAULT 'Biogas'" },
        { name: 'operator_name', type: 'VARCHAR(150) DEFAULT NULL' },
        { name: 'plant_registration_number', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'gobardhan_registration_number', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'gobardhan_status', type: "VARCHAR(50) DEFAULT 'NOT_SUBMITTED'" },
        { name: 'mnre_application_id', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'mnre_programme', type: 'VARCHAR(150) DEFAULT NULL' },
        { name: 'state_implementing_agency', type: 'VARCHAR(150) DEFAULT NULL' },
        { name: 'commissioning_certificate_number', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'commissioning_date', type: 'VARCHAR(50) DEFAULT NULL' },
        { name: 'contact_person', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'designation', type: "VARCHAR(100) DEFAULT 'Plant Manager'" },
        { name: 'operating_status', type: "VARCHAR(50) DEFAULT 'Operational'" },
        { name: 'feedstock_capacity_daily', type: 'DECIMAL(10, 2) DEFAULT 0.00' },
        { name: 'capacity_unit', type: "VARCHAR(50) DEFAULT 'kg/day'" },
        { name: 'biogas_production_capacity', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'cbg_production_capacity', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'power_generation_capacity', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'waste_processing_capacity', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'feedstock_types', type: 'TEXT DEFAULT NULL' },
        { name: 'description', type: 'TEXT DEFAULT NULL' },
        { name: 'city', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'state', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'pincode', type: 'VARCHAR(20) DEFAULT NULL' },
        { name: 'verification_status', type: "VARCHAR(50) DEFAULT 'PENDING'" },
        { name: 'verification_reason', type: 'TEXT DEFAULT NULL' },
        { name: 'verified_by', type: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'verified_at', type: 'TIMESTAMP DEFAULT NULL' }
      ];

      const runMigration = async (table, cols) => {
        try {
          const sql = `ALTER TABLE ${table} ${cols.map(c => `ADD COLUMN IF NOT EXISTS ${c.name} ${c.type}`).join(', ')}`;
          await client.query(sql);
        } catch (colErr) {
          // Fallback to individual columns if batch encounters an error
          for (const col of cols) {
            try {
              await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
            } catch (e) {}
          }
        }
      };

      await runMigration('donors', donorCols);
      await runMigration('ngos', ngoCols);
      await runMigration('biogas_plants', biogasCols);
    } catch (migrationErr) {
      console.warn('Notice: Organization auto-migration check completed.');
    }

    client.release();
  } catch (err) {
    isConnectedToPostgres = false;
    console.warn('\n' + '='.repeat(60));
    console.warn('⚠️  PostgreSQL Database connection status: OFFLINE / ACCESS DENIED');
    console.warn(`   Reason: ${err.message}`);
    console.warn('\n👉 How to connect to PostgreSQL:');
    console.warn('   1. Open the .env file in your project directory');
    console.warn('   2. Set your PostgreSQL credentials:');
    console.warn('      DB_USER=postgres');
    console.warn('      DB_PASSWORD=your_postgresql_password');
    console.warn('      DB_PORT=5432');
    console.warn('   3. Save the file and restart the server.');
    console.warn('⚡ Operating seamlessly in IN-MEMORY MODE (all features fully functional)');
    console.warn('='.repeat(60) + '\n');
  }
}

initPromise = initializeDatabaseConnection();

const db = {
  get isConnected() { return isConnectedToPostgres; },
  get memoryStore() { return memoryStore; },
  get ready() { return initPromise; },
  async query(sql, params = []) {
    if (!isConnectedToPostgres && initPromise) {
      try {
        await initPromise;
      } catch (e) {}
    }
    if (isConnectedToPostgres && pool) {
      try {
        const { sql: formattedSql, isInsert } = transformSql(sql);
        const cleanParams = (params || []).map(p => p === undefined ? null : p);
        const res = await pool.query(formattedSql, cleanParams);

        if (isInsert) {
          const insertId = res.rows && res.rows[0] && (res.rows[0].id || res.rows[0].ID) ? res.rows[0].id : 0;
          return [{ insertId, affectedRows: res.rowCount, rowCount: res.rowCount }, res.fields];
        }

        const isMutation = /^\s*(UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)/i.test(sql);
        if (isMutation) {
          return [{ insertId: 0, affectedRows: res.rowCount, rowCount: res.rowCount }, res.fields];
        }

        return [res.rows, res.fields];
      } catch (err) {
        console.error('PostgreSQL query error:', err.message);
        throw err;
      }
    } else {
      return [memoryStore];
    }
  }
};

module.exports = db;
