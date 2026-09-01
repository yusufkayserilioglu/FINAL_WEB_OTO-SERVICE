<template>
  <section class="relative min-h-screen flex items-center overflow-hidden bg-void">
    <!-- Background orbs -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 animate-float"
           style="background: radial-gradient(circle, rgba(201,168,76,0.3) 0%, transparent 70%); filter: blur(60px);" />
      <div class="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 animate-float-slow"
           style="background: radial-gradient(circle, rgba(0,100,255,0.2) 0%, transparent 70%); filter: blur(80px);" />
    </div>

    <!-- Grid overlay -->
    <div class="absolute inset-0 opacity-[0.03]"
         style="background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
                background-size: 60px 60px;" />

    <div class="relative z-10 container-custom w-full pt-20 pb-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

        <!-- Sol: İçerik -->
        <div>
          <h1 class="font-display font-black text-4xl sm:text-5xl lg:text-7xl leading-[1.05] mb-4 md:mb-6"
              v-scroll-reveal="{ delay: 100 }">
            Aracınıza<br />
            <span class="text-gradient-gold">Uzman</span><br />
            Dokunuş
          </h1>

          <p class="text-gray-400 text-base md:text-lg leading-relaxed max-w-xl mb-3"
             v-scroll-reveal="{ delay: 200 }">
            BMW, Audi, Mercedes ve tüm premium markalar için gelişmiş ekipmanlarımız ve deneyimli teknisyenlerimizle yanınızdayız.
          </p>
          <p class="text-gray-500 text-xs md:text-sm leading-relaxed max-w-xl mb-10"
             v-scroll-reveal="{ delay: 250 }">
            Online müşteri panelimiz ile bakım takibi, anlık fiyat ve öncelikli randevu ayrıcalıklarından yararlanın.
          </p>

          <div class="flex flex-wrap gap-4" v-scroll-reveal="{ delay: 300 }">
            <a :href="`https://wa.me/${site.contact.whatsapp}`" target="_blank"
               class="inline-flex items-center gap-2 font-display font-bold text-sm
                      bg-gradient-to-r from-gold to-gold-light text-black px-7 py-4 rounded-xl
                      hover:shadow-gold hover:scale-[1.03] active:scale-95 transition-all duration-200">
              <MessageCircle :size="16" />
              WhatsApp ile Ara
            </a>
            <RouterLink to="/hizmetler"
               class="inline-flex items-center gap-2 font-display font-bold text-sm
                      border border-white/15 text-white px-7 py-4 rounded-xl
                      hover:border-gold/50 hover:text-gold transition-all duration-200">
              Hizmetlerimiz
              <ArrowRight :size="16" />
            </RouterLink>
          </div>

          <div class="flex flex-wrap gap-6 mt-12" v-scroll-reveal="{ delay: 400 }">
            <div v-for="badge in badges" :key="badge.label" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <component :is="badge.icon" :size="14" class="text-gold" />
              </div>
              <span class="text-gray-400 text-xs">{{ badge.label }}</span>
            </div>
          </div>

        </div>

        <!-- Sağ: Logo Carousel -->
        <div class="carousel-section">
          <!-- Üst etiket -->
          <div class="carousel-header">
            <span class="carousel-eyebrow">Uzman Olduğumuz Markalar</span>
            <span class="carousel-counter">{{ currentIdx + 1 }} / {{ heroBrands.length }}</span>
          </div>

          <!-- 3-görünümlü slider -->
          <div class="carousel-stage">
            <!-- Sol gradient -->
            <div class="stage-fade stage-fade-left" aria-hidden="true" />
            <!-- Sağ gradient -->
            <div class="stage-fade stage-fade-right" aria-hidden="true" />

            <!-- Sol logo (önceki) -->
            <div class="c-side c-left" :key="'prev-' + currentIdx">
              <img :src="prevBrand.logo" :alt="prevBrand.name" class="c-side-img" draggable="false" />
            </div>

            <!-- Orta logo (aktif) -->
            <div class="c-center-wrap">
              <Transition name="slide-center" mode="out-in">
                <div :key="'active-' + currentIdx" class="c-active">
                  <img :src="activeBrand.logo" :alt="activeBrand.name" class="c-active-img" draggable="false" />
                </div>
              </Transition>
            </div>

            <!-- Sağ logo (sonraki) -->
            <div class="c-side c-right" :key="'next-' + currentIdx">
              <img :src="nextBrand.logo" :alt="nextBrand.name" class="c-side-img" draggable="false" />
            </div>
          </div>

          <!-- Marka adı (geçişli) -->
          <Transition name="fade-name" mode="out-in">
            <p :key="'name-' + currentIdx" class="carousel-brand-name">{{ activeBrand.name }}</p>
          </Transition>

          <!-- Progress bar + dots -->
          <div class="carousel-dots">
            <span
              v-for="(_, i) in heroBrands"
              :key="i"
              class="c-dot"
              :class="{ 'c-dot-active': i === currentIdx }"
            />
          </div>
        </div>

      </div>

      <!-- Scroll indicator — grid dışında, tam genişlik ortalı -->
      <div class="flex flex-col items-center gap-2 mt-8" v-scroll-reveal="{ delay: 500 }">
        <span class="text-gray-600 text-[10px] font-mono tracking-[0.25em] uppercase animate-bounce">Kaydır</span>
        <div class="w-px h-6 bg-gradient-to-b from-gold/50 to-transparent" />
      </div>
    </div>

    <!-- Bottom fade -->
    <div class="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
         style="background: linear-gradient(to bottom, transparent, #080808)" />


    <!-- Mobile floating buttons -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 md:hidden">
      <a :href="`tel:${site.contact.phone}`"
         class="w-14 h-14 rounded-full bg-gold flex items-center justify-center shadow-gold animate-glow-pulse"
         aria-label="Ara">
        <Phone :size="22" class="text-black" />
      </a>
      <a :href="`https://wa.me/${site.contact.whatsapp}`" target="_blank"
         class="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
         aria-label="WhatsApp">
        <MessageCircle :size="22" class="text-white" />
      </a>
    </div>

    <!-- Desktop floating buttons -->
    <div class="fixed bottom-8 right-8 z-50 hidden md:flex flex-col gap-3">
      <a :href="`tel:${site.contact.phone}`"
         class="w-12 h-12 rounded-full bg-gold flex items-center justify-center shadow-gold animate-glow-pulse"
         aria-label="Ara">
        <Phone :size="18" class="text-black" />
      </a>
      <a :href="`https://wa.me/${site.contact.whatsapp}`" target="_blank"
         class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
         aria-label="WhatsApp">
        <MessageCircle :size="18" class="text-white" />
      </a>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { MessageCircle, ArrowRight, Phone, Shield, Award, Zap, Wrench } from 'lucide-vue-next'
