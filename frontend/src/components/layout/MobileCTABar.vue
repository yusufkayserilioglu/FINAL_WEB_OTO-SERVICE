<template>
  <!-- Herkese açık sayfalarda mobil alt aksiyon çubuğu -->
  <div class="cta-bar">
    <a :href="site.contact.telUrl" class="cta cta-call">
      <Phone :size="17" />
      Hemen Ara
    </a>
    <a :href="site.contact.whatsappUrl" target="_blank" rel="noopener" class="cta cta-wa">
      <MessageCircle :size="17" />
      WhatsApp
    </a>
    <RouterLink :to="target" class="cta cta-app" :aria-label="label">
      <component :is="icon" :size="19" />
    </RouterLink>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Phone, MessageCircle, User, ShieldCheck } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import site from '@/config/site'

const auth = useAuthStore()

const target = computed(() => (auth.isLoggedIn ? auth.panelPath : '/giris'))
const icon   = computed(() => (auth.isAdmin ? ShieldCheck : User))
const label  = computed(() =>
  auth.isAdmin ? 'Yönetim paneli' : auth.isLoggedIn ? 'Panelim' : 'Giriş yap'
)
</script>

<style scoped>
.cta-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 65;
  display: flex;
  gap: 8px;
  padding: 9px 14px calc(9px + var(--safe-bottom));
  background: rgba(8, 9, 11, 0.93);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--line);
}

@media (min-width: 768px) {
  .cta-bar { display: none; }
}

.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 46px;
  border-radius: 11px;
  font-family: 'Archivo', sans-serif;
  font-weight: 700;
  font-size: 13.5px;
  transition: transform 0.12s, background 0.2s;
}

.cta:active { transform: scale(0.96); }

.cta-call {
  flex: 1;
  background: var(--accent);
  color: #fff;
}

.cta-wa {
  flex: 1;
  background: #1f8f4e;
  color: #fff;
}

.cta-app {
  width: 46px;
  flex-shrink: 0;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: #c3c9d1;
}
</style>
