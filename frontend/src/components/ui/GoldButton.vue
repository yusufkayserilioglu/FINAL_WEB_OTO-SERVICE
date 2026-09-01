<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : (type || 'button')"
    :disabled="loading || disabled"
    :class="[
      'inline-flex items-center justify-center gap-2 font-display font-bold rounded-xl transition-all duration-200',
      'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
      variant === 'ghost'
        ? 'border border-white/15 text-white hover:border-gold/50 hover:text-gold px-6 py-3'
        : 'bg-gradient-to-r from-gold to-gold-light text-black hover:shadow-gold hover:scale-[1.02] px-6 py-3',
      sizeClass,
    ]"
  >
    <span
      v-if="loading"
      class="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"
    />
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  to:       { type: String,  default: null },
  type:     { type: String,  default: 'button' },
  variant:  { type: String,  default: 'gold' },
  size:     { type: String,  default: 'md' },
  loading:  { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const sizeClass = computed(() => ({
  sm: 'text-sm px-4 py-2',
  md: 'text-sm px-6 py-3',
  lg: 'text-base px-8 py-4',
}[props.size] ?? 'text-sm px-6 py-3'))
</script>
