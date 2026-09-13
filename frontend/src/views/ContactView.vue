<template>
  <main class="min-h-screen bg-void pt-36">
    <!-- Header -->
    <div class="container-custom text-center mb-10">
      <p class="text-gold text-xs font-mono tracking-[0.3em] uppercase mb-3" v-scroll-reveal>İletişim</p>
      <h1 class="font-display font-black text-5xl md:text-6xl text-white mb-4" v-scroll-reveal="{ delay: 100 }">
        Bize Ulaşın
      </h1>
      <p class="text-gray-500 max-w-lg mx-auto" v-scroll-reveal="{ delay: 200 }">
        Soru, randevu veya fiyat teklifi için bize yazın ya da arayın.
      </p>
    </div>

    <!-- Garaj Fotoğrafları (ana sayfadakiyle aynı) -->
    <div class="container-custom mb-16">
      <GaragePhotos v-scroll-reveal="{ delay: 250 }" />
    </div>

    <!-- Main content -->
    <div class="container-custom pb-24">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <!-- Left: Üyelik / Mesaj -->
        <div
          class="rounded-2xl border border-white/5 p-8 md:p-10"
          style="background: rgba(255,255,255,0.02);"
          v-scroll-reveal
        >
          <!-- Giriş yapmış kişi: mesajlaşma zaten uygulama içinde -->
          <template v-if="auth.isLoggedIn">
            <div class="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5">
              <MessageCircle :size="20" class="text-gold" />
            </div>
            <h2 class="font-display font-bold text-2xl text-white mb-3">
              {{ auth.isAdmin ? 'Müşteri Mesajları' : 'Ustana Doğrudan Yaz' }}
            </h2>
            <p class="text-gray-500 text-sm leading-relaxed mb-7">
              {{ auth.isAdmin
                ? 'Üyelerin ve üye olmadan yazan ziyaretçilerin mesajları yönetim panelinde.'
                : 'Üye olduğun için ustayla uygulama içinden mesajlaşabilir, fotoğraf gönderebilir ve yanıtı anında görebilirsin.' }}
            </p>
            <RouterLink
              :to="auth.isAdmin ? '/admin/mesajlar' : '/mesajlar'"
              class="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                     bg-gradient-to-r from-gold to-gold-light text-black py-4 rounded-xl
                     hover:shadow-gold hover:scale-[1.01] active:scale-95 transition-all duration-200"
            >
              <MessageCircle :size="16" />
              Mesajlara Git
            </RouterLink>
          </template>

          <!-- Adım 1: Üyelik ayrıcalıkları -->
          <template v-else-if="!guestMode">
            <p class="text-gold text-xs font-mono tracking-[0.3em] uppercase mb-3">Üyelik</p>
            <h2 class="font-display font-black text-3xl text-white leading-tight mb-3">
              Üye Ol, <span class="text-gradient-gold">Ayrıcalıklarla Tanış</span>
            </h2>
            <p class="text-gray-500 text-sm mb-7">
              Telefon numaranla saniyeler içinde üye ol — şifre yok, sadece SMS kodu.
            </p>

            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <li
                v-for="perk in perks"
                :key="perk.title"
                class="flex gap-3 p-4 rounded-xl border border-white/5"
                style="background: rgba(255,255,255,0.02);"
              >
                <div class="w-10 h-10 shrink-0 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <component :is="perk.icon" :size="16" class="text-gold" />
                </div>
                <div>
                  <p class="text-white text-sm font-bold font-display mb-1">{{ perk.title }}</p>
                  <p class="text-gray-500 text-xs leading-relaxed">{{ perk.text }}</p>
                </div>
              </li>
            </ul>

            <RouterLink
              to="/kayit"
              class="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                     bg-gradient-to-r from-gold to-gold-light text-black py-4 rounded-xl
                     hover:shadow-gold hover:scale-[1.01] active:scale-95 transition-all duration-200"
            >
              <UserPlus :size="16" />
              Hemen Üye Ol
            </RouterLink>
            <p class="text-center text-gray-500 text-sm mt-4">
              Zaten üye misin?
              <RouterLink to="/giris" class="text-gold hover:text-gold-light font-medium transition-colors ml-1">
                Giriş Yap
              </RouterLink>
            </p>

            <div class="flex items-center gap-3 my-6">
              <span class="h-px flex-1 bg-white/10" />
              <span class="text-gray-600 text-xs uppercase tracking-widest">veya</span>
              <span class="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              @click="guestMode = true"
              class="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                     border border-white/15 text-white py-4 rounded-xl
                     hover:border-gold/50 hover:text-gold transition-all duration-200"
            >
              <Send :size="16" />
              Üye Olmadan Mesaj Gönder
            </button>
          </template>

          <!-- Adım 2: Üye olmadan mesaj -->
          <template v-else>
            <button
              type="button"
              @click="backToPerks"
              class="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm mb-5 transition-colors"
            >
              <ArrowLeft :size="15" />
              Üyelik ayrıcalıkları
            </button>

            <h2 class="font-display font-bold text-2xl text-white mb-3">Üye Olmadan Mesaj Gönder</h2>
            <p class="flex items-start gap-2.5 p-3.5 rounded-xl border border-green-500/15 bg-green-500/5 text-gray-400 text-sm mb-7">
              <MessageCircle :size="16" class="text-green-400 shrink-0 mt-0.5" />
              <span>Mesajın ustaya iletilir; usta sana <b class="text-green-400 font-semibold">WhatsApp</b> üzerinden dönüş yapar.</span>
            </p>

            <!-- Success -->
            <div
              v-if="sent"
              class="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 mb-6"
            >
              <CheckCircle :size="18" class="shrink-0" />
              <span class="text-sm">Mesajın ustaya iletildi! En kısa sürede WhatsApp üzerinden dönüş yapılacak.</span>
            </div>

            <!-- Error -->
            <div
              v-if="error"
              class="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5"
            >
              <AlertCircle :size="15" class="shrink-0" />
              {{ error }}
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-0">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput v-model="form.name"  label="Ad Soyad"           placeholder="Ahmet Yılmaz" required maxlength="80" autocomplete="name" />
                <FormInput v-model="form.phone" label="Telefon (WhatsApp)" type="tel" placeholder="+90 5xx xxx xxxx" required autocomplete="tel" />
              </div>
              <FormInput   v-model="form.car"   label="Araç Bilgisi"       placeholder="BMW 3 Serisi 2022" maxlength="120" />
              <div class="mb-4">
                <label class="block text-gray-400 text-sm font-medium mb-1.5">Mesajınız</label>
                <textarea
                  v-model="form.message"
                  rows="5"
                  required
                  maxlength="2000"
                  placeholder="Aracınız hakkında bilgi verin veya sorunuzu yazın..."
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                         text-white placeholder:text-gray-600 text-sm resize-none
                         focus:border-gold/50 focus:bg-white/8
                         transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                :disabled="submitting"
                class="w-full inline-flex items-center justify-center gap-2 font-display font-bold text-sm
                       bg-gradient-to-r from-gold to-gold-light text-black py-4 rounded-xl
                       hover:shadow-gold hover:scale-[1.01] active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span v-if="submitting" class="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <Send v-else :size="16" />
                {{ submitting ? 'Gönderiliyor...' : 'Gönder' }}
              </button>
            </form>
          </template>
        </div>

        <!-- Right: Info + Map -->
        <div class="flex flex-col gap-5" v-scroll-reveal="{ delay: 150 }">
          <!-- Contact cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              v-for="item in contactCards"
              :key="item.title"
              :href="item.href"
              :target="item.external ? '_blank' : undefined"
              class="group flex flex-col items-center text-center p-5 rounded-2xl border border-white/5
                     hover:border-gold/25 transition-all duration-300"
              style="background: rgba(255,255,255,0.02);"
            >
              <div class="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-3
                          group-hover:bg-gold/20 transition-all">
                <component :is="item.icon" :size="16" class="text-gold" />
              </div>
              <p class="text-white text-xs font-bold font-display mb-1">{{ item.title }}</p>
              <p class="text-gray-500 text-xs leading-tight">{{ item.value }}</p>
            </a>
          </div>

          <!-- Map -->
          <div class="flex-1 rounded-2xl overflow-hidden border border-white/5 min-h-[300px]">
            <iframe
              :src="site.contact.mapsEmbed"
              width="100%"
              height="100%"
              style="border: 0; min-height: 300px; filter: invert(90%) hue-rotate(180deg);"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="Harita"
            />
          </div>

          <!-- WhatsApp CTA -->
          <a
            :href="`https://wa.me/${site.contact.whatsapp}`"
            target="_blank"
            class="flex items-center justify-center gap-3 p-5 rounded-2xl border border-green-500/20
                   bg-green-500/5 text-green-400 hover:border-green-500/40 hover:bg-green-500/10
                   transition-all duration-200 font-display font-bold text-sm"
          >
            <MessageCircle :size="18" />
            WhatsApp ile Hızlıca Yazın
          </a>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  MapPin, Phone, Clock, Send, CheckCircle, MessageCircle, AlertCircle,
  ArrowLeft, UserPlus, Car, CalendarCheck, FileText,
} from 'lucide-vue-next'
import FormInput from '@/components/ui/FormInput.vue'
import GaragePhotos from '@/components/home/GaragePhotos.vue'
import { useAuthStore, normalizePhone } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import site from '@/config/site'

