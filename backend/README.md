# Lions Mechanic — Backend (Supabase)

Bu projenin backend'i **Supabase** üzerinde çalışır. Ayrı bir sunucu kodu (Node, .NET vb.) yoktur; kimlik doğrulama, veritabanı, satır bazlı güvenlik (RLS) ve anlık mesajlaşma (Realtime) tamamen Supabase tarafından sağlanır. Frontend, Supabase'e doğrudan `@supabase/supabase-js` istemcisi ile bağlanır.

## Klasör içeriği

```
backend/
├── README.md                        → bu dosya
└── migrations/
    ├── 001_sema.sql                 → tüm tablolar + RLS politikaları + varsayılan fiyatlar
    ├── 002_profil_arac_randevu.sql  → profil/araç/randevu alan güncellemeleri
    └── 003_mesaj_fotograflari.sql   → mesajlara fotoğraf + Storage bucket'ı ve politikaları
```

> Dosyaları **sırayla** (001 → 002 → 003) çalıştırın. Hepsi yeniden çalıştırmaya güvenlidir.

## Kurulum (özet)

1. https://supabase.com adresinde ücretsiz bir proje oluşturun.
2. Dashboard → **SQL Editor** → `migrations/001_sema.sql` dosyasının içeriğini yapıştırıp **Run** deyin.
3. Dashboard → **Project Settings → API** ekranından `Project URL` ve `anon (publishable) key` değerlerini alın; bunları frontend'deki `.env` dosyasına yazın.

Adım adım tam kurulum (admin hesabı oluşturma dahil) için kök dizindeki **KURULUM.md** dosyasına bakın.

## Şemanın sağladıkları

| Tablo | Amaç |
|---|---|
| `profiles` | Kullanıcı profili (ad, telefon, rol: `user` / `admin`) |
| `cars` | Kullanıcının kayıtlı araçları |
| `appointments` | Randevular (bekliyor / onaylandı / iptal) |
| `conversations` | Kullanıcı ↔ admin konuşmaları (kullanıcı başına 1 adet) |
| `messages` | Sohbet mesajları (Realtime ile anlık iletilir); `content` metin, `image_url` fotoğraf bağlantısı |
| Storage `message-images` | Sohbette paylaşılan fotoğraflar (003 ile oluşturulur; `conversation_id/…` klasör yapısı + RLS) |
| `maintenance_records` | Bakım/servis kayıtları (sadece admin ekler) |
| `maintenance_items` | Bakım kayıtlarındaki işlem kalemleri ve tutarları |
| `service_prices` | Hizmet fiyat aralıkları (herkes okur, sadece admin günceller) |

## Güvenlik modeli

- Tüm tablolarda **RLS aktiftir**: kullanıcılar yalnızca kendi verilerini görür/değiştirir.
- Admin yetkisi `public.is_admin()` fonksiyonu ile kontrol edilir (`profiles.role = 'admin'`).
- Bakım kayıtları ve fiyatlar yalnızca admin tarafından yazılabilir.
- `service_prices` tablosu giriş yapmamış ziyaretçiler tarafından da okunabilir (sitedeki fiyat sayfası için).

## Notlar

- Mobil uygulamaya ait tüm parçalar kaldırıldı: `push_tokens` tablosu, FCM push edge fonksiyonları ve pg_cron bakım hatırlatıcısı bu şemada **yoktur**.
- Anlık mesajlaşma için `messages`, `conversations` ve `appointments` tabloları `supabase_realtime` yayınına eklenir (SQL dosyasının sonunda otomatik yapılır).
