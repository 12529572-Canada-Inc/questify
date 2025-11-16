<script setup lang="ts">
import { useQuestForm } from '~/composables/useQuestForm'
import { useQuestAiAssist } from '~/composables/useQuestAiAssist'

const props = withDefaults(defineProps<{
  showBackButton?: boolean
  makePublic?: boolean
}>(), {
  showBackButton: true,
  makePublic: false,
})

const {
  title,
  goal,
  context,
  constraints,
  modelType,
  modelOptions,
  showOptionalFields,
  valid,
  loading,
  error,
  rules,
  isSubmitDisabled,
  submit,
  toggleOptionalFields,
} = useQuestForm({
  initialIsPublic: props.makePublic,
})

const {
  isEnabled: aiAssistEnabled,
  dialogOpen: aiDialogOpen,
  activeFieldLabel: aiActiveFieldLabel,
  suggestions: aiSuggestions,
  loading: aiLoading,
  error: aiError,
  modelLabel: aiModelLabel,
  requestAssistance: requestAiAssistance,
  regenerateSuggestions: regenerateAiSuggestions,
  applySuggestion: applyAiSuggestion,
  closeDialog: closeAiDialog,
} = useQuestAiAssist({
  fields: {
    title,
    goal,
    context,
    constraints,
  },
  modelType,
  modelOptions,
})
</script>

<template>
  <v-form
    v-model="valid"
    @submit.prevent="submit"
  >
    <v-text-field
      v-model="title"
      label="Title"
      :rules="rules.title"
      required
    />
    <div
      v-if="aiAssistEnabled"
      class="quest-form__ai-action mb-2"
    >
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-sparkle"
        @click="requestAiAssistance('title')"
      >
        Improve with AI
      </v-btn>
    </div>

    <ModelSelectField
      v-model="modelType"
      :models="modelOptions"
      class="mb-4"
    />

    <v-btn
      v-if="!showOptionalFields"
      type="button"
      variant="text"
      color="primary"
      class="mt-2"
      @click="toggleOptionalFields"
    >
      Add optional details
    </v-btn>

    <v-expand-transition>
      <div v-if="showOptionalFields">
        <v-textarea
          v-model="goal"
          label="What outcome are you aiming for?"
          hint="Share the specific result you want this quest to achieve."
          persistent-hint
          auto-grow
          rows="3"
          class="mb-4"
        />
        <div
          v-if="aiAssistEnabled"
          class="quest-form__ai-action mb-4"
        >
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-sparkle"
            @click="requestAiAssistance('goal')"
          >
            Improve with AI
          </v-btn>
        </div>

        <v-textarea
          v-model="context"
          label="Relevant background or context"
          hint="Include any details, prior work, or information that will help the AI understand the situation."
          persistent-hint
          auto-grow
          rows="3"
          class="mb-4"
        />
        <div
          v-if="aiAssistEnabled"
          class="quest-form__ai-action mb-4"
        >
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-sparkle"
            @click="requestAiAssistance('context')"
          >
            Improve with AI
          </v-btn>
        </div>

        <v-textarea
          v-model="constraints"
          label="Constraints or preferences"
          hint="List deadlines, available resources, tone, or other requirements to respect."
          persistent-hint
          auto-grow
          rows="3"
          class="mb-4"
        />
        <div
          v-if="aiAssistEnabled"
          class="quest-form__ai-action mb-4"
        >
          <v-btn
            variant="text"
            size="small"
            prepend-icon="mdi-sparkle"
            @click="requestAiAssistance('constraints')"
          >
            Improve with AI
          </v-btn>
        </div>

        <v-btn
          type="button"
          variant="text"
          color="secondary"
          class="mb-2"
          @click="toggleOptionalFields"
        >
          Hide optional details
        </v-btn>
      </div>
    </v-expand-transition>

    <v-row
      class="mt-4"
      justify="center"
      align="center"
    >
      <v-col
        cols="12"
        sm="6"
      >
        <v-btn
          type="submit"
          color="primary"
          block
          :loading="loading"
          :disabled="isSubmitDisabled"
        >
          Create Quest
        </v-btn>
      </v-col>
    </v-row>

    <v-row
      v-if="props.showBackButton"
      class="mt-2"
      justify="center"
      align="center"
    >
      <v-col
        cols="12"
        sm="6"
      >
        <v-btn
          color="secondary"
          block
          :to="`/quests`"
        >
          Back to Quests
        </v-btn>
      </v-col>
    </v-row>

    <p
      v-if="error"
      class="quest-form__error mt-4"
    >
      {{ error }}
    </p>

    <QuestAiSuggestionDialog
      v-if="aiAssistEnabled"
      v-model:open="aiDialogOpen"
      :field-label="aiActiveFieldLabel"
      :suggestions="aiSuggestions"
      :loading="aiLoading"
      :error="aiError"
      :model-label="aiModelLabel"
      @select="applyAiSuggestion"
      @regenerate="regenerateAiSuggestions"
      @close="closeAiDialog"
    />
  </v-form>
</template>

<style scoped>
.quest-form__error {
  font-size: 0.95rem;
  color: rgb(var(--v-theme-error));
}

.quest-form__ai-action {
  display: flex;
  justify-content: flex-end;
}
</style>
