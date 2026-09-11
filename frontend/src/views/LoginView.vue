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
        <!-- ═══════════ TELEFON İLE GİRİŞ (varsayılan) ═══════════ -->
        <template v-if="mode === 'phone'">
          <h1 class="font-display font-black text-2xl text-white text-center mb-1">Giriş Yapın</h1>
          <p class="text-gray-500 text-sm text-center mb-8">
            Telefon numaranıza göndereceğimiz kod ile giriş yapın.
          </p>

          <!-- Error -->
          <div v-if="error" class="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
            <AlertCircle :size="15" class="shrink-0" />
            {{ error }}
          </div>

          <!-- Adım 1: Numara -->
          <form v-if="step === 'phone'" @submit.prevent="handleSendCode">
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
              :disabled="loading"
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
          <form v-else-if="step === 'code'" @submit.prevent="handleVerifyCode">
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
              {{ loading ? 'Doğrulanıyor...' : 'Giriş Yap' }}
            </button>

            <div class="flex items-center justify-between mt-5 text-sm">
              <button type="button" @click="backToPhone" class="text-gray-500 hover:text-white transition-colors">
                ← Numarayı değiştir
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

          <!-- Adım 3: İlk giriş — ad soyad -->
          <form v-else-if="step === 'name'" @submit.prevent="handleSaveName">
            <p class="text-gray-400 text-sm mb-5 text-center">
              Hoş geldiniz! Son bir adım: size nasıl hitap edelim?
            </p>
            <FormInput
              v-model="name"
              label="Ad Soyad"
              type="text"
              placeholder="Adınız Soyadınız"
              required
              autocomplete="name"
            />
            <button
              type="submit"
              :disabled="loading || !name.trim()"
              class="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                     bg-gradient-to-r from-gold to-gold-light text-black py-4 rounded-xl mt-2
                     hover:shadow-gold hover:scale-[1.01] active:scale-95
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span v-if="loading" class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Kaydet ve Devam Et
            </button>
          </form>

          <button
            @click="mode = 'admin'; error = ''"
            class="w-full text-center text-gray-600 hover:text-gray-400 text-xs mt-8 transition-colors"
          >
            Yönetici girişi (e-posta ile) →
          </button>
        </template>

        <!-- ═══════════ YÖNETİCİ GİRİŞİ (e-posta + şifre) ═══════════ -->
        <template v-else>
          <h1 class="font-display font-black text-2xl text-white text-center mb-1">Yönetici Girişi</h1>
          <p class="text-gray-500 text-sm text-center mb-8">Yönetim paneline e-posta ve şifre ile giriş yapın.</p>

          <div v-if="error" class="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
            <AlertCircle :size="15" class="shrink-0" />
            {{ error }}
          </div>

          <form @submit.prevent="handleAdminLogin">
            <FormInput
              v-model="email"
              label="E-posta"
              type="email"
              placeholder="ornek@mail.com"
              required
              autocomplete="email"
            />
            <div class="mb-6">
              <label class="block text-gray-400 text-sm font-medium mb-1.5">Şifre</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPass ? 'text' : 'password'"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11
                         text-white placeholder:text-gray-600 text-sm
                         focus:border-gold/50 focus:bg-white/8 transition-all duration-200"
                />
                <button
                  type="button"
                  @click="showPass = !showPass"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <Eye v-if="!showPass" :size="16" />
                  <EyeOff v-else :size="16" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                     bg-gradient-to-r from-gold to-gold-light text-black py-4 rounded-xl
                     hover:shadow-gold hover:scale-[1.01] active:scale-95
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span v-if="loading" class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              {{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
            </button>
          </form>

          <button
            @click="mode = 'phone'; error = ''"
            class="w-full text-center text-gray-600 hover:text-gray-400 text-xs mt-8 transition-colors"
          >
            ← Telefon ile giriş
          </button>
        </template>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { Eye, EyeOff, AlertCircle } from 'lucide-vue-next'
import FormInput from '@/components/ui/FormInput.vue'
import { useAuthStore } from '@/stores/auth'
import site from '@/config/site'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const mode     = ref('phone')   // 'phone' | 'admin'
const step     = ref('phone')   // 'phone' | 'code' | 'name'
const phone    = ref('')
const sentTo   = ref('')
const code     = ref('')
const name     = ref('')
const email    = ref('')
const password = ref('')
const showPass = ref(false)
const loading  = ref(false)
const error    = ref('')

// Kod tekrar gönderme sayacı
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
    if (!auth.hasProfile) {
      step.value = 'name'   // ilk giriş: ad soyad iste
    } else {
      redirectAfterLogin()
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleSaveName() {
  error.value = ''
  loading.value = true
  try {
    await auth.ensureProfile({ name: name.value })
    redirectAfterLogin()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleAdminLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    redirectAfterLogin()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function backToPhone() {
  step.value = 'phone'
  code.value = ''
  error.value = ''
}

// redirect başka role ait bir paneli gösteriyorsa router guard kişiyi kendi paneline çevirir
function redirectAfterLogin() {
  router.push(route.query.redirect ?? auth.panelPath)
}
</script>
