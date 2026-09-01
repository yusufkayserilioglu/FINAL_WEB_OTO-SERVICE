<template>
  <div class="empty">
    <span class="empty-icon">
      <component :is="icon" :size="26" />
    </span>
    <p class="empty-title">{{ title }}</p>
    <p v-if="description" class="empty-desc">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup>
import { Inbox } from '@lucide/vue'

defineProps({
  icon:        { type: [Object, Function], default: () => Inbox },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<style scoped>
.empty {
  text-align: center;
  padding: 48px 22px;
}

.empty-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--accent-rgb) / 0.09);
  border: 1px solid rgb(var(--accent-rgb) / 0.2);
  color: rgb(var(--accent-rgb) / 0.8);
}

.empty-title {
  font-family: 'Archivo', sans-serif;
  font-weight: 700;
  font-size: 15.5px;
  color: #e6e9ed;
  margin-bottom: 5px;
}

.empty-desc {
  font-size: 13px;
  color: #5b626c;
  line-height: 1.55;
  max-width: 34ch;
  margin: 0 auto 16px;
}
</style>
