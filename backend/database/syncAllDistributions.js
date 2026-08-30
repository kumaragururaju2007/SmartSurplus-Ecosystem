const db = require('./databaseConnection');

async function syncAllDistributions() {
  console.log('🔄 Synchronizing all distributions with completed donations in PostgreSQL...');
  await new Promise(r => setTimeout(r, 1500));

  if (!db.isConnected) {
    console.error('❌ Database not connected');
    process.exit(1);
  }

  // 1. Fetch all donations that are DELIVERED or COMPLETED for NGO 1 (or all NGOs)
  const [completedMatches] = await db.query(
    `SELECT d.*, m.ngo_id, m.id as match_id, donor.business_name as donor_name, donor.address as donor_address
     FROM donations d
     JOIN donation_matches m ON d.id = m.donation_id
     LEFT JOIN donors donor ON d.donor_id = donor.id
     WHERE d.status IN ('DELIVERED', 'COMPLETED') OR m.match_status IN ('COMPLETED', 'DELIVERED', 'ACCEPTED')
     ORDER BY d.id ASC`
  );

  console.log(`Found ${completedMatches.length} completed donation match rows.`);

  // Make sure match_status is 'COMPLETED' for delivered donations
  for (const row of completedMatches) {
    await db.query('UPDATE donation_matches SET match_status = "COMPLETED" WHERE id = ?', [row.match_id]);
    await db.query('UPDATE donations SET status = "DELIVERED" WHERE id = ?', [row.id]);
  }

  // 2. Clear old partial distribution rows and re-seed clean 1:1 distribution records
  await db.query('DELETE FROM distributions WHERE ngo_id = 1');

  for (const don of completedMatches) {
    const ngoId = don.ngo_id || 1;
    const qty = parseFloat(don.quantity || 10);
    const peopleCount = don.people_served_actual || 10;
    const location = don.donor_address || 'Sathy - Athani - Bhavani Road, Satyamangalam, Tamil Nadu, 638401';
    const cat = don.food_category || 'Cooked Food';
    const donDate = don.created_at || new Date();

    await db.query(
      `INSERT INTO distributions (ngo_id, donation_id, distribution_date, quantity_received, quantity_distributed, beneficiaries_served, distribution_location, category, notes, status, created_at, food_category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?)`,
      [
        ngoId,
        don.id,
        donDate,
        qty,
        qty,
        peopleCount,
        location,
        cat,
        `Community meal redistribution from Donation #${don.id} (${don.food_name || 'Surplus Food'})`,
        donDate,
        cat
      ]
    );
    console.log(`✅ Synced distribution for Donation #${don.id}: ${qty} Meals -> ${peopleCount} Beneficiaries`);
  }

  // 3. Verify total beneficiaries count
  const [totalRows] = await db.query(
    'SELECT SUM(beneficiaries_served) as total_served, COUNT(*) as total_drives, SUM(quantity_distributed) as total_qty FROM distributions WHERE ngo_id = 1'
  );
  console.log('\n📊 Distribution Verification Results:');
  console.table(totalRows);

  console.log('✅ Synchronization completed successfully.');
  process.exit(0);
}

syncAllDistributions().catch(err => {
  console.error('Sync error:', err);
  process.exit(1);
});
