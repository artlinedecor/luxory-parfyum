/**
 * make_logo.js — brend logotipini sayt uchun tayyorlaydi.
 *
 * Nega kerak: logotip faqat admin brauzerining localStorage'ida turgan
 * (Supabase havolasi bilan). Ya'ni MIJOZLAR uni umuman ko'rmayapti.
 * Shu bois logotip endi sayt bilan birga yuboriladi — public/ ichida.
 *
 * Vercel image optimizer o'chirilgan, shuning uchun fayllar oldindan
 * siqiladi (manba 1254x1254, 829 KB — header uchun 32px kerak).
 *
 *   node scratch/make_logo.js
 *
 * Logotip foni oq doira. Uni shaffof qilishga urinmaymiz — sayt foni
 * ham deyarli oq (#faf8f5), shuning uchun kesib olingan qism aynan
 * shu rangga "yotqiziladi" (flatten) va chegara sezilmaydi.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC = path.join(__dirname, "logo_orig.png");
const PUB = path.join(__dirname, "..", "public");
const BG = { r: 250, g: 248, b: 245 }; // #faf8f5 — sayt foni

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error("Manba topilmadi:", SRC);
    process.exit(1);
  }

  const meta = await sharp(SRC).metadata();
  const size = meta.width;
  console.log(`Manba: ${size}x${meta.height}, ${(fs.statSync(SRC).size / 1024).toFixed(0)} KB`);

  // ── 1. Emblema (flakon) — logotipning yuqori qismi.
  // Nom matni pastda; header'da nom alohida shrift bilan yozilgani uchun
  // faqat rasmli qismi olinadi.
  // sharp'da extract + trim + resize bitta quvurda to'qnashadi
  // ("bad extract area"), shu bois ikki bosqichda bajaramiz.
  const cropped = await sharp(SRC)
    .extract({
      left: Math.round(size * 0.31),
      top: Math.round(size * 0.17),
      width: Math.round(size * 0.38),
      height: Math.round(size * 0.4),
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toBuffer();

  // Fonni SHAFFOF qilamiz. sharp'ning .unflatten() faqat TOZA oq
  // piksellarni oladi, logotip foni esa ~#fbfbfb — shu bois alfa
  // kanalini yorqinlik bo'yicha o'zimiz quramiz. Aks holda alabastr
  // header'da emblema ostida ochroq kvadrat sezilib turardi.
  const { data, info } = await sharp(cropped).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const total = info.width * info.height;
  const rgba = Buffer.alloc(total * 4);

  for (let i = 0; i < total; i++) {
    const r = data[i * ch];
    const g = data[i * ch + 1];
    const b = data[i * ch + 2];
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // >=248 fon (shaffof), <=236 to'liq ko'rinadi,
    // orasi yumshoq chekka — harflar va nozik tilla chiziqlar tishlanmasin
    rgba[i * 4 + 3] =
      lum >= 248 ? 0 : lum <= 236 ? 255 : Math.round(((248 - lum) / 12) * 255);
  }

  const markBuf = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 6 })
    .resize(192, 192, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    // Kirish xom piksellar bo'lgani uchun formatni ANIQ ko'rsatish shart —
    // aks holda .toBuffer() yana xom bufer qaytaradi va keyingi
    // sharp() chaqiruvi "unsupported image format" deb yiqiladi.
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(markBuf).toFile(path.join(PUB, "logo-mark.png"));
  await sharp(markBuf).webp({ quality: 92 }).toFile(path.join(PUB, "logo-mark.webp"));

  // ── 2. To'liq lockup — footer, ulashish rasmlari
  const flattened = await sharp(SRC).flatten({ background: BG }).toBuffer();
  const fullBuf = await sharp(flattened)
    .trim({ background: BG, threshold: 12 })
    .resize(560, 560, { fit: "inside" })
    .toBuffer();

  await sharp(fullBuf).webp({ quality: 88 }).toFile(path.join(PUB, "logo.webp"));

  // ── 3. PWA / favicon — kvadrat, fon bilan
  for (const px of [512, 192]) {
    // sharp bitta quvurda faqat BITTA resize qo'llaydi va extend undan
    // keyin bajariladi — shu bois hoshiya alohida bosqichda qo'shiladi,
    // aks holda natija 512 emas, 604 piksel chiqardi.
    const inner = Math.round(px * 0.84);
    const scaled = await sharp(fullBuf)
      .resize(inner, inner, { fit: "contain", background: BG })
      .toBuffer();
    const sm = await sharp(scaled).metadata();
    const padX = Math.max(0, px - sm.width);
    const padY = Math.max(0, px - sm.height);
    await sharp(scaled)
      .extend({
        left: Math.floor(padX / 2),
        right: padX - Math.floor(padX / 2),
        top: Math.floor(padY / 2),
        bottom: padY - Math.floor(padY / 2),
        background: BG,
      })
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUB, px === 512 ? "icon.png" : "icon-192.png"));
  }

  console.log("\nTayyor:");
  for (const f of [
    "logo-mark.png",
    "logo-mark.webp",
    "logo.webp",
    "icon.png",
    "icon-192.png",
  ]) {
    const st = fs.statSync(path.join(PUB, f));
    const m = await sharp(path.join(PUB, f)).metadata();
    console.log(`  ${f.padEnd(16)} ${m.width}x${m.height}  ${(st.size / 1024).toFixed(1)} KB`);
  }
})().catch((e) => {
  console.error("XATO:", e.message);
  process.exit(1);
});
