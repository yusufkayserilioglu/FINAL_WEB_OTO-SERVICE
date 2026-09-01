<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Randevularım</h1>
      <button class="btn-new" @click="showForm = true">+ Yeni</button>
    </div>

    <!-- New appointment form -->
    <div v-if="showForm" class="form-card">
      <h2 class="form-title">Yeni Randevu</h2>
      <div class="form-group">
        <label>Hizmet</label>
        <select v-model="form.serviceType" class="form-control">
          <option value="" disabled>Seçiniz</option>
          <option v-for="p in pricing.prices" :key="p.service_key" :value="p.title">
            {{ p.title }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Araç</label>
        <select v-model="form.carId" class="form-control">
          <option value="">Araç seçmeyeceğim</option>
          <option v-for="car in cars.cars" :key="car.id" :value="car.id">
            {{ car.brand.toUpperCase() }} {{ car.model }} — {{ car.plate }}
          </option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group half">
          <label>Tarih</label>
          <input v-model="form.date" type="date" :min="today" class="form-control" />
        </div>
        <div class="form-group half">
          <label>Saat</label>
          <input v-model="form.time" type="time" class="form-control" />
        </div>
      </div>
      <div class="form-group">
        <label>Not (isteğe bağlı)</label>
        <textarea v-model="form.note" class="form-control" rows="3" placeholder="Sorun veya istek..."></textarea>
      </div>
      <p v-if="appointments.error" class="error-msg">{{ appointments.error }}</p>
      <div class="form-actions">
        <button class="btn-cancel-form" @click="showForm = false">Vazgeç</button>
        <button class="btn-submit" @click="submit" :disabled="submitting">
          {{ submitting ? 'Gönderiliyor...' : 'Randevu Al' }}
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-if="appointments.loading" class="loading">Yükleniyor...</div>

    <div v-else-if="!appointments.appointments.length" class="empty-state">
      <Calendar :size="48" class="empty-icon" />
      <p>Henüz randevunuz yok</p>
      <button class="btn-new-lg" @click="showForm = true">İlk randevumu al</button>
    </div>

    <div v-else>
      <AppointmentCard
        v-for="appt in appointments.appointments"
        :key="appt.id"
        :appointment="appt"
        :show-actions="true"
        @cancel="cancelAppt"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Calendar } from 'lucide-vue-next'
import { useAppointmentsStore } from '@/stores/appointments'
import { usePricingStore }      from '@/stores/pricing'
import { useCarsStore }         from '@/stores/cars'
import AppointmentCard from '@/components/appointments/AppointmentCard.vue'

const appointments = useAppointmentsStore()
const pricing      = usePricingStore()
const cars         = useCarsStore()

const showForm  = ref(false)
const submitting = ref(false)
const today = new Date().toISOString().split('T')[0]

const form = ref({ serviceType: '', carId: '', date: today, time: '09:00', note: '' })

onMounted(() => {
  appointments.fetchAppointments()
  pricing.fetchPrices()
  cars.fetchCars()
})

async function submit() {
  if (!form.value.serviceType || !form.value.date || !form.value.time) return
  submitting.value = true
  try {
    await appointments.createAppointment({
      carId:       form.value.carId || null,
      serviceType: form.value.serviceType,
      date:        form.value.date,
      time:        form.value.time,
      note:        form.value.note,
    })
    showForm.value = false
    form.value = { serviceType: '', carId: '', date: today, time: '09:00', note: '' }
  } finally {
    submitting.value = false
  }
}

async function cancelAppt(id) {
  if (confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) {
    await appointments.cancelAppointment(id)
  }
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #e5e5e5;
}

.btn-new {
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.form-card {
  background: #111;
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-title {
  font-size: 16px;
  font-weight: 700;
  color: #c9a84c;
  margin: 0 0 16px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
}

.form-control:focus {
  border-color: rgba(201, 168, 76, 0.5);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group.half {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.btn-cancel-form {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #888;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit {
  flex: 2;
  padding: 12px;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  border: none;
  border-radius: 10px;
  color: #080808;
  font-weight: 700;
  cursor: pointer;
}

.btn-submit:disabled {
  opacity: 0.6;
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
  margin: 8px 0 0;
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
  margin-bottom: 20px;
  font-size: 15px;
}

.btn-new-lg {
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 700;
  cursor: pointer;
}
</style>
