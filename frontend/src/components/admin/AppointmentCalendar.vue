<template>
  <section class="cal">
    <!-- Başlık + hafta gezinme -->
    <div class="cal-head">
      <div>
        <h2 class="cal-title">Randevu Takvimi</h2>
        <p class="cal-sub">{{ formatFullDate(selectedDay) }}</p>
      </div>
      <div class="nav">
        <button class="nav-btn" aria-label="Önceki hafta" @click="shiftWeek(-7)">
          <ChevronLeft :size="16" />
        </button>
        <button class="nav-today" :class="{ on: selectedDay === todayKey() }" @click="goToday">Bugün</button>
        <button class="nav-btn" aria-label="Sonraki hafta" @click="shiftWeek(7)">
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- Hafta şeridi -->
    <div class="week">
      <button
        v-for="day in days"
        :key="day"
        class="day"
        :class="{ active: day === selectedDay, today: day === todayKey() }"
        @click="selectedDay = day"
      >
        <span class="d-name">{{ formatDayName(day) }}</span>
        <span class="d-num">{{ dayNumber(day) }}</span>
        <span class="d-dots">
          <i v-if="countFor(day, 'confirmed')" class="dot confirmed" />
          <i v-if="countFor(day, 'pending')"   class="dot pending" />
          <i v-if="countFor(day, 'completed')" class="dot completed" />
          <i v-if="conflictCount(day)"         class="dot conflict" />
        </span>
      </button>
    </div>

    <!-- Gün özeti -->
    <div class="summary">
      <span class="chip confirmed">{{ countFor(selectedDay, 'confirmed') }} onaylı</span>
      <span class="chip pending">{{ countFor(selectedDay, 'pending') }} bekleyen</span>
      <span v-if="countFor(selectedDay, 'completed')" class="chip completed">
        {{ countFor(selectedDay, 'completed') }} tamamlandı
      </span>
      <span v-if="conflictCount(selectedDay)" class="chip conflict">
        <AlertTriangle :size="11" /> {{ conflictCount(selectedDay) }} çakışan saat
      </span>
    </div>

    <div v-if="loading" class="state">Takvim yükleniyor...</div>
    <div v-else-if="error" class="state err">{{ error }}</div>

    <!-- Saat ızgarası -->
    <div v-else class="grid">
      <div
        v-for="slot in slots"
        :key="slot.hour"
        class="slot-row"
        :class="{ busy: slot.items.length, conflict: slot.hasConflict, now: isCurrentHour(slot.hour) }"
      >
        <div class="gutter">
          <span class="hour">{{ slot.label }}</span>
          <span v-if="slot.hasConflict" class="conflict-tag">
            <AlertTriangle :size="10" /> Çakışma
          </span>
        </div>

        <div class="slot-body">
          <p v-if="!slot.items.length" class="free">Boş</p>

          <div
            v-for="appt in slot.items"
            :key="appt.id"
            class="appt"
            :class="[appt.status, { open: expandedId === appt.id }]"
            @click="toggle(appt.id)"
          >
            <div class="appt-top">
              <span class="a-time">{{ shortTime(appt.time) }}</span>
              <span class="a-name">{{ appt.profiles?.name || 'Müşteri' }}</span>
              <span v-if="appt.profiles?.is_walk_in" class="a-tag">Kayıtsız</span>
              <span class="a-status" :class="appt.status">{{ STATUS_LABELS[appt.status] }}</span>
            </div>

            <p class="a-service">{{ appt.service_type }}</p>

            <p v-if="appt.cars" class="a-line">
              <Car :size="12" />
              {{ appt.cars.brand?.toUpperCase() }} {{ appt.cars.model }} · {{ appt.cars.plate }}
            </p>

            <!-- Detay -->
            <div v-if="expandedId === appt.id" class="a-detail" @click.stop>
              <p v-if="appt.profiles?.phone" class="a-line">
                <Phone :size="12" /> {{ formatPhone(appt.profiles.phone) }}
              </p>
              <p v-if="estimateText(appt)" class="a-line">
                <BadgeDollarSign :size="12" /> {{ estimateText(appt) }}
              </p>
              <p v-if="appt.note" class="a-note">“{{ appt.note }}”</p>

              <div class="a-actions">
                <button
                  v-if="appt.status === 'pending'"
                  class="act ok"
                  :disabled="confirmChecking"
                  @click="requestConfirm(appt)"
                >
                  {{ confirmChecking ? 'Kontrol ediliyor...' : 'Onayla' }}
                </button>
                <button
                  v-if="appt.status === 'confirmed' || appt.status === 'completed'"
                  class="act gold"
                  :disabled="busyId === appt.id"
                  @click="openReport(appt)"
                >
                  {{ recordOf(appt) ? 'Raporu Aç' : 'Rapor Oluştur' }}
                </button>
                <button
                  v-if="appt.status === 'pending' || appt.status === 'confirmed'"
                  class="act no"
                  :disabled="busyId === appt.id"
                  @click="cancel(appt)"
                >
                  İptal
                </button>
              </div>
              <p v-if="confirmError" class="a-err">{{ confirmError }}</p>
              <p v-if="actionError" class="a-err">{{ actionError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SlotConflictDialog
      :pending="confirmPending"
      :saving="confirmSaving"
      @confirm="proceedConfirm"
      @cancel="dismissConfirm"
    />
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronLeft, ChevronRight, AlertTriangle, Car, Phone, BadgeDollarSign,
} from 'lucide-vue-next'
import { useAppointmentsStore, firstRecord } from '@/stores/appointments'
import { useAppointmentConfirm } from '@/composables/useAppointmentConfirm'
import { formatPhone } from '@/stores/auth'
import {
  buildDaySlots, weekDays, todayKey, addDays, formatDayName, formatFullDate,
  shortTime, hourOf, STATUS_LABELS,
} from '@/utils/schedule'
import SlotConflictDialog from '@/components/appointments/SlotConflictDialog.vue'

const emit = defineEmits(['changed'])

const router       = useRouter()
const appointments = useAppointmentsStore()

const selectedDay = ref(todayKey())
const rows        = ref([])          // görüntülenen haftanın randevuları
const loading     = ref(true)
const error       = ref('')
const expandedId  = ref(null)
const busyId      = ref(null)
const actionError = ref('')

const days = computed(() => weekDays(selectedDay.value))

const dayRows = computed(() => rows.value.filter(a => a.date === selectedDay.value))
const slots   = computed(() => buildDaySlots(dayRows.value))

// Seçili gün hafta dışına çıkınca (ok tuşları) o haftayı çek
watch(() => days.value[0], load)

onMounted(load)

async function load() {
  loading.value = true
  error.value   = ''
  try {
    rows.value = await appointments.fetchRange(days.value[0], days.value[6])
  } catch (e) {
    error.value = e.message || 'Randevular yüklenemedi'
  } finally {
    loading.value = false
  }
}

function shiftWeek(delta) {
  selectedDay.value = addDays(selectedDay.value, delta)
}

function goToday() {
  selectedDay.value = todayKey()
}

function dayNumber(day) {
  return new Date(day + 'T00:00:00').getDate()
}

function countFor(day, status) {
  return rows.value.filter(a => a.date === day && a.status === status).length
}

// O gün içinde 2+ onaylı randevunun düştüğü saat sayısı
function conflictCount(day) {
  const perHour = {}
  for (const a of rows.value) {
    if (a.date !== day) continue
    if (a.status !== 'confirmed' && a.status !== 'completed') continue
    const h = hourOf(a.time)
    perHour[h] = (perHour[h] || 0) + 1
  }
  return Object.values(perHour).filter(n => n > 1).length
}

function isCurrentHour(hour) {
  return selectedDay.value === todayKey() && new Date().getHours() === hour
}

function toggle(id) {
  actionError.value = ''
  expandedId.value = expandedId.value === id ? null : id
}

function recordOf(appt) {
  return firstRecord(appt)
}

function estimateText(appt) {
  if (appt.estimated_min == null && appt.estimated_max == null) return null
  const f = n => Number(n).toLocaleString('tr-TR')
  if (appt.estimated_min != null && appt.estimated_max != null) {
    return `${f(appt.estimated_min)} – ${f(appt.estimated_max)} ₺ (tahmini)`
  }
  return `${f(appt.estimated_min ?? appt.estimated_max)} ₺ (tahmini)`
}

// Onay akışı: çakışma varsa dialog açılır, yoksa doğrudan onaylanır
const {
  pending:  confirmPending,
  checking: confirmChecking,
  saving:   confirmSaving,
  error:    confirmError,
  requestConfirm,
  proceed:  proceedConfirm,
  dismiss:  dismissConfirm,
} = useAppointmentConfirm(appt => {
  patchLocal(appt.id, 'confirmed')
  emit('changed')
})

async function cancel(appt) {
  busyId.value = appt.id
  actionError.value = ''
  try {
    await appointments.updateStatus(appt.id, 'cancelled')
    patchLocal(appt.id, 'cancelled')
    expandedId.value = null
    emit('changed')
  } catch (e) {
    actionError.value = e.message || 'İptal edilemedi'
  } finally {
    busyId.value = null
  }
}

async function openReport(appt) {
  busyId.value = appt.id
  actionError.value = ''
  try {
    const recId = await appointments.convertToMaintenance(appt)
    const row = rows.value.find(a => a.id === appt.id)
    if (row) row.maintenance_records = [{ id: recId, status: 'draft' }]
    router.push(`/admin/bakim/${recId}`)
  } catch (e) {
    actionError.value = e.message || 'Rapor oluşturulamadı'
  } finally {
    busyId.value = null
  }
}

function patchLocal(id, status) {
  const row = rows.value.find(a => a.id === id)
  if (row) row.status = status
}

defineExpose({ reload: load })
</script>

<style scoped>
.cal {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 18px;
}

.cal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.cal-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
}

