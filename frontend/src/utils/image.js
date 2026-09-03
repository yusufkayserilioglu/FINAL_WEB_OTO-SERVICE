// Fotoğrafı yüklemeden önce tarayıcıda ölçekler ve JPEG'e sıkıştırır.
// Mobil bağlantıda veriden tasarruf sağlar, yükleme hızlanır.

const MAX_DIMENSION = 1600   // en uzun kenar (px)
const JPEG_QUALITY  = 0.82

export async function compressImage(file) {
  // Resim değilse ya da animasyonlu GIF ise dokunma
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  let bitmap
  try {
    bitmap = await loadBitmap(file)
  } catch {
    return file   // okunamadıysa orijinali gönder
  }

  const srcW = bitmap.width
  const srcH = bitmap.height
  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcW, srcH))

  // Zaten küçük ve makul boyuttaysa uğraşma
  if (scale === 1 && file.size <= 1_200_000) {
    bitmap.close?.()
    return file
  }

  const w = Math.max(1, Math.round(srcW * scale))
  const h = Math.max(1, Math.round(srcH * scale))

  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', JPEG_QUALITY))
  if (!blob || blob.size >= file.size) return file   // kazanç yoksa orijinal kalsın

  const base = file.name.replace(/\.[^.]+$/, '') || 'foto'
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  // createImageBitmap yoksa <img> ile yükle
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('resim yüklenemedi')) }
    img.src = url
  })
}
