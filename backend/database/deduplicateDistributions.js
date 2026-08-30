const db = require('./databaseConnection');

async function deduplicateDistributions() {
  console.log('🧹 Deduplicating distribution rows in PostgreSQL...');
  await new Promise(r => setTimeout(r, 1500));

  if (!db.isConnected) {
    console.error('❌ Database not connected');
    process.exit(1);
  }

  // 1. Delete duplicate distribution rows keeping only the latest ID per (ngo_id, donation_id)
  await db.query(`
    DELETE FROM distributions a
    USING distributions b
    WHERE a.id < b.id
      AND a.ngo_id = b.ngo_id
      AND a.donation_id = b.donation_id
      AND a.donation_id IS NOT NULL;
  `);

  // 2. Also ensure for donation 1, 2, 3 we have clean values
  const [rows] = await db.query('SELECT id, ngo_id, donation_id, quantity_distributed, beneficiaries_served, distribution_location, category FROM distributions ORDER BY donation_id ASC');
  console.log('Cleaned distributions:');
  console.table(rows);

  const [sum] = await db.query('SELECT SUM(beneficiaries_served) as total_served, COUNT(*) as total_drives FROM distributions WHERE ngo_id = 1');
  console.log('Summary:', sum[0]);

  process.exit(0);
}

deduplicateDistributions().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
