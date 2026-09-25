# Sotuvchi sayt — dizayn (2026-09-26)

## Maqsad

Sayt hozir sotmayapti: 39 ta sotuvdan 1 tasi saytdan (Uzum Nasiya), 38 tasi DM orqali qo'lda.
Egasi belgilagan sotuv yo'li:

**Target reklama → ChatPlace AI sotuvchi → mijozga aniq atir havolasi → saytda bo'lib to'lash (Uzum Nasiya) → buyurtma.**

Mijoz saytga allaqachon qiziqib, bot bilan gaplashib keladi. Saytning vazifasi — ishonchni
yo'qotmaslik, chalg'itmaslik va 1–2 daqiqada Uzum Nasiya rasmiylashtiruviga olib borish.

## Hozirgi holatdagi yo'qotishlar (telefon, 375px, jonli sayt)

1. Atir sahifasida birinchi ekranni oqarib ketgan rasm egallaydi — nom va narx ko'rinmaydi.
2. Atir sahifasida bo'lib to'lash haqida hech narsa yo'q: oylik to'lov ham, tugma ham. Faqat "Savatchaga".
3. Narx "800,000" (vergul) — o'zbekcha "800 000" bo'lishi kerak.
4. Ishonch belgilari yo'q: yetkazish muddati, kafolat, "klon" nimaligi.
5. Katalogda mahsulotlardan oldin yarim ekran sarlavha; rasmlar sekin chiqadi.

## Qismlar va tartib

Har bir qism alohida reja → amalga oshirish → tekshiruv sikli bilan qilinadi.

| # | Qism | Holat |
|---|---|---|
| 1 | ChatPlace API — bot aniq atir havolasini yuboradi | shu hujjatda to'liq |
| 2 | Atir sahifasi — havoladan tushadigan ekran | shu hujjatda to'liq |
| 3 | Bo'lib to'lash oqimi — Uzum Nasiya | yo'nalish; alohida dizayn |
| 4 | Katalog va bosh sahifa | yo'nalish; alohida dizayn |
| 5 | Yengillik — tezlik o'lchovi | har qism oxirida o'lchanadi |

## Vizual yo'nalish (barcha qismlar uchun)

- **Mobil birinchi.** Trafik Instagram/Telegram ichidagi brauzerdan keladi — 375px asosiy o'lcham.
- Mavjud brend saqlanadi: krem fon, oltin aksent, serif sarlavha. "Hashamat" tuyg'usi qoladi,
  lekin bezak sotuvga xalaqit bermaydi: har ekranda **bitta** asosiy harakat.
- Narxlar uzilmas probel bilan (`800 000 so'm`), `tabular-nums`.
- Bosiladigan har element ≥ 44px. Asosiy tugma pastda qotirilgan (sticky), bosh barmoq yetadigan joyda.
- Rasm oqartiruvchi gradient olib tashlanadi — atir shishasi tiniq ko'rinsin.

---

## 1-qism: ChatPlace API

### Vazifa
Mijoz botga "Baccarat bormi?", "sauvage", "Шанель шанс" deb yozadi. Bot saytdan mos atirlarni
so'raydi va **aniq atir sahifasi havolasini** yuboradi.

### Endpoint
`GET /api/public/products?q=<matn>&limit=5`

- **Kalit:** `X-Api-Key` sarlavhasi = `CHATPLACE_API_KEY` (Vercel env). Kalitsiz → 401.
  Ma'lumot ommaviy bo'lsa ham, kalit so'rovlarni cheklash va manbani bilish uchun kerak.
- **Rate limit:** mavjud `rate-limit.ts` bilan, kalit bo'yicha daqiqasiga 60 ta.
- **Qidiruv:** nom, brend, ruscha nom bo'yicha; kirill → lotin transliteratsiya; eng mashhur
  brendlar uchun sinonimlar ("шанель/shanel → chanel", "баккара → baccarat", "диор → dior",
  "том форд → tom ford" va h.k.). Faqat saytda ko'rinadigan (yashirilmagan) mahsulotlar.
  Tartib: to'liq mos → so'z boshidan mos → qism mos; omborda borlari oldin.
