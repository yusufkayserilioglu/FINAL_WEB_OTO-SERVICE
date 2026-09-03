<template>
  <div class="chat-page">
    <div class="chat-header">
      <div class="chat-avatar">LM</div>
      <div>
        <p class="chat-name">Lions Mechanic</p>
        <p class="chat-sub">Servis ekibi</p>
      </div>
    </div>

    <div class="messages-area" ref="scrollEl" @scroll="onScroll">
      <div v-if="messages.loading" class="loading">Yükleniyor...</div>

      <div v-else-if="!messages.messages.length" class="empty-chat">
        <MessageCircle :size="48" class="empty-icon" />
        <p>Henüz mesaj yok. Usta ile iletişime geç!</p>
      </div>

      <template v-else>
        <template v-for="group in messageGroups" :key="group.key">
          <DateDivider v-if="group.label" :label="group.label" />
          <MessageBubble
            v-for="msg in group.items"
            :key="msg.id"
            :message="msg"
            @img-load="keepDown"
          />
        </template>
      </template>
    </div>

    <p v-if="messages.sendError" class="send-error">{{ messages.sendError }}</p>

    <ChatComposer :on-submit="handleSend" placeholder="Mesajınızı yazın..." />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { MessageCircle } from 'lucide-vue-next'
import { useMessagesStore } from '@/stores/messages'
import MessageBubble from '@/components/messages/MessageBubble.vue'
import DateDivider   from '@/components/messages/DateDivider.vue'
import ChatComposer  from '@/components/messages/ChatComposer.vue'
import { groupMessagesByDay } from '@/utils/chat'

const messages = useMessagesStore()
const scrollEl = ref(null)
const stick    = ref(true)   // kullanıcı en alttaysa yeni içerik geldikçe aşağıda tut

const messageGroups = computed(() => groupMessagesByDay(messages.messages))

onMounted(async () => {
  await messages.fetchOrCreateConversation()
  messages.subscribeToMessages()
  await nextTick()
  scrollToBottom()
})

onUnmounted(() => {
  messages.unsubscribe()
})

watch(() => messages.messages.length, () => {
  nextTick(scrollToBottom)
})

async function handleSend({ text, file }) {
  let imageUrl = null
  if (file) {
    if (!messages.conversation) await messages.fetchOrCreateConversation()
    imageUrl = await messages.uploadMessageImage(file)
  }
  await messages.sendMessage(text, imageUrl)
  await nextTick()
  scrollToBottom()
}

function onScroll() {
  const el = scrollEl.value
  if (!el) return
  stick.value = el.scrollHeight - el.scrollTop - el.clientHeight < 120
}

function keepDown() {
  if (stick.value) scrollToBottom()
}

function scrollToBottom() {
  const el = scrollEl.value
  if (el) {
    el.scrollTop = el.scrollHeight
    stick.value = true
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

.send-error {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  color: #f87171;
  background: rgba(239, 68, 68, 0.08);
  border-top: 1px solid rgba(239, 68, 68, 0.2);
}

@media (min-width: 1024px) {
  .chat-page { height: 100dvh; }
}
</style>
