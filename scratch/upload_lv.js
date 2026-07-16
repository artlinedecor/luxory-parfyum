require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const EXCHANGE_RATE = 12100;
const ORIGINAL_EXTRA_USD = 100;

function sanitizeFileName(title) {
  return title.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase() + '_' + Date.now() + '.jpg';
}

async function fetchImageBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log("Reading missing LV products...");
  const missingLVs = JSON.parse(fs.readFileSync('scratch/missing_lv.json', 'utf8'));
  console.log(`Found ${missingLVs.length} Louis Vuitton products to upload.`);

  for (let i = 0; i < missingLVs.length; i++) {
    const p = missingLVs[i];
    console.log(`[${i+1}/${missingLVs.length}] Uploading: ${p.title} (unisex)`);

    try {
      // 1. Download and upload image
      const imageBuffer = await fetchImageBuffer(p.img);
      const filename = sanitizeFileName(p.title);
      const newFilePath = `public/${filename}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(newFilePath, imageBuffer, { contentType: 'image/jpeg', upsert: true });
        
      if (uploadError) throw uploadError;
      
      const uploadedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${newFilePath}`;

      // Calculate price_usd
      const priceUsd = (p.priceUzs / EXCHANGE_RATE) - ORIGINAL_EXTRA_USD;

      // Insert Original
      const { error: insertOrig } = await supabase.from('products').insert({
        title: p.title,
        price_usd: priceUsd,
        product_type: 'original',
        image_url: uploadedUrl,
        is_available: true,
        gender: 'unisex'
      });

      if (insertOrig) throw insertOrig;

      // Insert Lux Premium
      const { error: insertLux } = await supabase.from('products').insert({
        title: p.title,
        price_usd: priceUsd,
        product_type: 'lux_copy',
        image_url: uploadedUrl,
        is_available: true,
        gender: 'unisex'
      });

      if (insertLux) throw insertLux;

      console.log(`  Success!`);
    } catch (err) {
      console.error(`  Failed to process ${p.title}:`, err.message);
    }
    
    await sleep(200);
  }

  console.log(`\nDONE! All LV products added successfully.`);
}

main();
