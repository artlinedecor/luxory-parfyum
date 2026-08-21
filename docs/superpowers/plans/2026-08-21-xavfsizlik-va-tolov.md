# Parfumelux.uz — Xavfsizlik, To'lov va Click QR Implementatsiya Rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jonli saytdagi kritik xavfsizlik teshiklarini yopish, to'lov summasini server tomonda ishonchli hisoblash, imzolangan shartnomalarning yo'qolishini to'xtatish va Click Pass QR to'lovini qo'shish.

**Architecture:** Har bir bosqich mustaqil deploy qilinadigan qadam. 0-bosqich (merge) qolgan hammasini bloklaydi. 1-3 bosqichlar hozir jonli saytda ochiq turgan hujum yo'llarini yopadi — ular ketma-ket, bir kunda chiqarilishi kerak. 4-6 bosqichlar undan keyin. Yangi mantiq ikkita markaziy modulga yig'iladi: `src/lib/admin-session.ts` (kirish nazorati) va `src/lib/pricing-server.ts` (narx — yagona haqiqat manbai).

**Tech Stack:** Next.js 16.2.6 (App Router, `proxy.ts` — Next 16 da `middleware` shunday nomlanadi), TypeScript, Supabase (Postgres), Vitest (yangi qo'shiladi), Web Crypto API (HMAC), Click Merchant API, Uzum Nasiya Partner API v1.0.2

**Spec:** `docs/audit/2026-08-21-audit.md` — har bir vazifa shu hujjatdagi topilma kodiga (X1, P2, D1...) havola qiladi. **Ikkalasini ham o'qing.**

## Global Constraints

- **Next.js 16.2.6.** Kod yozishdan oldin `node_modules/next/dist/docs/` dagi tegishli qo'llanmani o'qing (AGENTS.md talabi). `middleware.ts` YO'Q — `src/proxy.ts`.
- **Proxy autorizatsiya yechimi emas.** Next hujjati (`01-app/01-getting-started/16-proxy.md`): proxy faqat "optimistic check" uchun. Haqiqiy tekshiruv route/page ichida bo'lishi SHART.
- **Node crypto ishlatmang proxy ichida.** Proxy edge runtime'da ishlashi mumkin. HMAC uchun Web Crypto (`globalThis.crypto.subtle`) — u edge va node'da ham bor.
- **Mijoz yuborgan narxga HECH QACHON ishonmang.** Har qanday pul summasi `products` jadvalidan server tomonda qayta hisoblanadi.
- **Foydalanuvchi matni — o'zbekcha.** Xato xabarlari texnik atama va API kalitlari haqida gapirmaydi.
- **Har bir xato holatida keyingi qadam tugmasi bo'lishi SHART.** Namuna: `src/components/UzumPaymentResult.tsx:86-120`.
- **Sirlar kodda bo'lmaydi.** `process.env.X || "default"` shakli taqiqlanadi — env yo'q bo'lsa xato tashlansin.
- **Har bir bosqich oxirida:** `npx tsc --noEmit` → 0 xato, `npm run build` → muvaffaqiyat. Busiz commit qilinmaydi.

## Fayl tuzilishi

**Yangi:**

| Fayl | Vazifasi |
|---|---|
| `src/lib/admin-session.ts` | HMAC imzolangan admin sessiya tokeni — yaratish va tekshirish |
| `src/lib/api-guard.ts` | API route'lar uchun `requireAdmin()` va `requireInternalSecret()` |
| `src/lib/pricing-server.ts` | Narxning yagona server manbai — `products` jadvalidan hisoblaydi |
| `src/lib/rate-limit.ts` | IP bo'yicha oddiy in-memory rate limit |
| `src/lib/alerts.ts` | Muvaffaqiyatsiz to'lov urinishlarini Telegramga yuborish |
| `src/lib/click-qr.ts` | Click Pass / QR API mijozi |
| `src/app/api/click/qr/route.ts` | QR to'lov seansini yaratish |
| `migrations/03_rls_policies.sql` | RLS yoqish + policy'lar |
| `migrations/04_order_status_fix.sql` | CHECK cheklovlarini kod bilan moslashtirish + `uzum_contracts` jadvali |
| `src/lib/*.test.ts` | Vitest testlari |
| `vitest.config.ts` | Test sozlamasi |

**O'chiriladi:** `src/app/api/supabase-proxy/[...path]/` (X9 — hech qayerda ishlatilmaydi)

---

## BAJARILISH HOLATI (2026-08-21)

| Bosqich | Holat | Commit |
|---|---|---|
| 0 — Merge | ✅ Bajarildi | `914b671` |
| 1.1 — Imzolangan sessiya | ✅ Bajarildi | `80f2d41` |
| 1.2 — Route himoyasi | ✅ Bajarildi (rejadan farq bilan) | `80f2d41` |
| 1.3 — Telegram webhook | ✅ Bajarildi | `c1bc6a4` |
| 1.4 — Uzum webhook | ✅ Bajarildi | `00d267c` |
| 1.5 — Kalit rotatsiyasi | ⏸ Do'kon egasi bajaradi |  |
| 2 — RLS | 🟡 Kod tayyor, SQL deploy'dan keyin | `43e4a3e` |
| 3 — Server narxi | ✅ Bajarildi | `6ae45b8` |
| 4 — Yaxlitlik | 🟡 P7 (idempotentlik) bajarildi | `00d267c` |
| 5 — UX | 🟡 Savat tuzatildi, alert'lar qoldi | `6ae45b8` |
| 6 — Click QR | ⏸ Task 6.0 bloklaydi |  |

### Rejadan farqlar (bajarish paytida aniqlangan)

**Task 1.2 — "hamma route'ga requireAdmin" NOTO'G'RI edi.**
Chaqiruvchilarni tekshirganda 3 ta route'ni mijozning O'ZI chaqirishi
ma'lum bo'ldi. Reja bo'yicha qilinsa, mijoz oqimi butunlay buzilardi:

| Route | Chaqiruvchi | Amaldagi himoya |
|---|---|---|
| `contracts` confirm/cancel | `UzumContractActions` (admin) | `requireAdmin` |
| `contracts` status | `uzum-pending.ts:98` (**mijoz**) | rate limit |
| `notify` | `uzum-pending.ts:116` (**mijoz**) | `contract_id` Uzum API dan tasdiqlanadi + rate limit |
| `telegram-notify` | `click/complete:94` (server) | `requireInternalSecret` |
| `meta-capi` | `meta-tracker.ts` (**mijoz**) | rate limit |

**Task 1.4 — Uzum imzo mexanizmi hali noma'lum.**
"Webhook'ga ishonmaslik" yondashuvi tanlandi: holat Uzum API dan
qayta so'raladi. Bu Uzum imzo bersa ham, bermasa ham xavfsiz.

**Qo'shimcha topilma:** `src/app/login/page.tsx:9` da ishlatilmaydigan
`ALLOWED_ADMIN` konstantasi (qattiq yozilgan email) bor edi — o'chirildi.

### RLS holati — TASDIQLANGAN (2026-08-22)

Haqiqiy baza bilan sinaldi (faqat o'qish). Ommaviy anon kalit bilan:

```
orders        ✗ OCHIQ — 31 qator
users         ✗ OCHIQ — 1 qator
transactions  ✗ OCHIQ — 49 qator
products      ✗ OCHIQ — 218 qator  (bu normal, katalog ommaviy)
```

X7 tasdiqlandi. Dashboard'ning 37 ta so'rovi API orqasiga ko'chirildi
(`43e4a3e`), ya'ni RLS ni yoqishga endi to'siq yo'q — LEKIN faqat kod
deploy qilingandan KEYIN (`migrations/03_rls_policies.sql` ichida
tartib yozilgan).

### ⚠️ Deploy'dan OLDIN Vercel'ga qo'shilishi SHART

Bu kalitlarsiz sayt ishlamay qoladi:

| Kalit | Nima uchun | Bo'lmasa nima bo'ladi |
|---|---|---|
| `ADMIN_SESSION_SECRET` | Sessiya imzosi (32+ belgi) | Admin panelga hech kim kira olmaydi |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Endi fallback yo'q | Login 503 qaytaradi |
| `INTERNAL_API_SECRET` | Ichki route chaqiruvlari | Click to'lovida Telegram xabari kelmaydi |
| `TELEGRAM_WEBHOOK_SECRET` | Bot himoyasi | Bot tugmalari ishlamaydi |
| `SUPABASE_SERVICE_ROLE_KEY` | RLS ortidan o'qish | RLS yoqilgach dashboard o'ladi |

Telegram uchun qo'shimcha qadam:

```
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://parfumelux.uz/api/telegram-webhook&secret_token=<SECRET>"
```

---

# 0-BOSQICH: Merge'ni yakunlash (BLOKER)

Busiz hech narsa kompilyatsiya bo'lmaydi va deploy qilinmaydi.

### Task 0.1: Uzum va sahifa fayllarining konfliktlarini hal qilish

**Files:**
- Modify: `src/lib/uzumnasiya.ts`, `src/app/api/uzumnasiya/create-order/route.ts`, `src/app/cart/page.tsx`, `src/app/catalog/page.tsx`, `src/app/page.tsx`, `src/components/ProductDetailClient.tsx`

**Spec:** audit M-bo'limi. Bu 6 faylda **`5c9d820` (merge) tomoni to'liq olinadi**.

- [ ] **Step 1: Har bir faylda merge tomonini olish**

```bash
cd "E:/IT loihalar/Lux atir"
git checkout --theirs src/lib/uzumnasiya.ts
git checkout --theirs src/app/api/uzumnasiya/create-order/route.ts
git checkout --theirs src/app/cart/page.tsx
git checkout --theirs src/app/catalog/page.tsx
git checkout --theirs src/app/page.tsx
git checkout --theirs src/components/ProductDetailClient.tsx
```

- [ ] **Step 2: Marker qolmaganini tekshirish**

```bash
grep -c "<<<<<<<\|>>>>>>>" src/lib/uzumnasiya.ts src/app/api/uzumnasiya/create-order/route.ts src/app/cart/page.tsx src/app/catalog/page.tsx src/app/page.tsx src/components/ProductDetailClient.tsx
```

Kutilgan: har bir faylda `0`.

- [ ] **Step 3: `git add`**

```bash
git add src/lib/uzumnasiya.ts src/app/api/uzumnasiya/create-order/route.ts src/app/cart/page.tsx src/app/catalog/page.tsx src/app/page.tsx src/components/ProductDetailClient.tsx
```

### Task 0.2: `ProductCard` va `ProductGrid` — merge tomoni + stok saralashini qaytarish

**Files:**
- Modify: `src/components/ProductCard.tsx`, `src/components/ProductGrid.tsx:160-172`, `src/lib/products-query.ts`

**Spec:** audit M-bo'limi. `ProductCard` da HEAD ning `unoptimized={true}` i **kerak emas** — `next.config.ts:12` da global `images.unoptimized: true` bor (tasdiqlangan). Lekin HEAD ning **stok saralashi** yo'qolmasligi kerak (commit `71b22ee`).

- [ ] **Step 1: Ikkala faylda merge tomonini olish**

```bash
git checkout --theirs src/components/ProductCard.tsx src/components/ProductGrid.tsx
```

- [ ] **Step 2: `ProductGrid.tsx` da stok saralashini `.filter()` dan KEYIN qaytarish**

`useMemo` ichidagi `return products.filter((p) => { ... })` zanjirining oxiriga qo'shing:

```ts
      return true;
    })
    // 71b22ee: sotuvda bor mahsulotlar birinchi ko'rinadi.
    // ⚠️ .filter() ichida EMAS — u yerda qidiruv/brend filtrlarini sindiradi.
    .sort((a, b) => {
      const aStock = a.stock || 0;
      const bStock = b.stock || 0;
      if (aStock > 0 && bStock === 0) return -1;
      if (aStock === 0 && bStock > 0) return 1;
      return 0;
    });
```

- [ ] **Step 3: `products-query.ts` da server tomonda ham stok saralash**

`fetchCatalogProducts` ichidagi `.order("created_at", ...)` chaqiruvidan **oldin** qo'shing:

```ts
    .order("stock", { ascending: false })
```

- [ ] **Step 4: Tekshirish**

```bash
grep -c "<<<<<<<" src/components/ProductCard.tsx src/components/ProductGrid.tsx
npx tsc --noEmit
```

Kutilgan: marker `0`, tsc **0 xato**.

- [ ] **Step 5: Build**

```bash
npm run build
```

Kutilgan: muvaffaqiyat.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProductCard.tsx src/components/ProductGrid.tsx src/lib/products-query.ts
git commit -m "merge: origin/main bilan birlashtirish — Uzum Partner API, yangi dizayn, stok saralashi saqlandi"
```

### Task 0.3: Vitest o'rnatish

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

Keyingi bosqichlar uchun test bazasi. Loyihada hozir hech qanday test yo'q.

- [ ] **Step 1: O'rnatish**

```bash
npm install -D vitest@^3
```

- [ ] **Step 2: `vitest.config.ts` yaratish**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

- [ ] **Step 3: `package.json` scripts ga qo'shish**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "test: Vitest sozlandi"
```

---

# 1-BOSQICH: Kirish nazorati (KRITIK — bugun chiqarilsin)

**Spec:** X1, X2, X4, X5, X6, X9, X10, X11, X12

### Task 1.1: HMAC imzolangan admin sessiyasi

**Files:**
- Create: `src/lib/admin-session.ts`, `src/lib/admin-session.test.ts`
- Modify: `src/proxy.ts`, `src/app/api/auth/login/route.ts`

**Interfaces:**
- Produces: `createSessionToken(email: string): Promise<string>`, `verifySessionToken(token: string | undefined): Promise<{ email: string } | null>`, `ADMIN_COOKIE = "admin_session"`

**Spec:** X1 (doimiy cookie qiymati), X2 (kodga yozilgan parol).

- [ ] **Step 1: Failing test yozish**

`src/lib/admin-session.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { createSessionToken, verifySessionToken } from "./admin-session";

beforeAll(() => { process.env.ADMIN_SESSION_SECRET = "test-secret-kamida-32-belgi-bolsin!!"; });

describe("admin-session", () => {
  it("yaratilgan tokenni qabul qiladi", async () => {
    const t = await createSessionToken("admin@example.com");
    expect(await verifySessionToken(t)).toEqual({ email: "admin@example.com" });
  });

  it("eski doimiy qiymatni RAD ETADI", async () => {
    expect(await verifySessionToken("authenticated")).toBeNull();
  });

  it("o'zgartirilgan tokenni rad etadi", async () => {
    const t = await createSessionToken("admin@example.com");
    expect(await verifySessionToken(t.slice(0, -3) + "aaa")).toBeNull();
  });

  it("muddati o'tgan tokenni rad etadi", async () => {
    const t = await createSessionToken("admin@example.com", Date.now() - 1000);
    expect(await verifySessionToken(t)).toBeNull();
  });

  it("token yo'q bo'lsa null", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Testni ishga tushirib, yiqilishiga ishonch hosil qilish**

```bash
npx vitest run src/lib/admin-session.test.ts
```

Kutilgan: FAIL — `Cannot find module './admin-session'`.

- [ ] **Step 3: `src/lib/admin-session.ts` yozish**

```ts
/**
 * HMAC-SHA256 imzolangan admin sessiya tokeni.
 *
 * ⚠️ Web Crypto ishlatiladi (node:crypto EMAS) — proxy edge runtime'da
 * ishlashi mumkin, u yerda node:crypto yo'q.
 *
 * Format: base64url(payload) + "." + base64url(hmac)
 * payload: {"email":"...","exp":<ms>}
 */
export const ADMIN_COOKIE = "admin_session";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(s: string): Uint8Array {
  const p = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(p + "=".repeat((4 - (p.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  // ⚠️ Fallback YO'Q — sir sozlanmagan bo'lsa ishlamasin, ochiq qolmasin.
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET sozlanmagan (kamida 32 belgi bo'lishi kerak)");
  }
  return crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
}

export async function createSessionToken(email: string, exp = Date.now() + MAX_AGE_MS): Promise<string> {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ email, exp })));
  const sig = await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(payload));
  return `${payload}.${b64url(new Uint8Array(sig))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<{ email: string } | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC", await key(), unb64url(sig), new TextEncoder().encode(payload)
    );
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    if (typeof data.email !== "string" || !data.email) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Test o'tishini tekshirish**

```bash
npx vitest run src/lib/admin-session.test.ts
```

Kutilgan: 5 test PASS.

- [ ] **Step 5: `src/proxy.ts` ni yangilash**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const session = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
```

- [ ] **Step 6: `auth/login/route.ts` — fallback parolni olib tashlash**

`process.env.ADMIN_EMAIL || "mamatkuloff@bk.ru"` va `process.env.ADMIN_PASSWORD || "umar2016"` qatorlarini almashtiring:

```ts
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    // ⚠️ X2: kodda default parol BO'LMAYDI. Env yo'q bo'lsa kirish yopiq.
    if (!adminEmail || !adminPassword) {
      console.error("ADMIN_EMAIL yoki ADMIN_PASSWORD sozlanmagan");
      return NextResponse.json({ error: "Tizim sozlanmagan" }, { status: 503 });
    }
```

va cookie o'rnatishni almashtiring:

```ts
      response.cookies.set(ADMIN_COOKIE, await createSessionToken(adminEmail), {
        path: "/", httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", maxAge: 60 * 60 * 24,
      });
```

- [ ] **Step 7: Vercel va `.env.local` ga sir qo'shish**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Chiqqan qiymatni `ADMIN_SESSION_SECRET` sifatida `.env.local` ga **va Vercel Environment Variables** ga qo'ying. `ADMIN_EMAIL` va `ADMIN_PASSWORD` ni ham Vercel'da tekshiring — **eski parol `umar2016` ni almashtiring**.

- [ ] **Step 8: Qo'lda tekshirish**

```bash
npm run dev
```

Boshqa terminalda:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -H "Cookie: admin_session=authenticated" http://localhost:3000/dashboard/orders
```

Kutilgan: `307` va `/login` ga yo'naltirish. Eski soxta cookie endi ishlamaydi.

- [ ] **Step 9: Commit**

```bash
git add src/lib/admin-session.ts src/lib/admin-session.test.ts src/proxy.ts src/app/api/auth/login/route.ts
git commit -m "xavfsizlik: admin sessiyasi HMAC bilan imzolanadi, kodga yozilgan parol olib tashlandi (X1, X2)"
```

### Task 1.2: API route'lar uchun himoya qatlami

**Files:**
- Create: `src/lib/api-guard.ts`, `src/lib/rate-limit.ts`, `src/lib/rate-limit.test.ts`
- Modify: `src/app/api/uzumnasiya/contracts/route.ts`, `src/app/api/uzumnasiya/notify/route.ts`, `src/app/api/telegram-notify/route.ts`, `src/app/api/meta-capi/route.ts`, `src/app/api/uzumnasiya/check-status/route.ts`
- Delete: `src/app/api/supabase-proxy/`

**Interfaces:**
- Consumes: `verifySessionToken`, `ADMIN_COOKIE` (Task 1.1)
- Produces: `requireAdmin(req: Request): Promise<Response | null>`, `rateLimit(key: string, max: number, windowMs: number): boolean`

**Spec:** X4, X9, X10, X11, X12

- [ ] **Step 1: Rate limit uchun failing test**

`src/lib/rate-limit.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("limitgacha ruxsat beradi, keyin rad etadi", () => {
    const k = "test-" + Math.random();
    expect(rateLimit(k, 3, 60000)).toBe(true);
    expect(rateLimit(k, 3, 60000)).toBe(true);
    expect(rateLimit(k, 3, 60000)).toBe(true);
    expect(rateLimit(k, 3, 60000)).toBe(false);
  });

  it("har bir kalit alohida hisoblanadi", () => {
    const a = "a-" + Math.random(), b = "b-" + Math.random();
    expect(rateLimit(a, 1, 60000)).toBe(true);
    expect(rateLimit(a, 1, 60000)).toBe(false);
    expect(rateLimit(b, 1, 60000)).toBe(true);
  });
});
```

- [ ] **Step 2: Testni yiqilishida ko'rish**

```bash
npx vitest run src/lib/rate-limit.test.ts
```

Kutilgan: FAIL.

- [ ] **Step 3: `src/lib/rate-limit.ts` yozish**

```ts
/**
 * Oddiy in-memory rate limit.
 * ⚠️ Serverless'da har bir instansiya o'z hisobini yuritadi — bu mukammal
 * emas, lekin enumeratsiya hujumini (X10) sezilarli qiyinlashtiradi.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const e = hits.get(key);
  if (!e || e.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (e.count >= max) return false;
  e.count++;
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("x-real-ip") || "noma'lum";
}
```

- [ ] **Step 4: Test o'tishini tekshirish**

```bash
npx vitest run src/lib/rate-limit.test.ts
```

Kutilgan: 2 test PASS.

- [ ] **Step 5: `src/lib/api-guard.ts` yozish**

```ts
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

/**
 * Admin bo'lmagan so'rovni to'xtatadi.
 * @returns null — ruxsat berildi; Response — so'rov rad etildi
 *
 * ⚠️ Next hujjati: proxy autorizatsiya yechimi emas. Har bir maxfiy
 * route SHU funksiyani o'zi chaqirishi SHART.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  const session = await verifySessionToken(m?.[1]);
  if (!session) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  return null;
}
```

- [ ] **Step 6: `contracts/route.ts` ni himoyalash (X4)**

`export async function POST(req: Request) {` qatoridan keyin **birinchi qator** sifatida:

```ts
  const denied = await requireAdmin(req);
  if (denied) return denied;
```

Import qo'shing: `import { requireAdmin } from "@/lib/api-guard";`

- [ ] **Step 7: `notify`, `telegram-notify`, `meta-capi` ni himoyalash (X11, X12)**

Uchala faylda ham xuddi shu ikki qator + import qo'shiladi.

- [ ] **Step 8: `check-status` ga rate limit (X10)**

`src/app/api/uzumnasiya/check-status/route.ts` ichida, `req.json()` dan **oldin**:

```ts
  // X10: telefon raqam enumeratsiyasining oldini olish — bir IP dan
  // 10 daqiqada 10 ta so'rov.
  if (!rateLimit(`chk:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Juda ko'p urinish. 10 daqiqadan keyin qayta urinib ko'ring." },
      { status: 429 }
    );
  }
```

Import: `import { rateLimit, clientIp } from "@/lib/rate-limit";`

- [ ] **Step 9: `supabase-proxy` ni o'chirish (X9)**

```bash
grep -rn "supabase-proxy" src/ || echo "hech qayerda ishlatilmaydi — o'chirish xavfsiz"
rm -rf src/app/api/supabase-proxy
```

- [ ] **Step 10: Tekshirish**

```bash
npx tsc --noEmit && npm run build
```

Kutilgan: 0 xato, build muvaffaqiyatli.

Dev serverda:

```bash
curl -s -X POST http://localhost:3000/api/uzumnasiya/contracts -H "Content-Type: application/json" -d '{"action":"status","contract_id":1}'
```

Kutilgan: `{"error":"Ruxsat yo'q"}` va HTTP 401.

- [ ] **Step 11: Commit**

```bash
git add -A src/lib/api-guard.ts src/lib/rate-limit.ts src/lib/rate-limit.test.ts src/app/api
git commit -m "xavfsizlik: contracts/notify/capi routelariga admin tekshiruvi, check-status ga rate limit, supabase-proxy o'chirildi (X4, X9-X12)"
```

### Task 1.3: Telegram webhook — secret token va kodga yozilgan parolni olib tashlash

**Files:**
- Modify: `src/app/api/telegram-webhook/route.ts`

**Spec:** X5, X6

- [ ] **Step 1: Secret token tekshiruvini qo'shish**

`POST` funksiyasining eng boshiga:

```ts
  // X5: Telegram har bir so'rovga shu headerni qo'shadi (setWebhook da
  // secret_token bergan bo'lsak). Busiz body'ni istalgan odam yasay oladi.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
```

- [ ] **Step 2: `adminbek1` parolini butunlay olib tashlash (X6)**

`text === "adminbek1"` shartini va u ochadigan `users` insertini **o'chiring**. Admin qo'shish faqat Supabase Studio orqali qo'lda qilinadi. O'rniga:

```ts
    // X6: kodga yozilgan parol bilan superadmin bo'lish yo'li olib tashlandi.
    // Yangi admin faqat Supabase Studio orqali `users` jadvaliga qo'shiladi.
```

- [ ] **Step 3: Admin filtri bo'sh ro'yxatda ochilib ketmasligini tuzatish (X5)**

`admins.length > 0 && admins.includes(...)` shaklidagi shartni almashtiring:

```ts
    // ⚠️ Bo'sh ro'yxat = HECH KIM, "hamma" EMAS.
    if (admins.length === 0 || !admins.includes(String(cq.from.id))) {
      await answerCallback(cq.id, "Ruxsat yo'q");
      return NextResponse.json({ ok: true });
    }
```

- [ ] **Step 4: Telegram'da secret o'rnatish**

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Qiymatni `TELEGRAM_WEBHOOK_SECRET` sifatida Vercel'ga qo'ying, so'ng:

```bash
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://parfumelux.uz/api/telegram-webhook&secret_token=<SECRET>"
```

Kutilgan: `{"ok":true,...}`

- [ ] **Step 5: Tekshirish**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/telegram-webhook -H "Content-Type: application/json" -d '{"message":{"text":"adminbek1","chat":{"id":1},"from":{"id":1}}}'
```

Kutilgan: `401`.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/telegram-webhook/route.ts
git commit -m "xavfsizlik: Telegram webhook secret token, kodga yozilgan superadmin paroli olib tashlandi (X5, X6)"
```

### Task 1.4: Uzum webhook imzosi

**Files:**
- Modify: `src/app/api/uzumnasiya/webhook/route.ts`

**Spec:** X3

⚠️ **Avval aniqlash kerak (audit T4):** Uzum webhook'ga imzo/secret yuboradimi? Uzum menejeridan so'rang yoki `https://developer.uzumbank.uz/nasiya/` hujjatini o'qing.

- [ ] **Step 1: Uzum javobiga qarab yo'l tanlash**

- **Agar Uzum imzo bersa** → HMAC tekshiruvini qo'shing (Task 1.3 namunasi bo'yicha).
- **Agar Uzum imzo bermasa** → webhook'ga **ishonmaslik** kerak. Webhook faqat "tekshir" signali bo'ladi.

- [ ] **Step 2: Ishonchsiz webhook uchun — holatni Uzum API dan qayta so'rash**

Webhook body'sidagi `status` ga ishonish o'rniga:

```ts
  // X3: webhook body'siga ISHONMAYMIZ — uni istalgan odam yubora oladi.
  // Faqat contract_id ni olamiz va haqiqiy holatni Uzum API dan so'raymiz.
  const check = await checkContractStatus(Number(contractId));
  const realStatus = check.data?.contract_status;
  const isPaid = realStatus === 1; // CONTRACT_STATUS.ACTIVE
  if (!isPaid) {
    return NextResponse.json({ ok: true, note: "shartnoma hali aktiv emas" });
  }
```

Import: `import { checkContractStatus } from "@/lib/uzumnasiya";`

- [ ] **Step 3: Tekshirish — soxta webhook endi ishlamaydi**

```bash
curl -s -X POST http://localhost:3000/api/uzumnasiya/webhook -H "Content-Type: application/json" -d '{"ext_order_id":"00000000-0000-0000-0000-000000000000","status":"PAID"}'
```

Kutilgan: buyurtma `paid` bo'lmaydi (Uzum API tasdiqlamaydi).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/uzumnasiya/webhook/route.ts
git commit -m "xavfsizlik: Uzum webhook holati API dan qayta tasdiqlanadi, body'ga ishonilmaydi (X3)"
```

### Task 1.5: Sizib chiqqan Supabase kalitini rotatsiya qilish

**Files:**
- Modify: `scratch/migrate_images.js`, `scratch/cleanup_catalog.js`, `.gitignore`

**Spec:** X8. ⚠️ Kalit git tarixida qoladi — **fayldan o'chirish yetarli emas, kalitni almashtirish SHART.**

- [ ] **Step 1: Supabase'da kalitni rotatsiya qilish**

Supabase Dashboard → Project Settings → API → `anon` kalitni **Reset/Roll**. Yangi qiymatni Vercel va `.env.local` ga qo'ying.

- [ ] **Step 2: Skriptlardan kalitni olib tashlash**

Ikkala faylda ham qattiq yozilgan JWT ni almashtiring:

```js
const SERVICE_KEY = process.env.SUPABASE_KEY;
if (!SERVICE_KEY) throw new Error("SUPABASE_KEY env kerak");
```

- [ ] **Step 3: Worktree nusxalarini ham tozalash**

```bash
grep -rln "eyJhbGciOi" --include="*.js" "E:/IT loihalar/Lux atir" | grep -v node_modules
```

Topilgan har bir faylni tozalang (`.claude/worktrees/` ichidagilar ham).

- [ ] **Step 4: `scratch/` ni gitignore ga qo'shish**

`.gitignore` ga:

```
scratch/
```

```bash
git rm -r --cached scratch
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore scratch 2>/dev/null; git add -u
git commit -m "xavfsizlik: sizib chiqqan Supabase kaliti olib tashlandi, scratch/ gitignore ga qo'shildi (X8)"
```

---

# 2-BOSQICH: Ma'lumotlar bazasi himoyasi

**Spec:** X7, D2

### Task 2.1: Haqiqiy RLS holatini aniqlash

**Spec:** audit T1. **Bu tekshiruvsiz keyingi qadam noto'g'ri bo'lishi mumkin.**

- [ ] **Step 1: Supabase SQL Editor'da ishga tushirish**

```sql
select schemaname, tablename, rowsecurity from pg_tables where schemaname = 'public';
select * from pg_policies where schemaname = 'public';
```

- [ ] **Step 2: Natijani yozib qo'yish**

`docs/audit/2026-08-21-audit.md` ning T1 bandini natija bilan yangilang. `rowsecurity = false` bo'lsa X7 tasdiqlanadi.

- [ ] **Step 3: `scratch/uzum_migration.sql` qo'llanilganmi tekshirish (audit T2)**

```sql
select conname, pg_get_constraintdef(oid) from pg_constraint
where conrelid = 'orders'::regclass and contype = 'c';
```

`order_type` CHECK ichida `uzum_nasiya` bor-yo'qligini ko'ring.

### Task 2.2: RLS yoqish va service-role kalitiga o'tish

**Files:**
- Create: `migrations/03_rls_policies.sql`
- Modify: `src/app/api/click/prepare/route.ts:6`, `src/app/api/click/complete/route.ts:7`, `src/app/api/uzumnasiya/webhook/route.ts:21`, `src/lib/telegram.ts:15`

**Spec:** X7

- [ ] **Step 1: `migrations/03_rls_policies.sql` yozish**

```sql
-- X7: RLS yoqish. Bugungacha anon kalit bilan barcha buyurtmalarni
-- o'qish va o'zgartirish mumkin edi.
alter table orders enable row level security;
alter table transactions enable row level security;
alter table users enable row level security;
alter table products enable row level security;

-- Mahsulotlar hammaga ochiq (katalog).
create policy "products_public_read" on products for select to anon, authenticated using (true);

-- Buyurtmalar: anon uchun HECH QANDAY huquq yo'q.
-- Barcha yozish/o'qish server routelari orqali service_role bilan bo'ladi
-- (service_role RLS ni chetlab o'tadi).
-- Policy yozmaymiz => anon uchun hamma narsa yopiq.

-- transactions va users ham xuddi shunday: faqat service_role.
```

- [ ] **Step 2: Migratsiyani Supabase'da ishga tushirish**

Supabase SQL Editor'ga nusxalab ishga tushiring.

- [ ] **Step 3: Server routelarini service-role kalitiga o'tkazish**

Yuqoridagi 4 faylda `NEXT_PUBLIC_SUPABASE_ANON_KEY` ni almashtiring:

```ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // ⚠️ Server tomonda service_role — anon kalit RLS tufayli endi ishlamaydi.
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

`SUPABASE_SERVICE_ROLE_KEY` ni Vercel va `.env.local` ga qo'ying (Supabase Dashboard → API → `service_role`).

⚠️ Bu kalit **hech qachon** `NEXT_PUBLIC_` prefiksi bilan bo'lmasin — brauzerga chiqmasligi kerak.

- [ ] **Step 4: Brauzerdan to'g'ridan-to'g'ri yozish endi ishlamasligini tekshirish**

Brauzer konsolida (sayt ochiq holda):

```js
await (await fetch(`${location.origin}/api/health`)).text()
```

va Supabase anon kalit bilan `orders` ni o'qishga urinib ko'ring — `permission denied` kutiladi.

- [ ] **Step 5: Commit**

```bash
git add migrations/03_rls_policies.sql src/app/api src/lib/telegram.ts
git commit -m "xavfsizlik: RLS yoqildi, server routelari service_role kalitiga o'tkazildi (X7)"
```

### Task 2.3: CHECK cheklovlarini kod bilan moslashtirish

**Files:**
- Create: `migrations/04_order_status_fix.sql`

**Spec:** D2

- [ ] **Step 1: Migratsiya yozish**

```sql
-- D2: kod yozadigan qiymatlar CHECK ga sig'masdi — har bir insert 400 bilan
-- rad etilardi. `scratch/uzum_migration.sql` prod'da qo'llanmagan.

alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check
  check (payment_status in ('unpaid','waiting','pending','paid','cancelled'));

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending','processing','accepted','delivered','cancelled'));

alter table orders drop constraint if exists orders_order_type_check;
alter table orders add constraint orders_order_type_check
  check (order_type in ('full_payment','installment','uzum_nasiya'));

-- D4: shartnoma faqat localStorage'da qolmasin.
create table if not exists uzum_contracts (
  contract_id   bigint primary key,
  order_row_id  uuid references orders(id) on delete set null,
  uzum_order_id bigint,
  phone         text not null,
  total         numeric(12,2) not null,
  period        text,
  status        text not null default 'created',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table uzum_contracts enable row level security;
```

- [ ] **Step 2: Ishga tushirish va tekshirish**

```sql
select conname, pg_get_constraintdef(oid) from pg_constraint
where conrelid = 'orders'::regclass and contype = 'c';
select * from uzum_contracts limit 1;
```

- [ ] **Step 3: Commit**

```bash
git add migrations/04_order_status_fix.sql
git commit -m "db: CHECK cheklovlari kod bilan moslashtirildi, uzum_contracts jadvali qo'shildi (D2, D4)"
```

---

# 3-BOSQICH: Pul — server tomonda narx (KRITIK)

**Spec:** P1, P2, P8

### Task 3.1: Narxning yagona server manbai

**Files:**
- Create: `src/lib/pricing-server.ts`, `src/lib/pricing-server.test.ts`

**Interfaces:**
- Produces: `priceOfProductUzs(p: { price_usd: number; product_type: string }): number`, `computeOrderTotal(items: { product_id: string; quantity: number }[]): Promise<{ lines: PricedLine[]; totalUzs: number }>`, `type PricedLine = { product_id: string; title: string; quantity: number; price_uzs: number; product_type: string }`

**Spec:** P1, P2. Bu modul **butun loyihada narx bo'yicha yagona haqiqat**.

- [ ] **Step 1: Failing test**

`src/lib/pricing-server.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { priceOfProductUzs } from "./pricing-server";

describe("priceOfProductUzs", () => {
  it("premium atir 800 000", () => {
    expect(priceOfProductUzs({ price_usd: 25, product_type: "lux_copy" })).toBe(800000);
  });
  it("original atir formula bo'yicha", () => {
    expect(priceOfProductUzs({ price_usd: 100, product_type: "original" })).toBe(200 * 12100);
  });
  it("test narxi 0.01 => 1000", () => {
    expect(priceOfProductUzs({ price_usd: 0.01, product_type: "original" })).toBe(1000);
    expect(priceOfProductUzs({ price_usd: 0.01, product_type: "lux_copy" })).toBe(1000);
  });
});
```

- [ ] **Step 2: Yiqilishini ko'rish**

```bash
npx vitest run src/lib/pricing-server.test.ts
```

- [ ] **Step 3: `src/lib/pricing-server.ts` yozish**

```ts
import { createClient } from "@supabase/supabase-js";
import { calculateOriginalPriceUzs, calculatePremiumPriceUzs } from "@/lib/utils";

export type PricedLine = {
  product_id: string; title: string; quantity: number;
  price_uzs: number; product_type: string;
};

/** Bitta mahsulotning so'mdagi narxi — turiga qarab. */
export function priceOfProductUzs(p: { price_usd: number; product_type: string }): number {
  return p.product_type === "original"
    ? calculateOriginalPriceUzs(p.price_usd)
    : calculatePremiumPriceUzs(p.price_usd);
}

