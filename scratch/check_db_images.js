const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function checkImages() {
  try {
    await client.connect();
    const res = await client.query("SELECT id, title, image_url FROM products LIMIT 5");
    console.log("Sample products:");
    console.table(res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkImages();
