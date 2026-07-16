const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://parfum.uz/search?q=erba+pura', { waitUntil: 'networkidle2', timeout: 15000 });
    const img = await page.evaluate(() => {
      const el = document.querySelector('.product-card__image img, .catalog__item img');
      return el ? el.src : null;
    });
    console.log("Image found:", img);
  } catch (e) {
    console.log("Error:", e.message);
  }
  
  await browser.close();
}

main();
