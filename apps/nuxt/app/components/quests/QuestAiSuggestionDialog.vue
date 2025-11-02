<script setup lang="ts">
import { computed } from 'vue'
import type { AiSuggestion } from '~/types/ai'

const props = defineProps<{
  open: boolean
  fieldLabel: string
  suggestions: AiSuggestion[]
  loading: boolean
  error: string | null
  modelLabel: string | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'close' | 'regenerate'): void
  (e: 'select', suggestion: AiSuggestion): void
}>()

const hasSuggestions = computed(() => props.suggestions.length > 0)

function updateOpen(value: boolean) {
  emit('update:open', value)
  if (!value) {
    emit('close')
  }
}

function selectSuggestion(suggestion: AiSuggestion) {
  emit('select', suggestion)
}

function regenerate() {
  emit('regenerate')
}
</script>

<template>
  <v-dialog
    :model-value="open"
    max-width="560"
    @update:model-value="updateOpen"
  >
    <v-card class="quest-ai-dialog">
      <v-card-title class="quest-ai-dialog__title">
        ✨ AI suggestions for {{ fieldLabel }}
      </v-card-title>
      <v-card-subtitle
        v-if="modelLabel"
        class="quest-ai-dialog__subtitle"
      >
        Generated with {{ modelLabel }}
      </v-card-subtitle>
      <v-card-text class="quest-ai-dialog__content">
        <div
          v-if="loading"
          class="quest-ai-dialog__loading d-flex flex-column align-center justify-center text-medium-emphasis"
        >
          <v-progress-circular
            color="primary"
            size="32"
            width="3"
            indeterminate
            class="mb-3"
          />
          <span>Asking the AI assistant&hellip;</span>
        </div>

        <v-alert
          v-else-if="error"
          type="warning"
          variant="tonal"
          border="start"
          class="quest-ai-dialog__alert mb-4"
        >
          <div class="mb-2">
            {{ error }}
          </div>
          <v-btn
            color="primary"
            variant="text"
            density="comfortable"
            :disabled="loading"
            @click="regenerate"
          >
            Try again
          </v-btn>
        </v-alert>

        <div
          v-else-if="hasSuggestions"
          class="quest-ai-dialog__list"
        >
          <v-slide-y-transition group>
            <v-card
              v-for="(suggestion, index) in suggestions"
              :key="suggestion.text + index"
              class="quest-ai-dialog__suggestion pa-4 mb-3"
              variant="tonal"
            >
              <div class="quest-ai-dialog__suggestion-text">
                {{ suggestion.text }}
              </div>
              <div
                v-if="suggestion.rationale"
                class="quest-ai-dialog__suggestion-meta text-body-2 text-medium-emphasis mt-2"
              >
                {{ suggestion.rationale }}
              </div>
              <div class="quest-ai-dialog__suggestion-actions mt-3">
                <v-btn
                  color="primary"
                  variant="flat"
                  size="small"
                  @click="selectSuggestion(suggestion)"
                >
                  Use suggestion
                </v-btn>
              </div>
            </v-card>
          </v-slide-y-transition>
        </div>

        <div
          v-else
          class="quest-ai-dialog__empty text-medium-emphasis"
        >
          <v-icon
            icon="mdi-sparkle"
            size="36"
            class="mb-2"
          />
          <p class="text-body-2 mb-1">
            No suggestions yet.
          </p>
          <p class="text-body-2">
            Adjust the quest details and try again.
          </p>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="quest-ai-dialog__actions">
        <v-btn
          variant="text"
          color="primary"
          :disabled="loading"
          @click="regenerate"
        >
          Regenerate
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          color="primary"
          @click="updateOpen(false)"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.quest-ai-dialog__title {
  font-weight: 600;
}

.quest-ai-dialog__subtitle {
  margin-bottom: 8px;
}

.quest-ai-dialog__content {
  min-height: 180px;
}

.quest-ai-dialog__loading {
  min-height: 160px;
}

.quest-ai-dialog__alert {
  white-space: pre-line;
}

.quest-ai-dialog__list {
  display: flex;
  flex-direction: column;
}

.quest-ai-dialog__suggestion {
  border-radius: 12px;
}

.quest-ai-dialog__suggestion-text {
  font-weight: 500;
}

.quest-ai-dialog__suggestion-actions {
  display: flex;
  justify-content: flex-end;
}

.quest-ai-dialog__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  text-align: center;
}

.quest-ai-dialog__actions {
  padding: 12px 20px;
}
</style>
