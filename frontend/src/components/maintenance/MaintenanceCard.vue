<template>
  <div class="maint-card">
    <div class="maint-header">
      <div>
        <p class="car-name" v-if="record.cars">
          {{ record.cars.brand.toUpperCase() }} {{ record.cars.model }} · {{ record.cars.plate }}
        </p>
        <p class="date">{{ formattedDate }}</p>
      </div>
      <span class="cost">{{ formatCost(record.total_cost) }}</span>
    </div>

    <ul class="items-list" v-if="record.maintenance_items?.length">
      <li v-for="item in record.maintenance_items" :key="item.id" class="item-row">
        <span class="item-desc">{{ item.description }}</span>
        <div class="item-right">
          <span class="item-cost" v-if="item.cost">{{ formatCost(item.cost) }}</span>
          <button v-if="isAdmin" class="remove-btn" @click="$emit('remove-item', record.id, item.id)">×</button>
        </div>
      </li>
    </ul>
    <p v-else class="empty-items">Henüz kalem eklenmedi</p>

    <div v-if="isAdmin" class="admin-actions">
      <button class="add-item-btn" @click="$emit('add-item', record.id)">+ Kalem Ekle</button>
    </div>

    <p v-if="record.note" class="note">{{ record.note }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  record:  { type: Object, required: true },
  isAdmin: { type: Boolean, default: false },
})

defineEmits(['remove-item', 'add-item'])

const formattedDate = computed(() =>
  new Date(props.record.date).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
)

function formatCost(cost) {
  if (!cost) return '—'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(cost)
}
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
  margin-bottom: 14px;
}

.car-name {
  font-weight: 600;
  color: #c9a84c;
  font-size: 14px;
  margin: 0 0 4px;
}

.date {
  font-size: 12px;
  color: #888;
  margin: 0;
}

.cost {
  font-size: 16px;
  font-weight: 700;
  color: #e0bc6e;
}

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
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.item-desc {
  font-size: 13px;
  color: #ccc;
  flex: 1;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-cost {
  font-size: 13px;
  color: #e0bc6e;
  font-weight: 600;
}

.remove-btn {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.empty-items {
  color: #555;
  font-size: 12px;
  text-align: center;
  padding: 8px 0;
  font-style: italic;
}

.admin-actions {
  margin-top: 10px;
}

.add-item-btn {
  width: 100%;
  padding: 8px;
  background: rgba(201, 168, 76, 0.1);
  color: #c9a84c;
  border: 1px dashed rgba(201, 168, 76, 0.4);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.note {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
  font-style: italic;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
</style>
