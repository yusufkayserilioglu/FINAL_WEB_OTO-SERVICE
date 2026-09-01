import { createApp }    from 'vue'
import { createPinia }  from 'pinia'
import router           from './router'
import { scrollReveal } from './directives/scrollReveal'
import App              from './App.vue'
import './style.css'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Oturum bilgisi router guard'ından ÖNCE hazır olmalı.
// Router'ı kurmadan önce init'i başlatıyoruz; guard içinde ensureReady() ile beklenir.
import { useAuthStore } from './stores/auth'
useAuthStore().init()

app.use(router)
app.directive('scroll-reveal', scrollReveal)

app.mount('#app')
