<template>
  <div
    class="group relative rounded-2xl border border-white/5 overflow-hidden
           transition-all duration-300 hover:border-gold/20 hover:shadow-card"
    style="background: rgba(255,255,255,0.02);"
  >
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Car :size="18" class="text-gold" />
          </div>
          <div>
            <h3 class="font-display font-bold text-white text-base">
              {{ brandLabel }} {{ car.model }}
            </h3>
            <p class="text-gray-500 text-xs">{{ car.year }} · {{ Number(car.km).toLocaleString('tr-TR') }} km</p>
          </div>
        </div>

        <!-- Plate badge -->
        <div class="bg-gold/10 border border-gold/25 rounded-lg px-3 py-1 shrink-0">
          <span class="text-gold font-mono font-bold text-sm tracking-widest">{{ car.plate }}</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-white/5 mb-4" />

      <!-- Estimated costs -->
      <div class="mb-2">
        <p class="text-gray-600 text-xs uppercase tracking-widest mb-3">Tahmini Servis Maliyetleri</p>
        <div class="space-y-2">
          <div
            v-for="(cost, service) in costs"
            :key="service"
            class="flex items-center justify-between"
          >
            <span class="text-gray-400 text-sm">{{ service }}</span>
            <span class="text-gold-light text-sm font-medium font-mono">
              ₺{{ Number(cost.min).toLocaleString('tr-TR') }} – {{ Number(cost.max).toLocaleString('tr-TR') }}
            </span>
          </div>
        </div>
        <p class="text-gray-700 text-xs mt-3">* Fiyatlar tahminidir, araç durumuna göre değişebilir.</p>
      </div>
    </div>

    <!-- Remove button -->
    <button
      @click="$emit('remove')"
      class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200
             w-7 h-7 rounded-lg flex items-center justify-center
             text-gray-600 hover:text-red-400 hover:bg-red-400/10"
      title="Aracı Sil"
    >
      <Trash2 :size="14" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Car, Trash2 } from 'lucide-vue-next'
import { brands } from '@/data/brands'

const props = defineProps({
  car:   { type: Object, required: true },
  costs: { type: Object, required: true },
})
defineEmits(['remove'])

const brandLabel = computed(() => {
  const found = brands.find(b => b.id === props.car.brand)
  return found ? found.name : props.car.brand
})
</script>
