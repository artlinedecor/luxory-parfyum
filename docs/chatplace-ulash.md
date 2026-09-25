# ChatPlace AI sotuvchisini saytga ulash

Maqsad: mijoz botga atir nomini yozsa ("Baccarat bormi?", "шанель", "диор саваж"),
bot saytdan shu atirni topib, **aniq atir sahifasi havolasini** yuborsin. Mijoz havolani
bosadi va o'sha sahifada "Bo'lib to'lash" orqali rasmiylashtiradi.

## 1. Kalit yaratish (bir marta)

1. Uzun tasodifiy kalit o'ylab toping (kamida 32 belgi), masalan parol generatoridan.
2. Vercel → loyiha → **Settings → Environment Variables** → yangi:
   - Name: `CHATPLACE_API_KEY`
   - Value: shu kalit
   - Environment: Production (va Preview)
3. **Redeploy** qiling — kalit shundan keyin ishlaydi.

Kalitni hech kimga, repoga yoki chatga yozmang. U faqat Vercel va ChatPlace kabinetida turadi.

## 2. ChatPlace'da so'rov bloki

ChatPlace kabinetida bot ssenariysiga **HTTP so'rov** (yoki AI agent uchun "tool / function")
blokini qo'shing:

| Maydon | Qiymat |
|---|---|
| Method | `GET` |
| URL | `https://parfumelux.uz/api/public/products?q={{mijoz_yozgan_atir_nomi}}&limit=3` |
| Header | `X-Api-Key: <sizning kalitingiz>` |

`{{...}}` — ChatPlace'dagi o'zgaruvchi (mijoz xabari yoki AI ajratib olgan atir nomi).

## 3. Javob

```json
{
  "items": [
    {
      "title": "Louis Vuitton Imagination Eau De Parfum 100 ml",
      "brand": null,
      "type": "klon",
      "price_uzs": 800000,
      "price_text": "800 000 so'm",
      "installment_text": "3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya)",
      "in_stock": false,
      "availability_text": "Buyurtma bilan · 3 kungacha",
      "url": "https://parfumelux.uz/catalog/368fa80b-...?utm_source=chatplace&utm_medium=bot",
      "image": "https://..."
    }
  ],
  "reply": "• Louis Vuitton Imagination ... — 800 000 so'm (Buyurtma bilan · 3 kungacha)\nhttps://parfumelux.uz/catalog/...\n\n3, 6 yoki 12 oyga bo'lib to'lash mumkin — havolani bosing, 2 daqiqada rasmiylashtiriladi."
}
```

- Eng oddiy yo'l: botga **`reply` maydonini mijozga yuborish**ni buyuring — matn tayyor.
- Topilmasa `items` bo'sh bo'ladi, `reply` esa o'xshashini taklif qiladi.
- Kirill, lotin va talaffuz bilan yozilgan nomlar tushuniladi ("шанель" → Chanel, "баккара" → Baccarat).

## 4. AI botga ko'rsatma (prompt'ga qo'shing)

> Mijoz biror atir haqida so'rasa yoki atir nomini aytsa, avval `products` so'rovini chaqir.
> Natijadagi `reply` matnini mijozga yubor. O'zingdan narx yoki havola to'qib chiqarma —
> faqat API qaytargan ma'lumotni ishlat. Mijoz rozi bo'lsa, havolani bosib "Bo'lib to'lash"
> tugmasini bosishini ayt: telefon raqam va SMS-kod bilan 2 daqiqada rasmiylashtiriladi.

## 5. Butun katalog (bilim bazasi uchun)

`GET https://parfumelux.uz/api/public/products/feed` — shu kalit bilan. Barcha atirlar
(nomi, narxi, bor/yo'qligi, havolasi) bitta JSON'da. ChatPlace bilim bazasiga yuklash yoki
vaqti-vaqti bilan yangilash uchun.

## Xatolar

| Kod | Ma'nosi |
|---|---|
| 401 | Kalit noto'g'ri yoki `X-Api-Key` sarlavhasi yo'q |
| 400 | `q` bo'sh |
| 429 | Daqiqasiga 60 tadan ko'p so'rov |
| 500 | Katalogni o'qib bo'lmadi — keyinroq qayta urinish |

## Tekshirish

```bash
curl -H "X-Api-Key: <kalit>" "https://parfumelux.uz/api/public/products?q=baccarat&limit=3"
```

Havoladagi `utm_source=chatplace` — botdan kelgan mijozlarni keyinchalik alohida sanash uchun.
