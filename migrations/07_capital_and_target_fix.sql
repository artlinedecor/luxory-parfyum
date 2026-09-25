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
where type = 'expense' and trim(description) in ('ChatGPT', 'YTT Davlat hizmatlari', 'Узум насияга бердик');

update transactions set expense_category = 'inventory'
where type = 'expense' and trim(description) in (
  'Tavar oldik',
  'optomchi uchun tovar 11 ta atirga',
  'LOUIS VUITTON Imigination + Testor 38 ml',
  'Amouge guidance nigor Liminsite ham',
  '212 attr',
  'Attirla+kargo 3.2kg'
);
