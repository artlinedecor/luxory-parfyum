# Loyiha holati — yangi chat shu yerdan boshlasin

Oxirgi yangilanish: 2026-09-26. Sayt: parfumelux.uz, brend **ELORE PARFUME**.
Yangi chatda avval shu faylni o'qing.

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
| 5 | Tezlik o'lchovi | quyida |

## Egasi qarorlari (buzmang)
- Mijozga faqat tasdiqlangan va'dalar: "Tez yetkazib berish", "Telefon + SMS · 2 daqiqa",
  "Kartasiz, naqd pulsiz", "800 000 so'm — har qanday premium atir", "0 so'm hozir".
- Yozilmasin: "1–3 kun", "Tekshirib olasiz", oylik to'lov summasi, o'ylab topilgan chegirma/sovg'a/bepul yetkazish.
- Ombor qoldig'i mijozga ko'rsatilmaydi.
- Rasm: faqat flakon, oq fon. 98 ta almashtirilgan — `docs/rasm-almashtirish-2026-09-26.json` (eski havolalar bilan).
- Qoldirilgan rasmlar: HFC "Delisitrige" (nomi noma'lum), Lady Sexy.
- Takroriy 5 atir yashirilgan — `docs/takroriy-atirlar-2026-09-26.json`.
- Nomlar tuzatildi — `docs/nom-tuzatish-2026-09-26.json`.

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
