import { ref } from 'vue'
import { useAppointmentsStore } from '@/stores/appointments'

/**
 * Randevu onaylama akışı.
 * Onaylamadan önce aynı gün + aynı saatte başka randevu var mı diye bakar;
 * varsa admine "yine de onaylıyor musunuz?" diye sorar.
 *
 * @param {Function} [onConfirmed] onay sonrası çağrılır (liste tazeleme vb.)
 */
export function useAppointmentConfirm(onConfirmed) {
  const appointments = useAppointmentsStore()

  const pending  = ref(null)   // { appt, conflicts } — dialog açıkken dolu
  const checking = ref(false)  // çakışma sorgulanıyor
  const saving   = ref(false)  // onay yazılıyor
  const error    = ref('')

  async function requestConfirm(appt) {
    if (!appt?.id || checking.value || saving.value) return
    error.value = ''
    checking.value = true
    try {
      const conflicts = await appointments.fetchSlotConflicts(appt)
      if (conflicts.length) {
        pending.value = { appt, conflicts }   // karar admine bırakılır
      } else {
        await apply(appt)
      }
    } catch (e) {
      error.value = e.message || 'Randevu kontrol edilemedi'
    } finally {
      checking.value = false
    }
  }

  // Dialogdaki "Yine de Onayla"
  async function proceed() {
    if (!pending.value) return
    const { appt } = pending.value
    saving.value = true
    try {
      await apply(appt)
      pending.value = null
    } catch (e) {
      error.value = e.message || 'Randevu onaylanamadı'
    } finally {
      saving.value = false
    }
  }

  function dismiss() {
    pending.value = null
  }

  async function apply(appt) {
    await appointments.updateStatus(appt.id, 'confirmed')
    if (onConfirmed) await onConfirmed(appt)
  }

  return { pending, checking, saving, error, requestConfirm, proceed, dismiss }
}
