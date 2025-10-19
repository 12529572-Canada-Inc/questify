<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  prompt: string
  submitting: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:prompt', value: string): void
  (e: 'cancel' | 'submit'): void
}>()

const dialogOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const promptModel = computed({
  get: () => props.prompt,
  set: value => emit('update:prompt', value),
})

function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function handleSubmit() {
  emit('submit')
}
</script>

<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="560"
  >
    <v-card>
      <v-card-title class="text-h6">
        Investigate Task
      </v-card-title>
      <v-card-text class="d-flex flex-column gap-4">
        <div>
          <p class="text-body-2 mb-2">
            Provide additional context or questions for the Quest Agent to research.
          </p>
          <v-textarea
            v-model="promptModel"
            label="Investigation context"
            :disabled="submitting"
            :error="error !== null"
            auto-grow
            rows="4"
            maxlength="1000"
            counter
            hint="This will help generate insights or suggestions related to the task."
            persistent-hint
          />
        </div>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          :text="error"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="submitting"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="submitting"
          :disabled="error !== null || prompt.trim().length === 0"
          @click="handleSubmit"
        >
          Investigate
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
