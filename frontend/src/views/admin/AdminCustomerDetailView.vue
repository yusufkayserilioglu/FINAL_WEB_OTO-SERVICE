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
          <h1 class="profile-name">{{ customer.name }}</h1>
          <p class="profile-phone">{{ customer.phone || 'Telefon yok' }}</p>
        </div>
        <button class="msg-btn" @click="openChat">
          <MessageCircle :size="18" />
        </button>
      </div>

      <!-- Cars -->
      <section class="section">
        <h2 class="section-title">Araçlar</h2>
        <div v-if="!customer.cars?.length" class="empty-sm">Araç yok</div>
        <div v-for="car in customer.cars" :key="car.id" class="car-chip">
          <Car :size="14" />
          <span>{{ car.brand?.toUpperCase() }} {{ car.model }} · {{ car.plate }}</span>
          <span class="car-year">{{ car.year }}</span>
        </div>
      </section>

      <!-- New maintenance record -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Bakım Geçmişi</h2>
          <button class="btn-add" @click="showNewRecord = !showNewRecord">+ Ekle</button>
        </div>

        <div v-if="showNewRecord" class="record-form">
          <select v-model="newRecord.carId" class="form-control">
            <option value="">Araç seçin</option>
            <option v-for="car in customer.cars" :key="car.id" :value="car.id">
              {{ car.brand?.toUpperCase() }} {{ car.model }}
            </option>
          </select>
          <input v-model="newRecord.date" type="date" class="form-control" />
          <textarea v-model="newRecord.note" class="form-control" placeholder="Not..." rows="2"></textarea>
          <button class="btn-submit" @click="createRecord" :disabled="!newRecord.carId || !newRecord.date">
            Kaydet
          </button>
        </div>

        <div v-if="maintenance.loading" class="loading">Yükleniyor...</div>

        <div v-else-if="!maintenance.records.length" class="empty-sm">Bakım kaydı yok</div>

        <MaintenanceCard
          v-for="record in maintenance.records"
          :key="record.id"
          :record="record"
          :is-admin="true"
          @add-item="openAddItem"
          @remove-item="maintenance.removeItem"
        />
      </section>
    </template>

    <!-- Add item modal -->
    <div v-if="addItemRecordId" class="modal-overlay" @click.self="addItemRecordId = null">
      <div class="modal">
        <h3 class="modal-title">Bakım Kalemi Ekle</h3>
        <input v-model="newItem.description" class="form-control" placeholder="İşlem açıklaması" />
        <input v-model.number="newItem.cost" type="number" class="form-control" placeholder="Tutar (₺)" />
        <div class="modal-actions">
          <button class="btn-cancel-modal" @click="addItemRecordId = null">Vazgeç</button>
          <button class="btn-submit" @click="addItem" :disabled="!newItem.description">Ekle</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }     from 'vue-router'
import { ChevronLeft, MessageCircle, Car } from 'lucide-vue-next'
import { useAdminStore }       from '@/stores/admin'
import { useMaintenanceStore } from '@/stores/maintenance'
import MaintenanceCard from '@/components/maintenance/MaintenanceCard.vue'

const route       = useRoute()
const router      = useRouter()
const admin       = useAdminStore()
const maintenance = useMaintenanceStore()

const customer      = ref(null)
const loading       = ref(true)
const showNewRecord = ref(false)
const addItemRecordId = ref(null)
const newRecord = ref({ carId: '', date: new Date().toISOString().split('T')[0], note: '' })
const newItem   = ref({ description: '', cost: null })

const initials = computed(() => {
  return (customer.value?.name || 'M').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
})

onMounted(async () => {
  try {
    customer.value = await admin.fetchCustomerById(route.params.id)
    await maintenance.fetchRecordsForUser(route.params.id)
  } finally {
    loading.value = false
  }
})

async function createRecord() {
  await maintenance.createRecord({
    carId:  newRecord.value.carId,
    userId: route.params.id,
    date:   newRecord.value.date,
    note:   newRecord.value.note,
  })
  showNewRecord.value = false
  newRecord.value = { carId: '', date: new Date().toISOString().split('T')[0], note: '' }
}

function openAddItem(recordId) {
  addItemRecordId.value = recordId
  newItem.value = { description: '', cost: null }
}

async function addItem() {
  await maintenance.addItem(addItemRecordId.value, newItem.value)
  addItemRecordId.value = null
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
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1a1a1a;
  border: 1px solid rgba(201, 168, 76, 0.12);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 13px;
}

.car-chip svg { color: #c9a84c; }

.car-year {
  margin-left: auto;
  color: #666;
  font-size: 12px;
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

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.modal {
  background: #1a1a1a;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 24px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.btn-cancel-modal {
  flex: 1;
  padding: 11px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #888;
  font-weight: 600;
  cursor: pointer;
}
</style>
