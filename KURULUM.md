# Lions Mechanic — Kurulum ve Kullanıcı Sistemini Çalıştırma Rehberi

Bu paket iki klasörden oluşur:

```
lions-mechanic/
├── frontend/   → Vue 3 + Vite web uygulaması (site + kullanıcı paneli + admin paneli)
├── backend/    → Supabase veritabanı şeması ve açıklamalar
└── KURULUM.md  → bu dosya
```

> **ÖNEMLİ — Görseller:** İsteğiniz üzerine pakete hiçbir resim eklenmedi.
> Eski projenizdeki şu klasörleri aynen bu pakete kopyalamanız gerekir, aksi halde `npm run build` görsel importları bulamayacağı için hata verir:
> - Eski `src/assets/` klasörünün tamamı → `frontend/src/assets/` içine
> - Eski `public/` klasörünün içeriği (favicon.svg, logos vb.) → `frontend/public/` içine
>   (public içindeki `firebase-messaging-sw.js` dosyasını **kopyalamayın**, o mobil push kalıntısıdır.)

---

## 1) Supabase projesi (backend)

1. https://supabase.com → ücretsiz hesap açın → **New Project** oluşturun.
2. Sol menü → **SQL Editor** → **New query**.
3. `backend/migrations/` altındaki dosyaları **sırayla** yapıştırıp **Run** deyin:
   1. `001_sema.sql` — tablolar, RLS güvenlik politikaları, varsayılan hizmet fiyatları ve Realtime ayarı.
   2. `002_profil_arac_randevu.sql` — profil/araç/randevu alan güncellemeleri.
   3. `003_mesaj_fotograflari.sql` — mesajlara fotoğraf desteği; `message-images` Storage bucket'ını ve erişim politikalarını **otomatik oluşturur** (ayrıca panelden bir şey açmanıza gerek yok).
   - Hepsi yeniden çalıştırmaya güvenlidir.
4. Sol menü → **Project Settings → API**:
   - `Project URL` değerini kopyalayın.
   - `anon` / `publishable` API key değerini kopyalayın.

### E-posta doğrulama ayarı (önerilen)

Varsayılan olarak Supabase, kayıt olan kullanıcıdan e-posta doğrulaması ister; doğrulama yapılmadan giriş yapılamaz.

- Test aşamasında kolaylık için: **Authentication → Providers → Email → Confirm email** seçeneğini **kapatabilirsiniz** (kayıt olur olmaz giriş yapılır).
- Canlıda açık tutacaksanız: **Authentication → URL Configuration** ekranında `Site URL` alanına sitenizin adresini yazın ki doğrulama linki doğru sayfaya dönsün.

---

## 2) Frontend kurulumu

```bash
cd frontend
```

1. `.env` dosyası oluşturun (örnek olarak `.env.example` dosyasını kopyalayabilirsiniz):

```env
VITE_SUPABASE_URL=https://XXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XXXXXXXXXXXX
```

2. Görselleri kopyalayın (yukarıdaki ÖNEMLİ notuna bakın).

3. Bağımlılıkları kurup çalıştırın:

```bash
npm install
npm run dev        # geliştirme: http://localhost:5173
npm run build      # canlı için dist/ klasörü üretir
```

Netlify'a dağıtıyorsanız `netlify.toml` hazırdır; ortam değişkenlerini (VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY) Netlify panelinden de eklemeyi unutmayın.

---

## 3) Kullanıcı sistemi nasıl çalışır?

