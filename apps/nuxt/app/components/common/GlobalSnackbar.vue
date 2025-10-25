<script setup lang="ts">
import { computed } from 'vue'
import { useSnackbar } from '~/composables/useSnackbar'

const { current, visible, setVisible, dismissCurrent } = useSnackbar()

const isOpen = computed({
  get: () => visible.value,
  set: (value: boolean) => setVisible(value),
})

const activeSnackbar = computed(() => current.value)
</script>

<template>
  <v-slide-y-transition>
    <v-snackbar
      v-if="activeSnackbar"
      v-model="isOpen"
      :timeout="activeSnackbar.timeout"
      :color="activeSnackbar.color"
      :multi-line="activeSnackbar.multiLine"
      variant="elevated"
      location="top right"
      class="global-snackbar"
    >
      <div class="snackbar-content">
        <v-icon
          v-if="activeSnackbar.icon"
          :icon="activeSnackbar.icon"
          size="22"
          class="me-2"
        />
        <span class="snackbar-message">
          {{ activeSnackbar.message }}
        </span>
      </div>

      <template #actions>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="dismissCurrent"
        />
      </template>
    </v-snackbar>
  </v-slide-y-transition>
</template>

<style scoped>
.global-snackbar {
  max-width: min(440px, 92vw);
}

.snackbar-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.snackbar-message {
  line-height: 1.35;
}
</style>
