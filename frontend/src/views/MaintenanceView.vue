<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Bakım Geçmişi</h1>
    </div>

    <!-- Car filter -->
    <div v-if="cars.cars.length > 1" class="car-filter">
      <button
        class="filter-btn"
        :class="{ active: !selectedCarId }"
        @click="selectCar(null)"
      >Tümü</button>
      <button
        v-for="car in cars.cars"
        :key="car.id"
        class="filter-btn"
        :class="{ active: selectedCarId === car.id }"
        @click="selectCar(car.id)"
      >
        {{ car.brand.toUpperCase() }} {{ car.model }}
      </button>
    </div>

    <div v-if="maintenance.loading" class="loading">Yükleniyor...</div>

    <div v-else-if="!maintenance.records.length" class="empty-state">
      <Wrench :size="48" class="empty-icon" />
      <p>Henüz bakım kaydı yok</p>
      <p class="sub">Bakım kayıtlarınız servis ekibi tarafından eklenir</p>
    </div>

    <div v-else>
      <MaintenanceCard
        v-for="record in maintenance.records"
        :key="record.id"
        :record="record"
        :is-admin="false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Wrench } from 'lucide-vue-next'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useCarsStore }        from '@/stores/cars'
import MaintenanceCard from '@/components/maintenance/MaintenanceCard.vue'

const maintenance   = useMaintenanceStore()
const cars          = useCarsStore()
const selectedCarId = ref(null)

onMounted(() => {
  cars.fetchCars()
  maintenance.fetchRecords()
})

function selectCar(carId) {
  selectedCarId.value = carId
  maintenance.fetchRecords(carId)
}
</script>

<style scoped>
.page-container {
  padding: 24px 16px;
  padding-bottom: 100px;
  min-height: 100vh;
  background: #080808;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #e5e5e5;
}

.car-filter {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 16px;
  scrollbar-width: none;
}

.car-filter::-webkit-scrollbar { display: none; }

.filter-btn {
  white-space: nowrap;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: #888;
  cursor: pointer;
  flex-shrink: 0;
}

.filter-btn.active {
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  border-color: transparent;
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
  margin-bottom: 16px;
}

.empty-state p {
  margin-bottom: 8px;
  font-size: 15px;
}

.sub {
  font-size: 13px !important;
  color: #444;
}
</style>
