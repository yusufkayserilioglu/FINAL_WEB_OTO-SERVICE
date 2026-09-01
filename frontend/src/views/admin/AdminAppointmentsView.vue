<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Randevular</h1>
    </div>

    <!-- Status filter tabs -->
    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span v-if="countByStatus(tab.value)" class="tab-count">{{ countByStatus(tab.value) }}</span>
      </button>
    </div>

    <div v-if="appointments.loading" class="loading">Yükleniyor...</div>

    <div v-else-if="!filteredAppointments.length" class="empty-state">
      <Calendar :size="48" class="empty-icon" />
      <p>Bu durumda randevu yok</p>
    </div>

    <div v-else>
      <AppointmentCard
        v-for="appt in filteredAppointments"
        :key="appt.id"
        :appointment="appt"
        :is-admin="true"
        @confirm="id => appointments.updateStatus(id, 'confirmed')"
        @cancel="id => appointments.updateStatus(id, 'cancelled')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Calendar } from 'lucide-vue-next'
import { useAppointmentsStore } from '@/stores/appointments'
import AppointmentCard from '@/components/appointments/AppointmentCard.vue'

const appointments = useAppointmentsStore()
const activeTab    = ref('pending')

const tabs = [
  { value: 'pending',   label: 'Bekleyen' },
  { value: 'confirmed', label: 'Onaylı' },
  { value: 'cancelled', label: 'İptal' },
]

onMounted(() => appointments.fetchAllAppointments())

const filteredAppointments = computed(() =>
  appointments.appointments.filter(a => a.status === activeTab.value)
)

function countByStatus(status) {
  return appointments.appointments.filter(a => a.status === status).length || 0
}
</script>

<style scoped>
.page-container {
  padding: 24px 16px;
  padding-bottom: 100px;
  min-height: 100vh;
  background: #080808;
}

.page-header { margin-bottom: 16px; }

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.filter-tab {
  flex: 1;
  padding: 9px 4px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.filter-tab.active {
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  border-color: transparent;
}

.tab-count {
  background: rgba(0,0,0,0.2);
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 11px;
}

.filter-tab.active .tab-count {
  background: rgba(0,0,0,0.15);
}

.loading {
  text-align: center;
  color: #888;
  padding: 40px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #555;
}

.empty-icon {
  color: rgba(201, 168, 76, 0.3);
  margin-bottom: 12px;
}
</style>
