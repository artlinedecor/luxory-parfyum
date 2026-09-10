# 🚨 PARFUME LUX (`parfumelux.uz`) — SEO VA ON-PAGE TEXNIK KAMCHILIKLAR HISOBOTI
**Tekshiruv sanasi:** 2026-09-10  
**Tahlilchi:** Antigravity AI SEO Engine (Tier-4 Autonomous Fleet)  
**Holat:** ⚠️ YUQORI DARADAJADAGI XATOLAR (Tuzatish zarur)

---

## 🛑 1. SAYTDA ANIQLANGAN ASOSIY XATOLIKLAR

### ❌ 1. H1 Sarlavhasi UMUMAN YO'Q (0 ta!)
Sayt bosh sahifasi va katalog sahifalarida bitta ham `<h1>` sarlavhasi topilmadi.
> **SEO oqibati:** Google qidiruv algoritmlari uchun sahifaning eng ustuvor mavzu belgisi — bu H1 tegi. Agar H1 bo'lmasa, Googlebot ushbu do'kon atirlar sotadimi yoki qandaydir boshqa xizmat ko'rsatadimi — aniq ajrata olmaydi va yuqori o'rin bermaydi.

---

### ❌ 2. Schema.org (JSON-LD) Mikroformati UMUMAN YO'Q (0 blok!)
Parfume Lux e-commerce (onlayn do'kon) bo'lishiga qaramasdan, saytda quyidagi majburiy mikroformatlar yo'q:
- `@type: OnlineStore` yoki `Store`
- `@type: Product` (har bir atirning rasmi, narxi, brendi, mavjudligi — inStock)
- `@type: AggregateRating` (mijozlar sharhlari va yulduzchalari)
> **SEO oqibati:** Google qidiruv natijalarida atir qidirilganda narx ($ yoki so'm), reyting (⭐⭐⭐⭐⭐) va "Mavjud" degan boyitilgan snippet (rich snippet) chiqmaydi.

---

### ❌ 3. Canonical Havolasi Ko'rsatilmagan (MISSING)
`<link rel="canonical" href="..." />` tegi mavjud emas.
> **SEO oqibati:** Agar foydalanuvchi `https://parfumelux.uz`, `https://www.parfumelux.uz` yoki UTM-metkali havolalar orqali kirsa, Google bularni alohida dublikat sahifa deb hisoblaydi va sayt reytingini pasaytiradi.

---

### ❌ 4. Brend Nomidagi Nomuvofiqlik (Title vs Domen)
Sayt domeni `parfumelux.uz`, lekin Title tegida faqat `Elore Parfume` deb yozilgan:
`<title>Elore Parfume — Toshkentda Original Atirlar va Super Klon Parfyumeriya Do'koni</title>`
> **Tavsiya:** Odamlar ikkala brend bo'yicha ham ("Parfume Lux" va "Elore Parfume") qidirganda topishi uchun Title'da ikkalasini ham uyg'unlashtirish zarur.

---

## 🛠️ 2. DASTURCHI VA WEB-KODER UCHUN ANIQ TUZATISH KODI

### 1-Qadam: `src/app/layout.tsx` yoki `src/app/page.tsx` ichida Metadata va Canonical qo'shish:

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://parfumelux.uz'),
  title: 'Parfume Lux (Elore) — Toshkentda Original Atirlar va Super Klon Parfyumeriya',
  description: 'Toshkentda 100% original va premium super klon atirlar do\'koni. Tom Ford, Chanel, Dior, Creed va boshqa jahon brendlari. 0-0-6 muddatli to\'lov va O\'zbekiston bo\'ylab tez yetkazib berish.',
  keywords: ['original atir toshkent', 'parfume lux', 'elore parfume', 'erkaklar atirlari', 'ayollar parfyumeriyasi', 'dubay atirlari'],
  alternates: {
    canonical: 'https://parfumelux.uz/',
  },
  openGraph: {
    title: 'Parfume Lux — Toshkentda Original Atirlar Do\'koni',
    description: 'Eng sara brend atirlari qulay narxlarda va muddatli to\'lovga.',
    url: 'https://parfumelux.uz',
    siteName: 'Parfume Lux',
    images: [{ url: '/og-parfume.jpg', width: 1200, height: 630 }],
    locale: 'uz_UZ',
    type: 'website',
  },
};
```

---

### 2-Qadam: Bosh Sahifaga Kuchli H1 va Schema.org Qo'shish:

Sahifa boshida (Hero bo'limida):
```html
<h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
  Toshkentda Original Atirlar va Brend Parfyumeriya Do'koni — Parfume Lux
</h1>
```

Va Schema.org JSON-LD bloki (`layout.tsx` yoki `page.tsx` ichiga):
```html
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "name": "Parfume Lux (Elore)",
      "url": "https://parfumelux.uz",
      "logo": "https://parfumelux.uz/logo.png",
      "description": "Toshkentda original brend va sifatli super klon atirlar onlayn do'koni.",
      "telephone": "+998991020200",
      "currenciesAccepted": "UZS",
      "paymentAccepted": "Cash, Credit Card, Payme, Click",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Toshkent",
        "addressCountry": "UZ"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://parfumelux.uz/catalog?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    })
  }}
/>
```

---

### 3-Qadam: Mahsulot Kartochkalariga `Product` Schemasi Qo'yish
Har bir mahsulot sahifasida (yoki dinamik modalda) narx va mavjudlikni Google ko'rishi uchun:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Montblanc Signature 90ml",
  "image": "https://parfumelux.uz/images/montblanc.jpg",
  "description": "Original ayollar atiri, uzoq saqlanuvchi shleyf.",
  "brand": { "@type": "Brand", "name": "Montblanc" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "UZS",
    "price": "850000",
    "availability": "https://schema.org/InStock",
    "url": "https://parfumelux.uz/product/montblanc-signature"
  }
}
```

Ushbu o'zgarishlar kiritilishi bilanoq sayt Google va Yandex natijalarida boyitilgan kartochka (rich card) sifatida ko'rina boshlaydi.
