/**
 * Telegram webhook'ini maxfiy so'z bilan ro'yxatdan o'tkazadi.
 *
 * Ishlatish:
 *   node scripts/set-telegram-webhook.cjs <BOT_TOKEN>
 *
 * Maxfiy so'z (.env.local dagi TELEGRAM_WEBHOOK_SECRET) avtomatik olinadi —
 * ya'ni Vercel'dagi qiymat bilan bir xil bo'ladi.
 */
const fs = require("fs");

const token = process.argv[2];
if (!token) {
  console.error("\n❌ Bot tokeni berilmadi.\n");
  console.error("Ishlatish:  node scripts/set-telegram-webhook.cjs <BOT_TOKEN>\n");
  console.error("Tokenni qayerdan olish:");
  console.error("  Vercel > Settings > Environment Variables > TELEGRAM_BOT_TOKEN");
  console.error("  yoki Telegramda @BotFather > /mybots > bot > API Token\n");
  process.exit(1);
}

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

const secret = env.TELEGRAM_WEBHOOK_SECRET;
if (!secret) {
  console.error("❌ .env.local da TELEGRAM_WEBHOOK_SECRET topilmadi");
  process.exit(1);
}

const url = "https://parfumelux.uz/api/telegram-webhook";

(async () => {
  const set = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, secret_token: secret }),
  }).then((r) => r.json());

  console.log("\n=== setWebhook ===");
  console.log(set.ok ? "✅ Muvaffaqiyatli" : "❌ Xato: " + (set.description || JSON.stringify(set)));
  if (!set.ok) process.exit(1);

  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
    .then((r) => r.json());

  console.log("\n=== Tekshiruv ===");
  console.log("  manzil          :", info.result?.url || "—");
  console.log("  maxfiy so'z     :", info.result?.has_custom_certificate === undefined
    ? "(Telegram ko'rsatmaydi — lekin o'rnatildi)" : "");
  console.log("  kutayotgan xabar:", info.result?.pending_update_count ?? "—");
  if (info.result?.last_error_message) {
    console.log("  ⚠️ oxirgi xato  :", info.result.last_error_message);
  }
  console.log("\nTayyor. Bot tugmalari endi himoyalangan.\n");
})();
