const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://ljlwfzvathvltqxwqsxk.supabase.co",
  "sb_publishable_ZwLT9uvHxrG_v6FHGhmUfQ_ssqmznii"
);

// High-fidelity original prices in USD for Uzbekistan retail market
const originalPrices = {
  "Chance Eau Tendre Chanel для женщин": 150,
  "🖤 BLEU DE CHANEL PARFUM": 195,
  "Clive Christian XXI Blonde Amber 50ML": 450,
  "Clive Christian Matsukita Crown Collection 50ML": 395,
  "CHANEL CHANCE EAU SPLENDIDE": 150,
  "My Burberry Blush Eau De Parfum 🌸": 145,
  "VERSACE CRYSTAL NOIR": 95,
  "DIOR SAUVAGE ELIXIR 60 ml": 190,
  "COCO MADEMOISELLE CHANEL": 160,
  "XERJOFF TORINO21 100 ml": 280,
  "XERJOFF ACCENTO PURPLE": 240,
  "BYREDO BAL D’AFRIQUE ✨": 270,
  "Louis Vuitton Imagination 100ML": 320,
  "Louis Vuitton Attrape-Rêves ": 320,
  "Creed Absolu Aventus 100 ml": 425,
  "Bvlgari Le Gemme - Tygar Eau De Parfum 125 ml": 395,
  "Amouage Guidance 46 ✨": 520,
  "Louis Vuitton – Ombre Nomade": 430,
  "Good Girl Gone Bad by Kilian ✨": 280,
  "YSL Libre Eau De Parfum ✨": 150,
  "Versace Bright Crystal ✨": 90,
  "EYES — Louis Vuitton 100 ml": 320,
  "YSL Libre Berry Crush ❤️": 150,
  "J’adore — Dior ✨ 100 ml": 150,
  "PACIFIC CHILL — Louis Vuitton": 320,
  "SYMPHONY — Louis Vuitton ": 540,
  "HORMONE | This Is Not GABA ✨": 180,
  "Louis Vuitton L’Immensité 100ML": 320,
  "Maison Crivelli Oud Maracujá ✨": 270,
  "VICTORIA’S SECRET BOMBSHELL": 85,
  "AFTERNOON SWIM Louis Vuitton": 320,
  "XERJOFF MORE THAN WORDS": 250,
  "Amouage Guidance ✨": 360,
  "HFC Paris Delisitrige ✨": 270,
  "Marc-Antoine Barrois Ganymede ✨": 220,
  "MARC-ANTOINE BARROIS — TILIA": 220,
  "Tiziana Terenzi Kirke ✨": 160,
  "Marc-Antoine Barrois Aldebaran ✨": 220,
  "Xerjoff Erba Pura Eau de Parfum 100 ml": 260,
  "Ex Nihilo Fleur Narcotique ✨": 295,
  "CASAMORATI LIRA 100 ml": 290,
  "Louis Vuitton California Dream ": 320,
  "Clive Christian Jump Up And Kiss Me Hedonistic (2021)": 395,
  "👑 CLIVE CHRISTIAN No.1": 850,
  "Bvlgari Tygar Extrait ✨": 395,
  "XERJOFF AMARIS Alexandria || ": 325,
  "Maison Crivelli Patchouli Magnetik ✨": 260
};

// Fallback search patterns for some characters
const normalizeKey = (str) => {
  return str.replace(/[’'’`“”]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
};

const normalizedPrices = {};
Object.keys(originalPrices).forEach(key => {
  normalizedPrices[normalizeKey(key)] = originalPrices[key];
});

async function duplicateToOriginal() {
  console.log("Fetching all products...");
  const { data: products, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  // Filter out any existing originals to avoid double duplication if run again
  const luxCopies = products.filter(p => p.product_type === "lux_copy");
  const existingOriginals = products.filter(p => p.product_type === "original");
  
  console.log(`Found ${luxCopies.length} lux copies and ${existingOriginals.length} existing originals.`);

  let insertedCount = 0;

  for (const item of luxCopies) {
    // Check if original version already exists for this title
    const exists = existingOriginals.some(orig => orig.title.toLowerCase() === item.title.toLowerCase());
    if (exists) {
      console.log(`Original version for "${item.title}" already exists, skipping.`);
      continue;
    }

    // Determine original price
    const normTitle = normalizeKey(item.title);
    let originalPrice = normalizedPrices[normTitle];
    if (originalPrice === undefined) {
      // Attempt fuzzy lookup
      const matchedKey = Object.keys(normalizedPrices).find(k => k.includes(normTitle) || normTitle.includes(k));
      if (matchedKey) {
        originalPrice = normalizedPrices[matchedKey];
      } else {
        originalPrice = 250; // default fallback if totally missing
        console.log(`⚠️ No price mapping found for "${item.title}". Using fallback: $${originalPrice}`);
      }
    }

    // Prepare duplicate object (strip id and created_at to let database generate new ones)
    const { id, created_at, ...productData } = item;
    
    const duplicatedProduct = {
      ...productData,
      product_type: "original",
      price_usd: originalPrice,
      stock: 0
    };

    const { error: insErr } = await supabase.from("products").insert(duplicatedProduct);
    if (insErr) {
      console.error(`❌ Error inserting "${item.title}":`, insErr.message);
    } else {
      console.log(`✅ Duplicated "${item.title}" to original (Price: $${originalPrice}, Stock: 0)`);
      insertedCount++;
    }
  }

  console.log(`\n🎉 Completed duplication! Successfully added ${insertedCount} original perfumes.`);
}

duplicateToOriginal();
