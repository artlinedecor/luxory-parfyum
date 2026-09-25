-- 2026-09-26: dashboard'da kursni ($ → so'm) o'zgartirish imkoniyati.
-- Supabase SQL Editor'da BIR MARTA bajariladi (08 dan keyin).

-- 1) Sozlamalar jadvali. RLS yoqilgan, siyosat yo'q — faqat server
--    (service_role) o'qiydi va yozadi.
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table app_settings enable row level security;

insert into app_settings (key, value) values ('usd_to_uzs', '11870')
on conflict (key) do nothing;

-- 2) Har bir rasxodga kiritilgan paytdagi kurs yoziladi — kurs keyin
--    o'zgarsa eski rasxodlar qayta baholanmaydi.
alter table transactions add column if not exists usd_rate numeric;

-- Eski rasxodlar egasi belgilagan 11 870 da.
update transactions set usd_rate = 11870
where type = 'expense' and usd_rate is null;
