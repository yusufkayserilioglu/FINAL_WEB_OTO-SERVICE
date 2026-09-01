<template>
  <div class="p-5 md:p-8 max-w-5xl">
    <!-- Header -->
    <div class="mb-8">
      <p class="text-gray-600 text-sm">Hoş geldiniz,</p>
      <h1 class="font-display font-black text-3xl text-white">
        {{ auth.userName || 'Kullanıcı' }}
      </h1>
    </div>

    <!-- ─── ARAÇLARIM ─── -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-display font-bold text-xl text-white">Araçlarım</h2>
      <button
        @click="showAddModal = true"
        class="inline-flex items-center gap-2 font-display font-bold text-sm
               bg-gradient-to-r from-gold to-gold-light text-black px-5 py-2.5 rounded-xl
               hover:shadow-gold transition-all duration-200"
      >
        <Plus :size="16" />
        Araç Ekle
      </button>
    </div>

    <!-- Loading -->
    <div v-if="carsStore.loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>

    <!-- Empty state -->
    <div v-else-if="carsStore.cars.length === 0" class="text-center py-16">
      <div class="w-20 h-20 rounded-2xl bg-gold/5 border border-gold/10 flex items-center justify-center mx-auto mb-5">
        <Car :size="36" class="text-gold/30" />
      </div>
      <h3 class="font-display font-bold text-white text-lg mb-2">Henüz araç eklemediniz</h3>
      <p class="text-gray-600 text-sm mb-6">Araç ekleyerek tahmini bakım maliyetlerini görün.</p>
      <button
        @click="showAddModal = true"
        class="inline-flex items-center gap-2 font-display font-bold text-sm
               bg-gradient-to-r from-gold to-gold-light text-black px-6 py-3 rounded-xl
               hover:shadow-gold transition-all"
      >
        <Plus :size="16" /> İlk Aracını Ekle
      </button>
    </div>

    <!-- Car grid -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <CarCard
        v-for="car in carsStore.cars"
        :key="car.id"
        :car="car"
        :costs="carsStore.getEstimatedCosts(car)"
        @remove="carsStore.removeCar(car.id)"
      />
    </div>

    <!-- ─── SERVİS GEÇMİŞİ KISAYOLU ─── -->
    <div class="mt-10 rounded-2xl border border-white/5 p-6 flex flex-col sm:flex-row sm:items-center gap-5"
         style="background: rgba(255,255,255,0.02);">
      <div class="w-12 h-12 rounded-xl bg-gold/5 border border-gold/10 flex items-center justify-center shrink-0">
        <History :size="22" class="text-gold/50" />
      </div>
      <div class="flex-1">
        <h3 class="font-display font-bold text-white">Servis Geçmişi</h3>
        <p class="text-gray-600 text-sm">Tüm bakım kayıtlarınızı görüntüleyin.</p>
      </div>
      <RouterLink
        to="/bakim"
        class="inline-flex items-center justify-center gap-2 font-display font-bold text-sm
               bg-gradient-to-r from-gold to-gold-light text-black px-6 py-3 rounded-xl
               hover:shadow-gold transition-all shrink-0"
      >
        Bakım Geçmişine Git
      </RouterLink>
    </div>

    <!-- ─── PROFİLİM ─── -->
    <h2 class="font-display font-bold text-xl text-white mt-10 mb-6">Profilim</h2>
    <div class="rounded-2xl border border-white/5 p-8" style="background: rgba(255,255,255,0.02);">
      <div class="flex items-center gap-4 mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <User :size="28" class="text-gold" />
        </div>
        <div>
          <h3 class="font-display font-bold text-white text-xl">{{ auth.userName }}</h3>
          <p class="text-gray-500 text-sm">{{ auth.userEmail }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4 rounded-xl border border-white/5" style="background: rgba(255,255,255,0.02);">
          <p class="text-gray-600 text-xs uppercase tracking-widest mb-1">Ad Soyad</p>
          <p class="text-white font-medium">{{ auth.userName }}</p>
        </div>
        <div class="p-4 rounded-xl border border-white/5" style="background: rgba(255,255,255,0.02);">
          <p class="text-gray-600 text-xs uppercase tracking-widest mb-1">E-posta</p>
          <p class="text-white font-medium">{{ auth.userEmail }}</p>
        </div>
        <div class="p-4 rounded-xl border border-white/5" style="background: rgba(255,255,255,0.02);">
          <p class="text-gray-600 text-xs uppercase tracking-widest mb-1">Telefon</p>
          <p class="text-white font-medium">{{ auth.currentProfile?.phone || 'Belirtilmemiş' }}</p>
        </div>
        <div class="p-4 rounded-xl border border-white/5" style="background: rgba(255,255,255,0.02);">
          <p class="text-gray-600 text-xs uppercase tracking-widest mb-1">Toplam Araç</p>
          <p class="text-white font-medium">{{ carsStore.cars.length }}</p>
        </div>
      </div>
    </div>

    <!-- Add Car Modal -->
    <AddCarModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @added="showAddModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Car, Plus, User, History } from 'lucide-vue-next'
import CarCard     from '@/components/dashboard/CarCard.vue'
import AddCarModal from '@/components/dashboard/AddCarModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useCarsStore } from '@/stores/cars'

const auth         = useAuthStore()
const carsStore    = useCarsStore()
const showAddModal = ref(false)

onMounted(() => carsStore.fetchCars())
</script>
