<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '~/stores/ui'

const uiStore = useUiStore()
const { isDarkMode } = storeToRefs(uiStore)

const backgroundStyle = computed(() => ({
  backgroundColor: 'rgb(var(--v-theme-background))',
  backgroundImage: 'none',
  color: isDarkMode.value ? 'rgb(var(--v-theme-on-background))' : undefined,
}))
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
