# ChatPlace savdo tizimi — "+" voronkasi

Oxirgi yangilanish: 2026-09-26. Bot: Instagram @elore_parfumes, botId `01a0cf0f-4962-716b-a290-6dde8241ce2b`.
Kodli so'z — **"+"** (egasi: "nasiya so'zi bo'lmasin, + bo'lsin"). NASIYA oqimlari pauzada.

## 1. Voronka

```
Target / Reels ("Kommentga + qo'ying")
   │
   ├─ izohda "+"  ──► ochiq javob: "Directga yubordim 😊" (3 xil matn)          [izoh qoidasi]
   │                └► DM (1-xabar)                                             [+ asosiy oqim]
   └─ DM'da aynan "+" ──► DM (1-xabar)
                            │  teg: plus-yozdi
                            │
      1-xabar: 800 000 so'm · 12 oyga oyiga 96 000 so'mdan · 0 so'm hozir · kartasiz, SMS 2 daqiqa
               [Erkaklar uchun] [Ayollar uchun] [Barcha atirlar → katalog, teg katalog-bosdi]
                     │                │
                     ▼                ▼
            3 ta erkak atiri   3 ta ayol atiri  (har biri URL tugma → /a/<atir>, teg havola-oldi)
                     │
                     ▼
            Mijoz yozadi → AI agent "Asal" davom ettiradi (atir nomi → aniq havola, narx, bo'lib to'lash)
                     │
                     ▼
            Atir sahifasi → "Bo'lib to'lash" (Uzum Nasiya) yoki to'liq to'lov
                     │
                     ▼
            Mijoz "to'ladim" → Telegram tugmasi + teg tolov-qildim               [To'ladim oqimi]

   Parallel: 1-xabardan 20 soat keyin — agar tolov-qildim tegi YO'Q bo'lsa — bitta yumshoq eslatma
             ("Yoqqan atiringizni tanladingizmi? ... " + [Atirlarni ko'rish]). Faqat bir marta.
```

Nega obuna tekshiruvi olib tashlandi: eski "+" oqimida (obunani tekshirish bilan) 48 kishidan 14 tasi
tugmani bosdi, obuna tekshiruvidan faqat 5 tasi o'tdi, saytga 4 tasi kirdi. Target reklamada har bir
qo'shimcha to'siq mijozni yo'qotadi — endi mijoz birinchi xabardayoq saytga o'ta oladi.

## 2. Avtomatizatsiyalar va qoidalar

