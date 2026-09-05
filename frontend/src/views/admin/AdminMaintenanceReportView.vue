<template>
  <div class="page">
    <datalist id="report-units">
      <option v-for="u in units" :key="u" :value="u" />
    </datalist>

    <!-- Üst bar -->
    <div class="topbar">
      <button class="back" @click="goBack"><ChevronLeft :size="18" /> Geri</button>
      <div class="title-wrap">
        <h1 class="title">Bakım Raporu</h1>
        <p class="sub" v-if="rec">
          {{ customerName }} · {{ carLabel }} · {{ reportNo }}
        </p>
      </div>
      <span class="badge" :class="readOnly ? 'ok' : 'draft'">
        {{ readOnly ? 'Kesinleşti' : 'Taslak' }}
      </span>
    </div>

    <div v-if="loading" class="loading">Yükleniyor...</div>
    <div v-else-if="loadError" class="loading err">{{ loadError }}</div>

    <div v-else-if="rec" class="body">
      <!-- ── SOL: form ── -->
      <div class="form-col">
        <section class="card">
          <h2 class="card-title">Rapor Bilgileri</h2>

          <div class="field" v-if="customerCars.length > 1">
            <label>Araç</label>
            <select v-model="meta.carId" :disabled="readOnly" class="ctrl" @change="prefillKm">
              <option v-for="c in customerCars" :key="c.id" :value="c.id">
                {{ c.brand?.toUpperCase() }} {{ c.model }} · {{ c.plate }}
              </option>
            </select>
          </div>

          <div class="row2">
            <div class="field">
              <label>Rapor tarihi</label>
              <input v-model="meta.date" :disabled="readOnly" type="date" class="ctrl" />
            </div>
            <div class="field">
              <label>İşlem / başlık</label>
              <input v-model="meta.title" :disabled="readOnly" class="ctrl" placeholder="Periyodik Bakım" />
            </div>
          </div>

          <div class="row2">
            <div class="field">
              <label>Güncel KM <span class="hint">(araca yazılır)</span></label>
              <input v-model="meta.km" :disabled="readOnly" type="number" min="0" class="ctrl" placeholder="299500" />
            </div>
            <div class="field">
              <label>Sonraki bakım — KM</label>
              <input v-model="meta.nextServiceKm" :disabled="readOnly" type="number" min="0" class="ctrl" placeholder="314500" />
            </div>
          </div>

          <div class="field">
            <label>Sonraki bakım — tarih <span class="hint">(her yerde gösterilir)</span></label>
            <input v-model="meta.nextServiceDate" :disabled="readOnly" type="date" class="ctrl" />
          </div>

          <div class="field">
            <label>Not</label>
            <textarea v-model="meta.note" :disabled="readOnly" rows="2" class="ctrl" placeholder="Müşteriye not..."></textarea>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2 class="card-title">Kalemler</h2>
            <button v-if="!readOnly" class="btn-ghost" @click="addRow">+ Kalem Ekle</button>
          </div>

          <p v-if="!items.length" class="empty">Henüz kalem yok.</p>

          <div ref="itemsListEl">
            <ReportItemRow
              v-for="(it, i) in items"
              :key="it._k"
              :item="it"
              :index="i"
              :parts="catalog.parts"
              :brands="catalog.brands"
              :disabled="readOnly"
              @remove="removeRow(i)"
              @move="d => moveRow(i, d)"
            />
          </div>

          <div class="row2 totals-fields" v-if="!readOnly">
            <div class="field">
              <label>İskonto ₺</label>
              <input v-model="meta.discount" type="number" min="0" step="0.01" class="ctrl ta-r" />
            </div>
            <div class="field">
              <label>KDV oranı %</label>
              <input v-model="meta.vatRate" type="number" min="0" step="1" class="ctrl ta-r" />
            </div>
          </div>

          <div class="sum">
            <div class="sum-row"><span>Ara toplam</span><b>{{ money(totals.subtotal) }}</b></div>
            <div class="sum-row" v-if="totals.discount > 0"><span>İskonto</span><b>− {{ money(totals.discount) }}</b></div>
            <div class="sum-row"><span>KDV (%{{ pct(totals.vatRate) }})</span><b>{{ money(totals.vatAmount) }}</b></div>
            <div class="sum-row grand"><span>Genel toplam</span><b>{{ money(totals.grandTotal) }}</b></div>
          </div>
        </section>

        <p v-if="actionError" class="loading err sm">{{ actionError }}</p>

        <div class="actionbar">
          <button v-if="!readOnly" class="btn" :disabled="saving" @click="save">
            {{ saving ? 'Kaydediliyor...' : 'Taslağı Kaydet' }}
          </button>
          <button class="btn ghost" :disabled="pdf.downloading.value" @click="downloadPdf">
            {{ pdf.downloading.value ? 'PDF hazırlanıyor...' : 'PDF İndir' }}
          </button>
          <button v-if="!readOnly" class="btn gold" :disabled="saving || finalizing" @click="showFinalize = true">
            Raporu Kesinleştir
          </button>
          <button v-else class="btn ghost" :disabled="finalizing" @click="unlock">
            Kilidi Aç (düzenle)
          </button>
          <button class="btn danger" @click="removeReport">Sil</button>
        </div>
      </div>

      <!-- ── SAĞ: canlı önizleme ── -->
      <div class="preview-col">
        <div class="preview-head">
          <p class="preview-label">Önizleme</p>
          <div class="zoom-bar">
            <button class="zbtn" :disabled="zoom <= 0.4" @click="zoomOut">−</button>
            <span class="zpct">{{ Math.round(scale * 100) }}%</span>
            <button class="zbtn" :disabled="zoom >= 3" @click="zoomIn">+</button>
            <button v-if="!isFit" class="zbtn zfit" @click="resetZoom">Sığdır</button>
          </div>
        </div>
        <div class="preview-frame" :ref="bindViewport">
          <div class="stage" :style="{ width: stageWidth + 'px', height: stageHeight ? stageHeight + 'px' : 'auto' }">
            <div class="scaler" :style="{ transform: `scale(${scale})` }">
              <MaintenanceReportDoc
                ref="docRef"
                :record="previewRecord"
                :customer="{ name: customerName, phone: customerPhone }"
                :car="selectedCar"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Kesinleştir onayı -->
    <div v-if="showFinalize" class="modal-overlay" @click.self="showFinalize = false">
      <div class="modal">
        <h3>Raporu kesinleştir</h3>
        <p class="modal-text">
          Rapor numarası atanacak, müşteriye görünür olacak; aracın KM'si
          ({{ meta.km || '—' }}) ve önerilen sonraki bakım bilgisi güncellenecek.
          <template v-if="rec.appointment_id"> Bağlı randevu "Tamamlandı" olarak işaretlenecek.</template>
        </p>
        <div class="modal-actions">
          <button class="btn ghost" @click="showFinalize = false">Vazgeç</button>
          <button class="btn gold" :disabled="finalizing" @click="confirmFinalize">
            {{ finalizing ? 'İşleniyor...' : 'Kesinleştir' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useCatalogStore }     from '@/stores/catalog'
import { useAdminStore }       from '@/stores/admin'
import { useReportPdf }        from '@/composables/useReportPdf'
import { useFitZoom }          from '@/composables/useFitZoom'
import { computeTotals, formatTRY, num, reportNoLabel, slugForFilename } from '@/utils/report'
import { partUnits } from '@/config/report'
import MaintenanceReportDoc from '@/components/report/MaintenanceReportDoc.vue'
import ReportItemRow        from '@/components/report/ReportItemRow.vue'

const route  = useRoute()
const router = useRouter()
const maintenance = useMaintenanceStore()
const catalog     = useCatalogStore()
const admin       = useAdminStore()
const pdf         = useReportPdf()
const {
  bindViewport, attach, scale, stageWidth, stageHeight, zoom, isFit,
  zoomIn, zoomOut, resetZoom, captureAtNaturalScale,
} = useFitZoom(794)

const units = partUnits

const loading    = ref(true)
const loadError  = ref(null)
const actionError = ref(null)
const saving     = ref(false)
const finalizing = ref(false)
const showFinalize = ref(false)

const rec     = ref(null)
const customer = ref(null)
const docRef  = ref(null)
const itemsListEl = ref(null)

let keySeq = 0
const items = ref([])
const meta  = reactive({
  carId: '', date: '', title: '', note: '',
  km: '', nextServiceDate: '', nextServiceKm: '',
  discount: 0, vatRate: 0,
})

const readOnly = computed(() => rec.value?.status === 'finalized')
const customerCars = computed(() => customer.value?.cars || [])
const customerName  = computed(() => rec.value?.customer_name || customer.value?.name || rec.value?.profiles?.name || '—')
const customerPhone = computed(() => rec.value?.customer_phone || customer.value?.phone || rec.value?.profiles?.phone || '')
const selectedCar = computed(() =>
  customerCars.value.find(c => c.id === meta.carId) || rec.value?.cars || null
)
const carLabel = computed(() => {
  const c = selectedCar.value
  return c ? `${(c.brand || '').toUpperCase()} ${c.model || ''} · ${c.plate || ''}`.trim() : '—'
})
const reportNo = computed(() => reportNoLabel(rec.value))

const totals = computed(() => computeTotals(items.value, { discount: meta.discount, vatRate: meta.vatRate }))

const previewRecord = computed(() => ({
  ...(rec.value || {}),
  date: meta.date,
  title: meta.title,
  note: meta.note,
  km: meta.km === '' || meta.km == null ? null : Number(meta.km),
  next_service_date: meta.nextServiceDate || null,
  next_service_km: meta.nextServiceKm === '' || meta.nextServiceKm == null ? null : Number(meta.nextServiceKm),
  discount: num(meta.discount),
  vat_rate: num(meta.vatRate),
  maintenance_items: items.value
    .filter(it => (it.description || '').trim() !== '' || num(it.quantity) !== 0 || num(it.unit_price) !== 0)
    .map((it, i) => ({
      brand: it.brand, description: it.description, unit: it.unit,
      quantity: num(it.quantity), unit_price: num(it.unit_price), sort_order: i,
    })),
}))

function money(v) { return formatTRY(v) }
function pct(v)   { return num(v).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) }

