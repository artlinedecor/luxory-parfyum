# Loyiha holati — yangi chat shu yerdan boshlasin

Oxirgi yangilanish: 2026-09-29. Sayt: parfumelux.uz, brend **ELORE PARFUME**.
Bu fayl CLAUDE.md orqali har yangi chatda avtomatik o'qiladi.

## ChatPlace bot va savdo tizimi — joriy holat (2026-09-29)
- Bot: Instagram @elore_parfumes, botId `01a0cf0f-4962-716b-a290-6dde8241ce2b`, AI "Asal". Sozlash tarixi: `docs/chatplace-bot-sozlash.md`, savdo tizimi: `docs/chatplace-savdo-tizimi.md`.
- **Model darajasi**: egasi "smart" qilgan edi, 2026-09-29 da yana "fast" ekan — "fast"da bot havolasiz / chala javob beradi. Faqat ChatPlace ilovasida o'zgartiriladi (MCP'da yo'q).
- `delayedActionEnabled` va `generateButtons` o'chirildi (2026-09-29): bot "havolasini yuboraman" deb havolasiz qolardi.
- Global qoidalar: 1) til = mijoz yozuvi (lotin / o'zbek kirill / rus), 2) har atirga `https://parfumelux.uz/a/<nom>` havola, 3) oktyabr aksiyasi va shoshiltirish, "premium atir" (klon/original demaydi), rasmiylashtirish 5 qadam faqat sayt orqali, BTS (muddatsiz), 3 oy narx o'zgarmaydi / 12 oy 96 000 / 6 oy summa aytilmaydi, 650 000 taklif faqat mijoz naqd/Click so'rasa, KATALOG ro'yxati (243 nom).
- Bilim bazasi: har atirga statik yozuv (~242) + e'tirozlar (qimmat, sifat, stoykost, ishonch, o'ylab ko'raman, to'lov, Click). Shablon (`[brend-nom]`) yozma — havolani buzadi.
- Avtomatizatsiya: faqat "+ — asosiy oqim" faol (Direct/izohda "+" → shartlar, erkak/ayol tugmalari, 20 soatlik eslatma). "To'ladim" va "REELS SHABLON" egasi tomonidan o'chirilgan. Izohlarga AI javobi o'chiq (karta raqami xavfi).
- **31-oktyabrdan keyin**: botdagi 3-qoida (aksiya) va "o'ylab ko'raman"/"qimmat" KB javoblaridagi aksiya matnini olib tashlash. Saytda aksiya o'zi o'chadi (`src/config/promo.ts`).
- Telegram (sayt boti, Uzum bilan bir): Uzum — tasdiqlash tugmalari; Click — avtomatik qabul, tugmasiz xabar; yo'q atir — "Bizning segment / Sotmaymiz" tugmalari → Omborxona ro'yxati (`app_settings.missing_perfumes`). Adminlar: `users` jadvali (superadmin, `<chat_id>@telegram.bot`), egasi 7889583510.
- Katalog: mashhurlar birinchi (`src/lib/popularity.ts`), 244 atir, "Premium atir" yozuvi.
- Reels: `docs/reels-plus-2026-09.md`, 5 ta faceless ssenariy — egasi ish stolida `ELORE_Reels_5_ssenariy.pdf`.
- Hal qilinmagan: reklamada brend nomlari xavfi; sayt meta'larida "original va premium atirlar" iborasi; bosh sahifa CLS ~0.09 (hero shrifti).

## Sotuv yo'li
Target reklama → ChatPlace AI sotuvchi → mijozga aniq atir havolasi → atir sahifasi →
savat (`/cart?pay=uzum`) → Uzum Nasiya (bo'lib to'lash) yoki karta (Click).

Reja: `docs/superpowers/specs/2026-09-26-sotuvchi-sayt-design.md`