- **Javob:**
  ```json
  {
    "items": [{
      "title": "Bois Impérial",
      "brand": "Essential Parfums",
      "volume_ml": 100,
      "type": "klon",
      "price_uzs": 800000,
      "price_text": "800 000 so'm",
      "installment_text": "3, 6 yoki 12 oyga bo'lib to'lash",
      "in_stock": true,
      "delivery_text": "1–3 kun",
      "url": "https://parfumelux.uz/catalog/<id>?utm_source=chatplace&utm_medium=bot",
      "image": "https://..."
    }],
    "reply": "Tayyor matn: bot shuni to'g'ridan-to'g'ri yuborishi mumkin"
  }
  ```
  Topilmasa: `items: []` va `reply` — "Bu atir hozir katalogda yo'q, o'xshashlarini tavsiya qilaylikmi?"
- **Havolada `utm_source=chatplace`** — bot orqali kelgan sotuvlarni dashboard'da ajratib
  ko'rish imkoni (keyingi qadam, bu qismga kirmaydi).
- `GET /api/public/products/feed` — butun katalog bitta JSON'da (AI bilim bazasi uchun), shu kalit bilan.

### ChatPlace tomoni
Kabinetda "HTTP so'rov" / AI tool bloki shu endpoint'ga ulanadi. Bu egasi tomonidan qilinadi;
men `docs/chatplace-ulash.md` qo'llanma va tayyor so'rov misolini beraman.

### Testlar
Qidiruv normalizatsiyasi (kirill, sinonim, katta-kichik harf), kalitsiz 401, bo'sh natija matni,
yashirin mahsulot chiqmasligi — vitest.

---

## 2-qism: Atir sahifasi

### Birinchi ekran (375×812, aylantirmasdan)
1. Rasm — balandligi ekranning ~45%, oqartiruvchi gradientsiz.
2. Brend (kichik) · **Nomi** (serif) · hajm va turi chipi: `Original` / `Premium klon`.
3. **Narx** eng katta element: `800 000 so'm`.
4. Bo'lib to'lash satri: `3 · 6 · 12 oyga bo'lib to'lash — Uzum Nasiya` (logotip bilan).
   Aniq oylik summa faqat Uzum tariflaridan ishonchli hisoblansa ko'rsatiladi (reja bosqichida
   `uzumnasiya.ts` tekshiriladi); aks holda muddatlar bilan cheklanamiz — noto'g'ri raqam ko'rsatilmaydi.
5. Ishonch chiplari (bir qatorda): `1–3 kunda yetkazish` · `Tekshirib olasiz` · `Omborda bor`.

### Pastki qotirilgan panel (sticky)
- Asosiy tugma: **"Bo'lib to'lash"** (brend rangi) → to'g'ridan-to'g'ri Uzum Nasiya oynasi,
  savatchaga o'tmasdan (bitta atir bilan).
- Ikkinchi tugma: **"Karta bilan"** (Click) — kichikroq, ghost uslubida.
- "Savatchaga" — panel ustida matnli havola bo'lib qoladi (bir nechta atir olganlar uchun).
- Omborda yo'q bo'lsa: tugmalar ishlaydi, chipda `Buyurtma bilan · 3 kungacha` (egasi: omborda
  yo'q atir ham sotiladi, mijoz 3 kungacha kutadi).

### Pastda (aylantirganda)
- Tavsif, hid piramidasi (mavjud `FragrancePyramid`), yetkazib berish.
- "Klon nima?" — 2 jumlali tushuntirish (faqat klon mahsulotlarda).
- Savol bo'lsa — Telegram tugmasi (kichik, ikkinchi darajali).

### O'lchov
- Narx, bo'lib to'lash va asosiy tugma 375px'da aylantirmasdan ko'rinadi.
- Havola → Uzum Nasiya oynasi: 1 bosish.
- Sahifa LCP < 2,5 s (4G, telefon).

---

## 3-qism (yo'nalish): Bo'lib to'lash oqimi
Mavjud `UzumCheckout` (telefon → tariflar → yo'naltirish) qadamlari soni va matnlari qisqartiriladi,
xato va kutish holatlari tushunarli qilinadi. Alohida dizayn hujjati bilan.

## 4-qism (yo'nalish): Katalog va bosh sahifa
Katalogda mahsulotlar birinchi ekrandan boshlanadi; kartochkada narx va "bo'lib to'lash" belgisi.
Bosh sahifa botsiz kelganlar uchun — qidiruv va mashhur atirlar birinchi ekranda.

## Doiradan tashqari
- Dashboard'da ChatPlace konversiya hisoboti (utm bo'yicha) — keyingi vazifa.
- ChatPlace kabinetidagi sozlash — egasi qiladi.
- Yangi to'lov usullari.
