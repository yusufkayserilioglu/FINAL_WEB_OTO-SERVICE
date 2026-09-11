<template>
  <div class="min-h-screen bg-void text-white font-body">
    <!-- Genel site navbar'ı: panel sayfalarında gizlenir -->
    <AppNavbar v-if="!isPanelRoute" />

    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>

    <AppFooter v-if="!isPanelRoute" />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { useAuthStore } from '@/stores/auth'
import { isWrongPanel } from '@/router'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

// Kullanıcı paneli ve admin paneli kendi layout'unu kullanır
const isPanelRoute = computed(() =>
  route.matched.some(r => r.meta.panel)
)

// Router guard yalnızca sayfa geçişinde çalışır. Panel açıkken oturum ya da rol
// değişirse (çıkış, başka sekmede farklı hesapla giriş) paneli hemen kapat.
watch([() => auth.isLoggedIn, () => auth.role], () => {
  if (!route.meta.requiresAuth) return
  if (!auth.isLoggedIn)                 router.replace('/')
  else if (isWrongPanel(route, auth))   router.replace(auth.panelPath)
})
</script>
