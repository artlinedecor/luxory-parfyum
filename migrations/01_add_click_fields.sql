-- Run this SQL in your Supabase SQL Editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('unpaid', 'waiting', 'paid', 'cancelled')) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS click_trans_id BIGINT,
ADD COLUMN IF NOT EXISTS click_paydoc_id BIGINT;
