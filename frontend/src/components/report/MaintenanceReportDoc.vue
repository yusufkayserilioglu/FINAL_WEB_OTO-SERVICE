<template>
  <div class="report-doc" ref="root">
    <!-- ─── Üst şerit: marka logoları (yer tutucu) ─────────────── -->
    <div class="logo-strip">
      <div v-for="logo in brandLogos" :key="logo.name" class="logo-slot">
        <img v-if="logo.src" :src="logo.src" :alt="logo.name" class="logo-img" />
        <div v-else class="logo-ph">
          <Car :size="16" :stroke-width="1.5" />
          <span>{{ logo.name }}</span>
        </div>
      </div>
    </div>

    <!-- ─── Firma başlığı ──────────────────────────────────────── -->
    <div class="company-head">
      <div class="company-brand">
        <img :src="company.logo" alt="" class="company-logo" />
        <span class="company-name">{{ company.name }}</span>
      </div>
      <table class="company-info">
        <tbody>
          <tr><th>ADRES</th><td>{{ company.address }}</td></tr>
          <tr><th>TELEFON</th><td>{{ company.phone }}<template v-if="company.phone2"> · {{ company.phone2 }}</template></td></tr>
          <tr><th>E-POSTA</th><td>{{ company.email }}</td></tr>
          <tr><th>WEB</th><td>{{ company.web }}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ─── Müşteri bilgileri ──────────────────────────────────── -->
    <div class="band">MÜŞTERİ BİLGİLERİ</div>
    <table class="kv-grid">
      <tbody>
        <tr>
          <th>MÜŞTERİ ADI</th><td>{{ customerName }}</td>
          <th>RAPOR NO</th><td>{{ reportNo }}</td>
        </tr>
        <tr>
          <th>ARAÇ MODEL</th><td>{{ carModel || '—' }}</td>
          <th>RAPOR TARİHİ</th><td>{{ dateText }}</td>
        </tr>
        <tr>
          <th>PLAKA</th><td>{{ plate }}</td>
          <th>TEL</th><td>{{ phone }}</td>
        </tr>
        <tr>
          <th>ARAÇ YILI</th><td>{{ carYear || '—' }}</td>
          <th>KM</th><td>{{ kmText }}</td>
        </tr>
      </tbody>
    </table>

    <!-- ─── Bakım kalemleri ────────────────────────────────────── -->
    <div class="band">BAKIM BİLGİLERİ</div>
    <table class="items">
      <thead>
        <tr>
          <th class="c-no">S.NO</th>
          <th class="c-brand">MARKA</th>
          <th class="c-name">STOK ADI</th>
          <th class="c-price">BİRİM FİYAT</th>
          <th class="c-qty">MİKTAR</th>
          <th class="c-total">TUTAR</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in paddedRows" :key="i">
          <td class="c-no">{{ row ? i + 1 : '' }}</td>
          <td class="c-brand">{{ row?.brand || '' }}</td>
          <td class="c-name">{{ row?.description || '' }}</td>
          <td class="c-price">{{ row ? money(row.unit_price) : '' }}</td>
          <td class="c-qty">{{ row ? qtyUnit(row) : '' }}</td>
          <td class="c-total">{{ row ? money(lineOf(row)) : '' }}</td>
        </tr>
      </tbody>
    </table>

    <!-- ─── Toplamlar ──────────────────────────────────────────── -->
    <table class="totals">
      <tbody>
        <tr>
          <th>ARA TOPLAM</th>
          <td>{{ money(totals.subtotal) }}</td>
        </tr>
        <tr v-if="totals.discount > 0">
          <th>İSKONTO</th>
          <td>− {{ money(totals.discount) }}</td>
        </tr>
        <tr>
          <th>KDV (%{{ trimPct(totals.vatRate) }})</th>
          <td>{{ money(totals.vatAmount) }}</td>
        </tr>
        <tr class="grand">
          <th>GENEL TOPLAM</th>
          <td>{{ money(totals.grandTotal) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- ─── Dipnot ─────────────────────────────────────────────── -->
    <div class="foot">
      <p v-if="nextServiceText" class="next-service"><strong>Önerilen sonraki bakım:</strong> {{ nextServiceText }}</p>
      <p v-if="record?.note" class="note">{{ record.note }}</p>
      <p class="disclaimer">Bu belge yapılan bakım ve kullanılan parçaların dökümüdür. Fiyatlara aksi belirtilmedikçe KDV dahil değildir.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Car } from 'lucide-vue-next'
import { reportCompany, reportBrandLogos, REPORT_MIN_ROWS } from '@/config/report'
import { formatTRY, formatQtyUnit, computeTotals, lineTotal, num, reportNoLabel } from '@/utils/report'
import { formatShortDate, formatKm } from '@/utils/service'

const props = defineProps({
  record:   { type: Object, required: true },
  customer: { type: Object, default: null },   // admin taslak: canlı müşteri
  car:      { type: Object, default: null },   // admin taslak: canlı araç
})

const root = ref(null)
defineExpose({ root })

const company    = reportCompany
const brandLogos = reportBrandLogos

const items = computed(() => props.record?.maintenance_items || [])

const paddedRows = computed(() => {
  const rows = [...items.value]
  while (rows.length < REPORT_MIN_ROWS) rows.push(null)
  return rows
})

const totals = computed(() =>
  computeTotals(items.value, {
    discount: props.record?.discount,
    vatRate:  props.record?.vat_rate,
  })
)

const customerName = computed(() =>
  props.record?.customer_name || props.customer?.name || props.record?.profiles?.name || '—'
)
const phone = computed(() =>
  props.record?.customer_phone || props.customer?.phone || props.record?.profiles?.phone || '—'
)
const carBrand = computed(() =>
  props.record?.car_brand || props.car?.brand || props.record?.cars?.brand || ''
)
const carModelName = computed(() =>
  props.record?.car_model || props.car?.model || props.record?.cars?.model || ''
)
const carModel = computed(() => [carBrand.value, carModelName.value].filter(Boolean).join(' '))
const carYear = computed(() =>
  props.record?.car_year || props.car?.year || props.record?.cars?.year || ''
)
const plate = computed(() =>
  props.record?.car_plate || props.car?.plate || props.record?.cars?.plate || '—'
)
const kmValue = computed(() => {
  const v = props.record?.km ?? props.car?.km ?? props.record?.cars?.km
  return (v === null || v === undefined || v === '') ? null : v
})
const kmText = computed(() => (kmValue.value == null ? '—' : formatKm(kmValue.value)))
const dateText = computed(() => formatShortDate(props.record?.date) || '—')
const reportNo = computed(() => reportNoLabel(props.record))

const nextServiceText = computed(() => {
  const d  = props.record?.next_service_date
  const km = props.record?.next_service_km
  const parts = []
  if (d)  parts.push(formatShortDate(d))
  if (km != null && km !== '') parts.push(formatKm(km))
  return parts.join(' · ')
})

function money(v)   { return formatTRY(v) }
function qtyUnit(r) { return formatQtyUnit(r) }
function lineOf(r)  { return lineTotal(r) }
function trimPct(v) { return num(v).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) }
</script>

