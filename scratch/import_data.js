const { Client } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function runSchema() {
  const schemaSql = fs.readFileSync('../schema.sql', 'utf8');
  await client.query(schemaSql);
  console.log('Schema created.');
}

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function buildInsertQuery(tableName, row) {
  const columns = Object.keys(row).map(k => `"${k}"`);
  const values = Object.values(row);
  const placeholders = values.map((_, i) => `$${i + 1}`);
  const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT DO NOTHING`;
  return { query, values };
}

async function importTable(tableName, filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found. Skipping.`);
    return;
  }
  const rows = await parseCSV(filePath);
  let count = 0;
  for (const row of rows) {
    // Format jsonb if needed
    for (const key in row) {
      if (row[key] === '' || row[key] === 'NULL') {
        row[key] = null;
      }
    }
    const { query, values } = buildInsertQuery(tableName, row);
    try {
      await client.query(query, values);
      count++;
    } catch (e) {
      console.error(`Error inserting into ${tableName}:`, e.message, row);
    }
  }
  console.log(`Imported ${count} rows into ${tableName}.`);
}

async function main() {
  try {
    await client.connect();
    console.log('Connected to new database.');
    
    await runSchema();
    
    // Import Data
    const downloadsDir = 'C:\\Users\\ELYOR\\Downloads\\';

    await importTable('products', downloadsDir + 'products_rows.csv');
    await importTable('orders', downloadsDir + 'orders_rows.csv');
    await importTable('transactions', downloadsDir + 'transactions_rows.csv');

    console.log('Import finished.');
  } catch (err) {
    console.error('Fatal Error:', err);
  } finally {
    await client.end();
  }
}

main();
