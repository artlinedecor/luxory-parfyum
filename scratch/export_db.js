const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:OldDb_P@ssw0rd_123!@db.ljlwfzvathvltqxwqsxk.supabase.co:5432/postgres',
});

async function exportData() {
  try {
    await client.connect();
    console.log("Connected to old DB.");

    const productsRes = await client.query('SELECT * FROM products');
    fs.writeFileSync('old_products.json', JSON.stringify(productsRes.rows, null, 2));
    console.log(`Exported ${productsRes.rows.length} products.`);

    const ordersRes = await client.query('SELECT * FROM orders');
    fs.writeFileSync('old_orders.json', JSON.stringify(ordersRes.rows, null, 2));
    console.log(`Exported ${ordersRes.rows.length} orders.`);

  } catch (err) {
    console.error("Error exporting:", err);
  } finally {
    await client.end();
  }
}

exportData();
