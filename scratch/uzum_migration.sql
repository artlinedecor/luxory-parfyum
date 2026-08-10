-- Uzum Nasiya uchun orders jadvaliga qo'shimchalar
-- Supabase -> SQL Editor -> shu kodni qo'yib "Run" bosing (bir marta).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS uzum_contract_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uzum_order_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uzum_period TEXT;

-- order_type ga 'uzum_nasiya' qiymatini ruxsat berish
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check
  CHECK (order_type IN ('full_payment', 'deposit_50', 'uzum_nasiya'));

-- Shartnoma bo'yicha tez qidirish uchun
CREATE INDEX IF NOT EXISTS idx_orders_uzum_contract ON orders (uzum_contract_id);
