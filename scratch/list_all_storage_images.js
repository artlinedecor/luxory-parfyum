const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  await client.connect();

  const storageRes = await client.query("SELECT name FROM storage.objects WHERE bucket_id = 'product-images' ORDER BY name ASC");
  console.log(`Total storage images: ${storageRes.rows.length}`);
  
  const fs = require('fs');
  fs.writeFileSync('scratch/all_storage_images.json', JSON.stringify(storageRes.rows.map(r => r.name), null, 2));
  console.log('Saved all storage image names to scratch/all_storage_images.json');

  await client.end();
}

run();
