<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSupportStore } from '~/stores/support'

const supportStore = useSupportStore()
const { dialogOpen, activeTab } = storeToRefs(supportStore)

const fabLabel = computed(() => dialogOpen.value ? 'Close help assistant' : 'Open help assistant')

function toggleAssistant() {
  if (dialogOpen.value) {
    supportStore.closeDialog()
  }
  else {
    supportStore.openDialog('chat')
  }
}
</script>

<template>
  <div class="support-assistant">
    <v-tooltip
      text="Need help?"
      location="top"
    >
      <template #activator="{ props: tooltipProps }">
        <v-btn
          class="support-assistant__fab"
          color="primary"
          elevation="8"
          icon
          :aria-pressed="dialogOpen"
          :aria-label="fabLabel"
          v-bind="tooltipProps"
          @click="toggleAssistant"
        >
          <v-icon
            icon="mdi-lifebuoy"
            size="28"
          />
        </v-btn>
      </template>
    </v-tooltip>

    <SupportAssistantDialog
      v-model="dialogOpen"
      :active-tab="activeTab"
      @update:active-tab="supportStore.setActiveTab"
    />
  </div>
</template>

<style scoped>
.support-assistant {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1100;
}

.support-assistant__fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

@media (max-width: 640px) {
  .support-assistant {
    bottom: 16px;
    right: 16px;
  }

  .support-assistant__fab {
    width: 52px;
    height: 52px;
  }
}
</style>
