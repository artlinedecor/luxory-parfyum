const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  await client.connect();

  // 1. Get all in-stock products
  const res = await client.query(`
    SELECT id, title, stock, is_available, image_url, price_usd, cost_price_usd 
    FROM products 
    WHERE stock > 0 
    ORDER BY title ASC
  `);

  console.log(`=== 32 IN-STOCK PRODUCTS AUDIT ===`);
  for (let i = 0; i < res.rows.length; i++) {
    const p = res.rows[i];
    console.log(`${i + 1}. [${p.title}]`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Stock: ${p.stock}, Available: ${p.is_available}, Price USD: ${p.price_usd}`);
    console.log(`   Image URL: ${p.image_url}`);
  }

  // 2. Also check all products in the database: how many have image_url = null, is_available = false, etc.
  const totalRes = await client.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN stock > 0 THEN 1 END) as in_stock,
      COUNT(CASE WHEN is_available = true THEN 1 END) as available,
      COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as with_images,
      COUNT(CASE WHEN is_available = true AND (image_url IS NULL OR image_url = '') THEN 1 END) as available_no_images
    FROM products
  `);

  console.log('\n=== OVERALL STATS ===');
  console.log(totalRes.rows[0]);

  // 3. List all products that are is_available = true but image_url is NULL or broken
  const brokenRes = await client.query(`
    SELECT id, title, is_available, stock, image_url 
    FROM products 
    WHERE is_available = true AND (image_url IS NULL OR image_url = '')
  `);
  console.log('\n=== AVAILABLE BUT NO IMAGE (COUNT: ' + brokenRes.rows.length + ') ===');
  console.table(brokenRes.rows.slice(0, 20));

  await client.end();
}

run();
