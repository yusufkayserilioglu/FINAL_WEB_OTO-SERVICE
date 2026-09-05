// Bakım raporu hesaplamaları ve biçimlendirme yardımcıları.
// supabase-js NUMERIC alanları string döndürebildiği için hepsi Number(...) ile parse eder.

export function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function round2(v) {
  return Math.round((num(v) + Number.EPSILON) * 100) / 100
}

// Bir kalemin satır tutarı
export function lineTotal(item) {
  return round2(num(item.quantity) * num(item.unit_price ?? item.unitPrice))
}

// Kalem listesi + iskonto + KDV oranından toplamlar
export function computeTotals(items, { discount = 0, vatRate = 0 } = {}) {
  const subtotal   = round2((items || []).reduce((s, it) => s + lineTotal(it), 0))
  const afterDisc  = round2(Math.max(0, subtotal - num(discount)))
  const vatAmount  = round2(afterDisc * num(vatRate) / 100)
  const grandTotal = round2(afterDisc + vatAmount)
  return { subtotal, discount: num(discount), vatRate: num(vatRate), vatAmount, grandTotal }
}

const tryFmt = new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2,
})

export function formatTRY(v) {
  return tryFmt.format(num(v))
}

// "6,5" / "1" — sondaki sıfırları at, tr ondalık ayıracı
export function formatQty(v) {
  const n = num(v)
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
}

// Birim kısaltmaları (tabloda dar sütun)
const unitShort = {
  adet: 'ad', litre: 'lt', 'takım': 'tk', set: 'set', paket: 'pk',
  metre: 'm', saat: 'sa', kg: 'kg',
}
export function formatQtyUnit(item) {
  const u = (item.unit || 'adet').toLowerCase()
  return `${formatQty(item.quantity)} ${unitShort[u] || item.unit || ''}`.trim()
}

// "#001042" — rapor numarası etiketi
export function reportNoLabel(record) {
  if (record?.report_no) return '#' + String(record.report_no).padStart(6, '0')
  if (record?.id)        return '#' + String(record.id).slice(0, 8).toUpperCase()
  return '—'
}

// PDF dosya adı için sadeleştirme
export function slugForFilename(s) {
  return String(s || '')
    .replace(/[İIı]/g, 'i').replace(/[Şş]/g, 's').replace(/[Ğğ]/g, 'g')
    .replace(/[Üü]/g, 'u').replace(/[Öö]/g, 'o').replace(/[Çç]/g, 'c')
    .replace(/[^a-zA-Z0-9]+/g, '') || 'rapor'
}
