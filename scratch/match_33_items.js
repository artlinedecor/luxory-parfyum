require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const backup = JSON.parse(fs.readFileSync('scratch/old_products_backup.json', 'utf8'));
  const old33 = backup.filter(p => p.stock > 0);
  
  const { data: newProducts } = await supabase.from('products').select('*').not('image_url', 'is', null).eq('product_type', 'lux_copy');
  
  console.log(`Matching 33 old items against ${newProducts.length} new lux premium items...\n`);
  
  const matches = [];
  const missing = [];
  
  for (const old of old33) {
    let bestMatch = null;
    let bestScore = 0;
    
    // Some manual hints for common names
    const searchName = old.title.toLowerCase().replace(/100ml|50ml|60ml|100 ml|50 ml|60 ml|eau de parfum|extrait de parfum|✨|🌸|👑|🖤/g, '').trim();
    const oldWords = searchName.split(/[\s-]+/).filter(w => w.length > 2);
    
    for (const newP of newProducts) {
      const newTitleNorm = newP.title.toLowerCase();
      let matchCount = 0;
      for (const word of oldWords) {
        if (newTitleNorm.includes(word)) {
          matchCount++;
        }
      }
      const score = matchCount / oldWords.length;
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = newP;
      }
    }
    
    if (bestMatch) {
      matches.push({ old: old.title, new: bestMatch.title, old_cost: old.cost_price_usd, old_stock: old.stock, new_id: bestMatch.id });
    } else {
      missing.push({ title: old.title, clean: searchName, old_cost: old.cost_price_usd, old_stock: old.stock });
    }
  }
  
  console.log("✅ MATCHED ITEMS:");
  matches.forEach(m => console.log(`  "${m.old}" -> "${m.new}"`));
  
  console.log("\n❌ MISSING ITEMS (Need to be scraped):");
  missing.forEach(m => console.log(`  "${m.title}" (Clean: ${m.clean})`));
  
  fs.writeFileSync('scratch/match_results.json', JSON.stringify({ matches, missing }, null, 2));
}

main();
