-- ============================================================
-- 04 — CHECK cheklovlari + uzum_contracts jadvali
-- ============================================================
-- ✅ HOZIR ISHGA TUSHIRISH XAVFSIZ.
--
-- Bu migratsiya faqat KENGAYTIRADI: ruxsat etilgan qiymatlar
-- ro'yxatiga yangilarini qo'shadi va bitta yangi jadval yaratadi.
-- Hech narsa o'chirilmaydi, hech qanday mavjud ma'lumot tegilmaydi.
-- ============================================================


-- ── 1. orders.payment_status ────────────────────────────────
-- Kod "pending" yozadi (uzumnasiya/create-order va webhook), lekin
-- eski CHECK unga ruxsat bermasdi — har bir Uzum buyurtmasi 400 bilan
-- rad etilardi.
alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check
  check (payment_status in ('unpaid','waiting','pending','paid','cancelled'));


-- ── 2. orders.status ────────────────────────────────────────
-- Webhook "processing" yozadi.
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending','processing','accepted','delivered','cancelled'));


-- ── 3. orders.order_type ────────────────────────────────────
-- Asl ta'rif (schema.sql:43): ('full_payment', 'deposit_50').
-- ⚠️ deposit_50 SAQLANADI — faqat uzum_nasiya qo'shiladi.
-- ('installment' kodda hech qayerda ishlatilmaydi, qo'shilmaydi.)
alter table orders drop constraint if exists orders_order_type_check;
alter table orders add constraint orders_order_type_check
  check (order_type in ('full_payment','deposit_50','uzum_nasiya'));


-- ── 4. uzum_contracts ───────────────────────────────────────
-- Imzolangan shartnoma faqat mijozning brauzeridagi localStorage'da
-- saqlanardi. Mijoz cache tozalasa yoki boshqa qurilmaga o'tsa —
-- shartnoma bor, buyurtma yo'q, tiklashning imkoni yo'q edi.
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

-- Bu jadvalga faqat server (service_role) kiradi.
alter table uzum_contracts enable row level security;


-- ── 5. Tekshirish ───────────────────────────────────────────
select conname, pg_get_constraintdef(oid) as cheklov
from pg_constraint
where conrelid = 'orders'::regclass and contype = 'c';

select count(*) as uzum_contracts_qatorlari from uzum_contracts;
