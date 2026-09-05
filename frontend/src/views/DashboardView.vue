<template>
  <div class="p-5 md:p-8 max-w-5xl">
    <!-- Header -->
    <div class="mb-8">
      <p class="text-gray-600 text-sm">Hoş geldiniz,</p>
      <h1 class="font-display font-black text-3xl text-white">{{ auth.userName || 'Kullanıcı' }}</h1>
    </div>

    <!-- ─── ARAÇ BİLGİLERİ (salt okunur) ─────────────────────────────────── -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display font-bold text-xl text-white">Aracım</h2>
      <RouterLink to="/profil" class="text-gold hover:text-gold-light text-sm font-medium transition-colors">
        Araç bilgilerini düzenle →
      </RouterLink>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>

    <!-- Araç yoksa -->
    <div v-else-if="!cars.cars.length"
         class="rounded-2xl border border-white/5 p-8 text-center mb-10"
         style="background: rgba(255,255,255,0.02);">
      <div class="w-16 h-16 rounded-2xl bg-gold/5 border border-gold/10 flex items-center justify-center mx-auto mb-4">
        <Car :size="28" class="text-gold/30" />
      </div>
      <h3 class="font-display font-bold text-white mb-1">Henüz araç eklemediniz</h3>
      <p class="text-gray-600 text-sm mb-5">Araç bilgilerinizi profil sayfanızdan ekleyebilirsiniz.</p>
      <RouterLink to="/profil"
        class="inline-flex items-center gap-2 font-display font-bold text-sm
               bg-gradient-to-r from-gold to-gold-light text-black px-6 py-3 rounded-xl
               hover:shadow-gold transition-all">
        <Plus :size="16" /> Araç Ekle
      </RouterLink>
    </div>

    <!-- Araç kartları -->
    <div v-else class="space-y-5 mb-10">
      <div v-for="car in cars.cars" :key="car.id"
           class="rounded-2xl border border-white/5 overflow-hidden"
           style="background: rgba(255,255,255,0.02);">

        <!-- Üst: plaka + araç -->
        <div class="p-6 border-b border-white/5 flex flex-wrap items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Car :size="22" class="text-gold" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-display font-bold text-white text-lg truncate">
              {{ car.brand?.toUpperCase() }} {{ car.model }}
            </h3>
            <p class="text-gray-500 text-sm">{{ car.year }} · {{ formatKm(car.km) || 'km girilmemiş' }}</p>
          </div>
          <span class="font-mono text-sm text-gold border border-gold/25 bg-gold/5 rounded-lg px-3 py-1.5 tracking-wider">
            {{ car.plate }}
          </span>
        </div>

        <!-- Alt: servis / bakım bilgileri -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-px" style="background: rgba(255,255,255,0.04);">
          <!-- Son servis -->
          <div class="p-5" style="background: #0b0b0b;">
            <div class="flex items-center gap-2 mb-1.5">
              <Wrench :size="14" class="text-gray-600" />
              <p class="text-gray-600 text-xs uppercase tracking-widest">Son Servis</p>
            </div>
            <p class="text-white font-medium">
              {{ formatDate(lastService(car.id)?.date) || 'Kayıt yok' }}
            </p>
            <p v-if="lastService(car.id)?.km" class="text-gray-600 text-xs mt-0.5">
              {{ formatKm(lastService(car.id).km) }} iken yapıldı
            </p>
          </div>

          <!-- Sonraki bakım -->
          <div class="p-5" style="background: #0b0b0b;">
            <div class="flex items-center gap-2 mb-1.5">
              <CalendarClock :size="14" class="text-gray-600" />
              <p class="text-gray-600 text-xs uppercase tracking-widest">Sonraki Bakım</p>
            </div>
            <template v-if="nextService(car)">
              <p class="font-medium" :class="nextService(car).overdue ? 'text-red-400' : 'text-white'">
                {{ nextServiceText(nextService(car)) || 'Bilgi yok' }}
              </p>
              <p class="text-gray-600 text-xs mt-0.5">
                {{ nextService(car).isEstimate ? 'Tahmini (son servise göre)' : 'Servis tarafından belirlendi' }}
              </p>
            </template>
            <p v-else class="text-gray-500">İlk servis sonrası hesaplanacak</p>
          </div>

          <!-- Muayene (opsiyonel) -->
          <div class="p-5" style="background: #0b0b0b;">
            <div class="flex items-center gap-2 mb-1.5">
              <ClipboardCheck :size="14" class="text-gray-600" />
              <p class="text-gray-600 text-xs uppercase tracking-widest">TÜVTÜRK Muayene Son Geçerlilik Tarihi</p>
            </div>
            <template v-if="car.inspection_date">
              <p class="text-white font-medium">{{ formatDate(car.inspection_date) }}</p>
              <p v-if="dateStatus(car.inspection_date)" class="text-xs mt-0.5"
                 :class="statusClass(dateStatus(car.inspection_date).tone)">
                {{ dateStatus(car.inspection_date).text }}
              </p>
            </template>
            <RouterLink v-else to="/profil" class="text-gray-600 text-sm hover:text-gold transition-colors">
              Eklenmedi — ekle
            </RouterLink>
          </div>

          <!-- Sigorta (opsiyonel) -->
          <div class="p-5" style="background: #0b0b0b;">
            <div class="flex items-center gap-2 mb-1.5">
              <ShieldCheck :size="14" class="text-gray-600" />
              <p class="text-gray-600 text-xs uppercase tracking-widest">Sigorta Son Geçerlilik Tarihi</p>
            </div>
            <template v-if="car.insurance_date">
              <p class="text-white font-medium">{{ formatDate(car.insurance_date) }}</p>
              <p v-if="dateStatus(car.insurance_date)" class="text-xs mt-0.5"
                 :class="statusClass(dateStatus(car.insurance_date).tone)">
                {{ dateStatus(car.insurance_date).text }}
              </p>
            </template>
            <RouterLink v-else to="/profil" class="text-gray-600 text-sm hover:text-gold transition-colors">
              Eklenmedi — ekle
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── YAKLAŞAN RANDEVULAR ──────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display font-bold text-xl text-white">Yaklaşan Randevular</h2>
      <RouterLink to="/randevular" class="text-gold hover:text-gold-light text-sm font-medium transition-colors">
        Tümü →
      </RouterLink>
    </div>

    <div v-if="upcoming.length" class="space-y-3 mb-10">
      <div v-for="appt in upcoming" :key="appt.id"
           class="rounded-2xl border border-white/5 p-5 flex flex-wrap items-center gap-4"
           style="background: rgba(255,255,255,0.02);">
        <div class="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex flex-col items-center justify-center shrink-0 leading-none">
          <span class="text-gold font-display font-black text-sm">{{ dayOf(appt.date) }}</span>
          <span class="text-gold/60 text-[10px] uppercase mt-0.5">{{ monthOf(appt.date) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white font-medium truncate">{{ appt.service_type }}</p>
          <p class="text-gray-500 text-sm">
            {{ (appt.time || '').slice(0,5) }}
            <span v-if="appt.cars"> · {{ appt.cars.plate }}</span>
          </p>
        </div>
        <span class="text-xs px-3 py-1.5 rounded-lg border shrink-0"
              :class="appt.status === 'confirmed'
                ? 'text-green-400 border-green-500/25 bg-green-500/10'
                : 'text-amber-400 border-amber-500/25 bg-amber-500/10'">
          {{ appt.status === 'confirmed' ? 'Onaylandı' : 'Onay bekliyor' }}
        </span>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-white/5 p-6 mb-10 flex flex-wrap items-center gap-4"
         style="background: rgba(255,255,255,0.02);">
      <div class="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <Calendar :size="18" class="text-gray-600" />
      </div>
      <p class="text-gray-500 flex-1">Yaklaşan randevunuz bulunmuyor.</p>
      <RouterLink to="/randevular"
        class="font-display font-bold text-sm bg-gradient-to-r from-gold to-gold-light text-black px-5 py-2.5 rounded-xl
               hover:shadow-gold transition-all shrink-0">
        Randevu Al
      </RouterLink>
    </div>

    <!-- ─── SERVİS GEÇMİŞİ ───────────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display font-bold text-xl text-white">Servis Geçmişi</h2>
      <RouterLink v-if="maintenance.records.length" to="/bakim"
                  class="text-gold hover:text-gold-light text-sm font-medium transition-colors">
        Tümü →
      </RouterLink>
    </div>

    <div v-if="maintenance.records.length" class="space-y-3 mb-10">
      <div v-for="rec in recentRecords" :key="rec.id"
           class="rounded-2xl border border-white/5 p-5 flex flex-wrap items-center gap-4"
           style="background: rgba(255,255,255,0.02);">
        <div class="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <Wrench :size="18" class="text-gold" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white font-medium">{{ formatDate(rec.date) }}</p>
          <p class="text-gray-500 text-sm truncate">
            <span v-if="rec.cars">{{ rec.cars.plate }} · </span>
            {{ rec.maintenance_items?.length
                ? rec.maintenance_items.map(i => i.description).join(', ')
                : (rec.note || 'Servis kaydı') }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-white/5 p-6 mb-10 flex items-center gap-4"
         style="background: rgba(255,255,255,0.02);">
      <div class="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        <Wrench :size="18" class="text-gray-600" />
      </div>
      <p class="text-gray-500">Servis geçmişiniz şu anda bulunmamaktadır.</p>
    </div>

    <!-- ─── PROFİL BİLGİLERİ ─────────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-display font-bold text-xl text-white">Profil Bilgilerim</h2>
      <RouterLink to="/profil" class="text-gold hover:text-gold-light text-sm font-medium transition-colors">
        Düzenle →
      </RouterLink>
    </div>

    <div class="rounded-2xl border border-white/5 p-6 md:p-8" style="background: rgba(255,255,255,0.02);">
      <div class="flex items-center gap-4 mb-7">
        <div class="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <User :size="24" class="text-gold" />
        </div>
        <div class="min-w-0">
          <h3 class="font-display font-bold text-white text-lg truncate">{{ auth.userName }}</h3>
          <p class="text-gray-500 text-sm truncate">{{ formatPhone(auth.userPhone) || auth.userEmail }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4 rounded-xl border border-white/5" style="background: rgba(255,255,255,0.02);">
          <p class="text-gray-600 text-xs uppercase tracking-widest mb-1">Ad Soyad</p>
          <p class="text-white font-medium">{{ auth.userName || '—' }}</p>
        </div>
        <div class="p-4 rounded-xl border border-white/5" style="background: rgba(255,255,255,0.02);">
          <p class="text-gray-600 text-xs uppercase tracking-widest mb-1">Telefon</p>
          <p class="text-white font-medium">{{ formatPhone(auth.userPhone) || 'Belirtilmemiş' }}</p>
        </div>
        <div class="p-4 rounded-xl border border-white/5" style="background: rgba(255,255,255,0.02);">
          <p class="text-gray-600 text-xs uppercase tracking-widest mb-1">E-posta</p>
          <p class="text-white font-medium truncate">{{ auth.userEmail || 'Belirtilmemiş' }}</p>
        </div>
        <div class="p-4 rounded-xl border border-white/5" style="background: rgba(255,255,255,0.02);">
          <p class="text-gray-600 text-xs uppercase tracking-widest mb-1">Kayıtlı Araç</p>
          <p class="text-white font-medium">{{ cars.cars.length }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Car, Plus, User, Wrench, Calendar, CalendarClock, ClipboardCheck, ShieldCheck } from 'lucide-vue-next'
import { useAuthStore }        from '@/stores/auth'
import { useCarsStore }        from '@/stores/cars'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useAppointmentsStore } from '@/stores/appointments'
import { formatPhone } from '@/stores/auth'
import {
  formatDate, formatKm, lastServiceOf, nextServiceInfo, nextServiceText, dateStatus,
} from '@/utils/service'

const auth         = useAuthStore()
const cars         = useCarsStore()
const maintenance  = useMaintenanceStore()
const appointments = useAppointmentsStore()

const loading = ref(true)

onMounted(async () => {
  await Promise.all([
    cars.fetchCars(),
    maintenance.fetchRecords(),
    appointments.fetchAppointments(),
  ])
  loading.value = false
})

function lastService(carId) {
  return lastServiceOf(maintenance.records, carId)
}

function nextService(car) {
  return nextServiceInfo(car, lastService(car.id))
}

const recentRecords = computed(() => maintenance.records.slice(0, 3))

const upcoming = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return appointments.appointments
    .filter(a => a.status !== 'cancelled' && a.status !== 'completed' && a.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3)
})

function dayOf(date)   { return new Date(date).getDate() }
function monthOf(date) { return new Date(date).toLocaleDateString('tr-TR', { month: 'short' }) }

function statusClass(tone) {
  if (tone === 'danger')  return 'text-red-400'
  if (tone === 'warning') return 'text-amber-400'
  return 'text-gray-600'
}
</script>
