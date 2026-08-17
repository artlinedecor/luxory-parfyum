-- ═══════════════════════════════════════════════════════════════════
--  Parfyumeriya maydonlari — notalar piramidasi, akkord balansi va
--  aqlli filtrlar uchun.
--
--  Bularsiz kartochkadagi brend/hajm/konsentratsiya faqat mahsulot
--  nomidan taxmin qilinadi, notalar va akkordlar esa umuman
--  ko'rsatilmaydi (soxta ma'lumot chizmaymiz).
--
--  Qo'llash: Supabase -> SQL Editor -> shu faylni ishga tushiring.
--  Hammasi IF NOT EXISTS — qayta ishga tushirsa ham xavfsiz.
-- ═══════════════════════════════════════════════════════════════════

-- ── Asosiy tavsiflovchi maydonlar ─────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fragrance_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume_ml INTEGER;

-- extrait | elixir | edp | edt | edc | cologne
ALTER TABLE products ADD COLUMN IF NOT EXISTS concentration TEXT;

-- Ikkinchi rakurs (quti / boshqa burchak). Bo'sh bo'lsa hover almashmaydi.
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url_2 TEXT;

-- ── Notalar piramidasi ────────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes_top TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes_heart TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes_base TEXT[];

-- ── Akkord balansi ────────────────────────────────────────────────
-- Format: [{"name": "Yog'ochli", "strength": 85}, ...]
ALTER TABLE products ADD COLUMN IF NOT EXISTS accords JSONB;

-- ── Saralash uchun ────────────────────────────────────────────────
-- woody | floral | oriental | fresh | gourmand | citrus | aquatic | spicy | leather
ALTER TABLE products ADD COLUMN IF NOT EXISTS note_families TEXT[];
-- spring | summer | autumn | winter
ALTER TABLE products ADD COLUMN IF NOT EXISTS seasons TEXT[];
-- day | night
ALTER TABLE products ADD COLUMN IF NOT EXISTS time_of_day TEXT[];

-- ── Cheklovlar ────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_concentration_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_concentration_check
      CHECK (concentration IS NULL OR concentration IN
        ('extrait', 'elixir', 'edp', 'edt', 'edc', 'cologne'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_volume_ml_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_volume_ml_check
      CHECK (volume_ml IS NULL OR (volume_ml > 0 AND volume_ml <= 500));
  END IF;
END $$;

-- ── Indekslar (filtrlar tez ishlashi uchun) ───────────────────────
CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_concentration ON products (concentration);
CREATE INDEX IF NOT EXISTS idx_products_note_families ON products USING GIN (note_families);
CREATE INDEX IF NOT EXISTS idx_products_seasons ON products USING GIN (seasons);

COMMENT ON COLUMN products.accords IS
  'Akkord balansi: [{"name": "Yog''ochli", "strength": 85}] — strength 0..100';
