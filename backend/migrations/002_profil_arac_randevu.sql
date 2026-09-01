-- ============================================================
-- LIONS MECHANIC — 002: Profil, araç bilgileri ve randevu güncellemeleri
-- Supabase Dashboard → SQL Editor'de bu dosyayı çalıştırın.
-- 001_sema.sql çalıştırıldıktan SONRA çalıştırılmalıdır.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- ─── profiles: e-posta bilgisini de tut ─────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- ─── cars: muayene ve sigorta tarihleri (opsiyonel) ─────────
ALTER TABLE cars ADD COLUMN IF NOT EXISTS inspection_date DATE;  -- TÜVTÜRK muayene
ALTER TABLE cars ADD COLUMN IF NOT EXISTS insurance_date  DATE;  -- sigorta yenileme
ALTER TABLE cars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- km alanı boş bırakılabilsin (kullanıcı bilmiyorsa)
ALTER TABLE cars ALTER COLUMN km DROP NOT NULL;

-- ─── maintenance_records: servis km'si ve sonraki bakım ─────
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS km INT;                 -- servis anındaki km
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS next_service_date DATE; -- sonraki bakım tarihi
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS next_service_km   INT;  -- sonraki bakım km'si

-- ─── appointments: kullanıcının kendi yazdığı hizmet ────────
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS estimated_min NUMERIC(10, 2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS estimated_max NUMERIC(10, 2);

-- ─── conversations: kullanıcı tarafı okunmamış sayacı ───────
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_user INT NOT NULL DEFAULT 0;

-- ─── Admin, müşterinin aracını güncelleyebilsin ─────────────
-- (servis sonrası km bilgisini girmek için)
DROP POLICY IF EXISTS "Admin aracı güncelleyebilir" ON cars;
CREATE POLICY "Admin aracı güncelleyebilir"
  ON cars FOR UPDATE
  USING (public.is_admin());

-- ─── Yararlı indeksler ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cars_user            ON cars (user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user    ON appointments (user_id, date);
CREATE INDEX IF NOT EXISTS idx_messages_conv        ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_maint_records_user   ON maintenance_records (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_maint_records_car    ON maintenance_records (car_id, date DESC);

-- ─── Realtime yayınının açık olduğundan emin ol ─────────────
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Realtime'ın satırları gönderebilmesi için (RLS ile birlikte çalışır)
ALTER TABLE messages REPLICA IDENTITY FULL;
