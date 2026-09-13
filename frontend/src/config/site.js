import lionsLogo from '@/assets/lions-logo.png'

// Harita ve yol tarifi bu adresi birebir arar
const mapsQuery = 'Bahçekapı, 2483. Sk. No:4/C, 06000 Etimesgut/Ankara'

export default {
  name: 'Lions Mechanic',
  tagline: 'Profesyonel Oto Tamir Bakım Servisi',
  logo: lionsLogo,
  contact: {
    address: 'Bahçekapı Mahallesi 2483. Sokak No: 4C, Etimesgut, Ankara',
    phone: '+90 539 816 9106',
    whatsapp: '905398169106',
    instagram: 'https://instagram.com/lionsmechanic',
    hours: 'Her gün açık',
    mapsUrl:   `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
    mapsEmbed: `https://maps.google.com/maps?q=${encodeURIComponent(mapsQuery)}&hl=tr&z=17&output=embed`,
  },
  specialtyBrands: ['bmw', 'porsche', 'audi', 'rangerover'],
  theme: {
    accentColor: '#c9a84c',
  },
  seo: {
    title: 'Lions Mechanic | BMW, Porsche, Audi Uzman Servisi - Ankara',
    description: "Ankara'da BMW, Porsche, Audi ve diğer premium araçlar için uzman oto bakım ve tamir hizmeti. Orijinal parça garantisi, şeffaf fiyatlandırma.",
  },
  stats: [
    { value: 15, suffix: '+', label: 'Yıl Deneyim' },
    { value: 12000, suffix: '+', label: 'Mutlu Müşteri' },
    { value: 4.9, suffix: '/5', label: 'Google Puanı' },
    { value: 8, suffix: '', label: 'Uzman Teknisyen' },
  ],
}
