const puppeteer = require('puppeteer');
const fs = require('fs');

const categories = [
  { url: 'https://elisium.uz/dlya-zhenshchin', gender: 'female' },
  { url: 'https://elisium.uz/dlya-muzhchin', gender: 'male' },
  { url: 'https://elisium.uz/uniseks', gender: 'unisex' }
];

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if(totalHeight >= scrollHeight - window.innerHeight || totalHeight > 15000){ // limit scroll to avoid infinite loops
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function scrape() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const allProducts = [];
  const seenTitles = new Set();
  
  for (const cat of categories) {
    console.log(`Scraping category: ${cat.gender} at ${cat.url}`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto(cat.url, { waitUntil: 'networkidle2' });
    
    // Attempt pagination (click "Show more" or just scroll). Elisium usually uses infinite scroll or pagination buttons.
    // Let's just scroll down to load as much as possible for MVP.
    await autoScroll(page);
    
    // Also try to find a pagination button and click it once if we need more products.
    // For now, let's grab whatever is on the first few pages loaded by scroll.
    
    const products = await page.evaluate((gender) => {
      const items = Array.from(document.querySelectorAll('a'));
      const results = [];
      for (const item of items) {
        // Typical product card has an image and a title/price inside
        const img = item.querySelector('img');
        if (!img) continue;
        
        let src = img.getAttribute('src') || img.getAttribute('data-src');
        if (!src || src.includes('logo') || src.includes('icon') || src.includes('resurs') || src.includes('svg')) continue;
        
        // Find text content inside this link
        const textNodes = Array.from(item.querySelectorAll('*')).filter(el => el.children.length === 0 && el.textContent.trim().length > 0);
        let title = '';
        let priceStr = '';
        
        for (const el of textNodes) {
          const txt = el.textContent.trim();
          if (txt.includes('сум') || txt.includes('UZS') || txt.replace(/[^0-9]/g, '').length >= 5) {
            priceStr = txt;
          } else if (txt.length > 5 && !txt.includes('В корзину') && !txt.includes('Купить')) {
            if (!title) title = txt; // First long text is usually title
          }
        }
        
        if (title && src) {
          if (!src.startsWith('http')) {
            src = src.startsWith('/') ? 'https://elisium.uz' + src : 'https://elisium.uz/' + src;
          }
          let priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
          
          results.push({
            title: title.replace(/\n/g, ' ').trim(),
            img: src,
            priceUzs: priceNum,
            gender: gender
          });
        }
      }
      return results;
    }, cat.gender);
    
    console.log(`Found ${products.length} potential items for ${cat.gender}`);
    
    for (const p of products) {
      // Basic validation
      if (p.priceUzs > 0 && p.title.length > 5 && !seenTitles.has(p.title)) {
        seenTitles.add(p.title);
        allProducts.push(p);
      }
    }
    
    await page.close();
  }
  
  await browser.close();
  
  fs.writeFileSync('scratch/all_products.json', JSON.stringify(allProducts, null, 2));
  console.log(`Saved ${allProducts.length} unique products to scratch/all_products.json`);
}

scrape().catch(console.error);
