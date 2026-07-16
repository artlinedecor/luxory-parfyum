require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const {data} = await supabase.from('products').select('title').not('image_url', 'is', null).eq('product_type', 'lux_copy');
  console.log(JSON.stringify(data.map(d => d.title), null, 2));
}
run();
