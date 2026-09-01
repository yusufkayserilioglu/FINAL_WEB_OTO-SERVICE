<template>
  <div class="min-h-screen bg-void">
    <!-- Masaüstü sidebar -->
    <aside class="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 hidden lg:flex flex-col z-40"
           style="background: rgba(8,8,8,0.98);">
      <div class="p-6 border-b border-white/5">
        <RouterLink to="/admin" class="block">
          <span class="font-display font-black text-lg tracking-widest text-gradient-gold">{{ site.name }}</span>
          <span class="block text-[10px] font-mono tracking-[0.25em] uppercase text-gray-500 mt-0.5">Yönetim Paneli</span>
        </RouterLink>
      </div>

      <div class="px-4 py-4 border-b border-white/5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
            <ShieldCheck :size="16" class="text-gold" />
          </div>
          <div class="min-w-0">
            <p class="text-white text-sm font-medium truncate">{{ auth.userName }}</p>
            <p class="text-gray-600 text-xs truncate">Yönetici</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          :class="isActive(item)
            ? 'bg-gold/10 text-gold border border-gold/20'
            : 'text-gray-500 hover:text-white hover:bg-white/5'"
        >
          <component :is="item.icon" :size="16" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-white/5">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 text-gray-600 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
        >
          <LogOut :size="16" />
          Çıkış Yap
        </button>
      </div>
    </aside>

    <!-- Dar ekran üst bar -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-white/5 px-4 h-14 flex items-center justify-between"
         style="background: rgba(8,8,8,0.98);">
      <RouterLink to="/admin" class="font-display font-black text-base tracking-widest text-gradient-gold">
        Yönetim
      </RouterLink>
      <button @click="handleLogout" class="text-gray-600 hover:text-red-400 transition-colors p-1" aria-label="Çıkış">
        <LogOut :size="18" />
      </button>
    </div>

    <!-- Dar ekran alt menü -->
    <div class="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 flex"
         style="background: rgba(8,8,8,0.98);">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors"
        :class="isActive(item) ? 'text-gold' : 'text-gray-600 hover:text-gray-400'"
      >
        <component :is="item.icon" :size="18" />
        {{ item.label }}
      </RouterLink>
    </div>

    <!-- İçerik -->
    <main class="lg:ml-64 pt-14 lg:pt-0 pb-16 lg:pb-0 min-h-screen">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import {
  LayoutDashboard, Calendar, MessageCircle, Users, BadgeDollarSign,
  ShieldCheck, LogOut,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import site from '@/config/site'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const navItems = [
  { to: '/admin',            label: 'Panel',      icon: LayoutDashboard, exact: true },
  { to: '/admin/randevular', label: 'Randevular', icon: Calendar },
  { to: '/admin/mesajlar',   label: 'Mesajlar',   icon: MessageCircle },
  { to: '/admin/musteriler', label: 'Müşteriler', icon: Users },
  { to: '/admin/fiyatlar',   label: 'Fiyatlar',   icon: BadgeDollarSign },
]

function isActive(item) {
  if (item.exact) return route.path === item.to
  if (item.to === '/admin/musteriler' && route.path.startsWith('/admin/musteri')) return true
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>
