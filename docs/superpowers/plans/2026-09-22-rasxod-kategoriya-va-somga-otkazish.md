# Rasxod Kategoriyasi va Kassa Ko'rsatkichlarini So'mga To'liq O'tkazish — Bajarish Rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rasxod kategoriyasini (tovar xaridi/aktiv vs operatsion) regex o'rniga aniq `expense_category` ustuni bilan belgilash, va Kassa Qoldig'i/Jami Rasxod ko'rsatkichlarini (hozir dollar-so'm aralash) to'liq so'mga aylantirib ko'rsatish, jumladan hozirgacha ekranda umuman ko'rinmagan "Tikilgan Pul" (capital expenses) ko'rsatkichini qo'shish.

**Architecture:** Bitta yangi `transactions.expense_category` ustuni (`'inventory' | 'operating' | null`), bir martalik backfill migratsiyasi (hozirgi regex bilan), "Yangi Tranzaksiya" formasiga yangi tanlov tugmalari, va 3 ta dashboard sahifasidagi (`dashboard/page.tsx`, `dashboard/accounting/page.tsx`, `dashboard/cashflow/page.tsx`) hisob-kitob/displey kodini yangilash.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (Postgres, service_role), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-rasxod-kategoriya-va-somga-otkazish-design.md`

## Global Constraints

- Har bir vazifadan keyin: `npx tsc --noEmit` → 0 xato, `npx vitest run` → hammasi PASS (hozirgi 46 ta test buzilmasligi shart), `npm run build` → muvaffaqiyatli.
- Barcha pul summalari SO'M (UZS) da ko'rsatiladi. `usdToUzs()` (src/lib/accounting.ts, avvalgi sessiyada qo'shilgan) mavjud — yangi konvertatsiya funksiyasi YOZILMAYDI, shu import qilinadi.
- To'lov oqimi fayllariga (`src/lib/pricing-server.ts`, `click-merchant.ts`, `uzumnasiya.ts`, `uzum-order-sync.ts`, `/api/click/*`, `/api/uzumnasiya/*`, `/api/orders/*`) HECH BIR vazifa tegmaydi.
- Standalone "Tan Narx (COGS)" ko'rsatkichlari (mahsulot narxining o'zi, `cost_price_usd` asosida) ataylab `$` da qoladi — bu reja doirasida O'ZGARTIRILMAYDI (avvalgi sessiyada shunday qaror qilingan, faqat "Sof Foyda"ga qo'shilganda so'mga aylantiriladi). Faqat RASXOD (`totalExpenses`/`kassaExpense`) va undan hosil bo'ladigan Kassa/Savdo Qoldig'i ko'rsatkichlari bu rejada so'mga o'tkaziladi.
- Kod izohlari — o'zbek tilida, qisqa, "nega"ni tushuntiradigan.

---

## 0-vazifa: Jonli bazadagi hozirgi rasxod tavsiflarini audit qilish (kod yozilmaydi)

Backfill migratsiyasi qanday natija berishini oldindan bilish uchun.

- [ ] **1-qadam: Hozirgi regex natijasini tekshirish**

```bash
cat > ./.tmp-audit-expense-cat.mjs <<'EOF'
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = Object.fromEntries(
  fs.readFileSync(".env.local","utf8").split(/\r?\n/)
    .filter(l=>l.includes("=")&&!l.startsWith("#"))
    .map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth:{persistSession:false,autoRefreshToken:false} });
const { data } = await sb.from("transactions").select("id,amount,description").eq("type","expense");
const re = /tavar|tovar|mahsulot|xarid|oldik|yulkira|cargo|kargo|turkiya|prixod/i;
let inventory = 0, operating = 0;
for (const t of data) {
  if (re.test(t.description || "")) inventory++; else operating++;
}
console.log("Jami rasxod:", data.length, " | inventory (regex):", inventory, " | operating (regex):", operating);
EOF
node ./.tmp-audit-expense-cat.mjs
rm -f ./.tmp-audit-expense-cat.mjs
```

Natijani eslab qoling — 1-vazifadagi backfill shu bilan bir xil sonlarni berishi kerak.

---

## 1-vazifa: DB migratsiyasi — `expense_category` ustuni + backfill

**Fayllar:**
- Create: `migrations/06_add_expense_category.sql`

**Interfaces:** Yo'q (bu DB sxema o'zgarishi)

- [ ] **1-qadam: Migratsiya faylini yozish**

`migrations/06_add_expense_category.sql`:

```sql
-- 2026-09-22: rasxodni "tovar xaridi (aktiv)" / "operatsion xarajat" deb
-- ANIQ belgilash uchun. Ilgari bu description matnidan regex bilan
-- taxmin qilinardi ("tavar", "tovar", "cargo" kabi so'zlar) — ishonchsiz,
-- noto'g'ri so'z ishlatilsa xato tasniflanardi.

alter table transactions add column expense_category text;

-- Bir martalik backfill: eski regex bilan bir xil mantiqda eski
-- yozuvlarni to'ldiramiz (0-vazifadagi audit bilan solishtirib
-- tekshiriladi). Buni keyinroq admin panel orqali qo'lda tuzatish
-- mumkin — bu faqat boshlang'ich nuqta.
update transactions
set expense_category = case
  when type = 'expense' and description ~* '(tavar|tovar|mahsulot|xarid|oldik|yulkira|cargo|kargo|turkiya|prixod)'
    then 'inventory'
  when type = 'expense'
    then 'operating'
  else null
end;
```

- [ ] **2-qadam: Migratsiyani Supabase'da qo'llash**

Bu SQL'ni Supabase Dashboard'ning SQL Editor'ida (yoki `supabase db execute` orqali, agar CLI ulangan bo'lsa) ishga tushiring — bu loyihada avtomatik migratsiya vositasi yo'q (oldingi 5 ta migratsiya ham shu tarzda qo'llangan).

- [ ] **3-qadam: Natijani tekshirish**

```bash
cat > ./.tmp-verify-backfill.mjs <<'EOF'
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const env = Object.fromEntries(
  fs.readFileSync(".env.local","utf8").split(/\r?\n/)
    .filter(l=>l.includes("=")&&!l.startsWith("#"))
    .map(l=>[l.slice(0,l.indexOf("=")),l.slice(l.indexOf("=")+1)]));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth:{persistSession:false,autoRefreshToken:false} });
const { data } = await sb.from("transactions").select("type,expense_category");
const expense = data.filter(t=>t.type==="expense");
console.log("Jami rasxod:", expense.length);
console.log("inventory:", expense.filter(t=>t.expense_category==="inventory").length);
console.log("operating:", expense.filter(t=>t.expense_category==="operating").length);
console.log("null (xato):", expense.filter(t=>!t.expense_category).length);
console.log("income (null bo'lishi kerak):", data.filter(t=>t.type==="income" && t.expense_category).length, "(0 bo'lishi kerak)");
EOF
node ./.tmp-verify-backfill.mjs
rm -f ./.tmp-verify-backfill.mjs
```

`inventory`/`operating` sonlari 0-vazifadagi audit bilan bir xil, `null (xato)` va oxirgi qator 0 bo'lishi kerak.

- [ ] **4-qadam: Commit**

```bash
git add migrations/06_add_expense_category.sql
git commit -m "db: transactions.expense_category ustuni qo'shildi (tovar xaridi vs operatsion)

Rasxod tavsifidan regex bilan taxmin qilish o'rniga, endi ANIQ
kategoriya ustuni bor. Eski yozuvlar hozirgi regex bilan bir
martalik backfill qilindi (Supabase SQL Editor orqali qo'llanadi,
bu loyihada avtomatik migratsiya vositasi yo'q)."
```

---

## 2-vazifa: `Transaction` tipiga `expense_category` qo'shish

**Fayllar:**
- Modify: `src/lib/types.ts`

**Interfaces:**
- Produces: `Transaction.expense_category?: "inventory" | "operating" | null`

- [ ] **1-qadam: Tipni yangilash**

`src/lib/types.ts`dagi `Transaction` interfeysini toping:

```ts
export interface Transaction {
  id: string;
  merchant_id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  created_at: string;
}
```

Yangi maydon qo'shing:

```ts
export interface Transaction {
  id: string;
  merchant_id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  /** Faqat type="expense" uchun ma'noli: "inventory" (tovar xaridi/aktiv) yoki "operating" (operatsion xarajat). */
  expense_category?: "inventory" | "operating" | null;
  created_at: string;
}
```

- [ ] **2-qadam: Tekshirish**

```bash
npx tsc --noEmit
```

0 xato bo'lishi kerak (bu maydon optional, mavjud kodni buzmaydi).

- [ ] **3-qadam: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: Transaction tipiga expense_category maydoni qo'shildi"
```

