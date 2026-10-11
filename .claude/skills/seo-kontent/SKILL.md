---
name: seo-kontent
description: parfumelux.uz uchun SEO kontent ishlari - kalit so'z, atir, parfyum, brend, toifa sahifa qo'sh, matn, FAQ, sarlavha, meta, title, description, indekslash, uzbekcha va ruscha qidiruv. Ishlatish uchun so'zlar - seo, kontent, kalit so'z, atir, sahifa qo'sh, kunlik seo, yo'q qatori.
---

# SEO kontent (parfumelux.uz)

Avval o'qing: `AGENTS.md` (Next.js bu yerda boshqacha - `node_modules/next/dist/docs/` dan tegishli qo'llanma),
`docs/seo-kalitlar.md`, `docs/HOLAT.md` ("Egasi qarorlari").

## Kunlik qoida: bir kun - bir qator
1. `docs/seo-kalitlar.md` dan BITTA `yo'q` qatorni tanlang (yuqoridagisi, tijoriy intentli birinchi).
2. Shuni chiqaring: sahifa yoki matn. Boshqa qatorlarga tegmang.
3. Qatorni `bor` ga o'zgartiring (yoki qisman bo'lsa `jarayonda`) va nishon sahifani yozing.
4. Yangi kalit topilsa, jadvalning oxiriga `yo'q` qilib qo'shing (hech qachon 15 qatordan kam qoldirmang).
5. `npm run build` o'tsin, keyin branch + PR (main'ga push yo'q, merge yo'q).

## Sahifa joylari
- Toifalar: `src/lib/seo-landing.ts` -> `CATEGORIES` (slug, nom, title, description, intro, faq, `match`). Sahifa: `src/app/toifa/[slug]/page.tsx`.
- Brendlar: avtomatik (`groupBrands`) -> `/brend/<slug>`; matn shablonlari `brandIntro`, `brandFaq`, `brandTitle`. Kamida `BRAND_MIN_INDEX` (2) atirli brend indekslanadi.
- Atir sahifasi: `src/lib/seo.ts` (`productTitle`, `productMetaDescription`, `productJsonLd`, `productBreadcrumbJsonLd`) va `src/components/SeoLinks.tsx` (`ProductSeoBlock`).
- Ruscha: `src/app/ru/...` (I18nProvider initialLang="ru"). Yangi ruscha sahifa - hreflang juftligi ikki tomonli bo'lsin, sitemap `tillar()` ga qo'shing.

## Matn shabloni (faqat haqiqiy ma'lumot)
- H1: `<Toifa/Brend> atiri - Toshkentda`. Title <= 60, description <= 160 belgi.
- Intro 2 abzats: nima bor + "3, 6 yoki 12 oyga bo'lib to'lash (Uzum Nasiya)" + narx qoidasi.
- FAQ 3-4 savol; javoblar faqat tasdiqlangan va'dalar: "tez yetkazib berish", "800 000 so'm - premium atir", Uzum Nasiya 3/6/12 oy, karta shart emas.
- Atir matni: brend, nom, hajm, notalar, jins - bazada bo'lsa yozing, bo'lmasa o'tkazib yuboring.

## Taqiqlar
- Narx, telefon, karta raqami, to'lov fayllari (`src/config/site.ts` kontakt/to'lov, `src/app/api/click`, `uzumnasiya`, `lib/pricing-server.ts`, `lib/utils.ts` narx funksiyalari) - TEGMANG.
- "klon", "1-3 kun", "tekshirib olasiz", oylik to'lov summasi, chegirma/sovg'a/bepul yetkazish, soxta sharh va reyting - yozmang.
- Ombor qoldig'ini ko'rsatmang. `layout.tsx` dagi `facebook-domain-verification` ga tegmang. `src/app/legal/` yo'lini o'zgartirmang (bo'lsa).
- Dizayn va komponent ko'rinishini o'zgartirmang; mavjud klasslardan foydalaning.
