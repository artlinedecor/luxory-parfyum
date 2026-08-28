const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  await client.connect();

  const res = await client.query("SELECT image_url FROM products WHERE image_url IS NOT NULL AND image_url != ''");
  const hostnames = new Set();
  res.rows.forEach(r => {
    try {
      const u = new URL(r.image_url);
      hostnames.add(u.hostname);
    } catch(e) {
      console.log('Invalid URL:', r.image_url);
    }
  });

  console.log('All unique image hostnames in DB:', Array.from(hostnames));

  await client.end();
}

run();