/**
 * ⚠️ P1/P2: mijoz yuborgan narxga HECH QACHON ishonmaymiz.
 * Faqat product_id va miqdor olinadi, narx bazadan qayta hisoblanadi.
 */
export async function computeOrderTotal(
  items: { product_id: string; quantity: number }[]
): Promise<{ lines: PricedLine[]; totalUzs: number }> {
  if (!items.length) throw new Error("Savat bo'sh");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ids = [...new Set(items.map((i) => i.product_id))];
  const { data, error } = await supabase
    .from("products").select("id, title, price_usd, product_type, stock").in("id", ids);
  if (error) throw new Error(`Mahsulot narxlarini olishda xatolik: ${error.message}`);

  const byId = new Map((data || []).map((p) => [p.id, p]));
  const lines: PricedLine[] = [];
  let totalUzs = 0;

  for (const item of items) {
    const p = byId.get(item.product_id);
    if (!p) throw new Error(`Mahsulot topilmadi: ${item.product_id}`);
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const price = priceOfProductUzs(p);
    totalUzs += price * qty;
    lines.push({
      product_id: p.id, title: p.title, quantity: qty,
      price_uzs: price, product_type: p.product_type,
    });
  }
  return { lines, totalUzs };
}
```

- [ ] **Step 4: Test o'tishini tekshirish**

```bash
npx vitest run src/lib/pricing-server.test.ts
```

Kutilgan: 3 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing-server.ts src/lib/pricing-server.test.ts
git commit -m "pul: server tomonda narx hisoblash moduli (P1, P2)"
```

