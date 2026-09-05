import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { supabase }    from '@/lib/supabase'
import { useAuthStore }    from './auth'
import { useCatalogStore } from './catalog'
import { num, lineTotal, computeTotals } from '@/utils/report'

const RECORD_SELECT =
  '*, maintenance_items(*), cars(id, brand, model, plate, year, km), ' +
  'profiles(name, phone), appointments(id, service_type, date)'

function sortItems(record) {
  if (record?.maintenance_items) {
    record.maintenance_items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }
  return record
}

export const useMaintenanceStore = defineStore('maintenance', () => {
  const records = ref([])
  const current = ref(null)     // rapor görüntüleme/düzenleme için tek kayıt
  const loading = ref(false)
  const error   = ref(null)

  // ─── Kullanıcı: yalnızca kesinleşmiş kayıtlar ──────────────────────────────
  async function fetchRecords(carId = null) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return
    loading.value = true
    error.value   = null
    try {
      let query = supabase
        .from('maintenance_records')
        .select(RECORD_SELECT)
        .eq('user_id', auth.currentUser.id)
        .eq('status', 'finalized')
        .order('date', { ascending: false })
      if (carId) query = query.eq('car_id', carId)
      const { data, error: err } = await query
      if (err) throw err
      records.value = (data || []).map(sortItems)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ─── Admin: bir müşterinin tüm kayıtları (taslak dahil) ────────────────────
  async function fetchRecordsForUser(userId) {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase
        .from('maintenance_records')
        .select(RECORD_SELECT)
        .eq('user_id', userId)
        .order('date', { ascending: false })
      if (err) throw err
      records.value = (data || []).map(sortItems)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // ─── Tek kayıt (rapor sayfaları) ──────────────────────────────────────────
  async function fetchRecordById(id) {
    loading.value = true
    error.value   = null
    try {
      const { data, error: err } = await supabase
        .from('maintenance_records')
        .select(RECORD_SELECT)
        .eq('id', id)
        .single()
      if (err) throw err
      current.value = sortItems(data)
      return current.value
    } catch (e) {
      error.value = e.message
      current.value = null
      throw e
    } finally {
      loading.value = false
    }
  }

  // ─── Admin: taslak rapor oluştur ─────────────────────────────────────────
  async function createDraft({ carId, userId, date, appointmentId = null, title = null }) {
    const { data, error: err } = await supabase
      .from('maintenance_records')
      .insert({
        car_id:         carId,
        user_id:        userId,
        appointment_id: appointmentId,
        date:           date || new Date().toISOString().slice(0, 10),
        title:          title || null,
        status:         'draft',
        total_cost:     0,
      })
      .select(RECORD_SELECT)
      .single()
    if (err) { error.value = err.message; throw err }
    return sortItems(data)
  }

  // ─── Admin: taslağı kaydet (meta + kalemler) ─────────────────────────────
  async function saveDraft(recordId, { meta = {}, items = [] }) {
    // fazladan tamamen boş satırları at
    const clean = (items || []).filter(it =>
      (it.description || '').trim() !== '' || num(it.quantity) !== 0 || num(it.unit_price) !== 0
    )
    const rows = clean.map((it, i) => ({
      record_id:  recordId,
      description: (it.description || '').trim(),
      brand:      (it.brand || '').trim() || null,
      unit:       (it.unit || 'adet').trim() || 'adet',
      quantity:   num(it.quantity) || 0,
      unit_price: num(it.unit_price) || 0,
      cost:       lineTotal(it),
      sort_order: i,
    }))

    // kalemleri değiştir (sil + yeniden ekle — kalem sayısı az)
    const del = await supabase.from('maintenance_items').delete().eq('record_id', recordId)
    if (del.error) { error.value = del.error.message; throw del.error }
    if (rows.length) {
      const ins = await supabase.from('maintenance_items').insert(rows)
      if (ins.error) { error.value = ins.error.message; throw ins.error }
    }

    const totals = computeTotals(rows, { discount: meta.discount, vatRate: meta.vatRate })
    const patch = {
      car_id:            meta.carId || undefined,
      date:              meta.date || undefined,
      title:             (meta.title || '').trim() || null,
      note:              (meta.note || '').trim() || null,
      km:                intOrNull(meta.km),
      next_service_date: meta.nextServiceDate || null,
      next_service_km:   intOrNull(meta.nextServiceKm),
      discount:          num(meta.discount),
      vat_rate:          num(meta.vatRate),
      subtotal:          totals.subtotal,
      vat_amount:        totals.vatAmount,
      grand_total:       totals.grandTotal,
      total_cost:        totals.grandTotal,
    }
    const upd = await supabase.from('maintenance_records').update(patch).eq('id', recordId)
    if (upd.error) { error.value = upd.error.message; throw upd.error }

    return fetchRecordById(recordId)
  }

  // ─── Admin: raporu kesinleştir → her yere yay ────────────────────────────
  async function finalizeReport(recordId) {
    const rec = await fetchRecordById(recordId)
    const totals = computeTotals(rec.maintenance_items, {
      discount: rec.discount, vatRate: rec.vat_rate,
    })

    let reportNo = rec.report_no
    if (!reportNo) {
      const { data: rno, error: rnoErr } = await supabase.rpc('next_report_no')
      if (rnoErr) { error.value = rnoErr.message; throw rnoErr }
      reportNo = rno
    }

    const snap = {
      status:         'finalized',
      finalized_at:   new Date().toISOString(),
      report_no:      reportNo,
      customer_name:  rec.profiles?.name  ?? rec.customer_name  ?? null,
      customer_phone: rec.profiles?.phone ?? rec.customer_phone ?? null,
      car_brand:      rec.cars?.brand ?? rec.car_brand ?? null,
      car_model:      rec.cars?.model ?? rec.car_model ?? null,
      car_plate:      rec.cars?.plate ?? rec.car_plate ?? null,
      car_year:       rec.cars?.year  ?? rec.car_year  ?? null,
      subtotal:       totals.subtotal,
      vat_amount:     totals.vatAmount,
      grand_total:    totals.grandTotal,
      total_cost:     totals.grandTotal,
    }
    const upd = await supabase.from('maintenance_records').update(snap).eq('id', recordId)
    if (upd.error) { error.value = upd.error.message; throw upd.error }

    // araç: güncel km + önerilen sonraki bakım
    if (rec.car_id) {
      const carPatch = { updated_at: new Date().toISOString() }
      if (rec.km != null)               carPatch.km = rec.km
      if (rec.next_service_date)         carPatch.next_service_date = rec.next_service_date
      if (rec.next_service_km != null)   carPatch.next_service_km = rec.next_service_km
      await supabase.from('cars').update(carPatch).eq('id', rec.car_id)
    }

    // bağlı randevu → tamamlandı
    if (rec.appointment_id) {
      await supabase.from('appointments').update({ status: 'completed' }).eq('id', rec.appointment_id)
    }

    // katalog: kullanım sayacı + son fiyat
    try {
      await useCatalogStore().bumpFromItems(
        (rec.maintenance_items || []).map(it => ({
          name: it.description, unit: it.unit, brand: it.brand, unit_price: it.unit_price,
        }))
      )
    } catch { /* katalog güncellenemese de rapor kesinleşir */ }

    const fresh = await fetchRecordById(recordId)
    upsertLocal(fresh)
    return fresh
  }

  async function unfinalize(recordId) {
    const { error: err } = await supabase
      .from('maintenance_records').update({ status: 'draft' }).eq('id', recordId)
    if (err) { error.value = err.message; throw err }
    const fresh = await fetchRecordById(recordId)
    upsertLocal(fresh)
    return fresh
  }

  async function deleteRecord(recordId) {
    const { error: err } = await supabase.from('maintenance_records').delete().eq('id', recordId)
    if (err) { error.value = err.message; throw err }
    records.value = records.value.filter(r => r.id !== recordId)
    if (current.value?.id === recordId) current.value = null
  }

  function upsertLocal(rec) {
    if (!rec) return
    const idx = records.value.findIndex(r => r.id === rec.id)
    if (idx !== -1) records.value[idx] = rec
    else records.value.unshift(rec)
  }

  return {
    records, current, loading, error,
    fetchRecords, fetchRecordsForUser, fetchRecordById,
    createDraft, saveDraft, finalizeReport, unfinalize, deleteRecord,
  }
})

function intOrNull(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}
