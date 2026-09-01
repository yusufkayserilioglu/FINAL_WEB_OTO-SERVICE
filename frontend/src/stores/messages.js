import { defineStore }  from 'pinia'
import { ref }          from 'vue'
import { supabase }     from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useMessagesStore = defineStore('messages', () => {
  const conversation    = ref(null)
  const messages        = ref([])
  const conversations   = ref([])   // admin only
  const loading         = ref(false)
  const error           = ref(null)
  let   realtimeSub     = null

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
        .single()
      if (err && err.code === 'PGRST116') {
        const { data: created, error: createErr } = await supabase
          .from('conversations')
          .insert({ user_id: auth.currentUser.id })
          .select()
          .single()
        if (createErr) throw createErr
        data = created
      } else if (err) {
        throw err
      }
      conversation.value = data
      await fetchMessages(data.id)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchMessages(conversationId) {
    const { data, error: err } = await supabase
      .from('messages')
      .select('*, profiles(name)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (err) throw err
    messages.value = data
  }

  async function sendMessage(content) {
    const auth = useAuthStore()
    if (!conversation.value) await fetchOrCreateConversation()
    const { data, error: err } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.value.id,
        sender_id:       auth.currentUser.id,
        is_admin:        false,
        content,
      })
      .select('*, profiles(name)')
      .single()
    if (err) { error.value = err.message; throw err }
    messages.value.push(data)

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), unread_admin: (conversation.value.unread_admin || 0) + 1 })
      .eq('id', conversation.value.id)
  }

  function subscribeToMessages() {
    if (!conversation.value || realtimeSub) return
    realtimeSub = supabase
      .channel(`messages:${conversation.value.id}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `conversation_id=eq.${conversation.value.id}`,
      }, payload => {
        const exists = messages.value.some(m => m.id === payload.new.id)
        if (!exists) messages.value.push(payload.new)
      })
      .subscribe()
  }

  function unsubscribe() {
    if (realtimeSub) {
      supabase.removeChannel(realtimeSub)
      realtimeSub = null
    }
  }

  // Admin only
  async function fetchAllConversations() {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('conversations')
        .select('*, profiles(name, phone)')
        .order('last_message_at', { ascending: false })
      if (err) throw err
      conversations.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
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
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function sendAdminMessage(conversationId, content) {
    const auth = useAuthStore()

    const { data, error: err } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id:       auth.currentUser.id,
        is_admin:        true,
        content,
      })
      .select('*, profiles(name)')
      .single()
    if (err) { error.value = err.message; throw err }
    messages.value.push(data)

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString(), unread_admin: 0 })
      .eq('id', conversationId)
  }

  return {
    conversation, messages, conversations, loading, error,
    fetchOrCreateConversation, sendMessage,
    subscribeToMessages, unsubscribe,
    fetchAllConversations, loadConversationById, sendAdminMessage,
  }
})
