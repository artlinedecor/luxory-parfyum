-- 2026-09-25: egasi tasdiqlagan sverka tuzatishlari.

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
--    Kirimlar so'mda saqlanadi, shuning uchun $20 = 242 000 so'm —
--    shunda juftlik to'g'ri yopiladi (haqiqiy rasxod $20).
update transactions
set amount = 242000
where type = 'income' and description = 'Target ' and amount = 20;
