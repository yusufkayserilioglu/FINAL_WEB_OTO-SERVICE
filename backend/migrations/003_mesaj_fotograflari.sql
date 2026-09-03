-- ============================================================
-- LIONS MECHANIC — 003: Mesajlarda fotoğraf paylaşımı
-- Supabase Dashboard → SQL Editor'de bu dosyayı çalıştırın.
-- 001_sema.sql ve 002_profil_arac_randevu.sql'den SONRA çalıştırılmalıdır.
-- Tekrar çalıştırmak güvenlidir.
-- ============================================================

-- ─── messages: fotoğraf bağlantısı ─────────────────────────
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Sadece fotoğraf içeren mesajlar için metin zorunluluğu kaldırılır
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

-- ─── Storage: mesaj fotoğrafları için bucket ────────────────
-- Dosya yolları tahmin edilemez (conversation_id/UUID.jpg) olduğundan
-- ve mesaj RLS'i zaten kimin hangi bağlantıyı gördüğünü kısıtladığından
-- bucket herkese açık okunur biçimde tutulur.
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- Görüntüleme: herkes (public bucket)
DROP POLICY IF EXISTS "Mesaj fotoğrafı görüntüleme" ON storage.objects;
CREATE POLICY "Mesaj fotoğrafı görüntüleme"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-images');

-- Yükleme: yalnızca konuşmanın sahibi ya da admin,
-- ve dosya o konuşmanın klasörüne (conversation_id/...) konmalı
DROP POLICY IF EXISTS "Mesaj fotoğrafı yükleme" ON storage.objects;
CREATE POLICY "Mesaj fotoğrafı yükleme"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id::text = (storage.foldername(name))[1]
          AND c.user_id = auth.uid()
      )
    )
  );

-- Silme: aynı kural (yanlış gönderilen fotoğrafı geri almak için)
DROP POLICY IF EXISTS "Mesaj fotoğrafı silme" ON storage.objects;
CREATE POLICY "Mesaj fotoğrafı silme"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'message-images'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id::text = (storage.foldername(name))[1]
          AND c.user_id = auth.uid()
      )
    )
  );
