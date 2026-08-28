const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const os = require('os');
const { Client } = require('pg');

let desktopDir = path.join(os.homedir(), 'Desktop');
if (!fs.existsSync(desktopDir)) {
  const onedriveDesktop = path.join(os.homedir(), 'OneDrive', 'Desktop');
  if (fs.existsSync(onedriveDesktop)) desktopDir = onedriveDesktop;
}
const outputDir = path.join(desktopDir, 'Atirlar_Rasmlari');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`Status ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function run() {
  // 1. Check storage images
  let storageImages = [];
  if (fs.existsSync('scratch/all_storage_images.json')) {
    const raw = JSON.parse(fs.readFileSync('scratch/all_storage_images.json', 'utf8'));
    storageImages = raw.map(item => typeof item === 'string' ? item : (item.name || item.Key || ''));
  }

  console.log(`Loaded ${storageImages.length} storage image filenames.`);

  const searchKeywords = [
    { name: "Tiziana_Terenzi_Kirke", keys: ["kirke", "terenzi"] },
    { name: "Louis_Vuitton_Symphony", keys: ["symphony"] },
    { name: "Sevaverek", keys: ["sevaverek", "sevave"] },
    { name: "Xerjoff_Casamorati_Lira", keys: ["lira", "casamorati"] },
    { name: "Dior_Jadore", keys: ["jadore", "j'adore", "adore"] },
    { name: "Bvlgari_Le_Gemme_Tygar", keys: ["tygar"] },
    { name: "YSL_Libre_Berry_Crush", keys: ["berry", "crush", "libre"] },
    { name: "Clive_Christian_Matsukita", keys: ["matsukita"] },
  ];

  for (const item of searchKeywords) {
    console.log(`\n========================================`);
    console.log(`Target: ${item.name}`);
    const matches = storageImages.filter(f => {
      if (!f) return false;
      const lower = f.toLowerCase();
      return item.keys.some(k => lower.includes(k.toLowerCase()));
    });

    console.log(`Found ${matches.length} matches in Supabase Storage:`);
    for (const fileName of matches) {
      const publicUrl = `https://zfcfqkzqvfttzgthnqpo.supabase.co/storage/v1/object/public/product-images/${fileName}`;
      console.log(`  - ${fileName}`);
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const dest = path.join(outputDir, `${item.name}__${cleanFileName}`);
      try {
        await downloadFile(publicUrl, dest);
        console.log(`    -> Saved to Desktop: ${dest}`);
      } catch (err) {
        console.error(`    -> Error downloading ${fileName}:`, err.message);
      }
    }
  }

  // 2. Also check PostgreSQL DB for any other matching product titles
  const client = new Client({
    connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  });
  await client.connect();

  console.log(`\n========================================`);
  console.log(`Checking Database products directly...`);
  const dbRes = await client.query("SELECT id, title, image_url FROM products WHERE image_url IS NOT NULL AND image_url != ''");
  
  for (const item of searchKeywords) {
    const dbMatches = dbRes.rows.filter(r => {
      if (!r.title) return false;
      const t = r.title.toLowerCase();
      return item.keys.some(k => t.includes(k.toLowerCase()));
    });
    for (const r of dbMatches) {
      console.log(`DB Match for ${item.name}: ${r.title} => ${r.image_url}`);
      try {
        const ext = path.extname(new URL(r.image_url).pathname) || '.jpg';
        const safeTitle = r.title.replace(/[^a-zA-Z0-9_\u0400-\u04FF\s-]/g, '').trim().replace(/\s+/g, '_');
        const dest = path.join(outputDir, `DB_${item.name}_${safeTitle}_${r.id.slice(0, 5)}${ext}`);
        if (!fs.existsSync(dest)) {
          await downloadFile(r.image_url, dest);
          console.log(`  -> Saved DB Image: ${dest}`);
        }
      } catch (e) {
        console.log(`  -> Error:`, e.message);
      }
    }
  }

  await client.end();
  console.log(`\nAll downloads finished! Files are located in: ${outputDir}`);
}

run().catch(console.error);
