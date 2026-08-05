/**
 * fetch_verified_images.js — Real flakon rasmi + AI-vision tekshiruvi
 *
 * Har mahsulot uchun:
 *   1) Bing Images'dan bir nechta nomzod rasm oladi
 *   2) Yaroqlilarini yuklab oladi
 *   3) gpt-4o-mini (vision) ga ko'rsatib: "qaysi biri shu atirning toza flakon rasmi?"
 *   4) Faqat tasdiqlangan rasmni Supabase'ga yuklab, image_url ni yangilaydi
 *
 *   node scratch/fetch_verified_images.js --missing [--limit=N] [--save]
 *   node scratch/fetch_verified_images.js --all [--limit=N] [--save]
 */
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPA_URL, SUPA_KEY);

const SAVE_DIR =
  "C:/Users/ELYOR/AppData/Local/Temp/claude/E--Claude--claude-worktrees-premium-apartment-pms-56f7ac/8136b14e-181e-4b4a-a34a-beba1c3a7cf3/scratchpad/verified";

const args = process.argv.slice(2);
const MODE = args.includes("--all") ? "all" : "missing";
const SAVE = args.includes("--save");
const LIMIT = (() => {
  const a = args.find((x) => x.startsWith("--limit="));
  return a ? parseInt(a.split("=")[1]) : Infinity;
})();

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cleanQuery(title) {
  let t = (title || "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\uFE0F\u2011-\u2015]/gu, " ")
    .replace(/для\s+(женщин|мужчин)/gi, "")
    .replace(/\|\|?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${t} eau de parfum bottle`;
}

async function bingImageUrls(query) {
  const url =
    "https://www.bing.com/images/search?q=" +
    encodeURIComponent(query) +
    "&form=HDRSC2&first=1";
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`bing HTTP ${r.status}`);
  const html = await r.text();
  const dec = (s) => s.replace(/\\u002f/g, "/").replace(/&amp;/g, "&");
  // Har natijadan murl (original) + turl (thumbnail, hotlink-friendly)
  const blocks = [...html.matchAll(/murl&quot;:&quot;(.*?)&quot;.*?turl&quot;:&quot;(.*?)&quot;/g)];
  const pairs = blocks.map((m) => ({ murl: dec(m[1]), turl: dec(m[2]) }));
  if (pairs.length === 0) {
    return [...html.matchAll(/murl&quot;:&quot;(.*?)&quot;/g)].map((m) => ({
      murl: dec(m[1]),
      turl: null,
    }));
  }
  return pairs;
}

function scoreUrl(u) {
  const s = u.toLowerCase();
  let sc = 0;
  if (/louisvuitton|chanel|dior|creed|xerjoff|amouage|bvlgari|ysl|yslbeauty|versace|byredo|bykilian|kilian|maison|tizianaterenzi|marcantoine|marc-antoine|hfc|clivechristian|parfumsdemarly|nishane|initio/.test(s)) sc += 6;
  if (/notino|goldenscent|golden-scent|fragrantica|sephora|parfumstock|elisium|parfum|perfume|scentbird|fragrance|aromo|osmoz/.test(s)) sc += 3;
  if (/\.(jpg|jpeg|png|webp)(\?|$)/.test(s)) sc += 1;
  if (/pinterest|lookaside|fbcdn|instagram|ebay|aliexpress|dhgate|youtube|ytimg|wikimedia|tripadvisor|expedia/.test(s)) sc -= 5;
  return sc;
}

async function tryDownload(imgUrl) {
  const r = await fetch(imgUrl, {
    headers: { "User-Agent": UA, Referer: "https://www.bing.com/" },
    signal: AbortSignal.timeout(7000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const ct = r.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) throw new Error("not image");
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 6000) throw new Error("too small");
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
  return { buf, ext, ct };
}

// gpt-4o-mini vision: qaysi rasm to'g'ri flakon? (1..n) yoki 0
async function pickBest(title, cands) {
  const content = [
    {
      type: "text",
      text:
        `Online perfume shop uchun mahsulot rasmini tanlayapman. Mahsulot: "${title}".\n` +
        `Quyida ${cands.length} ta nomzod rasm. Qaysi biri shu atirning TOZA, yakka flakon mahsulot rasmi (ideal: oq/sodda fon, brend to'g'ri kelsa yaxshi)?\n` +
        `Faqat bitta raqam qaytar (1..${cands.length}). Agar hech biri atir flakoni bo'lmasa (masalan bino, odam, plakat, logotip) — 0 qaytar. FAQAT raqam.`,
    },
  ];
  cands.forEach((c) => {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${c.ct};base64,${c.buf.toString("base64")}`,
        detail: "low",
      },
    });
  });

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content }],
      max_tokens: 5,
      temperature: 0,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 200));
  const txt = (j.choices?.[0]?.message?.content || "").trim();
  const n = parseInt((txt.match(/\d+/) || ["0"])[0]);
  return isNaN(n) ? 0 : n;
}

async function uploadToSupabase(buf, ext, ct, title) {
  const safe =
    (title || "p").replace(/[^a-zA-Z0-9-]/g, "_").toLowerCase().slice(0, 40) +
    "_v_" + Date.now() + "." + ext;
  const filePath = `public/${safe}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, buf, { contentType: ct, upsert: true });
  if (error) throw error;
  return `${SUPA_URL}/storage/v1/object/public/product-images/${filePath}`;
}

function queryVariants(title) {
  const t = cleanQuery(title).replace(/ eau de parfum bottle$/, "");
  const noMl = t.replace(/\d+\s*ml/gi, "").replace(/\s+/g, " ").trim();
  return [
    `${noMl} eau de parfum bottle`,
    `${noMl} perfume`,
    `${t} fragrance bottle`,
  ].filter((v, i, a) => v && a.indexOf(v) === i);
}

async function processOne(p) {
  // Har so'rov variantidan nomzod yig'amiz (recall oshirish)
  const cands = [];
  const seen = new Set();
  for (const q of queryVariants(p.title)) {
    if (cands.length >= 8) break;
    let pairs = [];
    try {
      pairs = (await bingImageUrls(q))
        .filter((u) => u.murl && !seen.has(u.murl))
        .sort((a, b) => scoreUrl(b.murl) - scoreUrl(a.murl));
    } catch {}
    for (const pr of pairs) {
      if (cands.length >= 8) break;
      seen.add(pr.murl);
      // avval original (murl), 403 bo'lsa thumbnail (turl)
      let d = null;
      for (const cand of [pr.murl, pr.turl].filter(Boolean)) {
        try {
          d = await tryDownload(cand);
          break;
        } catch {}
      }
      // vision faqat jpeg/png qabul qiladi (webp'da base64 xato bo'ldi)
      if (d && (d.ext === "jpg" || d.ext === "png")) cands.push({ ...d, src: pr.murl });
    }
    if (cands.length >= 4) break; // yetarli nomzod bo'lsa to'xtaymiz
  }
  if (cands.length === 0) throw new Error("no downloadable candidates");

  const idx = await pickBest(p.title, cands);
  if (idx < 1 || idx > cands.length) throw new Error("vision: mos rasm yo'q");

  const chosen = cands[idx - 1];
  if (SAVE) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
    fs.writeFileSync(path.join(SAVE_DIR, `${p.id.slice(0, 8)}.${chosen.ext}`), chosen.buf);
  }
  const url = await uploadToSupabase(chosen.buf, chosen.ext, chosen.ct, p.title);
  return url;
}