- **Kayıt:** `/kayit` sayfasından ad, e-posta, telefon ve şifre ile üye olunur. Kayıt sırasında `profiles` tablosuna `role = 'user'` olarak profil açılır.
- **Giriş:** `/giris` sayfasından yapılır. Normal kullanıcı `/dashboard`'a, admin `/admin`'e yönlendirilir.
- **Kullanıcı paneli** (giriş yapınca):
  - **Ana Sayfa (`/dashboard`)** → kayıtlı araçlar (marka, model, yıl, plaka, km), tahmini bakım maliyetleri, araç ekleme/silme ve profil bilgileri.
  - **Randevular (`/randevular`)** → randevu oluşturma ve iptal.
  - **Mesajlar (`/mesajlar`)** → admin (servis ekibi) ile **anlık** mesajlaşma. Supabase Realtime sayesinde yeni mesajlar sayfa yenilenmeden görünür. Mesajlar gün gün tarih başlıklarıyla ayrılır; hem kullanıcı hem admin **fotoğraf** gönderebilir (fotoğraflar yüklenmeden önce tarayıcıda küçültülür).
  - **Bakım (`/bakim`)** → servise ait bakım/servis geçmişi (kayıtları admin ekler, kullanıcı görüntüler), araca göre filtreleme.

## 4) Admin hesabı oluşturma (ZORUNLU adım)

Admin paneline girebilmek için bir kullanıcının rolünü `admin` yapmanız gerekir:

1. Siteden normal şekilde **üye olun** (örn. kendi e-postanızla).
2. Supabase Dashboard → **SQL Editor**'de şunu çalıştırın (e-postayı kendi e-postanızla değiştirin):

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@ornek.com');
```

3. Siteden çıkış yapıp tekrar giriş yapın → otomatik olarak `/admin` paneline yönlendirilirsiniz.

## 5) Admin paneli özellikleri

| Sayfa | Ne yapar |
|---|---|
| `/admin` | Genel bakış: müşteri sayısı, bekleyen randevu, okunmamış mesaj + hızlı erişim kartları |
| `/admin/mesajlar` | Tüm müşteri konuşmaları listelenir; bir konuşmaya girip müşteriyle **anlık chat** yapılır (tarih başlıkları + fotoğraf gönderme dahil) |
| `/admin/musteriler` | Müşteri listesi ve arama |
| `/admin/musteri/:id` | Müşteri detayı: iletişim bilgileri, **araçları**, **bakım geçmişi**; buradan yeni bakım kaydı ve işlem kalemi (tutarıyla) eklenir |
| `/admin/randevular` | Gelen randevuları onaylama / iptal etme |
| `/admin/fiyatlar` | Sitede görünen hizmet fiyat aralıklarını (min–max) ayrı bir panelden düzenleme |

Fiyatlar `service_prices` tablosunda tutulur; admin `/admin/fiyatlar`'dan güncellediğinde herkese açık `/fiyatlar` sayfası da güncellenir.

---

## 6) Sık karşılaşılan sorunlar

| Sorun | Çözüm |
|---|---|
| `npm run build` görsel hatası veriyor | Eski `src/assets` klasörünü `frontend/src/assets` içine kopyalamadınız. |
| Kayıt oluyor ama giriş yapamıyorum | E-posta doğrulaması açık; gelen kutunuzdaki linke tıklayın ya da Supabase'de "Confirm email"i kapatın. |
| Admin sayfası dashboard'a atıyor | İlgili kullanıcının `profiles.role` değeri `admin` değil. 4. adımdaki SQL'i çalıştırın ve yeniden giriş yapın. |
| Mesajlar anlık düşmüyor | SQL dosyasını tamamen çalıştırdığınızdan emin olun (sondaki Realtime bölümü `messages` tablosunu yayına ekler). Dashboard → Database → Replication'dan da kontrol edebilirsiniz. |
| Fotoğraf gönderilemiyor / "Fotoğraf yüklenemedi" | `003_mesaj_fotograflari.sql` çalıştırılmamış. Dashboard → Storage'da `message-images` bucket'ı ve Storage politikaları bu dosyayla oluşur. |
| Fiyatlar sayfası boş | `001_sema.sql` içindeki varsayılan fiyat INSERT'leri çalışmamış olabilir; SQL Editor'de o bölümü tekrar çalıştırın. |
