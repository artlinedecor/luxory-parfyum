const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  try {
    await client.connect();

    // 1. Set is_available = true for all in-stock products
    const updateRes = await client.query(`
      UPDATE products 
      SET is_available = true 
      WHERE stock > 0
    `);
    console.log(`Updated is_available = true for ${updateRes.rowCount} in-stock products.`);

    // 2. Fetch all in-stock products to verify
    const res = await client.query(`
      SELECT id, title, stock, is_available, image_url, price_usd, product_type 
      FROM products 
      WHERE stock > 0 
      ORDER BY title ASC
    `);

    console.log(`Verified ${res.rows.length} in-stock items:`);
    console.table(res.rows.map((r, i) => ({
      n: i + 1,
      title: r.title,
      stock: r.stock,
      available: r.is_available,
      hasImage: !!r.image_url,
      imageUrl: r.image_url ? r.image_url.slice(-40) : 'NONE'
    })));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
