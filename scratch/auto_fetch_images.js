require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const google = require('googlethis');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
  console.log("Fetching products from Supabase...");
  const { data: products, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error("DB Error:", error);
    return;
  }

  const targetProducts = products;
  console.log(`Found ${targetProducts.length} products.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetProducts.length; i++) {
    const product = targetProducts[i];
    const cleanTitle = product.title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
      .replace('100 ml', '').replace('100ML', '').replace('50 ml', '').replace('50ML', '')
      .replace('(Original)', '').trim();
    
    console.log(`[${i+1}/${targetProducts.length}] Processing: ${cleanTitle}`);

    try {
      let query = `site:elisium.uz ${cleanTitle}`;
      let images = [];
      try {
        images = await google.image(query, { safe: false });
      } catch (e) {
        // Ignored, will fall back
      }
      
      // 2. Fallback to high quality global search
      if (!images || images.length === 0) {
        console.log(`  Not found on elisium.uz. Falling back to global search...`);
        query = `${cleanTitle} perfume bottle white background high quality`;
        images = await google.image(query, { safe: false });
      }

      if (!images || images.length === 0) {
        throw new Error("No images found on Google.");
      }

      let uploadedUrl = null;
      for (let j = 0; j < Math.min(3, images.length); j++) {
        try {
          const imgUrl = images[j].url;
          console.log(`  Trying image ${j+1}: ${imgUrl}`);
          const imageBuffer = await fetchImageBuffer(imgUrl);
          
          const filename = sanitizeFileName(cleanTitle);
          const newFilePath = `public/${filename}`;
          
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(newFilePath, imageBuffer, { contentType: 'image/jpeg', upsert: true });
            
          if (uploadError) throw uploadError;
          
          uploadedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${newFilePath}`;
          break; // success
        } catch (imgError) {
          console.log(`  Failed downloading/uploading image ${j+1}: ${imgError.message}`);
        }
      }

      if (!uploadedUrl) {
        throw new Error("All image attempts failed.");
      }

      const { error: updateError } = await supabase.from('products').update({ image_url: uploadedUrl }).eq('id', product.id);
      if (updateError) throw updateError;

      console.log(`  Success! -> ${uploadedUrl}`);
      successCount++;
    } catch (err) {
      console.error(`  Failed to process ${product.title}:`, err.message);
      failCount++;
    }
    
    await sleep(2000);
  }

  console.log(`\nDONE! Success: ${successCount}, Failed: ${failCount}`);
}

main();