| Nima | ID | Holat |
|---|---|---|
| **"+ — asosiy oqim (DM va izoh)"** — DM'da aynan `+`, `++`, `+++` (messageEquals), izohda `+` bor (commentContains), barcha postlar, bir mijozga kuniga 1 marta | `01a0def3-223d-70a4-a7e5-3acbac3ec1a1` | Active |
| **"+ — izohga ochiq javob"** — izohda `+`, barcha postlar, 3 xil javob | `01a0def3-7d25-710a-8470-d8eab42811a8` | Active |
| **"To'ladim — teg va Telegram"** — DM'da "to'ladim", "toladim", "pul tashladim", "to'lov qildim", "оплатил(а)" → Telegram tugmasi + teg `tolov-qildim`, soatiga 1 marta | `01a0def3-a21b-73cf-a674-92d41230c693` | Active |
| **"REELS SHABLON — nusxa oling"** — har yangi video uchun nusxa (3-bo'lim) | `01a0def4-0dc3-7261-9889-c18cd383d6f5` | Paused (qoralama) |
| Eski "Сообщение в Директ или Комментарий" ("+", obuna tekshiruvi bilan) | `01a0cf2e-a052-702f-b287-dc28c6b799ad` | Paused |
| Eski "NASIYA" | `01a0dee6-29d9-721c-a13e-c9f4924486f8` | Paused |
| Eski izoh qoidasi "NASIYA — izohga ochiq javob" | `01a0dee6-53c3-715e-85aa-803b902f0025` | Paused |
| AI topic rule "Nasiya va bo'lib to'lash" — "+" ga moslab qayta yozildi (NASIYA kodli so'z sifatida olib tashlandi) | `01a0dee7-058c-722e-a609-0de8d3ff328e` | Yoqilgan |
| AI topic rule "Aniq atir havolasi" | `01a0decc-9c4f-732b-85bc-f504fddd0039` | O'chirilgan (tegilmadi) |

Hech narsa o'chirib tashlanmagan — eskilari pauzada, kerak bo'lsa qayta yoqiladi.
Eslatma: ChatPlace bitta kalit so'zni ikki faol avtomatizatsiyada ruxsat bermaydi — eski "+" oqimini
qayta yoqishdan oldin yangisini pauzaga qo'ying.

### Tugmalar (1-xabar va keyingilar)

| Tugma | Havola | Teg |
|---|---|---|
| Barcha atirlar | `https://parfumelux.uz/catalog?utm_source=instagram&utm_medium=plus` | katalog-bosdi |
| LV Imagination / Sauvage Elixir / Bleu de Chanel | `/a/lv-imagination`, `/a/dior-sauvage-elixir`, `/a/bleu-de-chanel-parfum` | havola-oldi |
| Amouage Guidance / PDM Delina / Crystal Noir | `/a/amouage-guidance`, `/a/pdm-delina`, `/a/versace-crystal-noir` | havola-oldi |
| Eslatmadagi "Atirlarni ko'rish" | `/catalog?utm_source=instagram&utm_medium=plus-eslatma` | katalog-bosdi |

- Katalog `?gender=` parametrini qo'llamaydi (`src/components/CatalogView.tsx`da filtr yo'q), shuning uchun
  "Erkaklar/Ayollar" tugmalari katalogga emas, DM ichida 3 ta tanlangan atirga olib boradi.
- `/a/...` havolalari jonli tekshirildi (2026-09-26) — hammasi to'g'ri atir sahifasiga tushadi.
  `/a/` yo'nalishi o'z `utm_source=chatplace&utm_medium=bot` belgisini qo'yadi, tugmalardagi bosishlar
  ChatPlace statistikasida (teg va CTR) ko'rinadi.

## 3. Teglar

| Teg | ID | Qachon qo'yiladi |
|---|---|---|
| plus-yozdi | `01a0def2-6820-729f-be30-0fb156c69f27` | "+" oqimi boshlanganda |
| havola-oldi | `01a0def2-6a3e-7267-8957-53ab4e6c708a` | Aniq atir tugmasini bosganda |
| katalog-bosdi | `01a0def2-6c47-70a8-a762-6375f1a762ff` | Katalog tugmasini bosganda |
| tolov-qildim | `01a0def2-6e44-70af-a140-b6cc0ba7d641` | Mijoz "to'ladim" yozganda (avtomatizatsiya) |

AI agent o'zi teg qo'ya olmaydi — shuning uchun "to'ladim" alohida avtomatizatsiya bilan ushlanadi.
Eski teglar (`nasiya`, `nasiya-katalog-bosdi`, `click-link-...`, `start-automation-...`) tarix uchun qoldi.

## 4. AI agent bilan to'qnashuv bo'lmasligi

- Kalit so'z avtomatizatsiyani ishga tushirganda o'sha xabarga avtomatizatsiya javob beradi.
  `automationInactivityPeriod` = 5 daqiqa (yoqilgan) — AI va avtomatizatsiya bir-birining ustiga
  gapirmasligi uchun; o'zgartirilmadi.
- DM'da trigger `messageEquals` (aynan "+"), `messageContains` emas: aks holda "+998..." telefon
  raqami yozgan mijozga ham "+" oqimi qayta yuborilardi.
- Bir mijozga "+" oqimi kuniga 1 marta. Shu kun ichida yana "+" yozsa, AI "Erkaklar uchunmi yoki ayollar
  uchun?" deb javob beradi (global qoidada shunday) — bu to'g'ri davom.
- Instagram qoidasi: izoh orqali kelgan mijozga birinchi DM'dan keyin, mijoz o'zi javob yozmaguncha
  (yoki "Erkaklar/Ayollar uchun" tugmasini bosmaguncha) yangi xabar yuborib bo'lmaydi, 24 soatlik oyna ham
  shundan boshlanadi. Shuning uchun 1-xabarda bosiladigan javob tugmalari bor; 20 soatlik eslatma
  faqat oynasi ochiq mijozlarga yetadi.

## 5. Har yangi Reels uchun shablon — qadamlar

1. Videoni Instagram'ga joylang (caption: `👇 Kommentga "+" qo'ying — havolani Directga yuboramiz.`).
2. ChatPlace → Avtomatizatsiyalar → **"REELS SHABLON — nusxa oling"** → ⋯ → **Nusxa olish**.
3. Nusxani oching va nomini o'zgartiring, masalan `Reels — Dior Sauvage Elixir (27.09)`.
4. 1-xabar matnida `ATIR NOMI` ni videodagi atir nomiga almashtiring.
5. "Atirni ko'rish" tugmasida havolani almashtiring: `https://parfumelux.uz/a/atir-nomi` →
   `https://parfumelux.uz/a/dior-sauvage-elixir` (lotin, kichik harf, defis). Brauzerda ochib tekshiring —
   o'sha atir sahifasi ochilishi kerak. (Almashtirishni unutsangiz ham xato bo'lmaydi — katalog ochiladi.)
