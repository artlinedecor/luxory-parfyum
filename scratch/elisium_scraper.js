const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeCategory(url, categoryName) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const products = [];
  
  // A helper to scroll down slowly to trigger lazy loading
  async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if(totalHeight >= scrollHeight - window.innerHeight){
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  // Handle pagination (if any "Show more" button exists or just multiple pages)
  let hasNextPage = true;
  let pageNum = 1;
  
  while (hasNextPage && pageNum <= 5) { // max 5 pages per category to avoid too much data
    console.log(`Scraping page ${pageNum}...`);
    
    // Wait for product cards to render
    // Since we don't know the exact class, we'll look for common wrapper classes
    // Common classes: .product-item, .product-card, .catalog-item, .item
    try {
      await page.waitForSelector('.product-item, .product-card, .catalog-item, .item', { timeout: 10000 });
    } catch(e) {
      console.log("Could not find product wrapper, dumping raw HTML of body...");
      // Useful for debugging if selector is wrong
      const html = await page.evaluate(() => document.body.innerHTML);
      fs.writeFileSync('scratch/dump.html', html);
      break;
    }
    
    await autoScroll(page);
    
    // Extract data
    const newProducts = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.product-item, .product-card, .catalog-item, .item'));
      const results = [];
      
      for (const item of items) {
        // Name
        const titleEl = item.querySelector('.title, .name, h3, h4, .prod_name, [itemprop="name"]');
        if (!titleEl) continue;
        const title = titleEl.innerText.trim();
        
        // Image
        const imgEl = item.querySelector('img');
        if (!imgEl) continue;
        let img = imgEl.getAttribute('src') || imgEl.getAttribute('data-src');
        if (img && !img.startsWith('http')) {
           img = img.startsWith('/') ? 'https://elisium.uz' + img : 'https://elisium.uz/' + img;
        }
        
        // Price
        const priceEl = item.querySelector('.price, .prod_price, .price-val, [itemprop="price"]');
        let priceStr = priceEl ? priceEl.innerText.trim() : '0';
        // Extract digits
        let priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
        
        // Description (often in href link to get more info, but if available here:)
        const descEl = item.querySelector('.desc, .description');
        const desc = descEl ? descEl.innerText.trim() : '';

        if (title && img && !img.includes('logo') && !img.includes('icon') && !img.includes('resurs')) {
          results.push({ title, img, priceUzs: priceNum, desc });
        }
      }
      return results;
    });
    
    console.log(`Found ${newProducts.length} products on page ${pageNum}`);
    products.push(...newProducts);
    
    // Check if there is a next page
    const nextBtn = await page.$('.pagination .next, .next-page, [rel="next"]');
    if (nextBtn) {
       await nextBtn.click();
       await page.waitForNavigation({ waitUntil: 'networkidle2' });
       pageNum++;
    } else {
       hasNextPage = false;
    }
  }

  await browser.close();
  
  // Deduplicate
  const unique = [];
  const titles = new Set();
  for (const p of products) {
    if (!titles.has(p.title)) {
      titles.add(p.title);
      unique.push(p);
    }
  }
  
  return unique;
}

async function main() {
  console.log("Starting scraper...");
  const women = await scrapeCategory('https://elisium.uz/dlya-zhenshchin', 'women');
  console.log(`Total women products scraped: ${women.length}`);
  
  const men = await scrapeCategory('https://elisium.uz/dlya-muzhchin', 'men');
  console.log(`Total men products scraped: ${men.length}`);
  
  const all = [...women, ...men];
  fs.writeFileSync('scratch/elisium_data.json', JSON.stringify(all, null, 2));
  console.log("Data saved to scratch/elisium_data.json");
}

main();
