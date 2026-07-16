require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const mappings = [
  { old: "Clive Christian XXI Blonde Amber 50ML", new: "CLIVE CHRISTIAN XXI ART DECO - BLONDE AMBER 50ML" },
  { old: "👑 CLIVE CHRISTIAN No.1", new: "CLIVE CHRISTIAN NO.1 50ML" },
  { old: "AFTERNOON SWIM Louis Vuitton", new: "Louis Vuitton Afternoon Swim Eau De Parfum 100 ml" },
  { old: "XERJOFF TORINO21 100 ml", new: "XERJOFF TORINO 21  100ML" },
  { old: "HORMONE | This Is Not GABA ✨", new: "HORMONE THIS IS NOT GABA 100ML" },
  { old: "Louis Vuitton Attrape-Rêves ", new: "Louis Vuitton Attrape-Reves Eau De Parfum 100 ml" },
  { old: "Louis Vuitton California Dream ", new: "Louis Vuitton California Dream Eau De Parfum" }
];

async function main() {
  const backup = JSON.parse(fs.readFileSync('scratch/old_products_backup.json', 'utf8'));

  for (const m of mappings) {
    // Find old item in backup to get its cost_price_usd
    const oldData = backup.find(p => p.title === m.old);
    if (!oldData) {
      console.log(`Could not find old data for ${m.old}`);
      continue;
    }

    console.log(`Updating NEW product: "${m.new}" -> stock=1, cost_price_usd=${oldData.cost_price_usd}`);
    const { error: updErr } = await supabase
      .from('products')
      .update({ stock: 1, cost_price_usd: oldData.cost_price_usd })
      .eq('title', m.new);
      
    if (updErr) {
      console.error(`Error updating ${m.new}:`, updErr.message);
    } else {
      console.log(`Successfully updated ${m.new}.`);
      
      console.log(`Deleting OLD duplicate: "${m.old}"`);
      const { error: delErr } = await supabase
        .from('products')
        .delete()
        .eq('title', m.old)
        .is('image_url', null);
        
      if (delErr) {
        console.error(`Error deleting ${m.old}:`, delErr.message);
      }
    }
  }
  
  console.log("DONE processing 7 matched items.");
}

main();
