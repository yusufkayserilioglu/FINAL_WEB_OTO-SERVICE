<template>
  <span ref="el">{{ displayed }}{{ suffix }}</span>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  target:   { type: Number, required: true },
  suffix:   { type: String, default: '' },
  duration: { type: Number, default: 2000 },
})

const el        = ref(null)
const displayed = ref(0)
let   observer  = null
let   started   = false

function startCount() {
  if (started) return
  started = true
  const steps    = 60
  const interval = props.duration / steps
  const step     = props.target / steps
  let   current  = 0
  const timer = setInterval(() => {
    current += step
    const isDecimal = props.target % 1 !== 0
    if (current >= props.target) {
      displayed.value = props.target
      clearInterval(timer)
    } else {
      displayed.value = isDecimal ? Math.round(current * 10) / 10 : Math.floor(current)
    }
  }, interval)
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) startCount() },
    { threshold: 0.5 }
  )
  if (el.value) observer.observe(el.value)
})

onUnmounted(() => observer?.disconnect())
</script>
