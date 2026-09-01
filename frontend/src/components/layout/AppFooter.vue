<template>
  <footer class="border-t border-white/5 mt-0">
    <div class="container-custom py-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <!-- Brand -->
        <div class="lg:col-span-1">
          <RouterLink to="/" class="inline-block mb-4">
            <span class="font-display font-black text-xl tracking-widest text-gradient-gold">
              {{ site.name }}
            </span>
          </RouterLink>
          <p class="text-gray-500 text-sm leading-relaxed mb-6">
            {{ site.tagline }}. BMW, Porsche, Audi ve diğer premium markalar için uzman bakım hizmeti.
          </p>
          <div class="flex gap-3">
            <a
              :href="site.contact.instagram"
              target="_blank"
              class="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center
                     text-gray-500 hover:border-gold/40 hover:text-gold transition-all"
              aria-label="Instagram"
            >
              <AtSign :size="16" />
            </a>
            <a
              :href="`https://wa.me/${site.contact.whatsapp}`"
              target="_blank"
              class="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center
                     text-gray-500 hover:border-gold/40 hover:text-gold transition-all"
              aria-label="WhatsApp"
            >
              <MessageCircle :size="16" />
            </a>
            <a
              :href="`tel:${site.contact.phone}`"
              class="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center
                     text-gray-500 hover:border-gold/40 hover:text-gold transition-all"
              aria-label="Telefon"
            >
              <Phone :size="16" />
            </a>
          </div>
        </div>

        <!-- Quick links -->
        <div>
          <h4 class="font-display font-bold text-white text-sm uppercase tracking-widest mb-5">Hızlı Bağlantılar</h4>
          <ul class="space-y-3">
            <li v-for="link in quickLinks" :key="link.to">
              <RouterLink
                :to="link.to"
                class="text-gray-500 text-sm hover:text-gold transition-colors flex items-center gap-2"
              >
                <span class="w-1 h-1 rounded-full bg-gold/50" />
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Services -->
        <div>
          <h4 class="font-display font-bold text-white text-sm uppercase tracking-widest mb-5">Hizmetlerimiz</h4>
          <ul class="space-y-3">
            <li v-for="s in serviceLinks" :key="s">
              <RouterLink
                to="/hizmetler"
                class="text-gray-500 text-sm hover:text-gold transition-colors flex items-center gap-2"
              >
                <span class="w-1 h-1 rounded-full bg-gold/50" />
                {{ s }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="font-display font-bold text-white text-sm uppercase tracking-widest mb-5">İletişim</h4>
          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <MapPin :size="15" class="text-gold mt-0.5 shrink-0" />
              <span class="text-gray-500 text-sm leading-relaxed">{{ site.contact.address }}</span>
            </li>
            <li class="flex items-center gap-3">
              <Phone :size="15" class="text-gold shrink-0" />
              <a :href="`tel:${site.contact.phone}`" class="text-gray-500 text-sm hover:text-gold transition-colors">
                {{ site.contact.phone }}
              </a>
            </li>
            <li class="flex items-center gap-3">
              <Clock :size="15" class="text-gold shrink-0" />
              <span class="text-gray-500 text-sm">{{ site.contact.hours }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-white/5">
      <div class="container-custom py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-gray-600 text-xs">
          © {{ new Date().getFullYear() }}
          <span class="text-gradient-gold font-bold">{{ site.name }}</span>.
          Tüm hakları saklıdır.
        </p>
        <p class="text-gray-700 text-xs">
          Premium Oto Bakım · Ankara, Etimesgut
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { MapPin, Phone, Clock, AtSign, MessageCircle } from 'lucide-vue-next'
import site from '@/config/site'

const quickLinks = [
  { to: '/',          label: 'Ana Sayfa' },
  { to: '/hizmetler', label: 'Hizmetler' },
  { to: '/iletisim',  label: 'İletişim'  },
  { to: '/giris',     label: 'Giriş Yap' },
  { to: '/kayit',     label: 'Üye Ol'    },
]

const serviceLinks = [
  'Motor Bakımı',
  'Şanzıman Servisi',
  'Fren Sistemi',
  'Yağ Değişimi',
  'Periyodik Bakım',
  'Rot-Balans',
]
</script>
