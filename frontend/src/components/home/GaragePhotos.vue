<template>
  <!-- Garaj Fotoğrafları — ana sayfa "Bize Ulaşın" bölümü ve iletişim sayfası -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-sm mx-auto md:max-w-3xl">
    <div class="md:col-span-2 rounded-2xl overflow-hidden group">
      <img :src="garajImg3" alt="Lions Garaj"
           class="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
    </div>
    <div class="flex flex-row md:flex-col gap-3">
      <div class="rounded-2xl overflow-hidden group flex-1">
        <img :src="garajImg1" alt="Lions Garaj"
             class="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
      </div>
      <div class="rounded-2xl overflow-hidden group flex-1">
        <img :src="garajImg2" alt="Lions Garaj"
             class="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700 ease-out" />
      </div>
    </div>
  </div>
</template>

<script setup>
import garajImg1 from '@/assets/lions-garaj.jpg'
import garajImg2 from '@/assets/lions-garaj2.jpg'
import garajImg3 from '@/assets/lions-garaj3.jpg'
</script>
