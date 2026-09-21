# Kassa/Hisobot NaN Xatosi va SEO Bot Build Buzilishi — Tuzatish Rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard'dagi "Jami Savdo" ko'rsatkichini `NaN` qilib qo'yayotgan sonli xatoni tuzatish, buyurtma yaratishda dollar/so'm aralashib ketishining oldini olish, SEO botning JSX xatosini bartaraf etish, va **to'lov/buyurtma qabul qilish oqimi kelajakda hech qachon buzilmasligi uchun himoya qatlami qurish**.

**Architecture:** Uchta bog'liq muammo bitta rejada. Buyurtma narxini hisoblovchi mantiq hozir 3 ta faylda alohida-alohida, bir xil xato bilan takrorlangan — buni bitta umumiy `src/lib/accounting.ts` moduliga ko'chiramiz (DRY). SEO bot muammosi — kod xatosi emas, tashqi avtomatlashtirish xizmatining takroriy nosozligi. Buning ustiga, **CI himoya qatlami** (GitHub Actions) va **to'lov oqimi smoke-test** qo'shiladi — bular kelajakda har qanday buzuvchi commit (bot yoki inson tomonidan) darhol, ko'rinadigan tarzda aniqlanishini ta'minlaydi, va to'lov endpoint'lari ishlab turganini har bir deploy'dan keyin avtomatik tasdiqlaydi.

**Tech Stack:** Next.js 16.2.6 (App Router), TypeScript, Vitest, Supabase (Postgres, `service_role` kaliti orqali), Vercel (GitHub orqali avtomatik deploy), GitHub Actions.

**Spec:** Ushbu hujjatning o'zi — alohida spec fayli yo'q. Butun kontekst pastdagi "Kontekst va tashxis" bo'limida.

## Global Constraints

