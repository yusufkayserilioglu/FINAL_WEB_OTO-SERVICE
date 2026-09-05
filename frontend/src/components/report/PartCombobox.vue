<template>
  <div class="combo" ref="rootEl">
    <input
      ref="inputEl"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="combo-input"
      autocomplete="off"
      @input="onInput"
      @focus="open = true"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="pickHighlighted"
      @keydown.esc="open = false"
    />
    <ul v-if="open && matches.length" class="combo-list">
      <li
        v-for="(m, i) in matches"
        :key="m.id || m.name"
        class="combo-item"
        :class="{ active: i === highlight }"
        @mousedown.prevent="pick(m)"
        @mouseenter="highlight = i"
      >
        <span class="ci-name">{{ m.name }}</span>
        <span v-if="m.default_unit || m.default_brand || m.last_unit_price" class="ci-meta">
          <template v-if="m.default_brand">{{ m.default_brand }} · </template>
          <template v-if="m.default_unit">{{ m.default_unit }}</template>
          <template v-if="m.last_unit_price"> · {{ priceText(m.last_unit_price) }}</template>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { formatTRY } from '@/utils/report'

const props = defineProps({
  modelValue:  { type: String, default: '' },
  items:       { type: Array,  default: () => [] },   // katalog satırları
  placeholder: { type: String, default: '' },
  disabled:    { type: Boolean, default: false },
  limit:       { type: Number, default: 10 },
})
const emit = defineEmits(['update:modelValue', 'select'])

const rootEl   = ref(null)
const inputEl  = ref(null)
const open     = ref(false)
const highlight = ref(-1)

onClickOutside(rootEl, () => { open.value = false })

const matches = computed(() => {
  const q = (props.modelValue || '').trim().toLocaleLowerCase('tr')
  const list = props.items || []
  const filtered = q
    ? list.filter(x => x.name.toLocaleLowerCase('tr').includes(q))
    : list
  return filtered.slice(0, props.limit)
})

function onInput(e) {
  emit('update:modelValue', e.target.value)
  open.value = true
  highlight.value = -1
}

function pick(m) {
  emit('update:modelValue', m.name)
  emit('select', m)
  open.value = false
  highlight.value = -1
}

function pickHighlighted() {
  if (highlight.value >= 0 && matches.value[highlight.value]) {
    pick(matches.value[highlight.value])
  } else {
    open.value = false
  }
}

function move(dir) {
  if (!open.value) { open.value = true; return }
  const n = matches.value.length
  if (!n) return
  highlight.value = (highlight.value + dir + n) % n
}

function priceText(v) { return formatTRY(v) }
</script>

<style scoped>
.combo { position: relative; }

.combo-input {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 9px 11px;
  color: #e5e5e5;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.combo-input:focus { border-color: rgba(201, 168, 76, 0.5); }
.combo-input:disabled { opacity: 0.6; }

.combo-list {
  position: absolute;
  z-index: 50;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: #141414;
  border: 1px solid rgba(201, 168, 76, 0.25);
  border-radius: 10px;
  max-height: 240px;
  overflow-y: auto;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}
.combo-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 9px;
  border-radius: 7px;
  cursor: pointer;
}
.combo-item.active { background: rgba(201, 168, 76, 0.14); }
.ci-name { color: #e9e9e9; font-size: 13px; }
.ci-meta { color: #7c7c7c; font-size: 11px; }
</style>
