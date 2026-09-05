<template>
  <div class="maint-card">
    <div class="maint-header">
      <div>
        <p class="car-name" v-if="carLabel">{{ carLabel }}</p>
        <p class="date">
          {{ formattedDate }}
          <span v-if="record.report_no" class="rno">· {{ reportNo }}</span>
        </p>
      </div>
      <div class="head-right">
        <span v-if="isAdmin" class="status" :class="record.status === 'finalized' ? 'ok' : 'draft'">
          {{ record.status === 'finalized' ? 'Kesinleşti' : 'Taslak' }}
        </span>
        <span class="cost">{{ formatCost(total) }}</span>
      </div>
    </div>

    <p v-if="record.title" class="title-line">{{ record.title }}</p>

    <ul class="items-list" v-if="record.maintenance_items?.length">
      <li v-for="item in sortedItems" :key="item.id" class="item-row">
        <span class="item-desc">
          <span v-if="item.brand" class="item-brand">{{ item.brand }}</span>
          {{ item.description }}
        </span>
        <span class="item-right">
          <span class="item-qty">{{ qtyUnit(item) }} × {{ formatCost(item.unit_price) }}</span>
          <span class="item-cost">{{ formatCost(lineOf(item)) }}</span>
        </span>
      </li>
    </ul>
    <p v-else class="empty-items">Kalem eklenmedi</p>

    <p v-if="record.note" class="note">{{ record.note }}</p>

    <div class="card-actions">
      <RouterLink v-if="isAdmin" class="act gold" :to="`/admin/bakim/${record.id}`">
        {{ record.status === 'finalized' ? 'Raporu Aç' : 'Raporu Düzenle' }}
      </RouterLink>
      <RouterLink
        v-else-if="record.status === 'finalized'"
        class="act gold"
        :to="`/bakim/${record.id}`"
      >
        Raporu Görüntüle / PDF
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatTRY, formatQtyUnit, lineTotal, num, reportNoLabel } from '@/utils/report'

const props = defineProps({
  record:  { type: Object, required: true },
  isAdmin: { type: Boolean, default: false },
})

const sortedItems = computed(() =>
  (props.record.maintenance_items || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
)

const carLabel = computed(() => {
  const brand = props.record.car_brand || props.record.cars?.brand
  const model = props.record.car_model || props.record.cars?.model
  const plate = props.record.car_plate || props.record.cars?.plate
  if (!brand && !plate) return ''
  return `${(brand || '').toUpperCase()} ${model || ''} · ${plate || ''}`.trim()
})

const total = computed(() => {
  const g = props.record.grand_total ?? props.record.total_cost
  return g != null ? num(g) : sortedItems.value.reduce((s, i) => s + num(i.cost), 0)
})

const reportNo = computed(() => reportNoLabel(props.record))

const formattedDate = computed(() =>
  new Date(props.record.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
)

function formatCost(v) {
  if (v === null || v === undefined || v === '') return '—'
  return formatTRY(v)
}
function qtyUnit(item) { return formatQtyUnit(item) }
function lineOf(item)  { return item.cost != null ? num(item.cost) : lineTotal(item) }
</script>

<style scoped>
.maint-card {
  background: #1a1a1a;
  border: 1px solid rgba(201, 168, 76, 0.15);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.maint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.car-name { font-weight: 600; color: #c9a84c; font-size: 14px; margin: 0 0 4px; }
.date { font-size: 12px; color: #888; margin: 0; }
.rno { color: #666; }

.head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.status {
  font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.status.draft { background: rgba(234,179,8,0.18); color: #eab308; }
.status.ok    { background: rgba(34,197,94,0.18); color: #22c55e; }
.cost { font-size: 16px; font-weight: 700; color: #e0bc6e; }

.title-line { font-size: 13px; color: #ccc; margin: 0 0 8px; font-weight: 600; }

.items-list {
  list-style: none;
  padding: 0;
  margin: 0 0 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 10px;
}
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.item-desc { font-size: 13px; color: #ccc; flex: 1; min-width: 0; }
.item-brand {
  display: inline-block;
  font-size: 10px;
  color: #9a8548;
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 4px;
  padding: 0 4px;
  margin-right: 5px;
  text-transform: uppercase;
}
.item-right { display: flex; align-items: baseline; gap: 10px; flex-shrink: 0; }
.item-qty { font-size: 11px; color: #777; }
.item-cost { font-size: 13px; color: #e0bc6e; font-weight: 600; }

.empty-items {
  color: #555;
  font-size: 12px;
  text-align: center;
  padding: 8px 0;
  font-style: italic;
}

.note {
  margin: 6px 0 0;
  font-size: 12px;
  color: #666;
  font-style: italic;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.card-actions { margin-top: 12px; display: flex; gap: 8px; }
.act {
  flex: 1;
  text-align: center;
  padding: 9px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.act.gold {
  background: rgba(201, 168, 76, 0.12);
  color: #c9a84c;
  border: 1px solid rgba(201, 168, 76, 0.35);
}
</style>
