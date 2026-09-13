<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Müşteri Mesajları</h1>
    </div>

    <div v-if="messages.loading" class="loading">Yükleniyor...</div>

    <div v-else-if="!inbox.length" class="empty-state">
      <MessageCircle :size="48" class="empty-icon" />
      <p>Henüz mesaj yok</p>
    </div>

    <!-- Conversation list or active chat -->
    <template v-else-if="!active">
      <div
        v-for="item in inbox"
        :key="item.key"
        class="conv-item"
        @click="openItem(item)"
      >
        <div class="conv-avatar" :class="{ guest: item.guest }">{{ initials(item.name) }}</div>
        <div class="conv-info">
          <p class="conv-name">
            {{ item.name }}
            <span v-if="item.guest" class="guest-badge">Üye Değil</span>
          </p>
          <p class="conv-phone">{{ formatPhone(item.phone) }}</p>
        </div>
        <div class="conv-meta">
          <span v-if="item.unread > 0" class="unread-badge">{{ item.unread }}</span>
          <span class="conv-time">{{ formatTime(item.at) }}</span>
        </div>
      </div>
    </template>

    <!-- Active chat -->
    <div v-else class="chat-view">
      <button class="back-btn" @click="closeConversation">
        <ChevronLeft :size="20" /> Geri
      </button>
      <div class="chat-customer-name">
        {{ active.name }}
        <span v-if="active.guest" class="guest-badge">Üye Değil</span>
        <p v-if="active.guest" class="chat-customer-sub">
          {{ formatPhone(active.phone) }}<template v-if="activeGuest?.car_info"> · {{ activeGuest.car_info }}</template>
        </p>
      </div>

      <div class="messages-area" ref="scrollEl" @scroll="onScroll">
        <template v-for="group in messageGroups" :key="group.key">
          <DateDivider v-if="group.label" :label="group.label" />
          <MessageBubble
            v-for="msg in group.items"
            :key="msg.id"
            :message="msg"
            @img-load="keepDown"
          />
        </template>
      </div>

      <!-- Üye olmayan ziyaretçi uygulamadan yanıt alamaz → usta WhatsApp'tan döner -->
      <div v-if="active.guest" class="guest-reply">
        <p class="guest-reply-note">
          Bu kişi üye değil, uygulama içinden yanıt alamaz. WhatsApp üzerinden dönüş yapın.
        </p>
        <div class="guest-reply-actions">
          <a :href="whatsappLink" target="_blank" rel="noopener" class="wa-btn">
            <MessageCircle :size="16" /> WhatsApp'tan Yanıtla
          </a>
          <a :href="`tel:${active.phone}`" class="icon-btn" aria-label="Ara">
            <Phone :size="16" />
          </a>
          <button class="icon-btn danger" aria-label="Mesajları sil" @click="removeGuestThread">
            <Trash2 :size="16" />
          </button>
        </div>
        <p v-if="guestError" class="guest-error">{{ guestError }}</p>
      </div>
      <ChatComposer v-else :on-submit="handleSend" placeholder="Yanıt yazın..." />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { MessageCircle, ChevronLeft, Phone, Trash2 } from 'lucide-vue-next'
import { useMessagesStore } from '@/stores/messages'
import { formatPhone } from '@/stores/auth'
import MessageBubble from '@/components/messages/MessageBubble.vue'
import DateDivider   from '@/components/messages/DateDivider.vue'
import ChatComposer  from '@/components/messages/ChatComposer.vue'
import { groupMessagesByDay } from '@/utils/chat'
import site from '@/config/site'

const messages   = useMessagesStore()
const active     = ref(null)   // açık sohbet: inbox satırı { key, guest, id?, name, phone }
const scrollEl   = ref(null)
const stick      = ref(true)
const guestError = ref('')

