-- ============================================================
-- RLS (Row Level Security) — audit X7
-- ============================================================
-- ✅ ISHGA TUSHIRISH XAVFSIZ (2026-08-22 dan boshlab).
--
-- Shartlar bajarildi:
--   [x] Dashboard'ning 37 ta so'rovi /api/dashboard/* ga ko'chirildi
--   [x] Uzum buyurtmasi /api/uzumnasiya/finalize orqali yoziladi
--   [x] Server route'lari service_role kalitiga o'tkazildi
--   [x] SUPABASE_SERVICE_ROLE_KEY Vercel'ga qo'shildi
--   [x] Kod deploy qilindi va jonli saytda tekshirildi
--
-- Brauzerdan orders/users/transactions ga tegadigan joy QOLMADI.
-- ============================================================
--
-- TEKSHIRILGAN MUAMMO (2026-08-21):
--   Ommaviy anon kalit bilan (u har bir mijoz brauzeriga tushadi):
--     orders        31 qator  — ism, telefon, manzil, summa
--     users          1 qator
--     transactions  49 qator  — butun kassa tarixi
--   Ya'ni kalitni topgan har kim mijozlar ma'lumotini yuklab olardi.
-- ============================================================


alter table products     enable row level security;
alter table orders       enable row level security;
alter table transactions enable row level security;
alter table users        enable row level security;


-- Katalog OMMAVIY qoladi — brauzer mahsulotlarni anon kalit bilan o'qiydi.
-- Busiz katalog, mahsulot sahifasi va sitemap ishlamay qoladi.
drop policy if exists "products_public_read" on products;
create policy "products_public_read"
  on products for select
  to anon, authenticated
  using (true);


-- orders / transactions / users uchun policy YOZILMAYDI.
-- RLS yoqilgan + policy yo'q = anon uchun hamma narsa yopiq.
-- Server route'lari service_role bilan ishlaydi — u RLS ni chetlab
-- o'tadi, shuning uchun ularga policy kerak emas.


-- ── Tekshirish ──────────────────────────────────────────────
select tablename, rowsecurity from pg_tables where schemaname = 'public';
select tablename, policyname from pg_policies where schemaname = 'public';


-- ============================================================
-- ORQAGA QAYTARISH (agar biror narsa buzilsa):
--
--   alter table orders       disable row level security;
--   alter table transactions disable row level security;
--   alter table users        disable row level security;
--   alter table products     disable row level security;
-- ============================================================
