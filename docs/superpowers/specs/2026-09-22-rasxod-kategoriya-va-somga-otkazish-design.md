# Rasxod kategoriyasi va kassa ko'rsatkichlarini so'mga to'liq o'tkazish — Dizayn

**Sana:** 2026-09-22
**Holat:** Foydalanuvchi tasdiqladi, amalga oshirishga tayyor.

## Kontekst (fon)

Bu — kattaroq "moliyaviy arxitekturani to'g'irlash" so'rovining birinchi, eng kichik va eng xavfsiz bosqichi. Foydalanuvchi to'liq ERP darajasidagi qayta qurishni (double-entry ledger, FIFO ombor, Uzum Nasiya sverka, boshlang'ich kapital) so'ragan edi, lekin bosqichma-bosqich, kutubxonalarsiz (medici/dinero.js) yondashuvni tanladi. Boshqa bosqichlar (tovar turi PHYSICAL/VIRTUAL, Uzum sverka, boshlang'ich kapital) bu spec doirasidan TASHQARIDA — alohida-alohida, o'z vaqtida spec qilinadi.

Shu sessiyada avvalroq: `src/lib/accounting.ts` yaratildi (NaN xatosi tuzatildi), Sof Foyda/COGS so'mga to'g'ri aylantirildi, "Jami Savdo" endi `transactions` jadvalidan (ledger-based) hisoblanadi, va 38 ta eski dollar-belgilangan income tranzaksiyasi to'g'irlandi (`migrations/05_fix_dollar_transactions.sql`).

## Hal qilinadigan ikkita muammo

**1. Rasxod kategoriyasi regex bilan (ishonchsiz) aniqlanadi.**

Hozir `capitalExpenses`/`operatingExpenses` ajratish rasxod TAVSIFI matnidan kalit so'z qidirib topiladi:
```
/tavar|tovar|mahsulot|xarid|oldik|yulkira|cargo|kargo|turkiya|prixod/i
```
3 ta faylda (`dashboard/page.tsx`, `dashboard/accounting/page.tsx`, `dashboard/cashflow/page.tsx`) takrorlangan. Agar admin tavsifga shu so'zlardan birini yozmasa (yoki boshqacha yozsa), tovar xaridi "operatsion xarajat" deb noto'g'ri hisoblanadi va Sof Foyda buziladi.

**2. Kassa Qoldig'i / Jami Rasxod hali ham dollar-so'm aralash.**

`kassaBalance`/`savdoQoldiq` = `kassaIncome (so'm) - totalExpenses ($)`. Bugungi fiksdan oldin bu tuzatilmagan edi, chunki `kassaIncome` o'zi eski 38 ta dollar-belgilangan yozuv tufayli ishonchsiz edi. Endi ular tuzatilgani sababli, `kassaIncome` to'liq so'm — shuning uchun `totalExpenses`ni ham so'mga aylantirib ayirish endi to'g'ri va xavfsiz.

Standalone "Jami Rasxod" kartasi ham hali `$` bilan ko'rsatiladi — foydalanuvchi buni ham so'mda ko'rishni xohlaydi.

## Yechim

### 1. Ma'lumotlar bazasi: yangi `expense_category` ustuni

```sql
alter table transactions add column expense_category text;
-- Qiymatlar: 'inventory' (tovar xaridi/aktiv) | 'operating' (operatsion xarajat) | null (income uchun ma'nosiz)
```

Eski rasxod yozuvlari hozirgi regex bilan BIR MARTALIK migratsiya orqali to'ldiriladi (`migrations/06_backfill_expense_category.sql` — regex asosida `inventory`/`operating` belgilanadi, keyin admin xohlasa qo'lda tuzatishi mumkin). Migratsiyadan keyin kod regex'ga EMAS, faqat shu ustunga tayanadi.

### 2. Interfeys: `src/app/dashboard/cashflow/page.tsx`

"Yangi Tranzaksiya" oynasida, "Chiqim (Rasxod)" tanlanganda, qo'shimcha ikkita tugma ko'rinadi (xuddi hozirgi "Kirim/Chiqim" tugmalari kabi uslubda):
- **"Tovar xaridi"** → `expense_category: "inventory"`
- **"Operatsion xarajat"** → `expense_category: "operating"`

"Kirim" tanlanganda bu tugmalar ko'rinmaydi (`expense_category` yuborilmaydi/null qoladi). Majburiy maydon — "Chiqim" uchun birortasi tanlanmasa, forma yubormaydi (frontend validatsiya).

`src/lib/types.ts`dagi `Transaction` interfeysiga `expense_category?: "inventory" | "operating" | null;` qo'shiladi.

### 3. Hisob-kitob: 3 ta dashboard sahifasi

`capitalExpenses`/`operatingExpenses`ni regex bilan emas, ustundan hisoblash:
```ts
const capitalExpenses = expenseTransactions
  .filter(t => t.expense_category === "inventory")
  .reduce((s, t) => s + Number(t.amount), 0);
const operatingExpenses = totalExpenses - capitalExpenses;
```
Sof Foyda formulasi o'zi o'zgarmaydi — faqat kirish ma'lumoti ishonchli bo'ladi.

**Muhim aniqlik:** hozir `capitalExpenses`/`capitalExpense` uchtala faylda ham HISOBLANADI (Sof Foydadan chiqarib tashlash uchun), lekin EKRANDA HECH QAYERDA KO'RSATILMAYDI — foydalanuvchi buni ko'rmoqchi. Shuning uchun har uchala sahifaga (bosh, accounting, cashflow) yangi, alohida "Tikilgan Pul (Tovar xaridi)" kartasi qo'shiladi — `usdToUzs(capitalExpenses)` bilan so'mda, "Operatsion Rasxod" kartasi yonida.

### 4. Kassa Qoldig'i / Jami Rasxodni so'mga aylantirish

3 ta faylda:
- `kassaBalance`/`savdoQoldiq` = `kassaIncome - usdToUzs(totalExpenses)` (hozir: `kassaIncome - totalExpenses`).
- Standalone "Jami Rasxod" kartasi (`${fmt(...)}`) → `{fmt(usdToUzs(...))} so'm`.
- CSV eksportidagi mos qatorlar ham yangilanadi.

`totalExpenses` o'zgaruvchisining ICHKI qiymati (xom, $ dagi) o'zgarmaydi — xuddi bugungi Sof Foyda fiksidagi kabi, faqat EKRANGA CHIQARILGANDA `usdToUzs(totalExpenses)` bilan o'raladi. Ya'ni: standalone "Jami Rasxod" kartasi HAM, kassa balansi HAM — ikkalasi ham endi so'mda ko'rsatiladi; farqi yo'q, faqat ilgari faqat Sof Foydada qilingan aylantirish endi Kassa Qoldig'i va Jami Rasxod kartasiga ham qo'llaniladi.

### Testlash

- `accounting.ts`ga tegishli emas (bu o'zgarish faqat 3 ta dashboard sahifasi + UI formasida) — vitest bilan qamrab bo'lmaydigan UI logikasi, shuning uchun:
  - `npx tsc --noEmit`, `npx vitest run` (mavjud 46 ta test hali ham o'tishi kerak), `npm run build` — har doimgidek.
  - Jonli bazada: migratsiyadan keyin `expense_category` to'g'ri to'ldirilganini tekshirish (eski regex natijasi bilan solishtirib).
  - Dev serverda qo'lda: "Chiqim" qo'shishda tugmalar ko'rinishini, saqlangach kassa balansi to'g'ri o'zgarishini tekshirish.

### Doirasidan tashqarida (keyingi bosqichlar)

- Tovar turi (PHYSICAL/VIRTUAL_CATALOG) taksonomiyasi
- Uzum Nasiya sverka (Pending Settlements, komissiya) — komissiya foizi hali noma'lum
- Boshlang'ich kapital/equity
- Double-entry ledger kutubxonasi (medici/dinero.js) — foydalanuvchi buni ataylab tanlamadi
