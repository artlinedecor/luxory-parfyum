const cheerio = require('cheerio');

async function testScrape() {
  try {
    const res = await fetch('https://elisium.uz/dlya-zhenshchin');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const sampleProducts = [];
    
    // In elisium.uz, product cards are usually wrapped in some class.
    // Let's print out the classes of all elements with class containing 'product' or 'item'
    $('.item, .product, .product-card').each((i, el) => {
      const img = $(el).find('img');
      const titleEl = $(el).find('.title, .name, h3, h4, .prod_name'); 
      const priceEl = $(el).find('.price, .prod_price');
      
      sampleProducts.push({
        img: img.attr('src') || img.attr('data-src'),
        title: titleEl.text().trim(),
        price: priceEl.text().trim()
      });
    });
    
    console.log(`Found ${sampleProducts.length} potential products with specific classes.`);
    
    if (sampleProducts.length === 0) {
      // Fallback: Just get all images
      $('img').each((i, el) => {
         const src = $(el).attr('src') || $(el).attr('data-src');
         if (src && src.includes('thumb')) {
             sampleProducts.push({ img: src, title: $(el).attr('alt') || 'Unknown' });
         }
      });
      console.log(`Found ${sampleProducts.length} potential products via img tags.`);
    }

    if (sampleProducts.length > 0) {
       console.log("Sample:", sampleProducts.slice(0, 5));
    }
  } catch (e) {
    console.error(e);
  }
}

testScrape();
