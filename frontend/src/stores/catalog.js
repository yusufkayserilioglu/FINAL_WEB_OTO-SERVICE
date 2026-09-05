import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { supabase }    from '@/lib/supabase'

// Parça/işlem kalemi + marka kataloğu (yalnız admin).
// Admin rapor hazırlarken girdiği isimler DB'de birikir, sonraki raporlarda
// aranabilir öneri olarak gelir.
export const useCatalogStore = defineStore('catalog', () => {
  const parts   = ref([])   // { id, name, default_unit, default_brand, last_unit_price, usage_count }
  const brands  = ref([])   // { id, name, usage_count }
  const loading = ref(false)
  const loaded  = ref(false)

  async function fetchAll(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const [p, b] = await Promise.all([
        supabase.from('part_catalog').select('*').order('usage_count', { ascending: false }).order('name'),
        supabase.from('brand_catalog').select('*').order('usage_count', { ascending: false }).order('name'),
      ])
      if (!p.error) parts.value  = p.data || []
      if (!b.error) brands.value = b.data || []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  function _filter(list, query, limit = 12) {
    const q = (query || '').trim().toLocaleLowerCase('tr')
    if (!q) return list.slice(0, limit)
    return list
      .filter(x => x.name.toLocaleLowerCase('tr').includes(q))
      .slice(0, limit)
  }

  const filterParts  = (q, limit) => _filter(parts.value,  q, limit)
  const filterBrands = (q, limit) => _filter(brands.value, q, limit)

  // Rapor kesinleşince her kalem/marka için çağrılır (kullanım sayacı + son fiyat)
  async function bumpPart({ name, unit, brand, unitPrice }) {
    if (!name || !name.trim()) return
    await supabase.rpc('upsert_part_catalog', {
      p_name:  name.trim(),
      p_unit:  unit || 'adet',
      p_brand: brand || null,
      p_price: (unitPrice === '' || unitPrice == null) ? null : Number(unitPrice),
    })
  }

  async function bumpBrand(name) {
    if (!name || !name.trim()) return
    await supabase.rpc('upsert_brand_catalog', { p_name: name.trim() })
  }

  // Rapor kesinleşince toplu güncelleme + yerel listeyi tazele
  async function bumpFromItems(items) {
    const jobs = []
    const seenBrand = new Set()
    for (const it of items || []) {
      if (!it.name?.trim()) continue
      jobs.push(bumpPart({ name: it.name, unit: it.unit, brand: it.brand, unitPrice: it.unit_price }))
      const bn = (it.brand || '').trim()
      if (bn && !seenBrand.has(bn.toLocaleLowerCase('tr'))) {
        seenBrand.add(bn.toLocaleLowerCase('tr'))
        jobs.push(bumpBrand(bn))
      }
    }
    await Promise.allSettled(jobs)
    await fetchAll(true)
  }

  return {
    parts, brands, loading, loaded,
    fetchAll, filterParts, filterBrands,
    bumpPart, bumpBrand, bumpFromItems,
  }
})
