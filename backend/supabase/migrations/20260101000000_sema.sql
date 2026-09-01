-- ============================================================
-- LIONS MECHANIC — Web Uygulaması Veritabanı Şeması
-- Supabase Dashboard → SQL Editor'de bu dosyayı BAŞTAN SONA çalıştırın.
-- Sıfır bir Supabase projesinde çalışacak şekilde hazırlanmıştır.
-- ============================================================

-- ─── 1. profiles (kullanıcı profilleri) ─────────────────────
-- auth.users tablosuna 1-1 bağlıdır. role: 'user' veya 'admin'
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Eski kurulumlarda role sütunu yoksa ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- ─── 2. cars (kullanıcı araçları) ───────────────────────────
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  plate TEXT NOT NULL,
  km INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. appointments (randevular) ───────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. conversations (mesajlaşma konuşmaları) ──────────────
-- Her kullanıcının admin ile tek bir konuşması olur.
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  unread_admin INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ─── 5. messages (mesajlar) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 6. maintenance_records (bakım kayıtları) ───────────────
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_cost NUMERIC(10, 2),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 7. maintenance_items (bakım kalemleri) ─────────────────
CREATE TABLE IF NOT EXISTS maintenance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  cost NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 8. service_prices (hizmet fiyatları — admin düzenler) ──
CREATE TABLE IF NOT EXISTS service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  min_price NUMERIC(10, 2) NOT NULL,
  max_price NUMERIC(10, 2) NOT NULL,
  icon TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Varsayılan hizmet fiyatları
INSERT INTO service_prices (service_key, title, description, min_price, max_price, icon) VALUES
  ('motor_bakimi',      'Motor Bakımı',        'Kapsamlı motor kontrolü ve bakımı',                 2500,  8000,  'Settings'),
  ('sanziman_servisi',  'Şanzıman Servisi',    'Manuel ve otomatik şanzıman onarımı',               3000,  12000, 'Cog'),
  ('fren_sistemi',      'Fren Sistemi',        'Fren balatası, disk ve ABS sistem kontrolü',        1200,  5000,  'Shield'),
  ('yag_degisimi',      'Yağ Değişimi',        'Motor yağı ve filtre değişimi',                     800,   2500,  'Droplets'),
  ('periyodik_bakim',   'Periyodik Bakım',     'Kapsamlı araç kontrolü ve bakımı',                  2000,  6000,  'CheckCircle'),
  ('lastik_rot_balans', 'Lastik & Rot-Balans', 'Lastik değişimi, rot-balans ve hava basıncı ayarı', 500,   3000,  'Circle')
ON CONFLICT (service_key) DO NOTHING;

-- ============================================================
-- RLS (Row Level Security) Politikaları
-- ============================================================

-- Yardımcı fonksiyon: admin kontrolü
-- SECURITY DEFINER sayesinde RLS'i atlayarak çalışır; profiles
-- politikalarının kendi kendini sorgulayıp sonsuz döngüye girmesini önler.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcı kendi profilini görebilir" ON profiles;
CREATE POLICY "Kullanıcı kendi profilini görebilir"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Kullanıcı kendi profilini oluşturabilir" ON profiles;
CREATE POLICY "Kullanıcı kendi profilini oluşturabilir"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Kullanıcı kendi profilini güncelleyebilir" ON profiles;
CREATE POLICY "Kullanıcı kendi profilini güncelleyebilir"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- cars
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcı kendi araçlarını görebilir" ON cars;
CREATE POLICY "Kullanıcı kendi araçlarını görebilir"
  ON cars FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Kullanıcı araç ekleyebilir" ON cars;
CREATE POLICY "Kullanıcı araç ekleyebilir"
  ON cars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi aracını güncelleyebilir" ON cars;
CREATE POLICY "Kullanıcı kendi aracını güncelleyebilir"
  ON cars FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi aracını silebilir" ON cars;
CREATE POLICY "Kullanıcı kendi aracını silebilir"
  ON cars FOR DELETE
  USING (auth.uid() = user_id);

-- appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcı kendi randevularını görebilir" ON appointments;
CREATE POLICY "Kullanıcı kendi randevularını görebilir"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Kullanıcı randevu oluşturabilir" ON appointments;
CREATE POLICY "Kullanıcı randevu oluşturabilir"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi randevusunu güncelleyebilir" ON appointments;
CREATE POLICY "Kullanıcı kendi randevusunu güncelleyebilir"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Kullanıcı kendi randevusunu silebilir" ON appointments;
CREATE POLICY "Kullanıcı kendi randevusunu silebilir"
  ON appointments FOR DELETE
  USING (auth.uid() = user_id);

-- conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcı kendi konuşmasını görebilir" ON conversations;
CREATE POLICY "Kullanıcı kendi konuşmasını görebilir"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Kullanıcı konuşma oluşturabilir" ON conversations;
CREATE POLICY "Kullanıcı konuşma oluşturabilir"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı veya admin güncelleyebilir" ON conversations;
CREATE POLICY "Kullanıcı veya admin güncelleyebilir"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcı kendi mesajlarını görebilir" ON messages;
CREATE POLICY "Kullanıcı kendi mesajlarını görebilir"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Kullanıcı mesaj gönderebilir" ON messages;
CREATE POLICY "Kullanıcı mesaj gönderebilir"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Mesaj okundu işareti (sender veya admin)" ON messages;
CREATE POLICY "Mesaj okundu işareti (sender veya admin)"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id OR public.is_admin());

-- maintenance_records
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcı kendi bakım kayıtlarını görebilir" ON maintenance_records;
CREATE POLICY "Kullanıcı kendi bakım kayıtlarını görebilir"
  ON maintenance_records FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Sadece admin bakım kaydı oluşturabilir" ON maintenance_records;
CREATE POLICY "Sadece admin bakım kaydı oluşturabilir"
  ON maintenance_records FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Sadece admin bakım kaydını güncelleyebilir" ON maintenance_records;
CREATE POLICY "Sadece admin bakım kaydını güncelleyebilir"
  ON maintenance_records FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Sadece admin bakım kaydını silebilir" ON maintenance_records;
CREATE POLICY "Sadece admin bakım kaydını silebilir"
  ON maintenance_records FOR DELETE
  USING (public.is_admin());

-- maintenance_items
ALTER TABLE maintenance_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Kullanıcı kendi araçlarının bakım kalemlerini görebilir" ON maintenance_items;
CREATE POLICY "Kullanıcı kendi araçlarının bakım kalemlerini görebilir"
  ON maintenance_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_records mr
      WHERE mr.id = record_id
        AND (mr.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Sadece admin bakım kalemi ekleyebilir" ON maintenance_items;
CREATE POLICY "Sadece admin bakım kalemi ekleyebilir"
  ON maintenance_items FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Sadece admin bakım kalemini silebilir" ON maintenance_items;
CREATE POLICY "Sadece admin bakım kalemini silebilir"
  ON maintenance_items FOR DELETE
  USING (public.is_admin());

-- service_prices
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes fiyatları görebilir" ON service_prices;
CREATE POLICY "Herkes fiyatları görebilir"
  ON service_prices FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Sadece admin fiyat güncelleyebilir" ON service_prices;
CREATE POLICY "Sadece admin fiyat güncelleyebilir"
  ON service_prices FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- Realtime (anlık mesajlaşma için)
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
