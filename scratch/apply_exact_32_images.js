const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zfcfqkzqvfttzgthnqpo:Luxory_Db_P@ssw0rd!2026@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
});

const EXACT_MAPPING = [
  { title: "👑 CLIVE CHRISTIAN No.1", image: "public/clive_christian_no_1_1784111052011.jpg" },
  { title: "🖤 BLEU DE CHANEL PARFUM", image: "public/bleu_de_chanel_parfum_1784111077619.jpg" },
  { title: "AFTERNOON SWIM Louis Vuitton", image: "public/afternoon_swim_louis_vuitton_1784110792810.jpg" },
  { title: "Amouage Guidance 46 ✨", image: "public/amouage_guidance_46_1784110953591.jpg" },
  { title: "BYREDO BAL D’AFRIQUE ✨", image: "public/byredo_bal_dafrique_1784111106301.jpg" },
  { title: "CHANEL CHANCE EAU SPLENDIDE", image: "public/chance_eau_tendre_chanel____________1784110915864.jpg" },
  { title: "Clive Christian Jump Up And Kiss Me Hedonistic (2021)", image: "public/clive_christian_jump_up_and_kiss_me_hedonistic__2021__1784110941496.jpg" },
  { title: "Clive Christian XXI Blonde Amber 50ML", image: "public/clive_christian_xxi_blonde_amber_1784110804252.jpg" },
  { title: "COCO MADEMOISELLE CHANEL", image: "public/coco_mademoiselle_chanel_1784110964388.jpg" },
  { title: "DIOR SAUVAGE ELIXIR 60 ml", image: "public/dior_sauvage_elixir_60_ml_1784110927095.jpg" },
  { title: "Ex Nihilo Fleur Narcotique ✨", image: "public/ex_nihilo_fleur_narcotique_1784110901371.jpg" },
  { title: "EYES — Louis Vuitton 100 ml", image: "public/eyes__louis_vuitton_1784110831337.jpg" },
  { title: "Good Girl Gone Bad by Kilian ✨", image: "public/good_girl_gone_bad_by_kilian_1784110997697.jpg" },
  { title: "HFC Paris Delisitrige ✨", image: "public/hfc_paris_delisitrige_1784110880680.jpg" },
  { title: "HORMONE | This Is Not GABA ✨", image: "public/hormone___this_is_not_gaba_1784110861473.jpg" },
  { title: "Louis Vuitton Attrape-Rêves ", image: "public/louis_vuitton_attrape-r_ves_1784110945939.jpg" },
  { title: "Louis Vuitton California Dream ", image: "public/louis_vuitton_california_dream_1784111028786.jpg" },
  { title: "Maison Crivelli Oud Maracujá ✨", image: "public/maison_crivelli_oud_maracuj__1784110968200.jpg" },
  { title: "Maison Crivelli Patchouli Magnetik ✨", image: "public/maison_crivelli_patchouli_magnetik_1784110919410.jpg" },
  { title: "MARC-ANTOINE BARROIS — TILIA", image: "public/marc-antoine_barrois__tilia_1784111170859.jpg" },
  { title: "Marc-Antoine Barrois Aldebaran ✨", image: "public/marc-antoine_barrois_aldebaran_1784110937926.jpg" },
  { title: "Marc-Antoine Barrois Ganymede ✨", image: "public/marc-antoine_barrois_ganymede_1784111041153.jpg" },
  { title: "My Burberry Blush Eau De Parfum 🌸", image: "public/my_burberry_blush_eau_de_parfum_1784110897588.jpg" },
  { title: "PACIFIC CHILL — Louis Vuitton", image: "public/pacific_chill__louis_vuitton_1784110866110.jpg" },
  { title: "Versace Bright Crystal ✨", image: "public/versace_bright_crystal_1784110869960.jpg" },
  { title: "VERSACE CRYSTAL NOIR", image: "public/versace_crystal_noir_1784110905476.jpg" },
  { title: "XERJOFF ACCENTO PURPLE", image: "public/xerjoff_accento_purple_1784110933959.jpg" },
  { title: "XERJOFF AMARIS Alexandria || ", image: "public/xerjoff_amaris_alexandria____1784110843496.jpg" },
  { title: "Xerjoff Erba Pura Eau de Parfum 100 ml", image: "public/xerjoff_erba_pura_eau_de_parfum_1784110826679.jpg" },
  { title: "XERJOFF MORE THAN WORDS", image: "public/xerjoff_more_than_words_1784110796285.jpg" },
  { title: "XERJOFF TORINO21 100 ml", image: "public/xerjoff_torino21_1784111006130.jpg" },
  { title: "YSL Libre Eau De Parfum ✨", image: "public/ysl_libre_eau_de_parfum_1784110788316.jpg" },
];

async function run() {
  await client.connect();

  console.log(`Applying 100% exact 1-to-1 image mappings for 32 products...\n`);

  let updated = 0;
  for (let i = 0; i < EXACT_MAPPING.length; i++) {
    const item = EXACT_MAPPING[i];
    const fullUrl = `https://zfcfqkzqvfttzgthnqpo.supabase.co/storage/v1/object/public/product-images/${item.image}`;
    
    const res = await client.query(
      `UPDATE products 
       SET image_url = $1, is_available = true 
       WHERE stock > 0 AND title ILIKE $2 
       RETURNING id, title, image_url, stock`,
      [fullUrl, `%${item.title.replace(/[👑🖤✨🌸|—\-_()]/g, '').trim()}%`]
    );

    if (res.rows.length > 0) {
      console.log(`✅ [${i + 1}/32] ${res.rows[0].title}`);
      console.log(`     Image: ${res.rows[0].image_url}`);
      updated++;
    } else {
      console.log(`❌ [${i + 1}/32] Not found in DB: ${item.title}`);
    }
  }

  console.log(`\nSuccessfully applied exact images to ${updated} of ${EXACT_MAPPING.length} products in DB.`);

  await client.end();
}

run();
