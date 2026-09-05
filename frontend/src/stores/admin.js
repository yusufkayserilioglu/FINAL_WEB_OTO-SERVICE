import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { supabase }    from '@/lib/supabase'

export const useAdminStore = defineStore('admin', () => {
  const customers = ref([])
  const loading   = ref(false)
  const error     = ref(null)

  async function fetchCustomers() {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*, cars(id, brand, model, plate, year)')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
      if (err) throw err
      customers.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomerById(userId) {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*, cars(id, brand, model, plate, year, km, next_service_date, next_service_km)')
      .eq('id', userId)
      .single()
    if (err) throw err
    return data
  }

  return { customers, loading, error, fetchCustomers, fetchCustomerById }
})