.cal-sub {
  font-size: 12px;
  color: #888;
  margin: 2px 0 0;
  text-transform: capitalize;
}

.nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.nav-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.nav-btn:hover { border-color: rgba(201, 168, 76, 0.4); color: #c9a84c; }

.nav-today {
  padding: 6px 11px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #aaa;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.nav-today.on { border-color: rgba(201, 168, 76, 0.4); color: #c9a84c; }

/* ─── Hafta şeridi ─── */
.week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  margin-bottom: 14px;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 2px 6px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: transparent;
  cursor: pointer;
  transition: all 0.18s;
}
.day:hover { border-color: rgba(201, 168, 76, 0.3); }

.day.today .d-num { color: #c9a84c; }

.day.active {
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  border-color: transparent;
}
.day.active .d-name,
.day.active .d-num { color: #080808; }

.d-name {
  font-size: 10px;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.d-num {
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #e5e5e5;
  line-height: 1;
}

.d-dots { display: flex; gap: 3px; height: 5px; }

.dot { width: 5px; height: 5px; border-radius: 50%; display: block; }
.dot.confirmed { background: #22c55e; }
.dot.pending   { background: #eab308; }
.dot.completed { background: #60a5fa; }
.dot.conflict  { background: #ef4444; }

/* ─── Özet ─── */
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 20px;
}
.chip.confirmed { background: rgba(34, 197, 94, 0.14);  color: #22c55e; }
.chip.pending   { background: rgba(234, 179, 8, 0.14);  color: #eab308; }
.chip.completed { background: rgba(59, 130, 246, 0.14); color: #60a5fa; }
.chip.conflict  { background: rgba(239, 68, 68, 0.14);  color: #ef4444; }

.state {
  text-align: center;
  color: #777;
  font-size: 13px;
  padding: 28px 0;
}
.state.err { color: #ef4444; }

/* ─── Saat ızgarası ─── */
.grid {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.slot-row {
  display: grid;
  grid-template-columns: 62px 1fr;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 7px 0;
  min-height: 40px;
}

.slot-row.busy { background: rgba(201, 168, 76, 0.03); }
.slot-row.conflict { background: rgba(239, 68, 68, 0.05); }
.slot-row.now { box-shadow: inset 2px 0 0 #c9a84c; }

.gutter {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 3px;
}

.hour {
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #777;
  letter-spacing: 0.02em;
}

.slot-row.busy .hour { color: #c9a84c; }

.conflict-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 700;
  color: #ef4444;
  text-transform: uppercase;
}

.slot-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.free {
  font-size: 12px;
  color: #3f3f3f;
  margin: 3px 0 0;
}

/* ─── Randevu kartı ─── */
.appt {
  background: #171717;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-left: 3px solid #555;
  border-radius: 9px;
  padding: 8px 10px;
  cursor: pointer;
  transition: border-color 0.18s;
}
.appt:hover { border-color: rgba(201, 168, 76, 0.35); }
.appt.pending   { border-left-color: #eab308; }
.appt.confirmed { border-left-color: #22c55e; }
.appt.completed { border-left-color: #60a5fa; }
.appt.open { border-color: rgba(201, 168, 76, 0.45); }

.appt-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.a-time {
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #c9a84c;
}

.a-name {
  font-size: 13px;
  font-weight: 600;
  color: #e5e5e5;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.a-tag {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 4px;
  background: rgba(201, 168, 76, 0.15);
  color: #c9a84c;
}

.a-status {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 20px;
  text-transform: uppercase;
}
.a-status.pending   { background: rgba(234, 179, 8, 0.18);  color: #eab308; }
.a-status.confirmed { background: rgba(34, 197, 94, 0.18);  color: #22c55e; }
.a-status.completed { background: rgba(59, 130, 246, 0.18); color: #60a5fa; }

.a-service {
  font-size: 12px;
  color: #bbb;
  margin: 4px 0 0;
}

.a-line {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #888;
  margin: 3px 0 0;
}

.a-detail {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  cursor: default;
}

.a-note {
  font-size: 11.5px;
  color: #888;
  font-style: italic;
  margin: 6px 0 0;
}

.a-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.act {
  flex: 1;
  min-width: 92px;
  padding: 7px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.act:disabled { opacity: 0.55; cursor: not-allowed; }
.act.ok   { background: rgba(34, 197, 94, 0.15);  color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
.act.no   { background: rgba(239, 68, 68, 0.13);  color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.28); }
.act.gold { background: rgba(201, 168, 76, 0.13); color: #c9a84c; border: 1px solid rgba(201, 168, 76, 0.3); }

.a-err {
  font-size: 11.5px;
  color: #ef4444;
  margin: 8px 0 0;
}

@media (max-width: 480px) {
  .cal { padding: 14px 12px; }
  .slot-row { grid-template-columns: 50px 1fr; gap: 8px; }
}
</style>
