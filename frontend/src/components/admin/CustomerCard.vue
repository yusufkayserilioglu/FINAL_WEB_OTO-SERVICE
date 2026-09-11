<template>
  <div class="customer-card" @click="$emit('select', customer.id)">
    <div class="avatar">{{ initials }}</div>
    <div class="info">
      <p class="name">
        {{ customer.name }}
        <span v-if="customer.is_walk_in" class="walk-in">Kayıtsız</span>
      </p>
      <p class="phone">{{ customer.phone || 'Telefon yok' }}</p>
      <p class="cars">{{ carSummary }}</p>
    </div>
    <ChevronRight :size="18" class="arrow" />
  </div>
</template>

<script setup>
import { computed }    from 'vue'
import { ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  customer: { type: Object, required: true },
})

defineEmits(['select'])

const initials = computed(() => {
  const parts = (props.customer.name || 'K').split(' ')
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
})

const carSummary = computed(() => {
  const cars = props.customer.cars || []
  if (!cars.length) return 'Araç yok'
  if (cars.length === 1) return `${cars[0].brand.toUpperCase()} ${cars[0].model}`
  return `${cars.length} araç`
})
</script>

<style scoped>
.customer-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1a1a1a;
  border: 1px solid rgba(201, 168, 76, 0.12);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.customer-card:hover {
  border-color: rgba(201, 168, 76, 0.35);
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info { flex: 1; }

.name {
  font-weight: 600;
  color: #e5e5e5;
  font-size: 14px;
  margin: 0 0 2px;
}

.walk-in {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(201, 168, 76, 0.15);
  color: #c9a84c;
  margin-left: 6px;
  vertical-align: middle;
}

.phone {
  font-size: 12px;
  color: #888;
  margin: 0 0 2px;
}

.cars {
  font-size: 11px;
  color: #c9a84c;
  margin: 0;
}

.arrow {
  color: #555;
}
</style>