- Loyiha papkasi: `E:\IT loihalar\Lux atir` (yoki uning worktree nusxasi). AGENTS.md: bu Next.js 16 — kod yozishdan oldin `node_modules/next/dist/docs/` dagi tegishli qo'llanmani o'qing.
- Har bir vazifadan keyin: `npx tsc --noEmit` → 0 xato, `npx vitest run` → hammasi PASS, `npm run build` → muvaffaqiyatli. Uchalasi ham o'tmaguncha commit qilinmaydi.
- ⚠️ **TO'LOV VA BUYURTMA QABUL QILISH OQIMI HECH QACHON BUZILMASLIGI SHART.** Bu quyidagilarni o'z ichiga oladi: `/api/click/prepare`, `/api/click/complete`, `/api/uzumnasiya/*`, `/api/orders/create`, `/api/dashboard/orders`, va ularning ishlashi uchun kerak bo'lgan `src/lib/pricing-server.ts`, `src/lib/click-merchant.ts`, `src/lib/uzumnasiya.ts`, `src/lib/uzum-order-sync.ts`. Ushbu rejadagi HECH BIR vazifa bu fayllarga tegmaydi — faqat hisobot/dashboard ko'rsatish qatlamiga tegadi. Shunga qaramay, 6 va 7-vazifalar aynan shu oqim kelajakda tasodifan (masalan SEO bot yoki boshqa avtomatik o'zgarish orqali) buzilib qolmasligi uchun **doimiy himoya** qo'shadi — bu vazifalarni o'tkazib yubormang.
- Kod izohlari — o'zbek tilida, loyihaning mavjud uslubiga mos (qisqa, "nega" ni tushuntiradigan, "nima"ni emas).
- Barcha pul summalari **SO'M** (UZS) da hisoblanadi va ko'rsatiladi. Dollar (`price_at_purchase`) faqat eski buyurtmalar uchun zaxira sifatida, hech qachon to'g'ridan-to'g'ri ekranga chiqarilmaydi.
- Git push to'g'ridan-to'g'ri `main` branchga qilinadi (bu loyihada PR jarayoni yo'q — oldingi sessiyalarda shunday ishlangan). Push'dan keyin GitHub Deployments API orqali (pastda ko'rsatilgan usul bilan) deploy holatini albatta tekshiring.

---

## Kontekst va tashxis (fon ma'lumoti — kodni o'zgartirishdan oldin o'qing)

Bu loyiha — parfumelux.uz, atir sotadigan onlayn do'kon. Admin panelida (`/dashboard`) uchta sahifa savdo/daromad statistikasini ko'rsatadi: bosh sahifa, `accounting`, `cashflow`.

**2026-09-18** kuni Uzum Nasiya orqali birinchi marta haqiqiy buyurtma keldi (mijoz: Nozima, 800 000 so'm). Bu buyurtma **yangi** narx tizimi orqali yaratilgan (`src/lib/pricing-server.ts`, `computeOrderTotal()`), uning mahsulot qatorida faqat `price_uzs: 800000` bor, **`price_at_purchase` maydoni yo'q**.

Buyurtma "Yetkazildi" deb belgilangach, dashboard'dagi "Jami Savdo" ko'rsatkichi **`NaN`** bo'lib qoldi. Sabab — `item.price_at_purchase * item.quantity` hisoblanadi, `undefined * 1 = NaN` bo'ladi, va bitta NaN butun yig'indini abadiy buzadi (`5 + NaN + 10 = NaN`).

Bu bitta joyda emas — **uchta faylda aynan bir xil xato takrorlangan**:

| Fayl | Qator | O'zgaruvchi |
|---|---|---|
| `src/app/dashboard/page.tsx` | ~75 | `totalSoldRevenue` |
| `src/app/dashboard/page.tsx` | ~116 | `totalAmount` (har bir buyurtma uchun, "So'nggi buyurtmalar" ro'yxatida) |
| `src/app/dashboard/accounting/page.tsx` | ~115 | `totalSoldRevenue` |
| `src/app/dashboard/cashflow/page.tsx` | ~54 | `totalSalesRevenue` |

Bundan tashqari, **ikkinchi, alohida xato** bor: 2026-09-10 kuni qo'shilgan "tezkor va erkin qo'lda buyurtma kiritish" funksiyasi (`src/app/api/dashboard/orders/route.ts`, `action === "create"`) buyurtma summasini **dollarda** hisoblab, uni **so'm ustuniga** yozadi:

```ts
// src/app/api/dashboard/orders/route.ts:159-171 (hozirgi, BUZUQ holat)
const totalDollars = lines.reduce((acc, l) => acc + l.price_at_purchase * l.quantity, 0);
const totalUzs = lines.reduce((acc, l) => acc + l.price_uzs * l.quantity, 0);
...
total_amount: totalDollars,   // ← XATO: bu yerda totalUzs bo'lishi kerak
```

Xuddi shu xato pastroqda (`:180`) `transactions` jadvaliga yozishda ham bor. Natijada `transactions` jadvalida kichik, ma'nosiz raqamlar bor (masalan `49`, `52`, `46`) — bular aslida $49, $52 degani, lekin so'm sifatida saqlangan.

**Tekshirilgan (2026-09-21, jonli baza, service_role kaliti bilan):**

```
Yetkazilgan buyurtmalar: 39
  ❌ NaN qiluvchi: Nozima buyurtmasi (2299ea1a) | item price_uzs=800000, price_at_purchase yo'q
Yakuniy totalSalesRevenue: NaN
```

**Uchinchi, bog'liq bo'lmagan muammo:** bu loyihada tashqi "AI Smart SEO Agent" (uzumbot.uz domenida, GPT-4 asosida, har 6 soatda ishlaydi — `SEO_KOMANDA_QOIDALARI.md` faylida hujjatlashtirilgan) avtomatik ravishda `src/app/page.tsx` ga sintaksis jihatidan BUZUQ kod qo'shib qo'yadi (JSX ichiga noto'g'ri joylashtirilgan `<h1>` tegi). Bu **kamida ikki marta** sodir bo'lgan (`fbcb008` 11-sentabr, `0fde447` 21-sentabr) va har safar **butun saytning Vercel'ga deploy bo'lishini butunlay to'xtatadi** (TypeScript/JSX parse xatosi bilan build yiqiladi).

⚠️ **Muhim xavfsizlik eslatmasi:** hozirgacha bot faqat `src/app/page.tsx` ga tegib, build'ni buzgan — bu **to'lov kodiga bevosita tegmagan**, va Vercel buzuq build'ni **hech qachon jonli saytga chiqarmaydi** (deploy "failure" bo'lib qoladi, oldingi ISHLAYDIGAN versiya saytda qolaveradi). Ya'ni hozirgacha to'lov tizimi **hech qachon jonli saytda buzilmagan**. Lekin ikkita real xavf bor: (1) bot kelajakda BOSHQA faylga tegishi mumkin — uning "qamrovi" kod darajasida cheklanmagan, faqat hujjatda yozilgan qoidalar bilan cheklangan; (2) build doimiy buzilib turishi kelajakdagi **haqiqiy** to'lov tuzatishlarini ham deploy qila olmay qolish xavfini tug'diradi. Shuning uchun 6 va 7-vazifalar qo'shildi.

---

## 0-vazifa: Repo holatini sinxronlash (har doim birinchi bajariladi)

Yangi sessiya eski checkout'dan boshlanishi mumkin. Bu vazifa har doim — hatto boshqa hech narsa o'zgarmagan bo'lsa ham — birinchi bajarilishi kerak.

**Fayllar:** Yo'q (faqat git holatini tekshirish)

- [ ] **1-qadam: Joriy holatni tekshirish**

```bash
git status --short
```

Agar bo'sh bo'lmasa — saqlanmagan o'zgarishlar bor, davom etishdan oldin ularni ko'rib chiqing (bu reja ular bilan ziddiyatga kirishi mumkin).

- [ ] **2-qadam: `origin/main` bilan solishtirish**

```bash
git fetch origin main
git log --oneline origin/main..HEAD
git log --oneline HEAD..origin/main
```

Agar birinchi buyruq (`origin/main..HEAD`) natija bersa — sizda push qilinmagan commitlar bor, davom etishdan oldin ularni tushuning.

Agar ikkinchi buyruq (`HEAD..origin/main`) natija bersa — masalan SEO bot yana yangi commit qo'shgan bo'lishi mumkin. Har bir commit'ni tekshiring:

```bash
git log HEAD..origin/main --format="%h %an %s"
```

Agar committer `AI Smart SEO Agent <seo_agent_ai@uzumbot.uz>` bo'lsa — bu bot commit'i, ehtimol yana build'ni buzgan bo'lishi mumkin (pastdagi 1-vazifaga qarang). Har qanday holatda, ushbu commit qaysi fayllarga tegganini tekshiring:

```bash
git diff HEAD..origin/main --stat
```

⚠️ Agar bu ro'yxatda `src/lib/pricing-server.ts`, `src/lib/click-merchant.ts`, `src/lib/uzumnasiya.ts`, `src/lib/uzum-order-sync.ts`, yoki `src/app/api/click/*`, `src/app/api/uzumnasiya/*`, `src/app/api/orders/*` kabi TO'LOV bilan bog'liq fayllar bo'lsa — **darhol to'xtang va loyiha egasiga xabar bering**. Bu holatda bot o'z hujjatlashtirilgan qamrovidan (faqat h1/alt) chiqib ketgan bo'ladi va diqqat bilan qo'lda tekshirish kerak, avtomatik merge qilmang.

- [ ] **3-qadam: Sinxronlash**

Agar branch'ingiz `origin/main`dan sof orqada bo'lsa (o'ziga xos commitlari yo'q) va 2-qadamda xavfli fayllar aniqlanmagan bo'lsa:

```bash
git merge --ff-only origin/main
```

- [ ] **4-qadam: Bog'liqliklarni o'rnatish va muhitni tekshirish**

```bash
npm install
npx tsc --noEmit
```

Agar `.env.local` fayli yo'q bo'lsa — asosiy repo checkout'idan (`E:\IT loihalar\Lux atir\.env.local`, worktree emas) nusxa oling:

```bash
cp "E:/IT loihalar/Lux atir/.env.local" .env.local
```

---

## 1-vazifa: SEO bot buzgan JSX'ni tuzatish (deploy blokeri — birinchi bajariladi)

⚠️ Bu vazifani **har safar** bajaring — hattoki oldingi sessiyada allaqachon tuzatilgan bo'lsa ham. Bot har 6 soatda ishlaydi va bir xil xatoni takrorlashi mumkin. Avval tekshiring, keyin kerak bo'lsagina tuzating.

**Fayllar:**
- Tekshirish/Tuzatish: `src/app/page.tsx`

**Interfaces:** Yo'q (bu sof kod tuzatish, yangi funksiya yo'q)

- [ ] **1-qadam: Joriy deploy holatini GitHub API orqali tekshirish**

```bash
curl -s "https://api.github.com/repos/artlinedecor/luxory-parfyum/deployments?per_page=1" | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',async()=>{
  const j = JSON.parse(s)[0];
  const r = await fetch('https://api.github.com/repos/artlinedecor/luxory-parfyum/deployments/'+j.id+'/statuses');
  const st = await r.json();
  console.log('Oxirgi commit:', j.sha.slice(0,7), '| holat:', st[0] ? st[0].state : 'nomalum');
});
"
```

Agar natija `success` bo'lsa — bu vazifani o'tkazib yuboring, 2-vazifaga o'ting.

Agar `failure` bo'lsa — davom eting.

- [ ] **2-qadam: `src/app/page.tsx` dagi `<main>` tegini tekshirish**

```bash
grep -n "<main" -A 3 src/app/page.tsx
```

Agar natija shunday ko'rinsa (BUZUQ holat — `<main` va uning `className` atributi orasida boshqa JSX elementi bor):

```jsx
<main
<h1 className="sr-only">...(har xil matn, bot har safar boshqacha matn o'ylab topadi)...</h1>
 className="flex-1">
```

...unda tuzating: `<h1>` qatorini olib tashlang, `<main>` ni to'g'ri yoping:

```jsx
<main className="flex-1">
```

Agar `<main className="flex-1">` allaqachon bitta qatorda, to'g'ri bo'lsa — JSX tuzilishi buzilmagan, boshqa sabab bo'lishi mumkin (build logini `vercel inspect <deployment_id> --logs` bilan o'qing, yoki 7-vazifadagi smoke-test skriptini ishga tushiring).

- [ ] **3-qadam: Duplikat H1 yo'qligini tasdiqlash**

```bash
grep -c "<h1" src/app/page.tsx
```

Natija `0` bo'lishi kerak — bu faylda h1 BO'LMASLIGI kerak, chunki `src/components/HeroSection.tsx` da allaqachon sahifaning yagona h1 tegi bor. Agar `1` yoki undan ko'p chiqsa, ularni olib tashlang (HeroSection.tsx dagisiga tegmang — u to'g'ri).

- [ ] **4-qadam: Tekshirish**

```bash
npx tsc --noEmit
npm run build
```

Ikkalasi ham xatosiz o'tishi kerak.

- [ ] **5-qadam: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix(build): SEO bot buzgan JSX/duplikat H1 yana tuzatildi

Bot (uzumbot.uz, GPT-4, har 6 soatda ishlaydi) yana page.tsx ga
sintaksis jihatidan buzuq h1 qo'shgan edi, deploy'ni to'xtatgan.

tsc 0 xato, build muvaffaqiyatli"
```

⚠️ Bu vazifa faqat SIMPTOMNI davolaydi. Bot yana ishga tushadi va yana buzishi mumkin. Uzoq muddatli yechim uchun loyiha egasi bilan gaplashib, botni sozlagan xizmatga murojaat qiling — u faqat matn (`alt`, `h1` matni) o'zgartirishi kerak, JSX struktura elementlariga (`<main>`, `<div>` va h.k.) tegmasligi kerak, yoki uni butunlay o'chirib qo'yish kerak. 6 va 7-vazifalar bu muammoning oqibatlarini kamaytiradi, lekin ildizini yo'q qilmaydi — ildiz botning o'zida.

---

## 2-vazifa: Umumiy hisob-kitob moduli — `src/lib/accounting.ts`

Buyurtma narxini hisoblash mantig'i hozir 3 ta faylda alohida-alohida, bir xil xato bilan takrorlangan. Buni bitta sinaladigan, sof funksiyalar to'plamiga ko'chiramiz.

**Fayllar:**
- Create: `src/lib/accounting.ts`
- Test: `src/lib/accounting.test.ts`

**Interfaces:**
- Produces:
  - `itemPriceUzs(item: OrderItemLike): number` — bitta mahsulot qatorining bir donasining so'mdagi narxi
  - `orderRevenueUzs(order: OrderLike): number` — bitta buyurtmaning jami so'mdagi summasi
  - `totalRevenueUzs(orders: OrderLike[]): number` — bir nechta buyurtmaning jami so'mdagi summasi
  - `type OrderItemLike = { product_id: string; quantity: number; price_at_purchase?: number; price_uzs?: number }`
  - `type OrderLike = { items: OrderItemLike[] | null }`

- [ ] **1-qadam: Muvaffaqiyatsiz testni yozish**

`src/lib/accounting.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { itemPriceUzs, orderRevenueUzs, totalRevenueUzs } from "./accounting";

describe("itemPriceUzs", () => {
  it("price_uzs mavjud bo'lsa — shuni qaytaradi", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_uzs: 800000 })).toBe(800000);
  });

  it("price_uzs yo'q, price_at_purchase (dollar) bor bo'lsa — 12100 ga ko'paytirib qaytaradi", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_at_purchase: 45 })).toBe(45 * 12100);
  });

  it("ikkalasi ham yo'q bo'lsa — 0 qaytaradi, NaN EMAS", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1 })).toBe(0);
  });

  it("price_uzs = 0 bo'lsa, price_at_purchase bo'lsa — dollardan hisoblaydi", () => {
    expect(itemPriceUzs({ product_id: "p1", quantity: 1, price_uzs: 0, price_at_purchase: 45 })).toBe(45 * 12100);
  });
});

