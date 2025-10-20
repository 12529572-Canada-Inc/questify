<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  saving: boolean
  error: string | null
  title: string
  details: string
  extraContent: string
  isDirty: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:title' | 'update:details' | 'update:extraContent', value: string): void
  (e: 'close' | 'save'): void
}>()

const dialogOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const titleModel = computed({
  get: () => props.title,
  set: value => emit('update:title', value),
})

const detailsModel = computed({
  get: () => props.details,
  set: value => emit('update:details', value),
})

const extraContentModel = computed({
  get: () => props.extraContent,
  set: value => emit('update:extraContent', value),
})

function handleCancel() {
  emit('update:modelValue', false)
  emit('close')
}

function handleSave() {
  emit('save')
}
</script>

<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="640"
  >
    <v-card>
      <v-card-title class="text-h6">
        Edit Task
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Update the task details or add extra content that helps track progress or results.
        </p>
        <v-text-field
          v-model="titleModel"
          label="Title"
          :disabled="saving"
          autofocus
          required
        />
        <v-textarea
          v-model="detailsModel"
          label="Details"
          :disabled="saving"
          auto-grow
          rows="3"
          hint="Optional. Provide additional guidance or notes for this task."
          persistent-hint
        />
        <v-textarea
          v-model="extraContentModel"
          label="Extra Content"
          :disabled="saving"
          auto-grow
          rows="4"
          hint="Optional. Capture lists, findings, or resources generated while completing this task."
          persistent-hint
        />
        <p
          v-if="error"
          class="task-edit-error mt-4"
        >
          {{ error }}
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="saving"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="saving || !isDirty"
          @click="handleSave"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.task-edit-error {
  color: rgb(var(--v-theme-error));
  font-size: 0.95rem;
}
</style>
