<template>
  <div class="page">
    <div class="topbar">
      <button class="back" @click="$router.push('/bakim')">
        <ChevronLeft :size="18" /> Bakım Geçmişi
      </button>
      <button
        v-if="rec"
        class="dl"
        :disabled="pdf.downloading.value"
        @click="downloadPdf"
      >
        <Download :size="15" />
        {{ pdf.downloading.value ? 'Hazırlanıyor...' : 'PDF İndir' }}
      </button>
    </div>

    <div v-if="loading" class="msg">Yükleniyor...</div>

    <div v-else-if="!rec" class="msg">
      <FileX :size="40" class="msg-icon" />
      <p>Rapor bulunamadı.</p>
    </div>

    <div v-else-if="rec.status !== 'finalized'" class="msg">
      <Clock :size="40" class="msg-icon" />
      <p>Bu bakımın raporu henüz hazırlanıyor.</p>
      <p class="msg-sub">Rapor tamamlanınca burada görüntüleyip indirebilirsiniz.</p>
    </div>

    <div v-else class="doc-frame">
      <MaintenanceReportDoc ref="docRef" :record="rec" />
    </div>

    <p v-if="pdf.error.value" class="msg err sm">{{ pdf.error.value }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, Download, FileX, Clock } from 'lucide-vue-next'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useReportPdf } from '@/composables/useReportPdf'
import { slugForFilename } from '@/utils/report'
import MaintenanceReportDoc from '@/components/report/MaintenanceReportDoc.vue'

const route = useRoute()
const maintenance = useMaintenanceStore()
const pdf = useReportPdf()

const loading = ref(true)
const rec     = ref(null)
const docRef  = ref(null)

onMounted(async () => {
  try {
    rec.value = await maintenance.fetchRecordById(route.params.recordId)
  } catch {
    rec.value = null
  } finally {
    loading.value = false
  }
})

async function downloadPdf() {
  const plate = rec.value?.car_plate || rec.value?.cars?.plate
  const name = `Bakim-Raporu-${rec.value?.report_no || ''}-${slugForFilename(plate)}.pdf`
  await pdf.download(docRef.value?.root, name)
}
</script>

<style scoped>
.page { padding: 20px 16px 100px; min-height: 100vh; background: #080808; }

.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.back {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; color: #c9a84c;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.dl {
  display: flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e); color: #080808;
  border: none; border-radius: 10px; padding: 8px 14px;
  font-size: 13px; font-weight: 700; cursor: pointer;
}
.dl:disabled { opacity: 0.6; }

.msg { text-align: center; color: #888; padding: 60px 20px; }
.msg-icon { color: rgba(201,168,76,0.35); margin-bottom: 14px; }
.msg-sub { font-size: 13px; color: #555; margin-top: 6px; }
.msg.err { color: #ef4444; }
.msg.sm { padding: 12px; }

.doc-frame {
  overflow-x: auto;
  background: #3a3a3a;
  border-radius: 12px;
  padding: 14px;
}
</style>
