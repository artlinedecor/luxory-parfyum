const fs = require('fs');

const files = JSON.parse(fs.readFileSync('scratch/all_storage_images.json', 'utf8'));

const targets = [
  { name: "CLIVE CHRISTIAN No.1", filter: f => f.includes('clive') },
  { name: "BLEU DE CHANEL PARFUM", filter: f => f.includes('bleu') || (f.includes('chanel') && !f.includes('coco') && !f.includes('chance')) },
  { name: "AFTERNOON SWIM Louis Vuitton", filter: f => f.includes('afternoon_swim') || (f.includes('louis_vuitton') && f.includes('swim')) },
  { name: "Amouage Guidance 46", filter: f => f.includes('guidance') || f.includes('amouage') },
  { name: "BYREDO BAL D’AFRIQUE", filter: f => f.includes('byredo') || f.includes('bal_d') },
  { name: "CHANEL CHANCE EAU SPLENDIDE", filter: f => f.includes('chance') },
  { name: "Clive Christian Hedonistic", filter: f => f.includes('hedonistic') || f.includes('kiss_me') },
  { name: "Clive Christian Blonde Amber", filter: f => f.includes('blonde_amber') },
  { name: "COCO MADEMOISELLE CHANEL", filter: f => f.includes('coco_mademoiselle') || f.includes('coco') },
  { name: "DIOR SAUVAGE ELIXIR", filter: f => f.includes('sauvage') },
  { name: "Ex Nihilo Fleur Narcotique", filter: f => f.includes('fleur_narcotique') || f.includes('ex_nihilo') },
  { name: "EYES Louis Vuitton", filter: f => f.includes('eyes') },
  { name: "Good Girl Gone Bad by Kilian", filter: f => f.includes('good_girl') || f.includes('kilian') },
  { name: "HFC Paris Delisitrige", filter: f => f.includes('delisitrige') || f.includes('hfc') },
  { name: "HORMONE This Is Not GABA", filter: f => f.includes('gaba') || f.includes('hormone') },
  { name: "Louis Vuitton Attrape-Rêves", filter: f => f.includes('attrape') || f.includes('louis_vuitton') },
  { name: "Louis Vuitton California Dream", filter: f => f.includes('california') },
  { name: "Maison Crivelli Oud Maracujá", filter: f => f.includes('oud_maracuj') || f.includes('crivelli') },
  { name: "Maison Crivelli Patchouli Magnetik", filter: f => f.includes('patchouli') },
  { name: "MARC-ANTOINE BARROIS TILIA", filter: f => f.includes('tilia') || f.includes('barrois') },
  { name: "Marc-Antoine Barrois Aldebaran", filter: f => f.includes('aldebaran') },
  { name: "Marc-Antoine Barrois Ganymede", filter: f => f.includes('ganymede') },
  { name: "My Burberry Blush", filter: f => f.includes('burberry') || f.includes('blush') },
  { name: "PACIFIC CHILL Louis Vuitton", filter: f => f.includes('pacific') },
  { name: "Versace Bright Crystal", filter: f => f.includes('bright_crystal') },
  { name: "VERSACE CRYSTAL NOIR", filter: f => f.includes('crystal_noir') },
  { name: "XERJOFF ACCENTO PURPLE", filter: f => f.includes('accento') },
  { name: "XERJOFF AMARIS Alexandria II", filter: f => f.includes('alexandria') || f.includes('amaris') },
  { name: "Xerjoff Erba Pura", filter: f => f.includes('erba_pura') },
  { name: "XERJOFF MORE THAN WORDS", filter: f => f.includes('more_than_words') },
  { name: "XERJOFF TORINO21", filter: f => f.includes('torino') },
  { name: "YSL Libre", filter: f => f.includes('libre') }
];

let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Timestamp Selector for 32 Perfumes</title>
  <style>
    body { background: #0f0f0f; color: #eee; font-family: sans-serif; padding: 20px; }
    .section { margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    h2 { color: #d4af37; margin-bottom: 10px; }
    .row { display: flex; flex-wrap: wrap; gap: 15px; }
    .item { background: #1c1c1c; border-radius: 8px; overflow: hidden; width: 220px; border: 1px solid #333; }
    .item img { width: 100%; height: 220px; object-fit: cover; }
    .name { font-size: 11px; padding: 8px; color: #aaa; word-break: break-all; }
  </style>
</head>
<body>
  <h1>Select Exact Real Bottle Images</h1>
`;

targets.forEach((t, idx) => {
  const matches = files.filter(t.filter);
  html += `
  <div class="section">
    <h2>#${idx + 1}. ${t.name} (${matches.length} variants)</h2>
    <div class="row">
  `;
  matches.forEach(m => {
    const url = `https://zfcfqkzqvfttzgthnqpo.supabase.co/storage/v1/object/public/product-images/${m}`;
    html += `
      <div class="item">
        <img src="${url}" loading="lazy" />
        <div class="name">${m}</div>
      </div>
    `;
  });
  html += `
    </div>
  </div>
  `;
});

html += `</body></html>`;
fs.writeFileSync('scratch/all_variants.html', html);
console.log('Saved scratch/all_variants.html');