---

## 3-vazifa: "Yangi Tranzaksiya" formasiga kategoriya tanlovi qo'shish

**Fayllar:**
- Modify: `src/app/dashboard/cashflow/page.tsx`

**Interfaces:**
- Consumes: `Transaction.expense_category` (2-vazifadan)
- Produces: forma holati `expenseCategory: "inventory" | "operating" | ""`

- [ ] **1-qadam: State qo'shish**

`src/app/dashboard/cashflow/page.tsx`da forma state'lari joylashgan joyni toping (`const [amount, setAmount] = useState("");` atrofida, taxminan 15-qator):

```ts
const [amount, setAmount] = useState("");
```

Yoniga qo'shing:

```ts
const [amount, setAmount] = useState("");
const [expenseCategory, setExpenseCategory] = useState<"inventory" | "operating" | "">("");
```

- [ ] **2-qadam: Formaga tugmalarni qo'shish**

Formadagi "Chiqim (Rasxod)" tugmasi tanlanganda ko'rinadigan joy — "Summa ($)" maydonidan OLDIN (forma tuzilishida `type === "expense"` bo'lganda ko'rinadigan qism). `handleSave` funksiyasidan oldingi JSX qismida, `<div className="space-y-1">` bilan boshlanuvchi "Summa ($)" blokini toping:

