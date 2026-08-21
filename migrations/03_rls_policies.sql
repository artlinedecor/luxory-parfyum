-- ============================================================
-- RLS (Row Level Security) — audit X7
-- ============================================================
--
-- ⚠️⚠️  HOZIRCHA ISHGA TUSHIRMANG  ⚠️⚠️
--
-- Sabab: dashboard'ning 5 ta sahifasi (orders, cashflow, accounting,
-- inventory, asosiy) buyurtma va tranzaksiyalarni BRAUZERDAN, anon
-- kalit bilan o'qiydi va yozadi. RLS hozir yoqilsa admin paneli
-- butunlay ishlamay qoladi.
--
-- Tartib:
--   1. Dashboard so'rovlari /api/dashboard/* route'lariga o'tkaziladi
--      (requireAdmin + service_role bilan)
--   2. SUPABASE_SERVICE_ROLE_KEY Vercel'ga qo'shiladi
--   3. Kod deploy qilinadi va tekshiriladi
--   4. FAQAT SHUNDAN KEYIN shu fayl ishga tushiriladi
--
-- ============================================================
-- Tekshirilgan holat (2026-08-21): RLS YOQILMAGAN.
-- Ommaviy anon kalit bilan o'qib bo'ldi:
--   orders 31 qator, users 1, transactions 49, products 218
-- ============================================================

alter table products     enable row level security;
alter table orders       enable row level security;
alter table transactions enable row level security;
alter table users        enable row level security;

-- Katalog ommaviy — brauzer anon kalit bilan o'qiydi.
-- (ProductGrid, catalog/[id], sitemap shu policy'ga tayanadi.)
drop policy if exists "products_public_read" on products;
create policy "products_public_read"
  on products for select
  to anon, authenticated
  using (true);

-- orders / transactions / users uchun policy YOZILMAYDI.
-- Policy yo'q + RLS yoqilgan = anon uchun hamma narsa yopiq.
-- Server route'lari service_role kaliti bilan ishlaydi — u RLS ni
-- chetlab o'tadi, shuning uchun ularga policy kerak emas.

-- Tekshirish:
--   select tablename, rowsecurity from pg_tables where schemaname='public';
--   select * from pg_policies where schemaname='public';
