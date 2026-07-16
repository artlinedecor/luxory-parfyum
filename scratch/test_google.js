const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  
  try {
    await page.goto('https://www.google.com/search?q=xerjoff+erba+pura+perfume+bottle&tbm=isch', { waitUntil: 'networkidle2' });
    const img = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      for (let i = 0; i < images.length; i++) {
        const src = images[i].src;
        if (src && src.startsWith('http') && src.includes('images')) {
          return src;
        }
      }
      return null;
    });
    console.log("Image found:", img);
  } catch (e) {
    console.log("Error:", e.message);
  }
  
  await browser.close();
}

main();
