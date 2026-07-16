const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("Navigating to parfumstock.uz...");
  await page.goto('https://parfumstock.uz/magazin/vendor/louis-vuitton', { waitUntil: 'networkidle2' });
  
  // Try to load all products (if pagination or "Show more" exists)
  // Let's first check how many products are on the page
  const products = await page.evaluate(() => {
    // parfumstock.uz usually uses .product-item or similar.
    // Let's look for common wrappers.
    const itemElements = Array.from(document.querySelectorAll('.shop2-product-item, .product-item, .item'));
    const results = [];
    
    for (const el of itemElements) {
      const titleEl = el.querySelector('.product-name, .name, .title, a');
      if (!titleEl) continue;
      const title = titleEl.innerText.trim();
      
      const imgEl = el.querySelector('img');
      const img = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src')) : null;
      
      const priceEl = el.querySelector('.price, .product-price, .price-current strong');
      const priceStr = priceEl ? priceEl.innerText : '0';
      const priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
      
      if (title.length > 3 && img && priceNum > 0) {
        let fullImg = img;
        if (!fullImg.startsWith('http')) {
          fullImg = 'https://parfumstock.uz' + (fullImg.startsWith('/') ? '' : '/') + fullImg;
        }
        results.push({ title, img: fullImg, priceUzs: priceNum, gender: 'unisex' }); // Default to unisex for LV
      }
    }
    return results;
  });
  
  console.log(`Found ${products.length} Louis Vuitton products.`);
  fs.writeFileSync('scratch/parfumstock_lv.json', JSON.stringify(products, null, 2));
  
  await browser.close();
}

scrape().catch(console.error);