function toLocalItem(dbItem) {
  return {
    _k: ++keySeq,
    brand: dbItem?.brand || '',
    description: dbItem?.description || '',
    unit: dbItem?.unit || 'adet',
    quantity: dbItem?.quantity ?? 1,
    unit_price: dbItem?.unit_price ?? 0,
  }
}

function hydrate(record) {
  rec.value = record
  meta.carId = record.car_id || ''
  meta.date  = (record.date || new Date().toISOString().slice(0, 10)).slice(0, 10)
  meta.title = record.title || ''
  meta.note  = record.note || ''
  meta.km    = record.km ?? ''
  meta.nextServiceDate = record.next_service_date || ''
  meta.nextServiceKm   = record.next_service_km ?? ''
  meta.discount = num(record.discount)
  meta.vatRate  = num(record.vat_rate)
  const list = (record.maintenance_items || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  items.value = list.length ? list.map(toLocalItem) : [toLocalItem()]
  if (meta.km === '' || meta.km == null) prefillKm()
}

function prefillKm() {
  if (readOnly.value) return
  if ((meta.km === '' || meta.km == null) && selectedCar.value?.km != null) {
    meta.km = selectedCar.value.km
  }
}

onMounted(async () => {
  try {
    const record = await maintenance.fetchRecordById(route.params.recordId)
    await Promise.all([
      catalog.fetchAll(),
      admin.fetchCustomerById(record.user_id).then(c => { customer.value = c }).catch(() => {}),
    ])
    hydrate(record)
  } catch (e) {
    loadError.value = e.message || 'Rapor yüklenemedi'
  } finally {
    loading.value = false
  }
})

// Önizleme belgesi DOM'a girdiği anda ölçüme bağlanır. onMounted içinde elle
// çağırmak kırılgandı: o sırada `loading` hâlâ true olduğu için önizleme henüz
// render edilmemiş oluyor, yükseklik 0 ölçülüp sahne çöküyordu.
watch(docRef, inst => attach(inst?.root), { immediate: true, flush: 'post' })

function addRow() {
  items.value.push(toLocalItem())
  nextTick(() => {
    const rows = itemsListEl.value?.querySelectorAll('.item-row')
    const last = rows?.[rows.length - 1]
    if (!last) return
    last.scrollIntoView({ behavior: 'smooth', block: 'center' })
    last.querySelector('.f-name input')?.focus()
  })
}
function removeRow(i)       { items.value.splice(i, 1) }
function moveRow(i, dir) {
  const j = i + dir
  if (j < 0 || j >= items.value.length) return
  const [row] = items.value.splice(i, 1)
  items.value.splice(j, 0, row)
}

async function save() {
  saving.value = true
  actionError.value = null
  try {
    const fresh = await maintenance.saveDraft(route.params.recordId, {
      meta: { ...meta },
      items: items.value,
    })
    hydrate(fresh)
  } catch (e) {
    actionError.value = e.message || 'Kaydedilemedi'
  } finally {
    saving.value = false
  }
}

async function confirmFinalize() {
  finalizing.value = true
  actionError.value = null
  try {
    await maintenance.saveDraft(route.params.recordId, { meta: { ...meta }, items: items.value })
    const fresh = await maintenance.finalizeReport(route.params.recordId)
    hydrate(fresh)
    showFinalize.value = false
  } catch (e) {
    actionError.value = e.message || 'Kesinleştirilemedi'
  } finally {
    finalizing.value = false
  }
}

async function unlock() {
  finalizing.value = true
  try {
    const fresh = await maintenance.unfinalize(route.params.recordId)
    hydrate(fresh)
  } catch (e) {
    actionError.value = e.message
  } finally {
    finalizing.value = false
  }
}

async function removeReport() {
  if (!confirm('Bu rapor tamamen silinsin mi?')) return
  try {
    await maintenance.deleteRecord(route.params.recordId)
    goBack()
  } catch (e) {
    actionError.value = e.message
  }
}

async function downloadPdf() {
  const name = `Bakim-Raporu-${rec.value?.report_no || 'taslak'}-${slugForFilename(selectedCar.value?.plate)}.pdf`
  try {
    await captureAtNaturalScale(() => pdf.download(docRef.value?.root, name))
  } catch (e) {
    actionError.value = e.message || 'PDF oluşturulamadı'
  }
}

function goBack() {
  if (rec.value?.user_id) router.push(`/admin/musteri/${rec.value.user_id}`)
  else router.back()
}
</script>

<style scoped>
.page { padding: 16px; padding-bottom: 120px; min-height: 100vh; background: #080808; }

.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.back {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; color: #c9a84c;
  font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0;
}
.title-wrap { flex: 1; min-width: 0; }
.title { font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700; color: #e5e5e5; margin: 0; }
.sub { font-size: 12px; color: #888; margin: 2px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge {
  flex-shrink: 0;
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.badge.draft { background: rgba(234,179,8,0.18); color: #eab308; }
.badge.ok    { background: rgba(34,197,94,0.18); color: #22c55e; }

.loading { text-align: center; color: #888; padding: 40px 0; }
.loading.err { color: #ef4444; }
.loading.sm { padding: 8px 0; font-size: 13px; }

.body { display: flex; flex-direction: column; gap: 20px; }
@media (min-width: 1200px) {
  .body { flex-direction: row; align-items: flex-start; }
  .form-col { width: 500px; flex-shrink: 0; }
  .preview-col { flex: 1; min-width: 0; position: sticky; top: 16px; }
}

.card {
  background: #111;
  border: 1px solid rgba(201, 168, 76, 0.15);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
}
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.card-title { font-size: 14px; font-weight: 700; color: #c9a84c; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em; }
.card-head .card-title { margin: 0; }

.field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.field label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.04em; }
.field .hint { text-transform: none; letter-spacing: 0; color: #666; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.ctrl {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 9px 11px;
  color: #e5e5e5;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}
.ctrl:focus { border-color: rgba(201,168,76,0.5); }
.ctrl:disabled { opacity: 0.6; }
.ta-r { text-align: right; }

.btn-ghost {
  background: rgba(201,168,76,0.1); color: #c9a84c;
  border: 1px solid rgba(201,168,76,0.3); border-radius: 8px;
  padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;
}
.empty { color: #666; font-size: 13px; font-style: italic; padding: 6px 0; }

.totals-fields { margin-top: 12px; }
.sum { margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; }
.sum-row { display: flex; justify-content: space-between; font-size: 13px; color: #aaa; padding: 3px 0; }
.sum-row b { color: #ddd; }
.sum-row.grand { font-size: 15px; margin-top: 4px; }
.sum-row.grand span { color: #e5e5e5; font-weight: 600; }
.sum-row.grand b { color: #e0bc6e; }

.actionbar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.btn {
  padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;
  cursor: pointer; border: 1px solid transparent;
  background: #1e1e1e; color: #e5e5e5;
}
.btn:disabled { opacity: 0.55; cursor: default; }
.btn.gold { background: linear-gradient(135deg, #c9a84c, #e0bc6e); color: #080808; }
.btn.ghost { background: transparent; border-color: rgba(255,255,255,0.14); color: #cfcfcf; }
.btn.danger { background: transparent; border-color: rgba(239,68,68,0.3); color: #ef4444; }

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.preview-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin: 0; }

.zoom-bar { display: flex; align-items: center; gap: 8px; }
.zbtn {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  background: #1f1f1f;
  color: #e5e5e5;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.zbtn:disabled { opacity: 0.4; cursor: default; }
.zbtn.zfit {
  width: auto;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 700;
  color: #c9a84c;
  border-color: rgba(201,168,76,0.35);
  background: rgba(201,168,76,0.08);
}
.zpct { font-size: 11px; color: #ccc; min-width: 36px; text-align: center; }

.preview-frame {
  overflow: auto;
  background: #3a3a3a;
  border-radius: 12px;
  padding: 16px;
  max-height: calc(100vh - 120px);
}
.stage { position: relative; margin: 0 auto; overflow: hidden; }
.scaler { transform-origin: top left; width: 794px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.modal { background: #1a1a1a; border: 1px solid rgba(201,168,76,0.2); border-radius: 16px; padding: 22px; max-width: 420px; width: 100%; }
.modal h3 { font-size: 16px; font-weight: 700; color: #e5e5e5; margin: 0 0 10px; }
.modal-text { font-size: 13px; color: #aaa; line-height: 1.6; margin: 0 0 18px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
</style>