describe("orderRevenueUzs", () => {
  it("Uzum Nasiya buyurtmasi (faqat price_uzs, price_at_purchase YO'Q) — to'g'ri hisoblaydi, NaN qaytarmaydi", () => {
    // ⚠️ Bu — Nozimaning haqiqiy buyurtmasi (2299ea1a) aynan shu shaklda edi
    // va eski kod bu yerda NaN qaytarardi.
    const order = {
      items: [
        { product_id: "f4950aea", quantity: 1, price_uzs: 800000 },
      ],
    };
    expect(orderRevenueUzs(order)).toBe(800000);
    expect(Number.isNaN(orderRevenueUzs(order))).toBe(false);
  });

  it("eski (dollar) buyurtma — price_at_purchase dan hisoblaydi", () => {
    const order = {
      items: [
        { product_id: "p1", quantity: 2, price_at_purchase: 45 },
      ],
    };
    expect(orderRevenueUzs(order)).toBe(2 * 45 * 12100);
  });

  it("items null bo'lsa — 0 qaytaradi", () => {
    expect(orderRevenueUzs({ items: null })).toBe(0);
  });

  it("bir nechta qator — yig'indini to'g'ri hisoblaydi", () => {
    const order = {
      items: [
        { product_id: "p1", quantity: 1, price_uzs: 800000 },
        { product_id: "p2", quantity: 2, price_at_purchase: 45 },
      ],
    };
    expect(orderRevenueUzs(order)).toBe(800000 + 2 * 45 * 12100);
  });
});