async function main() {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY yo'q");
  const { data: products, error } = await supabase.from("products").select("*");
  if (error) throw error;

  const bkp = path.join(__dirname, `backup_image_urls_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(bkp, JSON.stringify(products.map((p) => ({ id: p.id, image_url: p.image_url })), null, 2));
  console.log("zaxira:", path.basename(bkp));

  let targets = MODE === "all" ? products.slice() : products.filter((p) => !p.image_url);
  targets = targets.slice(0, LIMIT);
  console.log(`Rejim: ${MODE} — ${targets.length} ta\n`);

  let ok = 0, fail = 0;
  const failed = [];
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    try {
      const url = await processOne(p);
      const { error: uErr } = await supabase.from("products").update({ image_url: url }).eq("id", p.id);
      if (uErr) throw uErr;
      console.log(`[${i + 1}/${targets.length}] ✅ ${p.title.slice(0, 44)}`);
      ok++;
    } catch (e) {
      console.log(`[${i + 1}/${targets.length}] ⚠️  ${p.title.slice(0, 44)} — ${e.message}`);
      failed.push(p.title);
      fail++;
    }
    await sleep(500);
  }
  console.log(`\nTUGADI. OK: ${ok}, topilmadi: ${fail}`);
  if (failed.length) {
    fs.writeFileSync(path.join(__dirname, "images_failed.json"), JSON.stringify(failed, null, 2));
    console.log("Topilmaganlar: scratch/images_failed.json");
  }
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
