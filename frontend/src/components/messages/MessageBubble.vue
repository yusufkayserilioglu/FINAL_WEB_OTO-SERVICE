<template>
  <div class="bubble-wrapper" :class="isOwn ? 'own' : 'other'">
    <div class="bubble" :class="isOwn ? 'bubble-own' : 'bubble-other'">
      <p>{{ message.content }}</p>
      <span class="time">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  message: { type: Object, required: true },
})

const auth  = useAuthStore()
const isOwn = computed(() => props.message.sender_id === auth.currentUser?.id)

const formattedTime = computed(() => {
  const d = new Date(props.message.created_at)
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
})
</script>

<style scoped>
.bubble-wrapper {
  display: flex;
  margin-bottom: 8px;
}
.bubble-wrapper.own   { justify-content: flex-end; }
.bubble-wrapper.other { justify-content: flex-start; }

.bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 18px;
  word-break: break-word;
}

.bubble-own {
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  border-bottom-right-radius: 4px;
}

.bubble-other {
  background: #1a1a1a;
  color: #e5e5e5;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(201, 168, 76, 0.15);
}

.bubble p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.time {
  display: block;
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.65;
  text-align: right;
}
</style>