6. Trigger → "Izohda so'z bor: +" → **Postlar: faqat yangi video** (shablonda vaqtincha 23-sentabrdagi
   Reels `DdokTVtqyh4` tanlangan — uni olib tashlab, yangisini belgilang).
7. **Yoqing** (Active).
8. Sinov: boshqa akkauntdan yangi videoga "+" yozing. Kutiladi: izohga "Directga yubordim 😊" va DM'da
   o'sha atir. Agar DM'ga **ikkita** xabar kelsa (video oqimi + asosiy "+" oqimi), menga ayting —
   asosiy oqimni shu videodan ajratib sozlaymiz. MCP orqali sinovda videoga bog'langan "+" trigger asosiy
   "+" bilan to'qnashmadi (qabul qilindi), lekin qaysi biri ustun ekani faqat jonli sinovda ko'rinadi.
9. Shablonning o'zini yoqmang — u faqat nusxa olish uchun.

## 6. Story javoblari

`storyReplyRulesEnabled: true`, lekin qoida matni bo'sh — AI story javoblariga umumiy qoidalar bilan
javob beradi (atir nomi so'ralsa aniq havola). MCP'da story qoidasini yozadigan maydon yo'q.
Egasi ilovada qo'yishi mumkin (AI agent → Story javoblari → Qoida):

```
Mijoz story'ga javob yozsa: story'dagi atir haqida so'rayapti deb qabul qil. Atir nomi aniq bo'lsa —
"Ha, bor 😊 [Atir nomi] — 800 000 so'm, bo'lib to'lash mumkin" va https://parfumelux.uz/a/<brend-nom>
havolasi. Aniq bo'lmasa — "Qaysi atir yoqdi? 😊" deb bitta savol ber. Qisqa yoz, "original" dema.
```

## 7. Izohlarga AI javobi — YOQILMAGAN

`answerOnCommentEnabled: false` qoldirildi. Sabab: izoh qoidasini (commentRules) MCP orqali yozib
bo'lmaydi; qoidasiz yoqilsa AI umumiy qoidalar bo'yicha **ochiq izohga** to'lov havolasi yoki karta
ma'lumotini yozib yuborishi mumkin. "+" izohlariga hozir alohida qoida javob beradi — bu yetarli.

Yoqmoqchi bo'lsangiz: ChatPlace ilovasi → AI agent → Izohlar → avval qoida matnini qo'ying, keyin yoqing:

```
Izohda qisqa yoz (1 jumla). Narx so'ralsa faqat: "800 000 so'm, bo'lib to'lash mumkin — Directga yozdim 😊".
Izohda havola, oylik summa, karta, to'lov havolasi va batafsil ma'lumot yozma — hammasi Directda.
"Original" deb yozma. Salbiy izohga xotirjam, qisqa va hurmat bilan javob ber, bahslashma.
```

## 8. Rassilka — faqat g'oya (yaratilmagan)

Rassilka mijozlarga xabar yuborish — egasining alohida ruxsati bilan qilinadi. G'oyalar:
- `plus-yozdi` bor, `havola-oldi` yo'q (7 kun ichida) → "Yangi kelgan 3 ta atir" + katalog tugmasi.
- `havola-oldi` bor, `tolov-qildim` yo'q → atir sahifasidagi "Bo'lib to'lash" qadamlarini eslatish.
- Bayram oldidan (1-oktyabr, 8-mart, 14-fevral) — sovg'a mavzusi.
Instagram faqat oxirgi 24 soat ichida yozgan mijozga xabar yuborishga ruxsat beradi — bu rassilka qamrovini cheklaydi.

## 9. Hozirgi ko'rsatkichlar (2026-09-26)

Eski "+" oqimi (23–25 sentabr, obuna tekshiruvi bilan):

| Qadam | Mijoz |
|---|---|
| Oqimga kirdi | 50 |
| 1-xabarni oldi | 48 |
| "96 000 so'mlik taklif" tugmasini bosdi | 14 (29%) |
| Obuna tekshiruvidan birinchi urinishda o'tmadi | 13 |
| Obunadan o'tib, havola xabarini oldi | 5 |
| Saytga o'tdi (konversiya) | 4 (8%) |

Kunlar: 23.09 — 3, 24.09 — 39, 25.09 — 8, 26.09 — 0. Kompaniya bo'yicha: 50 mijoz, 59 muloqot, 4 faol chat.
NASIYA oqimi: 0 mijoz. Yangi oqim natijasini 3–5 kundan keyin shu jadval bilan solishtiring.

## 10. AI sinovi (ai_agent_test_question, 2026-09-26)

| So'rov | Javob | Baho |
|---|---|---|
| `+` (4 marta) | 3 marta "Salom 😊 Erkaklar uchunmi yoki ayollar uchun...", 1 marta o'zidan "Dior Sauvage'ni bo'lib to'lash..." | Asosan to'g'ri; jonli "+" ni avtomatizatsiya ushlaydi |
| salom | "Erkaklar uchunmi yoki ayollar uchun..." | To'g'ri |
| ayollar uchun | Guidance, Delina, Crystal Noir + aniq havolalar, 800 000 | To'g'ri |
| Chanel Allure bormi | "Ha, bor" + 800 000 + `/a/chanel-allure` (jonli tekshirildi — to'g'ri sahifa) | To'g'ri |
| narxi qancha | "Barcha atirlarimiz 800 000 so'm" | To'g'ri |
| bo'lib to'lash | 3/6/12 oy, "Bo'lib to'lash" tugmasi, bosh sahifa havolasi | To'g'ri |
| viloyatga yetkazasizmi | "BTS orqali... taxminan 3 kunda" | Global qoidadan; HOLAT.md "1–3 kun" yozilmasin deydi — egasi hal qiladi |
| to'ladim | "Rahmat 😊 Chekni Telegramga..." + t.me/Jelyor | To'g'ri |

## 11. Egasi qo'lda qiladi

1. Birinchi Reels uchun shablondan nusxa olish (5-bo'lim) va jonli sinov (ikki DM kelmasligini tekshirish).
2. Story javoblari qoidasini ilovada qo'yish (6-bo'lim) — ixtiyoriy.
3. Global qoidadagi yetkazish muddati ("taxminan 3 kunda") qolishini yoki olib tashlanishini hal qilish.
4. "12 oyga oyiga 96 000 so'mdan" — bu sizning ofertangiz (jami 1 152 000). HOLAT.md'da "oylik summa
   yozilmasin" degan eski qoida bor — qaysi biri amal qilishini tasdiqlang.
5. Rassilka kerak bo'lsa — alohida ruxsat bering (8-bo'lim).