const auth     = useAuthStore()
const messages = useMessagesStore()

const perks = [
  { icon: MessageCircle, title: 'Ustayla Kolay İletişim', text: 'Ustana uygulamadan yaz, fotoğraf gönder, yanıtını anında gör.' },
  { icon: Car,           title: 'Aracını Kaydet',         text: 'Araç bilgilerin, muayene ve sigorta tarihlerin hep elinin altında.' },
  { icon: CalendarCheck, title: 'Bakımlarını Takip Et',   text: 'Randevularını ve bir sonraki bakım zamanını düzenli takip et.' },
  { icon: FileText,      title: 'Detaylı Bakım Raporu',   text: 'Yapılan her işlemi ve değişen parçaları raporla gör, PDF indir.' },
]

// false → üyelik ayrıcalıkları, true → üye olmadan mesaj formu
const guestMode  = ref(false)
const form       = reactive({ name: '', phone: '', car: '', message: '' })
const submitting = ref(false)
const sent       = ref(false)
const error      = ref('')

function backToPerks() {
  guestMode.value = false
  sent.value      = false
  error.value     = ''
}

async function handleSubmit() {
  error.value = ''
  sent.value  = false
  // Usta WhatsApp'tan döneceği için numara geçerli olmalı
  if (!/^\+\d{10,15}$/.test(normalizePhone(form.phone))) {
    error.value = 'Geçerli bir telefon numarası girin.'
    return
  }

  submitting.value = true
  try {
    await messages.submitGuestMessage({
      name:    form.name,
      phone:   form.phone,
      car:     form.car,
      content: form.message,
    })
    Object.assign(form, { name: '', phone: '', car: '', message: '' })
    sent.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

const contactCards = [
  {
    icon:     MapPin,
    title:    'Adres',
    value:    site.contact.address,
    href:     site.contact.mapsUrl,
    external: true,
  },
  {
    icon:     Phone,
    title:    'Telefon',
    value:    site.contact.phone,
    href:     `tel:${site.contact.phone}`,
    external: false,
  },
  {
    icon:     Clock,
    title:    'Çalışma',
    value:    site.contact.hours,
    href:     `https://wa.me/${site.contact.whatsapp}`,
    external: true,
  },
]
</script>
