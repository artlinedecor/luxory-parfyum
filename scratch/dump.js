const puppeteer = require('puppeteer');
const fs = require('fs');

async function dumpHtml() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('https://elisium.uz/dlya-zhenshchin', { waitUntil: 'networkidle2' });
  
  // Wait a bit just in case
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.evaluate(() => document.body.innerHTML);
  fs.writeFileSync('scratch/elisium.html', html);
  await browser.close();
  console.log("HTML dumped.");
}

dumpHtml();
