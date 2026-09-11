<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="pending" class="overlay" @click.self="$emit('cancel')">
        <div class="sheet" role="dialog" aria-modal="true">
          <div class="head">
            <AlertTriangle :size="20" class="warn-icon" />
            <div>
              <h3 class="title">Bu saatte başka randevu var</h3>
              <p class="subtitle">
                {{ formatFullDate(pending.appt.date) }} · {{ shortTime(pending.appt.time) }}
              </p>
            </div>
          </div>

          <p class="lead">
            Onaylamak üzere olduğunuz randevu ile aynı saatte
            <strong>{{ pending.conflicts.length }} randevu</strong> daha var:
          </p>

          <ul class="conflicts">
            <li v-for="c in pending.conflicts" :key="c.id" class="conflict">
              <span class="c-time">{{ shortTime(c.slot_time) }}</span>
              <div class="c-body">
                <p class="c-name">{{ c.customer_name || 'Müşteri' }}</p>
                <p class="c-meta">{{ c.service_type }}</p>
                <p v-if="c.car_label" class="c-meta">{{ c.car_label }}</p>
              </div>
              <span class="c-status" :class="c.status">{{ STATUS_LABELS[c.status] || c.status }}</span>
            </li>
          </ul>

          <div class="target">
            <p class="t-label">Onaylanacak randevu</p>
            <p class="t-name">{{ pending.appt.profiles?.name || 'Müşteri' }}</p>
            <p class="t-meta">{{ pending.appt.service_type }}</p>
          </div>

          <p class="question">Yine de onaylıyor musunuz?</p>

          <div class="actions">
            <button class="btn ghost" :disabled="saving" @click="$emit('cancel')">Vazgeç</button>
            <button class="btn primary" :disabled="saving" @click="$emit('confirm')">
              {{ saving ? 'Onaylanıyor...' : 'Yine de Onayla' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { AlertTriangle } from 'lucide-vue-next'
import { shortTime, formatFullDate, STATUS_LABELS } from '@/utils/schedule'

defineProps({
  // { appt, conflicts } — null iken dialog kapalıdır
  pending: { type: Object, default: null },
  saving:  { type: Boolean, default: false },
})

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 130;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.sheet {
  width: 100%;
  max-width: 440px;
  max-height: 88vh;
  overflow-y: auto;
  background: #131313;
  border: 1px solid rgba(234, 179, 8, 0.25);
  border-radius: 16px;
  padding: 20px;
}

.head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.warn-icon {
  color: #eab308;
  flex-shrink: 0;
  margin-top: 2px;
}

.title {
  font-family: 'Montserrat', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
}

.subtitle {
  font-size: 12px;
  color: #888;
  margin: 2px 0 0;
}

.lead {
  font-size: 13px;
  color: #aaa;
  line-height: 1.6;
  margin: 0 0 12px;
}

.lead strong { color: #eab308; }

.conflicts {
  list-style: none;
  padding: 0;
  margin: 0 0 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conflict {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 10px;
}

.c-time {
  font-family: 'Montserrat', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #c9a84c;
  flex-shrink: 0;
}

.c-body { flex: 1; min-width: 0; }

.c-name {
  font-size: 13px;
  font-weight: 600;
  color: #e5e5e5;
  margin: 0;
}

.c-meta {
  font-size: 11.5px;
  color: #888;
  margin: 1px 0 0;
}

.c-status {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
.c-status.pending   { background: rgba(234, 179, 8, 0.18);  color: #eab308; }
.c-status.confirmed { background: rgba(34, 197, 94, 0.18);  color: #22c55e; }
.c-status.completed { background: rgba(59, 130, 246, 0.18); color: #60a5fa; }

.target {
  background: rgba(201, 168, 76, 0.07);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.t-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #c9a84c;
  margin: 0 0 4px;
}

.t-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #e5e5e5;
  margin: 0;
}

.t-meta {
  font-size: 11.5px;
  color: #888;
  margin: 1px 0 0;
}

.question {
  font-size: 13.5px;
  color: #e5e5e5;
  font-weight: 600;
  text-align: center;
  margin: 0 0 14px;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn {
  padding: 11px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:disabled { opacity: 0.55; cursor: not-allowed; }

.ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #aaa;
}

.primary {
  background: linear-gradient(135deg, #c9a84c, #e0bc6e);
  border: 1px solid transparent;
  color: #080808;
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
