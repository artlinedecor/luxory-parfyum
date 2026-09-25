-- 2026-09-26: qo'lda kiritilgan (dollar narxli) buyurtmalar summasi
-- so'mga 11 870 kurs bilan o'giriladi. 07-migratsiyadan KEYIN bajariladi.
-- ⚠️ Dashboard'da kursni o'zgartirishdan OLDIN bajaring: keyin bajarilsa,
-- yangi kurs bilan kiritilgan buyurtmalar ham 11 870 ga qaytarib yoziladi.
-- Uzum/Click (dollar narxi yo'q)
-- buyurtmalarga tegmaydi.

-- 1) Har bir qatorning price_uzs'i = price_at_purchase × 11 870
--    (eskilari 12 100 bilan saqlangan).
update orders o
set items = (
  select jsonb_agg(
           case when coalesce((i->>'price_at_purchase')::numeric, 0) > 0
                then jsonb_set(i, '{price_uzs}',
                       to_jsonb(round((i->>'price_at_purchase')::numeric * 11870)))
                else i end
           order by n)
  from jsonb_array_elements(o.items::jsonb) with ordinality as t(i, n)
)
where exists (
  select 1 from jsonb_array_elements(o.items::jsonb) as i
  where coalesce((i->>'price_at_purchase')::numeric, 0) > 0
);

-- 2) total_amount — SO'MDA (7 ta eski buyurtmada dollar turardi: 52, 232…).
update orders o
set total_amount = s.uzs
from (
  select o2.id,
         sum(round(coalesce((i->>'price_at_purchase')::numeric, 0) * 11870)
             * coalesce((i->>'quantity')::numeric, 0)) as uzs
  from orders o2
  cross join lateral jsonb_array_elements(o2.items::jsonb) as i
  group by o2.id
) s
where s.id = o.id and s.uzs > 0;

-- 3) Yetkazilgan buyurtmalarning kirim yozuvi = shu so'm summa.
update transactions t
set amount = o.total_amount
from orders o
where o.status = 'delivered'
  and o.total_amount > 0
  and t.type = 'income'
  and t.description like ('Buyurtma #' || left(o.id::text, 8) || '%');

-- Tekshiruv: 0 qator qaytishi kerak.
select o.id, o.total_amount, t.amount
from orders o
join transactions t on t.type = 'income'
  and t.description like ('Buyurtma #' || left(o.id::text, 8) || '%')
where o.status = 'delivered' and t.amount <> o.total_amount;
