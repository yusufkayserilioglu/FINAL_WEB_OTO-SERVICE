import { ref } from 'vue'

// Bakım raporu belgesini (beyaz kâğıt HTML) ekrandan alıp A4 PDF'e çevirir.
// jspdf + html2canvas-pro yalnız burada, dinamik import ile yüklenir (code-split).
export function useReportPdf() {
  const downloading = ref(false)
  const error       = ref(null)

  async function download(el, filename = 'bakim-raporu.pdf') {
    if (!el) return
    downloading.value = true
    error.value = null
    try {
      const [h2cMod, jspdfMod] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ])
      const html2canvas = h2cMod.default || h2cMod
      const jsPDF = jspdfMod.jsPDF || jspdfMod.default

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })

      const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      // Görseli sayfa genişliğine ölçekle
      const imgW = pageW
      const imgH = (canvas.height * imgW) / canvas.width
      const img  = canvas.toDataURL('image/jpeg', 0.92)

      if (imgH <= pageH) {
        pdf.addImage(img, 'JPEG', 0, 0, imgW, imgH)
      } else {
        // Uzun belge → sayfalara böl
        let remaining = imgH
        let position  = 0
        while (remaining > 0) {
          pdf.addImage(img, 'JPEG', 0, position, imgW, imgH)
          remaining -= pageH
          if (remaining > 0) {
            pdf.addPage()
            position -= pageH
          }
        }
      }

      pdf.save(filename)
    } catch (e) {
      error.value = e.message || 'PDF oluşturulamadı'
      throw e
    } finally {
      downloading.value = false
    }
  }

  return { download, downloading, error }
}
