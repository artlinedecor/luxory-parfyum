require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  // 1. Delete the 33 old items (they have image_url = null)
  console.log("Deleting old restored items without images...");
  const { data: deleted, error: delError } = await supabase
    .from('products')
    .delete()
    .is('image_url', null)
    .select();
    
  if (delError) {
    console.error("Error deleting old items:", delError);
  } else {
    console.log(`Deleted ${deleted.length} old restored items.`);
  }

  // 2. Set stock = 33 for ALL lux_copy items
  console.log("Setting stock = 33 for all lux_copy items...");
  const { data: updatedLux, error: updateLuxError } = await supabase
    .from('products')
    .update({ stock: 33 })
    .eq('product_type', 'lux_copy')
    .select();

  if (updateLuxError) {
    console.error("Error updating lux_copy stock:", updateLuxError);
  } else {
    console.log(`Updated stock to 33 for ${updatedLux.length} Lux Premium items.`);
  }
  
  // 3. Just to be safe, set stock = 33 for all original items too? 
  // User didn't mention original, they explicitly said "bu lyuks premium-i 800 mingdan turaversin, shtugi 33 ta bo'lsin".
  // So we only update lux_copy.
  
  console.log("DONE!");
}

main();
