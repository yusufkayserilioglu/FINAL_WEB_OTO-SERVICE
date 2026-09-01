<template>
  <div class="chat-page">
    <div class="chat-header">
      <div class="chat-avatar">LM</div>
      <div>
        <p class="chat-name">Lions Mechanic</p>
        <p class="chat-sub">Servis ekibi</p>
      </div>
    </div>

    <div class="messages-area" ref="scrollEl">
      <div v-if="messages.loading" class="loading">Yükleniyor...</div>

      <div v-else-if="!messages.messages.length" class="empty-chat">
        <MessageCircle :size="48" class="empty-icon" />
        <p>Henüz mesaj yok. Usta ile iletişime geç!</p>
      </div>

      <template v-else>
        <MessageBubble
          v-for="msg in messages.messages"
          :key="msg.id"
          :message="msg"
        />
      </template>
    </div>

    <div class="input-bar">
      <textarea
        v-model="newMessage"
        class="message-input"
        placeholder="Mesajınızı yazın..."
        rows="1"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <button class="send-btn" @click="send" :disabled="!newMessage.trim() || sending">
        <Send :size="20" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { MessageCircle, Send } from 'lucide-vue-next'
import { useMessagesStore } from '@/stores/messages'
import MessageBubble from '@/components/messages/MessageBubble.vue'

const messages   = useMessagesStore()
const newMessage = ref('')
const sending    = ref(false)
const scrollEl   = ref(null)

onMounted(async () => {
  await messages.fetchOrCreateConversation()
  messages.subscribeToMessages()
  scrollToBottom()
})

onUnmounted(() => {
  messages.unsubscribe()
})

watch(() => messages.messages.length, () => {
  nextTick(scrollToBottom)
})

async function send() {
  const content = newMessage.value.trim()
  if (!content) return
  sending.value = true
  newMessage.value = ''
  try {
    await messages.sendMessage(content)
    await nextTick()
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

function scrollToBottom() {
  if (scrollEl.value) {
    scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 7.5rem); /* dar ekranda üst bar + alt menü */
  background: #080808;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  padding-top: 16px;
  background: #111;
  border-bottom: 1px solid rgba(201, 168, 76, 0.15);
  flex-shrink: 0;
}

.chat-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-name {
  font-weight: 700;
  color: #e5e5e5;
  font-size: 15px;
  margin: 0 0 2px;
}

.chat-sub {
  font-size: 11px;
  color: #888;
  margin: 0;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.loading {
  text-align: center;
  color: #888;
  margin: auto;
}

.empty-chat {
  text-align: center;
  color: #555;
  margin: auto;
}

.empty-icon {
  color: rgba(201, 168, 76, 0.3);
  margin-bottom: 12px;
}

.empty-chat p {
  font-size: 14px;
}

.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 16px;
  background: #111;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
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

.message-input:focus {
  border-color: rgba(201, 168, 76, 0.4);
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
  flex-shrink: 0;
}

.send-btn:disabled {
  opacity: 0.5;
}

@media (min-width: 1024px) {
  .chat-page { height: 100dvh; }
}
</style>
