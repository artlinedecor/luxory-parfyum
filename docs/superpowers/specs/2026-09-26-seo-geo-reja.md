# SEO va AI qidiruv rejasi — parfumelux.uz (ELORE PARFUME)

Sana: 2026-09-26. Maqsad: Google, Yandex va AI yordamchilarda (ChatGPT, Perplexity, Google AI Overviews,
Yandex Neyro/Alice) "atir Toshkent", "atir bo'lib to'lash", "<brend> atir narxi" kabi so'rovlarda chiqish.

Hech kim "1-o'rin"ni kafolatlay olmaydi. Reja — Google/Yandex/AI qaysi belgilarga qarasa, o'shalarni to'liq qilish.

## Hozirgi holat (jonli saytda tekshirildi)

| Narsa | Holat |
|---|---|
| robots.txt, sitemap.xml | bor; sitemap'da 220 atir + bosh sahifa |
| Google va Yandex tasdiqlash teglari | bor (Search Console / Yandex Webmaster ulangan bo'lishi kerak) |
| AI botlarga ruxsat | bor (robots hammaga ochiq) |
| **Product schema narxi** | **XATO: `price: 3.31, USD`** — 800 000 so'm bo'lishi kerak |
| Product schema | brand, sku, availability, url yo'q |
| Meta tavsif | "0-0-6 muddatli to'lov" — eskirgan (hozir 3·6·12); "100% original" hamma sahifada |
| Atir nomlari | bazadagi xom nom: "HUGO BOSS BOSS THE SCENT 100ML EDT" |
| URL | `/catalog/<uuid>` — so'zsiz, qidiruvga foydasiz |
| Atir sahifasi matni | ~800 belgi, shablon tavsif ("o'ziga xos tarovat...") — 220 sahifada deyarli bir xil |
| Rus tili | faqat tugma; `/ru` sahifalar yo'q → Yandex'dagi ruscha so'rovlarda ko'rinmaydi |
| Brend / toifa sahifalari | yo'q (`/brands` 404) |
| llms.txt | yo'q |
| Tezlik (mobil) | bosh sahifa 24/100, katalog 42/100 (HOLAT.md) |

## 0-bosqich — xatolarni tuzatish (1 hafta, kod)
1. Product schema: narx `800 000 UZS` (original — o'z narxi), `brand`, `sku`, `url`, `availability`, `seller`.
   Sharh (`aggregateRating`) faqat haqiqiy sharhlar bo'lganda.
2. Meta tavsif va title: "3, 6 yoki 12 oyga bo'lib to'lash", "100% original" faqat original atirlarda.
3. Toza ko'rinadigan nom: "Hugo Boss The Scent EDT, 100 ml" (bazadagi nomdan avtomatik, qo'lda tuzatish ro'yxati bilan).
4. Tezlik: Metrika/Pixel'ni kechiktirish, rasmlarni kichraytirish, CLS (HOLAT.md dagi 5 band).
5. `llms.txt` — do'kon kimligi, narx siyosati, to'lov, yetkazish, asosiy sahifalar (faqat tasdiqlangan faktlar).

## 1-bosqich — texnik asos (2–4 hafta, kod)
1. **So'zli URL:** `/atir/hugo-boss-the-scent-edt-100ml`; eski `/catalog/<uuid>` → 301.
2. **Rus tili indekslanadigan:** `/ru/...` sahifalar + `hreflang` (uz/ru). Toshkentda ruscha qidiruv katta, ayniqsa Yandex.
3. **Yangi sahifalar:**
   - brend: `/brend/tom-ford`, `/brend/chanel` ...
   - toifa: ayollar, erkaklar, unisex atirlari
   - "Atirni bo'lib to'lab olish" (Uzum Nasiya) — asosiy savdo so'rovi uchun
4. Schema: `BreadcrumbList`, `Organization` + `LocalBusiness` (manzil, telefon, ish vaqti), `FAQPage`.
5. Sitemap: rasmlar va `lastmod`; Yandex va Bing uchun IndexNow (yangi/o'zgargan atir darhol xabar qilinadi).

## 2-bosqich — kontent (1–3 oy)
1. **Har bir atirga noyob tavsif:** notalar (yuqori/o'rta/pastki), kimga va qachonga, qaysi mavsum, o'xshash atirlar.
   Shablon matn olib tashlanadi. Avval eng ko'p sotiladigan 30 ta, keyin qolgani. Egasi ko'rib tasdiqlaydi.
2. **Savol-javob sahifasi:** bo'lib to'lash qanday ishlaydi, premium klon nima, yetkazish, to'lov usullari —
   faqat tasdiqlangan faktlar (HOLAT.md "Egasi qarorlari").
3. **Qo'llanmalar (uz + ru, haftasiga 1–2):** "Uzum Nasiya bilan atir olish", "Erkaklar uchun 10 ta atir",
   "Baccarat Rouge 540 ga o'xshash atirlar", "Qishki atirlar" va h.k. Har biri katalogga havola beradi.
4. **Haqiqiy sharhlar:** DM orqali sotilgan mijozlardan (38 ta) ruxsat bilan sharh → saytda va schema'da.

## 3-bosqich — AI yordamchilar va obro' (3–6 oy)
AI'lar saytning o'zidan ko'ra **boshqa joylarda do'kon haqida nima yozilganiga** ko'proq tayanadi.
1. Bing Webmaster Tools (ChatGPT qidiruvi Bing indeksidan foydalanadi) — sitemap yuborish.
2. Xarita va kataloglar: Google Business Profile, Yandex Biznes (Yandex Karty), 2GIS — bir xil nom, telefon, manzil.
3. Telegram kanal, Instagram, Uzum Market sahifasida saytga havola va bir xil brend nomi.
4. Mahalliy blog/yangilik saytlari, bloggerlar bilan sharh — havola.
5. Sahifalarda AI iqtibos qila oladigan qisqa aniq javoblar: "Premium atir narxi — 800 000 so'm, 3, 6 yoki 12 oyga bo'lib to'lash".
6. Har oy tekshiruv: ChatGPT/Perplexity/Yandex'da "Toshkentda atirni bo'lib to'lab qayerdan olsa bo'ladi?" — chiqyaptimi.

## Xavf — egasi qaror qilishi kerak
"Tom Ford super klon" kabi mashhur brend nomi bilan nusxa sotish Google va Yandex qoidalarida
(soxta mahsulot / tovar belgisi) muammo bo'lishi mumkin: shikoyat bo'lsa sahifa qidiruvdan olib tashlanishi,
Google Shopping va reklama rad etilishi mumkin. Variant: "... ga o'xshash / ilhomlangan" yozish, original
atirlarni alohida kuchli ko'rsatish. Bu biznes qarori — kodda hech narsa o'zgartirilmaydi, egasi hal qiladi.

## Egasidan kerak
- Google Search Console va Yandex Webmaster'ga kirish (yoki hisobot eksporti) — boshlang'ich raqamlar uchun.
- Bing Webmaster, Google Business Profile, Yandex Biznes ochish (egasi nomidan).
- Do'kon manzili / ish vaqti (LocalBusiness uchun), haqiqiy mijoz sharhlari.
- Klon nomlash bo'yicha qaror.

## O'lchov (boshlang'ich raqam Search Console / Webmaster'dan olinadi)
| Ko'rsatkich | Hozir | 3 oy | 6 oy |
|---|---|---|---|
| Indeksdagi sahifalar | ~220 | 300+ (brend/toifa/ru) | 500+ |
| Qidiruvdan kelgan kunlik tashrif | aniqlanadi | ×2 | ×4 |
| "atir bo'lib to'lash toshkent" | aniqlanadi | top-10 | top-3 |
| Mobil tezlik balli | 24 / 42 | 70+ | 85+ |
| AI javoblarida tilga olinish (10 savoldan) | tekshiriladi | 2+ | 5+ |

## Boshlash tartibi
0-bosqich 1-band (narx xatosi) — birinchi, chunki Google hozir noto'g'ri narx ko'ryapti.