import site from '@/config/site'

import logoBmw        from '@/assets/logo-bmw.png'
import logoAudi       from '@/assets/logo-audi.png'
import logoMercedes   from '@/assets/logo-mercedes.png'
import logoPorsche    from '@/assets/logo porsche.png'
import logoRangerover from '@/assets/logo-rangerover.png'
import logoMinicooper from '@/assets/logo-minicooper.png'
import logoVolkswagen from '@/assets/logo-volswagen.png'

const heroBrands = [
  { name: 'BMW',         logo: logoBmw        },
  { name: 'Mercedes',    logo: logoMercedes    },
  { name: 'Audi',        logo: logoAudi        },
  { name: 'Porsche',     logo: logoPorsche     },
  { name: 'Range Rover', logo: logoRangerover  },
  { name: 'Volkswagen',  logo: logoVolkswagen  },
  { name: 'Mini Cooper', logo: logoMinicooper  },
]

const currentIdx = ref(0)

const prevBrand   = computed(() => heroBrands[(currentIdx.value - 1 + heroBrands.length) % heroBrands.length])
const activeBrand = computed(() => heroBrands[currentIdx.value])
const nextBrand   = computed(() => heroBrands[(currentIdx.value + 1) % heroBrands.length])

let timer = null
onMounted(() => {
  timer = setInterval(() => {
    currentIdx.value = (currentIdx.value + 1) % heroBrands.length
  }, 2800)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const badges = [
  { icon: Shield, label: 'Orijinal Parça'  },
  { icon: Award,  label: '15+ Yıl Deneyim' },
  { icon: Zap,    label: 'Hızlı Servis'    },
  { icon: Wrench, label: 'Uzman Ekip'      },
]
</script>

<style scoped>
/* ═══ Carousel Section ══════════════════════════════ */
.carousel-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px 0 8px;
}

/* ── Header ─────────────────────────────────────── */
.carousel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 4px;
}