describe("totalRevenueUzs", () => {
  it("NaN qiluvchi buyurtma boshqalarini buzmasligi kerak", () => {
    // ⚠️ Regressiya testi: eski kodda BITTA NaN butun yig'indini
    // abadiy buzardi (5 + NaN + 10 = NaN). Bu 2026-09-18 da jonli
    // saytda "Jami Savdo" ni NaN qilib qo'ygan haqiqiy xato edi.
    const orders = [
      { items: [{ product_id: "p1", quantity: 1, price_at_purchase: 45 }] },
      { items: [{ product_id: "p2", quantity: 1, price_uzs: 800000 }] }, // Nozima kabi
      { items: [{ product_id: "p3", quantity: 1, price_at_purchase: 50 }] },
    ];
    const total = totalRevenueUzs(orders);
    expect(Number.isNaN(total)).toBe(false);
    expect(total).toBe(45 * 12100 + 800000 + 50 * 12100);
  });

  it("bo'sh ro'yxat uchun 0 qaytaradi", () => {
    expect(totalRevenueUzs([])).toBe(0);
  });
});
```

- [ ] **2-qadam: Test yiqilishini tekshirish**

```bash
npx vitest run src/lib/accounting.test.ts
```

Kutilgan natija: `FAIL` — `Cannot find module './accounting'` xatosi bilan.

- [ ] **3-qadam: Minimal implementatsiyani yozish**

`src/lib/accounting.ts`:

```ts
/**
 * Buyurtma daromadini hisoblash — YAGONA manba.
 *
 * ⚠️ Oldin bu mantiq 3 ta faylda (dashboard/page.tsx,
 * dashboard/accounting/page.tsx, dashboard/cashflow/page.tsx) alohida
 * takrorlangan edi: `item.price_at_purchase * item.quantity`. Yangi
 * (Uzum Nasiya, Click) buyurtmalarda `price_at_purchase` maydoni
 * UMUMAN yo'q — faqat `price_uzs` bor. `undefined * son = NaN`, va
 * bitta NaN butun yig'indini abadiy buzadi. 2026-09-18 da Uzum Nasiya
 * orqali kelgan birinchi buyurtma (800 000 so'm) aynan shu sababli
 * "Jami Savdo" ko'rsatkichini butunlay NaN qilib qo'ygan edi.
 *
 * Bu yerdagi funksiyalar hech qachon NaN qaytarmaydi — narx topilmasa
 * 0 qaytaradi.
 */

const USD_TO_UZS = 12100;

export interface OrderItemLike {
  product_id: string;
  quantity: number;
  /** Eski maydon — DOLLARDA. */
  price_at_purchase?: number;
  /** So'mdagi haqiqiy narx — mavjud bo'lsa shu ustuvor. */
  price_uzs?: number;
}

export interface OrderLike {
  items: OrderItemLike[] | null;
}

/** Bitta mahsulot qatorining BIR DONASINING so'mdagi narxi. */
export function itemPriceUzs(item: OrderItemLike): number {
  if (item.price_uzs != null && item.price_uzs > 0) {
    return item.price_uzs;
  }
  if (item.price_at_purchase != null && item.price_at_purchase > 0) {
    return item.price_at_purchase * USD_TO_UZS;
  }
  return 0;
}

/** Bitta buyurtmaning jami so'mdagi summasi. */
export function orderRevenueUzs(order: OrderLike): number {
  const items = order.items ?? [];
  return items.reduce((sum, item) => sum + itemPriceUzs(item) * item.quantity, 0);
}

/** Bir nechta buyurtmaning jami so'mdagi summasi. */
export function totalRevenueUzs(orders: OrderLike[]): number {
  return orders.reduce((sum, order) => sum + orderRevenueUzs(order), 0);
}
```

- [ ] **4-qadam: Testni o'tishini tekshirish**

```bash
npx vitest run src/lib/accounting.test.ts
```

Kutilgan natija: barcha testlar `PASS`.

- [ ] **5-qadam: Commit**

```bash
git add src/lib/accounting.ts src/lib/accounting.test.ts
git commit -m "feat: umumiy hisob-kitob moduli — NaN qiluvchi xato tuzatildi

3 ta faylda takrorlangan 'item.price_at_purchase * item.quantity'
mantig'i src/lib/accounting.ts ga ko'chirildi. Yangi (Uzum Nasiya,
Click) buyurtmalarda price_at_purchase yo'q — undefined * son = NaN,
bitta NaN butun yig'indini buzardi. 2026-09-18 da jonli saytda
'Jami Savdo' ni shu sabab NaN qilib qo'ygan edi.

11 ta test, jumladan aynan Nozimaning buyurtmasi shaklidagi regressiya
testi."
```

---

## 3-vazifa: Dashboard sahifalarini yangi modulga ulash

**Fayllar:**
- Modify: `src/app/dashboard/cashflow/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/accounting/page.tsx`

**Interfaces:**
- Consumes: `totalRevenueUzs`, `orderRevenueUzs` (2-vazifadan, `@/lib/accounting`)

- [ ] **1-qadam: `cashflow/page.tsx` ni ulash**

Import qo'shing (fayl boshiga, boshqa importlar qatoriga):

```ts
import { totalRevenueUzs } from "@/lib/accounting";
```

`src/app/dashboard/cashflow/page.tsx:47-58` dagi (hozirgi qatorlar biroz siljigan bo'lishi mumkin — `deliveredOrders.forEach` blokini qidiring) buzuq hisoblashni almashtiring:

Eski (o'chiriladi):
```ts
let totalSalesRevenue = 0;
let totalCOGS = 0;
let totalSoldItems = 0;

deliveredOrders.forEach(o => {
  if (o.items && Array.isArray(o.items)) {
    o.items.forEach(item => {
      totalSalesRevenue += item.price_at_purchase * item.quantity;
      totalCOGS += (costPriceMap[item.product_id] || 0) * item.quantity;
      totalSoldItems += item.quantity;
    });
  }
});
```

Yangi:
```ts
// ⚠️ Audit: item.price_at_purchase * item.quantity to'g'ridan-to'g'ri
// ishlatilganda, price_at_purchase yo'q buyurtmalarda (Uzum/Click)
// NaN qaytarardi va butun yig'indini buzardi. Endi accounting.ts
// dagi yagona, NaN'dan himoyalangan hisoblash ishlatiladi.
const totalSalesRevenue = totalRevenueUzs(deliveredOrders);
let totalCOGS = 0;
let totalSoldItems = 0;

deliveredOrders.forEach(o => {
  if (o.items && Array.isArray(o.items)) {
    o.items.forEach(item => {
      totalCOGS += (costPriceMap[item.product_id] || 0) * item.quantity;
      totalSoldItems += item.quantity;
    });
  }
});
```

- [ ] **2-qadam: `dashboard/page.tsx` ni ulash**

Import qo'shing:

```ts
import { totalRevenueUzs, orderRevenueUzs } from "@/lib/accounting";
```

`~75` qator atrofidagi (`totalSoldRevenue` hisoblovchi `deliveredOrders.forEach` bloki) shunga o'xshab tuzatiladi:

Eski:
```ts
let totalSoldRevenue = 0;
let totalSoldCOGS = 0;
let totalSoldItems = 0;
let totalPendingItems = 0;

deliveredOrders.forEach(o => {
  if (o.items && Array.isArray(o.items)) {
    o.items.forEach(item => {
      totalSoldRevenue += item.price_at_purchase * item.quantity;
      totalSoldCOGS += (costPriceMap[item.product_id] || 0) * item.quantity;
      totalSoldItems += item.quantity;
    });
  }
});
```

Yangi:
```ts
const totalSoldRevenue = totalRevenueUzs(deliveredOrders);
let totalSoldCOGS = 0;
let totalSoldItems = 0;
let totalPendingItems = 0;

