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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Users, Calendar, MessageCircle, BadgeDollarSign } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'

const loading = ref(true)
const stats   = ref({ customers: 0, pendingAppointments: 0, unreadMessages: 0 })

onMounted(async () => {
  try {
    const [customersRes, apptRes, convRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('conversations').select('unread_admin'),
    ])
    stats.value.customers           = customersRes.count ?? 0
    stats.value.pendingAppointments = apptRes.count ?? 0
    stats.value.unreadMessages      = (convRes.data ?? []).reduce((s, c) => s + (c.unread_admin || 0), 0)
  } catch {
    // istatistikler yüklenemese bile panel çalışmaya devam eder
  } finally {
    loading.value = false
  }
})
</script>
