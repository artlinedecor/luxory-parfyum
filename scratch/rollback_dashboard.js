require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  console.log("Rolling back to yesterday's accounting state...");

  // 1. Read old backup
  const oldProducts = JSON.parse(fs.readFileSync('./scratch/old_products_backup.json', 'utf8'));
  const oldIds = new Set(oldProducts.map(p => p.id));

  // 2. Fetch ALL current products
  const { data: currentProducts, error: err1 } = await supabase.from('products').select('*');
  if (err1) throw err1;

  // 3. For any product NOT in old backup, set stock = 0, cost_price = 0 so they don't affect dashboard analytics
  const newProducts = currentProducts.filter(p => !oldIds.has(p.id));
  console.log(`Found ${newProducts.length} new scraped products. Setting their stock and cost to 0...`);
  
  for (const np of newProducts) {
    if (np.stock !== 0 || np.cost_price_usd !== 0) {
      await supabase.from('products').update({ stock: 0, cost_price_usd: 0 }).eq('id', np.id);
    }
  }

  // 4. Restore ALL 95 old products EXACTLY as they were, but set is_available = false (to hide from frontend)
  console.log(`Restoring ${oldProducts.length} old products from backup...`);
  let restored = 0;
  for (const op of oldProducts) {
    // Enforce is_available = false so it hides from frontend (which user requested)
    const toRestore = { ...op, is_available: false };
    
    const { error: err2 } = await supabase.from('products').upsert([toRestore]);
    if (err2) {
      console.error(`Error upserting ${op.id}:`, err2.message);
    } else {
      restored++;
    }
  }

  console.log(`Successfully restored ${restored} old products with their EXACT yesterday stock and cost prices.`);
  console.log("Dashboard analytics should now match exactly yesterday's state.");
}

main().catch(console.error);
