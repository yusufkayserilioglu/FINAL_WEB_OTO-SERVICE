# Bakım raporu üst şerit logoları

Bakım raporu / fatura belgesinin (`components/report/MaintenanceReportDoc.vue`)
en üstünde 6 marka logosu için yer var. Şu an hepsi **yer tutucu** (kesikli
çerçeve + marka adı) olarak görünüyor.

## Gerçek logoları eklemek

1. Logo dosyalarını (PNG, tercihen şeffaf zeminli) bu klasöre koyun:
   `bmw.png`, `land-rover.png`, `mini.png`, `audi.png`, `mercedes.png`, `porsche.png`
2. `src/config/report.js` içindeki `reportBrandLogos` dizisinde ilgili satırın
   `src` alanını doldurun:

   ```js
   import bmw from '@/assets/report/bmw.png'
   // ...
   export const reportBrandLogos = [
     { name: 'BMW', src: bmw },
     // ...
   ]
   ```

Başka hiçbir yeri değiştirmeniz gerekmez; belge ve PDF otomatik günceller.
Logo sırası/sayısı da bu diziden yönetilir.
