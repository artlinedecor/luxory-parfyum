const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  await client.connect();

  const res = await client.query("SELECT id, title, image_url, stock, is_available FROM products ORDER BY stock DESC, title ASC");
  console.log(`Total products in DB: ${res.rows.length}`);

  const withStock = res.rows.filter(r => r.stock > 0);
  const withoutStock = res.rows.filter(r => !r.stock || r.stock === 0);

  console.log(`In stock (stock > 0): ${withStock.length}`);
  console.log(`Out of stock: ${withoutStock.length}`);

  let inStockValid = 0;
  let inStockInvalid = 0;
  for (const r of withStock) {
    if (r.image_url && r.image_url.startsWith('http')) {
      inStockValid++;
    } else {
      inStockInvalid++;
      console.log(`❌ IN STOCK BUT NO IMAGE: ${r.title}`);
    }
  }
  console.log(`In-stock with valid image: ${inStockValid}, invalid: ${inStockInvalid}`);

  // Let's check how many total products have an image URL
  const withImage = res.rows.filter(r => r.image_url && r.image_url.startsWith('http'));
  console.log(`Total products with image_url: ${withImage.length} / ${res.rows.length}`);

  await client.end();
}

run();