deliveredOrders.forEach(o => {
  if (o.items && Array.isArray(o.items)) {
    o.items.forEach(item => {
      totalSoldCOGS += (costPriceMap[item.product_id] || 0) * item.quantity;
      totalSoldItems += item.quantity;
    });
  }
});
```

`~116` qator atrofidagi (`recentOrders` map ichida, har bir buyurtmaning `totalAmount`) ham tuzatiladi:

Eski:
```ts
const totalAmount = items.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0);
```

Yangi:
```ts
const totalAmount = orderRevenueUzs({ items });
```

- [ ] **3-qadam: `accounting/page.tsx` ni ulash**

Import qo'shing:

```ts
import { totalRevenueUzs } from "@/lib/accounting";
```

`~115` qator atrofidagi bir xil naqshni xuddi 1-qadamdagidek almashtiring (`totalSoldRevenue` → `totalRevenueUzs(deliveredOrders)`, qolgan COGS/soni hisoblari saqlanadi).

- [ ] **4-qadam: Tekshirish**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

Uchalasi ham xatosiz o'tishi kerak.

- [ ] **5-qadam: Jonli ma'lumot bilan qo'lda tekshirish**

Loyihaning ildizida (worktree emas, agar farq qilsa) `.env.local` da haqiqiy `SUPABASE_SERVICE_ROLE_KEY` bor. Quyidagi skript bilan yangi funksiyani haqiqiy baza ustida sinang (hech narsa yozmaydi, faqat o'qiydi):

```bash
cat > ./.tmp-verify.mjs <<'EOF'
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = Object.fromEntries(
  fs.readFileSync(".env.local","utf8").split(/\r?\n/)
    .filter(l=>l.includes("=")&&!l.startsWith("#"))
    .map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth:{persistSession:false,autoRefreshToken:false} });
const { data: delivered } = await sb.from("orders").select("items").eq("status","delivered");

const USD=12100;
function itemPriceUzs(i){ if(i.price_uzs>0) return i.price_uzs; if(i.price_at_purchase>0) return i.price_at_purchase*USD; return 0; }
let total = 0;
for (const o of delivered) for (const item of (o.items||[])) total += itemPriceUzs(item)*item.quantity;

console.log("Yetkazilgan buyurtmalar:", delivered.length);
console.log("Jami savdo (tuzatilgandan keyin):", total.toLocaleString("uz-UZ"), "so'm");
console.log("NaN emasligi:", !Number.isNaN(total));
EOF
node ./.tmp-verify.mjs
rm -f ./.tmp-verify.mjs
```

Natija: raqam **NaN emas**, aniq son bo'lishi kerak.

- [ ] **6-qadam: Commit**

```bash
git add src/app/dashboard/cashflow/page.tsx src/app/dashboard/page.tsx src/app/dashboard/accounting/page.tsx
git commit -m "fix: dashboard sahifalari NaN'dan himoyalangan hisob-kitobga o'tkazildi

3 ta sahifadagi (bosh, accounting, cashflow) takrorlangan buzuq
hisoblash src/lib/accounting.ts dagi yagona funksiyalarga almashtirildi.

Jonli baza bilan tekshirildi: yetkazilgan buyurtmalar bo'yicha
'Jami Savdo' endi to'g'ri son qaytaradi, NaN emas."
```

---

## 4-vazifa: Qo'lda buyurtma yaratishda dollar/so'm aralashishini tuzatish

**Fayllar:**
- Modify: `src/app/api/dashboard/orders/route.ts`

**Interfaces:** Yo'q (ichki route mantig'i)

- [ ] **1-qadam: `action === "create"` blokidagi xatoni tuzatish**

`src/app/api/dashboard/orders/route.ts` da `if (action === "create")` blokini toping (`totalDollars`/`totalUzs` hisoblangan joy atrofida). Hozirgi (buzuq) holat:

```ts
const totalDollars = lines.reduce((acc, l) => acc + l.price_at_purchase * l.quantity, 0);
const totalUzs = lines.reduce((acc, l) => acc + l.price_uzs * l.quantity, 0);

const orderStatus = status || "pending";
const { data: created, error } = await supabase.from("orders").insert({
  items: lines,
  client_name: client_name.trim(),
  client_phone: client_phone.trim(),
  region: "Qo'lda kiritilgan",
  order_type: "full_payment",
  status: orderStatus,
  payment_status: orderStatus === "delivered" ? "paid" : "unpaid",
  total_amount: totalDollars,
}).select().single();

if (error || !created) throw new Error(`Buyurtma yaratilmadi: ${error?.message}`);

if (orderStatus === "delivered") {
  await shiftStock(supabase, lines, -1);
  const { error: tErr } = await supabase.from("transactions").insert({
    type: "income",
    amount: totalDollars,
    description: `Buyurtma #${created.id.slice(0, 8)} yetkazildi (Qo'lda) - Daromad`,
  });
  if (tErr) throw new Error(`Daromad yozilmadi: ${tErr.message}`);
}
```

Tuzatilgan holat (`total_amount` va `amount` — ikkalasi ham `totalUzs`):

```ts
const totalUzs = lines.reduce((acc, l) => acc + l.price_uzs * l.quantity, 0);

const orderStatus = status || "pending";
const { data: created, error } = await supabase.from("orders").insert({
  items: lines,
  client_name: client_name.trim(),
  client_phone: client_phone.trim(),
  region: "Qo'lda kiritilgan",
  order_type: "full_payment",
  status: orderStatus,
  payment_status: orderStatus === "delivered" ? "paid" : "unpaid",
  // ⚠️ SO'M yozilishi shart — bu ustun butun loyihada SO'M deb
  // ishlatiladi (Click, Uzum Nasiya). Oldin bu yerda totalDollars
  // yozilardi va tranzaksiyalar jadvalida $49, $52 kabi qiymatlar
  // so'm sifatida saqlanib qolgandi.
  total_amount: totalUzs,
}).select().single();

if (error || !created) throw new Error(`Buyurtma yaratilmadi: ${error?.message}`);

if (orderStatus === "delivered") {
  await shiftStock(supabase, lines, -1);
  const { error: tErr } = await supabase.from("transactions").insert({
    type: "income",
    amount: totalUzs,
    description: `Buyurtma #${created.id.slice(0, 8)} yetkazildi (Qo'lda) - Daromad`,
  });
  if (tErr) throw new Error(`Daromad yozilmadi: ${tErr.message}`);
}
```

`totalDollars` o'zgaruvchisi olib tashlandi (endi hech yerda ishlatilmaydi). Agar TypeScript boshqa joyda uni talab qilsa, faqat `totalUzs` qoldiring.

- [ ] **2-qadam: `orderTotalAmount()` yordamchisining zaxira tartibini tuzatish**

Xuddi shu faylda `orderTotalAmount()` funksiyasini toping (fayl boshida, `action === "status"` dan oldin). Hozirgi holat:

```ts
function orderTotalAmount(order: OrderRow): number {
  if (order.total_amount != null && Number(order.total_amount) > 0) {
    return Number(order.total_amount);
  }
  const items = order.items ?? [];
  const sumDollar = items.reduce((s, i) => s + Number(i.price_at_purchase || 0) * Number(i.quantity || 0), 0);
  if (sumDollar > 0) return sumDollar;
  const sumUzs = items.reduce((s, i) => s + Number(i.price_uzs || 0) * Number(i.quantity || 0), 0);
  if (sumUzs > 0) return sumUzs;
  console.warn("[dashboard/orders] summani aniqlab bo'lmadi", { id: order.id });
  return 0;
}
```

Bu funksiyani `src/lib/accounting.ts` dagi `orderRevenueUzs()` bilan almashtiring — ikki funksiya bir xil ishni qiladi, ikkitasini saqlash keraksiz takror:

```ts
import { orderRevenueUzs } from "@/lib/accounting";

