<template>
  <div class="chat">
    <!-- Başlık -->
    <header class="head">
      <button class="back" aria-label="Geri" @click="$router.push('/admin/mesajlar')">
        <ChevronLeft :size="20" />
      </button>

      <div class="who">
        <span class="avatar">{{ initials }}</span>
        <div class="who-text">
          <p class="name">{{ customerName }}</p>
          <p class="sub mono">{{ customerPhone || 'Telefon kayıtlı değil' }}</p>
        </div>
      </div>

      <div class="head-actions">
        <a v-if="customerPhone" :href="`tel:${customerPhone.replace(/\s/g, '')}`" class="act" aria-label="Ara">
          <Phone :size="17" />
        </a>
        <RouterLink v-if="userId" :to="`/admin/uye/${userId}`" class="act" aria-label="Müşteri kartı">
          <User :size="17" />
        </RouterLink>
      </div>
    </header>

    <!-- Mesajlar -->
    <div ref="scrollEl" class="stream">
      <LoadingBlock v-if="messages.loading && !messages.messages.length" />

      <EmptyState
        v-else-if="!messages.messages.length"
        :icon="MessageCircle"
        title="Henüz mesaj yok"
        description="İlk mesajı siz yazarak konuşmayı başlatabilirsiniz."
      />

      <template v-else>
        <div v-for="group in grouped" :key="group.day">
          <div class="day"><span>{{ group.day }}</span></div>
          <MessageBubble
            v-for="msg in group.items"
            :key="msg.id"
            :message="msg"
            deletable
            @delete="messages.deleteMessage($event)"
          />
        </div>
      </template>
    </div>

    <!-- Hızlı yanıtlar -->
    <div v-if="showQuick" class="quick hide-scrollbar">
      <button v-for="q in quickReplies" :key="q" class="quick-btn" @click="useQuick(q)">
        {{ q }}
      </button>
    </div>

    <!-- Giriş -->
    <div class="composer">
      <textarea
        ref="inputEl"
        v-model="draft"
        class="input"
        rows="1"
        placeholder="Yanıt yazın..."
        enterkeyhint="send"
        @input="autoGrow"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <button class="send" :disabled="!draft.trim() || messages.sending" aria-label="Gönder" @click="send">
        <Send :size="18" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ChevronLeft, Phone, User, Send, MessageCircle } from '@lucide/vue'
import MessageBubble from '@/components/messages/MessageBubble.vue'
import EmptyState    from '@/components/app/EmptyState.vue'
import LoadingBlock  from '@/components/app/LoadingBlock.vue'
import { useMessagesStore } from '@/stores/messages'

const route    = useRoute()
const messages = useMessagesStore()

const draft    = ref('')
const scrollEl = ref(null)
const inputEl  = ref(null)

const conv         = computed(() => messages.conversation)
const customerName = computed(() => conv.value?.profiles?.name  || 'Müşteri')
const customerPhone= computed(() => conv.value?.profiles?.phone || '')
const userId       = computed(() => conv.value?.user_id || null)

const initials = computed(() =>
  customerName.value.trim().split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2)
)

const showQuick = computed(() => !draft.value.trim())

const quickReplies = [
  'Merhaba, nasıl yardımcı olabilirim?',
  'Aracınız hazır, teslim alabilirsiniz.',
  'Fiyat teklifi hazırlıyorum, kısa süre içinde ileteceğim.',
  'Randevunuz onaylandı.',
  'Parça tedarik sürecinde, gelişmeleri paylaşacağım.',
]

/** Mesajları güne göre grupla */
const grouped = computed(() => {
  const groups = []
  for (const msg of messages.messages) {
    const day = formatDay(msg.created_at)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(msg)
    else groups.push({ day, items: [msg] })
  }
  return groups
})

onMounted(async () => {
  await messages.loadConversationById(route.params.id)
  messages.subscribeToConversation(route.params.id)
  await nextTick()
  scrollToBottom(false)
})

onUnmounted(() => messages.unsubscribeConversation())

watch(() => messages.messages.length, async () => {
  await nextTick()
  scrollToBottom()
  // Sohbet açıkken gelen mesajları anında okundu say
  messages.markRead(true)
})

async function send() {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  resetGrow()
  try {
    await messages.sendAdminMessage(route.params.id, text)
  } catch {
    draft.value = text
  }
}

function useQuick(text) {
  draft.value = text
  nextTick(() => { inputEl.value?.focus(); autoGrow() })
}

function autoGrow() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function resetGrow() {
  if (inputEl.value) inputEl.value.style.height = 'auto'
}

function scrollToBottom(smooth = true) {
  const el = scrollEl.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

function formatDay(ts) {
  const d     = new Date(ts)
  const today = new Date()
  const yest  = new Date(); yest.setDate(today.getDate() - 1)
  const same  = (a, b) => a.toDateString() === b.toDateString()
  if (same(d, today)) return 'Bugün'
  if (same(d, yest))  return 'Dün'
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: var(--ink);
}

/* ── Başlık ───────────────────────────────────── */
.head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding: 10px 12px;
  padding-top: calc(var(--safe-top) + 10px);
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.back, .act {
  width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px;
  border: 1px solid var(--line); background: var(--surface-2);
  color: #c3c9d1; display: flex; align-items: center; justify-content: center;
}
.back:active, .act:active { transform: scale(0.94); }

.who { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }

.avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgb(var(--accent-rgb) / 0.14);
  border: 1px solid rgb(var(--accent-rgb) / 0.35);
  color: var(--accent); font-size: 13px; font-weight: 700;
}

.who-text { min-width: 0; }
.name { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 15px; color: #fff;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub  { font-size: 10.5px; color: #5b626c; }

.head-actions { display: flex; gap: 6px; flex-shrink: 0; }

/* ── Akış ─────────────────────────────────────── */
.stream {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px 6px;
  overscroll-behavior: contain;
}

.day { display: flex; justify-content: center; margin: 12px 0 10px; }

.day span {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #5b626c;
  background: var(--surface-2);
  border: 1px solid var(--line-soft);
  padding: 4px 11px;
  border-radius: 999px;
}

/* ── Hızlı yanıtlar ───────────────────────────── */
.quick {
  display: flex; gap: 7px; overflow-x: auto; flex-shrink: 0;
  padding: 8px 14px; background: var(--ink);
}

.quick-btn {
  flex-shrink: 0;
  padding: 7px 13px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: #9aa1ab;
  font-size: 12.5px;
  white-space: nowrap;
}
.quick-btn:active { border-color: rgb(var(--accent-rgb) / 0.5); color: var(--accent-light); }

/* ── Yazma alanı ──────────────────────────────── */
.composer {
  display: flex;
  align-items: flex-end;
  gap: 9px;
  flex-shrink: 0;
  padding: 10px 12px calc(10px + var(--safe-bottom));
  background: var(--surface);
  border-top: 1px solid var(--line);
}

.input {
  flex: 1;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 11px 15px;
  color: #f3f4f6;
  font-size: 15px;
  line-height: 1.4;
  resize: none;
  max-height: 120px;
}
.input:focus { border-color: rgb(var(--accent-rgb) / 0.5); }

.send {
  width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%;
  border: none; background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.2s, transform 0.12s;
}
.send:disabled { opacity: 0.4; }
.send:active:not(:disabled) { transform: scale(0.92); }
</style>
