<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Müşteri Mesajları</h1>
    </div>

    <div v-if="messages.loading" class="loading">Yükleniyor...</div>

    <div v-else-if="!messages.conversations.length" class="empty-state">
      <MessageCircle :size="48" class="empty-icon" />
      <p>Henüz mesaj yok</p>
    </div>

    <!-- Conversation list or active chat -->
    <template v-else-if="!activeConvId">
      <div
        v-for="conv in messages.conversations"
        :key="conv.id"
        class="conv-item"
        @click="openConversation(conv)"
      >
        <div class="conv-avatar">{{ initials(conv.profiles?.name) }}</div>
        <div class="conv-info">
          <p class="conv-name">{{ conv.profiles?.name || 'Müşteri' }}</p>
          <p class="conv-phone">{{ conv.profiles?.phone || '' }}</p>
        </div>
        <div class="conv-meta">
          <span v-if="conv.unread_admin > 0" class="unread-badge">{{ conv.unread_admin }}</span>
          <span class="conv-time">{{ formatTime(conv.last_message_at) }}</span>
        </div>
      </div>
    </template>

    <!-- Active chat -->
    <div v-else class="chat-view">
      <button class="back-btn" @click="closeConversation">
        <ChevronLeft :size="20" /> Geri
      </button>
      <div class="chat-customer-name">{{ activeName }}</div>

      <div class="messages-area" ref="scrollEl">
        <MessageBubble
          v-for="msg in messages.messages"
          :key="msg.id"
          :message="msg"
        />
      </div>

      <div class="input-bar">
        <textarea
          v-model="reply"
          class="message-input"
          placeholder="Yanıt yazın..."
          rows="1"
          @keydown.enter.exact.prevent="sendReply"
        ></textarea>
        <button class="send-btn" @click="sendReply" :disabled="!reply.trim() || sending">
          <Send :size="20" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { MessageCircle, ChevronLeft, Send } from 'lucide-vue-next'
import { useMessagesStore } from '@/stores/messages'
import MessageBubble from '@/components/messages/MessageBubble.vue'

const messages     = useMessagesStore()
const activeConvId = ref(null)
const activeName   = ref('')
const reply        = ref('')
const sending      = ref(false)
const scrollEl     = ref(null)

onMounted(() => messages.fetchAllConversations())

watch(() => messages.messages.length, () => nextTick(scrollToBottom))

async function openConversation(conv) {
  activeConvId.value = conv.id
  activeName.value   = conv.profiles?.name || 'Müşteri'
  await messages.loadConversationById(conv.id)
  messages.subscribeToMessages()
  nextTick(scrollToBottom)
}

function closeConversation() {
  messages.unsubscribe()
  activeConvId.value = null
  messages.fetchAllConversations()
}

async function sendReply() {
  const content = reply.value.trim()
  if (!content) return
  sending.value = true
  reply.value = ''
  try {
    await messages.sendAdminMessage(activeConvId.value, content)
    nextTick(scrollToBottom)
  } finally {
    sending.value = false
  }
}

function scrollToBottom() {
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

function initials(name) {
  return (name || 'M').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 7.5rem); /* dar ekranda üst bar + alt menü */
  background: #080808;
}

.page-header {
  padding: 20px 16px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #555;
}

.empty-icon { color: rgba(201, 168, 76, 0.3); margin-bottom: 12px; }

.conv-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  cursor: pointer;
}

.conv-item:hover { background: rgba(255,255,255,0.02); }

.conv-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.conv-info { flex: 1; }
.conv-name  { font-weight: 600; color: #e5e5e5; font-size: 14px; margin: 0 0 2px; }
.conv-phone { font-size: 12px; color: #888; margin: 0; }

.conv-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.unread-badge {
  background: #c9a84c;
  color: #080808;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
}

.conv-time {
  font-size: 11px;
  color: #666;
}

/* Active chat */
.chat-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #c9a84c;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.chat-customer-name {
  padding: 8px 16px 12px;
  font-size: 16px;
  font-weight: 700;
  color: #e5e5e5;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 16px;
  background: #111;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.message-input {
  flex: 1;
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 10px 16px;
  color: #e5e5e5;
  font-size: 14px;
  resize: none;
  outline: none;
  max-height: 100px;
  font-family: 'Inter', sans-serif;
}

.send-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  border: none;
  color: #080808;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.send-btn:disabled { opacity: 0.5; }

@media (min-width: 1024px) {
  .page-container { height: 100dvh; }
}
</style>
