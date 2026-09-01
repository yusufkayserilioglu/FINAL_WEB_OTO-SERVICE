<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);"
        @click.self="$emit('close')"
      >
        <div class="modal-inner w-full max-w-lg rounded-2xl border border-white/10 p-8"
             style="background: rgba(17,17,17,0.98);">
          <!-- Header -->
          <div class="flex items-center justify-between mb-7">
            <h2 class="font-display font-bold text-xl text-white">Araç Ekle</h2>
            <button
              @click="$emit('close')"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/5 transition-all"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Error -->
          <div v-if="error" class="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
            <AlertCircle :size="14" />
            {{ error }}
          </div>

          <form @submit.prevent="handleSubmit">
            <FormSelect
              v-model="form.brand"
              label="Marka"
              :options="brandOptions"
              placeholder="Marka seçin"
            />

            <div class="grid grid-cols-2 gap-4">
              <FormInput v-model="form.model" label="Model"  placeholder="X5, 911, A6..." required />
              <FormInput v-model="form.year"  label="Yıl"    type="number" placeholder="2020" min="1990" :max="currentYear" required />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <FormInput v-model="form.plate" label="Plaka"      placeholder="06 AB 1234" required />
              <FormInput v-model="form.km"    label="Kilometre"  type="number" placeholder="45000" min="0" required />
            </div>

            <div class="flex gap-3 mt-6">
              <button
                type="submit"
                :disabled="loading || !form.brand"
                class="flex-1 inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                       bg-gradient-to-r from-gold to-gold-light text-black py-3 rounded-xl
                       hover:shadow-gold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span v-if="loading" class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {{ loading ? 'Ekleniyor...' : 'Aracı Ekle' }}
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
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { X, AlertCircle } from 'lucide-vue-next'
import FormInput  from '@/components/ui/FormInput.vue'
import FormSelect from '@/components/ui/FormSelect.vue'
import { useCarsStore } from '@/stores/cars'
import { brandOptions } from '@/data/brands'

const emit  = defineEmits(['close', 'added'])
const cars  = useCarsStore()
const currentYear = new Date().getFullYear()

const form = reactive({ brand: '', model: '', year: '', plate: '', km: '' })
const loading = ref(false)
const error   = ref('')

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  try {
    await cars.addCar({ ...form })
    emit('added')
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