### Task 3.2: Buyurtma yaratishni server tomonga ko'chirish

**Files:**
- Create: `src/app/api/orders/create/route.ts`
- Modify: `src/app/cart/page.tsx`, `src/app/api/uzumnasiya/create-order/route.ts`, `src/app/api/uzumnasiya/calculate/route.ts`

**Interfaces:**
- Consumes: `computeOrderTotal` (Task 3.1)
- Produces: `POST /api/orders/create` — qabul qiladi `{ items: [{product_id, quantity}], client: {name, phone, address, region}, order_type }`, qaytaradi `{ order_id, total_uzs, lines }`

**Spec:** P1, P2, D3

- [ ] **Step 1: `src/app/api/orders/create/route.ts` yozish**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeOrderTotal } from "@/lib/pricing-server";

export async function POST(req: Request) {
  try {
    const { items, client, order_type } = await req.json();
    if (!items?.length || !client?.phone) {
      return NextResponse.json({ error: "Savat yoki telefon raqam to'liq emas" }, { status: 400 });
    }

    // ⚠️ P1: narx BAZADAN hisoblanadi, mijozdan emas.
    const { lines, totalUzs } = await computeOrderTotal(items);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.from("orders").insert({
      items: lines,
      client_name: client.name || "Mijoz",
      client_phone: client.phone,
      client_address: client.address || "",
      region: client.region || "",
      order_type: order_type || "full_payment",
      status: "pending",
      payment_status: "unpaid",
      total_amount: totalUzs,
    }).select("id").single();

    // ⚠️ D3: DB xatosi YUTILMAYDI. Buyurtmasiz davom etish = pul yo'qotish.
    if (error || !data) {
      console.error("[orders/create] insert xatosi", error);
      return NextResponse.json(
        { error: "Buyurtmani saqlab bo'lmadi. Iltimos, qayta urinib ko'ring." },
        { status: 500 }
      );
    }

    return NextResponse.json({ order_id: data.id, total_uzs: totalUzs, lines });
  } catch (e) {
    console.error("[orders/create]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik" }, { status: 500 }
    );
  }
}
```

- [ ] **Step 2: `cart/page.tsx` — to'g'ridan-to'g'ri Supabase insertini almashtirish**

`supabase.from("orders").insert(...)` chaqiruvini o'chirib, o'rniga:

```ts
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ⚠️ narx YUBORILMAYDI — server o'zi hisoblaydi
          items: items.map((it) => ({ product_id: it.product.id, quantity: it.quantity })),
          client: { name, phone, address, region },
          order_type: "full_payment",
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Buyurtmani saqlab bo'lmadi");
      const orderId = j.order_id;
      const finalAmount = j.total_uzs; // Click havolasi uchun — serverdan
