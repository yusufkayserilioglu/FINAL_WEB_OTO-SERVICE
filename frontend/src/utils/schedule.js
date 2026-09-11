// Randevu takvimi yardımcıları — saat dilimleri, hafta hesabı, çakışma

// Servisin çalışma saatleri (takvim bu aralığı gösterir; dışında randevu
// varsa aralık otomatik genişler)
export const WORK_START_HOUR = 8
export const WORK_END_HOUR   = 20

export const STATUS_LABELS = {
  pending:   'Bekliyor',
  confirmed: 'Onaylı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

// Yerel saate göre 'YYYY-MM-DD'. (toISOString() UTC'ye çevirdiği için
// Türkiye saatiyle gece yarısı civarı bir gün geriye kayabiliyor.)
export function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function todayKey() {
  return toDateKey(new Date())
}

export function addDays(dateKey, days) {
  const d = new Date(dateKey + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

// Haftanın başı = Pazartesi
export function startOfWeek(dateKey) {
  const d = new Date(dateKey + 'T00:00:00')
  const shift = (d.getDay() + 6) % 7   // Pazar(0) → 6, Pazartesi(1) → 0
  d.setDate(d.getDate() - shift)
  return toDateKey(d)
}

export function weekDays(dateKey) {
  const first = startOfWeek(dateKey)
  return Array.from({ length: 7 }, (_, i) => addDays(first, i))
}

// '09:30:00' → 9   |   '09:30' → 9
export function hourOf(time) {
  const h = parseInt(String(time || '').slice(0, 2), 10)
  return Number.isFinite(h) ? h : 0
}

// '09:30:00' → '09:30'
export function shortTime(time) {
  return String(time || '').slice(0, 5)
}

export function formatDayName(dateKey) {
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'short' })
}

export function formatFullDate(dateKey) {
  return new Date(dateKey + 'T00:00:00').toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
  })
}

// İptal edilenler takvimde yer kaplamaz
export function isActive(appt) {
  return appt?.status !== 'cancelled'
}

/**
 * Bir günün randevularını saat kutularına dağıtır.
 * Dönen her satır: { hour, label, items, confirmedCount, hasConflict }
 * hasConflict → aynı saatte 2+ ONAYLI randevu var demektir.
 */
export function buildDaySlots(appointments) {
  const active = (appointments || []).filter(isActive)

  let start = WORK_START_HOUR
  let end   = WORK_END_HOUR
  for (const a of active) {
    const h = hourOf(a.time)
    if (h < start) start = h
    if (h + 1 > end) end = h + 1
  }

  const slots = []
  for (let h = start; h < end; h++) {
    const items = active
      .filter(a => hourOf(a.time) === h)
      .sort((a, b) => String(a.time).localeCompare(String(b.time)))
    const confirmedCount = items.filter(
      a => a.status === 'confirmed' || a.status === 'completed'
    ).length
    slots.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      items,
      confirmedCount,
      hasConflict: confirmedCount > 1,
    })
  }
  return slots
}

// Bir randevunun aynı saat diliminde başka randevusu var mı? (kart rozeti için)
export function slotIsShared(appointments, appt) {
  const h = hourOf(appt?.time)
  return (appointments || []).filter(a => isActive(a) && hourOf(a.time) === h).length > 1
}
