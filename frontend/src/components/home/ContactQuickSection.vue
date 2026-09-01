<template>
  <section class="section-padding bg-void">
    <div class="container-custom">
      <div class="text-center mb-10" v-scroll-reveal>
        <p class="text-gold text-xs font-mono tracking-[0.3em] uppercase mb-3">Bize Ulaşın</p>
        <h2 class="font-display font-black text-4xl md:text-5xl text-white">
          Hemen İletişime Geçin
        </h2>
      </div>

      <!-- Garaj Fotoğrafları -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-14 max-w-sm mx-auto md:max-w-3xl" v-scroll-reveal="{ delay: 100 }">
        <div class="md:col-span-2 rounded-2xl overflow-hidden group">
          <img :src="garajImg3" alt="Lions Garaj"
               class="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
        </div>
        <div class="flex flex-row md:flex-col gap-3">
          <div class="rounded-2xl overflow-hidden group flex-1">
            <img :src="garajImg1" alt="Lions Garaj"
                 class="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
          </div>
          <div class="rounded-2xl overflow-hidden group flex-1">
            <img :src="garajImg2" alt="Lions Garaj"
                 class="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <a
          v-for="(item, i) in contactItems"
          :key="item.title"
          :href="item.href"
          :target="item.external ? '_blank' : undefined"
          v-scroll-reveal="{ delay: i * 100 }"
          class="group flex flex-col items-center text-center p-8 rounded-2xl border border-white/5
                 transition-all duration-500 hover:border-gold/30 hover:-translate-y-1 hover:shadow-card"
          style="background: rgba(255,255,255,0.02);"
        >
          <div class="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5
                      group-hover:bg-gold/20 transition-all duration-300">
            <component :is="item.icon" :size="24" class="text-gold" />
          </div>
          <h3 class="font-display font-bold text-white text-base mb-2">{{ item.title }}</h3>
          <p class="text-gray-400 text-sm">{{ item.value }}</p>
          <p class="text-gray-600 text-xs mt-1">{{ item.sub }}</p>
        </a>
      </div>

      <!-- CTA -->
      <div
        class="mt-14 rounded-2xl border border-gold/20 p-10 text-center"
        style="background: linear-gradient(135deg, rgba(201,168,76,0.05) 0%, transparent 100%);"
        v-scroll-reveal="{ delay: 300 }"
      >
        <h3 class="font-display font-black text-3xl text-white mb-3">
          Araç Bakımı İçin <span class="text-gradient-gold">Hemen Arayın</span>
        </h3>
        <p class="text-gray-500 mb-6">Randevu almak veya fiyat öğrenmek için bizi arayın.</p>
        <div class="flex flex-wrap gap-4 justify-center">
          <a
            :href="`tel:${site.contact.phone}`"
            class="inline-flex items-center gap-2 font-display font-bold text-sm
                   bg-gradient-to-r from-gold to-gold-light text-black px-8 py-4 rounded-xl
                   hover:shadow-gold hover:scale-[1.02] transition-all duration-200"
          >
            <Phone :size="16" />
            {{ site.contact.phone }}
          </a>
          <RouterLink
            to="/iletisim"
            class="inline-flex items-center gap-2 font-display font-bold text-sm
                   border border-white/15 text-white px-8 py-4 rounded-xl
                   hover:border-gold/50 hover:text-gold transition-all duration-200"
          >
            İletişim Formu
            <ArrowRight :size="16" />
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-vue-next'
import site from '@/config/site'
import garajImg1 from '@/assets/lions-garaj.jpg'
import garajImg2 from '@/assets/lions-garaj2.jpg'
import garajImg3 from '@/assets/lions-garaj3.jpg'

const contactItems = [
  {
    icon:     MapPin,
    title:    'Adresimiz',
    value:    site.contact.address,
    sub:      'Etimesgut, Ankara',
    href:     `https://maps.google.com?q=${encodeURIComponent(site.contact.address)}`,
    external: true,
  },
  {
    icon:     Phone,
    title:    'Telefon',
    value:    site.contact.phone,
    sub:      'Hemen Ara',
    href:     `tel:${site.contact.phone}`,
    external: false,
  },
  {
    icon:     Clock,
    title:    'Çalışma Saatleri',
    value:    site.contact.hours,
    sub:      'Randevu önerilir',
    href:     `https://wa.me/${site.contact.whatsapp}`,
    external: true,
  },
]
</script>
