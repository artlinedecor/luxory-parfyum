/**
 * compress_images.js — Supabase'dagi mahsulot rasmlarini siqish.
 *
 * Nega kerak: Vercel Hobby'da rasm optimizatsiyasi kvotasi tugagani uchun
 * next/image o'chirilgan (unoptimized) — rasmlar to'g'ridan-to'g'ri beriladi.
 * Shuning uchun manbadagi rasmlar o'zi yengil bo'lishi kerak.
 *
 * Nima qiladi: kengligi > MAX_W yoki hajmi > MAX_KB bo'lgan rasmlarni
 * 900px gacha kichraytirib, WebP (q=82) ga o'giradi va qayta yuklaydi.
 * Eski image_url lar zaxiraga yoziladi.
 *
 *   node scratch/compress_images.js            # DRY-RUN (faqat hisobot)
 *   node scratch/compress_images.js --apply    # haqiqiy siqish
 *   node scratch/compress_images.js --apply --limit=20
 */
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase = createClient(SUPA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const APPLY = process.argv.includes("--apply");
const LIMIT = (() => {
  const a = process.argv.find((x) => x.startsWith("--limit="));
  return a ? parseInt(a.split("=")[1]) : Infinity;
})();

const MAX_W = 900;       // maksimal kenglik
const MAX_KB = 120;      // shundan katta bo'lsa siqamiz
const QUALITY = 82;

(async () => {
  const { data: products, error } = await supabase
    .from("products")
    .select("id,title,image_url")
    .not("image_url", "is", null);
  if (error) throw error;

  const bkp = path.join(__dirname, `backup_image_urls_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(bkp, JSON.stringify(products.map((p) => ({ id: p.id, image_url: p.image_url })), null, 2));
  console.log("zaxira:", path.basename(bkp));
  console.log(`Rejim: ${APPLY ? "APPLY (siqiladi)" : "DRY-RUN"} — ${products.length} ta rasm\n`);

  let before = 0, after = 0, changed = 0, skipped = 0, failed = 0;
  const targets = products.slice(0, LIMIT);

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    try {
      const res = await fetch(p.image_url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      const kb = buf.length / 1024;
      const meta = await sharp(buf).metadata();
      before += kb;

      if (kb <= MAX_KB && (meta.width || 0) <= MAX_W) {
        after += kb; skipped++;
        continue;
      }

      const out = await sharp(buf)
        .rotate()
        .resize({ width: MAX_W, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
      const outKb = out.length / 1024;

      console.log(
        `[${i + 1}/${targets.length}] ${Math.round(kb)}KB -> ${Math.round(outKb)}KB  ${p.title.slice(0, 40)}`
      );

      if (APPLY) {
        const fp = `public/${p.id}_c.webp`;
        const up = await supabase.storage
          .from("product-images")
          .upload(fp, out, { contentType: "image/webp", upsert: true });
        if (up.error) throw up.error;
        const url = `${SUPA_URL}/storage/v1/object/public/product-images/${fp}`;
        const upd = await supabase.from("products").update({ image_url: url }).eq("id", p.id);
        if (upd.error) throw upd.error;
      }
      after += outKb; changed++;
    } catch (e) {
      console.log(`[${i + 1}] ❌ ${p.title.slice(0, 35)} — ${e.message}`);
      failed++;
    }
  }

  console.log("\n=== NATIJA ===");
  console.log("siqildi:", changed, "| tegilmadi:", skipped, "| xato:", failed);
  console.log(`jami: ${Math.round(before / 1024)} MB -> ${Math.round(after / 1024)} MB`);
  if (!APPLY) console.log("\n[DRY-RUN] Hech narsa o'zgarmadi. Qo'llash: --apply");
})();
