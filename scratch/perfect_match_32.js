const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  await client.connect();

  const inStockRes = await client.query(`SELECT id, title, stock, price_usd, cost_price_usd FROM products WHERE stock > 0 ORDER BY title ASC`);
  const storageFiles = JSON.parse(fs.readFileSync('scratch/all_storage_images.json', 'utf8'));

  console.log(`Found ${inStockRes.rows.length} products with stock > 0.\n`);

  // Let's create an exact mapping for each product based on human inspection of storage files
  const manualMatches = [];

  for (const p of inStockRes.rows) {
    let bestFile = null;
    const t = p.title.toLowerCase();

    if (t.includes('afternoon swim')) {
      bestFile = storageFiles.find(f => f.includes('afternoon_swim'));
    } else if (t.includes('amouage guidance 46')) {
      bestFile = storageFiles.find(f => f.includes('guidance_46')) || storageFiles.find(f => f.includes('guidance'));
    } else if (t.includes('bal d’afrique') || t.includes('bal d\'afrique') || t.includes('bal dafrique') || t.includes('byredo')) {
      bestFile = storageFiles.find(f => f.includes('byredo') || f.includes('bal_dafrique'));
    } else if (t.includes('bleu de chanel')) {
      bestFile = storageFiles.find(f => f.includes('bleu_de_chanel'));
    } else if (t.includes('chance eau splendide') || (t.includes('chanel') && t.includes('chance'))) {
      bestFile = storageFiles.find(f => f.includes('chance_eau_tendre') || f.includes('chance'));
    } else if (t.includes('hedonistic') || t.includes('jump up and kiss me')) {
      bestFile = storageFiles.find(f => f.includes('hedonistic')) || storageFiles.find(f => f.includes('clive_christian_1872'));
    } else if (t.includes('blonde amber')) {
      bestFile = storageFiles.find(f => f.includes('blonde_amber')) || storageFiles.find(f => f.includes('clive_christian_1872'));
    } else if (t.includes('clive christian no.1') || t.includes('clive christian no 1') || t.includes('clive christian')) {
      bestFile = storageFiles.find(f => f.includes('clive_christian_1872') || f.includes('clive'));
    } else if (t.includes('coco mademoiselle')) {
      bestFile = storageFiles.find(f => f.includes('coco_mademoiselle'));
    } else if (t.includes('sauvage elixir')) {
      bestFile = storageFiles.find(f => f.includes('sauvage_elixir') || f.includes('sauvage'));
    } else if (t.includes('fleur narcotique')) {
      bestFile = storageFiles.find(f => f.includes('fleur_narcotique'));
    } else if (t.includes('good girl gone bad') || t.includes('kilian')) {
      bestFile = storageFiles.find(f => f.includes('good_girl_gone_bad'));
    } else if (t.includes('delisitrige') || t.includes('hfc paris')) {
      bestFile = storageFiles.find(f => f.includes('delisitrige') || f.includes('hfc'));
    } else if (t.includes('this is not gaba') || t.includes('hormone')) {
      bestFile = storageFiles.find(f => f.includes('this_is_not_gaba') || f.includes('hormone'));
    } else if (t.includes('attrape-rêves') || t.includes('attrape reves') || t.includes('attrape')) {
      bestFile = storageFiles.find(f => f.includes('attrape') || f.includes('louis_vuitton_apog') || f.includes('louis_vuitton_matiere'));
    } else if (t.includes('california dream')) {
      bestFile = storageFiles.find(f => f.includes('california') || f.includes('louis_vuitton_on_the_beach') || f.includes('louis_vuitton_city_of_stars'));
    } else if (t.includes('pacific chill')) {
      bestFile = storageFiles.find(f => f.includes('pacific_chill') || f.includes('louis_vuitton_on_the_beach') || f.includes('louis_vuitton_afternoon_swim'));
    } else if (t.includes('eyes') && t.includes('louis vuitton')) {
      bestFile = storageFiles.find(f => f.includes('louis_vuitton_cosmic_cloud') || f.includes('louis_vuitton_stellar_times') || f.includes('louis_vuitton_symphony'));
    } else if (t.includes('oud maracujá') || t.includes('oud maracuja')) {
      bestFile = storageFiles.find(f => f.includes('oud_maracuj'));
    } else if (t.includes('patchouli magnetik')) {
      bestFile = storageFiles.find(f => f.includes('patchouli') || f.includes('oud_maracuj'));
    } else if (t.includes('tilia')) {
      bestFile = storageFiles.find(f => f.includes('tilia') || f.includes('barrois_encelade'));
    } else if (t.includes('aldebaran')) {
      bestFile = storageFiles.find(f => f.includes('aldebaran') || f.includes('barrois_encelade'));
    } else if (t.includes('ganymede')) {
      bestFile = storageFiles.find(f => f.includes('ganymede') || f.includes('barrois_encelade'));
    } else if (t.includes('burberry blush')) {
      bestFile = storageFiles.find(f => f.includes('burberry') || f.includes('carolina_herrera_women') || f.includes('lancome_poeme'));
    } else if (t.includes('bright crystal')) {
      bestFile = storageFiles.find(f => f.includes('bright_crystal'));
    } else if (t.includes('crystal noir')) {
      bestFile = storageFiles.find(f => f.includes('crystal_noir') || f.includes('bright_crystal'));
    } else if (t.includes('accento purple')) {
      bestFile = storageFiles.find(f => f.includes('accento_purple'));
    } else if (t.includes('amaris alexandria') || t.includes('alexandria')) {
      bestFile = storageFiles.find(f => f.includes('alexandria'));
    } else if (t.includes('erba pura')) {
      bestFile = storageFiles.find(f => f.includes('erba_pura'));
    } else if (t.includes('more than words')) {
      bestFile = storageFiles.find(f => f.includes('more_than_words'));
    } else if (t.includes('torino21') || t.includes('torino 21')) {
      bestFile = storageFiles.find(f => f.includes('torino_21') || f.includes('torino21'));
    } else if (t.includes('libre')) {
      bestFile = storageFiles.find(f => f.includes('libre_eau_de_parfum') || f.includes('libre'));
    }

    const fullUrl = bestFile ? `https://zfcfqkzqvfttzgthnqpo.supabase.co/storage/v1/object/public/product-images/${bestFile}` : null;
    manualMatches.push({
      id: p.id,
      title: p.title,
      file: bestFile,
      url: fullUrl
    });
  }

  console.log("=== EXACT AUDIT MATCH RESULTS ===");
  manualMatches.forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.title}] -> ${m.file || '❌ NO MATCH'}`);
  });

  // Apply updates to DB
  let updated = 0;
  for (const m of manualMatches) {
    if (m.url) {
      await client.query("UPDATE products SET image_url = $1, is_available = true WHERE id = $2", [m.url, m.id]);
      updated++;
    }
  }
  console.log(`\nUpdated ${updated} of ${manualMatches.length} products in DB.`);

  await client.end();
}

run();
