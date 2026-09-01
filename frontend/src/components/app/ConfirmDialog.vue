<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="overlay" @click.self="$emit('cancel')">
        <Transition name="sheet" appear>
          <div class="sheet" role="dialog" aria-modal="true">
            <div class="handle"></div>
            <h3 class="title">{{ title }}</h3>
            <p v-if="message" class="message">{{ message }}</p>
            <div class="actions">
              <button class="btn btn-ghost" @click="$emit('cancel')">{{ cancelLabel }}</button>
              <button class="btn danger" @click="$emit('confirm')">{{ confirmLabel }}</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  open:         { type: Boolean, default: false },
  title:        { type: String, required: true },
  message:      { type: String, default: '' },
  confirmLabel: { type: String, default: 'Sil' },
  cancelLabel:  { type: String, default: 'Vazgeç' },
})
defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 640px) {
  .overlay { align-items: center; }
}

.sheet {
  width: 100%;
  max-width: 420px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 18px 18px 0 0;
  padding: 12px 20px calc(20px + var(--safe-bottom));
}

@media (min-width: 640px) {
  .sheet { border-radius: 16px; padding-bottom: 20px; margin: 0 16px; }
}

.handle {
  width: 38px;
  height: 4px;
  border-radius: 2px;
  background: var(--steel-600, #414750);
  margin: 0 auto 16px;
}

@media (min-width: 640px) { .handle { display: none; } }

.title {
  font-family: 'Archivo', sans-serif;
  font-weight: 800;
  font-size: 17px;
  color: #fff;
  margin-bottom: 6px;
}

.message {
  font-size: 13.5px;
  color: #9aa1ab;
  line-height: 1.55;
  margin-bottom: 18px;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.danger {
  background: #dc2626;
  color: #fff;
  border-color: transparent;
}
</style>
