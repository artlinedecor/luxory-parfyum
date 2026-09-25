-- 2026-09-25: to'liq sverka (egasi bilan kelishilgan).
-- Supabase SQL Editor'da BIR MARTA bajariladi.

-- 1) Boshlang'ich sarmoya savdo (income) sifatida, dollarni so'mga
--    aylantirmasdan (1026) yozilgan edi. Egasi: $1076, kurs 11 870.
--    Sarmoya savdo ham, foyda ham emas — alohida "capital" turi.
update transactions
set type = 'capital',
    amount = 12772120,
    description = 'Dilmurod tikgan pul ($1076 × 11 870)'
where type = 'income' and description ilike 'Dilmurod tikgan pul%';

-- 2) "Target" $20 adashib kirimga yozilgan, keyin $40 rasxod bilan
--    to'g'rilangan ("Target uchun adashb kirimga 20+ qvoribman").
--    Savdoni sun'iy oshirmasligi uchun reklamaga −$20 tuzatish qilinadi:
--    haqiqiy reklama rasxodi $40 − $20 = $20.
update transactions
set type = 'expense',
    amount = -20,
    expense_category = 'ads',
    description = 'Target — adashib kiritilgan kirimni to''g''rilash (−$20)'
where type = 'income' and trim(description) = 'Target' and amount = 20;

-- 3) Rasxod segmentlari — 20 ta yozuv qo'lda ko'rib chiqildi.
--    Faqat "inventory" (atir xaridi) omborga aktiv bo'lib yoziladi,
--    qolganlari darhol foydadan ayiriladi.
update transactions set expense_category = 'ads'
where type = 'expense' and (description ilike '%target%' or description ilike '%taget%');

update transactions set expense_category = 'cargo'
where type = 'expense' and trim(description) in ('turkiyadan yulkira 26kg*6', 'kargo 11 ta atir');

update transactions set expense_category = 'services'
where type = 'expense' and trim(description) in ('ChatGPT', 'YTT Davlat hizmatlari');

-- Egasi: Uzum'ga berilgan depozit, qaytadi — rasxod emas, qaytadigan aktiv.
update transactions set expense_category = 'deposit'
where type = 'expense' and trim(description) = 'Узум насияга бердик';

update transactions set expense_category = 'inventory'
where type = 'expense' and trim(description) in (
  'Tavar oldik',
  'optomchi uchun tovar 11 ta atirga',
  'LOUIS VUITTON Imigination + Testor 38 ml',
  'Amouge guidance nigor Liminsite ham',
  '212 attr',
  'Attirla+kargo 3.2kg'
);

-- 4) Barcha $ summalar uchun bitta kurs — 11 870 (egasi).
--    Narxi dollarda kiritilgan 38 ta buyurtmaning kirim yozuvlari 12 100
--    bilan hisoblangan edi — buyurtmadagi $ narxlardan 11 870 bilan qayta
--    hisoblanadi. Qayta bajarilsa ham natija o'zgarmaydi. So'mda sotilgan
--    (Uzum, Click) buyurtmalarga tegmaydi — ularda $ narx yo'q.
update transactions t
set amount = s.uzs
from (
  select o.id,
         round(sum(coalesce((i->>'price_at_purchase')::numeric, 0)
                   * coalesce((i->>'quantity')::numeric, 0)) * 11870) as uzs
  from orders o
  cross join lateral jsonb_array_elements(o.items::jsonb) as i
  where o.status = 'delivered'
  group by o.id
) s
where s.uzs > 0
  and t.type = 'income'
  and t.description like ('Buyurtma #' || left(s.id::text, 8) || '%');
