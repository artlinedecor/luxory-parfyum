const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function setupStorage() {
  try {
    await client.connect();
    console.log("Connected to DB.");

    // Create bucket
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('product-images', 'product-images', true) 
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Bucket created.");

    // Create RLS policy to allow anon to do anything in this bucket temporarily
    await client.query(`
      DROP POLICY IF EXISTS "Public Access" ON storage.objects;
      CREATE POLICY "Public Access" ON storage.objects 
      FOR ALL 
      USING (bucket_id = 'product-images') 
      WITH CHECK (bucket_id = 'product-images');
    `);
    console.log("RLS Policy created.");

  } catch (err) {
    console.error("Error setting up storage:", err);
  } finally {
    await client.end();
  }
}

setupStorage();
