<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Müşteriler</h1>
        <span class="count">{{ admin.customers.length }} müşteri</span>
      </div>
      <button class="btn-new" @click="showNew = true">
        <UserPlus :size="15" /> Kayıtsız Müşteri
      </button>
    </div>

    <div class="search-bar">
      <Search :size="16" class="search-icon" />
      <input v-model="searchQuery" type="text" placeholder="İsim, telefon veya plaka ara..." class="search-input" />
    </div>

    <div v-if="admin.loading" class="loading">Yükleniyor...</div>

    <div v-else-if="!admin.customers.length" class="empty-state">
      <Users :size="48" class="empty-icon" />
      <p>Henüz müşteri yok</p>
    </div>

    <div v-else>
      <CustomerCard
        v-for="c in filteredCustomers"
        :key="c.id"
        :customer="c"
        @select="id => $router.push(`/admin/musteri/${id}`)"
      />
      <p v-if="filteredCustomers.length === 0" class="no-results">Eşleşen müşteri bulunamadı</p>
    </div>

    <NewCustomerModal
      v-if="showNew"
      @close="showNew = false"
      @created="goToCustomer"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Users, UserPlus } from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import CustomerCard    from '@/components/admin/CustomerCard.vue'
import NewCustomerModal from '@/components/admin/NewCustomerModal.vue'

const admin       = useAdminStore()
const router      = useRouter()
const searchQuery = ref('')
const showNew     = ref(false)

onMounted(() => admin.fetchCustomers())

function goToCustomer(id) {
  showNew.value = false
  router.push(`/admin/musteri/${id}`)
}

const filteredCustomers = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return admin.customers
  return admin.customers.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.phone?.toLowerCase().includes(q) ||
    (c.cars || []).some(car => car.plate?.toLowerCase().includes(q))
  )
})
</script>

<style scoped>
.page-container {
  padding: 24px 16px;
  padding-bottom: 100px;
  min-height: 100vh;
  background: #080808;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 13px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  color: #080808;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
}

.count {
  font-size: 12px;
  color: #888;
}

.search-bar {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.search-input {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 10px 12px 10px 38px;
  color: #e5e5e5;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: rgba(201, 168, 76, 0.4);
}

.loading {
  text-align: center;
  color: #888;
  padding: 40px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #555;
}

.empty-icon {
  color: rgba(201, 168, 76, 0.3);
  margin-bottom: 12px;
}

.no-results {
  text-align: center;
  color: #555;
  padding: 20px;
  font-size: 14px;
}
</style>
