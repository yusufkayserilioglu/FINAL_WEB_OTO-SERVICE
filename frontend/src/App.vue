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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const route = useRoute()

// Kullanıcı paneli ve admin paneli kendi layout'unu kullanır
const isPanelRoute = computed(() =>
  route.matched.some(r => r.meta.panel)
)
</script>
