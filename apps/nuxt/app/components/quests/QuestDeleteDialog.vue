<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  questTitle: string
  archiveLoading?: boolean
  deleteLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  questTitle: 'this quest',
  archiveLoading: false,
  deleteLoading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'archive'): void
  (e: 'delete'): void
  (e: 'cancel'): void
}>()

const dialogModel = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const isBusy = computed(() => props.archiveLoading || props.deleteLoading)

function handleCancel() {
  emit('cancel')
  dialogModel.value = false
}

function handleArchive() {
  emit('archive')
}

function handleDelete() {
  emit('delete')
}
</script>

<template>
  <v-dialog
    v-model="dialogModel"
    max-width="520"
  >
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        Delete or Archive Quest
      </v-card-title>
      <v-card-text class="d-flex flex-column gap-3">
        <p class="mb-0">
          Are you sure you want to delete
          <strong>{{ questTitle }}</strong>?
          This action cannot be undone.
        </p>
        <p class="mb-0">
          Deleting removes the quest and its tasks permanently.
          Archiving hides it from your dashboard while keeping the data for analytics.
        </p>
      </v-card-text>
      <v-card-actions class="flex-wrap gap-2">
        <v-btn
          color="error"
          :loading="deleteLoading"
          :disabled="isBusy"
          variant="flat"
          prepend-icon="mdi-trash-can-outline"
          @click="handleDelete"
        >
          Delete Permanently
        </v-btn>
        <v-btn
          color="secondary"
          :loading="archiveLoading"
          :disabled="isBusy"
          variant="outlined"
          prepend-icon="mdi-archive-outline"
          @click="handleArchive"
        >
          Archive Instead
        </v-btn>
        <v-spacer />
        <v-btn
          color="default"
          :disabled="isBusy"
          variant="text"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
