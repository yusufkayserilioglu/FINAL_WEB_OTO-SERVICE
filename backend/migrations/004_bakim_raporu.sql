-- ============================================================
-- LIONS MECHANIC — 004: Bakım Raporu / Fatura + Parça-Marka Kataloğu
--                       + Randevu-Bakım bağlantısı
-- Supabase Dashboard → SQL Editor'de bu dosyayı çalıştırın.
-- 001 → 002 → 003'ten SONRA çalıştırılmalıdır. Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- ─── 1. part_catalog (parça / işlem kalemi kataloğu) ────────
-- Admin rapor hazırlarken girdiği kalemler burada birikir; sonraki
-- raporlarda aranabilir öneri olarak gelir.
CREATE TABLE IF NOT EXISTS part_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,          -- lower(btrim(name))
  default_unit    TEXT NOT NULL DEFAULT 'adet',
  default_brand   TEXT,
  last_unit_price NUMERIC(12, 2),
  usage_count     INT  NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. brand_catalog (marka kataloğu) ─────────────────────
CREATE TABLE IF NOT EXISTS brand_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  usage_count     INT  NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_part_catalog_usage  ON part_catalog  (usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_brand_catalog_usage ON brand_catalog (usage_count DESC);

-- ─── 3. Başlangıç verisi ──────────────────────────────────
-- normalized_name daima SQL lower(btrim(...)) ile üretilir → RPC ile tutarlı.
INSERT INTO brand_catalog (name, normalized_name)
SELECT v, lower(btrim(v)) FROM unnest(ARRAY[
  'SHELL','RIXENBERG','LEMFÖRDER','FERODO','FRENDO','BMW','MANN','BOSCH','MAHLE',
  'HENGST','SACHS','TRW','ATE','VALEO','CASTROL','MOTUL','LIQUI MOLY',
  'CONTINENTAL','ELRING','SKF','GATES','NGK'
]) AS v
ON CONFLICT (normalized_name) DO NOTHING;

INSERT INTO part_catalog (name, normalized_name, default_unit)
SELECT p.name, lower(btrim(p.name)), p.unit FROM (VALUES
  ('Motor Yağı','litre'),
  ('Yağ Filtresi','adet'),
  ('Hava Filtresi','adet'),
  ('Polen Filtresi','adet'),
  ('Yakıt Filtresi','adet'),
  ('Ön Balata','takım'),
  ('Arka Balata','takım'),
  ('Ön Disk','adet'),
  ('Arka Disk','adet'),
  ('Buji','adet'),
  ('Triger Seti','set'),
  ('Devirdaim','adet'),
  ('V Kayışı','adet'),
  ('Rot Başı','adet'),
  ('Rotil','adet'),
  ('Z Rot','adet'),
  ('Amortisör','adet'),
  ('Tabla Fişeği','adet'),
  ('Turbo Hortumu','adet'),
  ('Kaliper','adet'),
  ('Balata İkaz Fişi','adet'),
  ('Temizlik Spreyi','adet'),
  ('Silecek','takım'),
  ('Akü','adet'),
  ('Tornacı','adet'),
  ('İşçilik','adet')
) AS p(name, unit)
ON CONFLICT (normalized_name) DO NOTHING;

-- ─── 4. maintenance_items — kalem detayları ────────────────
ALTER TABLE maintenance_items ADD COLUMN IF NOT EXISTS brand      TEXT;
ALTER TABLE maintenance_items ADD COLUMN IF NOT EXISTS unit       TEXT NOT NULL DEFAULT 'adet';
ALTER TABLE maintenance_items ADD COLUMN IF NOT EXISTS quantity   NUMERIC(10, 2) NOT NULL DEFAULT 1;
ALTER TABLE maintenance_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE maintenance_items ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- `cost` sütunu = satır tutarı olarak KALIR (eski kod okumaya devam etsin).
-- Bundan sonra store yazar: cost = quantity * unit_price
UPDATE maintenance_items SET unit_price = COALESCE(cost, 0)
  WHERE unit_price = 0 AND cost IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maint_items_record ON maintenance_items (record_id, sort_order);

-- 001'de maintenance_items için UPDATE politikası yoktu — ekleniyor
DROP POLICY IF EXISTS "Sadece admin bakım kalemini güncelleyebilir" ON maintenance_items;
CREATE POLICY "Sadece admin bakım kalemini güncelleyebilir"
  ON maintenance_items FOR UPDATE USING (public.is_admin());

-- ─── 5. maintenance_records — rapor alanları ───────────────
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;
-- Varsayılan 'finalized': migrasyondan önce var olan kayıtlar zaten kullanıcıya
-- görünüyordu. Yeni taslaklar uygulama tarafından açıkça status='draft' ile eklenir.
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT 'finalized';
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS report_no   BIGINT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS title       TEXT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS discount    NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS vat_rate    NUMERIC(5, 2)  NOT NULL DEFAULT 0;   -- fotoğrafta 0
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS subtotal    NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS vat_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Kesinleşme anlık kopyası — geçmiş rapor, araç/müşteri sonradan değişse de sabit kalır
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS customer_name  TEXT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS car_brand TEXT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS car_model TEXT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS car_plate TEXT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS car_year  INT;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

-- status CHECK (ayrı ALTER — sütun eski kurulumda zaten olabilir)
ALTER TABLE maintenance_records DROP CONSTRAINT IF EXISTS maintenance_records_status_check;
ALTER TABLE maintenance_records ADD  CONSTRAINT maintenance_records_status_check
  CHECK (status IN ('draft', 'finalized'));

-- İnsan-dostu rapor numarası için sıra
CREATE SEQUENCE IF NOT EXISTS maintenance_report_no_seq START 1001;

-- ─── 6. appointments — 'completed' durumu ──────────────────
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD  CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- ─── 7. cars — sonraki bakım bilgisi araç üzerinde ─────────
ALTER TABLE cars ADD COLUMN IF NOT EXISTS next_service_date DATE;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS next_service_km   INT;

-- ─── 8. Katalog RLS — yalnızca admin ───────────────────────
ALTER TABLE part_catalog  ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parça kataloğu — admin" ON part_catalog;
CREATE POLICY "Parça kataloğu — admin"
  ON part_catalog FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Marka kataloğu — admin" ON brand_catalog;
CREATE POLICY "Marka kataloğu — admin"
  ON brand_catalog FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─── 9. Yardımcı fonksiyonlar (RPC) ───────────────────────
-- Katalog kaydını ekle/güncelle ve kullanım sayacını artır (atomik).
CREATE OR REPLACE FUNCTION public.upsert_part_catalog(
  p_name text, p_unit text DEFAULT 'adet', p_brand text DEFAULT NULL, p_price numeric DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_name IS NULL OR btrim(p_name) = '' THEN RETURN; END IF;
  INSERT INTO part_catalog (name, normalized_name, default_unit, default_brand, last_unit_price, usage_count)
  VALUES (btrim(p_name), lower(btrim(p_name)), COALESCE(NULLIF(btrim(p_unit), ''), 'adet'),
          NULLIF(btrim(p_brand), ''), p_price, 1)
  ON CONFLICT (normalized_name) DO UPDATE SET
    usage_count     = part_catalog.usage_count + 1,
    default_unit    = COALESCE(NULLIF(btrim(EXCLUDED.default_unit), ''), part_catalog.default_unit),
    default_brand   = COALESCE(EXCLUDED.default_brand, part_catalog.default_brand),
    last_unit_price = COALESCE(EXCLUDED.last_unit_price, part_catalog.last_unit_price);
END; $$;

CREATE OR REPLACE FUNCTION public.upsert_brand_catalog(p_name text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_name IS NULL OR btrim(p_name) = '' THEN RETURN; END IF;
  INSERT INTO brand_catalog (name, normalized_name, usage_count)
  VALUES (btrim(p_name), lower(btrim(p_name)), 1)
  ON CONFLICT (normalized_name) DO UPDATE SET
    usage_count = brand_catalog.usage_count + 1;
END; $$;

-- Sıradaki rapor numarası
CREATE OR REPLACE FUNCTION public.next_report_no()
RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT nextval('maintenance_report_no_seq');
$$;

REVOKE ALL ON FUNCTION public.upsert_part_catalog(text, text, text, numeric)  FROM public, anon;
REVOKE ALL ON FUNCTION public.upsert_brand_catalog(text)                       FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.upsert_part_catalog(text, text, text, numeric) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.upsert_brand_catalog(text)                     TO authenticated;
GRANT  EXECUTE ON FUNCTION public.next_report_no()                               TO authenticated;

-- ─── 10. Yararlı indeksler ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_maint_records_appt ON maintenance_records (appointment_id);
CREATE INDEX IF NOT EXISTS idx_maint_records_status ON maintenance_records (status);
