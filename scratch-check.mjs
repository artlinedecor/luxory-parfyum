import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) console.error(error);
  
  console.log("Total products:", data?.length);
  
  const available = data?.filter(p => p.is_available) || [];
  console.log("Available products:", available.length);
  
  const withImage = available.filter(p => p.image_url && p.image_url.trim() !== "");
  console.log("With image:", withImage.length);
  
  const withoutImage = available.filter(p => !p.image_url || p.image_url.trim() === "");
  console.log("Without image:", withoutImage.length);
  
  if (withImage.length === 0 && available.length > 0) {
      console.log("Sample product without image:");
      console.log(available[0]);
  } else if (withImage.length > 0) {
      console.log("Sample product with image:");
      console.log(withImage[0]);
  }
}

main();
