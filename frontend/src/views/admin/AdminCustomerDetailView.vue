<template>
  <div class="page-container">
    <button class="back-btn" @click="$router.back()">
      <ChevronLeft :size="20" /> Müşteriler
    </button>

    <div v-if="loading" class="loading">Yükleniyor...</div>

    <template v-else-if="customer">
      <!-- Profile -->
      <div class="profile-card">
        <div class="profile-avatar">{{ initials }}</div>
        <div class="profile-info">
          <h1 class="profile-name">
            {{ customer.name }}
            <span v-if="customer.is_walk_in" class="walk-in">Kayıtsız</span>
          </h1>
          <p class="profile-phone">{{ customer.phone || 'Telefon yok' }}</p>
          <p v-if="customer.notes" class="profile-note">{{ customer.notes }}</p>
        </div>
        <button class="msg-btn" @click="openChat">
          <MessageCircle :size="18" />
        </button>
      </div>

      <!-- Cars -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Araçlar</h2>
          <button class="btn-add" @click="showCarForm = !showCarForm">+ Araç Ekle</button>
        </div>

        <div v-if="showCarForm" class="record-form">
          <select v-model="newCar.brand" class="form-control">
            <option value="">Marka seçin</option>
            <option v-for="b in brandOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
          <div class="form-grid">
            <input v-model="newCar.model" placeholder="Model" class="form-control" />
            <input v-model="newCar.year" type="number" placeholder="Yıl" class="form-control" />
          </div>
          <div class="form-grid">
            <input v-model="newCar.plate" placeholder="Plaka" class="form-control" />
            <input v-model="newCar.km" type="number" placeholder="Kilometre" class="form-control" />
          </div>
          <p v-if="carError" class="err">{{ carError }}</p>
          <button
            class="btn-submit"
            :disabled="!newCar.brand || !newCar.plate.trim() || savingCar"
            @click="addCar"
          >
            {{ savingCar ? 'Ekleniyor...' : 'Aracı Ekle' }}
          </button>
        </div>

        <div v-if="!customer.cars?.length" class="empty-sm">Araç yok</div>
        <div v-for="car in customer.cars" :key="car.id" class="car-chip">
          <div class="car-chip-top">
            <Car :size="14" />
            <span>{{ car.brand?.toUpperCase() }} {{ car.model }} · {{ car.plate }}</span>
            <span class="car-year">{{ car.year }}</span>
          </div>
          <div class="car-chip-meta">
            <span>KM: {{ formatKm(car.km) || '—' }}</span>
            <span>Sonraki bakım: {{ formatShortDate(car.next_service_date) || '—' }}</span>
          </div>
        </div>
      </section>

      <!-- Maintenance -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Bakım Raporları</h2>
          <button class="btn-add" @click="showNew = !showNew">+ Yeni Rapor</button>
        </div>

        <div v-if="showNew" class="record-form">
          <select v-model="newRecord.carId" class="form-control">
            <option value="">Araç seçin</option>
            <option v-for="car in customer.cars" :key="car.id" :value="car.id">
              {{ car.brand?.toUpperCase() }} {{ car.model }} · {{ car.plate }}
            </option>
          </select>
          <input v-model="newRecord.date" type="date" class="form-control" />
          <p v-if="createError" class="err">{{ createError }}</p>
          <button class="btn-submit" :disabled="!newRecord.carId || !newRecord.date || creating" @click="createRecord">
            {{ creating ? 'Oluşturuluyor...' : 'Rapor Taslağı Oluştur' }}
          </button>
        </div>

        <div v-if="maintenance.loading" class="loading">Yükleniyor...</div>
        <div v-else-if="!maintenance.records.length" class="empty-sm">Bakım kaydı yok</div>

        <MaintenanceCard
          v-for="record in maintenance.records"
          :key="record.id"
          :record="record"
          :is-admin="true"
        />
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }     from 'vue-router'
import { ChevronLeft, MessageCircle, Car } from 'lucide-vue-next'
import { useAdminStore }       from '@/stores/admin'
import { useMaintenanceStore } from '@/stores/maintenance'
import { formatKm, formatShortDate } from '@/utils/service'
import { brandOptions } from '@/data/brands'
import MaintenanceCard from '@/components/maintenance/MaintenanceCard.vue'

