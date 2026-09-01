import lionsLogo from '@/assets/lions-logo.png'

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
    mapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3057.123456789!2d32.6!3d39.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDU0JzAwLjAiTiAzMsKwMzYnMDAuMCJF!5e0!3m2!1str!2str!4v1234567890',
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
