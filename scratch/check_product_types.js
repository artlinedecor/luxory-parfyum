const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  await client.connect();

  const res = await client.query("SELECT id, title, product_type, stock, is_available FROM products WHERE stock > 0");
  console.log(`In-stock products: ${res.rows.length}`);
  const types = {};
  res.rows.forEach(r => {
    types[r.product_type] = (types[r.product_type] || 0) + 1;
  });
  console.log('Product types among in-stock:', types);

  await client.end();
}

run();
