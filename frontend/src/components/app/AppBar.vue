<template>
  <header class="appbar" :class="{ sticky }">
    <div class="appbar-row">
      <button v-if="back" class="back" aria-label="Geri" @click="goBack">
        <ChevronLeft :size="20" />
      </button>

      <div class="titles">
        <p v-if="eyebrow" class="eyebrow-sm mono">{{ eyebrow }}</p>
        <h1 class="title">{{ title }}</h1>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>

      <div class="actions">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ChevronLeft } from '@lucide/vue'

const props = defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
  eyebrow:  { type: String, default: '' },
  back:     { type: [Boolean, String], default: false },
  sticky:   { type: Boolean, default: false },
})

const router = useRouter()

function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  else if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped>
.appbar {
  padding: 0 16px 14px;
}

.sticky {
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: calc(var(--safe-top) + 12px);
  background: rgba(8, 9, 11, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line-soft);
}

.appbar-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.back {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  margin-top: 2px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: #c3c9d1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back:active { transform: scale(0.94); }

.titles { flex: 1; min-width: 0; }

.eyebrow-sm {
  font-size: 9.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 3px;
}

.title {
  font-family: 'Archivo', sans-serif;
  font-weight: 800;
  font-size: 24px;
  letter-spacing: -0.03em;
  color: #fff;
  line-height: 1.15;
}

.subtitle {
  font-size: 12.5px;
  color: #767d88;
  margin-top: 3px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}
</style>