```

- [ ] **Step 3: `uzumnasiya/create-order` da narxni serverdan olish**

`products.map((p) => ({ price: Math.round(Number(p.price)) ... }))` qismini almashtiring:

```ts
    // ⚠️ P2: mijoz yuborgan narx e'tiborga OLINMAYDI.
    const { lines, totalUzs } = await computeOrderTotal(
      products.map((p: { product_id: string; amount: number }) => ({
        product_id: p.product_id, quantity: p.amount,
      }))
    );
    const uzumProducts = lines.map((l) => ({
      amount: l.quantity, name: l.title, price: l.price_uzs,
      category: UZUM_DEFAULT_CATEGORY, unit_id: UZUM_UNIT_PIECE,
      product_id: productIdToInt(l.product_id),
    }));
```

- [ ] **Step 4: `uzumnasiya/calculate` da ham xuddi shunday**

Tariflar to'g'ri chiqishi uchun `calculate` ham server narxidan foydalanishi kerak — aks holda tarif bir narxga, shartnoma boshqa narxga tuziladi.

- [ ] **Step 5: Hujumni qo'lda sinash**

```bash
curl -s -X POST http://localhost:3000/api/orders/create -H "Content-Type: application/json" -d '{"items":[{"product_id":"<haqiqiy-uuid>","quantity":1,"price_uzs":1000}],"client":{"phone":"998901234567"},"order_type":"full_payment"}'
```

Kutilgan: `total_uzs` **800000** (yoki haqiqiy narx), **1000 EMAS**. Yuborilgan `price_uzs` e'tiborsiz qoldiriladi.

- [ ] **Step 6: Tekshirish va commit**

```bash
npx tsc --noEmit && npm run build && npx vitest run
git add -A src/app/api/orders src/app/cart/page.tsx src/app/api/uzumnasiya
git commit -m "pul: buyurtma summasi server tomonda hisoblanadi, mijoz narxiga ishonilmaydi (P1, P2, D3)"
```

### Task 3.3: Daromadni so'mda yozish

**Files:**
- Modify: `src/app/dashboard/orders/page.tsx:70-73,117-122,148-152`

**Spec:** P8, D6

- [ ] **Step 1: `calculateTotal` ni `total_amount` ga o'tkazish**

```ts
  // ⚠️ P8: oldin price_at_purchase (USD) yig'indisi so'm sifatida yozilardi —
  // 800 000 so'mlik sotuv kassaga ~30 bo'lib tushardi.
  const calculateTotal = (order: Order): number => Number(order.total_amount) || 0;
