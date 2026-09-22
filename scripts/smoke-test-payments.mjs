/**
 * To'lov va buyurtma qabul qilish oqimining ISHLAB TURGANINI
 * tekshiradi — HAQIQIY to'lov qilmaydi, pul harakatlantirmaydi,
 * faqat har bir endpoint KUTILGAN xato/javob shaklini qaytarayotganini
 * tasdiqlaydi (masalan noto'g'ri imzo bilan so'rov yuborilsa,
 * "SIGN CHECK FAILED" qaytishi kerak — 500 yoki HTML xato sahifasi
 * EMAS).
 *
 * Ishlatish:
 *   node scripts/smoke-test-payments.mjs
 *   node scripts/smoke-test-payments.mjs https://boshqa-domen.uz
 */
const BASE = process.argv[2] || "https://parfumelux.uz";
let failed = 0;

async function check(name, fn) {
  try {
    const ok = await fn();
    console.log(`${ok ? "✅" : "❌"} ${name}`);
    if (!ok) failed++;
  } catch (e) {
    console.log(`❌ ${name} — istisno: ${e.message}`);
    failed++;
  }
}

await check("Bosh sahifa ochiladi", async () => {
  const r = await fetch(BASE + "/", { redirect: "manual" });
  return r.status === 200;
});

await check("Savat sahifasi ochiladi", async () => {
  const r = await fetch(BASE + "/cart");
  return r.status === 200;
});

await check("Click /prepare — imzosiz so'rovni to'g'ri rad etadi (JSON, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/click/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "click_trans_id=1&service_id=1&merchant_trans_id=test&amount=1000&action=0&sign_time=x&sign_string=x",
  });
  const j = await r.json().catch(() => null);
  return r.status === 200 && j && Number(j.error) === -1;
});

await check("Click /complete — imzosiz so'rovni to'g'ri rad etadi (JSON, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/click/complete", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "click_trans_id=1&service_id=1&merchant_trans_id=test&merchant_prepare_id=1&amount=1000&action=1&error=0&sign_time=x&sign_string=x",
  });
  const j = await r.json().catch(() => null);
  return r.status === 200 && j && Number(j.error) === -1;
});

await check("Uzum check-status — javob beradi (rate-limit yoki natija, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/uzumnasiya/check-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "998900000000" }),
  });
  return r.status === 200 || r.status === 429;
});

await check("orders/create — noto'g'ri so'rovni to'g'ri rad etadi (400, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [], client: {} }),
  });
  return r.status === 400;
});

await check("Admin panel sessiyasiz kirishni rad etadi (307/401, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/dashboard/data", { redirect: "manual" });
  return r.status === 401;
});

console.log(`\n${failed === 0 ? "✅ Hammasi joyida" : `❌ ${failed} ta tekshiruv muvaffaqiyatsiz`}`);
process.exit(failed === 0 ? 0 : 1);
