<template>
  <div class="date-divider">
    <span>{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
})
</script>

<style scoped>
.date-divider {
  display: flex;
  justify-content: center;
  margin: 14px 0 10px;
}

.date-divider span {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #cbb87b;
  background: #161616;
  border: 1px solid rgba(201, 168, 76, 0.18);
  padding: 4px 12px;
  border-radius: 999px;
}
</style>
