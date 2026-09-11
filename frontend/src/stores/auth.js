import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// Telefonu E.164 formatına çevirir: "0555 111 22 33" → "+905551112233"
export function normalizePhone(input) {
  let p = String(input || '').replace(/[\s\-()]/g, '')
  if (p.startsWith('+'))  return p
  if (p.startsWith('00')) return '+' + p.slice(2)
  if (p.startsWith('0'))  return '+90' + p.slice(1)
  if (p.startsWith('90') && p.length === 12) return '+' + p
  if (p.length === 10 && p.startsWith('5'))  return '+90' + p
  return '+' + p
}

// "+905551112233" → "0555 111 22 33"
export function formatPhone(e164) {
  if (!e164) return ''
  const d = String(e164).replace(/\D/g, '')
  const local = d.startsWith('90') ? d.slice(2) : d
  if (local.length !== 10) return e164
  return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8)}`
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser    = ref(null)
  const currentProfile = ref(null)
  const loading        = ref(true)
  const ready          = ref(false)

  // init() yalnızca bir kez çalışsın; router guard bu sözü bekler
  let initPromise = null

  const isLoggedIn = computed(() => currentUser.value !== null)
  const isAdmin    = computed(() => currentProfile.value?.role === 'admin')
  // Panel ayrımı: profili henüz olmayan oturum da müşteri ('user') sayılır
  const role       = computed(() => (isAdmin.value ? 'admin' : 'user'))
  // Kişinin kendi paneli — yönetici müşteri paneline, müşteri yönetim paneline giremez
  const panelPath  = computed(() => (isAdmin.value ? '/admin' : '/dashboard'))
  const hasProfile = computed(() => currentProfile.value !== null)
  const userName   = computed(() => currentProfile.value?.name ?? currentUser.value?.email ?? '')
  const userEmail  = computed(() => currentUser.value?.email ?? currentProfile.value?.email ?? '')
  const userPhone  = computed(() => currentUser.value?.phone
    ? normalizePhone(currentUser.value.phone)
    : (currentProfile.value?.phone ?? ''))

  function init() {
    if (initPromise) return initPromise

    initPromise = (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      currentUser.value = session?.user ?? null
      if (currentUser.value) await loadProfile()
      loading.value = false
      ready.value   = true

      supabase.auth.onAuthStateChange(async (event, session) => {
        currentUser.value = session?.user ?? null
        if (currentUser.value) {
          // TOKEN_REFRESHED sırasında profili tekrar çekmeye gerek yok
          if (event !== 'TOKEN_REFRESHED' || !currentProfile.value) await loadProfile()
        } else {
          currentProfile.value = null
        }
      })
    })()

    return initPromise
  }

  // Router guard'ı oturum okunana kadar bekletir (yenilemede atılmayı önler)
  async function ensureReady() {
    if (ready.value) return
    await (initPromise ?? init())
  }

  async function loadProfile() {
    if (!currentUser.value) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.value.id)
      .maybeSingle()
    currentProfile.value = data

    // auth.users'daki güncel e-posta/telefonu profil tablosuna da yansıt
    if (data) {
      const patch = {}
      const authEmail = currentUser.value.email ?? null
      const authPhone = currentUser.value.phone ? normalizePhone(currentUser.value.phone) : null
      if (authEmail && data.email !== authEmail) patch.email = authEmail
      if (authPhone && data.phone !== authPhone) patch.phone = authPhone
      if (Object.keys(patch).length) {
        const { data: updated } = await supabase
          .from('profiles').update(patch).eq('id', data.id).select().maybeSingle()
        if (updated) currentProfile.value = updated
      }
    }
  }

  // ─── Telefon + SMS doğrulama kodu (giriş / kayıt) ─────────────────────────
  async function sendPhoneOtp(rawPhone) {
    const phone = normalizePhone(rawPhone)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) throw new Error(translateAuthError(error.message))
    return phone
  }

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

  // İlk girişte profil oluştur
  async function ensureProfile({ name }) {
    if (!currentUser.value) throw new Error('Oturum bulunamadı')
    if (currentProfile.value) return currentProfile.value
    const phone = currentUser.value.phone ? normalizePhone(currentUser.value.phone) : null
    const { error } = await supabase.from('profiles').insert({
      id:    currentUser.value.id,
      name:  name.trim(),
      phone,
      email: currentUser.value.email ?? null,
    })
    if (error) throw new Error(error.message)
    await claimWalkInRecords(phone)
    await loadProfile()
    return currentProfile.value
  }

  // Müşteri daha önce servise "kayıtsız müşteri" olarak geldiyse, admin'in
  // o kayda girdiği araç / randevu / bakım raporları bu hesaba taşınır.
  async function claimWalkInRecords(phone) {
    if (!phone) return
    // Devralma başarısız olsa da (ör. migrasyon çalıştırılmadıysa) üyelik tamamlanır
    await supabase.rpc('claim_walk_in_profile', { p_phone: phone })
  }

  // ─── Profil güncellemeleri ────────────────────────────────────────────────
  async function updateProfile({ name }) {
    if (!currentUser.value) throw new Error('Oturum bulunamadı')
    const { data, error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', currentUser.value.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    currentProfile.value = data
    return data
  }

  // E-posta değişikliği: yeni adrese doğrulama bağlantısı gider,
  // kullanıcı bağlantıya tıklayana kadar e-posta değişmez.
  async function requestEmailChange(newEmail) {
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) throw new Error(translateAuthError(error.message))
  }

  // Telefon değişikliği 1. adım: yeni numaraya doğrulama kodu gönderir
  async function requestPhoneChange(newPhone) {
    const phone = normalizePhone(newPhone)
    const { error } = await supabase.auth.updateUser({ phone })
    if (error) throw new Error(translateAuthError(error.message))
    return phone
  }

  // Telefon değişikliği 2. adım: kodu doğrula, numarayı kalıcı yap
  async function confirmPhoneChange(phone, token) {
    const normalized = normalizePhone(phone)
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: String(token).trim(),
      type:  'phone_change',
    })
    if (error) throw new Error(translateAuthError(error.message))
    currentUser.value = data.user ?? currentUser.value
    await supabase.from('profiles').update({ phone: normalized }).eq('id', currentUser.value.id)
    await loadProfile()
  }

  // ─── E-posta + şifre (yönetici girişi) ───────────────────────────────────
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
    currentUser, currentProfile, loading, ready,
    isLoggedIn, isAdmin, role, panelPath, hasProfile, userName, userEmail, userPhone,
    init, ensureReady, loadProfile,
    sendPhoneOtp, verifyPhoneOtp, ensureProfile, claimWalkInRecords,
    updateProfile, requestEmailChange, requestPhoneChange, confirmPhoneChange,
    login, logout,
  }
})

function translateAuthError(msg) {
  const map = {
    'Invalid login credentials':       'E-posta veya şifre hatalı.',
    'Token has expired or is invalid': 'Kod süresi dolmuş veya hatalı. Yeni kod isteyin.',
    'Invalid OTP':                     'Doğrulama kodu hatalı.',
    'Signups not allowed for otp':     'Bu numarayla kayıt şu an kapalı.',
    'Phone number is invalid':         'Telefon numarası geçersiz. Başında 0 olmadan 5xx ile deneyin.',
    'Unsupported phone provider':      'Telefon girişi Supabase panelinde açık değil (Authentication → Phone).',
    'phone_exists':                    'Bu numara başka bir hesapta kayıtlı.',
    'email_exists':                    'Bu e-posta başka bir hesapta kayıtlı.',
    'A user with this email address has already been registered': 'Bu e-posta başka bir hesapta kayıtlı.',
    'For security purposes':           'Çok sık denediniz. Lütfen biraz bekleyip tekrar deneyin.',
  }
  for (const [en, tr] of Object.entries(map)) {
    if (msg.includes(en)) return tr
  }
  if (msg.toLowerCase().includes('rate limit')) return 'Çok sık kod istediniz. Lütfen biraz bekleyip tekrar deneyin.'
  return msg
}
