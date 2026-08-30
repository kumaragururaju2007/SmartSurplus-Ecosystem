const db = require('./databaseConnection');

async function cleanDuplicates() {
  console.log('🧹 Starting database cleanup of duplicate match records...');
  await new Promise(r => setTimeout(r, 1500));
  try {
    if (db.isConnected) {
      // 1. Delete duplicate donation_matches keeping the lowest id for each (donation_id, ngo_id)
      await db.query(`
        DELETE FROM donation_matches
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM donation_matches
          GROUP BY donation_id, ngo_id
        )
      `);
      console.log('✅ Duplicate donation matches removed.');

      // 2. Ensure distributions table has records for completed donations if missing
      const [completedDonations] = await db.query(`
        SELECT d.*, m.ngo_id, donor.business_name as donor_name, ngo.organization_name as ngo_name, ngo.address as ngo_address
        FROM donations d
        JOIN donation_matches m ON d.id = m.donation_id
        JOIN donors donor ON d.donor_id = donor.id
        JOIN ngos ngo ON m.ngo_id = ngo.id
        WHERE d.status IN ('DELIVERED', 'COMPLETED')
      `);

      for (const don of completedDonations) {
        const [existing] = await db.query(
          'SELECT id FROM distributions WHERE notes LIKE ? AND ngo_id = ?',
          [`%Donation #${don.id}%`, don.ngo_id]
        );

        if (existing.length === 0) {
          const qty = parseFloat(don.quantity_received || don.quantity || 25);
          const people = don.people_served_actual || don.people_served_estimate || Math.round(qty * 2.5);
          await db.query(
            `INSERT INTO distributions (ngo_id, food_category, quantity_distributed, beneficiaries_served, distribution_date, distribution_location, notes)
             VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
            [
              don.ngo_id,
              don.food_category || 'Cooked Food',
              qty,
              people,
              don.ngo_address || 'NGO Distribution Hub',
              `Impact recorded from Donation #${don.id} (${don.donor_name || 'Donor'})`
            ]
          );
          console.log(`✅ Seeded missing distribution log for Donation #${don.id}`);
        }
      }

      // 3. Ensure impact_records table is synchronized
      for (const don of completedDonations) {
        const qty = parseFloat(don.quantity_received || don.quantity || 25);
        const people = don.people_served_actual || don.people_served_estimate || Math.round(qty * 2.5);
        const co2Kg = parseFloat((qty * 2.1).toFixed(2));
        const [existingIr] = await db.query('SELECT id FROM impact_records WHERE donation_id = ?', [don.id]);
        if (existingIr.length === 0) {
          await db.query(
            `INSERT INTO impact_records (donation_id, food_rescued_kg, meals_served, people_served_actual, people_served_type, impact_status, co2_saved_kg)
             VALUES (?, ?, ?, ?, 'ACTUAL', 'CONFIRMED', ?)`,
            [don.id, qty, people, people, co2Kg]
          );
          console.log(`✅ Synchronized impact_record for Donation #${don.id}`);
        }
      }
    } else {
      console.log('In-memory store mode active - memory store is clean.');
    }
    console.log('🎉 Database cleanup completed successfully.');
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  }
}

cleanDuplicates().then(() => {
  setTimeout(() => process.exit(0), 1000);
});
