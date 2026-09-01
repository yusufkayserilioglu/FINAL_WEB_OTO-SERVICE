<template>
  <section id="hizmetler" class="section-padding bg-void">
    <div class="container-custom">
      <div class="text-center mb-14" v-scroll-reveal>
        <p class="text-gold text-xs font-mono tracking-[0.3em] uppercase mb-3">Hizmetlerimiz</p>
        <h2 class="font-display font-black text-4xl md:text-5xl text-white">
          Neler Yapıyoruz?
        </h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="(service, i) in services"
          :key="service.id"
          v-scroll-reveal="{ delay: i * 80 }"
          class="group relative overflow-hidden rounded-2xl border border-white/5 p-7
                 cursor-pointer transition-all duration-500
                 hover:border-gold/30 hover:-translate-y-1 hover:shadow-card"
          style="background: rgba(255,255,255,0.02);"
        >
          <!-- Icon circle -->
          <div class="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5
                      group-hover:bg-gold/20 group-hover:border-gold/40 transition-all duration-300">
            <component :is="getIcon(service.icon)" :size="20" class="text-gold" />
          </div>

          <!-- Title -->
          <h3 class="font-display font-bold text-white text-lg mb-2">{{ service.title }}</h3>

          <!-- Desc -->
          <p class="text-gray-500 text-sm leading-relaxed mb-4">{{ service.shortDesc }}</p>

          <!-- Price -->
          <div class="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
            <span class="text-gold font-mono text-sm font-medium">{{ service.priceRange }}</span>
            <span class="text-gray-600 text-xs flex items-center gap-1">
              <Clock :size="11" /> {{ service.duration }}
            </span>
          </div>

          <!-- Arrow on hover -->
          <div class="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <ArrowRight :size="18" class="text-gold" />
          </div>

          <!-- Background glow on hover -->
          <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
               style="background: radial-gradient(circle at 30% 50%, rgba(201,168,76,0.04) 0%, transparent 60%);" />
        </div>
      </div>

      <div class="text-center mt-12" v-scroll-reveal="{ delay: 400 }">
        <RouterLink
          to="/hizmetler"
          class="inline-flex items-center gap-2 font-display font-bold text-sm
                 border border-gold/30 text-gold px-8 py-4 rounded-xl
                 hover:bg-gold/10 transition-all duration-200"
        >
          Tüm Hizmetleri Görüntüle
          <ArrowRight :size="16" />
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { Wrench, Settings, Disc, Droplet, Calendar, CircleDot, Clock, ArrowRight } from 'lucide-vue-next'
import { services } from '@/data/services'

const iconMap = { Wrench, Settings, Disc, Droplet, Calendar, CircleDot }
function getIcon(name) { return iconMap[name] ?? Wrench }
</script>