// Üyelerin sohbetleri + üye olmadan yazanlar tek listede, en yeni üstte
const inbox = computed(() => [
  ...messages.conversations.map(c => ({
    key:    c.id,
    guest:  false,
    id:     c.id,
    name:   c.profiles?.name || 'Müşteri',
    phone:  c.profiles?.phone || '',
    unread: c.unread_admin,
    at:     c.last_message_at,
  })),
  ...messages.guestThreads.map(t => ({
    key:    `guest:${t.phone}`,
    guest:  true,
    name:   t.name,
    phone:  t.phone,
    unread: t.unread,
    at:     t.last_message_at,
  })),
].sort((a, b) => toTime(b.at) - toTime(a.at)))

const activeGuest = computed(() =>
  active.value?.guest ? messages.guestThreads.find(t => t.phone === active.value.phone) : null)

const chatMessages  = computed(() => (active.value?.guest ? activeGuest.value?.items ?? [] : messages.messages))
const messageGroups = computed(() => groupMessagesByDay(chatMessages.value))

const whatsappLink = computed(() => {
  if (!active.value?.guest) return ''
  const firstName = (active.value.name || '').trim().split(/\s+/)[0]
  const text = `Merhaba ${firstName}, ${site.name} olarak mesajınıza dönüş yapıyoruz.`
  return `https://wa.me/${active.value.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
})

onMounted(() => messages.fetchAllConversations())
onUnmounted(() => messages.unsubscribe())

watch(() => chatMessages.value.length, () => nextTick(scrollToBottom))

async function openItem(item) {
  // Önceki sohbetin aboneliği kapatılmazsa yeni mesajlar düşmüyordu
  messages.unsubscribe()
  active.value     = item
  guestError.value = ''
  if (item.guest) {
    messages.markGuestRead(item.phone)
  } else {
    await messages.loadConversationById(item.id)
    messages.subscribeToMessages()
  }
  nextTick(scrollToBottom)
}

function closeConversation() {
  messages.unsubscribe()
  active.value = null
  messages.fetchAllConversations()
}

async function removeGuestThread() {
  if (!confirm(`${active.value.name} adlı kişinin tüm mesajları silinsin mi?`)) return
  try {
    await messages.deleteGuestThread(active.value.phone)
    active.value = null
  } catch (e) {
    guestError.value = e.message
  }
}

async function handleSend({ text, file }) {
  const convId = active.value.id
  let imageUrl = null
  if (file) imageUrl = await messages.uploadMessageImage(file, convId)
  await messages.sendAdminMessage(convId, text, imageUrl)
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

function initials(name) {
  return (name || 'M').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function toTime(ts) {
  return ts ? new Date(ts).getTime() : 0
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

/* Üye olmayan ziyaretçi */
.conv-avatar.guest {
  background: #1a1a1a;
  color: #c9a84c;
  border: 1px dashed rgba(201, 168, 76, 0.5);
}

.conv-info { flex: 1; }
.conv-name  { font-weight: 600; color: #e5e5e5; font-size: 14px; margin: 0 0 2px; }
.conv-phone { font-size: 12px; color: #888; margin: 0; }

.guest-badge {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(201, 168, 76, 0.15);
  color: #c9a84c;
  margin-left: 6px;
  vertical-align: middle;
}

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

.chat-customer-sub {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 400;
  color: #888;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Üye olmayan ziyaretçiye yanıt: WhatsApp */
.guest-reply {
  flex-shrink: 0;
  padding: 12px 16px;
  background: #111;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.guest-reply-note {
  margin: 0 0 10px;
  font-size: 12px;
  color: #888;
}

.guest-reply-actions {
  display: flex;
  gap: 8px;
}

.wa-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 12px;
  background: #25d366;
  color: #062e16;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.icon-btn {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: #1a1a1a;
  color: #c9a84c;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn.danger { color: #f87171; }

.guest-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #f87171;
}

@media (min-width: 1024px) {
  .page-container { height: 100dvh; }
}
</style>
