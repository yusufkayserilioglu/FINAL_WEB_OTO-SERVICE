import { defineStore }  from 'pinia'
import { supabase }     from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useNotificationsStore = defineStore('notifications', () => {

  // ─── Giriş noktası ────────────────────────────────────────────────────────
  async function setup() {
    try {
      const { Capacitor } = await import('@capacitor/core')
      if (Capacitor.isNativePlatform()) {
        await setupNative()
      } else {
        await setupWeb()
      }
    } catch {
      // Capacitor yoksa (test ortamı) web akışını kullan
      await setupWeb()
    }
  }

  // ─── Native (Android / iOS) — Capacitor Push Notifications ───────────────
  async function setupNative() {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const { Capacitor }         = await import('@capacitor/core')

    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') return

    await PushNotifications.register()

    PushNotifications.addListener('registration', async ({ value: token }) => {
      await saveToken(token, Capacitor.getPlatform()) // 'android' | 'ios'
    })

    PushNotifications.addListener('registrationError', err => {
      console.warn('[Push] Native kayıt hatası:', err)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', action => {
      navigateTo(action.notification?.data)
    })
  }

  // ─── Web (Chrome, Safari, Firefox) — Firebase Web SDK ────────────────────
  async function setupWeb() {
    if (!('Notification' in window)) return
    if (!('serviceWorker' in navigator)) return

    // HTTPS veya localhost kontrolü
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return

    try {
      const { messaging, getToken, onMessage, VAPID_KEY } = await import('@/lib/firebase')

      // İzin iste
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      // Service Worker'ı kaydet
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

      // FCM web token al
      const token = await getToken(messaging, {
        vapidKey:            VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (token) {
        await saveToken(token, 'web')
      }

      // Uygulama açıkken gelen mesajları yakala
      onMessage(messaging, payload => {
        const { title, body } = payload.notification || {}
        if (!title) return

        // Tarayıcı native bildirim göster (uygulama ön plandayken)
        new Notification(title, {
          body:    body || '',
          icon:    '/favicon.svg',
          data:    payload.data,
          tag:     payload.data?.type || 'general',
        })
      })

    } catch (e) {
      console.warn('[Push] Web kurulum hatası:', e.message)
    }
  }

  // ─── Ortak yardımcılar ────────────────────────────────────────────────────
  async function saveToken(token, platform) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return
    try {
      await supabase
        .from('push_tokens')
        .upsert(
          { user_id: auth.currentUser.id, token, platform },
          { onConflict: 'user_id,platform' }
        )
    } catch (e) {
      console.warn('[Push] Token kayıt hatası:', e)
    }
  }

  function navigateTo(data) {
    if (!data) return
    const target = data.type === 'message'     ? '/mesajlar'
                 : data.type === 'appointment' ? '/randevular'
                 : null
    if (!target) return
    if (window.__router__) window.__router__.push(target)
    else window.__pendingNavigation__ = target
  }

  // Çıkışta token'ı temizle
  async function removeToken() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return
    try {
      const { Capacitor } = await import('@capacitor/core')
      const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web'
      await supabase.from('push_tokens').delete()
        .eq('user_id', auth.currentUser.id)
        .eq('platform', platform)
    } catch {
      // native yoksa web token'ını sil
      await supabase.from('push_tokens').delete()
        .eq('user_id', useAuthStore().currentUser.id)
        .eq('platform', 'web')
    }
  }

  return { setup, removeToken }
})
