# ChatPlace API va atir sahifasi — bajarish rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ChatPlace boti aniq atir havolasini yubora olsin, havoladan tushgan mijoz esa birinchi ekrandayoq narx va "Bo'lib to'lash" tugmasini ko'rsin.

**Architecture:** Qidiruv mantiqi sof funksiyalarda (`src/lib/product-search.ts`) — test qilinadi. Ommaviy route (`/api/public/products`) kalit + rate limit bilan faqat shu funksiyalarni chaqiradi. Atir sahifasi `ProductDetailClient` ichida qayta tartiblanadi; "Bo'lib to'lash" mavjud, sinalgan savatcha → `UzumCheckout` yo'lidan foydalanadi (`/cart?pay=uzum`).

**Tech Stack:** Next.js 16 App Router, Supabase (service role, server), vitest, Tailwind.

**Spec:** `docs/superpowers/specs/2026-09-26-sotuvchi-sayt-design.md`

## Global Constraints

- Narx formati: guruhlar uzilmas probel ` ` bilan (`800 000`), `Intl('uz-UZ')` ishlatilmaydi.
- Mijozga va'da matnlari FAQAT saytda bor matnlardan: "Tez yetkazib berish", "Faqat telefon raqam va SMS-kod", "Shartnoma onlayn, 2 daqiqada", omborda yo'q bo'lsa "Buyurtma bilan · 3 kungacha" (egasi tasdiqlagan). "1–3 kun", "Tekshirib olasiz" YOZILMAYDI.
- Oylik summa ko'rsatilmaydi (Uzum tariflari mijoz limitiga bog'liq) — faqat "3 · 6 · 12 oy".
- Bosiladigan element ≥ 44px; 375px kenglikda gorizontal scroll yo'q.
- Ommaviy API faqat `is_available = true` mahsulotlarni qaytaradi.
- Havola: `https://parfumelux.uz/catalog/<id>?utm_source=chatplace&utm_medium=bot`.

---

### Task 1: Narx formati — uzilmas probel

**Files:**
- Modify: `src/lib/utils.ts` (`formatUzs`)
- Test: `src/lib/utils.test.ts` (yangi)

- [ ] **Step 1: Test**
```ts
import { describe, it, expect } from "vitest";
import { formatUzs } from "./utils";

describe("formatUzs", () => {
  it("minglarni uzilmas probel bilan ajratadi", () => {
    expect(formatUzs(800000)).toBe("800 000");
    expect(formatUzs(12772120)).toBe("12 772 120");
  });
  it("kichik son va yaxlitlash", () => {
    expect(formatUzs(950)).toBe("950");
    expect(formatUzs(1234.6)).toBe("1 235");
  });
});
```
- [ ] **Step 2:** `npx vitest run src/lib/utils.test.ts` → FAIL (vergul yoki boshqa ajratgich).
- [ ] **Step 3: Kod**
```ts
export function formatUzs(amount: number): string {
  const n = Math.round(Number(amount) || 0);
  const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return n < 0 ? `−${s}` : s;
}
```
- [ ] **Step 4:** test → PASS; `npx tsc --noEmit`.
- [ ] **Step 5:** commit `fix: narx formati — uzilmas probel, vergul emas`.

### Task 2: Qidiruv mantiqi (sof funksiyalar)

**Files:**
- Create: `src/lib/product-search.ts`
- Test: `src/lib/product-search.test.ts`

**Interfaces — Produces:**
- `normalizeQuery(q: string): string` — kichik harf, kirill→lotin, sinonim almashtirish, belgilarsiz.
- `searchProducts<T extends SearchableProduct>(products: T[], q: string, limit: number): T[]`
- `type SearchableProduct = { id: string; title: string; title_ru?: string | null; brand?: string | null; fragrance_name?: string | null; stock?: number | null }`
- `toPublicItem(p: PublicProductRow, siteUrl: string): PublicItem`
- `buildReply(items: PublicItem[], q: string): string`
- `type PublicProductRow = SearchableProduct & { price_usd: number; product_type: string; volume_ml?: number | null; image_url?: string | null }`
- `type PublicItem = { title; brand; volume_ml; type: "original" | "klon"; price_uzs; price_text; installment_text; in_stock; availability_text; url; image }`

- [ ] **Step 1: Test** — normalizatsiya (`"Шанель Шанс"` → `"chanel chance"`, `"BACCARAT"` → `"baccarat"`, `"баккара"` → `"baccarat"`, `"диор саваж"` → `"dior sauvage"`), reyting (to'liq mos birinchi, omborda borlari oldin, mos kelmaganlar chiqmaydi, `limit` ishlaydi), `toPublicItem` (url'da utm, `price_text` "800 000 so'm", stock 0 → `availability_text` "Buyurtma bilan · 3 kungacha"), `buildReply` bo'sh ro'yxat uchun "katalogda yo'q" matni.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Kod** — translit jadvali (а→a, б→b, … ш→sh, щ→sh, ж→j, х→x/h, ц→ts, ч→ch, ю→yu, я→ya, ё→yo, э→e, ы→i, ь/ъ→''), sinonimlar lug'ati (shanel|chanel, bakkara|baccarat, dior, savaj|sauvage, tom ford, kreed|creed, versache|versace, armani, lui vitton|louis vuitton, kilian, zhadore|jadore, ...). Ball: har so'z uchun — sarlavhada so'z to'liq bor 3, so'z boshi 2, qism 1; hech bo'lmasa bitta so'z mos bo'lishi shart; teng ballda stock>0 oldin.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** commit `feat: ChatPlace uchun atir qidiruvi (kirill, sinonim)`.

