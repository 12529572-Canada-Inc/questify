<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '~/stores/ui'

const uiStore = useUiStore()
const { isDarkMode } = storeToRefs(uiStore)

const backgroundStyle = computed(() => {
  const base = 'rgb(var(--v-theme-background))'
  const primary = 'rgba(var(--v-theme-primary), 0.08)'
  const primarySoft = 'rgba(var(--v-theme-primary), 0.03)'
  const darkStart = 'rgba(var(--v-theme-surface-variant), 0.45)'
  const darkEnd = 'rgba(var(--v-theme-surface), 0.85)'

  return isDarkMode.value
    ? {
        backgroundColor: base,
        backgroundImage: `radial-gradient(circle at 15% 20%, ${darkStart}, transparent 40%), radial-gradient(circle at 85% 30%, ${darkEnd}, transparent 35%)`,
        color: 'rgb(var(--v-theme-on-background))',
      }
    : {
        backgroundColor: base,
        backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${primarySoft} 100%)`,
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
