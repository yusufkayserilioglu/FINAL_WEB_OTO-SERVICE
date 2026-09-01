<template>
  <div class="mb-4">
    <label v-if="label" class="block text-gray-400 text-sm font-medium mb-1.5">{{ label }}</label>
    <input
      v-bind="$attrs"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
             text-white placeholder:text-gray-600 text-sm
             focus:border-gold/50 focus:bg-white/8
             transition-all duration-200"
    />
  </div>
</template>

<script setup>
defineOptions({ inheritAttrs: false })
defineProps({
  label:      { type: String },
  modelValue: { type: [String, Number], default: '' },
})
defineEmits(['update:modelValue'])
</script>
