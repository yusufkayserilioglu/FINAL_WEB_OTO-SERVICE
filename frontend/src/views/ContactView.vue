<template>
  <main class="min-h-screen bg-void pt-36">
    <!-- Header -->
    <div class="container-custom text-center mb-16">
      <p class="text-gold text-xs font-mono tracking-[0.3em] uppercase mb-3" v-scroll-reveal>İletişim</p>
      <h1 class="font-display font-black text-5xl md:text-6xl text-white mb-4" v-scroll-reveal="{ delay: 100 }">
        Bize Ulaşın
      </h1>
      <p class="text-gray-500 max-w-lg mx-auto" v-scroll-reveal="{ delay: 200 }">
        Soru, randevu veya fiyat teklifi için bize yazın ya da arayın.
      </p>
    </div>

    <!-- Main content -->
    <div class="container-custom pb-24">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <!-- Left: Form -->
        <div
          class="rounded-2xl border border-white/5 p-8 md:p-10"
          style="background: rgba(255,255,255,0.02);"
          v-scroll-reveal
        >
          <h2 class="font-display font-bold text-2xl text-white mb-7">Mesaj Gönderin</h2>

          <!-- Success -->
          <div
            v-if="sent"
            class="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 mb-6"
          >
            <CheckCircle :size="18" />
            <span class="text-sm">Mesajınız alındı! En kısa sürede dönüş yapacağız.</span>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-0">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput v-model="form.name"    label="Ad Soyad"       placeholder="Ahmet Yılmaz" required />
              <FormInput v-model="form.phone"   label="Telefon"        type="tel" placeholder="+90 5xx xxx xxxx" />
            </div>
            <FormInput   v-model="form.email"   label="E-posta"        type="email" placeholder="ornek@mail.com" />
            <FormInput   v-model="form.car"     label="Araç Bilgisi"   placeholder="BMW 3 Serisi 2022" />
            <div class="mb-4">
              <label class="block text-gray-400 text-sm font-medium mb-1.5">Mesajınız</label>
              <textarea
                v-model="form.message"
                rows="5"
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
import { MapPin, Phone, Clock, Send, CheckCircle, MessageCircle } from 'lucide-vue-next'
import FormInput from '@/components/ui/FormInput.vue'
import site from '@/config/site'

const form = reactive({ name: '', phone: '', email: '', car: '', message: '' })
const submitting = ref(false)
const sent       = ref(false)

async function handleSubmit() {
  submitting.value = true
  await new Promise(r => setTimeout(r, 800))
  console.log('Contact form:', { ...form })
  Object.assign(form, { name: '', phone: '', email: '', car: '', message: '' })
  submitting.value = false
  sent.value = true
  setTimeout(() => { sent.value = false }, 5000)
}

const contactCards = [
  {
    icon:     MapPin,
    title:    'Adres',
    value:    site.contact.address,
    href:     `https://maps.google.com?q=${encodeURIComponent(site.contact.address)}`,
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