```jsx
<div className="space-y-1">
  <label className="text-xs text-muted-foreground uppercase tracking-wider">Summa ($)</label>
  <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-lg font-bold text-foreground focus:outline-none focus:border-gold/50" />
</div>
```

Undan OLDIN, faqat `type === "expense"` bo'lganda ko'rinadigan tanlov qo'shing:

```jsx
{type === "expense" && (
  <div className="space-y-1">
    <label className="text-xs text-muted-foreground uppercase tracking-wider">Kategoriya</label>
    <div className="flex gap-2 p-1 bg-secondary rounded-xl">
      <button
        type="button"
        onClick={() => setExpenseCategory("inventory")}
        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
          expenseCategory === "inventory" ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Tovar xaridi
      </button>
      <button
        type="button"
        onClick={() => setExpenseCategory("operating")}
        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
          expenseCategory === "operating" ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Operatsion xarajat
      </button>
    </div>
  </div>
)}
<div className="space-y-1">
  <label className="text-xs text-muted-foreground uppercase tracking-wider">Summa ($)</label>
  <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-lg font-bold text-foreground focus:outline-none focus:border-gold/50" />
</div>
```

- [ ] **3-qadam: `handleSave`da validatsiya va yuborish**

`handleSave` funksiyasini toping:

```ts
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const data = await dashInsert("transactions", [
      { type, amount: Number(amount), description },
    ]);
```

Quyidagicha o'zgartiring (validatsiya qo'shiladi, `expense_category` faqat `type === "expense"` bo'lganda yuboriladi):

```ts
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  if (type === "expense" && !expenseCategory) {
    alert("Iltimos, rasxod kategoriyasini tanlang: Tovar xaridi yoki Operatsion xarajat");
    return;
  }

  try {
    const data = await dashInsert("transactions", [
      {
        type,
        amount: Number(amount),
        description,
        expense_category: type === "expense" ? expenseCategory : null,
      },
    ]);
```

- [ ] **4-qadam: Formani tozalashda `expenseCategory`ni ham tozalash**

`setIsModalOpen(false); setAmount(""); setDescription("");` qatorlarini toping va yoniga qo'shing:

```ts
setIsModalOpen(false);
setAmount("");
setDescription("");
setExpenseCategory("");
```

- [ ] **5-qadam: Tekshirish**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

- [ ] **6-qadam: Commit**

```bash
git add src/app/dashboard/cashflow/page.tsx
git commit -m "feat: rasxod qo'shishda 'Tovar xaridi' / 'Operatsion xarajat' aniq tanlovi

Ilgari kategoriya tavsif matnidan regex bilan taxmin qilinardi.
Endi admin har safar ANIQ tanlaydi — noto'g'ri tasniflanish xavfi
yo'qoladi."
```

---

## 4-vazifa: `dashboard/page.tsx` — kategoriya + so'm konversiyasi

**Fayllar:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `Transaction.expense_category`, `usdToUzs` (`@/lib/accounting`, mavjud)

- [ ] **1-qadam: `capitalExpenses` hisoblashni regex'dan ustunga o'tkazish**

Joriy:

```ts
    // Ajratib olamiz: tovar xaridi/cargo (capital) va operatsion xarajatlar (operating)
    const capitalExpenses = transactions
      .filter(t => t.type === "expense" && t.description && /tavar|tovar|mahsulot|xarid|oldik|yulkira|cargo|kargo|turkiya|prixod/i.test(t.description))
      .reduce((s, t) => s + Number(t.amount), 0);
```

Yangi:

```ts
    // Ajratib olamiz: tovar xaridi (capital/aktiv) va operatsion xarajatlar (operating).
    // ⚠️ Ilgari bu description matnidan regex bilan taxmin qilinardi —
    // endi admin "Yangi Tranzaksiya" formasida ANIQ tanlaydi
    // (transactions.expense_category ustuni, migrations/06).
    const capitalExpenses = transactions
      .filter(t => t.type === "expense" && t.expense_category === "inventory")
      .reduce((s, t) => s + Number(t.amount), 0);
```

- [ ] **2-qadam: Kassa balansini so'mga aylantirish**

Joriy:

```ts
    // ── KASSA ─────────────────────────────────
    const kassaExpense = totalExpenses;
    const kassaBalance = kassaIncome - kassaExpense;

    // Savdoning qoldiq puli = Barcha Kirim - Barcha Chiqim
    const savdoQoldiq = kassaIncome - totalExpenses;
```

