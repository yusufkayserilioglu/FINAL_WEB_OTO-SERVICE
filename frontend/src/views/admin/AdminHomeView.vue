<template>
  <div class="p-5 md:p-8 max-w-5xl">
    <div class="mb-8">
      <p class="text-gray-600 text-sm">Yönetim Paneli</p>
      <h1 class="font-display font-black text-3xl text-white">Genel Bakış</h1>
    </div>

    <!-- İstatistik kartları -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <RouterLink
        to="/admin/musteriler"
        class="rounded-2xl border border-white/5 p-6 hover:border-gold/30 transition-all"
        style="background: rgba(255,255,255,0.02);"
      >
        <Users :size="22" class="text-gold mb-3" />
        <p class="font-display font-black text-3xl text-white">{{ loading ? '—' : stats.customers }}</p>
        <p class="text-gray-500 text-sm mt-1">Kayıtlı Müşteri</p>
      </RouterLink>

      <RouterLink
        to="/admin/randevular"
        class="rounded-2xl border border-white/5 p-6 hover:border-gold/30 transition-all"
        style="background: rgba(255,255,255,0.02);"
      >
        <Calendar :size="22" class="text-gold mb-3" />
        <p class="font-display font-black text-3xl text-white">{{ loading ? '—' : stats.pendingAppointments }}</p>
        <p class="text-gray-500 text-sm mt-1">Bekleyen Randevu</p>
      </RouterLink>

      <RouterLink
        to="/admin/mesajlar"
        class="rounded-2xl border border-white/5 p-6 hover:border-gold/30 transition-all"
        style="background: rgba(255,255,255,0.02);"
      >
        <MessageCircle :size="22" class="text-gold mb-3" />
        <p class="font-display font-black text-3xl text-white">{{ loading ? '—' : stats.unreadMessages }}</p>
        <p class="text-gray-500 text-sm mt-1">Okunmamış Mesaj</p>
      </RouterLink>
    </div>

    <!-- Hızlı erişim -->
    <h2 class="font-display font-bold text-lg text-white mb-4">Hızlı Erişim</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <RouterLink
        to="/admin/mesajlar"
        class="flex items-center gap-4 rounded-2xl border border-white/5 p-5 hover:border-gold/30 transition-all"
        style="background: rgba(255,255,255,0.02);"
      >
        <div class="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <MessageCircle :size="18" class="text-gold" />
        </div>
        <div>
          <p class="text-white font-semibold text-sm">Müşteri Mesajları</p>
          <p class="text-gray-500 text-xs mt-0.5">Müşterilerle anlık sohbet edin</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/admin/musteriler"
        class="flex items-center gap-4 rounded-2xl border border-white/5 p-5 hover:border-gold/30 transition-all"
        style="background: rgba(255,255,255,0.02);"
      >
        <div class="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <Users :size="18" class="text-gold" />
        </div>
        <div>
          <p class="text-white font-semibold text-sm">Müşteri Detayları</p>
          <p class="text-gray-500 text-xs mt-0.5">Araçlar, bakım geçmişi ve bilgiler</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/admin/fiyatlar"
        class="flex items-center gap-4 rounded-2xl border border-white/5 p-5 hover:border-gold/30 transition-all"
        style="background: rgba(255,255,255,0.02);"
      >
        <div class="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <BadgeDollarSign :size="18" class="text-gold" />
        </div>
        <div>
          <p class="text-white font-semibold text-sm">Fiyat Yönetimi</p>
          <p class="text-gray-500 text-xs mt-0.5">Hizmet fiyatlarını düzenleyin</p>
        </div>
      </RouterLink>

      <RouterLink
        to="/admin/randevular"
        class="flex items-center gap-4 rounded-2xl border border-white/5 p-5 hover:border-gold/30 transition-all"
        style="background: rgba(255,255,255,0.02);"
      >
        <div class="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <Calendar :size="18" class="text-gold" />
        </div>
        <div>
          <p class="text-white font-semibold text-sm">Randevular</p>
          <p class="text-gray-500 text-xs mt-0.5">Randevuları onaylayın veya iptal edin</p>
        </div>
      </RouterLink>

      <button
        type="button"
        class="flex items-center gap-4 rounded-2xl border border-white/5 p-5 hover:border-gold/30 transition-all text-left"
        style="background: rgba(255,255,255,0.02);"
        @click="showNewCustomer = true"
      >
        <div class="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <UserPlus :size="18" class="text-gold" />
        </div>
        <div>
          <p class="text-white font-semibold text-sm">Kayıtsız Müşteri Ekle</p>
          <p class="text-gray-500 text-xs mt-0.5">Üye olmayan müşteriyi anında kaydedin</p>
        </div>
      </button>
    </div>

    <!-- Randevu takvimi -->
    <div class="mt-8">
      <AppointmentCalendar @changed="loadStats" />
    </div>

    <NewCustomerModal
      v-if="showNewCustomer"
      @close="showNewCustomer = false"
      @created="goToCustomer"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Users, Calendar, MessageCircle, BadgeDollarSign, UserPlus } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import AppointmentCalendar from '@/components/admin/AppointmentCalendar.vue'
import NewCustomerModal    from '@/components/admin/NewCustomerModal.vue'

const router  = useRouter()
const loading = ref(true)
const stats   = ref({ customers: 0, pendingAppointments: 0, unreadMessages: 0 })
const showNewCustomer = ref(false)

async function loadStats() {
  try {
    const [customersRes, apptRes, convRes, guestRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('conversations').select('unread_admin'),
      // üye olmadan iletişim sayfasından gelenler
      supabase.from('guest_messages').select('id', { count: 'exact', head: true }).is('read_at', null),
    ])
    stats.value.customers           = customersRes.count ?? 0
    stats.value.pendingAppointments = apptRes.count ?? 0
    stats.value.unreadMessages      = (convRes.data ?? []).reduce((s, c) => s + (c.unread_admin || 0), 0)
                                    + (guestRes.count ?? 0)
  } catch {
    // istatistikler yüklenemese bile panel çalışmaya devam eder
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)

function goToCustomer(id) {
  showNewCustomer.value = false
  router.push(`/admin/musteri/${id}`)
}
</script>
