import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { supabase }    from '@/lib/supabase'
import { useAuthStore } from './auth'

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
        .select('*, cars(brand, model, plate)')
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

  async function createAppointment({ carId, serviceType, date, time, note }) {
    const auth = useAuthStore()
    error.value = null
    const { data, error: err } = await supabase
      .from('appointments')
      .insert({
        user_id:      auth.currentUser.id,
        car_id:       carId || null,
        service_type: serviceType,
        date,
        time,
        note:         note || null,
        status:       'pending',
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
        .select('*, cars(brand, model, plate), profiles(name, phone)')
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

  return {
    appointments, loading, error,
    fetchAppointments, createAppointment, cancelAppointment,
    fetchAllAppointments, updateStatus,
  }
})
