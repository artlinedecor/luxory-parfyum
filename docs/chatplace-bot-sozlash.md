# ChatPlace AI agent (Asal) — sozlash rejasi

Bot: Instagram @elore_parfumes, botId `01a0cf0f-4962-716b-a290-6dde8241ce2b`. AI agent "published", model "fast".

## Nima aniqlandi (2026-09-26)
- AI agent tashqi API'ni (`/api/public/products`) chaqira olmaydi — ChatPlace'da buning uchun
  sozlama yo'q; `http_request` faqat avtomatizatsiya blokida bor.
- Bilim bazasiga atir + havola yozuvi qo'shib sinaldi: qisqa so'rovlarda ("sauvage bormi",
  "диор саваж") yozuv topilmadi, bir marta "havolasini yubordim" deb havolasiz javob berdi. Ishonchsiz — o'chirildi.
- Yechim: sayt qisqa havolasi `https://parfumelux.uz/a/<atir-nomi>`. Bot havolani nomdan
  o'zi yasaydi, sayt eng mos atirga olib boradi, mos kelmasa katalogga (qo'llanma: `chatplace-ulash.md`).
  Katalogdagi 197 atirdan 196 tasi o'z nomidan yasalgan havola bilan to'g'ri sahifaga tushdi.

## Holat (2026-09-26, jonli)
- PR #14 deploy qilindi, `/a/` havolalar jonli tekshirildi.
- Havola qoidasi AI agentning **global qoidalariga** qo'shildi ("ANIQ ATIR HAVOLASI" bo'limi,
  erkak/ayol misollarida har atirga havola, "jamoadan tekshiraman" taqiqi, dollarda ham 800 000).
  Misoldagi Bvlgari Tygar katalogda yo'q — Dior Sauvage Elixir bilan almashtirildi.
  Qolgan qoidalar (narx, bo'lib to'lash, 650 000, karta, Telegram) o'zgarmadi.
- Topic rule "Aniq atir havolasi" (`01a0decc-9c4f-732b-85bc-f504fddd0039`) sinovda ishga tushmadi —
  o'chirilgan, keraksiz.
- Sinov: "Sauvage bormi?", "диор саваж есть?", "Baccarat qancha?", "Delina bormi", "Creed Aventus bormi",
  "erkaklar uchun" — hammasida aniq havola. Katalogda yo'q atir ("Tobacco Vanille") — bot hali
  "jamoadan aniqlashtiraman" deydi (ChatPlace'ning javobsiz savol xatti-harakati).

## Keyingi
1. Izohlarga javob va tugmalar (quyida).
2. Virale ssenariylari → Veo → har videoga izoh qoidasi.

## Bilim bazasi tozalandi (2026-09-26)
- $ narxli va "original bor" yozuvlari 800 000 so'm / LUX klon javobiga moslandi,
  "Original atirlarning narxi" o'chirildi.
- Bo'lib to'lash summalari (3/6/12 oy) va ruscha рассрочка yozuvlari — egasi: oferta, qoladi.

## Izohlar (komment) va tugmalar
- Hozir: `answerOnCommentEnabled: false`, izoh qoidalari yo'q.
- Reja: har bir reklama videosiga izoh qoidasi — "+", "narx", "qancha", "цена" → izohga qisqa
  ochiq javob ("Directga yubordim 😊") + DM'da shu videodagi atirning `/a/` havolasi va tugma.
- Tugmalar: Instagram DM'da URL tugma avtomatizatsiya xabarida bo'ladi ("Atirni ko'rish",
  "Bo'lib to'lash"). AI agent o'zi faqat tezkor javob tugmalari (`generateButtons`) yasaydi.
- Video joylangandan keyin qilinadi — media ID kerak.
