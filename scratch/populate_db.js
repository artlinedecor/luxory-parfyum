require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const EXCHANGE_RATE = 12100;
const ORIGINAL_EXTRA_USD = 100;

function parseScratchpad() {
  const content = fs.readFileSync('C:\\Users\\ELYOR\\.gemini\\antigravity\\brain\\ef6f2a0c-c1eb-41be-8efc-4f5f0282a44c\\browser\\scratchpad_ssxx426j.md', 'utf8');
  
  const unisexMatch = content.match(/## Unisex's Products Data\n```json\n([\s\S]*?)\n```/);
  const menMatch = content.match(/## Men's Products Data\n```json\n([\s\S]*?)\n```/);
  const womenMatch = content.match(/## Women's Products Data\n```json\n([\s\S]*?)\n```/);
  
  let allProducts = [];
  if (unisexMatch) {
    const unisex = JSON.parse(unisexMatch[1]);
    unisex.forEach(p => p.gender = 'unisex');
    allProducts.push(...unisex);
  }
  if (menMatch) {
    const men = JSON.parse(menMatch[1]);
    men.forEach(p => p.gender = 'male');
    allProducts.push(...men);
  }
  if (womenMatch) {
    const women = JSON.parse(womenMatch[1]);
    women.forEach(p => p.gender = 'female');
    allProducts.push(...women);
  }
  return allProducts;
}

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
  console.log("Parsing products...");
  const products = parseScratchpad();
  console.log(`Found ${products.length} products to upload.`);

  console.log("Deleting existing products...");
  const { error: delError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  if (delError) {
    console.error("Failed to delete old products", delError);
    return;
  }
  console.log("Old products deleted. Inserting new ones from scratch (0-dan)...");

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i+1}/${products.length}] Uploading: ${p.title} (${p.gender})`);

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

      // Calculate price_usd so it exactly matches priceUzs on frontend
      const priceUsd = (p.priceUzs / EXCHANGE_RATE) - ORIGINAL_EXTRA_USD;

      // Insert Original
      const { error: insertOrig } = await supabase.from('products').insert({
        title: p.title,
        price_usd: priceUsd,
        product_type: 'original',
        image_url: uploadedUrl,
        is_available: true,
        gender: p.gender
      });

      if (insertOrig) throw insertOrig;

      // Insert Lux Premium
      const { error: insertLux } = await supabase.from('products').insert({
        title: p.title,
        price_usd: priceUsd,
        product_type: 'lux_copy',
        image_url: uploadedUrl,
        is_available: true,
        gender: p.gender
      });

      if (insertLux) throw insertLux;

      console.log(`  Success!`);
    } catch (err) {
      console.error(`  Failed to process ${p.title}:`, err.message);
    }
    
    await sleep(100); // slight delay
  }

  console.log(`\nDONE!`);
}

main();
