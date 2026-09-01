<template>
  <div class="appt-card">
    <div class="appt-header">
      <span class="service">{{ appointment.service_type }}</span>
      <span class="status" :class="appointment.status">{{ statusLabel }}</span>
    </div>
    <div class="appt-body">
      <div class="info-row">
        <Calendar :size="14" />
        <span>{{ formattedDate }} — {{ appointment.time?.slice(0, 5) }}</span>
      </div>
      <div v-if="appointment.cars" class="info-row">
        <Car :size="14" />
        <span>{{ appointment.cars.brand.toUpperCase() }} {{ appointment.cars.model }} · {{ appointment.cars.plate }}</span>
      </div>
      <p v-if="appointment.note" class="note">{{ appointment.note }}</p>
    </div>
    <div v-if="showActions && appointment.status === 'pending'" class="appt-footer">
      <button class="btn-cancel" @click="$emit('cancel', appointment.id)">İptal Et</button>
    </div>
    <!-- Admin actions -->
    <div v-if="isAdmin && appointment.status === 'pending'" class="appt-footer">
      <button class="btn-confirm" @click="$emit('confirm', appointment.id)">Onayla</button>
      <button class="btn-cancel"  @click="$emit('cancel', appointment.id)">İptal</button>
    </div>
    <!-- Admin customer info -->
    <div v-if="isAdmin && appointment.profiles" class="customer-row">
      <span>{{ appointment.profiles.name }}</span>
      <span>{{ appointment.profiles.phone }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Calendar, Car } from 'lucide-vue-next'

const props = defineProps({
  appointment: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
  isAdmin:     { type: Boolean, default: false },
})

defineEmits(['cancel', 'confirm'])

const statusMap = { pending: 'Bekliyor', confirmed: 'Onaylandı', cancelled: 'İptal' }
const statusLabel = computed(() => statusMap[props.appointment.status] || props.appointment.status)

const formattedDate = computed(() => {
  return new Date(props.appointment.date).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
})
</script>

<style scoped>
.appt-card {
  background: #1a1a1a;
  border: 1px solid rgba(201, 168, 76, 0.15);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.appt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.service {
  font-weight: 600;
  color: #c9a84c;
  font-size: 15px;
}

.status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.status.pending   { background: rgba(234, 179, 8, 0.2);  color: #eab308; }
.status.confirmed { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.status.cancelled { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #aaa;
  font-size: 13px;
  margin-bottom: 6px;
}

.note {
  color: #888;
  font-size: 12px;
  margin-top: 8px;
  font-style: italic;
}

.appt-footer {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.btn-cancel {
  flex: 1;
  padding: 8px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm {
  flex: 1;
  padding: 8px;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.customer-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
</style>
