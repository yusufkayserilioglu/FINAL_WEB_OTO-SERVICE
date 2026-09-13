import { defineStore }  from 'pinia'
import { ref, computed } from 'vue'
import { supabase }     from '@/lib/supabase'
import { useAuthStore, normalizePhone } from './auth'

export const useMessagesStore = defineStore('messages', () => {
  const conversation  = ref(null)
  const messages      = ref([])
  const conversations = ref([])   // admin
  const guestMessages = ref([])   // admin — iletişim sayfasından üye olmadan gelenler
  const loading       = ref(false)
  const sendError     = ref(null)
  const error         = ref(null)
  let   realtimeSub   = null
  let   pollTimer     = null

  async function fetchOrCreateConversation() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return
    loading.value = true
    error.value   = null
    try {
      let { data, error: err } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', auth.currentUser.id)
        .maybeSingle()
      if (err) throw err

      if (!data) {
        const { data: created, error: createErr } = await supabase
          .from('conversations')
          .insert({ user_id: auth.currentUser.id })
          .select()
          .single()
        if (createErr) throw createErr
        data = created
      }
      conversation.value = data
      await fetchMessages(data.id)
      await markRead(false)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchMessages(conversationId) {
    const { data, error: err } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (err) throw err
    messages.value = data ?? []
  }

  // Yeni mesajları kaçırmamak için: aynı id iki kez eklenmez
  function upsertMessage(msg) {
    if (!msg) return
    const idx = messages.value.findIndex(m => m.id === msg.id)
    if (idx === -1) messages.value.push(msg)
    else            messages.value[idx] = { ...messages.value[idx], ...msg }
  }

  // Fotoğrafı Storage'a yükler, herkese açık URL'ini döndürür.
  // Yol: <conversation_id>/<uuid>.<uzantı>  (RLS bu klasör yapısına dayanır)
  async function uploadMessageImage(file, conversationId = conversation.value?.id) {
    if (!conversationId) throw new Error('Sohbet bulunamadı.')
    const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `${conversationId}/${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('message-images')
      .upload(path, file, { cacheControl: '3600', contentType: file.type || 'image/jpeg' })
    if (upErr) { sendError.value = 'Fotoğraf yüklenemedi. Tekrar deneyin.'; throw upErr }

    const { data } = supabase.storage.from('message-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function sendMessage(content, imageUrl = null) {
    const auth = useAuthStore()
    sendError.value = null
    if (!content && !imageUrl) return
    if (!conversation.value) await fetchOrCreateConversation()
    if (!conversation.value) { sendError.value = 'Sohbet açılamadı.'; throw new Error('no conversation') }

    const { data, error: err } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.value.id,
        sender_id:       auth.currentUser.id,
        is_admin:        false,
        content:         content || null,
        image_url:       imageUrl,
      })
      .select()
      .single()
    if (err) { sendError.value = 'Mesaj gönderilemedi. Tekrar deneyin.'; throw err }
    upsertMessage(data)

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_admin:    (conversation.value.unread_admin || 0) + 1,
      })
      .eq('id', conversation.value.id)
    return data
  }

  async function sendAdminMessage(conversationId, content, imageUrl = null) {
    const auth = useAuthStore()
    sendError.value = null
    if (!content && !imageUrl) return
    const { data, error: err } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id:       auth.currentUser.id,
        is_admin:        true,
        content:         content || null,
        image_url:       imageUrl,
      })
      .select()
      .single()
    if (err) { sendError.value = 'Mesaj gönderilemedi. Tekrar deneyin.'; throw err }
    upsertMessage(data)

    const conv = conversations.value.find(c => c.id === conversationId)
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_admin:    0,
        unread_user:     ((conv?.unread_user) || 0) + 1,
      })
      .eq('id', conversationId)
    return data
  }

  // ─── Realtime ─────────────────────────────────────────────────────────────
  // Not: önceki abonelik kapatılmadan yenisi açılırsa (admin sohbetler arasında
  // geçiş yaparken) yeni mesajlar düşmüyordu. Artık her seferinde önce kapatılır.
  function subscribeToMessages() {
    if (!conversation.value) return
    unsubscribe()
    const convId = conversation.value.id

    realtimeSub = supabase
      .channel(`messages-${convId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `conversation_id=eq.${convId}`,
      }, payload => upsertMessage(payload.new))
      .subscribe()

    // Realtime bağlantısı koparsa mesaj kaybolmasın diye yedek yoklama
    pollTimer = setInterval(() => {
      if (conversation.value?.id === convId) refreshMessages()
    }, 12000)

    // Sekmeye geri dönüldüğünde hemen tazele
    document.addEventListener('visibilitychange', onVisible)
  }

  function onVisible() {
    if (document.visibilityState === 'visible') refreshMessages()
  }

  async function refreshMessages() {
    if (!conversation.value) return
    try { await fetchMessages(conversation.value.id) } catch { /* sessizce yut */ }
  }

  function unsubscribe() {
    if (realtimeSub) {
      supabase.removeChannel(realtimeSub)
      realtimeSub = null
    }
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    document.removeEventListener('visibilitychange', onVisible)
  }

  // Okundu bilgisini sıfırla (isAdmin=true → admin okudu)
  async function markRead(isAdmin) {
    if (!conversation.value) return
    const patch = isAdmin ? { unread_admin: 0 } : { unread_user: 0 }
    await supabase.from('conversations').update(patch).eq('id', conversation.value.id)
    Object.assign(conversation.value, patch)
  }

  // ─── Üye olmayan ziyaretçi (iletişim sayfası) ─────────────────────────────
  // Ziyaretçinin hesabı olmadığı için mesaj ayrı tabloya düşer; usta WhatsApp'tan döner.
  async function submitGuestMessage({ name, phone, car, content }) {
    const { error: err } = await supabase.rpc('submit_guest_message', {
      p_name:     (name || '').trim(),
      p_phone:    normalizePhone(phone),
      p_content:  (content || '').trim(),
      p_car_info: (car || '').trim() || null,
    })
    if (err) throw new Error(translateGuestError(err))
  }

  // ─── Admin ────────────────────────────────────────────────────────────────
  // Mesaj kutusu: üyelerin sohbetleri + üye olmayanların mesajları
  async function fetchAllConversations() {
    loading.value = true
    try {
      const [convRes, guestRes] = await Promise.all([
        supabase
          .from('conversations')
          .select('*, profiles(name, phone)')
          .order('last_message_at', { ascending: false, nullsFirst: false }),
        supabase
          .from('guest_messages')
          .select('*')
          .order('created_at', { ascending: true }),
      ])
      if (convRes.error) throw convRes.error
      conversations.value = convRes.data ?? []
      // 006 migrasyonu çalıştırılmadıysa üye sohbetleri yine de listelenir
      guestMessages.value = guestRes.error ? [] : (guestRes.data ?? [])
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Üye olmayanların mesajları telefona göre tek satırda toplanır
  const guestThreads = computed(() => {
    const byPhone = new Map()
    for (const m of guestMessages.value) {
      let t = byPhone.get(m.phone)
      if (!t) {
        t = { phone: m.phone, name: m.name, car_info: null, items: [], unread: 0, last_message_at: null }
        byPhone.set(m.phone, t)
      }
      t.items.push(m)
      t.name            = m.name          // liste eskiden yeniye: en son yazılan ad kalır
      t.car_info        = m.car_info || t.car_info
      t.last_message_at = m.created_at
      if (!m.read_at) t.unread++
    }
    return [...byPhone.values()]
  })

  async function markGuestRead(phone) {
    const now = new Date().toISOString()
    const { error: err } = await supabase
      .from('guest_messages')
      .update({ read_at: now })
      .eq('phone', phone)
      .is('read_at', null)
    if (err) return
    for (const m of guestMessages.value) {
      if (m.phone === phone && !m.read_at) m.read_at = now
    }
  }

  async function deleteGuestThread(phone) {
    const { error: err } = await supabase.from('guest_messages').delete().eq('phone', phone)
    if (err) throw new Error('Mesajlar silinemedi. Tekrar deneyin.')
    guestMessages.value = guestMessages.value.filter(m => m.phone !== phone)
  }

  async function loadConversationById(conversationId) {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('conversations')
        .select('*, profiles(name, phone)')
        .eq('id', conversationId)
        .single()
      if (err) throw err
      conversation.value = data
      await fetchMessages(conversationId)
      await markRead(true)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    conversation, messages, conversations, loading, error, sendError,
    fetchOrCreateConversation, fetchMessages, refreshMessages, sendMessage,
    uploadMessageImage,
    subscribeToMessages, unsubscribe, markRead,
    fetchAllConversations, loadConversationById, sendAdminMessage,
    guestMessages, guestThreads, submitGuestMessage, markGuestRead, deleteGuestThread,
  }
})

function translateGuestError(err) {
  const msg = err?.message || ''
  if (msg.includes('rate_limited'))    return 'Çok sık mesaj gönderdiniz. Biraz sonra tekrar deneyin ya da WhatsApp\'tan yazın.'
  if (msg.includes('invalid_phone'))   return 'Geçerli bir telefon numarası girin.'
  if (msg.includes('invalid_name'))    return 'Adınızı ve soyadınızı girin.'
  if (msg.includes('invalid_content')) return 'Mesajınızı yazın (en fazla 2000 karakter).'
  if (msg.includes('invalid_car'))     return 'Araç bilgisi çok uzun.'
  return 'Mesajınız gönderilemedi. Tekrar deneyin ya da WhatsApp\'tan yazın.'
}