function orderTotalAmount(order: OrderRow): number {
  // ⚠️ total_amount ustuniga endi FAQAT so'm yoziladi (4-vazifa,
  // 1-qadam). Shuning uchun uni to'g'ridan-to'g'ri ishonib bo'ladi —
  // lekin ustun bo'sh/0 bo'lgan eski buyurtmalar uchun items dan
  // qayta hisoblash kerak bo'lishi mumkin, shuning uchun accounting.ts
  // dagi yagona, NaN'dan himoyalangan funksiyaga tayanamiz.
  if (order.total_amount != null && Number(order.total_amount) > 0) {
    return Number(order.total_amount);
  }
  return orderRevenueUzs(order);
}
```

- [ ] **3-qadam: Tekshirish**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

- [ ] **4-qadam: Qo'lda sinash — TO'LOV OQIMIGA TA'SIR QILMASLIGINI ham tasdiqlash**

Bu vazifa `dashboard/orders/route.ts` ga tegadi — bu faylning o'zi to'lov oqimiga KIRMAYDI (u faqat admin panel qo'lda buyurtma kiritish uchun), lekin ehtiyot bo'lish uchun ikkalasini ham sinang.

Dev serverni ishga tushiring (`npm run dev`), admin sifatida kiring:

1. **Qo'lda buyurtma** oynasini oching, biror mahsulotni $10 narxda, "Yetkazildi" holati bilan qo'shing. Saqlagach:

```bash
cat > ./.tmp-check.mjs <<'EOF'
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = Object.fromEntries(
  fs.readFileSync(".env.local","utf8").split(/\r?\n/)
    .filter(l=>l.includes("=")&&!l.startsWith("#"))
    .map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth:{persistSession:false,autoRefreshToken:false} });
const { data } = await sb.from("orders").select("total_amount").order("created_at",{ascending:false}).limit(1).single();
console.log("Yangi buyurtma total_amount:", data.total_amount);
console.log("$10 * 12100 = 121000 atrofida bo'lishi kerak, 10 EMAS");
EOF
node ./.tmp-check.mjs
rm -f ./.tmp-check.mjs
```

`total_amount` **121000 atrofida** (so'mda) bo'lishi kerak, **10 emas** (dollarda). Tekshirib bo'lgach, bu sinov buyurtmasini dashboard'dan o'chirib tashlang.

2. **To'lov oqimi buzilmaganini tasdiqlash** — 7-vazifadagi smoke-test skriptini ishga tushiring (agar u vazifa hali bajarilmagan bo'lsa, oddiygina savatga biror mahsulot solib, Click to'lov tugmasi hali ham to'g'ri sahifaga o'tkazayotganini ko'zdan tekshiring):

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://parfumelux.uz/cart
```

`200` bo'lishi kerak.

- [ ] **5-qadam: Commit**

```bash
git add src/app/api/dashboard/orders/route.ts
git commit -m "fix: qo'lda buyurtma yaratishda dollar so'm o'rniga yozilayotgan xato tuzatildi

total_amount va tranzaksiya amount ustunlariga totalDollars o'rniga
totalUzs yozilmoqda edi. Natijada 2026-09-10 dan buyon qo'lda
kiritilgan buyurtmalarning transactions yozuvlarida \$49, \$52 kabi
qiymatlar SO'M sifatida saqlanib qolgan (5-vazifaga qarang).

orderTotalAmount() endi src/lib/accounting.ts dagi orderRevenueUzs()
ga tayanadi — ikki bir xil funksiya saqlanmaydi.

Bu o'zgarish FAQAT admin panelning qo'lda buyurtma kiritish yo'liga
tegadi — Click/Uzum Nasiya to'lov oqimiga tegilmadi, alohida tekshirildi."
```

---

## 5-vazifa: Eski (dollar-mislabeled) tranzaksiyalar — QAROR TALAB QILADI