```

- [ ] **Step 2: `LIKE` bilan o'chirishni `order_id` ga o'tkazish (D6)**

`transactions` jadvaliga `order_id uuid` ustuni qo'shing (`migrations/05_transactions_order_id.sql`) va `.like("description", ...)` o'rniga `.eq("order_id", orderId)` ishlating.

- [ ] **Step 3: Tekshirish va commit**

```bash
npx tsc --noEmit && npm run build
git add -A src/app/dashboard/orders/page.tsx migrations
git commit -m "pul: kassa daromadi so'mda yoziladi, tranzaksiya order_id bo'yicha bog'lanadi (P8, D6)"
```

---

# 4-BOSQICH: Ma'lumot yaxlitligi

**Spec:** D1, D4, D5, P6, P7

### Task 4.1: Shartnoma serverda saqlanadi — localStorage yagona manba bo'lmaydi

**Files:**
- Modify: `src/app/api/uzumnasiya/create-order/route.ts`, `src/lib/uzum-pending.ts`

**Spec:** D1, D4. `uzum_contracts` jadvali Task 2.3 da yaratilgan.

- [ ] **Step 1: `create-order` shartnomani darrov `uzum_contracts` ga yozsin**

Uzum javobini olgandan keyin, `webview_path` ni qaytarishdan **oldin**:

```ts
    // ⚠️ D4: shartnoma faqat brauzerda qolmasin. Mijoz cache tozalasa ham
    // biz contract_id ni bilamiz va Uzumdan holatini so'ray olamiz.
    const { error: cErr } = await supabase.from("uzum_contracts").insert({
      contract_id: pc.contract_id,
      uzum_order_id: pc.order,
      phone: pc.phone,
      total: Number(pc.total),
      period: params.period,
      status: "created",
    });
    if (cErr) console.error("[uzum] uzum_contracts insert xatosi", cErr);
