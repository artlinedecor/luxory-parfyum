require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  console.log("Hiding 33 restored items from public catalog (setting is_available = false)...");
  
  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({ is_available: false })
    .is('image_url', null)
    .select();

  if (updateError) {
    console.error("Error hiding items:", updateError);
  } else {
    console.log(`Successfully hid ${updated.length} items from the public catalog!`);
  }
}

main();
