const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function matchAndFillImages() {
  try {
    await client.connect();
    
    // 1. Get in-stock products
    const inStockRes = await client.query("SELECT id, title, image_url FROM products WHERE stock > 0 ORDER BY title ASC");
    const inStock = inStockRes.rows;
    console.log(`Found ${inStock.length} in-stock products.`);

    // 2. Get all products with image_url
    const withImgRes = await client.query("SELECT id, title, image_url FROM products WHERE image_url IS NOT NULL");
    const withImg = withImgRes.rows;

    // 3. Get all storage files
    const storageRes = await client.query("SELECT name FROM storage.objects WHERE bucket_id = 'product-images'");
    const storageFiles = storageRes.rows;

    console.log(`Available images in DB: ${withImg.length}, in storage: ${storageFiles.length}`);

    const results = [];

    for (const p of inStock) {
      let matchedUrl = p.image_url;

      // Clean title for matching
      const cleanTitle = p.title
        .toLowerCase()
        .replace(/[👑🖤✨🌸|—\-_()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const keywords = cleanTitle.split(' ').filter(w => w.length > 2);

      // Check DB match
      if (!matchedUrl) {
        for (const item of withImg) {
          const itemClean = item.title.toLowerCase().replace(/[👑🖤✨🌸|—\-_()]/g, ' ').replace(/\s+/g, ' ').trim();
          const matchCount = keywords.filter(k => itemClean.includes(k)).length;
          if (matchCount >= Math.min(keywords.length, 2)) {
            matchedUrl = item.image_url;
            break;
          }
        }
      }

      // Check Storage file match
      if (!matchedUrl) {
        for (const f of storageFiles) {
          const fClean = f.name.toLowerCase().replace(/[_\-.]/g, ' ');
          const matchCount = keywords.filter(k => fClean.includes(k)).length;
          if (matchCount >= Math.min(keywords.length, 2)) {
            matchedUrl = `https://zfcfqkzqvfttzgthnqpo.supabase.co/storage/v1/object/public/product-images/${f.name}`;
            break;
          }
        }
      }

      results.push({
        id: p.id,
        title: p.title,
        matchedUrl: matchedUrl
      });
    }

    console.log("Matching results:");
    console.table(results.map((r, i) => ({
      n: i + 1,
      title: r.title,
      hasImage: !!r.matchedUrl,
      imageUrl: r.matchedUrl ? r.matchedUrl.substring(0, 70) + '...' : 'NONE'
    })));

    // Let's count how many got matched
    const matchedCount = results.filter(r => r.matchedUrl).length;
    console.log(`Matched ${matchedCount} of ${inStock.length} items.`);

    // If we want to update the DB:
    let updated = 0;
    for (const r of results) {
      if (r.matchedUrl) {
        await client.query("UPDATE products SET image_url = $1 WHERE id = $2", [r.matchedUrl, r.id]);
        updated++;
      }
    }
    console.log(`Successfully updated ${updated} products in Supabase!`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

matchAndFillImages();
