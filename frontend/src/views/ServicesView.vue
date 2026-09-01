<template>
  <main>
    <!-- Mini hero -->
    <section class="relative pt-48 pb-24 overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-1/3 w-96 h-96 rounded-full opacity-15 animate-float"
             style="background: radial-gradient(circle, rgba(201,168,76,0.4) 0%, transparent 70%); filter: blur(80px);" />
      </div>
      <div class="container-custom text-center relative z-10">
        <p class="text-gold text-xs font-mono tracking-[0.3em] uppercase mb-4" v-scroll-reveal>
          Hizmetlerimiz
        </p>
        <h1 class="font-display font-black text-5xl md:text-6xl text-white mb-5" v-scroll-reveal="{ delay: 100 }">
          Neler Yapıyoruz?
        </h1>
        <p class="text-gray-500 text-lg max-w-xl mx-auto" v-scroll-reveal="{ delay: 200 }">
          Motor bakımından şanzıman servisine, fren sisteminden periyodik bakıma kadar
          kapsamlı oto bakım çözümleri sunuyoruz.
        </p>
      </div>
    </section>

    <!-- Service detail cards -->
    <section class="section-padding bg-void">
      <div class="container-custom space-y-6">
        <div
          v-for="(service, i) in services"
          :key="service.id"
          v-scroll-reveal="{ delay: i * 60 }"
          class="group rounded-2xl border border-white/5 overflow-hidden transition-all duration-500
                 hover:border-gold/20"
          style="background: rgba(255,255,255,0.02);"
        >
          <div class="grid grid-cols-1 md:grid-cols-3 gap-0">
            <!-- Left: info -->
            <div class="md:col-span-2 p-8 md:p-10">
              <div class="flex items-start gap-4 mb-5">
                <div class="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0
                            group-hover:bg-gold/20 transition-all duration-300">
                  <component :is="getIcon(service.icon)" :size="20" class="text-gold" />
                </div>
                <div>
                  <h2 class="font-display font-black text-2xl text-white">{{ service.title }}</h2>
                  <p class="text-gray-500 text-sm mt-1">{{ service.shortDesc }}</p>
                </div>
              </div>

              <p class="text-gray-400 leading-relaxed mb-6">{{ service.fullDesc }}</p>

              <!-- Feature list -->
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                <li
                  v-for="feat in service.features"
                  :key="feat"
                  class="flex items-center gap-2 text-sm text-gray-400"
                >
                  <Check :size="14" class="text-gold shrink-0" />
                  {{ feat }}
                </li>
              </ul>

              <RouterLink
                to="/iletisim"
                class="inline-flex items-center gap-2 font-display font-bold text-sm
                       bg-gradient-to-r from-gold to-gold-light text-black px-6 py-3 rounded-xl
                       hover:shadow-gold hover:scale-[1.02] transition-all duration-200"
              >
                Randevu Al
                <ArrowRight :size="16" />
              </RouterLink>
            </div>

            <!-- Right: price -->
            <div class="md:col-span-1 border-t md:border-t-0 md:border-l border-white/5
                        p-8 md:p-10 flex flex-col items-center justify-center text-center gap-4">
              <div class="w-20 h-20 rounded-2xl bg-gold/5 border border-gold/15 flex items-center justify-center">
                <component :is="getIcon(service.icon)" :size="32" class="text-gold/60" />
              </div>

              <div>
                <p class="text-gray-600 text-xs uppercase tracking-widest mb-1">Tahmini Fiyat</p>
                <p class="font-display font-black text-2xl text-gradient-gold">{{ getDynamicPriceRange(service) }}</p>
              </div>

              <div class="flex items-center gap-2 text-gray-500 text-xs">
                <Clock :size="13" />
                {{ service.duration }}
              </div>

              <div class="w-full pt-4 border-t border-white/5">
                <a
                  :href="`tel:${site.contact.phone}`"
                  class="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gold transition-colors"
                >
                  <Phone :size="14" />
                  {{ site.contact.phone }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="section-padding" style="background: #0d0d0d;">
      <div class="container-custom text-center">
        <h2 class="font-display font-black text-4xl text-white mb-4" v-scroll-reveal>
          Aracınız için <span class="text-gradient-gold">Ücretsiz Fiyat Alın</span>
        </h2>
        <p class="text-gray-500 mb-8 max-w-lg mx-auto" v-scroll-reveal="{ delay: 100 }">
          Üye olun, araç bilgilerinizi girin; tahmini bakım maliyetlerini anında görün,
          detaylı bakım takibinizi yönetin ve uzman teknisyenlerimizle anında iletişime geçin.
        </p>
        <div class="flex flex-wrap gap-4 justify-center" v-scroll-reveal="{ delay: 200 }">
          <RouterLink
            to="/kayit"
            class="inline-flex items-center gap-2 font-display font-bold text-sm
                   bg-gradient-to-r from-gold to-gold-light text-black px-8 py-4 rounded-xl
                   hover:shadow-gold transition-all duration-200"
          >
            Ücretsiz Üye Ol
          </RouterLink>
          <RouterLink
            to="/iletisim"
            class="inline-flex items-center gap-2 font-display font-bold text-sm
                   border border-white/15 text-white px-8 py-4 rounded-xl
                   hover:border-gold/50 hover:text-gold transition-all duration-200"
          >
            Bize Ulaşın
          </RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted }   from 'vue'
import { RouterLink }            from 'vue-router'
import { Wrench, Settings, Disc, Droplet, Calendar, CircleDot, Clock, Phone, Check, ArrowRight } from 'lucide-vue-next'
import { services }              from '@/data/services'
import site                      from '@/config/site'
import { usePricingStore }       from '@/stores/pricing'

const pricing = usePricingStore()
onMounted(() => pricing.fetchPrices())

// Map static service id → DB service_key
const keyMap = {
  'motor-bakim':     'motor_bakimi',
  'sanziman':        'sanziman_servisi',
  'fren':            'fren_sistemi',
  'yag-degisimi':    'yag_degisimi',
  'periyodik-bakim': 'periyodik_bakim',
  'lastik-rot':      'lastik_rot_balans',
}

function getDynamicPriceRange(service) {
  const key  = keyMap[service.id]
  const dbPr = pricing.prices.find(p => p.service_key === key)
  if (!dbPr) return service.priceRange
  const fmt = v => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
  return `${fmt(dbPr.min_price)} – ${fmt(dbPr.max_price)}`
}

const iconMap = { Wrench, Settings, Disc, Droplet, Calendar, CircleDot }
function getIcon(name) { return iconMap[name] ?? Wrench }
</script>
