---
name: seo-texnik
description: parfumelux.uz texnik SEO - sitemap, robots, canonical, hreflang, JSON-LD (Product, BreadcrumbList, FAQPage, CollectionPage), build, indekslash, Search Console, noindex. Ishlatish uchun so'zlar - seo, sitemap, JSON-LD, indekslash, canonical, hreflang, build, texnik seo.
---

# Texnik SEO (parfumelux.uz)

## Boshlashdan oldin
- `AGENTS.md` o'qing: bu Next.js 16, API'lar farq qiladi. Tegishli qo'llanma: `node_modules/next/dist/docs/01-app/` (metadata: `03-api-reference/04-functions/generate-metadata.md`, sitemap: `generate-sitemaps.md`). `params` - Promise (`await params`).
- JSX tahrirdan keyin o'zgargan joyni O'QIB chiqing (ochilish tegi yopilganini tekshiring) - tegni `<main` ichiga qo'yish production'ni 11 soat yiqitgan.

## Tekshiruv ro'yxati
1. Sahifa: `generateMetadata` -> title (<= 60), description (<= 160), `alternates.canonical` (https://parfumelux.uz, www'siz), openGraph.
2. Bitta H1. Ichki havolalar: bosh sahifa <-> toifa <-> brend <-> atir (`SeoLinks`, `SeoLanding`, `ProductSeoBlock`).
3. JSON-LD (`src/lib/seo.ts`, `src/lib/seo-landing.ts`): atir - `Product` + `BreadcrumbList`; toifa/brend - `CollectionPage`+`ItemList`, `BreadcrumbList`, `FAQPage` (sahifada ko'rinadigan FAQ bilan bir xil matn). Narx faqat `priceOfProductUzs` manbasidan, UZS.
4. Sitemap: `src/app/sitemap.ts` - yangi indekslanadigan yo'l qo'shing; noindex sahifa sitemapda bo'lmasin (yashirin atirlar, 1 atirli brendlar).
5. Ruscha sahifa bo'lsa hreflang ikki tomonli (`uz-UZ`, `ru-RU`, `x-default`).
6. `public/llms.txt` ga muhim yangi sahifa havolasini qo'shing.
7. Yo'qlar: `/dashboard`, `/api`, `/cart`, `/login`, `/tolov` robots'da yopiq - ochmang.

## Build va tekshiruv
```bash
npm ci
npx tsc --noEmit
npm test            # vitest
npm run lint        # eskidan ko'p xato bor; faqat o'zgargan fayllarni tozalang: npx eslint <fayllar>
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=x npm run build
```
Build o'tmasa push qilmang. `--no-verify` ishlatmang.

## Taqiqlar
Narx, kontakt, to'lov fayllari, `layout.tsx` verification metategi - tegmang. Soxta ma'lumot, sharh, reyting (AggregateRating) yozmang. main'ga push va merge yo'q - faqat branch + PR.

## Egasi qiladigan ishlar (PR'ga yozing)
Deploydan keyin: Search Console -> Sitemaps -> `sitemap.xml` qayta yuborish; yangi URL'larni "Request indexing" ga kiritish.
