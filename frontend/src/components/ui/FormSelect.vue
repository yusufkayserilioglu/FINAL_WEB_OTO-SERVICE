<template>
  <div class="mb-4">
    <label v-if="label" class="block text-gray-400 text-sm font-medium mb-1.5">{{ label }}</label>
    <div class="relative">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="select-custom w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10
               text-white text-sm appearance-none
               focus:border-gold/50
               transition-all duration-200"
      >
        <option v-if="placeholder" value="" disabled :selected="!modelValue">{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          class="bg-surface text-white"
        >
          {{ opt.label }}
        </option>
      </select>
      <!-- Chevron icon -->
      <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label:       { type: String },
  modelValue:  { type: String, default: '' },
  options:     { type: Array,  default: () => [] },
  placeholder: { type: String, default: 'Seçiniz' },
})
defineEmits(['update:modelValue'])
</script>
