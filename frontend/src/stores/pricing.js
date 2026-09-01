import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { supabase }    from '@/lib/supabase'

export const usePricingStore = defineStore('pricing', () => {
  const prices  = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function fetchPrices() {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase
        .from('service_prices')
        .select('*')
        .order('title')
      if (err) throw err
      prices.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Admin only
  async function updatePrice(id, { minPrice, maxPrice }) {
    const { data, error: err } = await supabase
      .from('service_prices')
      .update({ min_price: minPrice, max_price: maxPrice, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (err) { error.value = err.message; throw err }
    const idx = prices.value.findIndex(p => p.id === id)
    if (idx !== -1) prices.value[idx] = data
    return data
  }

  return { prices, loading, error, fetchPrices, updatePrice }
})
