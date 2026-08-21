/**
 * shot.js — jonli dev serverdan sahifa suratlarini oladi.
 *   node scratch/shot.js [port]
 * Suratlar scratch/shots/ ga tushadi.
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const PORT = process.argv[2] || "3001";
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(__dirname, "shots");

const PAGES = [
  { name: "1-bosh", url: "/", full: true },
  { name: "1b-nasiya", url: "/", full: false, scrollTo: "#nasiya" },
  { name: "2-katalog", url: "/catalog", full: false },
  { name: "3-mahsulot", url: "PRODUCT", full: false },
  { name: "4-savat", url: "/cart", full: false },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  // Puppeteer o'zining Chrome'ini yuklab olmagan — tizimdagi Edge ishlatiladi
  const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: fs.existsSync(EDGE) ? EDGE : undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });

  const page = await browser.newPage();

  // Birinchi mahsulot havolasini topamiz
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3500));
  const productHref = await page.evaluate(() => {
    const a = document.querySelector('a[href^="/catalog/"]');
    return a ? a.getAttribute("href") : null;
  });
  console.log("mahsulot havolasi:", productHref);

  for (const view of [
    { label: "desktop", width: 1440, height: 900 },
    { label: "mobil", width: 390, height: 844 },
  ]) {
    await page.setViewport({
      width: view.width,
      height: view.height,
      deviceScaleFactor: 2,
      isMobile: view.width < 768,
      hasTouch: view.width < 768,
    });

    for (const p of PAGES) {
      const url = p.url === "PRODUCT" ? productHref : p.url;
      if (!url) continue;

      await page.goto(BASE + url, { waitUntil: "networkidle2", timeout: 90000 });
      // Ma'lumot kelishi + rasmlar yuklanishi uchun
      await new Promise((r) => setTimeout(r, 4000));

      // Lazy rasmlarni ochish uchun bir aylanib chiqamiz
      await page.evaluate(async () => {
        await new Promise((res) => {
          let y = 0;
          const step = () => {
            y += 700;
            window.scrollTo(0, y);
            if (y < document.body.scrollHeight && y < 6000) setTimeout(step, 120);
            else {
              window.scrollTo(0, 0);
              setTimeout(res, 500);
            }
          };
          step();
        });
      });
      await new Promise((r) => setTimeout(r, 1200));

      // Kerakli blokka aniq siljitamiz (hash bilan ishonchli emas)
      if (p.scrollTo) {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 8);
        }, p.scrollTo);
        await new Promise((r) => setTimeout(r, 900));
      }

      const file = path.join(OUT, `${view.label}-${p.name}.png`);
      await page.screenshot({ path: file, fullPage: p.full });
      console.log("saqlandi:", path.basename(file));
    }
  }

  await browser.close();
  console.log("\nTayyor:", OUT);
})().catch((e) => {
  console.error("XATO:", e.message);
  process.exit(1);
});
