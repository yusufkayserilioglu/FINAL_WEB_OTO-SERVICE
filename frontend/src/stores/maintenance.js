import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { supabase }    from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useMaintenanceStore = defineStore('maintenance', () => {
  const records = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function fetchRecords(carId = null) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return
    loading.value = true
    error.value   = null
    try {
      let query = supabase
        .from('maintenance_records')
        .select('*, maintenance_items(*), cars(brand, model, plate)')
        .eq('user_id', auth.currentUser.id)
        .order('date', { ascending: false })
      if (carId) query = query.eq('car_id', carId)
      const { data, error: err } = await query
      if (err) throw err
      records.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Admin only: create a maintenance record for a user's car
  async function createRecord({ carId, userId, date, note }) {
    const { data, error: err } = await supabase
      .from('maintenance_records')
      .insert({ car_id: carId, user_id: userId, date, note: note || null, total_cost: 0 })
      .select('*, maintenance_items(*), cars(brand, model, plate)')
      .single()
    if (err) { error.value = err.message; throw err }
    records.value.unshift(data)
    return data
  }

  // Admin only: add an item to a maintenance record
  async function addItem(recordId, { description, cost }) {
    const { data, error: err } = await supabase
      .from('maintenance_items')
      .insert({ record_id: recordId, description, cost: cost || null })
      .select()
      .single()
    if (err) { error.value = err.message; throw err }
    const record = records.value.find(r => r.id === recordId)
    if (record) {
      record.maintenance_items.push(data)
      record.total_cost = record.maintenance_items.reduce((sum, i) => sum + (i.cost || 0), 0)
      await supabase
        .from('maintenance_records')
        .update({ total_cost: record.total_cost })
        .eq('id', recordId)
    }
    return data
  }

  // Admin only: remove an item from a maintenance record
  async function removeItem(recordId, itemId) {
    const { error: err } = await supabase
      .from('maintenance_items')
      .delete()
      .eq('id', itemId)
    if (err) { error.value = err.message; throw err }
    const record = records.value.find(r => r.id === recordId)
    if (record) {
      record.maintenance_items = record.maintenance_items.filter(i => i.id !== itemId)
      record.total_cost = record.maintenance_items.reduce((sum, i) => sum + (i.cost || 0), 0)
      await supabase
        .from('maintenance_records')
        .update({ total_cost: record.total_cost })
        .eq('id', recordId)
    }
  }

  // Admin only: fetch records for a specific user
  async function fetchRecordsForUser(userId) {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase
        .from('maintenance_records')
        .select('*, maintenance_items(*), cars(brand, model, plate)')
        .eq('user_id', userId)
        .order('date', { ascending: false })
      if (err) throw err
      records.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    records, loading, error,
    fetchRecords, createRecord, addItem, removeItem, fetchRecordsForUser,
  }
})
