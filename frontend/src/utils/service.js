// Servis/bakım hesaplamaları ve tarih yardımcıları

export const DEFAULT_INTERVAL_KM   = 15000   // sonraki bakım için varsayılan km aralığı
export const DEFAULT_INTERVAL_DAYS = 365     // sonraki bakım için varsayılan gün aralığı

export function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d)) return null
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function formatShortDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d)) return null
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatKm(km) {
  if (km === null || km === undefined || km === '') return null
  return Number(km).toLocaleString('tr-TR') + ' km'
}

// İki tarih arasındaki tam gün farkı (gelecek → pozitif)
export function daysUntil(date) {
  if (!date) return null
  const target = new Date(date)
  if (isNaN(target)) return null
  const today = new Date()
  target.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}

// Bir aracın son servis kaydını bulur
export function lastServiceOf(records, carId) {
  const list = (records || [])
    .filter(r => r.car_id === carId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  return list[0] ?? null
}

/**
 * Sonraki bakıma kalanı hesaplar.
 * Öncelik sırası:
 *   1) Aracın kendi üzerindeki next_service_date / next_service_km (rapor kesinleşince yazılır)
 *   2) Son servis kaydındaki next_service_date / next_service_km
 *   3) Son servis tarihinden +1 yıl, son servis km'sinden +15.000 km (tahmin)
 */
export function nextServiceInfo(car, lastRecord) {
  const carDate = car?.next_service_date || null
  const carKm   = (car?.next_service_km ?? null) !== null ? car.next_service_km : null

  if (!lastRecord && !carDate && carKm === null) return null

  // Tarih tarafı
  let targetDate = carDate || lastRecord?.next_service_date || null
  let dateIsEstimate = false
  if (!targetDate && lastRecord?.date) {
    const d = new Date(lastRecord.date)
    d.setDate(d.getDate() + DEFAULT_INTERVAL_DAYS)
    targetDate = d.toISOString().slice(0, 10)
    dateIsEstimate = true
  }
  const remainingDays = daysUntil(targetDate)

  // Km tarafı
  let baseKm = carKm ?? lastRecord?.next_service_km ?? null
  let kmIsEstimate = false
  if (baseKm === null && (lastRecord?.km ?? null) !== null) {
    baseKm = lastRecord.km + DEFAULT_INTERVAL_KM
    kmIsEstimate = true
  }
  const remainingKm = (baseKm !== null && car?.km !== null && car?.km !== undefined)
    ? baseKm - car.km
    : null

  return {
    targetDate,
    targetKm: baseKm,
    remainingDays,
    remainingKm,
    isEstimate: dateIsEstimate && (kmIsEstimate || baseKm === null),
    overdue: (remainingDays !== null && remainingDays < 0) || (remainingKm !== null && remainingKm < 0),
  }
}

// "12.000 km veya 45 gün kaldı" gibi bir metin üretir
export function nextServiceText(info) {
  if (!info) return null
  const parts = []
  if (info.remainingKm !== null && info.remainingKm !== undefined) {
    parts.push(info.remainingKm >= 0
      ? `${Number(info.remainingKm).toLocaleString('tr-TR')} km`
      : `${Number(Math.abs(info.remainingKm)).toLocaleString('tr-TR')} km aşıldı`)
  }
  if (info.remainingDays !== null && info.remainingDays !== undefined) {
    parts.push(info.remainingDays >= 0
      ? `${info.remainingDays} gün`
      : `${Math.abs(info.remainingDays)} gün gecikti`)
  }
  if (!parts.length) return null
  return info.overdue ? parts.join(' • ') : parts.join(' veya ') + ' kaldı'
}

// Muayene / sigorta gibi tarihler için durum rozeti
export function dateStatus(date) {
  const d = daysUntil(date)
  if (d === null) return null
  if (d < 0)   return { tone: 'danger',  text: `${Math.abs(d)} gün geçti` }
  if (d <= 30) return { tone: 'warning', text: `${d} gün kaldı` }
  return { tone: 'ok', text: `${d} gün kaldı` }
}
