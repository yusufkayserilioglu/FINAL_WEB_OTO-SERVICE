<template>
  <div class="p-5 md:p-8 max-w-3xl">
    <div class="mb-8">
      <p class="text-gray-600 text-sm">Hesabım</p>
      <h1 class="font-display font-black text-3xl text-white">Profil</h1>
    </div>

    <!-- Genel bildirim -->
    <div v-if="notice"
         class="flex items-start gap-2 p-4 rounded-xl border text-sm mb-6"
         :class="notice.type === 'error'
           ? 'bg-red-500/10 border-red-500/20 text-red-400'
           : 'bg-green-500/10 border-green-500/20 text-green-400'">
      <AlertCircle v-if="notice.type === 'error'" :size="16" class="shrink-0 mt-0.5" />
      <CheckCircle v-else :size="16" class="shrink-0 mt-0.5" />
      <span>{{ notice.text }}</span>
    </div>

    <!-- ═══ KİŞİSEL BİLGİLER ═══ -->
    <section class="rounded-2xl border border-white/5 p-6 md:p-8 mb-6" style="background: rgba(255,255,255,0.02);">
      <h2 class="font-display font-bold text-lg text-white mb-6">Kişisel Bilgiler</h2>

      <!-- Ad soyad -->
      <div class="mb-6">
        <label class="block text-gray-400 text-sm font-medium mb-1.5">Ad Soyad</label>
        <div class="flex flex-col sm:flex-row gap-2">
          <input v-model="name" type="text" placeholder="Adınız Soyadınız"
                 class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
                        placeholder:text-gray-600 text-sm focus:border-gold/50 transition-all" />
          <button @click="saveName" :disabled="savingName || !name.trim() || name.trim() === auth.userName"
                  class="font-display font-bold text-sm bg-white/5 border border-white/10 text-white
                         px-5 py-3 rounded-xl hover:border-gold/40 hover:text-gold
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            {{ savingName ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
      </div>

      <!-- Telefon -->
      <div class="mb-6 pb-6 border-b border-white/5">
        <label class="block text-gray-400 text-sm font-medium mb-1.5">Telefon Numarası</label>
        <p class="text-white font-medium mb-3">{{ formatPhone(auth.userPhone) || 'Belirtilmemiş' }}</p>

        <!-- Değiştir formu -->
        <template v-if="phoneStep === 'idle'">
          <button @click="phoneStep = 'input'"
                  class="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors">
            <Pencil :size="14" /> Numarayı değiştir
          </button>
        </template>

        <template v-else-if="phoneStep === 'input'">
          <div class="flex gap-2 mb-3">
            <span class="flex items-center px-4 rounded-xl border border-white/10 bg-white/5 text-gray-400 text-sm select-none">+90</span>
            <input v-model="newPhone" type="tel" inputmode="numeric" placeholder="5XX XXX XX XX"
                   class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
                          placeholder:text-gray-600 text-sm focus:border-gold/50 transition-all" />
          </div>
          <div class="flex gap-2">
            <button @click="startPhoneChange" :disabled="busy || !newPhone.trim()"
                    class="font-display font-bold text-sm bg-gradient-to-r from-gold to-gold-light text-black
                           px-5 py-2.5 rounded-xl hover:shadow-gold disabled:opacity-40 transition-all">
              {{ busy ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder' }}
            </button>
            <button @click="cancelPhoneChange" class="text-gray-500 hover:text-white text-sm px-3 transition-colors">
              Vazgeç
            </button>
          </div>
        </template>

        <template v-else>
          <p class="text-gray-400 text-sm mb-3">
            <span class="text-white font-medium">{{ formatPhone(pendingPhone) }}</span> numarasına gönderilen kodu girin.
          </p>
          <input v-model="phoneCode" type="text" inputmode="numeric" maxlength="6" placeholder="••••••"
                 class="w-full sm:w-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3
                        text-white placeholder:text-gray-600 text-lg text-center tracking-[0.4em] font-mono
                        focus:border-gold/50 transition-all" />
          <div class="flex gap-2">
            <button @click="finishPhoneChange" :disabled="busy || phoneCode.length < 6"
                    class="font-display font-bold text-sm bg-gradient-to-r from-gold to-gold-light text-black
                           px-5 py-2.5 rounded-xl hover:shadow-gold disabled:opacity-40 transition-all">
              {{ busy ? 'Doğrulanıyor...' : 'Doğrula ve Güncelle' }}
            </button>
            <button @click="cancelPhoneChange" class="text-gray-500 hover:text-white text-sm px-3 transition-colors">
              Vazgeç
            </button>
          </div>
        </template>
      </div>

      <!-- E-posta -->
      <div>
        <label class="block text-gray-400 text-sm font-medium mb-1.5">E-posta</label>
        <p class="text-white font-medium mb-3">{{ auth.userEmail || 'Belirtilmemiş' }}</p>

        <template v-if="!editingEmail">
          <button @click="editingEmail = true"
                  class="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors">
            <Pencil :size="14" /> {{ auth.userEmail ? 'E-postayı değiştir' : 'E-posta ekle' }}
          </button>
        </template>

        <template v-else>
          <input v-model="newEmail" type="email" placeholder="ornek@mail.com"
                 class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 text-white
                        placeholder:text-gray-600 text-sm focus:border-gold/50 transition-all" />
          <p class="text-gray-600 text-xs mb-3">
            Girdiğiniz adrese bir doğrulama bağlantısı gönderilir. Bağlantıya tıklamadan e-postanız değişmez.
          </p>
          <div class="flex gap-2">
            <button @click="saveEmail" :disabled="busy || !newEmail.trim()"
                    class="font-display font-bold text-sm bg-gradient-to-r from-gold to-gold-light text-black
                           px-5 py-2.5 rounded-xl hover:shadow-gold disabled:opacity-40 transition-all">
              {{ busy ? 'Gönderiliyor...' : 'Doğrulama Gönder' }}
            </button>
            <button @click="editingEmail = false; newEmail = ''"
                    class="text-gray-500 hover:text-white text-sm px-3 transition-colors">
              Vazgeç
            </button>
          </div>
        </template>
      </div>
    </section>

    <!-- ═══ ARAÇLARIM ═══ -->
    <section class="rounded-2xl border border-white/5 p-6 md:p-8" style="background: rgba(255,255,255,0.02);">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-display font-bold text-lg text-white">Araçlarım</h2>
        <button v-if="!carForm" @click="openNewCar"
                class="inline-flex items-center gap-2 font-display font-bold text-sm
                       bg-gradient-to-r from-gold to-gold-light text-black px-4 py-2.5 rounded-xl
                       hover:shadow-gold transition-all">
          <Plus :size="15" /> Araç Ekle
        </button>
      </div>

      <!-- Araç formu -->
      <div v-if="carForm" class="rounded-xl border border-gold/20 p-5 mb-6" style="background: rgba(201,168,76,0.04);">
        <h3 class="font-display font-bold text-gold text-sm mb-4">
          {{ carForm.id ? 'Aracı Düzenle' : 'Yeni Araç' }}
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-gray-500 text-xs uppercase tracking-widest mb-1.5">Marka</label>
            <input v-model="carForm.brand" type="text" placeholder="BMW" class="input" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs uppercase tracking-widest mb-1.5">Model</label>
            <input v-model="carForm.model" type="text" placeholder="320i" class="input" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs uppercase tracking-widest mb-1.5">Yıl</label>
            <input v-model="carForm.year" type="number" :min="1950" :max="currentYear + 1" placeholder="2020" class="input" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs uppercase tracking-widest mb-1.5">Plaka</label>
            <input v-model="carForm.plate" type="text" placeholder="06 ABC 123" class="input uppercase" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs uppercase tracking-widest mb-1.5">Güncel Kilometre</label>
            <input v-model="carForm.km" type="number" min="0" placeholder="85000" class="input" />
          </div>
          <div></div>
          <div>
            <label class="block text-gray-500 text-xs uppercase tracking-widest mb-1.5">
              Muayene Tarihi <span class="text-gray-700 normal-case tracking-normal">(isteğe bağlı)</span>
            </label>
            <input v-model="carForm.inspectionDate" type="date" class="input" />
          </div>
          <div>
            <label class="block text-gray-500 text-xs uppercase tracking-widest mb-1.5">
              Sigorta Yenileme <span class="text-gray-700 normal-case tracking-normal">(isteğe bağlı)</span>
            </label>
            <input v-model="carForm.insuranceDate" type="date" class="input" />
          </div>
        </div>

        <p v-if="carError" class="text-red-400 text-sm mb-3">{{ carError }}</p>

        <div class="flex gap-2">
          <button @click="saveCar" :disabled="savingCar"
                  class="font-display font-bold text-sm bg-gradient-to-r from-gold to-gold-light text-black
                         px-5 py-2.5 rounded-xl hover:shadow-gold disabled:opacity-40 transition-all">
            {{ savingCar ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
          <button @click="carForm = null" class="text-gray-500 hover:text-white text-sm px-3 transition-colors">
            Vazgeç
          </button>
        </div>
      </div>

      <!-- Araç listesi -->
      <div v-if="cars.loading" class="text-gray-600 text-sm py-6 text-center">Yükleniyor...</div>

      <p v-else-if="!cars.cars.length" class="text-gray-600 text-sm py-6 text-center">
        Henüz araç eklemediniz.
      </p>

      <div v-else class="space-y-3">
        <div v-for="car in cars.cars" :key="car.id"
             class="rounded-xl border border-white/5 p-5" style="background: rgba(255,255,255,0.02);">
          <div class="flex flex-wrap items-center gap-4">
            <div class="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Car :size="18" class="text-gold" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white font-medium truncate">{{ car.brand?.toUpperCase() }} {{ car.model }}</p>
              <p class="text-gray-500 text-sm">{{ car.year }} · {{ car.plate }} · {{ formatKm(car.km) || 'km yok' }}</p>
            </div>
            <div class="flex gap-1 shrink-0">
              <button @click="editCar(car)" class="p-2 text-gray-600 hover:text-gold transition-colors" title="Düzenle">
                <Pencil :size="15" />
              </button>
              <button @click="deleteCar(car)" class="p-2 text-gray-600 hover:text-red-400 transition-colors" title="Sil">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-x-6 gap-y-1 mt-3 pt-3 border-t border-white/5 text-xs">
            <span class="text-gray-600">
              Muayene:
              <span :class="car.inspection_date ? 'text-gray-400' : 'text-gray-700'">
                {{ formatShortDate(car.inspection_date) || 'eklenmedi' }}
              </span>
            </span>
            <span class="text-gray-600">
              Sigorta:
              <span :class="car.insurance_date ? 'text-gray-400' : 'text-gray-700'">
                {{ formatShortDate(car.insurance_date) || 'eklenmedi' }}
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Pencil, Trash2, Plus, Car, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { useAuthStore, formatPhone } from '@/stores/auth'
import { useCarsStore } from '@/stores/cars'
import { formatKm, formatShortDate } from '@/utils/service'

const auth = useAuthStore()
const cars = useCarsStore()

const currentYear = new Date().getFullYear()

const notice     = ref(null)
const busy       = ref(false)
const savingName = ref(false)

// Ad soyad
const name = ref('')

// Telefon değişimi
const phoneStep    = ref('idle')   // idle | input | code
const newPhone     = ref('')
const pendingPhone = ref('')
const phoneCode    = ref('')

// E-posta değişimi
const editingEmail = ref(false)
const newEmail     = ref('')

// Araç formu
const carForm   = ref(null)
const carError  = ref('')
const savingCar = ref(false)

onMounted(async () => {
  name.value = auth.userName
  await cars.fetchCars()
})

function flash(text, type = 'success') {
  notice.value = { text, type }
  setTimeout(() => { notice.value = null }, 6000)
}

async function saveName() {
  savingName.value = true
  try {
    await auth.updateProfile({ name: name.value })
    flash('Adınız güncellendi.')
  } catch (e) {
    flash(e.message, 'error')
  } finally {
    savingName.value = false
  }
}

async function startPhoneChange() {
  busy.value = true
  try {
    pendingPhone.value = await auth.requestPhoneChange(newPhone.value)
    phoneStep.value = 'code'
    phoneCode.value = ''
  } catch (e) {
    flash(e.message, 'error')
  } finally {
    busy.value = false
  }
}

async function finishPhoneChange() {
  busy.value = true
  try {
    await auth.confirmPhoneChange(pendingPhone.value, phoneCode.value)
    cancelPhoneChange()
    flash('Telefon numaranız güncellendi.')
  } catch (e) {
    flash(e.message, 'error')
  } finally {
    busy.value = false
  }
}

function cancelPhoneChange() {
  phoneStep.value = 'idle'
  newPhone.value  = ''
  phoneCode.value = ''
}

async function saveEmail() {
  busy.value = true
  try {
    await auth.requestEmailChange(newEmail.value)
    editingEmail.value = false
    flash(`${newEmail.value} adresine doğrulama bağlantısı gönderildi. Bağlantıya tıkladığınızda e-postanız güncellenecek.`)
    newEmail.value = ''
  } catch (e) {
    flash(e.message, 'error')
  } finally {
    busy.value = false
  }
}

function openNewCar() {
  carError.value = ''
  carForm.value = { id: null, brand: '', model: '', year: '', plate: '', km: '', inspectionDate: '', insuranceDate: '' }
}

function editCar(car) {
  carError.value = ''
  carForm.value = {
    id:             car.id,
    brand:          car.brand ?? '',
    model:          car.model ?? '',
    year:           car.year ?? '',
    plate:          car.plate ?? '',
    km:             car.km ?? '',
    inspectionDate: car.inspection_date ?? '',
    insuranceDate:  car.insurance_date ?? '',
  }
}

async function saveCar() {
  const f = carForm.value
  carError.value = ''
  if (!f.brand.trim() || !f.model.trim() || !f.year || !f.plate.trim()) {
    carError.value = 'Marka, model, yıl ve plaka zorunludur.'
    return
  }
  savingCar.value = true
  try {
    if (f.id) {
      await cars.updateCar(f.id, f)
      flash('Araç bilgileri güncellendi.')
    } else {
      await cars.addCar(f)
      flash('Araç eklendi.')
    }
    carForm.value = null
  } catch (e) {
    carError.value = e.message
  } finally {
    savingCar.value = false
  }
}

async function deleteCar(car) {
  if (!confirm(`${car.plate} plakalı aracı silmek istediğinize emin misiniz?`)) return
  try {
    await cars.removeCar(car.id)
    flash('Araç silindi.')
  } catch (e) {
    flash(e.message, 'error')
  }
}
</script>

<style scoped>
.input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 11px 14px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.input:focus         { border-color: rgba(201, 168, 76, 0.5); }
.input::placeholder  { color: #4b5563; }
</style>
