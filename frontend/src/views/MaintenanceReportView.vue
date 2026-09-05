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

    <div v-else class="doc-wrap">
      <div class="zoom-bar">
        <button class="zbtn" :disabled="zoom <= 0.4" @click="zoomOut">−</button>
        <span class="zpct">{{ Math.round(scale * 100) }}%</span>
        <button class="zbtn" :disabled="zoom >= 3" @click="zoomIn">+</button>
        <button v-if="!isFit" class="zbtn zfit" @click="resetZoom">Sığdır</button>
      </div>
      <div class="viewport" :ref="bindViewport">
        <div class="stage" :style="{ width: stageWidth + 'px', height: stageHeight ? stageHeight + 'px' : 'auto' }">
          <div class="scaler" :style="{ transform: `scale(${scale})` }">
            <MaintenanceReportDoc ref="docRef" :record="rec" />
          </div>
        </div>
      </div>
    </div>

    <p v-if="pdf.error.value" class="msg err sm">{{ pdf.error.value }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, Download, FileX, Clock } from 'lucide-vue-next'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useReportPdf } from '@/composables/useReportPdf'
import { useFitZoom }   from '@/composables/useFitZoom'
import { slugForFilename } from '@/utils/report'
import MaintenanceReportDoc from '@/components/report/MaintenanceReportDoc.vue'

const route = useRoute()
const maintenance = useMaintenanceStore()
const pdf = useReportPdf()

const loading  = ref(true)
const rec      = ref(null)
const docRef   = ref(null)

const {
  bindViewport, attach, scale, stageWidth, stageHeight, zoom, isFit,
  zoomIn, zoomOut, resetZoom, captureAtNaturalScale,
} = useFitZoom(794)

onMounted(async () => {
  try {
    rec.value = await maintenance.fetchRecordById(route.params.recordId)
  } catch {
    rec.value = null
  } finally {
    loading.value = false
  }
})

// Belge DOM'a girdiği anda ölçüme bağlanır (sıraya bağlı elle attach yerine)
watch(docRef, inst => attach(inst?.root), { immediate: true, flush: 'post' })

async function downloadPdf() {
  const plate = rec.value?.car_plate || rec.value?.cars?.plate
  const name = `Bakim-Raporu-${rec.value?.report_no || ''}-${slugForFilename(plate)}.pdf`
  await captureAtNaturalScale(() => pdf.download(docRef.value?.root, name))
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

.doc-wrap {
  background: #3a3a3a;
  border-radius: 12px;
  padding: 10px;
}

.zoom-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.zbtn {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  background: #1f1f1f;
  color: #e5e5e5;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.zbtn:disabled { opacity: 0.4; cursor: default; }
.zbtn.zfit {
  width: auto;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: #c9a84c;
  border-color: rgba(201,168,76,0.35);
  background: rgba(201,168,76,0.08);
}
.zpct { font-size: 12px; color: #ccc; min-width: 38px; text-align: center; }

.viewport {
  overflow: auto;
  max-height: calc(100dvh - 210px);
  -webkit-overflow-scrolling: touch;
}
.stage {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
}
.scaler {
  transform-origin: top left;
  width: 794px;
}
</style>
