require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  console.log("Updating Sevaverek to lux_copy...");
  const { data, error } = await supabase
    .from('products')
    .update({ product_type: 'lux_copy' })
    .ilike('title', '%Sevaverek%')
    .select();

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success! Updated:", data);
  }
}

main();
