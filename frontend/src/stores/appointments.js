import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { supabase }    from '@/lib/supabase'
import { useAuthStore }        from './auth'
import { useMaintenanceStore } from './maintenance'

export const useAppointmentsStore = defineStore('appointments', () => {
  const appointments = ref([])
  const loading      = ref(false)
  const error        = ref(null)

  async function fetchAppointments() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase
        .from('appointments')
        .select('*, cars(brand, model, plate), maintenance_records(id, status)')
        .eq('user_id', auth.currentUser.id)
        .order('date', { ascending: true })
      if (err) throw err
      appointments.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createAppointment({ carId, serviceType, isCustom, estimatedMin, estimatedMax, date, time, note }) {
    const auth = useAuthStore()
    error.value = null
    const { data, error: err } = await supabase
      .from('appointments')
      .insert({
        user_id:       auth.currentUser.id,
        car_id:        carId || null,
        service_type:  serviceType,
        is_custom:     !!isCustom,
        estimated_min: estimatedMin ?? null,
        estimated_max: estimatedMax ?? null,
        date,
        time,
        note:          note || null,
        status:        'pending',
      })
      .select('*, cars(brand, model, plate)')
      .single()
    if (err) { error.value = err.message; throw err }
    appointments.value.push(data)
    return data
  }

  async function cancelAppointment(id) {
    const { error: err } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (err) { error.value = err.message; throw err }
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx !== -1) appointments.value[idx].status = 'cancelled'
  }

  // Admin only
  async function fetchAllAppointments() {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase
        .from('appointments')
        .select('*, cars(brand, model, plate), profiles(name, phone), maintenance_records(id, status)')
        .order('date', { ascending: true })
      if (err) throw err
      appointments.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(id, status) {
    const { error: err } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
    if (err) { error.value = err.message; throw err }
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx !== -1) appointments.value[idx].status = status
  }

  // Admin: onaylı randevudan bakım raporu taslağı aç (varsa mevcudu döndür)
  async function convertToMaintenance(appt) {
    const existing = firstRecord(appt)
    if (existing?.id) return existing.id
    const maintenance = useMaintenanceStore()
    const rec = await maintenance.createDraft({
      carId:         appt.car_id,
      userId:        appt.user_id,
      date:          appt.date,
      appointmentId: appt.id,
      title:         appt.service_type,
    })
    // yerel duruma raporu bağla
    const idx = appointments.value.findIndex(a => a.id === appt.id)
    if (idx !== -1) {
      appointments.value[idx].maintenance_records = [{ id: rec.id, status: 'draft' }]
    }
    return rec.id
  }

  return {
    appointments, loading, error,
    fetchAppointments, createAppointment, cancelAppointment,
    fetchAllAppointments, updateStatus, convertToMaintenance,
  }
})

// Bir randevuya bağlı bakım kaydı (embed sonucu dizi ya da nesne olabilir)
export function firstRecord(appt) {
  const mr = appt?.maintenance_records
  if (!mr) return null
  return Array.isArray(mr) ? (mr[0] || null) : mr
}

// Servis bekleyen: onaylı + tarihi bugün ya da geçmiş + bağlı rapor yok
export function isPendingCompletion(appt) {
  if (appt?.status !== 'confirmed') return false
  const today = new Date().toISOString().slice(0, 10)
  if (appt.date > today) return false
  return !firstRecord(appt)
}
