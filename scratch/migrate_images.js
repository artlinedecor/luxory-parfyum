const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://zfcfqkzqvfttzgthnqpo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmY2Zxa3pxdmZ0dHpndGhucXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTgzMDQsImV4cCI6MjA5OTA5NDMwNH0.ZYmH6QoGSbDEUDV1DVvbb6KBOYzb4YOdCEg2SJ3VdFw';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function migrateImages() {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }
  
  let successCount = 0;
  let failCount = 0;

  for (const product of products) {
    if (product.image_url && product.image_url.includes('ljlwfzvathvltqxwqsxk.supabase.co')) {
      console.log(`Migrating image for product: ${product.title}`);
      try {
        const imageBuffer = await fetchImage(product.image_url);
        
        // Extract filename from URL
        const urlParts = product.image_url.split('/');
        const originalFileName = urlParts[urlParts.length - 1];
        
        const newFilePath = `public/${originalFileName}`;
        
        // Upload to new bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(newFilePath, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });
          
        if (uploadError) {
          console.error(`  Upload failed for ${product.title}:`, uploadError);
          failCount++;
          continue;
        }
        
        const newUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${newFilePath}`;
        
        // Update product in DB
        const { error: updateError } = await supabase.from('products')
          .update({ image_url: newUrl })
          .eq('id', product.id);
          
        if (updateError) {
          console.error(`  Update DB failed for ${product.title}:`, updateError);
          failCount++;
        } else {
          console.log(`  Successfully migrated: ${newUrl}`);
          successCount++;
        }
        
      } catch (err) {
        console.error(`  Failed to fetch image for ${product.title}:`, err.message);
        failCount++;
      }
    }
  }
  
  console.log(`Migration complete. Success: ${successCount}, Failed: ${failCount}`);
}

migrateImages();