### Task 3: Ommaviy route

**Files:**
- Create: `src/app/api/public/products/route.ts`, `src/app/api/public/products/feed/route.ts`, `src/lib/public-api.ts` (kalit tekshiruvi + mahsulotlarni olish)
- Test: `src/lib/public-api.test.ts` (kalit tekshiruvi)

**Interfaces — Consumes:** Task 2 funksiyalari. **Produces:** `checkApiKey(req: Request, expected: string | undefined): boolean` (vaqtga chidamli taqqoslash; `expected` bo'sh bo'lsa har doim false).

- [ ] **Step 1: Test** — to'g'ri kalit true, noto'g'ri/yo'q false, env yo'q → false.
- [ ] **Step 2:** FAIL. **Step 3:** kod: route — `checkApiKey` → 401; `rateLimit("chatplace:"+key, 60, 60_000)` → 429; `q` 1..80 belgi; `limit` 1..10 (standart 5); Supabase `products` `is_available=true`, ustunlar `id,title,title_ru,brand,fragrance_name,price_usd,product_type,volume_ml,image_url,stock` (fragrance ustunlari yo'q bo'lsa asosiy ustunlarga qaytish — `products-query.ts` naqshi); `Cache-Control: no-store`. Feed — hammasi `toPublicItem` bilan.
- [ ] **Step 4:** PASS + tsc.
- [ ] **Step 5:** commit `feat: /api/public/products — ChatPlace uchun ommaviy API`.

### Task 4: ChatPlace qo'llanmasi

**Files:** Create `docs/chatplace-ulash.md` — kalit yaratish (Vercel env `CHATPLACE_API_KEY`), so'rov misoli (`curl`), javob maydonlari, botga ko'rsatma matni ("mijoz atir nomini aytsa, API'ni chaqir va `reply`ni yubor").
- [ ] commit `docs: ChatPlace ulash qo'llanmasi`.

### Task 5: Atir sahifasi — birinchi ekran va pastki panel

**Files:** Modify `src/components/ProductDetailClient.tsx`

- [ ] **Step 1:** Rasm konteyneri mobilda `aspect-[4/5] max-h-[46vh]` + `object-contain` (shisha to'liq, oqarmasin), md dan `aspect-[3/4]`.
- [ ] **Step 2:** Ma'lumot bloki tartibi: brend · nom (mobil `text-3xl`) · chiplar qatori (`Original`/`Premium klon`, hajm) · narx `text-4xl` · Uzum satri ("3 · 6 · 12 oyga bo'lib to'lash" + Uzum logosi) · ishonch chiplari ("Tez yetkazib berish", "Telefon + SMS · 2 daqiqa", stock>0 ? "Omborda bor" : "Buyurtma bilan · 3 kungacha").
- [ ] **Step 3:** Pastki qotirilgan panel (mobil, `fixed bottom-[BottomNav balandligi]`, `env(safe-area-inset-bottom)`): asosiy "Bo'lib to'lash" (Uzum rangi `#6100FF`) → `addItem` (savatda bo'lmasa) + `router.push("/cart?pay=uzum")`; ikkinchi "Karta bilan" → `/cart?pay=card`. Desktop'da shu tugmalar narx ostida oddiy blok. Mavjud "Savatchaga" + sevimli tugmasi ikkinchi darajali qator bo'lib qoladi. `NEXT_PUBLIC_UZUM_ENABLED !== "true"` bo'lsa Uzum tugmasi o'rniga "Buyurtma berish".
- [ ] **Step 4:** Meta: "Bo'lib to'lash" bosilganda `InitiateCheckout`.
- [ ] **Step 5:** tsc + lint; commit `feat: atir sahifasi — narx va bo'lib to'lash birinchi ekranda`.

### Task 6: Savatcha `?pay=` ni qabul qiladi

**Files:** Modify `src/app/cart/page.tsx`
- [ ] `useSearchParams` → `pay=uzum|card`: forma bo'limiga scroll + birinchi bo'sh maydonga fokus; tanlangan to'lov tugmasi oltin halqa bilan ajratiladi; forma to'lganda `pay=uzum` bo'lsa Uzum tugmasi asosiy bo'lib yuqorida turadi.
- [ ] tsc; commit `feat: savatcha to'lov usulini havoladan oladi`.

### Task 7: Tekshiruv
- [ ] `npx vitest run`, `npx tsc --noEmit`, `npx next build`.
- [ ] Lokal serverda 375px: atir sahifasi birinchi ekranida narx + Uzum satri + pastki panel ko'rinadi; "Bo'lib to'lash" → savatcha forma fokusda; `/api/public/products?q=baccarat` kalit bilan 200, kalitsiz 401.
