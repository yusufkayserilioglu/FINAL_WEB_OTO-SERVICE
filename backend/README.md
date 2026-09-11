# Lions Mechanic — Backend (Supabase)

Bu projenin backend'i **Supabase** üzerinde çalışır. Ayrı bir sunucu kodu (Node, .NET vb.) yoktur; kimlik doğrulama, veritabanı, satır bazlı güvenlik (RLS) ve anlık mesajlaşma (Realtime) tamamen Supabase tarafından sağlanır. Frontend, Supabase'e doğrudan `@supabase/supabase-js` istemcisi ile bağlanır.

## Klasör içeriği

```
backend/
├── README.md                        → bu dosya
└── migrations/
    ├── 001_sema.sql                 → tüm tablolar + RLS politikaları + varsayılan fiyatlar
    ├── 002_profil_arac_randevu.sql  → profil/araç/randevu alan güncellemeleri
    ├── 003_mesaj_fotograflari.sql   → mesajlara fotoğraf + Storage bucket'ı ve politikaları
    ├── 004_bakim_raporu.sql         → bakım raporu/fatura alanları + parça-marka kataloğu + randevu-bakım bağlantısı
    └── 005_takvim_ve_misafir_musteri.sql → randevu takvimi (saat çakışması) + kayıtsız (misafir) müşteri kaydı
```

> Dosyaları **sırayla** (001 → 002 → 003 → 004 → 005) çalıştırın. Hepsi yeniden çalıştırmaya güvenlidir.

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
| `maintenance_records` | Bakım/servis kayıtları + rapor/fatura alanları (durum: `draft` / `finalized`, `report_no`, KDV/iskonto/toplamlar, kesinleşme anlık kopyası, `appointment_id` bağlantısı) — sadece admin ekler |
| `maintenance_items` | Bakım kayıtlarındaki kalemler (marka, birim, miktar, birim fiyat, satır tutarı, sıra) |
| `part_catalog` / `brand_catalog` | Admin'in girdiği parça/işlem ve marka adları — sonraki raporlarda aranabilir öneri (yalnız admin) |
| `profiles.is_walk_in` | Admin'in SMS doğrulaması olmadan açtığı **kayıtsız (misafir) müşteri** kaydı (005) |
| `service_prices` | Hizmet fiyat aralıkları (herkes okur, sadece admin günceller) |

Onaylı bir randevu, tarihi geçince admin panelinden "Rapor Oluştur" ile bir
`maintenance_records` taslağına dönüşür (`appointment_id` ile bağlanır); rapor
kesinleşince randevu `completed` olur, aracın `km` ve `next_service_date/km`
bilgileri güncellenir.

## Güvenlik modeli

- Tüm tablolarda **RLS aktiftir**: kullanıcılar yalnızca kendi verilerini görür/değiştirir.
- Admin yetkisi `public.is_admin()` fonksiyonu ile kontrol edilir (`profiles.role = 'admin'`).
- Bakım kayıtları ve fiyatlar yalnızca admin tarafından yazılabilir.
- `service_prices` tablosu giriş yapmamış ziyaretçiler tarafından da okunabilir (sitedeki fiyat sayfası için).

## Notlar

- Mobil uygulamaya ait tüm parçalar kaldırıldı: `push_tokens` tablosu, FCM push edge fonksiyonları ve pg_cron bakım hatırlatıcısı bu şemada **yoktur**.
- Anlık mesajlaşma için `messages`, `conversations` ve `appointments` tabloları `supabase_realtime` yayınına eklenir (SQL dosyasının sonunda otomatik yapılır).

## Randevu takvimi ve kayıtsız müşteri (005)

**Takvim** — Admin panelinin altındaki takvim, seçilen günü saat saat gösterir;
dolu saatler işaretlenir, aynı saatte birden fazla onaylı randevu varsa saat
"çakışma" olarak kırmızı görünür. Admin bir randevuyu **onaylarken**
`appointments_at_slot(date, time, exclude_id)` fonksiyonu aynı gün + aynı
saatteki diğer randevuları döndürür; varsa "yine de onaylıyor musunuz?" diye
sorulur. Onay dışındaki işlemlerde (iptal, rapor) soru sorulmaz.

**Kayıtsız müşteri** — Servise gelen ama üye olmayan müşteri için admin,
`admin_create_walk_in_customer(...)` ile telefon doğrulaması olmadan anında
müşteri (ve isterse aracını) oluşturur. Kayıt normal müşteri listesine düşer;
araç, randevu ve bakım raporu tarafında normal müşteri gibi davranır.

Bunun için `profiles.id` üzerindeki `auth.users` yabancı anahtarı kaldırılmıştır
(misafir müşterinin auth kaydı yoktur). Silme davranışı `auth.users` üzerindeki
`on_auth_user_deleted` trigger'ı ile korunur.

Misafir müşteri sonradan **aynı telefonla üye olursa**, uygulama kayıt anında
`claim_walk_in_profile()` çağırır: admin'in girdiği araç / randevu / bakım
raporları yeni hesaba taşınır ve misafir kaydı silinir; böylece aynı kişi
listede iki kez görünmez.
