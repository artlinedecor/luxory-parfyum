require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const PRICE_800K_USD = 800000 / 12100;

const itemsToProcess = [
  { old: "PACIFIC CHILL — Louis Vuitton", search: "Pacific Chill", brand: "Louis Vuitton" },
  { old: "VERSACE CRYSTAL NOIR", search: "Crystal Noir", brand: "Versace" },
  { old: "My Burberry Blush Eau De Parfum 🌸", search: "Burberry Blush", brand: "Burberry" },
  { old: "DIOR SAUVAGE ELIXIR 60 ml", search: "Sauvage Elixir", brand: "Dior" },
  { old: "HFC Paris Delisitrige ✨", search: "Devil's Intrigue", brand: "HFC Paris" },
  { old: "EYES — Louis Vuitton 100 ml", search: "Louis Vuitton Les Sables Roses", brand: "Louis Vuitton" },
  { old: "Marc-Antoine Barrois Aldebaran ✨", search: "B683 Marc-Antoine Barrois", brand: "Marc-Antoine Barrois" },
  { old: "CHANEL CHANCE EAU SPLENDIDE", search: "Chance Eau Tendre", brand: "Chanel" },
  { old: "Amouage Guidance 46 ✨", search: "Amouage Guidance", brand: "Amouage" },
  { old: "Xerjoff Erba Pura Eau de Parfum 100 ml", search: "Erba Pura", brand: "Xerjoff" },
  { old: "Maison Crivelli Oud Maracujá ✨", search: "Oud Maracuja", brand: "Maison Crivelli" },
  { old: "🖤 BLEU DE CHANEL PARFUM", search: "Bleu de Chanel", brand: "Chanel" },
  { old: "Maison Crivelli Patchouli Magnetik ✨", search: "Patchouli Magnetik", brand: "Maison Crivelli" },
  { old: "BYREDO BAL D’AFRIQUE ✨", search: "Bal d'Afrique", brand: "Byredo" },
  { old: "Creed Absolu Aventus 100 ml", search: "Aventus", brand: "Creed" },
  { old: "XERJOFF AMARIS Alexandria || ", search: "Alexandria II", brand: "Xerjoff" },
  { old: "Versace Bright Crystal ✨", search: "Bright Crystal", brand: "Versace" },
  { old: "COCO MADEMOISELLE CHANEL", search: "Coco Mademoiselle", brand: "Chanel" },
  { old: "XERJOFF MORE THAN WORDS", search: "More Than Words", brand: "Xerjoff" },
  { old: "Good Girl Gone Bad by Kilian ✨", search: "Good Girl Gone Bad", brand: "Kilian" },
  { old: "MARC-ANTOINE BARROIS — TILIA", search: "Tilia", brand: "Marc-Antoine Barrois" },
  { old: "XERJOFF ACCENTO PURPLE", search: "Accento Overdose", brand: "Xerjoff" },
  { old: "YSL Libre Eau De Parfum ✨", search: "Libre", brand: "Yves Saint Laurent" },
  { old: "Clive Christian Jump Up And Kiss Me Hedonistic (2021)", search: "Jump Up And Kiss Me Hedonistic", brand: "Clive Christian" },
  { old: "Ex Nihilo Fleur Narcotique ✨", search: "Fleur Narcotique", brand: "Ex Nihilo" },
  { old: "Marc-Antoine Barrois Ganymede ✨", search: "Ganymede", brand: "Marc-Antoine Barrois" }
];

async function fetchImageBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function sanitizeFileName(title) {
  return title.replace(/[^a-zA-Z0-9-]/g, '_').toLowerCase() + '_' + Date.now() + '.jpg';
}