| # | Qism | Holat |
|---|---|---|
| 1 | ChatPlace API (`/api/public/products?q=`, `/feed`) — `docs/chatplace-ulash.md` | qilindi |
| 2 | Atir sahifasi (narx, Uzum satri, pastki panel) | qilindi |
| 3 | Savat + Uzum oqimi qisqartirildi (Uzum tugmasi birinchi, yetishmagan maydonlar ko'rsatiladi, savatdagi raqam bilan limit darhol tekshiriladi, raqamni o'zgartirish) | qilindi |
| 4 | Bosh sahifa va katalog (C uslub: binafsha #6100FF, Unbounded + Manrope) | qilindi |
| 1b | ChatPlace bot aniq havola yuboradi: `/a/<atir-nomi>` (PR #14) + AI agent global qoidalari — `docs/chatplace-bot-sozlash.md` | qilindi |
| 5 | Tezlik o'lchovi | o'lchandi, tuzatish keyingi ish (quyida) |

## SEO va AI qidiruv
Reja: `docs/superpowers/specs/2026-09-26-seo-geo-reja.md`.
- **0-bosqich qilindi (PR #12):** schema narxi 800 000 UZS (oldin 3.31 USD), brand/sku/breadcrumb,
  toza nomlar (`src/lib/seo.ts`), meta matnlar, yashirilgan atirlar noindex + sitemap'dan chiqdi,
  `public/llms.txt`, Metrika lazyOnload, bosh sahifa CLS, katalog birinchi 4 rasm priority.
- **Keyingisi (1-bosqich):** so'zli URL + 301, `/ru` + hreflang, brend/toifa sahifalari, "bo'lib to'lash" sahifasi, IndexNow.
- Rasm kichraytirish (Supabase transform) yoqilmadi — pullik kvota; Vercel kvotasi tugab rasmlar yo'qolgan tajriba bor.
- Egasining qarori kutilmoqda: "super klon" + mashhur brend nomi xavfi.

## Tezlik (Lighthouse, mobil, jonli sayt, 2026-09-26)
| Sahifa | Ball | LCP | TBT | CLS |
|---|---|---|---|---|
| `/` | 24 | 4.6 s | 4 170 ms | 0.515 |
| `/catalog` | 42 | 11.5 s | 4 300 ms | 0 |
| `/` (PR #12 dan keyin) | 44 | 4.9 s | 5 890 ms | 0.085 |
| `/catalog` (PR #12 dan keyin) | 44 | 9.1 s | 4 750 ms | 0 |

Sabablari va keyingi ish (tartib bo'yicha):
1. Yandex Metrika (~2.9 s JS) va Facebook Pixel darhol yuklanadi → `lazyOnload`/foydalanuvchi harakatidan keyin yuklash.
2. Mahsulot rasmlari Supabase'dan to'g'ridan-to'g'ri, kichraytirilmagan (~0.8 MB) → Next Image optimizatsiyasi yoki Supabase transform (`width=`).
3. Bosh sahifada katta layout shift (CLS 0.515, hero ostidagi SECTION) → joyni oldindan band qilish.
4. Katalogda LCP — birinchi karta rasmi → birinchi 2–4 rasmga `priority`.
5. Ishlatilmagan JS ~260 KB (asosiy chunk'lar).

## Oktyabr aksiyasi (2026-09-27)
- Faqat ko'rinish: kartochka/atir sahifasida chizilgan "1 000 000", "−20%", bosh sahifada lenta.
  Haqiqiy narx o'zgarmagan — 800 000 (savat, Uzum, Click, JSON-LD'da eski narx yo'q).
- Tugaydi: **2026-10-31 23:59 (Toshkent)** — o'zi yo'qoladi. Sozlama: `src/config/promo.ts`
  (`active: false` — muddatidan oldin o'chirish). Bosh sahifa ISR 1 soat (`src/app/page.tsx`).
- Mijozga "klon" yozilmaydi — "Premium atir" (seo, i18n, savat, meta, llms.txt).
- Kuchaytirildi (PR "aksiya-countdown"): countdown kun·soat·daqiqa (lenta, narx bloki, pastki panel —
  `PromoCountdown.tsx`), "Bugun buyurtma bering — hozir 0 so'm" satrlari, CSS motion
  (−20% yaltirash, CTA shimmer, raqam almashuvi, lenta kirishi, kartalar scroll'da) — reduced-motion'da o'chadi.
  Lenta Suspense'dan chiqarildi: React 19.2 katta Suspense bo'lagini kechiktirib CLS 0.27 berardi.
  Bosh sahifada qolgan CLS ~0.09 — hero sarlavhasi shrift almashuvida qator o'zgaradi (eski muammo).

## Egasi qarorlari (buzmang)
- Mijozga faqat tasdiqlangan va'dalar: "Tez yetkazib berish", "Telefon + SMS · 2 daqiqa",
  "Kartasiz, naqd pulsiz", "800 000 so'm — har qanday premium atir", "0 so'm hozir".
- Yozilmasin: "1–3 kun", "Tekshirib olasiz", oylik to'lov summasi, o'ylab topilgan chegirma/sovg'a/bepul yetkazish.
- Ombor qoldig'i mijozga ko'rsatilmaydi.
- Rasm: faqat flakon, oq fon. 98 ta almashtirilgan — `docs/rasm-almashtirish-2026-09-26.json` (eski havolalar bilan).
- Qoldirilgan rasmlar: HFC "Delisitrige" (nomi noma'lum), Lady Sexy.
- Takroriy 5 atir yashirilgan — `docs/takroriy-atirlar-2026-09-26.json`.
- Nomlar tuzatildi — `docs/nom-tuzatish-2026-09-26.json`; emoji va "(+18)" olib tashlandi (30 ta) — `docs/nom-tuzatish-2-2026-09-26.json`.
- 49 ta mashhur atir qo'shildi (Tygar, Miss Dior, Allure...) — `docs/yangi-atirlar-2026-09-26.json`
  (rasm va notalar Fragrantica'dan, rasm `product-images/public/added-2026-09-26/`). Yana 2 takroriy yashirildi — `docs/takroriy-atirlar-2-2026-09-26.json`.
  Eski yashirin kartochkalar (Tygar ×2, J'adore, Chance Eau Tendre) yashirinligicha qoldi.
- 2026-09-27: 74 ta past sifatli/noto'g'ri rasm almashtirildi (Chanel Allure 300×400 → 900×1200 va h.k.; Acqua di Giò'da
  Profondo flakoni turgan edi) — `docs/rasm-almashtirish-2026-09-27.json`, fayllar `product-images/public/replaced-2026-09-27/`.
  Manba: Sephora, brend saytlari (PdM, Xerjoff, Initio...), Notino. Hamma rasm 900×1200 oq kanvas, faqat flakon.
  Qolganlari (Chase, HFC, Milton-Lloyd, LV, Clive Christian, Amouage, Creed va b.) uchun oq fonli, qutisiz yirik rasm topilmadi.

## Hisob-kitob (dashboard)
- Buxgalteriya kursi 11 870 (dashboard'da o'zgartiriladi, `app_settings.usd_to_uzs`);
  sayt narx kursi `utils.ts` da 12 100 — ataylab alohida.
- Rasxod segment bilan kiritiladi, buyurtmaga bog'lanmaydi, jamidan ayriladi.
- Uzum depoziti $100 — qaytmaydigan rasxod. Mirdiyor buyurtmasi "Aniq emas". Hilola — yetkaziladi.
- SQL migratsiyalar 07–09 bajarilgan.

## Egasi qilishi kerak
- Vercel'ga `CHATPLACE_API_KEY` qo'yish (kalit hech qachon repoga/chatga yozilmaydi).

## Texnik
- Next.js 16 (App Router), Supabase, Vercel main'dan avtomatik deploy.
- GitHub: `"C:\Program Files\GitHub CLI\gh.exe"` (PowerShell'da `--body-file`), merge `--merge --match-head-commit <sha>`.
  Merge faqat egasi "chiqar/deploy" deganda.
- GitHub "build" tekshiruvi eskidan qizil (sekretlar yo'q), merge'ni to'smaydi; Vercel deploy o'tadi.
- Bazaga o'zgartirish: `scratch/_*.mjs` vaqtinchalik skript (`.env.local` service key), ishdan keyin o'chiriladi, o'zgarish `docs/` ga JSON qilib yoziladi.
