import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ── Genel (public) sayfalar ─────────────────────────────────────────────
  { path: '/',          name: 'home',     component: () => import('@/views/HomeView.vue') },
  { path: '/hizmetler', name: 'services', component: () => import('@/views/ServicesView.vue') },
  { path: '/iletisim',  name: 'contact',  component: () => import('@/views/ContactView.vue') },
  { path: '/giris',     name: 'login',    component: () => import('@/views/LoginView.vue') },
  { path: '/kayit',     name: 'register', component: () => import('@/views/RegisterView.vue') },
  { path: '/fiyatlar',  name: 'pricing',  component: () => import('@/views/PricingView.vue') },

  // ── Kullanıcı paneli (yalnızca müşteriler) ──────────────────────────────
  {
    path:      '/panel',
    component: () => import('@/components/layout/PanelLayout.vue'),
    redirect:  '/dashboard',
    meta:      { requiresAuth: true, role: 'user', panel: true },
    children: [
      { path: '/dashboard',  name: 'dashboard',    component: () => import('@/views/DashboardView.vue') },
      { path: '/profil',     name: 'profile',      component: () => import('@/views/ProfileView.vue') },
      { path: '/randevular', name: 'appointments', component: () => import('@/views/AppointmentsView.vue') },
      { path: '/mesajlar',   name: 'messages',     component: () => import('@/views/MessagesView.vue') },
      { path: '/bakim',      name: 'maintenance',  component: () => import('@/views/MaintenanceView.vue') },
      { path: '/bakim/:recordId', name: 'maintenance-report', component: () => import('@/views/MaintenanceReportView.vue') },
    ],
  },

  // ── Admin paneli (yalnızca yöneticiler) ─────────────────────────────────
  {
    path:      '/admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    meta:      { requiresAuth: true, role: 'admin', panel: true },
    children: [
      { path: '',              name: 'admin-home',            component: () => import('@/views/admin/AdminHomeView.vue') },
      { path: 'randevular',    name: 'admin-appointments',    component: () => import('@/views/admin/AdminAppointmentsView.vue') },
      { path: 'mesajlar',      name: 'admin-messages',        component: () => import('@/views/admin/AdminMessagesView.vue') },
      { path: 'musteriler',    name: 'admin-customers',       component: () => import('@/views/admin/AdminCustomersView.vue') },
      { path: 'musteri/:id',   name: 'admin-customer-detail', component: () => import('@/views/admin/AdminCustomerDetailView.vue') },
      { path: 'bakim/:recordId', name: 'admin-maintenance-report', component: () => import('@/views/admin/AdminMaintenanceReportView.vue') },
      { path: 'fiyatlar',      name: 'admin-pricing',         component: () => import('@/views/admin/AdminPricingView.vue') },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition)  return savedPosition
    if (to.hash)        return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

// Rota başka bir role ait panelde mi? (yönetici → müşteri paneli, müşteri → yönetim paneli)
export function isWrongPanel(route, auth) {
  return !!route.meta.role && route.meta.role !== auth.role
}

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  // ÖNEMLİ: oturum localStorage'dan okunana kadar bekle.
  // Bu olmadan sayfa yenilendiğinde kullanıcı giriş ekranına atılıyordu.
  await auth.ensureReady()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Her panel yalnızca kendi rolüne açık; yanlış paneldeki kişi kendi paneline gider
  if (isWrongPanel(to, auth)) {
    return next(auth.panelPath)
  }

  // Giriş yapmış kullanıcı giriş/kayıt sayfasına gitmeye çalışırsa panele al
  if ((to.name === 'login' || to.name === 'register') && auth.isLoggedIn && auth.hasProfile) {
    return next(auth.panelPath)
  }

  next()
})

export default router
