<template>
  <div
    class="rounded-2xl border border-white/8 transition-all duration-300"
    :class="[hoverable && 'hover:border-gold/30 hover:-translate-y-1 hover:shadow-card cursor-pointer', extraClass]"
    style="background: rgba(255,255,255,0.03); backdrop-filter: blur(12px);"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  hoverable:  { type: Boolean, default: false },
  extraClass: { type: String,  default: '' },
})
</script>
