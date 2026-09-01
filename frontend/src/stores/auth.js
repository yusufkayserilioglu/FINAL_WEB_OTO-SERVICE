import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// Telefonu E.164 formatına çevirir: "0555 111 22 33" → "+905551112233"
export function normalizePhone(input) {
  let p = String(input || '').replace(/[\s\-()]/g, '')
  if (p.startsWith('+'))  return p
  if (p.startsWith('00')) return '+' + p.slice(2)
  if (p.startsWith('0'))  return '+90' + p.slice(1)      // 05xx... → +905xx...
  if (p.startsWith('90') && p.length === 12) return '+' + p
  if (p.length === 10 && p.startsWith('5'))  return '+90' + p // 5xx... → +905xx...
  return '+' + p
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser    = ref(null)
  const currentProfile = ref(null)
  const loading        = ref(true)

  const isLoggedIn  = computed(() => currentUser.value !== null)
  const userName    = computed(() => currentProfile.value?.name ?? currentUser.value?.email ?? '')
  const userEmail   = computed(() => currentUser.value?.email ?? '')
  const userPhone   = computed(() => currentProfile.value?.phone ?? currentUser.value?.phone ?? '')
  const hasProfile  = computed(() => currentProfile.value !== null)

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    currentUser.value = session?.user ?? null
    if (currentUser.value) await loadProfile()
    loading.value = false

    supabase.auth.onAuthStateChange(async (_event, session) => {
      currentUser.value = session?.user ?? null
      if (currentUser.value) {
        await loadProfile()
      } else {
        currentProfile.value = null
      }
    })
  }

  async function loadProfile() {
    if (!currentUser.value) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.value.id)
      .maybeSingle()
    currentProfile.value = data
  }

  // ─── Telefon + SMS doğrulama kodu (OTP) akışı ─────────────────────────────
  // 1. adım: numaraya 6 haneli kod gönder
  async function sendPhoneOtp(rawPhone) {
    const phone = normalizePhone(rawPhone)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) throw new Error(translateAuthError(error.message))
    return phone
  }

  // 2. adım: kodu doğrula → oturum açılır (kullanıcı yoksa otomatik oluşturulur)
  async function verifyPhoneOtp(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: String(token).trim(),
      type:  'sms',
    })
    if (error) throw new Error(translateAuthError(error.message))
    currentUser.value = data.user
    await loadProfile()
    return data.user
  }

  // 3. adım (sadece ilk girişte): ad soyad ile profil oluştur
  async function ensureProfile({ name }) {
    if (!currentUser.value) throw new Error('Oturum bulunamadı')
    if (currentProfile.value) return currentProfile.value
    const { error } = await supabase.from('profiles').insert({
      id:    currentUser.value.id,
      name:  name.trim(),
      phone: currentUser.value.phone ? '+' + currentUser.value.phone.replace(/^\+/, '') : null,
    })
    if (error) throw new Error(error.message)
    await loadProfile()
    return currentProfile.value
  }

  // ─── E-posta + şifre (yönetici girişi için korunmuştur) ───────────────────
  async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(translateAuthError(error.message))
    currentUser.value = data.user
    await loadProfile()
    return data.user
  }

  async function logout() {
    await supabase.auth.signOut()
    currentUser.value    = null
    currentProfile.value = null
  }

  return {
    currentUser,
    currentProfile,
    loading,
    isLoggedIn,
    hasProfile,
    userName,
    userEmail,
    userPhone,
    init,
    loadProfile,
    sendPhoneOtp,
    verifyPhoneOtp,
    ensureProfile,
    login,
    logout,
  }
})

// Sık görülen Supabase auth hatalarını Türkçeleştir
function translateAuthError(msg) {
  const map = {
    'Invalid login credentials':  'E-posta veya şifre hatalı.',
    'Token has expired or is invalid': 'Kod süresi dolmuş veya hatalı. Yeni kod isteyin.',
    'Invalid OTP':                'Doğrulama kodu hatalı.',
    'Signups not allowed for otp': 'Bu numarayla kayıt şu an kapalı.',
    'Phone number is invalid':    'Telefon numarası geçersiz. Başında 0 olmadan 5xx ile deneyin.',
  }
  for (const [en, tr] of Object.entries(map)) {
    if (msg.includes(en)) return tr
  }
  if (msg.toLowerCase().includes('rate limit')) return 'Çok sık kod istediniz. Lütfen biraz bekleyip tekrar deneyin.'
  return msg
}