function generateDescription(item) {
  const brand = item.brand;
  const search = item.search;
  return {
    uz: `${brand} ${search} — bu mutlaq hashamat va o'ziga xoslikning ifodasi 💎.\n\n✨ Yuqori notalar: Yorqin va tetiklantiruvchi, birinchi soniyadanoq e'tiborni tortadi.\n💖 Yurak notalari: Chuqur va his-tuyg'ularga boy.\n🌑 Baza notalari: Uzoq saqlanuvchi, yoqimli va sirli iz qoldiradi.\n\nPremium klassdagi ushbu atir sizning didingiz va statusingizni ko'rsatib turadi. Kun davomida o'zining jozibasini yo'qotmaydi. Uzoq muddatli va juda boy ifor.`,
    ru: `${brand} ${search} — это абсолютное выражение роскоши и уникальности 💎.\n\n✨ Верхние ноты: Яркие и освежающие, привлекают внимание с первой секунды.\n💖 Ноты сердца: Глубокие и насыщенные эмоциями.\n🌑 Базовые ноты: Оставляют долгий, приятный и таинственный шлейф.\n\nЭтот парфюм премиум-класса подчеркнет ваш вкус и статус. Не теряет своего очарования в течение всего дня. Стойкий и очень богатый аромат.`
  };
}

async function main() {
  const backup = JSON.parse(fs.readFileSync('scratch/old_products_backup.json', 'utf8'));
  
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    console.log(`\n[${i+1}/${itemsToProcess.length}] Processing: ${item.old}`);
    
    let imgUrl = null;
    
    try {
      const elisiumUrl = `https://elisium.uz/search?q=${encodeURIComponent(item.search)}`;
      await page.goto(elisiumUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      imgUrl = await page.evaluate(() => {
        const firstProduct = document.querySelector('.product-card img, img.product-image');
        if (firstProduct) {
          const src = firstProduct.getAttribute('src');
          if (src) return src.startsWith('http') ? src : 'https://elisium.uz' + src;
        }
        return null;
      });
      
      if (!imgUrl) {
        const pUrl = `https://parfumstock.uz/magazin/search?search_text=${encodeURIComponent(item.search)}`;
        await page.goto(pUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        imgUrl = await page.evaluate(() => {
          const firstProduct = document.querySelector('.product-card img, .catalog-item img, img.img-responsive, img.product-img');
          if (firstProduct) {
            const src = firstProduct.getAttribute('src') || firstProduct.getAttribute('data-src');
            if (src) return src.startsWith('http') ? src : 'https://parfumstock.uz' + src;
          }
          return null;
        });
      }
    } catch (e) {
      console.error(`Error searching ${item.search}:`, e.message);
    }
    
    let uploadedUrl = null;
    if (imgUrl) {
      console.log(`Found image: ${imgUrl}`);
      try {
        const buffer = await fetchImageBuffer(imgUrl);
        const fileName = sanitizeFileName(item.search);
        const filePath = `public/${fileName}`;
        const { error } = await supabase.storage.from('product-images').upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true });
        if (!error) {
          uploadedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${filePath}`;
          console.log(`Uploaded to Supabase: ${uploadedUrl}`);
        }
      } catch (err) {
        console.error("Failed to upload image:", err.message);
      }
    } else {
      console.log("No image found for", item.search);
    }
    
    // Find old data
    const oldData = backup.find(p => p.title === item.old);
    const costPrice = oldData ? oldData.cost_price_usd : 18;
    
    const descriptions = generateDescription(item);
    
    const insertData = {
      title: item.old, // Keep the old title EXACTLY as user had it
      title_ru: item.old,
      description: descriptions.uz,
      description_ru: descriptions.ru,
      price_usd: PRICE_800K_USD,
      cost_price_usd: costPrice,
      stock: 1,
      gender: oldData ? oldData.gender : 'unisex',
      product_type: 'lux_copy',
      image_url: uploadedUrl, // If null, will use default image
      is_available: uploadedUrl !== null
    };
    
    // Delete the old duplicate without image that we previously restored BEFORE inserting the new one
    await supabase.from('products').delete().eq('title', item.old).is('image_url', null);

    const { error: insErr } = await supabase.from('products').insert(insertData);
    if (insErr) {
      console.error(`Failed to insert into DB:`, insErr.message);
    } else {
      console.log(`Inserted ${item.old} into DB successfully.`);
    }
  }
  
  await browser.close();
  console.log("\nDONE processing 26 items.");
}

main();