```

- [ ] **Step 2: `uzum-pending.ts:71-83` — zaxira insert natijasini tekshirish**

```ts
  // ⚠️ D1: oldin bu natija UMUMAN tekshirilmasdi — shartnoma imzolangan,
  // ekranda "qabul qilindi", bazada hech narsa yo'q edi.
  const res = await fallbackInsert(...);
  if (res.error) {
    throw new Error(`Buyurtmani saqlab bo'lmadi: ${res.error.message}`);
  }
```

- [ ] **Step 3: `resolvePending` — faqat muvaffaqiyatda tozalash**

`clearPending()` va `localStorage.setItem(savedKey,"1")` ni `try` blokining **muvaffaqiyatli** shoxobchasiga ko'chiring. Xato bo'lsa pending saqlanib qolsin va foydalanuvchiga ko'rsatilsin.

- [ ] **Step 4: Qo'lda sinash**

Dev serverda shartnoma yarating, `uzum_contracts` jadvalida qator paydo bo'lganini tekshiring:

```sql
select * from uzum_contracts order by created_at desc limit 5;
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/uzumnasiya/create-order/route.ts src/lib/uzum-pending.ts
git commit -m "yaxlitlik: shartnoma serverda saqlanadi, insert xatosi endi yutilmaydi (D1, D4)"
```

### Task 4.2: Webhook idempotentligi va Click holat tartibi

**Files:**
- Modify: `src/app/api/uzumnasiya/webhook/route.ts`, `src/app/api/click/complete/route.ts:60-73`

**Spec:** P6, P7

- [ ] **Step 1: Webhook'da dedup**

Yangilashdan oldin joriy holatni tekshiring:

```ts
  // ⚠️ P7: bir xil webhook necha marta kelsa, shuncha Telegram xabari
  // ketardi va admin bitta buyurtmani bir necha marta jo'natishi mumkin edi.
  if (order.payment_status === "paid") {
    return NextResponse.json({ ok: true, note: "allaqachon ishlangan" });
  }