.carousel-eyebrow {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #c9a84c;
  font-family: monospace;
}

.carousel-counter {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.25);
  font-family: monospace;
  letter-spacing: 0.1em;
}

/* ── Stage ──────────────────────────────────────── */
.carousel-stage {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  gap: 0;
  padding: 20px 0;
}

/* Edge fades */
.stage-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  pointer-events: none;
  z-index: 2;
}
.stage-fade-left  { left: 0;  background: linear-gradient(to right, #080808 20%, transparent); }
.stage-fade-right { right: 0; background: linear-gradient(to left,  #080808 20%, transparent); }

/* ── Yan logolar ────────────────────────────────── */
.c-side {
  display: flex;
  align-items: center;
  justify-content: center;
}

.c-side-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  opacity: 0.28;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
  pointer-events: none;
  user-select: none;
  transition: opacity 0.4s ease;
}

@media (min-width: 640px) {
  .c-side-img { width: 100px; height: 100px; }
}

/* ── Orta logo wrapper ──────────────────────────── */
.c-center-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 200px;
}

@media (min-width: 1024px) {
  .c-center-wrap { min-height: 260px; }
}

/* ── Aktif logo ─────────────────────────────────── */
.c-active {
  display: flex;
  align-items: center;
  justify-content: center;
}

.c-active-img {
  width: 160px;
  height: 160px;
  object-fit: contain;
  filter: drop-shadow(0 16px 40px rgba(0, 0, 0, 0.75));
  pointer-events: none;
  user-select: none;
}

@media (min-width: 640px) {
  .c-active-img { width: 200px; height: 200px; }
}

@media (min-width: 1024px) {
  .c-active-img { width: 240px; height: 240px; }
}

/* ── Marka adı ──────────────────────────────────── */
.carousel-brand-name {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin: 0;
}

/* ── Dots ───────────────────────────────────────── */
.carousel-dots {
  display: flex;
  gap: 7px;
  align-items: center;
  padding-top: 4px;
}

.c-dot {
  display: block;
  height: 3px;
  width: 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  transition: width 0.35s ease, background 0.35s ease;
}

.c-dot-active {
  width: 34px;
  background: #c9a84c;
}

/* ═══ Geçiş Animasyonları ═══════════════════════════ */

/* Aktif logo: sağdan girer, sola çıkar */
.slide-center-enter-from { opacity: 0; transform: translateX(60px) scale(0.85); }
.slide-center-enter-active { transition: opacity 0.42s ease, transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.slide-center-enter-to   { opacity: 1; transform: translateX(0) scale(1); }

.slide-center-leave-from { opacity: 1; transform: translateX(0) scale(1); }
.slide-center-leave-active {
  position: absolute;
  transition: opacity 0.32s ease, transform 0.32s cubic-bezier(0.55, 0, 1, 0.45);
}
.slide-center-leave-to { opacity: 0; transform: translateX(-60px) scale(0.85); }

/* Marka adı: yumuşak fade */
.fade-name-enter-from    { opacity: 0; transform: translateY(6px); }
.fade-name-enter-active  { transition: opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s; }
.fade-name-leave-to      { opacity: 0; }
.fade-name-leave-active  { transition: opacity 0.2s ease; }
</style>
