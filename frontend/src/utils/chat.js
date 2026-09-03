// Sohbet mesajlarını gün bazında bölmek için yardımcılar (WhatsApp tarzı tarih ayıracı)

// Bir mesajın tarihini "Bugün" / "Dün" / "4 Eylül" / "4 Eylül 2025" biçimine çevirir
export function messageDayLabel(ts) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''

  const now   = new Date()
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate())
  const diff  = Math.round((start(now) - start(d)) / 86400000)

  if (diff === 0) return 'Bugün'
  if (diff === 1) return 'Dün'

  const opts = { day: 'numeric', month: 'long' }
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('tr-TR', opts)
}

// Mesaj listesini ardışık gün gruplarına ayırır:
//   [{ key: '2026-8-4', label: 'Bugün', items: [msg, msg, ...] }, ...]
export function groupMessagesByDay(list) {
  const groups = []
  for (const msg of list || []) {
    const d = new Date(msg.created_at)
    const key = Number.isNaN(d.getTime())
      ? 'unknown'
      : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(msg)
    } else {
      groups.push({ key, label: messageDayLabel(msg.created_at), items: [msg] })
    }
  }
  return groups
}
