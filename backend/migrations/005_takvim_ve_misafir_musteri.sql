-- ============================================================
-- LIONS MECHANIC — 005: Randevu takvimi (saat çakışması) +
--                       kayıtsız (misafir) müşteri oluşturma
-- Supabase Dashboard → SQL Editor'de bu dosyayı çalıştırın.
-- 001 → 002 → 003 → 004'ten SONRA çalıştırılmalıdır.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- ============================================================
-- BÖLÜM 1 — RANDEVU TAKVİMİ
-- ============================================================

-- Takvimin gün/hafta aralığı ve "aynı saatte başka randevu var mı?"
-- sorgusu için indeksler.
CREATE INDEX IF NOT EXISTS idx_appointments_date_time  ON appointments (date, time);
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments (status, date);

-- Aynı gün + aynı SAAT DİLİMİNDEKİ diğer randevular (iptal edilenler hariç).
-- Takvim randevuları saatlik kutulara ayırdığı için karşılaştırma da saat
-- bazlıdır: 09:00 ile 09:30 aynı saat dilimi sayılır.
-- Admin bir randevuyu onaylamadan önce çakışma var mı diye buraya bakar.
-- SECURITY DEFINER DEĞİL: RLS geçerlidir, yani tümünü yalnızca admin görür.
CREATE OR REPLACE FUNCTION public.appointments_at_slot(
  p_date       date,
  p_time       time,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id             uuid,
  status         text,
  service_type   text,
  slot_time      time,
  note           text,
  customer_name  text,
  customer_phone text,
  car_label      text
)
LANGUAGE sql
STABLE
SET search_path = public
AS $fn$
  SELECT
    a.id,
    a.status,
    a.service_type,
    a.time,
    a.note,
    p.name  AS customer_name,
    p.phone AS customer_phone,
    CASE WHEN c.id IS NULL THEN NULL
         ELSE upper(c.brand) || ' ' || c.model || ' · ' || c.plate
    END AS car_label
  FROM appointments a
  LEFT JOIN profiles p ON p.id = a.user_id
  LEFT JOIN cars     c ON c.id = a.car_id
  WHERE a.date = p_date
    AND extract(hour FROM a.time) = extract(hour FROM p_time)
    AND a.status <> 'cancelled'
    AND (p_exclude_id IS NULL OR a.id <> p_exclude_id)
  ORDER BY a.status, a.created_at;
$fn$;

GRANT EXECUTE ON FUNCTION public.appointments_at_slot(date, time, uuid) TO authenticated;

-- ============================================================
-- BÖLÜM 2 — KAYITSIZ (MİSAFİR) MÜŞTERİ
-- ============================================================
-- Servise gelen ama uygulamaya üye olmamış müşteri için admin,
-- SMS doğrulaması olmadan anında müşteri kaydı açabilsin.
-- Bu kayıtlar normal müşteri listesinde görünür; araç, randevu ve
-- bakım raporu tarafında normal müşteri gibi davranır.

-- ─── 2.1 profiles.id artık auth.users'a bağlı olmak zorunda değil ───
-- Misafir müşterinin auth.users satırı yoktur; bu yüzden FK kaldırılır.
-- Silme davranışı aşağıdaki trigger ile korunur.
-- Kısıt adı kurulumdan kuruluma değişebildiği için ada göre değil,
-- "profiles → auth.users" ilişkisine göre bulunup kaldırılır.
DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class      src ON src.oid = con.conrelid
    JOIN pg_namespace  sn  ON sn.oid  = src.relnamespace
    JOIN pg_class      tgt ON tgt.oid = con.confrelid
    JOIN pg_namespace  tn  ON tn.oid  = tgt.relnamespace
    WHERE con.contype = 'f'
      AND sn.nspname = 'public' AND src.relname = 'profiles'
      AND tn.nspname = 'auth'   AND tgt.relname = 'users'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $do$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by UUID;   -- kaydı açan admin
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes      TEXT;   -- admin notu

CREATE INDEX IF NOT EXISTS idx_profiles_phone   ON profiles (phone);
CREATE INDEX IF NOT EXISTS idx_profiles_walk_in ON profiles (is_walk_in) WHERE is_walk_in;

-- FK kalktığı için ON DELETE CASCADE'in yerini trigger alır:
-- auth.users'tan bir kullanıcı silinirse profili de silinir.
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END; $fn$;

