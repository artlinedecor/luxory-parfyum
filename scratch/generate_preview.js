const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, title, image_url, stock, price_usd FROM products WHERE stock > 0 ORDER BY title ASC`);

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>All 32 In-Stock Products Audit</title>
  <style>
    body { background: #111; color: #fff; font-family: sans-serif; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .card { background: #222; border-radius: 12px; overflow: hidden; border: 1px solid #444; padding: 10px; }
    .card img { width: 100%; height: 260px; object-fit: cover; border-radius: 8px; }
    .title { font-size: 14px; font-weight: bold; margin: 10px 0 5px; color: #d4af37; }
    .filename { font-size: 11px; color: #888; word-break: break-all; }
  </style>
</head>
<body>
  <h1>All 32 In-Stock Products Visual Verification</h1>
  <div class="grid">
`;

  res.rows.forEach((p, idx) => {
    const filename = p.image_url ? p.image_url.split('/').pop() : 'NO IMAGE';
    html += `
    <div class="card">
      <div style="font-size: 12px; color: #aaa;">#${idx + 1}</div>
      <img src="${p.image_url}" alt="${p.title}" />
      <div class="title">${p.title}</div>
      <div class="filename">${filename}</div>
    </div>
    `;
  });

  html += `
  </div>
</body>
</html>`;

  fs.writeFileSync('scratch/preview_32.html', html);
  console.log('Created scratch/preview_32.html');
  await client.end();
}

run();
