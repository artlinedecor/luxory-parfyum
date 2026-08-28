const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  await client.connect();

  const inStockRes = await client.query(`SELECT id, title FROM products WHERE stock > 0 ORDER BY title ASC`);
  const storageFiles = JSON.parse(fs.readFileSync('scratch/all_storage_images.json', 'utf8'));

  console.log(`Checking exact matches for ${inStockRes.rows.length} in-stock products:\n`);

  for (let i = 0; i < inStockRes.rows.length; i++) {
    const p = inStockRes.rows[i];
    // Find all storage files that match any part of the name
    const titleParts = p.title.toLowerCase()
      .replace(/[👑🖤✨🌸|—\-_()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['ml', 'eau', 'parfum', 'edp', 'de', 'the'].includes(w));

    const candidateFiles = storageFiles.filter(f => {
      const fLow = f.toLowerCase();
      return titleParts.some(tp => fLow.includes(tp));
    });

    console.log(`${i + 1}. [${p.title}]`);
    console.log(`   Keywords: ${titleParts.join(', ')}`);
    console.log(`   Candidate storage images (${candidateFiles.length}):`);
    candidateFiles.forEach(cf => console.log(`     -> ${cf}`));
    console.log('');
  }

  await client.end();
}

run();
