<template>
  <div class="item-row" :class="{ disabled }">
    <div class="rn">{{ index + 1 }}</div>

    <div class="grid">
      <label class="f f-brand">
        <span class="lbl">Marka</span>
        <PartCombobox
          v-model="item.brand"
          :items="brands"
          :disabled="disabled"
          placeholder="—"
        />
      </label>

      <label class="f f-name">
        <span class="lbl">Stok adı</span>
        <PartCombobox
          v-model="item.description"
          :items="parts"
          :disabled="disabled"
          placeholder="Kalem adı"
          @select="onPickPart"
        />
      </label>

      <label class="f f-unit">
        <span class="lbl">Birim</span>
        <input
          v-model="item.unit"
          :disabled="disabled"
          class="inp"
          list="report-units"
          placeholder="adet"
        />
      </label>

      <label class="f f-qty">
        <span class="lbl">Miktar</span>
        <input
          v-model="item.quantity"
          :disabled="disabled"
          type="number" min="0" step="0.01" inputmode="decimal"
          class="inp ta-r"
        />
      </label>

      <label class="f f-price">
        <span class="lbl">Birim fiyat ₺</span>
        <input
          v-model="item.unit_price"
          :disabled="disabled"
          type="number" min="0" step="0.01" inputmode="decimal"
          class="inp ta-r"
        />
      </label>

      <div class="f f-total">
        <span class="lbl">Tutar</span>
        <div class="total-val">{{ money(line) }}</div>
      </div>
    </div>

    <div class="actions">
      <button type="button" class="ic" :disabled="disabled" title="Yukarı" @click="$emit('move', -1)">▲</button>
      <button type="button" class="ic" :disabled="disabled" title="Aşağı" @click="$emit('move', 1)">▼</button>
      <button type="button" class="ic del" :disabled="disabled" title="Sil" @click="$emit('remove')">✕</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PartCombobox from './PartCombobox.vue'
import { lineTotal, formatTRY } from '@/utils/report'

const props = defineProps({
  item:     { type: Object, required: true },
  index:    { type: Number, required: true },
  parts:    { type: Array,  default: () => [] },
  brands:   { type: Array,  default: () => [] },
  disabled: { type: Boolean, default: false },
})
defineEmits(['remove', 'move'])

const line = computed(() => lineTotal(props.item))
function money(v) { return formatTRY(v) }

// Katalogdan kalem seçilince birim / marka / son fiyatı otomatik doldur
function onPickPart(row) {
  if (row.default_unit && (!props.item.unit || props.item.unit === 'adet')) {
    props.item.unit = row.default_unit
  }
  if (row.default_brand && !props.item.brand) {
    props.item.brand = row.default_brand
  }
  if (row.last_unit_price != null && (!props.item.unit_price || Number(props.item.unit_price) === 0)) {
    props.item.unit_price = row.last_unit_price
  }
}
</script>

<style scoped>
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.item-row.disabled { opacity: 0.75; }

.rn {
  width: 20px;
  flex-shrink: 0;
  text-align: center;
  color: #666;
  font-size: 12px;
  padding-top: 26px;
}

.grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1.1fr 2fr 0.9fr 0.8fr 1fr 1fr;
  gap: 8px;
}
@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr 1fr; }
  .f-name { grid-column: 1 / -1; }
}

.f { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.lbl {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #7a7a7a;
}

.inp {
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
.inp:focus { border-color: rgba(201, 168, 76, 0.5); }
.inp:disabled { opacity: 0.6; }
.ta-r { text-align: right; }

.total-val {
  padding: 9px 4px;
  font-size: 13px;
  font-weight: 700;
  color: #e0bc6e;
  text-align: right;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 20px;
}
.ic {
  width: 24px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #888;
  font-size: 10px;
  cursor: pointer;
  line-height: 1;
}
.ic:hover:not(:disabled) { color: #e5e5e5; border-color: rgba(255,255,255,0.25); }
.ic.del:hover:not(:disabled) { color: #ef4444; border-color: rgba(239,68,68,0.4); }
.ic:disabled { opacity: 0.4; cursor: default; }
</style>