<style scoped>
/* Beyaz kâğıt belge — uygulamanın koyu temasından bağımsız, sabit A4 genişliği. */
.report-doc {
  width: 794px;
  box-sizing: border-box;
  background: #ffffff;
  color: #111111;
  padding: 28px 30px 34px;
  font-family: Arial, 'Helvetica Neue', Helvetica, 'Inter', sans-serif;
  font-size: 11px;
  line-height: 1.4;
}
.report-doc * { box-sizing: border-box; }

.logo-strip {
  display: flex;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 2px solid #111111;
  margin-bottom: 14px;
}
.logo-slot {
  flex: 1;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.logo-ph {
  width: 100%;
  height: 100%;
  border: 1px dashed #b9b9b9;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #8a8a8a;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.company-head {
  display: flex;
  gap: 16px;
  border: 1px solid #111111;
  padding: 12px 14px;
  margin-bottom: 16px;
}
.company-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 150px;
  flex-shrink: 0;
}
.company-logo { width: 96px; height: auto; object-fit: contain; }
.company-name {
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-align: center;
}
.company-info { border-collapse: collapse; width: 100%; }
.company-info th {
  text-align: left;
  vertical-align: top;
  width: 74px;
  padding: 2px 8px 2px 0;
  color: #555555;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.04em;
}
.company-info td { padding: 2px 0; font-size: 10.5px; }

.band {
  background: #1f1f1f;
  color: #ffffff;
  text-align: center;
  font-weight: 800;
  letter-spacing: 0.14em;
  font-size: 10.5px;
  padding: 5px 0;
}

.kv-grid {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}
.kv-grid th, .kv-grid td {
  border: 1px solid #cfcfcf;
  padding: 5px 8px;
  font-size: 10.5px;
}
.kv-grid th {
  background: #f2f2f2;
  text-align: left;
  width: 110px;
  font-weight: 700;
  color: #444444;
  letter-spacing: 0.03em;
}

.items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0;
}
.items th, .items td {
  border: 1px solid #cfcfcf;
  padding: 4px 6px;
  font-size: 10px;
}
.items thead th {
  background: #f2f2f2;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: center;
  color: #333333;
}
.items tbody td { height: 20px; }
.c-no    { width: 34px;  text-align: center; }
.c-brand { width: 92px; }
.c-name  { }
.c-price { width: 92px;  text-align: right; }
.c-qty   { width: 70px;  text-align: center; }
.c-total { width: 100px; text-align: right; }

.totals {
  border-collapse: collapse;
  margin-left: auto;
  margin-top: -1px;
  width: 300px;
}
.totals th, .totals td {
  border: 1px solid #cfcfcf;
  padding: 5px 8px;
  font-size: 10.5px;
}
.totals th {
  background: #f2f2f2;
  text-align: left;
  font-weight: 700;
  color: #444444;
}
.totals td { text-align: right; }
.totals .grand th, .totals .grand td {
  background: #1f1f1f;
  color: #ffffff;
  font-weight: 800;
  font-size: 11.5px;
}

.foot { margin-top: 18px; font-size: 10px; color: #333333; }
.foot .next-service { margin-bottom: 4px; }
.foot .note { margin-bottom: 6px; white-space: pre-wrap; }
.foot .disclaimer { color: #888888; font-size: 9px; }
</style>
