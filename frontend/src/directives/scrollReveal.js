export const scrollReveal = {
  mounted(el, binding) {
    const opts  = binding.value ?? {}
    const delay = opts.delay     ?? 0
    const dir   = opts.direction ?? 'up'

    const fromY = dir === 'up' ? '30px' : dir === 'down' ? '-30px' : '0'
    const fromX = dir === 'left' ? '30px' : dir === 'right' ? '-30px' : '0'

    el.style.opacity   = '0'
    el.style.transform = `translateY(${fromY}) translateX(${fromX})`
    el.style.transition = `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity   = '1'
          el.style.transform = 'translateY(0) translateX(0)'
          observer.unobserve(el)
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    el._srObserver = observer
  },
  unmounted(el) {
    el._srObserver?.disconnect()
  },
}
