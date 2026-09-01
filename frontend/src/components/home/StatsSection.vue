<template>
  <section class="relative py-20 overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0"
         style="background: linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(0,0,0,0) 50%, rgba(201,168,76,0.03) 100%);" />
    <div class="absolute inset-0 border-t border-b border-gold/10" />

    <div class="relative container-custom">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        <div
          v-for="(stat, i) in site.stats"
          :key="stat.label"
          v-scroll-reveal="{ delay: i * 100 }"
          class="text-center"
        >
          <div class="font-display font-black text-3xl sm:text-5xl md:text-6xl text-gradient-gold mb-1 md:mb-2">
            <AnimatedCounter :target="stat.value" :suffix="stat.suffix" :duration="2200" />
          </div>
          <p class="text-gray-500 text-xs sm:text-sm font-medium tracking-wide">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import AnimatedCounter from '@/components/ui/AnimatedCounter.vue'
import site from '@/config/site'
</script>
