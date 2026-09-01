<template>
  <section class="brands-section">
    <div class="container-custom">
      <div class="text-center mb-14" v-scroll-reveal>
        <p class="text-gold text-xs font-mono tracking-[0.3em] uppercase mb-3">Uzman Olduğumuz Markalar</p>
        <h2 class="font-display font-black text-4xl md:text-5xl text-white">
          Aracınıza Uzman Dokunuş
        </h2>
        <p class="text-gray-500 mt-4 max-w-xl mx-auto">
          Premium markalarda derin uzmanlık, her araca özenli ilgi.
          Tüm işlemlerde orijinal veya isteğe göre orijinalle aynı kalitede yedek parça kullanıyoruz.
        </p>
      </div>
    </div>

    <!-- Infinite scroll carousel -->
    <div class="carousel-wrapper">
      <!-- Fade kenarları -->
      <div class="fade-left"></div>
      <div class="fade-right"></div>

      <div class="carousel-track">
        <div
          v-for="(brand, i) in [...featuredBrands, ...featuredBrands]"
          :key="`${brand.id}-${i}`"
          class="brand-card"
        >

          <div class="car-img-wrap">
            <img
              :src="brand.carImage"
              :alt="brand.name"
              class="car-img"
              draggable="false"
            />
          </div>

          <div class="brand-meta">
            <img
              :src="brand.logo"
              :alt="brand.name + ' logo'"
              class="brand-logo"
              @error="(e) => e.target.style.display = 'none'"
            />
            <span class="brand-name">{{ brand.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="container-custom">
      <p class="text-center text-gray-600 text-sm mt-10" v-scroll-reveal="{ delay: 200 }">
        Yukarıdaki markalar dışında tüm araç markalarına da bakım ve tamir hizmeti sunuyoruz.
      </p>
    </div>
  </section>
</template>

<script setup>
import { brands } from '@/data/brands'

import carBmw        from '@/assets/car-bmw.png'
import carAudi       from '@/assets/car-auidi.png'
import carMercedes   from '@/assets/car-mercedes.png'
import carPorsche    from '@/assets/car-porsche.png'
import carRangerover from '@/assets/car-rangerover.png'
import carVolkswagen from '@/assets/car-volswagen.png'
import carToyota     from '@/assets/car-toyota.png'
import carHonda      from '@/assets/car-honda.png'
import carFord       from '@/assets/car-ford.png'
import carRenault    from '@/assets/car-renault.png'
import carFiat       from '@/assets/car-fiat.png'
import carMinicooper from '@/assets/car-minicooper.png'

const carImages = {
  bmw:        carBmw,
  audi:       carAudi,
  mercedes:   carMercedes,
  porsche:    carPorsche,
  rangerover: carRangerover,
  volkswagen: carVolkswagen,
  toyota:     carToyota,
  honda:      carHonda,
  ford:       carFord,
  renault:    carRenault,
  fiat:       carFiat,
  minicooper: carMinicooper,
}

const featuredBrands = brands
  .filter(b => carImages[b.id])
  .map(b => ({ ...b, carImage: carImages[b.id] }))
</script>

<style scoped>
.brands-section {
  padding: 5rem 0;
  background: #0d0d0d;
  overflow: hidden;
}

/* ── Carousel wrapper ─────────────────────── */
.carousel-wrapper {
  position: relative;
  overflow: hidden;
  padding: 1rem 0;
}

.fade-left,
.fade-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 120px;
  z-index: 10;
  pointer-events: none;
}
.fade-left  { left: 0;  background: linear-gradient(to right, #0d0d0d 10%, transparent); }
.fade-right { right: 0; background: linear-gradient(to left,  #0d0d0d 10%, transparent); }

/* ── Scrolling track ──────────────────────── */
.carousel-track {
  display: flex;
  gap: 1.25rem;
  width: max-content;
  animation: drive 28s linear infinite;
  will-change: transform;
}

.carousel-track:hover {
  animation-play-state: paused;
}

@keyframes drive {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* ── Brand card ───────────────────────────── */
.brand-card {
  position: relative;
  width: 260px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1.25rem;
  padding: 1.5rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  cursor: default;
  transition: border-color 0.4s, background 0.4s;
  overflow: hidden;
}

.brand-card:hover {
  border-color: rgba(201, 168, 76, 0.35);
  background: rgba(201, 168, 76, 0.03);
}

/* Glow on hover */
.brand-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 50% 80%, rgba(201,168,76,0.08), transparent 70%);
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}
.brand-card:hover::after { opacity: 1; }

/* ── Badge ────────────────────────────────── */
.badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  font-family: monospace;
  background: rgba(201, 168, 76, 0.12);
  color: #c9a84c;
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 999px;
  padding: 2px 8px;
}

/* ── Car image ────────────────────────────── */
.car-img-wrap {
  width: 100%;
  height: 130px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.car-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom center;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.6));
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  user-select: none;
}

.brand-card:hover .car-img {
  transform: scale(1.06) translateY(-6px);
}

/* ── Brand meta (logo + name) ─────────────── */
.brand-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.75rem;
}

.brand-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: grayscale(1) opacity(0.45);
  transition: filter 0.4s;
}

.brand-card:hover .brand-logo {
  filter: grayscale(0) opacity(1);
}

.brand-name {
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  transition: color 0.4s;
}

.brand-card:hover .brand-name {
  color: #e5e7eb;
}

/* ── Mobile ───────────────────────────────── */
@media (max-width: 640px) {
  .brand-card {
    width: 200px;
    padding: 1.25rem 1rem 1rem;
  }

  .car-img-wrap {
    height: 105px;
  }

  .fade-left,
  .fade-right {
    width: 60px;
  }
}
</style>
