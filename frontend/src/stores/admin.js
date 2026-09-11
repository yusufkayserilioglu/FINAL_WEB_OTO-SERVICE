import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { supabase }    from '@/lib/supabase'
import { normalizePhone } from './auth'

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

  /**
   * Kayıtsız (misafir) müşteri oluşturur — SMS doğrulaması yoktur.
   * Servise gelen ama üye olmayan müşteri için admin anında kayıt açar;
   * müşteri normal müşteri listesine düşer ve bakım raporu açılabilir.
   * Araç bilgisi verilirse aynı işlemde araç da eklenir.
   *
   * Dönüş: { duplicate, profile_id, car_id?, name?, is_walk_in? }
   * duplicate=true → bu telefon zaten kayıtlı, profile_id mevcut müşteridir.
   */
  async function createWalkInCustomer({ name, phone, email, note, car } = {}) {
    const { data, error: err } = await supabase.rpc('admin_create_walk_in_customer', {
      p_name:      (name || '').trim(),
      p_phone:     phone ? normalizePhone(phone) : null,
      p_email:     (email || '').trim() || null,
      p_note:      (note || '').trim() || null,
      p_car_brand: car?.brand || null,
      p_car_model: car?.model || null,
      p_car_year:  car?.year ? parseInt(car.year, 10) : null,
      p_car_plate: car?.plate || null,
      p_car_km:    car?.km ? parseInt(car.km, 10) : null,
    })
    if (err) { error.value = err.message; throw new Error(translateRpcError(err)) }
    if (!data?.duplicate) await fetchCustomers()
    return data
  }

  // Admin, müşteri adına araç ekler (misafir müşteri giriş yapamaz)
  async function addCarForCustomer(userId, { brand, model, year, plate, km }) {
    const { data, error: err } = await supabase
      .from('cars')
      .insert({
        user_id: userId,
        brand,
        model:   (model || '').trim() || '-',
        year:    parseInt(year, 10) || new Date().getFullYear(),
        plate:   (plate || '').toUpperCase().trim(),
        km:      km ? parseInt(km, 10) : null,
      })
      .select()
      .single()
    if (err) { error.value = err.message; throw new Error(err.message) }
    return data
  }

  return {
    customers, loading, error,
    fetchCustomers, fetchCustomerById,
    createWalkInCustomer, addCarForCustomer,
  }
})

function translateRpcError(err) {
  const msg = err?.message || ''
  if (msg.includes('forbidden'))     return 'Bu işlemi yalnızca yönetici yapabilir.'
  if (msg.includes('name_required')) return 'Müşteri adı zorunludur.'
  if (msg.includes('admin_create_walk_in_customer')) {
    return 'Veritabanı fonksiyonu bulunamadı. 005 migrasyonunu çalıştırın.'
  }
  return msg || 'Müşteri oluşturulamadı.'
}
