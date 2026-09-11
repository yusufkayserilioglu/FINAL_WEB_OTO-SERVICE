<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style="background: rgba(0,0,0,0.78); backdrop-filter: blur(8px);"
      @click.self="$emit('close')"
    >
      <div class="w-full max-w-lg my-8 rounded-2xl border border-white/10 p-7"
           style="background: rgba(17,17,17,0.99);">
        <!-- Başlık -->
        <div class="flex items-start justify-between mb-2">
          <div>
            <h2 class="font-display font-bold text-xl text-white">Kayıtsız Müşteri Ekle</h2>
            <p class="text-gray-500 text-xs mt-1 leading-relaxed">
              Üye olmayan müşteriyi SMS doğrulaması olmadan kaydeder.<br />
              Kayıt, müşteri listesine düşer; hemen bakım raporu açabilirsiniz.
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/5 transition-all shrink-0"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Aynı telefon zaten kayıtlı -->
        <div v-if="duplicate" class="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm my-5">
          <AlertCircle :size="15" class="shrink-0 mt-0.5" />
          <div>
            <p>Bu telefon <strong>{{ duplicate.name }}</strong> adına zaten kayıtlı.</p>
            <button class="underline mt-1 text-amber-200 hover:text-amber-100" @click="$emit('created', duplicate.profile_id)">
              Mevcut müşteriye git →
            </button>
          </div>
        </div>

        <!-- Hata -->
        <div v-if="error" class="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm my-5">
          <AlertCircle :size="14" class="shrink-0" />
          {{ error }}
        </div>

        <form class="mt-5" @submit.prevent="handleSubmit">
          <FormInput v-model="form.name" label="Ad Soyad" placeholder="Adı Soyadı" required autocomplete="off" />

          <label class="block text-gray-400 text-sm font-medium mb-1.5">Telefon <span class="text-gray-600">(opsiyonel)</span></label>
          <div class="flex gap-2 mb-4">
            <span class="flex items-center px-4 rounded-xl border border-white/10 bg-white/5 text-gray-400 text-sm select-none">+90</span>
            <input
              v-model="form.phone"
              type="tel"
              inputmode="numeric"
              placeholder="5XX XXX XX XX"
              class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3
                     text-white placeholder:text-gray-600 text-sm tracking-wide
                     focus:border-gold/50 focus:bg-white/8 transition-all duration-200"
            />
          </div>

          <FormInput v-model="form.note" label="Not (opsiyonel)" placeholder="Servise geliş nedeni, adres vb." />

          <!-- Araç -->
          <button
            type="button"
            class="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/10
                   text-sm text-gray-300 hover:border-gold/30 transition-all mb-4"
            @click="withCar = !withCar"
          >
            <span class="flex items-center gap-2">
              <Car :size="15" class="text-gold" />
              Araç bilgisi ekle
              <span class="text-gray-600 text-xs">(bakım raporu için gerekli)</span>
            </span>
            <ChevronDown :size="16" :class="withCar ? 'rotate-180 transition-transform' : 'transition-transform'" />
          </button>

          <div v-if="withCar" class="rounded-xl border border-white/8 p-4 mb-2" style="background: rgba(255,255,255,0.02);">
            <FormSelect v-model="form.car.brand" label="Marka" :options="brandOptions" placeholder="Marka seçin" />
            <div class="grid grid-cols-2 gap-4">
              <FormInput v-model="form.car.model" label="Model" placeholder="X5, 911, A6..." />
              <FormInput v-model="form.car.year"  label="Yıl"   type="number" placeholder="2020" min="1950" :max="currentYear" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <FormInput v-model="form.car.plate" label="Plaka"     placeholder="06 AB 1234" />
              <FormInput v-model="form.car.km"    label="Kilometre" type="number" placeholder="45000" min="0" />
            </div>
            <p class="text-gray-600 text-xs">Marka ve plaka girilirse araç birlikte oluşturulur.</p>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              type="submit"
              :disabled="loading || !form.name.trim()"
              class="flex-1 inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                     bg-gradient-to-r from-gold to-gold-light text-black py-3 rounded-xl
                     hover:shadow-gold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span v-if="loading" class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              {{ loading ? 'Kaydediliyor...' : 'Müşteriyi Kaydet' }}
            </button>
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 border border-white/10 text-gray-400 py-3 rounded-xl text-sm font-medium
                     hover:border-white/20 hover:text-white transition-all"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { X, AlertCircle, Car, ChevronDown } from 'lucide-vue-next'
import FormInput  from '@/components/ui/FormInput.vue'
import FormSelect from '@/components/ui/FormSelect.vue'
import { useAdminStore } from '@/stores/admin'
import { brandOptions }  from '@/data/brands'

const emit  = defineEmits(['close', 'created'])
const admin = useAdminStore()
const currentYear = new Date().getFullYear()

const form = reactive({
  name: '', phone: '', note: '',
  car: { brand: '', model: '', year: '', plate: '', km: '' },
})
const withCar   = ref(true)
const loading   = ref(false)
const error     = ref('')
const duplicate = ref(null)

async function handleSubmit() {
  error.value = ''
  duplicate.value = null
  loading.value = true
  try {
    const c = form.car
    const carTouched = withCar.value &&
      (c.brand || c.plate.trim() || c.model.trim() || c.year || c.km)
    // Yarım bırakılmış araç bilgisi sessizce yok sayılmasın
    if (carTouched && !(c.brand && c.plate.trim())) {
      error.value = 'Araç eklemek için marka ve plaka zorunludur.'
      return
    }
    const car = carTouched ? c : null
    const res = await admin.createWalkInCustomer({
      name:  form.name,
      phone: form.phone,
      note:  form.note,
      car,
    })
    if (res?.duplicate) {
      duplicate.value = res       // aynı numara kayıtlı — mevcut kayda yönlendir
      return
    }
    emit('created', res.profile_id)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