-- auth şemasında trigger oluşturma yetkisi olmayan kurulumlarda
-- migrasyon durmasın diye hata yutulur.
DO $do$
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users';
  EXECUTE 'CREATE TRIGGER on_auth_user_deleted AFTER DELETE ON auth.users
           FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deleted()';
EXCEPTION WHEN insufficient_privilege OR undefined_table THEN
  RAISE NOTICE 'auth.users trigger olusturulamadi — profil silme el ile yapilmali.';
END $do$;

-- ─── 2.2 RLS: admin müşteri profili yönetebilsin ────────────
DROP POLICY IF EXISTS "Admin müşteri profili oluşturabilir" ON profiles;
CREATE POLICY "Admin müşteri profili oluşturabilir"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin müşteri profilini güncelleyebilir" ON profiles;
CREATE POLICY "Admin müşteri profilini güncelleyebilir"
  ON profiles FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin yalnızca kendi açtığı misafir kayıtlarını silebilir;
-- gerçek (auth) hesaplar bu yolla silinemez.
DROP POLICY IF EXISTS "Admin misafir kaydını silebilir" ON profiles;
CREATE POLICY "Admin misafir kaydını silebilir"
  ON profiles FOR DELETE
  USING (public.is_admin() AND is_walk_in);

-- Misafir müşteri giriş yapamaz; aracını admin ekler/siler.
DROP POLICY IF EXISTS "Admin araç ekleyebilir" ON cars;
CREATE POLICY "Admin araç ekleyebilir"
  ON cars FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin aracı silebilir" ON cars;
CREATE POLICY "Admin aracı silebilir"
  ON cars FOR DELETE
  USING (public.is_admin());

-- ─── 2.3 Misafir müşteri oluşturma (RPC) ───────────────────
-- Tek işlemde profil + (isteğe bağlı) araç oluşturur.
-- Telefon doğrulaması YOKTUR; yalnızca admin çağırabilir.
CREATE OR REPLACE FUNCTION public.admin_create_walk_in_customer(
  p_name      text,
  p_phone     text DEFAULT NULL,
  p_email     text DEFAULT NULL,
  p_note      text DEFAULT NULL,
  p_car_brand text DEFAULT NULL,
  p_car_model text DEFAULT NULL,
  p_car_year  int  DEFAULT NULL,
  p_car_plate text DEFAULT NULL,
  p_car_km    int  DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_name   text := btrim(coalesce(p_name, ''));
  v_phone  text := nullif(btrim(coalesce(p_phone, '')), '');
  v_email  text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_brand  text := nullif(btrim(coalesce(p_car_brand, '')), '');
  v_model  text := nullif(btrim(coalesce(p_car_model, '')), '');
  v_plate  text := nullif(upper(btrim(coalesce(p_car_plate, ''))), '');
  v_id     uuid;
  v_car_id uuid;
  v_dupe   record;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING HINT = 'Bu islemi yalnizca yonetici yapabilir.';
  END IF;

  IF v_name = '' THEN
    RAISE EXCEPTION 'name_required' USING HINT = 'Musteri adi zorunludur.';
  END IF;

  -- Aynı telefon başka bir müşteride kayıtlıysa yeni kayıt açma,
  -- mevcut kaydı bildir (uygulama kullanıcıyı o kayda yönlendirir).
  IF v_phone IS NOT NULL THEN
    SELECT id, name, is_walk_in INTO v_dupe
    FROM profiles WHERE phone = v_phone LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'duplicate',  true,
        'profile_id', v_dupe.id,
        'name',       v_dupe.name,
        'is_walk_in', v_dupe.is_walk_in
      );
    END IF;
  END IF;

  v_id := gen_random_uuid();

  INSERT INTO profiles (id, name, phone, email, role, is_walk_in, created_by, notes)
  VALUES (v_id, v_name, v_phone, v_email, 'user', true, auth.uid(),
          nullif(btrim(coalesce(p_note, '')), ''));

  -- Araç bilgisi verildiyse birlikte oluştur (bakım raporu araç ister)
  IF v_brand IS NOT NULL AND v_plate IS NOT NULL THEN
    INSERT INTO cars (user_id, brand, model, year, plate, km)
    VALUES (v_id, v_brand, coalesce(v_model, '-'),
            coalesce(p_car_year, extract(year FROM now())::int), v_plate, p_car_km)
    RETURNING id INTO v_car_id;
  END IF;

  RETURN jsonb_build_object('duplicate', false, 'profile_id', v_id, 'car_id', v_car_id);
