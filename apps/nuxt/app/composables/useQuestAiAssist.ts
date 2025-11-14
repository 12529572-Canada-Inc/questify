import { computed, reactive, watch, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { AiModelOption } from 'shared/ai-models'
import { useSnackbar } from './useSnackbar'
import { resolveApiError } from '~/utils/error'
import { useUiStore } from '~/stores/ui'
import type { AiAssistField, AiSuggestion } from '~/types/ai'

type AssistPayload = {
  field: AiAssistField
  title: string
  goal: string
  context: string
  constraints: string
  currentValue: string
  modelType: string | null
}

type QuestAiAssistResponse = {
  success: boolean
  field: AiAssistField
  modelId?: string | null
  suggestions: AiSuggestion[]
}

const FIELD_LABELS: Record<AiAssistField, string> = {
  title: 'Title',
  goal: 'Goal',
  context: 'Context',
  constraints: 'Constraints',
}

function toPayloadValue(value: string) {
  return value?.trim() ?? ''
}

/**
 * Manages the AI assistance dialog: builds prompts, calls the backend, and exposes
 * the resulting suggestions plus helpers to apply, retry, or reset state.
 *
 * @param options.fields - Reactive quest form fields (title, goal, context, constraints).
 * @param options.modelType - Currently selected model id for the quest.
 * @param options.modelOptions - Available AI models (resolved via `useAiModels`).
 */
export function useQuestAiAssist(options: {
  fields: Record<AiAssistField, Ref<string>>
  modelType: Ref<string>
  modelOptions: ComputedRef<AiModelOption[]>
}) {
  const { fields, modelType, modelOptions } = options
  const uiStore = useUiStore()
  const { aiAssistEnabled } = storeToRefs(uiStore)
  const { showSnackbar } = useSnackbar()

  const state = reactive({
    dialogOpen: false,
    activeField: null as AiAssistField | null,
    loading: false,
    error: null as string | null,
    suggestions: [] as AiSuggestion[],
    lastModelId: null as string | null,
  })

  const isEnabled = aiAssistEnabled

  const activeFieldLabel = computed(() => (state.activeField ? FIELD_LABELS[state.activeField] : ''))

  const activeModel = computed(() => {
    const id = state.lastModelId ?? modelType.value
    return modelOptions.value.find(model => model.id === id) ?? null
  })

  function buildPayload(field: AiAssistField): AssistPayload {
    return {
      field,
      title: toPayloadValue(fields.title.value),
      goal: toPayloadValue(fields.goal.value),
      context: toPayloadValue(fields.context.value),
      constraints: toPayloadValue(fields.constraints.value),
      currentValue: toPayloadValue(fields[field].value),
      modelType: modelType.value || null,
    }
  }

  async function executeRequest(payload: AssistPayload) {
    state.loading = true
    state.error = null
    state.suggestions = []
    state.lastModelId = null

    try {
      const response = await $fetch<QuestAiAssistResponse>('/api/quests/assist', {
        method: 'POST',
        body: payload,
      })

      state.lastModelId = response.modelId ?? null
      state.suggestions = Array.isArray(response.suggestions) ? response.suggestions : []

      if (!state.suggestions.length) {
        state.error = 'No suggestions were generated. Try refining the quest details and try again.'
      }
    }
    catch (error) {
      const message = resolveApiError(error, 'Unable to reach the AI assistant right now.')
      state.error = message
      showSnackbar(message, { variant: 'error' })
    }
    finally {
      state.loading = false
    }
  }

  async function requestAssistance(field: AiAssistField) {
    if (!isEnabled.value || state.loading) {
      return
    }

    state.activeField = field
    state.dialogOpen = true
    await executeRequest(buildPayload(field))
  }

  async function regenerateSuggestions() {
    if (!isEnabled.value || state.loading || !state.activeField) {
      return
    }

    state.dialogOpen = true
    await executeRequest(buildPayload(state.activeField))
  }

  function applySuggestion(suggestion: AiSuggestion) {
    if (!state.activeField) {
      return
    }
    const text = suggestion.text?.trim()
    if (!text) {
      return
    }

    const fieldKey = state.activeField
    fields[fieldKey].value = text
    state.dialogOpen = false
    state.activeField = null
    showSnackbar(`${FIELD_LABELS[fieldKey]} updated with AI suggestion.`, { variant: 'success' })
  }

  function closeDialog() {
    state.dialogOpen = false
    state.activeField = null
  }

  watch(isEnabled, (enabled) => {
    if (!enabled) {
      state.dialogOpen = false
      state.activeField = null
    }
  })

  return {
    isEnabled,
    dialogOpen: computed({
      get: () => state.dialogOpen,
      set: (value: boolean) => {
        state.dialogOpen = value
      },
    }),
    activeField: computed(() => state.activeField),
    activeFieldLabel,
    suggestions: computed(() => state.suggestions),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    modelLabel: computed(() => activeModel.value?.label ?? null),
    requestAssistance,
    regenerateSuggestions,
    applySuggestion,
    closeDialog,
  }
}
