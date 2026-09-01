<template>
  <div class="loading">
    <span class="spinner"></span>
    <span v-if="label" class="label">{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({ label: { type: String, default: 'Yükleniyor...' } })
</script>

<style scoped>
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
}

.spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid rgb(var(--accent-rgb) / 0.25);
  border-top-color: var(--accent);
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.label { font-size: 13px; color: #5b626c; }
</style>
