require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function wipeImages() {
  console.log("Fetching products to wipe newly added images...");
  const { data: products, error } = await supabase.from('products').select('id, image_url');
  
  if (error) {
    console.error("DB Error:", error);
    return;
  }

  let count = 0;
  for (const product of products) {
    if (product.image_url && product.image_url.includes('zfcfqkzqvfttzgthnqpo.supabase.co')) {
      console.log(`Wiping image for product ${product.id}`);
      await supabase.from('products').update({ image_url: null }).eq('id', product.id);
      count++;
    }
  }

  console.log(`Successfully wiped ${count} wrong images!`);
}

wipeImages();
