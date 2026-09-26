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

## Tartib
1. **PR merge + deploy** (egasi "chiqar" deganda) — `/a/` havola jonli bo'ladi.
2. Jonli tekshirish: `https://parfumelux.uz/a/dior-sauvage-elixir` Dior sahifasini ochishi kerak.
3. Topic rule "Aniq atir havolasi" (`01a0decc-9c4f-732b-85bc-f504fddd0039`, hozir **o'chirilgan**)
   matnini quyidagiga almashtirish va yoqish. Keyin `ai_agent_test_question` bilan 10 ta so'rov.
4. Bilim bazasidagi eski yozuvlarni tozalash (quyida "Ziddiyatlar").
5. Izohlarga javob va tugmalar (quyida).
6. Virale ssenariylari → Veo → har videoga izoh qoidasi.

## 3-qadam: topic rule matni (deploydan keyin)

```
ANIQ ATIR HAVOLASI (umumiy qoidalardagi "Ha, bor bizda 😊 Narxi 800 000 so'm" javobidan USTUN).

Qachon: mijoz aniq atir nomini yozsa ("Baccarat bormi?", "диор саваж", "Imagination qancha?"),
yoki sen 3 ta atir tavsiya qilsang.

Havola shakli: https://parfumelux.uz/a/<brend-va-nom>
- lotin harflari, kichik harf, so'zlar orasida defis. Kirillni lotinga o'gir.
- misollar: https://parfumelux.uz/a/dior-sauvage-elixir
            https://parfumelux.uz/a/lv-imagination
            https://parfumelux.uz/a/pdm-delina
            https://parfumelux.uz/a/mfk-baccarat-rouge-540
            https://parfumelux.uz/a/amouage-guidance
- havolaga boshqa hech narsa qo'shma (? belgisi, utm, bo'sh joy yo'q).

Javob shakli:
"Ha, bor 😊 [Atir nomi] — narxi 800 000 so'm. 3, 6 yoki 12 oyga bo'lib to'lash mumkin.

https://parfumelux.uz/a/...

Havolani bosib "Bo'lib to'lash" tugmasini bosing — telefon raqam va SMS-kod bilan 2 daqiqada rasmiylashtiriladi."

3 ta tavsiya berganda har biriga o'z havolasi, oxirida bosh sahifa shart emas.
Havoladan oldin va keyin bo'sh qator. Ombordagi qoldiqni aytma.
```

## Ziddiyatlar — egasi hal qilsin
Bilim bazasidagi eski yozuvlar global qoidalarga zid (bot ularni aytib yuborishi mumkin):
- "Atirlar narxi qancha?" → "50–65$, 240–650$"; "Qaysi atirlar 50–55$ atrofida?";
  "Parfums de Marly … 240$, 310$"; "Original atirlarning narxi" → "600 000–650 000".
- "Original variantlar ham bor" — global qoida: mijoz so'ramasa original/klon mavzusi ochilmaydi.
- Ruscha umumiy "рассрочка" yozuvlari (do'konga aloqasi yo'q).

Global qoidalar `docs/HOLAT.md` "Egasi qarorlari" bilan farq qiladi:
- "Odatda taxminan 3 kunda yetib boradi" (HOLAT: muddat yozilmasin);
- oylik to'lov summalari (96 000, 172 000, 266 667);
- to'liq to'lovga 150 000 chegirma "3 soat amal qiladi".
HOLAT sayt uchunmi yoki bot uchun ham — egasi aytsin.

## Izohlar (komment) va tugmalar
- Hozir: `answerOnCommentEnabled: false`, izoh qoidalari yo'q.
- Reja: har bir reklama videosiga izoh qoidasi — "+", "narx", "qancha", "цена" → izohga qisqa
  ochiq javob ("Directga yubordim 😊") + DM'da shu videodagi atirning `/a/` havolasi va tugma.
- Tugmalar: Instagram DM'da URL tugma avtomatizatsiya xabarida bo'ladi ("Atirni ko'rish",
  "Bo'lib to'lash"). AI agent o'zi faqat tezkor javob tugmalari (`generateButtons`) yasaydi.
- Video joylangandan keyin qilinadi — media ID kerak.
