/**
 * cleanup_catalog.js — Xavfsiz katalog tozalash
 *
 * Nima qiladi:
 *  1) Barcha mahsulotlarni timestamped JSON ga ZAXIRA qiladi
 *  2) product_type === "original" mahsulotlarni o'chiradi (user: "original kerak emas")
 *  3) Nomi "200 ml" / "200ml" bo'lgan mahsulotlarni o'chiradi
 *  4) Dublikat lux_copy larni o'chiradi — har nomdan FAQAT 1 ta qoldiradi
 *     (rasmi bor + stock ko'p bo'lganini afzal ko'radi)
 *
 * Ishlatish:
 *   node scratch/cleanup_catalog.js            # DRY-RUN (faqat ko'rsatadi, o'chirmaydi)
 *   node scratch/cleanup_catalog.js --apply    # HAQIQIY o'chirish
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://zfcfqkzqvfttzgthnqpo.supabase.co";
const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmY2Zxa3pxdmZ0dHpndGhucXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTgzMDQsImV4cCI6MjA5OTA5NDMwNH0.ZYmH6QoGSbDEUDV1DVvbb6KBOYzb4YOdCEg2SJ3VdFw";

const APPLY = process.argv.includes("--apply");
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

function norm(t) {
  return (t || "")
    .replace(/[’'`“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
const is200 = (t) => /200\s*ml/i.test(t || "");

async function main() {
  // 1) FETCH ALL
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`,
    { headers: H }
  );
  const all = await res.json();
  if (!Array.isArray(all)) {
    console.error("Fetch failed:", all);
    process.exit(1);
  }
  console.log(`Jami mahsulot: ${all.length}`);

  // BACKUP
  const backupPath = path.join(
    __dirname,
    `backup_products_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  );
  fs.writeFileSync(backupPath, JSON.stringify(all, null, 2));
  console.log(`Zaxira saqlandi: ${backupPath}`);

  const toDelete = new Map(); // id -> reason

  // 2) originallar
  for (const p of all) {
    if (p.product_type === "original") toDelete.set(p.id, "original");
  }
  // 3) 200 ml
  for (const p of all) {
    if (is200(p.title)) toDelete.set(p.id, "200ml");
  }

  // 4) dublikat lux_copy — har nomdan 1 ta qoldiramiz
  const luxKept = new Map(); // normTitle -> best product
  const survivors = all.filter(
    (p) => p.product_type === "lux_copy" && !is200(p.title)
  );
  // score: rasmi bor (+100) + stock
  const score = (p) => (p.image_url ? 100 : 0) + (Number(p.stock) || 0);
  for (const p of survivors) {
    const k = norm(p.title);
    const cur = luxKept.get(k);
    if (!cur || score(p) > score(cur)) luxKept.set(k, p);
  }
  const keepIds = new Set([...luxKept.values()].map((p) => p.id));
  for (const p of survivors) {
    if (!keepIds.has(p.id)) toDelete.set(p.id, "dublikat");
  }

  // SUMMARY
  const byReason = {};
  for (const r of toDelete.values()) byReason[r] = (byReason[r] || 0) + 1;
  console.log("\n=== O'CHIRISH REJASI ===");
  console.log(byReason);
  console.log(`Jami o'chiriladi: ${toDelete.size}`);
  console.log(`Qoladi: ${all.length - toDelete.size} ta noyob lux_copy`);
  const inStock = [...keepIds].filter((id) => {
    const p = all.find((x) => x.id === id);
    return (Number(p.stock) || 0) > 0;
  }).length;
  console.log(`Qoladiganlardan stock>0 (astatka): ${inStock} ta`);

  if (!APPLY) {
    console.log(
      "\n[DRY-RUN] Hech narsa o'chirilmadi. Haqiqiy o'chirish uchun: node scratch/cleanup_catalog.js --apply"
    );
    return;
  }

  // APPLY — o'chirish
  console.log("\n=== O'CHIRILMOQDA ... ===");
  let ok = 0,
    fail = 0;
  for (const id of toDelete.keys()) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
      method: "DELETE",
      headers: H,
    });
    if (r.ok) ok++;
    else {
      fail++;
      console.error(`  ❌ ${id}: HTTP ${r.status} ${await r.text()}`);
    }
  }
  console.log(`\nTugadi. O'chirildi: ${ok}, xato: ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
