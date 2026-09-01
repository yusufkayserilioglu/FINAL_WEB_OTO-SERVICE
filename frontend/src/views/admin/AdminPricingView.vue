<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Fiyat Yönetimi</h1>
    </div>

    <div v-if="pricing.loading" class="loading">Yükleniyor...</div>

    <div v-else>
      <div v-for="price in pricing.prices" :key="price.id" class="price-row">
        <div class="price-info">
          <p class="price-name">{{ price.title }}</p>
          <p class="price-current">
            {{ formatCost(price.min_price) }} – {{ formatCost(price.max_price) }}
          </p>
        </div>
        <button class="edit-btn" @click="startEdit(price)">
          <Pencil :size="16" />
        </button>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editingPrice" class="modal-overlay" @click.self="editingPrice = null">
      <div class="modal">
        <h3 class="modal-title">{{ editingPrice.title }}</h3>
        <div class="modal-inputs">
          <div class="input-group">
            <label>Min (₺)</label>
            <input v-model.number="editForm.minPrice" type="number" class="form-control" />
          </div>
          <div class="input-group">
            <label>Max (₺)</label>
            <input v-model.number="editForm.maxPrice" type="number" class="form-control" />
          </div>
        </div>
        <p v-if="saveError" class="error-msg">{{ saveError }}</p>
        <div class="modal-actions">
          <button class="btn-cancel-modal" @click="editingPrice = null">Vazgeç</button>
          <button class="btn-save" @click="savePrice" :disabled="saving">
            {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Pencil } from 'lucide-vue-next'
import { usePricingStore } from '@/stores/pricing'

const pricing      = usePricingStore()
const editingPrice = ref(null)
const editForm     = ref({ minPrice: 0, maxPrice: 0 })
const saving       = ref(false)
const saveError    = ref(null)

onMounted(() => pricing.fetchPrices())

function startEdit(price) {
  editingPrice.value     = price
  editForm.value.minPrice = price.min_price
  editForm.value.maxPrice = price.max_price
  saveError.value        = null
}

async function savePrice() {
  saving.value    = true
  saveError.value = null
  try {
    await pricing.updatePrice(editingPrice.value.id, editForm.value)
    editingPrice.value = null
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

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

.page-header { margin-bottom: 20px; }

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
}

.loading {
  text-align: center;
  color: #888;
  padding: 40px 0;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #111;
  border: 1px solid rgba(201, 168, 76, 0.12);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
}

.price-name {
  font-weight: 600;
  color: #e5e5e5;
  font-size: 14px;
  margin: 0 0 4px;
}

.price-current {
  font-size: 12px;
  color: #c9a84c;
  margin: 0;
}

.edit-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.3);
  color: #c9a84c;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.modal {
  background: #1a1a1a;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 24px 20px;
  width: 100%;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0 0 16px;
}

.modal-inputs {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.input-group { flex: 1; }

.input-group label {
  display: block;
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  background: #111;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #e5e5e5;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-control:focus { border-color: rgba(201, 168, 76, 0.4); }

.error-msg {
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.btn-cancel-modal {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #888;
  font-weight: 600;
  cursor: pointer;
}

.btn-save {
  flex: 2;
  padding: 12px;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  border: none;
  border-radius: 10px;
  color: #080808;
  font-weight: 700;
  cursor: pointer;
}

.btn-save:disabled { opacity: 0.6; }
</style>
