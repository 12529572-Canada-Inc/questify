<script setup lang="ts">
import { computed } from 'vue'
import type { AiModelOption } from 'shared/ai-models'

const props = withDefaults(defineProps<{
  modelValue: boolean
  prompt: string
  modelType: string
  submitting: boolean
  error: string | null
  models: AiModelOption[]
  images?: string[]
}>(), {
  images: () => [],
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:prompt' | 'update:modelType', value: string): void
  (e: 'update:images', value: string[]): void
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

const modelTypeModel = computed({
  get: () => props.modelType,
  set: value => emit('update:modelType', value),
})

const imagesModel = computed({
  get: () => props.images,
  set: value => emit('update:images', value),
})

const hasContext = computed(() =>
  promptModel.value.trim().length > 0 || imagesModel.value.length > 0,
)

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
        <ModelSelectField
          v-model="modelTypeModel"
          :models="props.models"
          :disabled="submitting"
        />
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
        <ImageAttachmentInput
          v-model="imagesModel"
          label="Add investigation images"
          hint="Upload or take photos that could help with the analysis."
          :max-images="3"
          class="mt-2"
          :disabled="submitting"
        />
        <p
          v-if="error"
          class="investigation-error"
        >
          {{ error }}
        </p>
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
          :disabled="error !== null || !hasContext || submitting"
          @click="handleSubmit"
        >
          Investigate
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.investigation-error {
  color: rgb(var(--v-theme-error));
  font-size: 0.95rem;
}
</style>
