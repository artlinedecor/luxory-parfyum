const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const os = require('os');
const { Client } = require('pg');

const targetNames = [
  'Kirke',
  'Symphony',
  'Sevaverek',
  'Lira',
  "J'adore",
  'Tygar',
  'Berry Crush',
  'Matsukita'
];

// Determine desktop folder
let desktopDir = path.join(os.homedir(), 'Desktop');
if (!fs.existsSync(desktopDir)) {
  const onedriveDesktop = path.join(os.homedir(), 'OneDrive', 'Desktop');
  if (fs.existsSync(onedriveDesktop)) {
    desktopDir = onedriveDesktop;
  }
}

const outputDir = path.join(desktopDir, 'Atirlar_Rasmlari');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Target Output Directory:', outputDir);

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

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
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed with status ${response.statusCode}`));
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
  await client.connect();

  const res = await client.query("SELECT id, title, image_url, stock, product_type FROM products");
  const allProducts = res.rows;

  console.log(`Total products in DB: ${allProducts.length}`);

  for (const query of targetNames) {
    const matched = allProducts.filter(p => p.title && p.title.toLowerCase().includes(query.toLowerCase()));
    console.log(`\n--- Query: "${query}" (Matches found: ${matched.length}) ---`);
    for (const p of matched) {
      console.log(`ID: ${p.id} | Title: ${p.title} | Stock: ${p.stock} | Type: ${p.product_type} | Image: ${p.image_url}`);
      if (p.image_url) {
        try {
          const ext = path.extname(new URL(p.image_url).pathname) || '.jpg';
          const safeTitle = p.title.replace(/[^a-zA-Z0-9_\u0400-\u04FF\s-]/g, '').trim().replace(/\s+/g, '_');
          const dest = path.join(outputDir, `${safeTitle}_${p.id.slice(0, 6)}${ext}`);
          await downloadFile(p.image_url, dest);
          console.log(`  -> Downloaded: ${dest}`);
        } catch (e) {
          console.error(`  -> Download error for ${p.title}:`, e.message);
        }
      } else {
        console.log(`  -> No image_url set!`);
      }
    }
  }

  await client.end();
}

run().catch(console.error);
