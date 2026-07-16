const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://makeup.uz/search/?q=erba+pura', { waitUntil: 'networkidle2' });
    const img = await page.evaluate(() => {
      const el = document.querySelector('.simple-slider-list__image');
      return el ? el.src : null;
    });
    console.log("Image found:", img);
  } catch (e) {
    console.log("Error:", e.message);
  }
  
  await browser.close();
}

main();
