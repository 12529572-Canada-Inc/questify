<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  isPublic: boolean
  questId: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isPublic', value: boolean): void
}>()

const showConfirmDialog = ref(false)
const pendingValue = ref(false)
const loading = ref(false)

const visibilityIcon = computed(() => props.isPublic ? 'mdi-earth' : 'mdi-lock')
const visibilityLabel = computed(() => props.isPublic ? 'Public' : 'Private')
const visibilityColor = computed(() => props.isPublic ? 'success' : 'default')

function handleToggle() {
  const newValue = !props.isPublic

  // If changing from public to private, show confirmation dialog
  if (props.isPublic && !newValue) {
    pendingValue.value = newValue
    showConfirmDialog.value = true
  }
  else {
    // Changing from private to public, no confirmation needed
    updateVisibility(newValue)
  }
}

async function updateVisibility(newValue: boolean) {
  loading.value = true
  try {
    await $fetch(`/api/quests/${props.questId}`, {
      method: 'PATCH',
      body: { isPublic: newValue },
    })
    emit('update:isPublic', newValue)
  }
  catch (error) {
    console.error('Failed to update quest visibility:', error)
    // TODO: Show error snackbar
  }
  finally {
    loading.value = false
  }
}

function confirmChange() {
  showConfirmDialog.value = false
  updateVisibility(pendingValue.value)
}

function cancelChange() {
  showConfirmDialog.value = false
  pendingValue.value = props.isPublic
}
</script>

<template>
  <div class="quest-visibility-toggle">
    <v-chip
      :prepend-icon="visibilityIcon"
      :color="visibilityColor"
      :disabled="disabled || loading"
      :loading="loading"
      variant="tonal"
      size="small"
      class="visibility-chip"
      @click="handleToggle"
    >
      {{ visibilityLabel }}
    </v-chip>

    <v-dialog
      v-model="showConfirmDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title class="d-flex align-center gap-2">
          <v-icon
            icon="mdi-alert-circle"
            color="warning"
          />
          Confirm Privacy Change
        </v-card-title>
        <v-card-text>
          <p class="mb-2">
            You are about to make this quest private.
          </p>
          <p class="mb-0 text-medium-emphasis">
            <strong>Warning:</strong> Public URLs will no longer be accessible and any shared links will stop working.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="cancelChange"
          >
            Cancel
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            @click="confirmChange"
          >
            Make Private
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.visibility-chip {
  cursor: pointer;
  user-select: none;
}

.visibility-chip:not(:disabled):hover {
  opacity: 0.8;
}
</style>
