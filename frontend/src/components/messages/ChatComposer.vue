<template>
  <div class="composer">
    <!-- Seçilen fotoğrafın önizlemesi -->
    <div v-if="previewUrl" class="preview">
      <img :src="previewUrl" class="preview-img" alt="Seçilen fotoğraf" />
      <button class="preview-remove" aria-label="Fotoğrafı kaldır" @click="clearFile">
        <X :size="14" />
      </button>
      <span class="preview-hint">Fotoğraf gönderilecek — istersen bir not ekle</span>
    </div>

    <p v-if="error" class="composer-error">{{ error }}</p>

    <div class="input-bar">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="file-input"
        @change="onPick"
      />
      <button
        class="attach-btn"
        aria-label="Fotoğraf ekle"
        :disabled="busy"
        @click="fileInput?.click()"
      >
        <ImagePlus :size="20" />
      </button>

      <textarea
        v-model="text"
        class="message-input"
        :placeholder="placeholder"
        rows="1"
        @keydown.enter.exact.prevent="submit"
      ></textarea>

      <button class="send-btn" :disabled="!canSend" @click="submit">
        <Loader2 v-if="busy" :size="20" class="spin" />
        <Send v-else :size="20" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { Send, ImagePlus, X, Loader2 } from 'lucide-vue-next'
import { compressImage } from '@/utils/image'

const props = defineProps({
  // async ({ text, file }) => void  — başarısız olursa hata fırlatmalı
  onSubmit:    { type: Function, required: true },
  placeholder: { type: String, default: 'Mesajınızı yazın...' },
})

const MAX_FILE_BYTES = 15 * 1024 * 1024

const text      = ref('')
const file      = ref(null)
const previewUrl = ref('')
const busy      = ref(false)
const error     = ref('')
const fileInput = ref(null)

const canSend = computed(() => !busy.value && (text.value.trim().length > 0 || !!file.value))

function onPick(e) {
  const picked = e.target.files?.[0]
  e.target.value = ''          // aynı dosya tekrar seçilebilsin
  if (!picked) return

  if (!picked.type.startsWith('image/')) {
    error.value = 'Yalnızca resim dosyası gönderebilirsiniz.'
    return
  }
  if (picked.size > MAX_FILE_BYTES) {
    error.value = 'Fotoğraf çok büyük (en fazla 15 MB).'
    return
  }

  error.value = ''
  setFile(picked)
}

function setFile(f) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = f
  previewUrl.value = f ? URL.createObjectURL(f) : ''
}

function clearFile() {
  setFile(null)
}

async function submit() {
  if (!canSend.value) return

  const sentText = text.value.trim()
  const sentFile = file.value
  const sentPreview = previewUrl.value

  busy.value = true
  error.value = ''
  // İyimser temizlik: alanı hemen boşalt
  text.value = ''
  file.value = null
  previewUrl.value = ''

  try {
    const toSend = sentFile ? await compressImage(sentFile) : null
    await props.onSubmit({ text: sentText, file: toSend })
    if (sentPreview) URL.revokeObjectURL(sentPreview)
  } catch (e) {
    // Gönderilemedi → yazılanları geri koy
    text.value = sentText || text.value
    file.value = sentFile
    previewUrl.value = sentPreview
    error.value = 'Gönderilemedi. Tekrar deneyin.'
  } finally {
    busy.value = false
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<style scoped>
.composer {
  flex-shrink: 0;
  background: #111;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── Önizleme ── */
.preview {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 0;
}

.preview-img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid rgba(201, 168, 76, 0.25);
}

.preview-remove {
  position: absolute;
  top: 4px;
  left: 60px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.preview-hint {
  font-size: 11px;
  color: #888;
}

.composer-error {
  margin: 0;
  padding: 8px 16px 0;
  font-size: 12px;
  color: #f87171;
}

/* ── Giriş çubuğu ── */
.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
}

.file-input {
  display: none;
}

.attach-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #1a1a1a;
  color: #c9a84c;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.attach-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.message-input {
  flex: 1;
  min-width: 0;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  cursor: default;
}

.spin {
  animation: composer-spin 0.9s linear infinite;
}

@keyframes composer-spin {
  to { transform: rotate(360deg); }
}
</style>