```

- [ ] **Step 2: `click/complete` da tartibni to'g'rilash (P6)**

`payment_status === 'paid'` tekshiruvini `error !== '0'` shartidan **oldinga** ko'chiring.

- [ ] **Step 3: Tekshirish va commit**

```bash
npx tsc --noEmit && npm run build
git add src/app/api/uzumnasiya/webhook/route.ts src/app/api/click/complete/route.ts
git commit -m "yaxlitlik: webhook idempotent, Click holat tartibi to'g'rilandi (P6, P7)"
```

---

# 5-BOSQICH: UX va ogohlantirish

**Spec:** U1, U2, U3, U6

### Task 5.1: Muvaffaqiyatsiz urinishlar haqida Telegram ogohlantirish

**Files:**
- Create: `src/lib/alerts.ts`
- Modify: `src/app/api/uzumnasiya/calculate/route.ts`, `src/app/api/uzumnasiya/create-order/route.ts`, `src/app/api/orders/create/route.ts`

**Interfaces:**
- Consumes: `sendTelegram`, `getAdminChatIds` (`src/lib/telegram.ts`)
- Produces: `alertFailedAttempt(input: { stage: string; phone?: string; totalUzs?: number; reason: string }): Promise<void>`

**Spec:** U6. **Eng katta biznes qiymati** — yo'qolgan mijozga qo'ng'iroq qilish imkoni.

- [ ] **Step 1: `src/lib/alerts.ts` yozish**

```ts
import { getAdminChatIds, sendTelegram } from "@/lib/telegram";
import { formatUzs } from "@/lib/utils";

/**
 * U6: mijoz to'lovda muvaffaqiyatsizlikka uchraganda adminga xabar.
 * Bugungacha bu faqat Vercel logiga tushardi va hech kim ko'rmasdi.
 * ⚠️ Hech qachon throw qilmaydi — ogohlantirish asosiy oqimni buzmasin.
 */
export async function alertFailedAttempt(input: {
  stage: string; phone?: string; totalUzs?: number; reason: string;
}): Promise<void> {
  try {
    const text =
      `⚠️ <b>TO'LOV URINISHI MUVAFFAQIYATSIZ</b>\n\n` +
      `📍 Bosqich: ${input.stage}\n` +
      `📞 Raqam: ${input.phone || "—"}\n` +
      `💰 Summa: ${input.totalUzs ? formatUzs(input.totalUzs) + " so'm" : "—"}\n` +
      `❌ Sabab: ${input.reason}\n\n` +
      `<i>Mijozga qo'ng'iroq qilib yordam bering.</i>`;
    const chats = await getAdminChatIds();
    await Promise.all(chats.map((id) => sendTelegram(id, text)));
  } catch (e) {
    console.error("[alerts] yuborilmadi", e);
  }
}
```

- [ ] **Step 2: `calculate` route'da chaqirish**

Tarif topilmagan holatdagi `console.warn` yonига:

```ts
      await alertFailedAttempt({
        stage: "Uzum tarif tanlash",
        totalUzs: mapped.reduce((s, p) => s + p.price * p.amount, 0),
        reason: list.find((t) => t.error_message)?.error_message || "Mavjud tarif yo'q (limit?)",
      });
```

- [ ] **Step 3: `create-order` va `orders/create` da `catch` bloklariga qo'shish**

- [ ] **Step 4: Qo'lda sinash**

Dev serverda ataylab xato holat yarating (masalan mavjud bo'lmagan `product_id`), Telegramga xabar kelganini tekshiring.

- [ ] **Step 5: Commit**

```bash
git add src/lib/alerts.ts src/app/api
git commit -m "ux: muvaffaqiyatsiz to'lov urinishlari Telegramga yuboriladi (U6)"
```

### Task 5.2: `alert()` bosh berk ko'chalarini yo'q qilish

**Files:**
- Modify: `src/app/cart/page.tsx:165,194`, `src/components/UzumCheckout.tsx`

**Spec:** U1, U2, U3. **Namuna:** `src/components/UzumPaymentResult.tsx:86-120`.

- [ ] **Step 1: `cart/page.tsx` da `alert()` larni holat bilan almashtirish**

`const [checkoutError, setCheckoutError] = useState("")` qo'shing va `alert(...)` o'rniga `setCheckoutError(...)` ishlating.

- [ ] **Step 2: Xato blokini uch tugma bilan ko'rsatish**

```tsx
{checkoutError && (
  <div className="p-4 bg-destructive/8 border border-destructive/25 space-y-3">
    <p className="text-xs text-destructive leading-relaxed">{checkoutError}</p>
    <div className="flex flex-col gap-2">
      <button onClick={() => { setCheckoutError(""); handleCheckout(); }} className="btn btn-block">
        Qayta urinib ko&apos;rish
      </button>
      <a href="tel:+998901234567" className="btn btn-ghost btn-block no-underline">
        Do&apos;kon bilan bog&apos;lanish
      </a>
    </div>
  </div>
)}
```

⚠️ Telefon raqamni `src/config/site.ts` dan oling, kodga yozmang.

- [ ] **Step 3: `UzumCheckout.handleCreate` ga `finally` qo'shish (U3)**

```ts
    } finally {
      setLoading(false);
    }