⚠️ Bu vazifa **avtomatik bajarilmaydi**. 4-vazifa faqat BUNDAN KEYINGI yozuvlarni to'g'irlaydi. 2026-09-10 dan 2026-09-21 gacha yaratilgan "(Qo'lda)" buyurtmalarning `transactions` yozuvlari hali ham noto'g'ri (dollar qiymati so'm sifatida saqlangan) bo'lib qoladi.

**Fayllar:** Yo'q — bu tahlil/qaror vazifasi, kod o'zgarmaydi (loyiha egasi tasdiqlagach, alohida SQL migratsiya yoziladi).

- [ ] **1-qadam: Shubhali yozuvlarni aniqlash**

```bash
cat > ./.tmp-audit.mjs <<'EOF'
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = Object.fromEntries(
  fs.readFileSync(".env.local","utf8").split(/\r?\n/)
    .filter(l=>l.includes("=")&&!l.startsWith("#"))
    .map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth:{persistSession:false,autoRefreshToken:false} });

const { data } = await sb.from("transactions")
  .select("id,amount,description,created_at")
  .eq("type","income")
  .ilike("description","%(Qo'lda)%")
  .order("created_at",{ascending:true});

console.log("Qo'lda kiritilgan daromad yozuvlari:", data.length);
for (const t of data) {
  const looksLikeDollar = Number(t.amount) < 1000;
  console.log(` ${looksLikeDollar ? "⚠️ DOLLAR bo'lishi mumkin" : "✅ so'mga o'xshaydi"}  ${t.created_at.slice(0,10)}  ${t.amount}  ${t.description}`);
}
EOF
node ./.tmp-audit.mjs
rm -f ./.tmp-audit.mjs
```

- [ ] **2-qadam: Natijani loyiha egasiga ko'rsatish va qaror so'rash**

Uch xil variant bor, foydalanuvchi bilan kelishib tanlang:

1. **Hech narsaga tegmaslik** — eski yozuvlar xato holda qoladi.
2. **Qo'lda tuzatish** — `⚠️ DOLLAR bo'lishi mumkin` deb belgilangan har bir yozuvni `amount * 12100` ga ko'paytirish.
3. **O'chirib, qaytadan kiritish** — agar yozuvlar soni kam bo'lsa.

⚠️ Avtomatik ko'paytirishni **faqat loyiha egasi ro'yxatni ko'rib, tasdiqlagandan keyin** bajaring.

- [ ] **3-qadam (faqat loyiha egasi "ha, tuzat" desa): SQL migratsiya yozish**

`migrations/05_fix_dollar_transactions.sql` (loyiha egasi tasdiqlagan aniq ID lar ro'yxati bilan):

```sql
update transactions
set amount = amount * 12100
where id in (
  -- Bu yerga loyiha egasi tasdiqlagan aniq UUID lar qo'yiladi
);
```

---

## 6-vazifa: CI himoya qatlami — buzuq kod jonli saytga yaqinlashmasin

⚠️ **Bu vazifa foydalanuvchining aniq talabi bilan qo'shildi:** "to'lov tizimlarim, zakaz qabul qilishlar yo'qolmasin, buzilmasin, qaytib unday bo'lmasin". Vercel o'zi buzuq build'ni jonli saytga chiqarmaydi (bu allaqachon bir qatlam himoya), lekin GitHub darajasida QO'SHIMCHA, TEZROQ va KO'RINADIGAN signal kerak — har bir commit (jumladan SEO bot commiti) push qilingan zahoti ✅/❌ belgisi bilan tekshirilsin.

**Fayllar:**
- Create: `.github/workflows/ci.yml`

**Interfaces:** Yo'q (bu CI konfiguratsiyasi, kod emas)

- [ ] **1-qadam: Workflow faylini yaratish**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24

      - name: Install dependencies
        run: npm install

      - name: Type check
        run: npx tsc --noEmit

      - name: Unit tests
        run: npx vitest run

      - name: Production build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          ADMIN_SESSION_SECRET: ${{ secrets.ADMIN_SESSION_SECRET }}
          INTERNAL_API_SECRET: ${{ secrets.INTERNAL_API_SECRET }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          NEXT_PUBLIC_CLICK_SERVICE_ID: ${{ secrets.NEXT_PUBLIC_CLICK_SERVICE_ID }}
          NEXT_PUBLIC_CLICK_MERCHANT_ID: ${{ secrets.NEXT_PUBLIC_CLICK_MERCHANT_ID }}
          CLICK_SERVICE_ID: ${{ secrets.CLICK_SERVICE_ID }}
          CLICK_SECRET_KEY: ${{ secrets.CLICK_SECRET_KEY }}
          CLICK_MERCHANT_USER_ID: ${{ secrets.CLICK_MERCHANT_USER_ID }}
          UZUM_PARTNER_TOKEN: ${{ secrets.UZUM_PARTNER_TOKEN }}
          NEXT_PUBLIC_UZUM_ENABLED: ${{ secrets.NEXT_PUBLIC_UZUM_ENABLED }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
          TELEGRAM_WEBHOOK_SECRET: ${{ secrets.TELEGRAM_WEBHOOK_SECRET }}
```

- [ ] **2-qadam: GitHub'da maxfiy kalitlarni sozlash (LOYIHA EGASI BAJARADI — kod orqali bajarib bo'lmaydi)**

Bu qadamni siz o'zingiz GitHub veb-saytida bajarishingiz kerak — men (AI agent) buni kod orqali bajara olmayman, chunki bu GitHub repo sozlamalari, fayl emas:

1. `https://github.com/artlinedecor/luxory-parfyum/settings/secrets/actions` ga o'ting
2. Yuqoridagi workflow faylidagi har bir `${{ secrets.XXX }}` uchun **"New repository secret"** tugmasi bilan qiymat qo'shing (qiymatlarni o'zingizdagi `.env.local` yoki `VERCEL-IMPORT.env` fayllaridan oling)

⚠️ Agar bu qadam bajarilmasa, CI workflow'i `build` bosqichida muhit o'zgaruvchilari yo'qligi sababli muvaffaqiyatsiz bo'lishi mumkin (Supabase URL bo'lmasa build vaqtida sahifalarni yig'ish xatosi beradi — xuddi shu turdagi xato oldingi sessiyada `.env.production.local` bilan tasodifan yuzaga kelgan edi). Bu **CI'ning o'zining** muvaffaqiyatsizligi bo'ladi, jonli Vercel deploy'ga ta'sir qilmaydi — lekin foydasiz signal beradi, shuning uchun kalitlarni to'g'ri sozlash muhim.

- [ ] **3-qadam: Workflow'ni sinash**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: har bir push uchun avtomatik tsc/vitest/build tekshiruvi

To'lov tizimi va boshqa kod SEO bot yoki boshqa avtomatik o'zgarish
orqali tasodifan buzilib qolganda, bu darhol GitHub'ning o'zida
✅/❌ belgisi bilan ko'rinadi — Vercel build logini qidirish shart
emas."
git push origin HEAD:main
```

Push qilgandan keyin `https://github.com/artlinedecor/luxory-parfyum/actions` ga o'ting va workflow ishga tushganini, natijasini ko'ring.

---

## 7-vazifa: To'lov oqimi smoke-test skripti

⚠️ **Bu vazifa ham foydalanuvchining "to'lov tizimlarim... buzilmasin" talabiga javob beradi.** Har qanday deploy'dan keyin (SEO bot, boshqa avtomatik o'zgarish, yoki qo'lda qilingan tuzatish bo'lsin) to'lov endpoint'lari ishlab turganini 30 soniyada, qo'lda tekshirmasdan bilish uchun.

**Fayllar:**
- Create: `scripts/smoke-test-payments.mjs`

**Interfaces:** Yo'q (mustaqil skript, hech narsaga import qilinmaydi)

- [ ] **1-qadam: Skriptni yozish**

`scripts/smoke-test-payments.mjs`:

