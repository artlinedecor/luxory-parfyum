require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const backup = JSON.parse(fs.readFileSync('scratch/old_products_backup.json', 'utf8'));
  const stockedItems = backup.filter(p => p.stock > 0);
  
  console.log(`Found ${stockedItems.length} stocked items in backup. Restoring them...`);

  let restoredCount = 0;
  
  for (const item of stockedItems) {
    // Clean up the item before insert (remove id so it generates a new one, or keep id if it doesn't conflict)
    // Actually, keeping the old ID is safer if they have orders tied to it, but they might conflict if I already inserted? No, I deleted them.
    // I will insert without ID to let it auto-generate, or just insert as is.
    
    const { id, created_at, merchant_id, ...insertData } = item;
    
    // Some old items might not have description_ru, etc. Supabase will handle it.
    const { error } = await supabase.from('products').insert(insertData);
    
    if (error) {
      console.error(`Failed to restore ${item.title}:`, error.message);
    } else {
      restoredCount++;
      process.stdout.write(`\rRestored ${restoredCount}/${stockedItems.length}...`);
    }
  }
  
  console.log(`\nDONE! Restored ${restoredCount} items to the database.`);
}

main();
