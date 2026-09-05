import { ref, computed, onBeforeUnmount } from 'vue'

// Sabit genişlikli bir belgeyi (ör. 794px A4 rapor) kapsayıcı genişliğine göre
// otomatik sığdırır + kullanıcı +/- ile yakınlaştırabilir. Kapsayıcı veya
// içerik boyu değişince (ResizeObserver) otomatik yeniden ölçeklenir.
export function useFitZoom(contentWidth = 794) {
  const viewportEl    = ref(null)
  const fitScale      = ref(1)
  const zoom          = ref(1)
  const naturalHeight = ref(0)
  const forceNatural  = ref(false)   // PDF yakalarken geçici olarak %100'e döner

  let viewportObserver = null
  let contentObserver  = null
  let contentEl        = null

  const scale       = computed(() => forceNatural.value ? 1 : fitScale.value * zoom.value)
  const stageWidth  = computed(() => Math.round(contentWidth * scale.value))
  const stageHeight = computed(() => Math.round(naturalHeight.value * scale.value))
  const isFit       = computed(() => Math.abs(zoom.value - 1) < 0.001)

  function measureViewport() {
    const w = viewportEl.value?.clientWidth
    if (w) fitScale.value = Math.min(1, w / contentWidth)
  }
  function measureContent() {
    if (contentEl) naturalHeight.value = contentEl.scrollHeight || contentEl.offsetHeight || 0
  }

  // viewportEl bir template ref callback'i olarak kullanılır (v-ref ile atanır)
  function bindViewport(el) {
    viewportEl.value = el
    viewportObserver?.disconnect()
    if (el) {
      viewportObserver = new ResizeObserver(measureViewport)
      viewportObserver.observe(el)
      measureViewport()
    }
  }

  // Ölçülecek gerçek belge elementini bağlar (rapor kesin genişlikte olduğundan
  // yalnız yüksekliği izlenir)
  function attach(el) {
    contentEl = el || null
    contentObserver?.disconnect()
    if (contentEl) {
      contentObserver = new ResizeObserver(measureContent)
      contentObserver.observe(contentEl)
      measureContent()
    }
  }

  function zoomIn()    { zoom.value = Math.min(3, Math.round((zoom.value + 0.2) * 100) / 100) }
  function zoomOut()   { zoom.value = Math.max(0.4, Math.round((zoom.value - 0.2) * 100) / 100) }
  function resetZoom() { zoom.value = 1 }

  // PDF yakalama sırasında geçici olarak doğal (%100) boyuta döner, verilen
  // işlevi çalıştırır, sonra önceki yakınlaştırmayı geri getirir. html2canvas
  // ölçeklenmiş (transform:scale) bir görünümden yakalarsa düşük çözünürlüklü/
  // bozuk sonuç verebiliyor; bu yüzden yakalama anında ölçek her zaman 1 olmalı.
  async function captureAtNaturalScale(fn) {
    forceNatural.value = true
    await nextFrame()
    await nextFrame()
    try {
      return await fn()
    } finally {
      forceNatural.value = false
    }
  }

  function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  }

  onBeforeUnmount(() => {
    viewportObserver?.disconnect()
    contentObserver?.disconnect()
  })

  return {
    bindViewport, attach,
    scale, stageWidth, stageHeight, zoom, isFit,
    zoomIn, zoomOut, resetZoom, captureAtNaturalScale,
  }
}
