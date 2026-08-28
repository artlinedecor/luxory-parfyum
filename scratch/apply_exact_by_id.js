const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

async function run() {
  await client.connect();

  const prods = (await client.query(`SELECT id, title, stock FROM products WHERE stock > 0 ORDER BY title ASC`)).rows;

  const EXACT_MAP = {
    "👑 CLIVE CHRISTIAN No.1": "public/clive_christian_no_1_1784111052011.jpg",
    "🖤 BLEU DE CHANEL PARFUM": "public/bleu_de_chanel_parfum_1784111077619.jpg",
    "AFTERNOON SWIM Louis Vuitton": "public/afternoon_swim_louis_vuitton_1784110792810.jpg",
    "Amouage Guidance 46 ✨": "public/amouage_guidance_46_1784110953591.jpg",
    "BYREDO BAL D’AFRIQUE ✨": "public/byredo_bal_dafrique_1784111106301.jpg",
    "CHANEL CHANCE EAU SPLENDIDE": "public/chance_eau_tendre_chanel____________1784110915864.jpg",
    "Clive Christian Jump Up And Kiss Me Hedonistic (2021)": "public/clive_christian_jump_up_and_kiss_me_hedonistic__2021__1784110941496.jpg",
    "Clive Christian XXI Blonde Amber 50ML": "public/clive_christian_xxi_blonde_amber_1784110804252.jpg",
    "COCO MADEMOISELLE CHANEL": "public/coco_mademoiselle_chanel_1784110964388.jpg",
    "DIOR SAUVAGE ELIXIR 60 ml": "public/dior_sauvage_elixir_60_ml_1784110927095.jpg",
    "Ex Nihilo Fleur Narcotique ✨": "public/ex_nihilo_fleur_narcotique_1784110901371.jpg",
    "EYES — Louis Vuitton 100 ml": "public/eyes__louis_vuitton_1784110831337.jpg",
    "Good Girl Gone Bad by Kilian ✨": "public/good_girl_gone_bad_by_kilian_1784110997697.jpg",
    "HFC Paris Delisitrige ✨": "public/hfc_paris_delisitrige_1784110880680.jpg",
    "HORMONE | This Is Not GABA ✨": "public/hormone___this_is_not_gaba_1784110861473.jpg",
    "Louis Vuitton Attrape-Rêves ": "public/louis_vuitton_attrape-r_ves_1784110945939.jpg",
    "Louis Vuitton California Dream ": "public/louis_vuitton_california_dream_1784111028786.jpg",
    "Maison Crivelli Oud Maracujá ✨": "public/maison_crivelli_oud_maracuj__1784110968200.jpg",
    "Maison Crivelli Patchouli Magnetik ✨": "public/maison_crivelli_patchouli_magnetik_1784110919410.jpg",
    "MARC-ANTOINE BARROIS — TILIA": "public/marc-antoine_barrois__tilia_1784111170859.jpg",
    "Marc-Antoine Barrois Aldebaran ✨": "public/marc-antoine_barrois_aldebaran_1784110937926.jpg",
    "Marc-Antoine Barrois Ganymede ✨": "public/marc-antoine_barrois_ganymede_1784111041153.jpg",
    "My Burberry Blush Eau De Parfum 🌸": "public/my_burberry_blush_eau_de_parfum_1784110897588.jpg",
    "PACIFIC CHILL — Louis Vuitton": "public/pacific_chill__louis_vuitton_1784110866110.jpg",
    "Versace Bright Crystal ✨": "public/versace_bright_crystal_1784110869960.jpg",
    "VERSACE CRYSTAL NOIR": "public/versace_crystal_noir_1784110905476.jpg",
    "XERJOFF ACCENTO PURPLE": "public/xerjoff_accento_purple_1784110933959.jpg",
    "XERJOFF AMARIS Alexandria || ": "public/xerjoff_amaris_alexandria____1784110843496.jpg",
    "Xerjoff Erba Pura Eau de Parfum 100 ml": "public/xerjoff_erba_pura_eau_de_parfum_1784110826679.jpg",
    "XERJOFF MORE THAN WORDS": "public/xerjoff_more_than_words_1784110796285.jpg",
    "XERJOFF TORINO21 100 ml": "public/xerjoff_torino21_1784111006130.jpg",
    "YSL Libre Eau De Parfum ✨": "public/ysl_libre_eau_de_parfum_1784110788316.jpg"
  };

  console.log("=== UPDATING EXACTLY BY ID ===");
  for (let i = 0; i < prods.length; i++) {
    const p = prods[i];
    const imgFile = EXACT_MAP[p.title];
    if (!imgFile) {
      console.log(`❌ Title not in map: [${p.title}]`);
      continue;
    }
    const fullUrl = `https://zfcfqkzqvfttzgthnqpo.supabase.co/storage/v1/object/public/product-images/${imgFile}`;
    await client.query("UPDATE products SET image_url = $1, is_available = true WHERE id = $2", [fullUrl, p.id]);
    console.log(`✅ [${i + 1}/32] ${p.title} -> ${imgFile}`);
  }

  // Let's verify and test every single one
  console.log("\n=== TESTING ALL 32 HTTP RESPONSES ===");
  const testRes = await client.query("SELECT id, title, image_url, stock, is_available FROM products WHERE stock > 0 ORDER BY title ASC");
  for (const r of testRes.rows) {
    const resp = await fetch(r.image_url, { method: 'HEAD' });
    const ok = resp.status === 200;
    console.log(`${ok ? '🟢' : '🔴'} ${resp.status} | ${r.title} | ${r.image_url.split('/').pop()}`);
  }

  await client.end();
}

run();
