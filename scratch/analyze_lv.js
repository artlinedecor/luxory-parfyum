require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function normalize(str) {
  return str.toLowerCase().replace(/louis vuitton/g, '').replace(/eau de parfum/g, '').replace(/extrait de parfum/g, '').replace(/100 ml/g, '').replace(/200 ml/g, '').replace(/[^a-z0-9]/g, '');
}

async function analyze() {
  const { data: products } = await supabase.from('products').select('title');
  const ourTitles = products.map(p => p.title);
  
  const content = fs.readFileSync('C:\\Users\\ELYOR\\.gemini\\antigravity\\brain\\ef6f2a0c-c1eb-41be-8efc-4f5f0282a44c\\browser\\scratchpad_272ibm06.md', 'utf8');
  const jsonMatch = content.match(/## JSON Data\n```json\n([\s\S]*?)\n```/);
  const parfumstockLV = JSON.parse(jsonMatch[1]);
  
  const missing = [];
  const overlap = [];
  
  for (const lv of parfumstockLV) {
    if (lv.priceUzs === 0) continue; // Skip out of stock
    const norm = normalize(lv.title);
    
    let found = false;
    for (const ourTitle of ourTitles) {
      const ourNorm = normalize(ourTitle);
      if (ourNorm && norm && (ourNorm.includes(norm) || norm.includes(ourNorm))) {
        found = true;
        overlap.push({ their: lv.title, ours: ourTitle });
        break;
      }
    }
    
    if (!found) {
      missing.push(lv);
    }
  }
  
  console.log("=== ANALYSIS ===");
  console.log(`Total LV on Parfumstock: ${parfumstockLV.length}`);
  console.log(`Out of stock: ${parfumstockLV.filter(p => p.priceUzs === 0).length}`);
  console.log(`Overlap (We already have): ${overlap.length}`);
  overlap.forEach(o => console.log(`  - ${o.their} matches our ${o.ours}`));
  
  console.log(`\nMISSING (We don't have these, need to add): ${missing.length}`);
  missing.forEach(m => console.log(`  + ${m.title} (${m.priceUzs} UZS)`));
  
  fs.writeFileSync('scratch/missing_lv.json', JSON.stringify(missing, null, 2));
}

analyze();
