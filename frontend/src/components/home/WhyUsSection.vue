<template>
  <section class="section-padding" style="background: #0d0d0d;">
    <div class="container-custom">
      <div class="text-center mb-14" v-scroll-reveal>
        <p class="text-gold text-xs font-mono tracking-[0.3em] uppercase mb-3">Neden Bizi Tercih Etmelisiniz</p>
        <h2 class="font-display font-black text-4xl md:text-5xl text-white">
          Farkımız Ne?
        </h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="(item, i) in features"
          :key="item.title"
          v-scroll-reveal="{ delay: i * 80 }"
          class="group p-7 rounded-2xl border border-white/5 transition-all duration-500
                 hover:border-gold/20 hover:-translate-y-1"
          style="background: rgba(255,255,255,0.02);"
        >
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5
                      bg-gold/10 border border-gold/20
                      group-hover:bg-gold/20 transition-all duration-300">
            <component :is="item.icon" :size="22" class="text-gold" />
          </div>
          <h3 class="font-display font-bold text-white text-base mb-3">{{ item.title }}</h3>
          <p class="text-gray-500 text-sm leading-relaxed">{{ item.desc }}</p>
        </div>
      </div>

      <!-- Öne çıkan: Online Müşteri Paneli -->
      <div
        v-scroll-reveal="{ delay: 200 }"
        class="mt-5 rounded-2xl border border-gold/25 p-7 md:p-10 flex flex-col md:flex-row gap-8 md:items-center"
        style="background: linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(255,255,255,0.02) 100%);"
      >
        <!-- Sol: başlık -->
        <div class="flex-shrink-0 flex items-start gap-4 md:w-64">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      bg-gold/15 border border-gold/30">
            <MonitorSmartphone :size="22" class="text-gold" />
          </div>
          <div>
            <span class="text-gold text-[10px] font-mono tracking-[0.2em] uppercase">Sadece Bizde</span>
            <h3 class="font-display font-bold text-white text-lg mt-0.5 leading-tight">
              Online Müşteri Paneli
            </h3>
          </div>
        </div>

        <!-- Sağ: özellik listesi -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
          <div v-for="feat in appFeatures" :key="feat.label" class="flex items-start gap-3">
            <component :is="feat.icon" :size="16" class="text-gold mt-0.5 flex-shrink-0" />
            <div>
              <p class="text-white text-sm font-semibold">{{ feat.label }}</p>
              <p class="text-gray-500 text-xs mt-0.5 leading-snug">{{ feat.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Shield, Star, Cpu, DollarSign, MonitorSmartphone, UserPlus, CalendarCheck, BadgeDollarSign, MessageSquare } from 'lucide-vue-next'

const features = [
  {
    icon:  Shield,
    title: 'Orijinal Parça Garantisi',
    desc:  'Kullandığımız tüm yedek parçalar orijinal veya eşdeğer kalite garantilidir. Sahte parça kullanmıyoruz.',
  },
  {
    icon:  Star,
    title: 'Yetkili Servis Fiyatları Yok',
    desc:  'Bağımsız servis olarak yetkili servis kalitesini çok daha uygun fiyatlarla sunuyoruz.',
  },
  {
    icon:  Cpu,
    title: 'Gelişmiş Diagnostik',
    desc:  'En güncel OBD-II ve marka-spesifik diagnostik ekipmanlarıyla arızaları kesin olarak tespit ediyoruz.',
  },
  {
    icon:  DollarSign,
    title: 'Şeffaf Fiyatlandırma',
    desc:  'Gizli ücret yok. İşlem öncesinde tahmini maliyet bildirilir, onaysız işlem yapılmaz.',
  },
]

const appFeatures = [
  { icon: UserPlus,        label: 'Hızlı Üyelik',        desc: 'Saniyeler içinde üye olun, aracınızı kaydedin.' },
  { icon: CalendarCheck,   label: 'Bakım Takibi',         desc: 'Geçmiş ve gelecek bakımlarınızı kolayca görün, hatırlatıcı alın.' },
  { icon: BadgeDollarSign, label: 'Anlık Fiyat Öğrenin',  desc: 'İstediğiniz hizmet için tahmini maliyet anında hesaplansın.' },
  { icon: MessageSquare,   label: 'Uzmanla Görüşün',      desc: 'Panel üzerinden teknisyenlerimizle doğrudan iletişime geçin.' },
]
</script>