const route       = useRoute()
const router      = useRouter()
const admin       = useAdminStore()
const maintenance = useMaintenanceStore()

const customer   = ref(null)
const loading     = ref(true)
const showNew     = ref(false)
const creating    = ref(false)
const createError = ref(null)
const newRecord   = ref({ carId: '', date: new Date().toISOString().split('T')[0] })

// Kayıtsız müşterinin aracını admin ekler (bakım raporu araç ister)
const showCarForm = ref(false)
const savingCar   = ref(false)
const carError    = ref(null)
const newCar      = ref({ brand: '', model: '', year: '', plate: '', km: '' })

const initials = computed(() =>
  (customer.value?.name || 'M').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
)

onMounted(async () => {
  try {
    customer.value = await admin.fetchCustomerById(route.params.id)
    await maintenance.fetchRecordsForUser(route.params.id)
  } finally {
    loading.value = false
  }
})

async function createRecord() {
  creating.value = true
  createError.value = null
  try {
    const rec = await maintenance.createDraft({
      carId:  newRecord.value.carId,
      userId: route.params.id,
      date:   newRecord.value.date,
    })
    router.push(`/admin/bakim/${rec.id}`)
  } catch (e) {
    createError.value = e.message || 'Oluşturulamadı'
  } finally {
    creating.value = false
  }
}

async function addCar() {
  savingCar.value = true
  carError.value  = null
  try {
    const car = await admin.addCarForCustomer(route.params.id, newCar.value)
    customer.value.cars = [...(customer.value.cars || []), car]
    newCar.value = { brand: '', model: '', year: '', plate: '', km: '' }
    showCarForm.value = false
    newRecord.value.carId = car.id     // yeni araç rapor formunda hazır gelsin
  } catch (e) {
    carError.value = e.message || 'Araç eklenemedi'
  } finally {
    savingCar.value = false
  }
}

function openChat() {
  router.push('/admin/mesajlar')
}
</script>

<style scoped>
.page-container {
  padding-bottom: 100px;
  min-height: 100vh;
  background: #080808;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: none;
  border: none;
  color: #c9a84c;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.loading {
  text-align: center;
  color: #888;
  padding: 40px 0;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 20px;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  font-weight: 700;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info { flex: 1; }
.profile-name  { font-size: 18px; font-weight: 700; color: #e5e5e5; margin: 0 0 4px; }
.profile-phone { font-size: 13px; color: #888; margin: 0; }

.msg-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.3);
  color: #c9a84c;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.section {
  padding: 0 16px 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #c9a84c;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-header .section-title { margin: 0; }

.btn-add {
  background: rgba(201, 168, 76, 0.1);
  color: #c9a84c;
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.empty-sm {
  color: #555;
  font-size: 13px;
  font-style: italic;
  padding: 8px 0;
}

.car-chip {
  background: #1a1a1a;
  border: 1px solid rgba(201, 168, 76, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 13px;
}
.car-chip-top { display: flex; align-items: center; gap: 8px; }
.car-chip-top svg { color: #c9a84c; }
.car-year { margin-left: auto; color: #666; font-size: 12px; }
.car-chip-meta {
  display: flex;
  gap: 16px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255,255,255,0.05);
  font-size: 11px;
  color: #888;
}

.record-form {
  background: #111;
  border: 1px solid rgba(201, 168, 76, 0.15);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-control {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #e5e5e5;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}

.btn-submit {
  padding: 11px;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  border: none;
  border-radius: 10px;
  color: #080808;
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;
}
.btn-submit:disabled { opacity: 0.6; }

.err { color: #ef4444; font-size: 13px; margin: 0; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.walk-in {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 5px;
  background: rgba(201, 168, 76, 0.15);
  color: #c9a84c;
  margin-left: 8px;
  vertical-align: middle;
}

.profile-note {
  font-size: 12px;
  color: #777;
  margin: 4px 0 0;
  font-style: italic;
}
</style>
