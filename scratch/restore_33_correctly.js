require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const PRICE_800K_USD = 800000 / 12100; // ~66.1157

async function main() {
  // 1. Revert stock to 0 for the 167 lux_copy items
  console.log("Reverting stock = 0 for the generic lux_copy items...");
  const { data: updatedLux, error: updateLuxError } = await supabase
    .from('products')
    .update({ stock: 0 })
    .eq('product_type', 'lux_copy')
    .select();

  if (updateLuxError) {
    console.error("Error reverting lux_copy stock:", updateLuxError);
  } else {
    console.log(`Reverted stock to 0 for ${updatedLux.length} generic Lux Premium items.`);
  }

  // 2. Restore the 33 old items from backup
  console.log("Reading old backup...");
  const backup = JSON.parse(fs.readFileSync('scratch/old_products_backup.json', 'utf8'));
  const stockedItems = backup.filter(p => p.stock > 0);
  
  console.log(`Found ${stockedItems.length} stocked items in backup. Restoring them with selling price 800,000 UZS...`);

  let restoredCount = 0;
  
  for (const item of stockedItems) {
    // Keep cost_price_usd, description, title, stock, etc.
    // Update price_usd to 66.1157
    const { id, created_at, merchant_id, ...insertData } = item;
    
    insertData.price_usd = PRICE_800K_USD;
    
    const { error } = await supabase.from('products').insert(insertData);
    
    if (error) {
      console.error(`Failed to restore ${item.title}:`, error.message);
    } else {
      restoredCount++;
      process.stdout.write(`\rRestored ${restoredCount}/${stockedItems.length}...`);
    }
  }
  
  console.log(`\nDONE! Restored exactly ${restoredCount} items to the database with price $66.12.`);
}

main();
