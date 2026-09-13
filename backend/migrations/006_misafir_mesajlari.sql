-- ============================================================
-- LIONS MECHANIC — 006: Üye olmadan gönderilen iletişim mesajları
-- Supabase Dashboard → SQL Editor'de bu dosyayı çalıştırın.
-- 001 → 002 → 003 → 004 → 005'ten SONRA çalıştırılmalıdır.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- İletişim sayfasından üye olmadan yazan ziyaretçilerin mesajları.
-- Üyelerin sohbetinden (conversations / messages) ayrı tutulur: ziyaretçinin
-- hesabı yoktur, uygulama içinden yanıt alamaz — usta WhatsApp'tan döner.
-- Admin mesaj kutusunda "Üye Değil" rozetiyle, telefona göre gruplanarak listelenir.
CREATE TABLE IF NOT EXISTS guest_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,          -- E.164: +905551112233
  car_info   TEXT,
  content    TEXT NOT NULL,
  read_at    TIMESTAMPTZ,            -- admin okuduğunda dolar
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_messages_created ON guest_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_guest_messages_phone   ON guest_messages (phone, created_at);
CREATE INDEX IF NOT EXISTS idx_guest_messages_unread  ON guest_messages (read_at) WHERE read_at IS NULL;

-- ─── RLS ────────────────────────────────────────────────────
-- Ziyaretçi tabloya doğrudan yazamaz ve okuyamaz; yalnızca aşağıdaki
-- RPC ile mesaj bırakır. Okuma / okundu işareti / silme yalnızca admin.
ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin misafir mesajlarını görebilir" ON guest_messages;
CREATE POLICY "Admin misafir mesajlarını görebilir"
  ON guest_messages FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin misafir mesajını okundu yapabilir" ON guest_messages;
CREATE POLICY "Admin misafir mesajını okundu yapabilir"
  ON guest_messages FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin misafir mesajını silebilir" ON guest_messages;
CREATE POLICY "Admin misafir mesajını silebilir"
  ON guest_messages FOR DELETE
  USING (public.is_admin());

-- ─── Mesaj bırakma (RPC) ────────────────────────────────────
-- Giriş yapmamış ziyaretçi (anon) çağırabilir. Girdiler burada doğrulanır
-- ve kötüye kullanıma karşı basit bir sınır uygulanır:
--   · aynı numaradan saatte en fazla 5 mesaj
--   · tüm ziyaretçilerden saatte en fazla 60 mesaj
CREATE OR REPLACE FUNCTION public.submit_guest_message(
  p_name     text,
  p_phone    text,
  p_content  text,
  p_car_info text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_name    text := btrim(coalesce(p_name, ''));
  v_phone   text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_content text := btrim(coalesce(p_content, ''));
  v_car     text := nullif(btrim(coalesce(p_car_info, '')), '');
BEGIN
  IF v_name = '' OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF v_phone !~ '^\+[0-9]{10,15}$' THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;
  IF v_content = '' OR char_length(v_content) > 2000 THEN
    RAISE EXCEPTION 'invalid_content';
  END IF;
  IF char_length(v_car) > 120 THEN
    RAISE EXCEPTION 'invalid_car';
  END IF;

  IF (SELECT count(*) FROM guest_messages
      WHERE phone = v_phone AND created_at > now() - interval '1 hour') >= 5
     OR
     (SELECT count(*) FROM guest_messages
      WHERE created_at > now() - interval '1 hour') >= 60
  THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  INSERT INTO guest_messages (name, phone, car_info, content)
  VALUES (v_name, v_phone, v_car, v_content);
END; $fn$;

REVOKE ALL ON FUNCTION public.submit_guest_message(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_guest_message(text, text, text, text) TO anon, authenticated;
