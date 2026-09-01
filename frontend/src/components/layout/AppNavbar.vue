<template>
  <nav
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
      scrolled
        ? 'border-b border-white/5'
        : 'border-b border-transparent',
    ]"
    :style="scrolled ? 'background: rgba(8,8,8,0.92); backdrop-filter: blur(16px);' : ''"
  >
    <!-- Top info bar -->
    <div class="hidden lg:flex items-center justify-between px-6 py-2 border-b border-white/5 text-xs text-gray-500">
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-1.5">
          <MapPin :size="12" class="text-gold" />
          {{ site.contact.address }}
        </span>
        <span class="flex items-center gap-1.5">
          <Clock :size="12" class="text-gold" />
          {{ site.contact.hours }}
        </span>
      </div>
      <div class="flex items-center gap-4">
        <a :href="`tel:${site.contact.phone}`" class="flex items-center gap-1.5 hover:text-gold transition-colors">
          <Phone :size="12" /> {{ site.contact.phone }}
        </a>
        <a :href="site.contact.instagram" target="_blank" class="hover:text-gold transition-colors">
          <AtSign :size="14" />
        </a>
        <a :href="`https://wa.me/${site.contact.whatsapp}`" target="_blank" class="hover:text-gold transition-colors">
          <MessageCircle :size="14" />
        </a>
      </div>
    </div>

    <!-- Main navbar -->
    <div class="container-custom">
      <div class="flex items-center justify-between h-16 md:h-20">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-3 shrink-0 h-full py-1.5">
          <img v-if="site.logo" :src="site.logo" alt="Logo" class="h-full w-auto object-contain" style="filter: hue-rotate(-18deg) saturate(0.55) brightness(1.05);" @error="logoError = true" />
          <span
            v-if="!site.logo || logoError"
            class="font-display font-black text-xl tracking-wider text-gradient-gold"
          >
            {{ site.name }}
          </span>
          <div v-if="site.logo && !logoError" class="flex flex-col leading-tight">
            <span class="font-display font-black text-lg tracking-widest text-gradient-gold">{{ site.name }}</span>
            <span class="text-[10px] font-mono tracking-[0.18em] uppercase text-gray-400">{{ site.tagline }}</span>
          </div>
        </RouterLink>

        <!-- Desktop nav -->
        <div class="hidden md:flex items-center gap-8">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-sm font-medium text-gray-300 hover:text-white relative group transition-colors"
          >
            {{ link.label }}
            <span
              class="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-gold to-gold-light
                     group-hover:w-full transition-all duration-300"
              :class="{ 'w-full': route.path === link.to }"
            />
          </RouterLink>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-3">
          <template v-if="auth.isLoggedIn">
            <RouterLink to="/dashboard" class="hidden md:flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
              <div class="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <User :size="14" class="text-gold" />
              </div>
              <span class="hidden lg:block">{{ auth.userName }}</span>
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              to="/giris"
              class="hidden md:block text-sm text-gray-300 hover:text-white border border-white/10
                     hover:border-white/25 px-4 py-2 rounded-xl transition-all duration-200"
            >
              Giriş Yap
            </RouterLink>
            <RouterLink
              to="/kayit"
              class="hidden md:block text-sm font-bold font-display bg-gradient-to-r from-gold to-gold-light
                     text-black px-5 py-2 rounded-xl hover:shadow-gold hover:scale-[1.02] transition-all duration-200"
            >
              Üye Ol
            </RouterLink>
          </template>

          <!-- Mobile menu button -->
          <button
            @click="mobileOpen = !mobileOpen"
            class="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            aria-label="Menü"
          >
            <X v-if="mobileOpen" :size="22" />
            <Menu v-else :size="22" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="slide-down">
      <div
        v-if="mobileOpen"
        class="md:hidden border-t border-white/5"
        style="background: rgba(8,8,8,0.98); backdrop-filter: blur(20px);"
      >
        <div class="container-custom py-6 flex flex-col gap-4">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            @click="mobileOpen = false"
            class="text-base font-medium text-gray-300 hover:text-gold py-2 border-b border-white/5 transition-colors"
          >
            {{ link.label }}
          </RouterLink>

          <template v-if="auth.isLoggedIn">
            <RouterLink to="/dashboard" @click="mobileOpen = false" class="text-base text-gray-300 hover:text-gold py-2 transition-colors">
              Dashboard
            </RouterLink>
          </template>
          <template v-else>
            <div class="flex gap-3 pt-2">
              <RouterLink to="/giris" @click="mobileOpen = false"
                class="flex-1 text-center border border-white/15 text-white py-3 rounded-xl hover:border-gold/40 transition-all text-sm font-medium"
              >
                Giriş Yap
              </RouterLink>
              <RouterLink to="/kayit" @click="mobileOpen = false"
                class="flex-1 text-center bg-gradient-to-r from-gold to-gold-light text-black py-3 rounded-xl font-bold font-display text-sm"
              >
                Üye Ol
              </RouterLink>
            </div>
          </template>

          <a :href="`tel:${site.contact.phone}`" class="flex items-center gap-2 text-sm text-gray-400 pt-2">
            <Phone :size="14" class="text-gold" />
            {{ site.contact.phone }}
          </a>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useScroll } from '@vueuse/core'
import { MapPin, Clock, Phone, AtSign, MessageCircle, User, Menu, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import site from '@/config/site'

const route      = useRoute()
const auth       = useAuthStore()
const mobileOpen = ref(false)
const logoError  = ref(false)
const { y }      = useScroll(window)
const scrolled   = ref(false)

watch(y, val => { scrolled.value = val > 40 })

watch(route, () => { mobileOpen.value = false })

const navLinks = [
  { to: '/',          label: 'Ana Sayfa'   },
  { to: '/hizmetler', label: 'Hizmetler'   },
  { to: '/iletisim',  label: 'İletişim'    },
]
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
