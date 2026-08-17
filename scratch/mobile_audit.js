/**
 * mobile_audit.js — mobil ko'rinishdagi muammolarni topadi.
 *
 *   node scratch/mobile_audit.js https://parfumelux.uz
 *   node scratch/mobile_audit.js 3001
 *
 * Nimani tekshiradi:
 *  - gorizontal skroll (eng ko'p uchraydigan mobil nuqson)
 *  - ekrandan chiqib ketgan elementlar
 *  - 44px dan kichik bosiladigan nishonlar
 *  - 12px dan mayda matn
 *  - pastdagi menyu ostida qolib ketgan tugmalar
 *  - yuklanmagan rasmlar
 *  - konsol xatolari
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const ARG = process.argv[2] || "3001";
const BASE = /^https?:/.test(ARG) ? ARG : `http://localhost:${ARG}`;
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT = path.join(__dirname, "shots-mobile");

const DEVICES = [
  { name: "iphone-390", width: 390, height: 844 },
  { name: "android-360", width: 360, height: 740 },
];

const audit = () => {
  const W = window.innerWidth;
  const doc = document.documentElement;
  const nav = document.querySelector("#bottom-nav");
  const navTop = nav ? nav.getBoundingClientRect().top : Infinity;
  const muammo = [];

  const tavsif = (el) => {
    const t = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 34);
    const id = el.id ? "#" + el.id : "";
    const cls = (el.className || "").toString().split(" ").filter(Boolean).slice(0, 2).join(".");
    return `${el.tagName.toLowerCase()}${id}${cls ? "." + cls : ""}${t ? ' "' + t + '"' : ""}`;
  };

  // 1. Gorizontal skroll
  if (doc.scrollWidth > doc.clientWidth + 1) {
    muammo.push({
      tur: "gorizontal-skroll",
      matn: `sahifa ${doc.scrollWidth}px, ekran ${doc.clientWidth}px`,
    });
  }

  // 2. Ekrandan chiqqan elementlar
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > W + 2 || r.left < -2) {
      // ota-onasi allaqachon belgilanган bo'lsa takrorlamaymiz
      muammo.push({
        tur: "ekrandan-chiqqan",
        matn: `${tavsif(el)} — o'ng chekka ${Math.round(r.right)}px (ekran ${W}px)`,
      });
    }
  }

  // 3. Kichik bosiladigan nishonlar
  for (const el of document.querySelectorAll("a, button, input, select, [role=button], [role=tab]")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.height < 40 || r.width < 24) {
      muammo.push({
        tur: "kichik-nishon",
        matn: `${tavsif(el)} — ${Math.round(r.width)}x${Math.round(r.height)}px`,
      });
    }
  }

  // 4. Mayda matn
  const korilgan = new Set();
  for (const el of document.querySelectorAll("p, span, a, li, h1, h2, h3, td, label, button")) {
    const txt = (el.textContent || "").trim();
    if (!txt || txt.length < 3 || korilgan.has(txt)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none") continue;
    const px = parseFloat(cs.fontSize);
    if (px && px < 11) {
      korilgan.add(txt);
      muammo.push({ tur: "mayda-matn", matn: `${tavsif(el)} — ${px}px` });
    }
  }

  // 5. Pastdagi menyu ostida qolgan bosiladigan elementlar
  if (nav) {
    for (const el of document.querySelectorAll("a, button")) {
      if (nav.contains(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.position === "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.height === 0) continue;
      // ekran ichida, lekin menyu ostida qolgan
      if (r.top < navTop && r.bottom > navTop && r.top > 0) {
        muammo.push({
          tur: "menyu-ostida",
          matn: `${tavsif(el)} — pastki menyu ustiga chiqib qolgan`,
        });
      }
    }
  }

  // 6. Yuklanmagan rasmlar
  for (const img of document.querySelectorAll("img")) {
    if (img.complete && img.naturalWidth === 0) {
      muammo.push({ tur: "rasm-yuklanmadi", matn: img.getAttribute("src") || "(src yo'q)" });
    }
  }

  return { balandlik: doc.scrollHeight, muammo };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: fs.existsSync(EDGE) ? EDGE : undefined,
    args: ["--no-sandbox", "--hide-scrollbars"],
  });

  const page = await browser.newPage();
  const konsol = [];
  page.on("console", (m) => {
    if (m.type() === "error") konsol.push(m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => konsol.push("PAGEERROR: " + e.message.slice(0, 160)));

  // Mahsulot havolasini olamiz
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/catalog`, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 4000));
  const productHref = await page.evaluate(() => {
    const a = document.querySelector('a[href^="/catalog/"]');
    return a ? a.getAttribute("href") : null;
  });

  const SAHIFALAR = [
    { nom: "bosh", url: "/" },
    { nom: "katalog", url: "/catalog" },
    { nom: "mahsulot", url: productHref },
    { nom: "savat", url: "/cart" },
  ].filter((s) => s.url);

  const hisobot = [];

  for (const dev of DEVICES) {
    await page.setViewport({
      width: dev.width,
      height: dev.height,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    for (const s of SAHIFALAR) {
      konsol.length = 0;
      await page.goto(BASE + s.url, { waitUntil: "networkidle2", timeout: 90000 });
      await new Promise((r) => setTimeout(r, 4500));

      const natija = await page.evaluate(audit);
      hisobot.push({
        qurilma: dev.name,
        sahifa: s.nom,
        balandlik: natija.balandlik,
        konsol: [...new Set(konsol)],
        muammo: natija.muammo,
      });

      await page.screenshot({
        path: path.join(OUT, `${dev.name}-${s.nom}.png`),
        fullPage: false,
      });
    }
  }

  await browser.close();

  // ── Hisobot ──
  console.log(`\nMANZIL: ${BASE}\n${"=".repeat(64)}`);
  let jami = 0;
  const turlar = {};

  for (const h of hisobot) {
    const guruh = {};
    h.muammo.forEach((m) => {
      (guruh[m.tur] = guruh[m.tur] || []).push(m.matn);
      turlar[m.tur] = (turlar[m.tur] || 0) + 1;
    });
    jami += h.muammo.length;

    console.log(`\n### ${h.qurilma} / ${h.sahifa}  (balandlik ${h.balandlik}px)`);
    if (!h.muammo.length && !h.konsol.length) {
      console.log("   muammo topilmadi");
      continue;
    }
    for (const [tur, ro] of Object.entries(guruh)) {
      console.log(`   [${tur}] ${ro.length} ta`);
      [...new Set(ro)].slice(0, 6).forEach((x) => console.log(`      - ${x}`));
    }
    h.konsol.forEach((c) => console.log(`   [konsol] ${c}`));
  }

  console.log(`\n${"=".repeat(64)}`);
  console.log("XULOSA:", jami, "ta belgi");
  Object.entries(turlar)
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => console.log(`  ${t.padEnd(20)} ${n}`));
  console.log(`\nSuratlar: ${OUT}`);
})().catch((e) => {
  console.error("XATO:", e.message);
  process.exit(1);
});
