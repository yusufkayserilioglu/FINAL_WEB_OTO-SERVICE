<template>
  <main class="min-h-screen bg-void flex items-center justify-center px-4 py-20">
    <!-- Background orb -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 animate-float"
           style="background: radial-gradient(circle, rgba(201,168,76,0.6) 0%, transparent 70%); filter: blur(80px);" />
    </div>

    <div class="relative z-10 w-full max-w-md">
      <!-- Logo -->
      <RouterLink to="/" class="flex justify-center mb-8">
        <span class="font-display font-black text-2xl tracking-widest text-gradient-gold">
          {{ site.name }}
        </span>
      </RouterLink>

      <!-- Card -->
      <div
        class="rounded-2xl border border-white/8 p-8 md:p-10"
        style="background: rgba(255,255,255,0.03); backdrop-filter: blur(16px);"
      >
        <h1 class="font-display font-black text-2xl text-white text-center mb-1">Üye Olun</h1>
        <p class="text-gray-500 text-sm text-center mb-8">
          Telefon numaranız ile saniyeler içinde üye olun. Şifre yok, sadece SMS kodu.
        </p>

        <!-- Error -->
        <div v-if="error" class="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
          <AlertCircle :size="15" class="shrink-0" />
          {{ error }}
        </div>

        <!-- Adım 1: Ad + telefon -->
        <form v-if="step === 'form'" @submit.prevent="handleSendCode">
          <FormInput
            v-model="name"
            label="Ad Soyad"
            type="text"
            placeholder="Adınız Soyadınız"
            required
            autocomplete="name"
          />

          <label class="block text-gray-400 text-sm font-medium mb-1.5">Telefon Numarası</label>
          <div class="flex gap-2 mb-6">
            <span class="flex items-center px-4 rounded-xl border border-white/10 bg-white/5 text-gray-400 text-sm select-none">+90</span>
            <input
              v-model="phone"
              type="tel"
              inputmode="numeric"
              placeholder="5XX XXX XX XX"
              required
              autocomplete="tel-national"
              class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3
                     text-white placeholder:text-gray-600 text-sm tracking-wide
                     focus:border-gold/50 focus:bg-white/8 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            :disabled="loading || !name.trim()"
            class="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                   bg-gradient-to-r from-gold to-gold-light text-black py-4 rounded-xl
                   hover:shadow-gold hover:scale-[1.01] active:scale-95
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            {{ loading ? 'Kod gönderiliyor...' : 'Doğrulama Kodu Gönder' }}
          </button>
        </form>

        <!-- Adım 2: Kod -->
        <form v-else @submit.prevent="handleVerifyCode">
          <p class="text-gray-400 text-sm mb-5 text-center">
            <span class="text-white font-medium">{{ sentTo }}</span> numarasına gönderilen
            6 haneli kodu girin.
          </p>
          <input
            v-model="code"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="••••••"
            required
            autocomplete="one-time-code"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 mb-6
                   text-white placeholder:text-gray-600 text-2xl text-center tracking-[0.5em] font-mono
                   focus:border-gold/50 focus:bg-white/8 transition-all duration-200"
          />

          <button
            type="submit"
            :disabled="loading || code.length < 6"
            class="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                   bg-gradient-to-r from-gold to-gold-light text-black py-4 rounded-xl
                   hover:shadow-gold hover:scale-[1.01] active:scale-95
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            {{ loading ? 'Doğrulanıyor...' : 'Üyeliği Tamamla' }}
          </button>

          <div class="flex items-center justify-between mt-5 text-sm">
            <button type="button" @click="step = 'form'; error = ''" class="text-gray-500 hover:text-white transition-colors">
              ← Bilgileri değiştir
            </button>
            <button
              type="button"
              @click="handleResend"
              :disabled="resendIn > 0"
              class="text-gold hover:text-gold-light disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {{ resendIn > 0 ? `Tekrar gönder (${resendIn})` : 'Kodu tekrar gönder' }}
            </button>
          </div>
        </form>

        <p class="text-center text-gray-500 text-sm mt-6">
          Zaten üye misiniz?
          <RouterLink to="/giris" class="text-gold hover:text-gold-light font-medium transition-colors ml-1">
            Giriş Yap
          </RouterLink>
        </p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { AlertCircle } from 'lucide-vue-next'
import FormInput from '@/components/ui/FormInput.vue'
import { useAuthStore } from '@/stores/auth'
import site from '@/config/site'

const auth   = useAuthStore()
const router = useRouter()

const step    = ref('form')   // 'form' | 'code'
const name    = ref('')
const phone   = ref('')
const sentTo  = ref('')
const code    = ref('')
const loading = ref(false)
const error   = ref('')

const resendIn = ref(0)
let timer = null
function startResendTimer() {
  resendIn.value = 60
  clearInterval(timer)
  timer = setInterval(() => {
    resendIn.value -= 1
    if (resendIn.value <= 0) clearInterval(timer)
  }, 1000)
}
onUnmounted(() => clearInterval(timer))

async function handleSendCode() {
  error.value = ''
  loading.value = true
  try {
    sentTo.value = await auth.sendPhoneOtp(phone.value)
    step.value = 'code'
    code.value = ''
    startResendTimer()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleResend() {
  if (resendIn.value > 0) return
  error.value = ''
  try {
    await auth.sendPhoneOtp(sentTo.value)
    startResendTimer()
  } catch (e) {
    error.value = e.message
  }
}

async function handleVerifyCode() {
  error.value = ''
  loading.value = true
  try {
    await auth.verifyPhoneOtp(sentTo.value, code.value)
    await auth.ensureProfile({ name: name.value })
    router.push(auth.panelPath)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
