<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '~/stores/ui'

const uiStore = useUiStore()

const backgroundStyle = computed(() => {
  const base = 'rgb(var(--v-theme-background))'
  const accent = 'rgba(var(--v-theme-primary), 0.10)'
  const accentSoft = 'rgba(var(--v-theme-primary), 0.06)'

  return {
    background: uiStore.isDarkMode
      ? `radial-gradient(circle at 20% 20%, ${accent}, transparent 45%), radial-gradient(circle at 80% 30%, ${accentSoft}, transparent 40%), ${base}`
      : `linear-gradient(135deg, ${accent} 0%, ${accentSoft} 100%), ${base}`,
  }
})
</script>

<template>
  <v-app>
    <GlobalSnackbar />
    <div
      class="app-background d-flex flex-column fill-height"
      :style="backgroundStyle"
    >
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </v-app>
</template>

<style scoped>
.app-background {
  min-height: 100vh;
}

.v-card {
  backdrop-filter: blur(8px);
  background-color: rgba(var(--v-theme-surface), 0.92);
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
}
</style>
