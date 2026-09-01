import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { getCostsForBrand } from '@/data/maintenanceCosts'
import { useAuthStore } from './auth'

export const useCarsStore = defineStore('cars', () => {
  const cars    = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function fetchCars() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) { cars.value = []; return }
    loading.value = true
    error.value   = null
    const { data, error: err } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', auth.currentUser.id)
      .order('created_at', { ascending: false })
    if (err) { error.value = err.message }
    else      { cars.value  = data }
    loading.value = false
  }

  async function addCar({ brand, model, year, plate, km, inspectionDate, insuranceDate }) {
    const auth = useAuthStore()
    const payload = {
      user_id:         auth.currentUser.id,
      brand,
      model,
      year:            parseInt(year),
      plate:           plate.toUpperCase().trim(),
      km:              km ? parseInt(km) : null,
      inspection_date: inspectionDate || null,
      insurance_date:  insuranceDate  || null,
    }
    const { data, error: err } = await supabase.from('cars').insert(payload).select().single()
    if (err) throw new Error(err.message)
    cars.value.unshift(data)
    return data
  }

  async function updateCar(id, { brand, model, year, plate, km, inspectionDate, insuranceDate }) {
    const payload = {
      brand,
      model,
      year:            parseInt(year),
      plate:           plate.toUpperCase().trim(),
      km:              km ? parseInt(km) : null,
      inspection_date: inspectionDate || null,
      insurance_date:  insuranceDate  || null,
    }
    const { data, error: err } = await supabase
      .from('cars').update(payload).eq('id', id).select().single()
    if (err) throw new Error(err.message)
    const idx = cars.value.findIndex(c => c.id === id)
    if (idx !== -1) cars.value[idx] = data
    return data
  }

  async function removeCar(id) {
    const { error: err } = await supabase.from('cars').delete().eq('id', id)
    if (err) throw new Error(err.message)
    cars.value = cars.value.filter(c => c.id !== id)
  }

  function getEstimatedCosts(car) {
    return getCostsForBrand(car.brand)
  }

  return { cars, loading, error, fetchCars, addCar, updateCar, removeCar, getEstimatedCosts }
})