```

- [ ] **Step 4: Ikki marta bosishning oldini olish (U2)**

`cart/page.tsx` da `handleCheckout` muvaffaqiyatli tugaganda `setLoading(false)` **qilinmasin** — `submitted` holatiga o'tguncha tugma bloklangan qolsin.

- [ ] **Step 5: Qo'lda sinash**

Tarmoqni uzib checkout'ni bosing — `alert` emas, tugmali xato bloki chiqishi kerak.

- [ ] **Step 6: Commit**

```bash
npx tsc --noEmit && npm run build
git add src/app/cart/page.tsx src/components/UzumCheckout.tsx
git commit -m "ux: alert() bosh berk ko'chalari tugmali xato bloklariga almashtirildi (U1, U2, U3)"
```

---

# 6-BOSQICH: Click Pass / QR to'lov

**Spec:** C-bo'limi. ⚠️ **TASHQI BOG'LIQLIK — bu bosqich boshlanishidan oldin bajarilishi shart.**

### Task 6.0: Click bilan shartnoma va hujjat (BLOKER)

Audit tasdiqladi: kod bazasida QR / Click Pass oqimi **umuman yo'q**, noldan qurish kerak.

- [ ] **Step 1: Click menejeriga murojaat qilish**

So'raladigan narsalar:
1. Click Pass / QR to'lov API ga ruxsat (merchant hisobingiz uchun yoqilishi)
2. API hujjati — endpoint manzillari, so'rov/javob formati, imzo sxemasi
3. Test (sandbox) muhiti kalitlari
4. QR kodni kim generatsiya qiladi — Click qaytaradimi (rasm/URL), yoki biz `qr_data` matnidan o'zimiz chizamizmi

- [ ] **Step 2: Javobni hujjatlashtirish**

`docs/click-qr-api.md` faylida yozib qo'ying. **Bu hujjatsiz keyingi vazifalar bajarilmaydi** — spekulyativ kod yozilmasin.

- [ ] **Step 3: Yetishmayotgan env larni to'ldirish (P5)**

`.env.local` va Vercel'ga `CLICK_SERVICE_ID` qo'shing (hozir faqat `NEXT_PUBLIC_` versiyasi bor — shu sababli OFD hech qachon ishlamayapti).

`.env.example` ni barcha kalitlar bilan yangilang:

```
NEXT_PUBLIC_CLICK_SERVICE_ID=
NEXT_PUBLIC_CLICK_MERCHANT_ID=
CLICK_SERVICE_ID=
CLICK_SECRET_KEY=
CLICK_MERCHANT_USER_ID=
ADMIN_SESSION_SECRET=
TELEGRAM_WEBHOOK_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
```

### Task 6.1: OFD narxlarini tuzatish

**Files:**
- Modify: `src/lib/click-merchant.ts:19-46`

**Spec:** P4. **Task 6.0 dan mustaqil — hoziroq bajarish mumkin.**

- [ ] **Step 1: `price_uzs` ni `computeOrderTotal` dan olish**

`item.price_uzs || 0` o'rniga buyurtma qatorlarini `pricing-server` orqali qayta hisoblang. 3.2-vazifadan keyin `orders.items` ichida `price_uzs` **allaqachon bor** (`PricedLine`), shuning uchun:

```ts
    const uzsPrice = Math.round(Number(item.price_uzs));
    if (!uzsPrice) throw new Error(`OFD: ${item.title} uchun narx yo'q`);
```

- [ ] **Step 2: Yig'indi to'lovga tengligini tekshirish**

```ts
  const sumPositions = items.reduce((s, i) => s + i.Price, 0);
  // Click OFD talabi: pozitsiyalar yig'indisi = to'lov summasi
  if (sumPositions !== totalAmountTiyin) {
    console.error("[OFD] yig'indi mos emas", { sumPositions, totalAmountTiyin });
    throw new Error("OFD pozitsiyalari summasi to'lovga teng emas");
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/click-merchant.ts
git commit -m "pul: OFD pozitsiya narxlari to'g'rilandi, yig'indi tekshiruvi qo'shildi (P4)"
```

### Task 6.2: Click QR to'lov oqimi

**Files:**
- Create: `src/lib/click-qr.ts`, `src/app/api/click/qr/route.ts`, `src/components/ClickQrCheckout.tsx`
- Modify: `src/app/cart/page.tsx`

⚠️ **Task 6.0 tugaguncha boshlanmaydi.** Aniq endpoint va imzo sxemasi Click hujjatidan olinadi. Quyidagilar — tuzilma, aniq qiymatlar hujjatdan to'ldiriladi.

- [ ] **Step 1: QR kutubxonasini o'rnatish**

```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: `src/lib/click-qr.ts` — Click QR API mijozi**

`click-merchant.ts:12-16` dagi SHA1 `Auth` header sxemasidan foydalaning (u allaqachon ishlaydi). Endpoint va body Click hujjatidan.

- [ ] **Step 3: `src/app/api/click/qr/route.ts`**

Buyurtmani `computeOrderTotal` bilan yaratadi (Task 3.1), Click'dan QR seansini so'raydi, `qrcode` bilan data-URI rasmga aylantiradi va qaytaradi.

- [ ] **Step 4: `ClickQrCheckout.tsx` — QR ni ko'rsatish + holatni kuzatish**

QR rasmi, muddat taymeri, va har 3 soniyada to'lov holatini so'rash. To'lov tasdiqlanganda `payment-success` ga o'tish.

⚠️ Xato holatida **keyingi qadam tugmasi shart** (U1 qoidasi): "Oddiy Click havolasi bilan to'lash" va "Do'kon bilan bog'lanish".

- [ ] **Step 5: Sandbox'da to'liq sinash**

Test kartasi bilan QR to'lovni boshidan oxirigacha o'tkazing: QR chiqishi → skanerlash → to'lov → `complete` callback → buyurtma `paid`.

- [ ] **Step 6: Commit**

```bash
npx tsc --noEmit && npm run build
git add -A src/lib/click-qr.ts src/app/api/click/qr src/components/ClickQrCheckout.tsx src/app/cart/page.tsx
git commit -m "feat: Click Pass QR to'lov oqimi"
```

---

## Bajarilish tartibi va deploy

| Bosqich | Nima uchun shu tartibda | Deploy |
|---|---|---|
| 0 | Busiz hech narsa kompilyatsiya bo'lmaydi | ❌ Deploy qilinmaydi |
| 1 | Hozir jonli saytda ochiq turgan hujum yo'llari | ✅ **Zudlik bilan** |
| 2 | 3-bosqich `service_role` kalitiga bog'liq | ✅ 1 bilan birga |
| 3 | Pul yo'qotilishining oldini oladi | ✅ 1-2 dan keyin darrov |
| 4 | Ma'lumot yo'qolishini to'xtatadi | ✅ Alohida |
| 5 | Sotuvni oshiradi, xavfsizlik emas | ✅ Alohida |
| 6 | Click javobiga bog'liq | ⏸ Task 6.0 bloklaydi |

## Har bir bosqich oxirida

```bash
npx tsc --noEmit && npm run build && npx vitest run
```

Uchalasi ham o'tmaguncha commit qilinmaydi.

## Self-review qaydlari

- **Spec qamrovi:** audit hisobotidagi barcha KRITIK va YUQORI topilmalar vazifaga biriktirilgan. O'RTA/PAST darajadagi D5 (stok xatolari e'tiborsiz) va U4 (rollback yo'q) rejaga **kiritilmagan** — ular alohida, kichikroq ish sifatida keyinroq bajarilsin.
- **Tekshirilmagan bandlar:** audit T-bo'limidagi 6 ta noaniqlik Task 2.1 va Task 6.0 da aniqlashtiriladi. Task 1.4 (Uzum webhook imzosi) T4 javobiga bog'liq — javob kelguncha "webhook'ga ishonmaslik" yondashuvi ishlatiladi, u har ikki holatda ham xavfsiz.
- **Tip mosligi:** `PricedLine` tipi Task 3.1 da aniqlanadi va 3.2, 4.1, 6.1 vazifalarida shu nom bilan ishlatiladi. `requireAdmin` Task 1.2 da aniqlanadi, 1.2 ning o'zida 4 ta route'da ishlatiladi.
