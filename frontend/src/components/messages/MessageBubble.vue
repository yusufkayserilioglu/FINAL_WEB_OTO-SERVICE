<template>
  <div class="bubble-wrapper" :class="isOwn ? 'own' : 'other'">
    <div
      class="bubble"
      :class="[isOwn ? 'bubble-own' : 'bubble-other', { 'has-image': message.image_url }]"
    >
      <img
        v-if="message.image_url"
        :src="message.image_url"
        class="bubble-image"
        alt="Fotoğraf"
        loading="lazy"
        @click="lightbox = true"
        @load="$emit('img-load')"
      />
      <p v-if="message.content" class="bubble-text">{{ message.content }}</p>
      <span class="time">{{ formattedTime }}</span>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="lightbox" class="lightbox" @click="lightbox = false">
          <button class="lightbox-close" aria-label="Kapat" @click="lightbox = false">
            <X :size="22" />
          </button>
          <img :src="message.image_url" class="lightbox-image" alt="Fotoğraf" @click.stop />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  message: { type: Object, required: true },
})
defineEmits(['img-load'])

const auth  = useAuthStore()
const isOwn = computed(() => props.message.sender_id === auth.currentUser?.id)

const lightbox = ref(false)

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

.bubble.has-image {
  padding: 4px;
  max-width: min(78%, 260px);
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

.bubble-image {
  display: block;
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 14px;
  cursor: pointer;
}

.bubble-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.bubble.has-image .bubble-text {
  padding: 6px 10px 0;
}

.time {
  display: block;
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.65;
  text-align: right;
}

.bubble.has-image .time {
  padding: 2px 10px 4px;
  margin-top: 2px;
}

/* ── Tam ekran fotoğraf ── */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.lightbox-close {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 14px);
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
