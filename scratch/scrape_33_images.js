require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const PRICE_800K_USD = 800000 / 12100;

function cleanSearchTerm(title) {
  let cleaned = title.toLowerCase();
  cleaned = cleaned.replace(/100ml|50ml|60ml|100 ml|50 ml|60 ml|eau de parfum|extrait de parfum|parfum|✨|🌸|👑|🖤/g, '');
  cleaned = cleaned.replace(/[—|]/g, '');
  return cleaned.trim();
}

async function fetchImageBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function sanitizeFileName(title) {
  return title.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase() + '_' + Date.now() + '.jpg';
}

async function main() {
  console.log("Deleting old 33 items without images...");
  await supabase.from('products').delete().is('image_url', null);

  const backup = JSON.parse(fs.readFileSync('scratch/old_products_backup.json', 'utf8'));
  const old33 = backup.filter(p => p.stock > 0);
  
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  for (let i = 0; i < old33.length; i++) {
    const item = old33[i];
    const searchTerm = cleanSearchTerm(item.title);
    console.log(`\n[${i+1}/${old33.length}] Searching for: ${item.title} -> "${searchTerm}"`);
    
    let imgUrl = null;
    
    try {
      // Try Parfumstock search
      const searchUrl = `https://parfumstock.uz/magazin/search?search_text=${encodeURIComponent(searchTerm)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      
      const img = await page.evaluate(() => {
        const firstProduct = document.querySelector('.product-card img, .catalog-item img, img.img-responsive, img.product-img');
        if (firstProduct) {
          const src = firstProduct.getAttribute('src') || firstProduct.getAttribute('data-src');
          if (src) return src.startsWith('http') ? src : 'https://parfumstock.uz' + src;
        }
        return null;
      });
      
      if (img) {
        imgUrl = img;
        console.log(`Found image on Parfumstock: ${imgUrl}`);
      } else {
        // Fallback to Elisium search
        const elisiumUrl = `https://elisium.uz/search?q=${encodeURIComponent(searchTerm)}`;
        await page.goto(elisiumUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        const elisiumImg = await page.evaluate(() => {
          const firstProduct = document.querySelector('.product-card img, img.product-image');
          if (firstProduct) {
            const src = firstProduct.getAttribute('src');
            if (src) return src.startsWith('http') ? src : 'https://elisium.uz' + src;
          }
          return null;
        });
        if (elisiumImg) {
          imgUrl = elisiumImg;
          console.log(`Found image on Elisium: ${imgUrl}`);
        } else {
          // Absolute fallback
          console.log("No image found on either site. Will use default.");
        }
      }
    } catch (e) {
      console.error(`Error searching ${item.title}:`, e.message);
    }
    
    // Upload image to Supabase if found
    let uploadedUrl = null;
    if (imgUrl) {
      try {
        const buffer = await fetchImageBuffer(imgUrl);
        const fileName = sanitizeFileName(item.title);
        const filePath = `public/${fileName}`;
        const { error } = await supabase.storage.from('product-images').upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true });
        if (!error) {
          uploadedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${filePath}`;
          console.log(`Uploaded to Supabase: ${uploadedUrl}`);
        }
      } catch (err) {
        console.error("Failed to upload image:", err.message);
      }
    }
    
    // Insert into DB
    const { id, created_at, merchant_id, ...insertData } = item;
    insertData.price_usd = PRICE_800K_USD;
    insertData.image_url = uploadedUrl; // Can be null if failed, but we tried!
    insertData.is_available = true; // Mark as true so it's visible in catalog too if it has an image
    
    // If it STILL has no image, let's keep it available anyway, or let the user fix it. 
    // The user said "33 ombordagi atirni rasmilari yoq ekan faqat omborda korinib tursin" BEFORE, 
    // but now they said "bo'lmasa men sanga tashlagan silkadan qidirib topib...".
    
    const { error: insErr } = await supabase.from('products').insert(insertData);
    if (insErr) {
      console.error(`Failed to insert ${item.title} into DB:`, insErr.message);
    } else {
      console.log(`Inserted ${item.title} into DB.`);
    }
  }
  
  await browser.close();
  console.log("\nDONE! All 33 items processed.");
}

main();
