<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Hizmet Fiyatları</h1>
      <p class="page-sub">Fiyatlar araç markasına ve durumuna göre değişebilir</p>
    </div>

    <div v-if="pricing.loading" class="loading">Yükleniyor...</div>

    <div v-else class="prices-grid">
      <div v-for="price in pricing.prices" :key="price.id" class="price-card">
        <div class="price-icon">
          <Wrench :size="24" />
        </div>
        <div class="price-info">
          <h3 class="price-title">{{ price.title }}</h3>
          <p class="price-desc" v-if="price.description">{{ price.description }}</p>
        </div>
        <div class="price-range">
          <span class="range-label">Fiyat Aralığı</span>
          <span class="range-value">{{ formatCost(price.min_price) }} – {{ formatCost(price.max_price) }}</span>
        </div>
      </div>
    </div>

    <div class="disclaimer">
      <Info :size="14" />
      <p>Kesin fiyat için randevu alın veya bizimle iletişime geçin.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Wrench, Info } from 'lucide-vue-next'
import { usePricingStore } from '@/stores/pricing'

const pricing = usePricingStore()

onMounted(() => pricing.fetchPrices())

function formatCost(v) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v)
}
</script>

<style scoped>
.page-container {
  padding: 24px 16px;
  padding-bottom: 100px;
  min-height: 100vh;
  background: #080808;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0 0 6px;
}

.page-sub {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.loading {
  text-align: center;
  color: #888;
  padding: 40px 0;
}

.prices-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-card {
  background: #111;
  border: 1px solid rgba(201, 168, 76, 0.12);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.price-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(201, 168, 76, 0.1);
  color: #c9a84c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.price-info {
  flex: 1;
}

.price-title {
  font-weight: 700;
  font-size: 15px;
  color: #e5e5e5;
  margin: 0 0 4px;
}

.price-desc {
  font-size: 12px;
  color: #777;
  margin: 0;
  line-height: 1.4;
}

.price-range {
  text-align: right;
  flex-shrink: 0;
}

.range-label {
  display: block;
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.range-value {
  font-size: 13px;
  font-weight: 700;
  color: #c9a84c;
  white-space: nowrap;
}

.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 20px;
  padding: 12px;
  background: rgba(201, 168, 76, 0.06);
  border-radius: 10px;
  color: #888;
}

.disclaimer p {
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
}

.disclaimer svg {
  flex-shrink: 0;
  color: #c9a84c;
  margin-top: 2px;
}
</style>
