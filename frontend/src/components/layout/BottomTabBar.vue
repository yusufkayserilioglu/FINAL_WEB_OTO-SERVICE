<template>
  <nav class="tabbar">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="tab"
      :class="{ active: isActive(tab) }"
    >
      <span class="tab-icon">
        <component :is="tab.icon" :size="21" />
        <span v-if="tab.badge > 0" class="badge">{{ tab.badge > 99 ? '99+' : tab.badge }}</span>
      </span>
      <span class="tab-label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed }         from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore }     from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import {
  LayoutDashboard, Calendar, MessageCircle, Wrench,
  Users, BadgeDollarSign,
} from '@lucide/vue'

const route    = useRoute()
const auth     = useAuthStore()
const messages = useMessagesStore()

const customerTabs = computed(() => [
  { to: '/dashboard',  label: 'Panelim',  icon: LayoutDashboard },
  { to: '/randevular', label: 'Randevu',  icon: Calendar },
  { to: '/mesajlar',   label: 'Usta',     icon: MessageCircle, badge: messages.myUnread },
  { to: '/bakim',      label: 'Bakım',    icon: Wrench },
])

const adminTabs = computed(() => [
  { to: '/admin',            label: 'Özet',     icon: LayoutDashboard, exact: true },
  { to: '/admin/mesajlar',   label: 'Mesajlar', icon: MessageCircle, badge: messages.totalUnreadAdmin },
  { to: '/admin/uyeler',     label: 'Üyeler',   icon: Users },
  { to: '/admin/randevular', label: 'Randevu',  icon: Calendar },
  { to: '/admin/fiyatlar',   label: 'Fiyatlar', icon: BadgeDollarSign },
])

const tabs = computed(() => (auth.isAdmin ? adminTabs.value : customerTabs.value))

function isActive(tab) {
  return tab.exact ? route.path === tab.to : route.path.startsWith(tab.to)
}
</script>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 70;
  display: flex;
  background: rgba(14, 16, 19, 0.94);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-top: 1px solid var(--line);
  padding-bottom: var(--safe-bottom);
}

.tab {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 9px 2px 8px;
  color: #5b626c;
  transition: color 0.18s;
  position: relative;
}

.tab.active { color: var(--accent); }

.tab.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 26px;
  height: 2px;
  border-radius: 0 0 3px 3px;
  background: var(--accent);
}

.tab:active { transform: scale(0.95); }

.tab-icon { position: relative; display: flex; }

.tab-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.badge {
  position: absolute;
  top: -5px;
  left: 12px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
  line-height: 17px;
  text-align: center;
  border: 2px solid var(--surface);
  box-shadow: 0 0 0 1px rgb(var(--accent-rgb) / 0.35);
}
</style>
