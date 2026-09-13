// Bakım raporu / fatura belgesinin kimlik bilgileri.
// Fotoğraftaki antetli kâğıda göre dolduruldu — servis düzenleyebilir.

import lionsLogo from '@/assets/lions-logo.png'

export const reportCompany = {
  name:    'Lions Mechanic',
  logo:    lionsLogo,
  address: 'Bahçekapı Mh. 2483. Sk. No: 4/C  Etimesgut / Ankara',
  phone:   '0553 417 1819',
  phone2:  '0539 816 9106',
  email:   'lions.ozelservis@gmail.com',
  web:     'www.ankarabmwozelservis.com',
}


// Belgenin üst şeridindeki 6 marka logosu.
// src null iken yer tutucu (kesikli çerçeve + marka adı) gösterilir.
// Gerçek logolar gelince: dosyayı frontend/src/assets/report/ içine koyun ve
//   src: new URL('../assets/report/bmw.png', import.meta.url).href
// şeklinde girin. Başka hiçbir yeri değiştirmeye gerek yok.
export const reportBrandLogos = [
  { name: 'BMW',           src: new URL('../assets/report/bmw.png', import.meta.url).href },
  { name: 'Land Rover',    src: new URL('../assets/report/land-rover.png', import.meta.url).href },
  { name: 'MINI',          src: new URL('../assets/report/mini.png', import.meta.url).href },
  { name: 'Audi',          src: new URL('../assets/report/audi.png', import.meta.url).href },
  { name: 'Mercedes-Benz', src: new URL('../assets/report/mercedes.png', import.meta.url).href },
  { name: 'Porsche',       src: new URL('../assets/report/porsche.png', import.meta.url).href },
]

// Kalem birimleri — combobox/select için. Serbest metin de kabul edilir.
export const partUnits = [
  'adet', 'litre', 'set', 'takım', 'paket', 'metre', 'saat', 'kg',
]

// Kâğıt görünümü için tabloyu en az bu kadar satıra boş satırla tamamla
export const REPORT_MIN_ROWS = 12
