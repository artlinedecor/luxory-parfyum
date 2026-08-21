// Vercel'ga qo'yiladigan kalitlarni chiqaradi.
// Ishga tushirish:  node scripts-env-print.cjs
const fs = require("fs");
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const need = [
  "ADMIN_SESSION_SECRET",
  "INTERNAL_API_SECRET",
  "TELEGRAM_WEBHOOK_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
];
console.log("\n=== Vercel > Settings > Environment Variables ===\n");
for (const k of need) {
  console.log(env[k] ? `${k}=${env[k]}` : `${k}=  ← YO'Q! .env.local da topilmadi`);
}
console.log("\n=== Bularni O'ZINGIZ tanlaysiz ===");
console.log("ADMIN_EMAIL=<o'z emailingiz>");
console.log("ADMIN_PASSWORD=<yangi kuchli parol — eskisi git tarixida qoldi>\n");