END; $fn$;

REVOKE ALL ON FUNCTION public.admin_create_walk_in_customer(text, text, text, text, text, text, int, text, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_walk_in_customer(text, text, text, text, text, text, int, text, int) TO authenticated;

-- ─── 2.4 Misafir kaydını gerçek hesaba devretme ────────────
-- Misafir müşteri sonradan aynı telefonla üye olursa; admin'in girdiği
-- araç / randevu / bakım raporları yeni hesabına taşınır ve misafir kaydı
-- silinir. Böylece aynı kişi listede iki kez görünmez.
-- Kullanıcı kendi oturumuyla çağırır ve yalnızca KENDİ numarasına eşleşen
-- misafir kaydını devralabilir.
CREATE OR REPLACE FUNCTION public.claim_walk_in_profile(p_phone text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_uid     uuid := auth.uid();
  v_phone   text;
  v_src     uuid;
  v_src_cnv uuid;
  v_dst_cnv uuid;
  v_cars    int := 0;
  v_appts   int := 0;
  v_records int := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Telefon önce oturumdan doğrulanır; parametre yalnızca yedektir.
  SELECT nullif(btrim(coalesce(u.phone, '')), '') INTO v_phone
  FROM auth.users u WHERE u.id = v_uid;

  -- auth.users telefonu '+' olmadan tutar, profiles ise E.164 saklar
  IF v_phone IS NOT NULL AND left(v_phone, 1) <> '+' THEN
    v_phone := '+' || v_phone;
  END IF;

  IF v_phone IS NULL THEN
    v_phone := nullif(btrim(coalesce(p_phone, '')), '');
    -- Parametreyle gelen numara kullanıcının kendi profilindekiyle eşleşmeli
    IF v_phone IS NULL
       OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_uid AND phone = v_phone)
    THEN
      RETURN jsonb_build_object('claimed', false);
    END IF;
  END IF;

  SELECT id INTO v_src
  FROM profiles
  WHERE is_walk_in AND phone = v_phone AND id <> v_uid
  ORDER BY created_at
  LIMIT 1;

  IF v_src IS NULL THEN
    RETURN jsonb_build_object('claimed', false);
  END IF;

  UPDATE cars                SET user_id = v_uid WHERE user_id = v_src;
  GET DIAGNOSTICS v_cars = ROW_COUNT;
  UPDATE appointments        SET user_id = v_uid WHERE user_id = v_src;
  GET DIAGNOSTICS v_appts = ROW_COUNT;
  UPDATE maintenance_records SET user_id = v_uid WHERE user_id = v_src;
  GET DIAGNOSTICS v_records = ROW_COUNT;

  -- conversations.user_id UNIQUE — hedefte konuşma varsa mesajlar taşınır
  SELECT id INTO v_src_cnv FROM conversations WHERE user_id = v_src;
  IF v_src_cnv IS NOT NULL THEN
    SELECT id INTO v_dst_cnv FROM conversations WHERE user_id = v_uid;
    IF v_dst_cnv IS NULL THEN
      UPDATE conversations SET user_id = v_uid WHERE id = v_src_cnv;
    ELSE
      UPDATE messages SET conversation_id = v_dst_cnv WHERE conversation_id = v_src_cnv;
      DELETE FROM conversations WHERE id = v_src_cnv;
    END IF;
  END IF;

  -- Yeni profildeki boş alanları misafir kaydından tamamla
  UPDATE profiles dst SET
    email = coalesce(dst.email, src.email),
    notes = coalesce(dst.notes, src.notes)
  FROM profiles src
  WHERE dst.id = v_uid AND src.id = v_src;

  DELETE FROM profiles WHERE id = v_src;

  RETURN jsonb_build_object(
    'claimed', true, 'cars', v_cars, 'appointments', v_appts, 'records', v_records
  );
END; $fn$;

REVOKE ALL ON FUNCTION public.claim_walk_in_profile(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_walk_in_profile(text) TO authenticated;
