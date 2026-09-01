import { createApp }    from 'vue'
import { createPinia }  from 'pinia'
import router           from './router'
import { scrollReveal } from './directives/scrollReveal'
import App              from './App.vue'
import './style.css'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.directive('scroll-reveal', scrollReveal)

import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
auth.init().finally(() => app.mount('#app'))
