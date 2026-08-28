const fs = require('fs');

const files = JSON.parse(fs.readFileSync('scratch/all_storage_images.json', 'utf8'));

const targets = [
  { name: "CLIVE CHRISTIAN No.1", filter: f => f.includes('clive_christian_no_1') || f.includes('clive_christian_1872') || f.includes('clive_christian_x_') },
  { name: "BLEU DE CHANEL PARFUM", filter: f => f.includes('bleu_de_chanel') },
  { name: "AFTERNOON SWIM Louis Vuitton", filter: f => f.includes('afternoon_swim') },
  { name: "Amouage Guidance 46", filter: f => f.includes('guidance') },
  { name: "BYREDO BAL D’AFRIQUE", filter: f => f.includes('byredo') || f.includes('bal_d') },
  { name: "CHANEL CHANCE", filter: f => f.includes('chance') },
  { name: "Clive Christian Hedonistic", filter: f => f.includes('hedonistic') },
  { name: "Clive Christian Blonde Amber", filter: f => f.includes('blonde_amber') },
  { name: "COCO MADEMOISELLE CHANEL", filter: f => f.includes('coco_mademoiselle') || f.includes('coco_noir') },
  { name: "DIOR SAUVAGE ELIXIR", filter: f => f.includes('sauvage') },
  { name: "Ex Nihilo Fleur Narcotique", filter: f => f.includes('fleur_narcotique') },
  { name: "EYES Louis Vuitton", filter: f => f.includes('eyes') },
  { name: "Good Girl Gone Bad by Kilian", filter: f => f.includes('good_girl_gone_bad') },
  { name: "HFC Paris Delisitrige", filter: f => f.includes('delisitrige') },
  { name: "HORMONE This Is Not GABA", filter: f => f.includes('this_is_not_gaba') },
  { name: "Louis Vuitton Attrape-Rêves", filter: f => f.includes('attrape') },
  { name: "Louis Vuitton California Dream", filter: f => f.includes('california_dream') },
  { name: "Maison Crivelli Oud Maracujá", filter: f => f.includes('oud_maracuj') },
  { name: "Maison Crivelli Patchouli Magnetik", filter: f => f.includes('patchouli_magnetik') },
  { name: "MARC-ANTOINE BARROIS TILIA", filter: f => f.includes('tilia') },
  { name: "Marc-Antoine Barrois Aldebaran", filter: f => f.includes('aldebaran') },
  { name: "Marc-Antoine Barrois Ganymede", filter: f => f.includes('ganymede') },
  { name: "My Burberry Blush", filter: f => f.includes('burberry') },
  { name: "PACIFIC CHILL Louis Vuitton", filter: f => f.includes('pacific_chill') },
  { name: "Versace Bright Crystal", filter: f => f.includes('bright_crystal') },
  { name: "VERSACE CRYSTAL NOIR", filter: f => f.includes('crystal_noir') },
  { name: "XERJOFF ACCENTO PURPLE", filter: f => f.includes('accento_purple') },
  { name: "XERJOFF AMARIS Alexandria II", filter: f => f.includes('amaris_alexandria') },
  { name: "Xerjoff Erba Pura", filter: f => f.includes('erba_pura') },
  { name: "XERJOFF MORE THAN WORDS", filter: f => f.includes('more_than_words') },
  { name: "XERJOFF TORINO21", filter: f => f.includes('torino') },
  { name: "YSL Libre", filter: f => f.includes('libre_eau_de_parfum') }
];

targets.forEach(t => {
  console.log(`\n=== ${t.name} ===`);
  const matches = files.filter(t.filter);
  matches.forEach(m => console.log(`  https://zfcfqkzqvfttzgthnqpo.supabase.co/storage/v1/object/public/product-images/${m}`));
});