Yangi:

```ts
    // ── KASSA ─────────────────────────────────
    // ⚠️ Audit: kassaIncome endi to'liq SO'M (tranzaksiyalar reestridan
    // to'g'ridan-to'g'ri), lekin kassaExpense/totalExpenses hali ham
    // DOLLARDA (tranzaksiyalar jadvalidagi "Yangi Tranzaksiya" formasi
    // rasxodni har doim $ da yozadi). So'mga aylantirmasdan ayirilsa,
    // kichik dollar summasi millionlab so'm oldida deyarli yo'qolib
    // ketardi — Kassa Qoldig'i "deyarli o'zgarmayotgandek" ko'rinardi.
    const kassaExpense = totalExpenses;
    const kassaBalance = kassaIncome - usdToUzs(kassaExpense);

    // Savdoning qoldiq puli = Barcha Kirim - Barcha Chiqim
    const savdoQoldiq = kassaIncome - usdToUzs(totalExpenses);
```

- [ ] **3-qadam: `capitalExpenses`ni return obyektiga qo'shish (allaqachon bor, tekshiring)**

`return { ... }` blokida `capitalExpenses,` qatori allaqachon mavjud (o'zgarish shart emas) — faqat tasdiqlang.

- [ ] **4-qadam: Displey — "Jami Rasxod" kartasi (Row 1)**

Joriy:

```jsx
            {/* Jami Rasxod */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-red-400">${fmt(stats.totalExpenses)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Jami Rasxod</p>
              <p className="text-[10px] text-muted-foreground">kassadan chiqimlar</p>
            </div>
```

Yangi:

```jsx
            {/* Jami Rasxod */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-red-400">{fmt(usdToUzs(stats.totalExpenses))} so&apos;m</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Jami Rasxod</p>
              <p className="text-[10px] text-muted-foreground">kassadan chiqimlar</p>
            </div>
```

- [ ] **5-qadam: Displey — "Savdo Qoldig'i" kartasi (Row 1)**

Joriy:

```jsx
            {/* Savdo Qoldig'i */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className={`text-2xl font-bold ${stats.savdoQoldiq >= 0 ? 'text-blue-400' : 'text-red-400'}`}>${fmt(stats.savdoQoldiq)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Savdo Qoldig&apos;i</p>
              <p className="text-[10px] text-muted-foreground">barcha kirim − chiqim</p>
            </div>
```

Yangi (endi `savdoQoldiq` allaqachon so'mda hisoblangani uchun faqat belgi o'zgaradi):

```jsx
            {/* Savdo Qoldig'i */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className={`text-2xl font-bold ${stats.savdoQoldiq >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{fmt(stats.savdoQoldiq)} so&apos;m</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Savdo Qoldig&apos;i</p>
              <p className="text-[10px] text-muted-foreground">barcha kirim − chiqim</p>
            </div>
```

- [ ] **6-qadam: Yangi "Tikilgan Pul (Tovar xaridi)" kartasini qo'shish**

Row 1 grid'ida "Sotilgan atirlar" kartasidan keyin (grid `lg:grid-cols-6` — yangi karta 7-element bo'lib qo'shiladi, keyingi qatorga tushadi, bu normal):

```jsx
            {/* Sotilgan atirlar */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1 border border-gold/20">
              <p className="text-2xl font-bold text-gradient-gold">{stats.totalSoldItems} ta</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sotilgan Atirlar</p>
              <p className="text-[10px] text-muted-foreground">{stats.totalOrdersCount} ta buyurtma ({stats.totalPendingItems} ta kutilmoqda)</p>
            </div>
```

Shundan keyin qo'shing:

```jsx
            {/* Tikilgan Pul (Tovar xaridi) */}
            <div className="glass-card rounded-xl p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-orange-400">{fmt(usdToUzs(stats.capitalExpenses))} so&apos;m</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tikilgan Pul</p>
              <p className="text-[10px] text-muted-foreground">tovar xaridiga (Sof Foydaga kirmaydi)</p>
            </div>
```

- [ ] **7-qadam: Displey — "Kassa Holati" kartasi (4 ta joy)**

Joriy:

```jsx
            {/* Kassa Holati */}
            <div className="glass-card rounded-2xl p-6 space-y-4 bg-secondary/5 border border-secondary">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">🏦 Kassa & Savdo Qoldig&apos;i</h3>
                <span className={`text-xl font-bold ${stats.kassaBalance >= 0 ? 'text-gradient-gold' : 'text-red-400'}`}>${fmt(stats.kassaBalance)}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jami Kirim (Savdo + Sarmoya)</span>
                  <span className="text-green-400 font-semibold">+${fmt(stats.kassaIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jami Chiqim (Barcha Rasxodlar)</span>
                  <span className="text-red-400 font-semibold">-${fmt(stats.totalExpenses)}</span>
                </div>
                <div className="border-t border-border/50 pt-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-foreground">= Kassa Qoldig&apos;i (Pul qoldig&apos;i)</span>
                  <span className={stats.kassaBalance >= 0 ? 'text-green-400' : 'text-red-400'}>${fmt(stats.kassaBalance)}</span>
                </div>
                <div className="border-t border-border/20 pt-2 flex items-center justify-between text-sm font-bold text-muted-foreground">
                  <span>Savdo Qoldiq Puli (Kirim - Chiqim)</span>
                  <span className={stats.savdoQoldiq >= 0 ? 'text-blue-400' : 'text-red-400'}>${fmt(stats.savdoQoldiq)}</span>
                </div>
              </div>
            </div>
```

Yangi (barcha `$` → so'm, `stats.kassaIncome` va `stats.savdoQoldiq` allaqachon so'mda, `stats.kassaBalance` 2-qadamdan keyin allaqachon so'mda, faqat `stats.totalExpenses` displeyda `usdToUzs()` bilan o'raladi):

```jsx
            {/* Kassa Holati */}
            <div className="glass-card rounded-2xl p-6 space-y-4 bg-secondary/5 border border-secondary">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">🏦 Kassa & Savdo Qoldig&apos;i</h3>
                <span className={`text-xl font-bold ${stats.kassaBalance >= 0 ? 'text-gradient-gold' : 'text-red-400'}`}>{fmt(stats.kassaBalance)} so&apos;m</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jami Kirim (Savdo + Sarmoya)</span>
                  <span className="text-green-400 font-semibold">+{fmt(stats.kassaIncome)} so&apos;m</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jami Chiqim (Barcha Rasxodlar)</span>
                  <span className="text-red-400 font-semibold">-{fmt(usdToUzs(stats.totalExpenses))} so&apos;m</span>
                </div>
                <div className="border-t border-border/50 pt-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-foreground">= Kassa Qoldig&apos;i (Pul qoldig&apos;i)</span>
                  <span className={stats.kassaBalance >= 0 ? 'text-green-400' : 'text-red-400'}>{fmt(stats.kassaBalance)} so&apos;m</span>
                </div>
                <div className="border-t border-border/20 pt-2 flex items-center justify-between text-sm font-bold text-muted-foreground">
                  <span>Savdo Qoldiq Puli (Kirim - Chiqim)</span>
                  <span className={stats.savdoQoldiq >= 0 ? 'text-blue-400' : 'text-red-400'}>{fmt(stats.savdoQoldiq)} so&apos;m</span>
                </div>
              </div>
            </div>
```

- [ ] **8-qadam: Tekshirish**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

- [ ] **9-qadam: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "fix: bosh dashboard'da kassa/rasxod ko'rsatkichlari to'liq so'mga o'tkazildi

Jami Rasxod, Kassa Qoldig'i, Savdo Qoldig'i endi to'g'ri so'mga
aylantirilib ko'rsatiladi (ilgari $ va so'm aralashib, kichik dollar
summasi millionlab so'm oldida yo'qolib ketardi). Yangi 'Tikilgan
Pul' kartasi qo'shildi — ilgari hisoblanardi, lekin ekranda hech
qayerda ko'rsatilmasdi. capitalExpenses endi expense_category
ustunidan aniq olinadi, regex'dan emas."
```

---

## 5-vazifa: `dashboard/accounting/page.tsx` — kategoriya + so'm konversiyasi

**Fayllar:**
- Modify: `src/app/dashboard/accounting/page.tsx`

**Interfaces:**
- Consumes: `Transaction.expense_category`, `usdToUzs` (`@/lib/accounting`)

- [ ] **1-qadam: `capitalExpense` hisoblashni regex'dan ustunga o'tkazish**

Joriy:

```ts
    const capitalExpense = transactions
      .filter(t => t.type === "expense" && t.description && /tavar|tovar|mahsulot|xarid|oldik|yulkira|cargo|kargo|turkiya|prixod/i.test(t.description))
      .reduce((s, t) => s + Number(t.amount), 0);
```

Yangi:

```ts
    // ⚠️ Ilgari regex bilan taxmin qilinardi — endi admin "Yangi
    // Tranzaksiya" formasida ANIQ tanlagan kategoriyaga tayanamiz.
    const capitalExpense = transactions
      .filter(t => t.type === "expense" && t.expense_category === "inventory")
      .reduce((s, t) => s + Number(t.amount), 0);
```

- [ ] **2-qadam: `savdoQoldiq`ni so'mga aylantirish**

Joriy:

```ts
    const realizedProfit = totalSoldRevenue - totalSoldCOGSUzs - operatingExpenseUzs;
    const savdoQoldiq = kassaIncome - kassaExpense;
```

Yangi:

```ts
    const realizedProfit = totalSoldRevenue - totalSoldCOGSUzs - operatingExpenseUzs;
    // ⚠️ kassaIncome so'mda, kassaExpense dollarda — usdToUzs bilan
    // aylantirmasdan ayirilsa, Savdo Qoldig'i deyarli o'zgarmagandek
    // ko'rinardi (kichik $ summa millionlab so'm oldida yo'qolib ketadi).
    const savdoQoldiq = kassaIncome - usdToUzs(kassaExpense);
```

- [ ] **3-qadam: `kassaBalance`ni ham so'mga aylantirish**

Joriy:

```ts
    const kassaIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const kassaExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const kassaBalance = kassaIncome - kassaExpense;
```

Yangi:

```ts
    const kassaIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const kassaExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const kassaBalance = kassaIncome - usdToUzs(kassaExpense);
```

Diqqat: `totalAssets = totalCostInvested + kassaBalance` shu fayldagi keyingi qatorda bor, lekin `totalAssets` ekranda hech qayerda ko'rsatilmaydi (faqat `return` obyektida) — shu sabab bu vazifa doirasida TEGILMAYDI, faqat bilib qo'ying (`totalCostInvested` $ da, `kassaBalance` endi so'mda — bu ishlatilmayotgan qiymat, hozircha muammo emas).

- [ ] **4-qadam: `capitalExpense`ni return obyektiga qo'shish**

`return { ... }` blokini toping va `savdoQoldiq,` qatoridan keyin qo'shing (agar `capitalExpense` allaqachon return qilinmagan bo'lsa):

```ts
    return {
      totalStock,
      totalCostInvested,
      expectedRevenue,
      expectedProfit,
      totalSold,
      totalSoldRevenue,
      totalSoldCOGS,
      realizedProfit,
      capitalExpense,
      savdoQoldiq,
      kassaIncome,
      kassaExpense,
      kassaBalance,
      totalAssets,
    };
```

- [ ] **5-qadam: Displey — "Savdo Qoldig'i" kartasi**

Joriy:

```jsx
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-blue-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{L.savdoQoldiq}</p>
                <p className={`text-2xl font-bold ${stats.savdoQoldiq >= 0 ? 'text-blue-400' : 'text-red-400'}`}>${fmt(stats.savdoQoldiq)}</p>
              </div>
```

Yangi:

```jsx
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-blue-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{L.savdoQoldiq}</p>
                <p className={`text-2xl font-bold ${stats.savdoQoldiq >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{fmt(stats.savdoQoldiq)} so&apos;m</p>
              </div>
```

- [ ] **6-qadam: Yangi "Tikilgan Pul" kartasini qo'shish**

"Tan Narx (COGS)" kartasidan keyin (bu karta $ da qoladi, o'zgarmaydi), "Savdo Qoldig'i" kartasidan OLDIN qo'shing:

```jsx
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-orange-500">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Tikilgan Pul</p>
                <p className="text-2xl font-bold text-orange-400">{fmt(usdToUzs(stats.capitalExpense))} so&apos;m</p>
              </div>
```

(Grid `lg:grid-cols-5` edi — endi 6 ta karta bo'ladi, keyingi qatorga normal tushadi.)

- [ ] **7-qadam: Tekshirish**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

- [ ] **8-qadam: Commit**

```bash
git add src/app/dashboard/accounting/page.tsx
git commit -m "fix: accounting sahifasida Savdo Qoldig'i so'mga o'tkazildi, Tikilgan Pul kartasi qo'shildi

capitalExpense endi expense_category ustunidan aniq olinadi."
```

---

## 6-vazifa: `dashboard/cashflow/page.tsx` — kategoriya + so'm konversiyasi

**Fayllar:**
- Modify: `src/app/dashboard/cashflow/page.tsx`

**Interfaces:**
- Consumes: `Transaction.expense_category`, `usdToUzs` (`@/lib/accounting`)

- [ ] **1-qadam: `capitalExpenses` hisoblashni regex'dan ustunga o'tkazish**

Joriy:

```ts
    // Ajratib olamiz: tovar xaridi/cargo (capital) va operatsion xarajatlar (operating)
    const capitalExpenses = expenseTransactions
      .filter(t => t.description && /tavar|tovar|mahsulot|xarid|oldik|yulkira|cargo|kargo|turkiya|prixod/i.test(t.description))
      .reduce((s, t) => s + Number(t.amount), 0);
```

Yangi:

```ts
    // ⚠️ Ilgari regex bilan taxmin qilinardi — endi admin "Yangi
    // Tranzaksiya" formasida ANIQ tanlagan kategoriyaga tayanamiz.
    const capitalExpenses = expenseTransactions
      .filter(t => t.expense_category === "inventory")
      .reduce((s, t) => s + Number(t.amount), 0);
```

- [ ] **2-qadam: `kassaBalance`ni so'mga aylantirish**

Joriy:

```ts
    const totalIncome = incomeTransactions.reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((s, t) => s + Number(t.amount), 0);
    const kassaBalance = totalIncome - totalExpenses;
```

Yangi:

```ts
    const totalIncome = incomeTransactions.reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((s, t) => s + Number(t.amount), 0);
    // ⚠️ totalIncome so'mda, totalExpenses dollarda — usdToUzs bilan
    // aylantirmasdan ayirilsa, Kassa Qoldig'i deyarli o'zgarmagandek
    // ko'rinardi.
    const kassaBalance = totalIncome - usdToUzs(totalExpenses);
```

- [ ] **3-qadam: `capitalExpenses`ni return obyektiga qo'shish (tekshiring, allaqachon bor)**

`return { ... }` blokida `capitalExpenses` allaqachon yo'q bo'lsa qo'shing — joriy return:

```ts
    return {
      totalSalesRevenue,
      totalCOGS,
      totalCOGSUzs,
      totalIncome,
      totalExpenses,
      operatingExpensesUzs,
      kassaBalance,
      netProfit,
      incomeTransactions,
      expenseTransactions,
      deliveredOrdersCount: deliveredOrders.length,
      totalSoldItems,
    };
```

Yangi (`capitalExpenses,` qo'shildi):

```ts
    return {
      totalSalesRevenue,
      totalCOGS,
      totalCOGSUzs,
      capitalExpenses,
      totalIncome,
      totalExpenses,
      operatingExpensesUzs,
      kassaBalance,
      netProfit,
      incomeTransactions,
      expenseTransactions,
      deliveredOrdersCount: deliveredOrders.length,
      totalSoldItems,
    };
```

- [ ] **4-qadam: Displey — "Jami Rasxod" kartasi**

Joriy:

```jsx
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Jami Rasxod</p>
          <p className="text-2xl font-bold text-red-400">${fmt(accounting.totalExpenses)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{accounting.expenseTransactions.length} ta chiqim</p>
        </div>
```

Yangi:

```jsx
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-red-500/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Jami Rasxod</p>
          <p className="text-2xl font-bold text-red-400">{fmt(usdToUzs(accounting.totalExpenses))} so&apos;m</p>
          <p className="text-[10px] text-muted-foreground mt-1">{accounting.expenseTransactions.length} ta chiqim</p>
        </div>
```

- [ ] **5-qadam: Displey — "Sof Foyda" kartasi yonidagi Kassa Qoldig'i (agar bor bo'lsa)**

`accounting.kassaBalance` ishlatilgan qolgan JSX joyini toping:

```jsx
          <p className={`text-2xl font-bold ${accounting.kassaBalance >= 0 ? 'text-gradient-gold' : 'text-red-400'}`}>${fmt(accounting.kassaBalance)}</p>
```

Yangi (`kassaBalance` 2-qadamdan keyin allaqachon so'mda):

```jsx
          <p className={`text-2xl font-bold ${accounting.kassaBalance >= 0 ? 'text-gradient-gold' : 'text-red-400'}`}>{fmt(accounting.kassaBalance)} so&apos;m</p>
```

- [ ] **6-qadam: Yangi "Tikilgan Pul" kartasini qo'shish**

"Jami Rasxod" kartasidan keyingi karta blokini toping va shundan keyin qo'shing:

```jsx
        <div className="glass-card rounded-xl p-5 border-l-4 border-l-orange-500/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Tikilgan Pul</p>
          <p className="text-2xl font-bold text-orange-400">{fmt(usdToUzs(accounting.capitalExpenses))} so&apos;m</p>
          <p className="text-[10px] text-muted-foreground mt-1">tovar xaridi (Sof Foydaga kirmaydi)</p>
        </div>
```

- [ ] **7-qadam: CSV eksportini yangilash**

Joriy:

```ts
    csv += `Jami Savdo (Tushum),${accounting.totalSalesRevenue} so'm\n`;
    csv += `Tan Narx (COGS),$${accounting.totalCOGS} (${accounting.totalCOGSUzs} so'm)\n`;
    csv += `Jami Rasxodlar,$${accounting.totalExpenses}\n`;
    csv += `Operatsion Rasxodlar (Sof Foydaga kiruvchi),${accounting.operatingExpensesUzs} so'm\n`;
    csv += `Sof Foyda,${accounting.netProfit} so'm\n`;
    csv += `Kassa Qoldigi,$${accounting.kassaBalance}\n\n`;
```

Yangi:

```ts
    csv += `Jami Savdo (Tushum),${accounting.totalSalesRevenue} so'm\n`;
    csv += `Tan Narx (COGS),$${accounting.totalCOGS} (${accounting.totalCOGSUzs} so'm)\n`;
    csv += `Jami Rasxodlar,$${accounting.totalExpenses} (${Math.round(accounting.totalExpenses * 12100)} so'm)\n`;
    csv += `Tikilgan Pul (Tovar xaridi),${Math.round(accounting.capitalExpenses * 12100)} so'm\n`;
    csv += `Operatsion Rasxodlar (Sof Foydaga kiruvchi),${accounting.operatingExpensesUzs} so'm\n`;
    csv += `Sof Foyda,${accounting.netProfit} so'm\n`;
    csv += `Kassa Qoldigi,${accounting.kassaBalance} so'm\n\n`;
```

Pastroqdagi `csv += \`,,Jami: +$${accounting.totalIncome}\n\n\`;` qatorini toping — `totalIncome` allaqachon so'm, faqat belgi tuzatiladi:

Joriy: `csv += \`,,Jami: +$${accounting.totalIncome}\n\n\`;`
Yangi: `csv += \`,,Jami: +${accounting.totalIncome} so'm\n\n\`;`

`csv += \`,,Jami: -$${accounting.totalExpenses}\n\`;` qatorini toping:

Joriy: `csv += \`,,Jami: -$${accounting.totalExpenses}\n\`;`
Yangi: `csv += \`,,Jami: -${Math.round(accounting.totalExpenses * 12100)} so'm\n\`;`

- [ ] **8-qadam: Tekshirish**

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

- [ ] **9-qadam: Commit**

```bash
git add src/app/dashboard/cashflow/page.tsx
git commit -m "fix: cashflow sahifasida Jami Rasxod/Kassa Qoldig'i so'mga o'tkazildi, Tikilgan Pul kartasi qo'shildi

capitalExpenses endi expense_category ustunidan aniq olinadi. CSV
eksportidagi mos qatorlar ham yangilandi."
```

---

## 7-vazifa: Jonli tekshiruv va deploy

**Fayllar:** Yo'q

- [ ] **1-qadam: To'liq tekshiruv**

```bash
npx tsc --noEmit && npx vitest run && npm run build
```

- [ ] **2-qadam: Jonli ma'lumot bilan qo'lda tekshirish**

Dev serverni ishga tushiring (`npm run dev`), admin sifatida kiring, `/dashboard`, `/dashboard/accounting`, `/dashboard/cashflow` sahifalarida:
- "Jami Rasxod", "Kassa Qoldig'i", "Savdo Qoldig'i" endi so'mda (millionlab raqam, `$` yo'q) ko'rsatilishini tasdiqlang.
- "Tikilgan Pul" kartasi barcha 3 sahifada ko'rinishini tasdiqlang.
- Yangi rasxod qo'shishda "Tovar xaridi"/"Operatsion xarajat" tugmalari ko'rinishini, birortasi tanlanmasa forma yubormasligini tekshiring.

- [ ] **3-qadam: Push**

```bash
git push origin HEAD:main
```

Push'dan keyin GitHub Deployments API orqali deploy holatini tekshiring:

```bash
for i in $(seq 1 15); do
  sleep 10
  st=$(curl -s "https://api.github.com/repos/artlinedecor/luxory-parfyum/deployments?per_page=1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',async()=>{const j=JSON.parse(s)[0];const r=await fetch('https://api.github.com/repos/artlinedecor/luxory-parfyum/deployments/'+j.id+'/statuses');const st=await r.json();console.log(st[0]?st[0].state:'pending');})")
  echo "urinish=$i: $st"
  [ "$st" = "success" ] && break
  [ "$st" = "failure" ] && break
done
```

- [ ] **4-qadam: To'lov smoke-test**

```bash
node scripts/smoke-test-payments.mjs
```

Barcha qatorlar ✅ bo'lishi kerak.

## Self-review qaydlari

- **Spec qamrovi:** Spec'dagi 4 ta band (DB ustuni+migratsiya, UI tanlov, hisob-kitob yangilash, so'm konversiyasi) — barchasi 1-6 vazifalarga taqsimlangan. "Tikilgan Pul" kartasi (spec'ga self-review paytida qo'shilgan talab) — 4, 5, 6-vazifalarning har birida bor.
- **Placeholder yo'q:** Har bir kod bloki to'liq, nusxalab ishlatsa bo'ladigan holda yozilgan (joriy va yangi holat solishtirilgan).
- **Tip mosligi:** `expense_category: "inventory" | "operating" | null` — 2-vazifada e'lon qilingan, 3-6 vazifalarda xuddi shu qiymatlar (`"inventory"`, `"operating"`) ishlatilgan, farq yo'q.
- **DB migratsiyasi qo'lda qo'llanadi** (1-vazifa, 2-qadam) — bu loyihada avtomatik migratsiya vositasi yo'q (oldingi 5 ta migratsiya ham shunday), shuning uchun bu kutilgan holat, xato emas.