```js
/**
 * To'lov va buyurtma qabul qilish oqimining ISHLAB TURGANINI
 * tekshiradi — HAQIQIY to'lov qilmaydi, pul harakatlantirmaydi,
 * faqat har bir endpoint KUTILGAN xato/javob shaklini qaytarayotganini
 * tasdiqlaydi (masalan noto'g'ri imzo bilan so'rov yuborilsa,
 * "SIGN CHECK FAILED" qaytishi kerak — 500 yoki HTML xato sahifasi
 * EMAS).
 *
 * Ishlatish:
 *   node scripts/smoke-test-payments.mjs
 *   node scripts/smoke-test-payments.mjs https://boshqa-domen.uz
 */
const BASE = process.argv[2] || "https://parfumelux.uz";
let failed = 0;

async function check(name, fn) {
  try {
    const ok = await fn();
    console.log(`${ok ? "✅" : "❌"} ${name}`);
    if (!ok) failed++;
  } catch (e) {
    console.log(`❌ ${name} — istisno: ${e.message}`);
    failed++;
  }
}

await check("Bosh sahifa ochiladi", async () => {
  const r = await fetch(BASE + "/", { redirect: "manual" });
  return r.status === 200;
});

await check("Savat sahifasi ochiladi", async () => {
  const r = await fetch(BASE + "/cart");
  return r.status === 200;
});

await check("Click /prepare — imzosiz so'rovni to'g'ri rad etadi (JSON, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/click/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "click_trans_id=1&service_id=1&merchant_trans_id=test&amount=1000&action=0&sign_time=x&sign_string=x",
  });
  const j = await r.json().catch(() => null);
  return r.status === 200 && j && Number(j.error) === -1;
});

await check("Click /complete — imzosiz so'rovni to'g'ri rad etadi (JSON, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/click/complete", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "click_trans_id=1&service_id=1&merchant_trans_id=test&merchant_prepare_id=1&amount=1000&action=1&error=0&sign_time=x&sign_string=x",
  });
  const j = await r.json().catch(() => null);
  return r.status === 200 && j && Number(j.error) === -1;
});

await check("Uzum check-status — javob beradi (rate-limit yoki natija, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/uzumnasiya/check-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "998900000000" }),
  });
  return r.status === 200 || r.status === 429;
});

await check("orders/create — noto'g'ri so'rovni to'g'ri rad etadi (400, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/orders/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [], client: {} }),
  });
  return r.status === 400;
});

await check("Admin panel sessiyasiz kirishni rad etadi (307/401, 500 emas)", async () => {
  const r = await fetch(BASE + "/api/dashboard/data", { redirect: "manual" });
  return r.status === 401;
});

console.log(`\n${failed === 0 ? "✅ Hammasi joyida" : `❌ ${failed} ta tekshiruv muvaffaqiyatsiz`}`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **2-qadam: Skriptni jonli saytga qarshi ishga tushirish**

```bash
node scripts/smoke-test-payments.mjs
```

Barcha qatorlar `✅` bo'lishi kerak. Agar biror qator `❌` bo'lsa — bu **haqiqiy, jiddiy muammo**, darhol tekshiring (bu holatda to'lov oqimi haqiqatan buzilgan bo'lishi mumkin).

- [ ] **3-qadam: Commit**

```bash
git add scripts/smoke-test-payments.mjs
git commit -m "tools: to'lov oqimi smoke-test skripti

Har qanday deploy'dan keyin (ayniqsa SEO bot yoki boshqa avtomatik
o'zgarishdan keyin) 'node scripts/smoke-test-payments.mjs' bilan
Click/Uzum/buyurtma/admin endpoint'lari HAQIQIY pul harakatlantirmasdan
tekshiriladi. Har bir deploy'dan keyingi yakuniy tekshiruv qismiga
qo'shildi (pastga qarang)."
```

- [ ] **4-qadam: Har bir kelajakdagi deploy tekshiruviga qo'shib qo'yish**

Bundan buyon, har safar `git push origin HEAD:main` qilib, deploy "success" bo'lganini tasdiqlagandan so'ng, **doim** shuni ham ishga tushiring:

```bash
node scripts/smoke-test-payments.mjs
```

Bu — foydalanuvchi talab qilgan "to'lov tizimlarim... buzilmasin" kafolatining amaliy ko'rinishi: kod o'zgarishi qanchalik kichik yoki katta bo'lishidan qat'i nazar, deploy'dan keyin to'lov oqimi hali ham ishlayotgani 30 soniyada, qo'lda tekshirmasdan tasdiqlanadi.

---

## Bajarilish tartibi

| Vazifa | Nima uchun shu tartibda |
|---|---|
| 0 | Repo holati eskirgan bo'lishi mumkin |
| 1 | Deploy blokeri — busiz keyingi hech narsa jonli saytga chiqmaydi |
| 2 | Umumiy modul — 3-vazifa shunga tayanadi |
| 3 | Dashboard sahifalarini yangi modulga ulash |
| 4 | Yangi buyurtmalar uchun ildiz sababni tuzatish |
| 5 | Eski ma'lumotlar — faqat loyiha egasi tasdiqlagach |
| 6 | CI himoyasi — kelajakdagi buzilishlarni darhol ko'rsatadi |
| 7 | To'lov smoke-test — har bir deploy'dan keyingi yakuniy tekshiruv vositasi |

Har bir vazifadan keyin (0 va 5 dan tashqari — ular kod o'zgartirmaydi):

```bash
npx tsc --noEmit && npx vitest run && npm run build
```

Uchalasi ham o'tmaguncha keyingi vazifaga o'tmang.

## Deploy va yakuniy tekshiruv

Barcha vazifalar (5-vazifadan tashqari, u alohida qaror) commit qilingandan keyin:

```bash
git push origin HEAD:main
```

Deploy holatini tekshiring:

```bash
for i in $(seq 1 15); do
  sleep 10
  st=$(curl -s "https://api.github.com/repos/artlinedecor/luxory-parfyum/deployments?per_page=1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',async()=>{const j=JSON.parse(s)[0];const r=await fetch('https://api.github.com/repos/artlinedecor/luxory-parfyum/deployments/'+j.id+'/statuses');const st=await r.json();console.log(st[0]?st[0].state:'pending');})")
  echo "urinish=$i: $st"
  [ "$st" = "success" ] && break
  [ "$st" = "failure" ] && break
done
```

`failure` chiqsa — `git log --oneline -5` bilan qaysi commit muammoli ekanini aniqlang, kerak bo'lsa 1-vazifani qayta bajaring.

`success` chiqsa:

1. Brauzerda `https://parfumelux.uz/dashboard` ni oching, **"Jami Savdo"** ko'rsatkichi raqam ekanini (NaN emasligini) ko'zdan tekshiring.
2. **MAJBURIY:** `node scripts/smoke-test-payments.mjs` ni ishga tushiring — barcha qatorlar `✅` bo'lishi kerak. Bu — to'lov oqimi buzilmaganining yakuniy tasdig'i.

## Self-review qaydlari

- **Spec qamrovi:** Uch muammo — NaN xatosi (2, 3-vazifa), dollar/so'm aralashishi (4-vazifa), SEO bot JSX buzilishi (1-vazifa) — barchasi vazifalarga taqsimlangan. Eski buzuq ma'lumotlar (5-vazifa) ataylab avtomatlashtirilmagan. Foydalanuvchining "to'lov tizimi buzilmasin" talabi 6 va 7-vazifalar bilan qoplangan — CI signal (6) + har bir deploy'dan keyingi majburiy smoke-test (7).
- **Placeholder yo'q:** Har bir kod bloki to'liq, nusxalab ishlatsa bo'ladigan holda yozilgan.
- **Tip mosligi:** `OrderItemLike`/`OrderLike` (2-vazifa) `src/lib/types.ts` dagi `Order.items` shakli bilan mos (`product_id`, `quantity`, `price_at_purchase?`, `price_uzs?`) — 3 va 4-vazifalarda shu nomlar bilan ishlatiladi. `orderTotalAmount()` (4-vazifa) `orderRevenueUzs()` ni chaqiradi — ikkalasi ham `{ items: ... }` shaklini kutadi, mos keladi. Smoke-test skripti (7-vazifa) 4-vazifada tekshirilgan endpoint nomlari bilan mos.
