const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://ljlwfzvathvltqxwqsxk.supabase.co",
  "sb_publishable_ZwLT9uvHxrG_v6FHGhmUfQ_ssqmznii"
);

// Gender bo'yicha to'g'ri ajratish
const genderMap = {
  // ═══ ERKAKLAR (male) ═══
  "🖤 BLEU DE CHANEL PARFUM": "male",
  "DIOR SAUVAGE ELIXIR 60 ml": "male",
  "XERJOFF TORINO21 100 ml": "male",
  "XERJOFF AMARIS Alexandria || ": "male",
  "XERJOFF MORE THAN WORDS": "male",
  "Louis Vuitton Imagination 100ML": "male",
  "Creed Absolu Aventus 100 ml": "male",
  "Bvlgari Le Gemme - Tygar Eau De Parfum 125 ml": "male",
  "Clive Christian Jump Up And Kiss Me Hedonistic (2021)": "male",
  "Louis Vuitton – Ombre Nomade": "male",
  "AFTERNOON SWIM Louis Vuitton": "male",
  "Bvlgari Tygar Extrait ✨": "male",
  "Louis Vuitton L'Immensité 100ML": "male",
  "EYES — Louis Vuitton 100 ml": "male",
  "PACIFIC CHILL — Louis Vuitton": "male",

  // ═══ AYOLLAR (female) ═══
  "CHANEL CHANCE EAU SPLENDIDE": "female",
  "Chance Eau Tendre Chanel для женщин": "female",
  "My Burberry Blush Eau De Parfum 🌸": "female",
  "VERSACE CRYSTAL NOIR": "female",
  "COCO MADEMOISELLE CHANEL": "female",
  "VICTORIA'S SECRET BOMBSHELL": "female",
  "XERJOFF ACCENTO PURPLE": "female",
  "Louis Vuitton Attrape-Rêves ": "female",
  "Good Girl Gone Bad by Kilian ✨": "female",
  "Amouage Guidance ✨": "female",
  "Amouage Guidance 46 ✨": "female",
  "HFC Paris Delisitrige ✨": "female",
  "Louis Vuitton California Dream ": "female",
  "YSL Libre Berry Crush ❤️": "female",
  "YSL Libre Eau De Parfum ✨": "female",
  "Versace Bright Crystal ✨": "female",
  "J'adore — Dior ✨ 100 ml": "female",
  "SYMPHONY — Louis Vuitton ": "female",
  "👑 CLIVE CHRISTIAN No.1": "female",
  "CASAMORATI LIRA 100 ml": "female",

  // ═══ UNISEX ═══
  "Clive Christian Matsukita Crown Collection 50ML": "unisex",
  "Clive Christian XXI Blonde Amber 50ML": "unisex",
  "BYREDO BAL D'AFRIQUE ✨": "unisex",
  "MARC-ANTOINE BARROIS — TILIA": "unisex",
  "Marc-Antoine Barrois Ganymede ✨": "unisex",
  "Marc-Antoine Barrois Aldebaran ✨": "unisex",
  "Tiziana Terenzi Kirke ✨": "unisex",
  "Xerjoff Erba Pura Eau de Parfum 100 ml": "unisex",
  "Ex Nihilo Fleur Narcotique ✨": "unisex",
  "Maison Crivelli Patchouli Magnetik ✨": "unisex",
  "Maison Crivelli Oud Maracujá ✨": "unisex",
  "HORMONE | This Is Not GABA ✨": "unisex",
};

async function fixGender() {
  const { data: products, error } = await supabase.from("products").select("id,title");
  if (error) { console.error("Fetch error:", error); return; }

  let updated = 0, skipped = 0;

  for (const p of products) {
    const gender = genderMap[p.title];
    if (gender) {
      const { error: upErr } = await supabase
        .from("products")
        .update({ gender })
        .eq("id", p.id);
      if (upErr) {
        console.log(`❌ ${p.title}: ${upErr.message}`);
      } else {
        console.log(`✅ ${p.title} -> ${gender}`);
        updated++;
      }
    } else {
      console.log(`⏭️  ${p.title} -> (map'da topilmadi, o'zgarmadi)`);
      skipped++;
    }
  }

  console.log(`\n🎉 ${updated} ta yangilandi, ${skipped} ta o'zgartirilmadi.`);
}

fixGender();
