require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const backup = JSON.parse(fs.readFileSync('scratch/old_products_backup.json', 'utf8'));
  const oldStocked = backup.filter(p => p.stock > 0);
  
  console.log(`Found ${oldStocked.length} products with stock in backup.`);

  const { data: newProducts } = await supabase.from('products').select('id, title, product_type');
  
  let restoredCount = 0;
  const updatedIds = new Set();

  for (const old of oldStocked) {
    const oldNorm = normalize(old.title);
    
    // Find best match in new products
    let bestMatch = null;
    let bestScore = 0;
    
    for (const newP of newProducts) {
      if (newP.product_type !== old.product_type) continue; // Match type (usually lux_copy)
      
      const newNorm = normalize(newP.title);
      
      // Simple matching logic
      const wordsOld = old.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
      let matchCount = 0;
      for (const word of wordsOld) {
        if (newP.title.toLowerCase().includes(word)) {
          matchCount++;
        }
      }
      
      const score = matchCount / wordsOld.length;
      if (score > bestScore && score > 0.4) {
        bestScore = score;
        bestMatch = newP;
      }
    }
    
    if (bestMatch && !updatedIds.has(bestMatch.id)) {
      console.log(`Restoring stock for: "${old.title}" -> Matched: "${bestMatch.title}"`);
      await supabase.from('products').update({ stock: old.stock }).eq('id', bestMatch.id);
      updatedIds.add(bestMatch.id);
      restoredCount++;
    } else {
      console.log(`❌ Could not find match for: "${old.title}"`);
    }
  }
  
  console.log(`\nDONE! Restored stock for ${restoredCount} products.`);
}

main();
